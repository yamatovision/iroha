import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import tokenService from './auth/token.service';

// トレースIDを生成する関数
const generateTraceId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

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

  constructor() {
    // 環境に応じてベースURLを設定
    // 本番環境では環境変数のAPI URLを使用し、開発環境ではViteプロキシを活用
    let initialBaseURL = import.meta.env.PROD 
      ? import.meta.env.VITE_API_URL 
      : ''; // 開発環境では空文字列（プロキシ使用）
    
    // 本番環境で '/api/v1' パスの重複を防ぐための処理
    // APIパスの定数に既に '/api/v1' が含まれているため、環境変数側から除去
    if (initialBaseURL.includes('/api/v1')) {
      console.warn('⚠️ Removing duplicate /api/v1 from baseURL to prevent path duplication');
      this.baseURL = initialBaseURL.replace('/api/v1', '');
    } else {
      this.baseURL = initialBaseURL;
    }
    
    console.log(`🌐 API baseURL: ${this.baseURL || '(using proxy)'}`);

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 45000, // 45秒に延長（特に調和コンパス生成など、AIが関わる処理用）
    });

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
        let accessToken = tokenService.getAccessToken();
        
        if (accessToken) {
          // JWT更新エンドポイントへのリクエストの場合は更新チェックをスキップ
          const isTokenRefreshRequest = config.url?.includes('/jwt-auth/refresh-token');
          
          if (!isTokenRefreshRequest) {
            // トークンの有効期限が近い場合は更新
            const remainingTime = tokenService.getRemainingTime();
            if (remainingTime !== null && remainingTime < 5 * 60 * 1000) {
              try {
                // リフレッシュトークンがあるか確認
                const refreshToken = tokenService.getRefreshToken();
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
                    tokenService.setTokens(newAccessToken, newRefreshToken);
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
          if (status === 401 && 
              tokenService.getRefreshToken() && 
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
                    const refreshToken = tokenService.getRefreshToken();
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
        } else {
          console.error(`リクエスト設定エラー [TraceID: ${responseTraceId}]:`, error.message);
        }
        
        return Promise.reject(enhancedError);
      }
    );
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

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }
}

export default new ApiService();