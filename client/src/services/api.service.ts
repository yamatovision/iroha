import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import tokenService from './auth/token.service';
import networkMonitorService from './network/network-monitor.service';
import { IStorageService } from './storage/storage.interface';
import { StorageKeys } from './storage/storage.interface';

// トレースIDを生成する関数
const generateTraceId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// モバイルアプリかどうかを判定
const isNativeApp = (): boolean => {
  return import.meta.env.VITE_APP_MODE === 'production';
};

// キャッシュ用のインターフェース
interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  url: string;
  params?: any;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;
  private isDebugMode = true; // 環境変数で制御可能
  // 認証トークンのリフレッシュ処理中フラグ
  private isRefreshingToken = false;
  // トークンリフレッシュ中のリクエストを保持するキュー
  private tokenRefreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];
  // キャッシュ用ストレージ (遅延初期化)
  private cacheStorage: IStorageService | null = null;
  // 最大キャッシュ期間 (デフォルト: 15分)
  private readonly DEFAULT_CACHE_TTL = 15 * 60 * 1000;
  // オフラインモード検出用
  private isOfflineMode = false;

  constructor() {
    // 環境に応じてベースURLを設定
    // 本番環境では環境変数のAPI URLを使用し、開発環境ではViteプロキシを活用
    let initialBaseURL = import.meta.env.PROD 
      ? import.meta.env.VITE_API_URL 
      : ''; // 開発環境では空文字列（プロキシ使用）
    
    // モバイルアプリでHTTPSを強制
    if (isNativeApp() && initialBaseURL && initialBaseURL.startsWith('http:')) {
      console.warn('⚠️ モバイルアプリではHTTPSが必要です。URLをHTTPSに変換します');
      initialBaseURL = initialBaseURL.replace('http:', 'https:');
    }
    
    // 本番環境で '/api/v1' パスの重複を防ぐための処理
    // APIパスの定数に既に '/api/v1' が含まれているため、環境変数側から除去
    if (initialBaseURL.includes('/api/v1')) {
      console.warn('⚠️ Removing duplicate /api/v1 from baseURL to prevent path duplication');
      this.baseURL = initialBaseURL.replace('/api/v1', '');
    } else {
      this.baseURL = initialBaseURL;
    }
    
    console.log(`🌐 API baseURL: ${this.baseURL || '(using proxy)'}`);
    console.log(`🔒 HTTPSモード: ${isNativeApp() ? '有効 (ネイティブアプリ)' : '無効 (開発モード)'}`);

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 45000, // 45秒に延長（特に調和コンパス生成など、AIが関わる処理用）
    });

    // ネットワーク状態の監視を開始
    this.initNetworkMonitoring();

    this.api.interceptors.request.use(
      async (config) => {
        // トレースIDを生成し、ヘッダーに追加（サーバー側との紐付け用）
        const traceId = generateTraceId();
        config.headers['X-Trace-ID'] = traceId;
        
        // 直接リフレッシュリクエストの場合、リフレッシュ処理をスキップ
        if (config.headers['X-Direct-Refresh']) {
          if (this.isDebugMode) {
            console.log('🔄 直接リフレッシュリクエスト - 追加処理をスキップします');
          }
          this.logRequest(config, traceId);
          return config;
        }
        
        // JWTトークンを設定
        let accessToken = await tokenService.getAccessToken();
        
        if (accessToken) {
          // JWT更新エンドポイントへのリクエストの場合は更新チェックをスキップ
          const isTokenRefreshRequest = config.url?.includes('/jwt-auth/refresh-token');
          
          if (!isTokenRefreshRequest) {
            // トークンの有効期限が近い場合は更新
            const remainingTime = await tokenService.getRemainingTime();
            if (remainingTime !== null && remainingTime < 5 * 60 * 1000) {
              try {
                // リフレッシュトークンがあるか確認
                const refreshToken = await tokenService.getRefreshToken();
                if (refreshToken) {
                  // 直接リフレッシュリクエストを行う（APIサービスインスタンスを使用しない）
                  const axios = (await import('axios')).default;
                  const baseURL = import.meta.env.PROD 
                    ? import.meta.env.VITE_API_URL 
                    : '';
                  
                  // Ensure proper URL construction
                  const refreshUrl = baseURL 
                    ? `${baseURL}/api/v1/jwt-auth/refresh-token` // Production: explicit full path
                    : '/api/v1/jwt-auth/refresh-token'; // Development: relative path
                  
                  console.log('Using refresh token URL (early check):', refreshUrl);
                  
                  const response = await axios({
                    method: 'post',
                    url: refreshUrl,
                    data: { refreshToken },
                    headers: {
                      'Content-Type': 'application/json',
                      'X-Direct-Refresh': 'true'
                    }
                  });
                  
                  if (response.status === 200 && response.data.tokens) {
                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.tokens;
                    await tokenService.setTokens(newAccessToken, newRefreshToken);
                    accessToken = newAccessToken;
                  }
                }
              } catch (refreshError) {
                console.error('トークン更新エラー:', refreshError);
              }
            }
          }
          
          // リクエストヘッダーにトークンを設定
          config.headers['Authorization'] = `Bearer ${accessToken}`;
          
          if (this.isDebugMode) {
            console.log('🔐 JWT Authorization トークンをセットしました');
          }
        } else if (this.isDebugMode) {
          console.warn('⚠️ アクセストークンがありません、認証されないリクエストになります');
        }
        
        this.logRequest(config, traceId);
        return config;
      },
      (error) => {
        this.logError(error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        // レスポンスヘッダーからトレースIDを取得（サーバー側で設定されたもの）
        const requestTraceId = response.config.headers?.['X-Trace-ID'] as string;
        const responseTraceId = response.headers?.['x-trace-id'] || requestTraceId;
        
        this.logResponse(response, responseTraceId);
        return response;
      },
      async (error: AxiosError) => {
        // エラーレスポンスからトレースIDを取得
        const requestTraceId = error.config?.headers?.['X-Trace-ID'] as string;
        const responseTraceId = error.response?.headers?.['x-trace-id'] || requestTraceId;
        
        this.logError(error, responseTraceId);
        
        // エラーにトレースIDを追加（エラーハンドリング用）
        const enhancedError = error as any;
        enhancedError.traceId = responseTraceId;
        
        if (error.response) {
          const status = error.response.status;
          
          // JWT認証の場合のトークン期限切れ対応
          const refreshToken = await tokenService.getRefreshToken();
          if (status === 401 && 
              refreshToken && 
              error.config) {
            
            // リクエスト設定の存在確認と再試行フラグ確認
            const config = error.config;
            if (!config.headers?._retry) {
              // リフレッシュトークンの不一致エラーを特定
              const isTokenMismatch = 
                error.response?.data && (
                  (error.response.data as any)?.message === 'リフレッシュトークンが一致しません' ||
                  (error.response.data as any)?.message === 'トークンバージョンが一致しません'
                );
              
              // リフレッシュトークンの不一致の場合は再試行せずに早期リターン
              if (isTokenMismatch && 
                  config.url?.includes('/jwt-auth/refresh-token')) {
                console.warn('⚠️ リフレッシュトークン不一致エラー: 再認証が必要です');
                
                // リフレッシュトークンをクリアして次回ログイン時に再取得させる
                tokenService.clearTokens();
                
                // リフレッシュトークン不一致の場合はキューもクリア
                this.tokenRefreshQueue.forEach(({ reject }) => {
                  reject(new Error('リフレッシュトークンが一致しません - 再認証が必要です'));
                });
                this.tokenRefreshQueue = [];
                this.isRefreshingToken = false;
                
                return Promise.reject(enhancedError);
              }
              
              // トークンのリフレッシュを試みる
              try {
                // 同時複数リクエストの場合はリフレッシュ処理を一回にまとめる
                let newToken: string | null = null;
                
                if (!this.isRefreshingToken) {
                  this.isRefreshingToken = true;
                  
                  try {
                    // リフレッシュトークンがあるか確認
                    const innerRefreshToken = await tokenService.getRefreshToken();
                    if (innerRefreshToken) {
                      // 直接リフレッシュリクエストを行う（APIサービスインスタンスを使用しない）
                      const axios = (await import('axios')).default;
                      let baseURL = import.meta.env.PROD 
                        ? import.meta.env.VITE_API_URL 
                        : '';
                      
                      // モバイルアプリでHTTPSを強制
                      if (isNativeApp() && baseURL && baseURL.startsWith('http:')) {
                        baseURL = baseURL.replace('http:', 'https:');
                      }
                      
                      // Ensure proper URL construction
                      const refreshUrl = baseURL 
                        ? `${baseURL}/api/v1/jwt-auth/refresh-token` // Production: explicit full path
                        : '/api/v1/jwt-auth/refresh-token'; // Development: relative path
                      
                      console.log('Using refresh token URL:', refreshUrl);
                      
                      const response = await axios({
                        method: 'post',
                        url: refreshUrl,
                        data: { refreshToken },
                        headers: {
                          'Content-Type': 'application/json',
                          'X-Direct-Refresh': 'true'
                        }
                      });
                      
                      if (response.status === 200 && response.data.tokens) {
                        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.tokens;
                        tokenService.setTokens(newAccessToken, newRefreshToken);
                        newToken = newAccessToken;
                        
                        // キューにたまっているリクエストを処理
                        this.tokenRefreshQueue.forEach(({ resolve }) => {
                          if (newToken) resolve(newToken);
                        });
                        this.tokenRefreshQueue = [];
                      } else {
                        // リフレッシュに失敗したらエラーを伝播
                        this.tokenRefreshQueue.forEach(({ reject }) => {
                          reject(new Error('トークンのリフレッシュに失敗しました'));
                        });
                        this.tokenRefreshQueue = [];
                      }
                    }
                  } finally {
                    this.isRefreshingToken = false;
                  }
                } else {
                  // 既にリフレッシュ処理が進行中の場合は結果を待つ
                  newToken = await new Promise<string>((resolve, reject) => {
                    this.tokenRefreshQueue.push({ resolve, reject });
                  });
                }
                
                // 新しいトークンでリクエストを再試行
                if (newToken) {
                  // リクエスト設定を更新
                  config.headers = config.headers || {};
                  config.headers.Authorization = `Bearer ${newToken}`;
                  config.headers._retry = true; // リトライフラグを設定
                  
                  console.log('トークン更新成功、リクエストを再試行します');
                  // 更新した設定で再リクエスト
                  return this.api(config);
                }
              } catch (retryError) {
                console.error('トークンリフレッシュに失敗しました', retryError);
              }
            }
          } else if (status === 403) {
            console.error(`権限エラー: 必要な権限がありません [TraceID: ${responseTraceId}]`);
          } else if (status >= 500) {
            console.error(`サーバーエラー [TraceID: ${responseTraceId}]:`, error.response.data);
          }
        } else if (error.request) {
          console.error(`ネットワークエラー: サーバーから応答がありません [TraceID: ${responseTraceId}]`);
          console.error('サーバーは起動していますか？CORSの設定は正しいですか？');
          
          // ネットワークエラーの場合、オフラインモードを確認
          if (error.config?.method?.toLowerCase() === 'get') {
            const config = error.config;
            const url = config.url || '';
            const params = config.params || {};
            
            // オフラインモードでGETリクエストの場合、キャッシュから読み込み試行
            try {
              if (this.isOfflineMode) {
                console.log(`オフラインモード: キャッシュから ${url} を取得しようとしています`);
                const cachedData = await this.getCachedResponse(url, params);
                
                if (cachedData) {
                  console.log(`📦 キャッシュからデータを取得しました: ${url}`);
                  
                  // Axiosレスポンス形式でキャッシュデータを返す
                  return {
                    data: cachedData.data,
                    status: 200,
                    statusText: 'OK (from cache)',
                    headers: { 'x-from-cache': 'true' },
                    config: error.config,
                    request: error.request,
                  } as AxiosResponse;
                }
              }
            } catch (cacheError) {
              console.error('キャッシュ取得エラー:', cacheError);
            }
          }
        } else {
          console.error(`リクエスト設定エラー [TraceID: ${responseTraceId}]:`, error.message);
        }
        
        return Promise.reject(enhancedError);
      }
    );
  }

  /**
   * ネットワーク監視の初期化
   */
  private async initNetworkMonitoring(): Promise<void> {
    try {
      // 初期ネットワーク状態を確認
      const isConnected = await networkMonitorService.isConnected();
      this.isOfflineMode = !isConnected;
      
      // ネットワーク状態変化のリスナー登録
      networkMonitorService.addListener((connected) => {
        const previousState = this.isOfflineMode;
        this.isOfflineMode = !connected;
        
        // オンラインに復帰した場合の処理
        if (previousState === true && connected) {
          console.log('🔄 ネットワーク接続を検出: オンラインモードに切り替えます');
          this.handleNetworkRecovery();
        } else if (previousState === false && !connected) {
          console.log('📴 ネットワーク切断を検出: オフラインモードに切り替えます');
        }
      });
      
      console.log(`🌐 ネットワーク監視を初期化しました - 初期状態: ${isConnected ? 'オンライン' : 'オフライン'}`);
    } catch (error) {
      console.error('ネットワーク監視の初期化に失敗しました:', error);
    }
  }

  /**
   * ネットワーク復旧時の処理
   */
  private async handleNetworkRecovery(): Promise<void> {
    // キャッシュの検証などの復旧処理を実装予定
    console.log('ネットワークが復旧しました。キャッシュの検証を行います。');
    
    // 将来的には、キャッシュの検証や再同期を行う処理を実装
  }

  /**
   * キャッシュストレージの初期化
   */
  private async initCacheStorage(): Promise<void> {
    if (this.cacheStorage !== null) return;
    
    try {
      // ストレージファクトリからキャッシュ用ストレージを取得
      const { default: storageFactory } = await import('./storage/storage-factory');
      this.cacheStorage = storageFactory;
      console.log('📦 キャッシュストレージを初期化しました');
    } catch (error) {
      console.error('キャッシュストレージの初期化に失敗しました:', error);
      throw error;
    }
  }

  /**
   * レスポンスをキャッシュに保存
   * @param url リクエストURL
   * @param params リクエストパラメータ
   * @param data レスポンスデータ
   * @param ttl キャッシュの有効期間（ミリ秒）
   */
  private async cacheResponse<T>(url: string, params: any, data: T, ttl: number = this.DEFAULT_CACHE_TTL): Promise<void> {
    try {
      await this.initCacheStorage();
      
      if (!this.cacheStorage) {
        console.error('キャッシュストレージが初期化されていません');
        return;
      }
      
      const timestamp = Date.now();
      const expiresAt = timestamp + ttl;
      const cacheKey = this.generateCacheKey(url, params);
      
      const cacheItem: CacheItem<T> = {
        data,
        timestamp,
        expiresAt,
        url,
        params
      };
      
      // キャッシュアイテムの保存
      await this.cacheStorage.setObject(`cache_${cacheKey}`, cacheItem);
      
      // キャッシュキー一覧の更新
      const cacheKeys = await this.getCacheKeys();
      if (!cacheKeys.includes(cacheKey)) {
        cacheKeys.push(cacheKey);
        await this.cacheStorage.setObject(StorageKeys.FORTUNE_CACHE, cacheKeys);
      }
      
      console.log(`📦 レスポンスをキャッシュに保存しました: ${url}`);
    } catch (error) {
      console.error('キャッシュ保存エラー:', error);
    }
  }

  /**
   * キャッシュからレスポンスを取得
   * @param url リクエストURL
   * @param params リクエストパラメータ
   * @returns キャッシュされたデータ（存在しない場合はnull）
   */
  private async getCachedResponse<T = any>(url: string, params: any): Promise<CacheItem<T> | null> {
    try {
      await this.initCacheStorage();
      
      if (!this.cacheStorage) {
        console.error('キャッシュストレージが初期化されていません');
        return null;
      }
      
      const cacheKey = this.generateCacheKey(url, params);
      const cacheItem = await this.cacheStorage.getObject<CacheItem<T>>(`cache_${cacheKey}`);
      
      if (!cacheItem) {
        return null;
      }
      
      // 有効期限チェック
      const now = Date.now();
      if (cacheItem.expiresAt < now) {
        console.log(`⏱️ キャッシュが期限切れです: ${url}`);
        return null;
      }
      
      return cacheItem;
    } catch (error) {
      console.error('キャッシュ取得エラー:', error);
      return null;
    }
  }

  /**
   * キャッシュをクリア
   * @param url 特定のURLのキャッシュをクリアする場合はURLを指定
   * @param params 特定のパラメータのキャッシュをクリアする場合はパラメータを指定
   */
  public async clearCache(url?: string, params?: any): Promise<void> {
    try {
      await this.initCacheStorage();
      
      if (!this.cacheStorage) {
        console.error('キャッシュストレージが初期化されていません');
        return;
      }
      
      // 特定URLのキャッシュをクリア
      if (url) {
        const cacheKey = this.generateCacheKey(url, params || {});
        await this.cacheStorage.remove(`cache_${cacheKey}`);
        
        // キャッシュキー一覧から削除
        const cacheKeys = await this.getCacheKeys();
        const updatedKeys = cacheKeys.filter(key => key !== cacheKey);
        await this.cacheStorage.setObject(StorageKeys.FORTUNE_CACHE, updatedKeys);
        
        console.log(`🗑️ キャッシュをクリアしました: ${url}`);
        return;
      }
      
      // すべてのキャッシュをクリア
      const cacheKeys = await this.getCacheKeys();
      
      // 各キャッシュアイテムを削除
      for (const key of cacheKeys) {
        await this.cacheStorage.remove(`cache_${key}`);
      }
      
      // キャッシュキー一覧をリセット
      await this.cacheStorage.setObject(StorageKeys.FORTUNE_CACHE, []);
      
      console.log('🗑️ すべてのキャッシュをクリアしました');
    } catch (error) {
      console.error('キャッシュクリアエラー:', error);
    }
  }

  /**
   * 期限切れのキャッシュを削除
   */
  public async cleanExpiredCache(): Promise<void> {
    try {
      await this.initCacheStorage();
      
      if (!this.cacheStorage) {
        console.error('キャッシュストレージが初期化されていません');
        return;
      }
      
      const now = Date.now();
      const cacheKeys = await this.getCacheKeys();
      const validKeys: string[] = [];
      
      // 各キャッシュアイテムの有効期限をチェック
      for (const key of cacheKeys) {
        const cacheItem = await this.cacheStorage.getObject<CacheItem>(`cache_${key}`);
        
        if (cacheItem && cacheItem.expiresAt >= now) {
          // 有効期限内のアイテムはリストに追加
          validKeys.push(key);
        } else {
          // 期限切れのアイテムは削除
          await this.cacheStorage.remove(`cache_${key}`);
        }
      }
      
      // 有効なキーのみを保存
      await this.cacheStorage.setObject(StorageKeys.FORTUNE_CACHE, validKeys);
      
      console.log(`🧹 期限切れのキャッシュをクリアしました (${cacheKeys.length - validKeys.length} 件)`);
    } catch (error) {
      console.error('期限切れキャッシュクリアエラー:', error);
    }
  }

  /**
   * キャッシュキー一覧を取得
   */
  private async getCacheKeys(): Promise<string[]> {
    try {
      await this.initCacheStorage();
      
      if (!this.cacheStorage) {
        return [];
      }
      
      const keys = await this.cacheStorage.getObject<string[]>(StorageKeys.FORTUNE_CACHE);
      return keys || [];
    } catch (error) {
      console.error('キャッシュキー取得エラー:', error);
      return [];
    }
  }

  /**
   * キャッシュキーを生成
   * @param url URL
   * @param params リクエストパラメータ
   * @returns キャッシュキー
   */
  private generateCacheKey(url: string, params: any): string {
    // URLからベースパスを除去
    const path = url.replace(this.baseURL, '');
    
    // パラメータを安定したJSON文字列に変換
    const paramsStr = params ? JSON.stringify(this.sortObjectKeys(params)) : '';
    
    // URLとパラメータをハッシュ化
    return this.hashString(`${path}|${paramsStr}`);
  }

  /**
   * オブジェクトのキーをソートして新しいオブジェクトを返す
   * @param obj 元のオブジェクト
   * @returns キーがソートされたオブジェクト
   */
  private sortObjectKeys(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    // 配列の場合は各要素を再帰的に処理
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }
    
    // オブジェクトのキーをソート
    const sortedKeys = Object.keys(obj).sort();
    const result: any = {};
    
    for (const key of sortedKeys) {
      result[key] = this.sortObjectKeys(obj[key]);
    }
    
    return result;
  }

  /**
   * 文字列をハッシュ化
   * @param str ハッシュ化する文字列
   * @returns ハッシュ値
   */
  private hashString(str: string): string {
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32ビット整数に変換
    }
    
    return hash.toString(36);
  }

  private logRequest(config: AxiosRequestConfig, traceId: string) {
    if (!this.isDebugMode) return;
    
    const method = config.method?.toUpperCase() || 'GET';
    const url = typeof config.url === 'string' ? config.url : 'unknown';
    
    // 実際のリクエストURLをより詳細に表示（デバッグ用）
    const fullUrl = url.startsWith('http') 
      ? url 
      : window.location.origin + (url.startsWith('/') ? url : '/' + url);
    
    console.group(`🌐 API Request: ${method} ${url} [TraceID: ${traceId}]`);
    console.log('Full URL:', fullUrl);
    console.log('Headers:', config.headers);
    console.log('Params:', config.params);
    console.log('Data:', config.data);
    console.groupEnd();
    
    // 開発者ツール用に特別なメッセージ
    console.log('%c🔍 NETWORK DEBUG: 以下のリクエストをネットワークタブで追跡してください', 'color: blue; font-weight: bold');
    console.log(`${method} ${fullUrl}`);
    console.table({
      'TraceID': traceId,
      'Actual URL': fullUrl,
      'Path with Proxy': url.startsWith('/api') ? '✅ Will use proxy' : '⚠️ May not use proxy',
      'Header Authorization': config.headers?.['Authorization'] ? 'Bearer ...[token]' : 'None',
      'Content-Type': config.headers?.['Content-Type'],
      'Request Body': config.data ? JSON.stringify(config.data).substring(0, 100) + '...' : 'None'
    });
  }

  private logResponse(response: AxiosResponse, traceId?: string) {
    if (!this.isDebugMode) return;
    
    const method = response.config.method?.toUpperCase() || 'GET';
    const url = typeof response.config.url === 'string' ? response.config.url : 'unknown';
    
    console.group(`✅ API Response: ${response.status} ${method} ${url} ${traceId ? `[TraceID: ${traceId}]` : ''}`);
    console.log('Data:', response.data);
    console.log('Headers:', response.headers);
    console.log('Status:', response.status);
    console.groupEnd();
  }

  private logError(error: any, traceId?: string) {
    const traceInfo = traceId ? `[TraceID: ${traceId}]` : '';
    
    console.group(`❌ API Error: ${error.config?.method?.toUpperCase() || 'UNKNOWN'} ${error.config?.url || 'unknown'} ${traceInfo}`);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      console.log('Request made but no response received');
      console.log(error.request);
      console.log('CORS問題や、サーバー接続の問題が考えられます');
    } else {
      console.log('Error:', error.message);
    }
    console.log('Config:', error.config);
    console.groupEnd();
  }

  /**
   * GETリクエストの送信（キャッシュ機能付き）
   * @param url リクエストURL
   * @param config リクエスト設定
   * @param cacheOptions キャッシュオプション
   * @returns レスポンスのPromise
   */
  public async get<T = any>(
    url: string, 
    config?: AxiosRequestConfig, 
    cacheOptions?: { 
      ttl?: number; // キャッシュの有効期間（ミリ秒）
      skipCache?: boolean; // キャッシュをスキップするフラグ
      forceRefresh?: boolean; // 強制的にサーバーから取得するフラグ
    }
  ): Promise<AxiosResponse<T>> {
    const params = config?.params || {};
    const ttl = cacheOptions?.ttl || this.DEFAULT_CACHE_TTL;
    const skipCache = cacheOptions?.skipCache || false;
    const forceRefresh = cacheOptions?.forceRefresh || false;
    
    // キャッシュをスキップする場合は通常のリクエスト
    if (skipCache) {
      return this.api.get<T>(url, config);
    }
    
    try {
      // 強制リフレッシュでない場合、キャッシュから取得を試みる
      if (!forceRefresh) {
        const cachedResponse = await this.getCachedResponse<T>(url, params);
        
        if (cachedResponse) {
          const age = Date.now() - cachedResponse.timestamp;
          const fromCache = { 'x-from-cache': 'true', 'x-cache-age': `${age}` };
          
          console.log(`📦 キャッシュからデータを取得しました: ${url} (${Math.round(age / 1000)}秒前)`);
          
          // キャッシュデータをAxiosレスポンス形式で返す
          return {
            data: cachedResponse.data,
            status: 200,
            statusText: 'OK (from cache)',
            headers: fromCache,
            config: config || {},
            request: {},
          } as AxiosResponse<T>;
        }
      }
      
      // オフラインモードでキャッシュがない場合はエラー
      if (this.isOfflineMode) {
        throw new Error(`オフラインモードでキャッシュが見つかりません: ${url}`);
      }
      
      // サーバーからデータを取得
      const response = await this.api.get<T>(url, config);
      
      // レスポンスをキャッシュに保存
      await this.cacheResponse<T>(url, params, response.data, ttl);
      
      return response;
    } catch (error) {
      // オフラインモードでのエラーハンドリング
      if (this.isOfflineMode) {
        const cachedResponse = await this.getCachedResponse<T>(url, params);
        
        if (cachedResponse) {
          console.log(`📦 オフラインモード: 期限切れキャッシュを使用します: ${url}`);
          
          // 期限切れでもキャッシュデータを返す
          return {
            data: cachedResponse.data,
            status: 200,
            statusText: 'OK (from expired cache)',
            headers: { 'x-from-cache': 'true', 'x-cache-expired': 'true' },
            config: config || {},
            request: {},
          } as AxiosResponse<T>;
        }
      }
      
      // キャッシュも見つからない場合はエラーを伝播
      throw error;
    }
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.api.post<T>(url, data, config);
      
      // POSTが成功した場合、関連するキャッシュを無効化
      // 例: ユーザープロファイル更新後、そのユーザーのキャッシュをクリア
      if (url.includes('/users/') || url.includes('/profile')) {
        // ユーザー関連のキャッシュをクリア
        await this.clearCache('/api/v1/users/me');
      } else if (url.includes('/teams/')) {
        // チーム関連のキャッシュをクリア
        const teamId = url.match(/\/teams\/([^\/]+)/)?.[1];
        if (teamId) {
          await this.clearCache(`/api/v1/teams/${teamId}`);
        }
      }
      
      return response;
    } catch (error) {
      // オフラインモードで操作をキューイングする機能を将来的に追加可能
      throw error;
    }
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.api.put<T>(url, data, config);
      
      // PUTが成功した場合、関連するキャッシュを無効化
      if (url.includes('/users/') || url.includes('/profile')) {
        await this.clearCache('/api/v1/users/me');
      } else if (url.includes('/teams/')) {
        const teamId = url.match(/\/teams\/([^\/]+)/)?.[1];
        if (teamId) {
          await this.clearCache(`/api/v1/teams/${teamId}`);
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.api.delete<T>(url, config);
      
      // DELETEが成功した場合、関連するキャッシュを無効化
      if (url.includes('/teams/')) {
        await this.clearCache('/api/v1/teams');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.api.patch<T>(url, data, config);
      
      // PATCHが成功した場合、関連するキャッシュを無効化
      if (url.includes('/users/') || url.includes('/profile')) {
        await this.clearCache('/api/v1/users/me');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 現在のネットワーク状態を取得
   * @returns オフラインモードかどうか
   */
  public isOffline(): boolean {
    return this.isOfflineMode;
  }
}

export default new ApiService();