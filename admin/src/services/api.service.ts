import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * APIクライアントサービス
 * バックエンドAPIとの通信を行うための基本クラス
 */
class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // API基本URLを環境変数から取得（デフォルトはローカル開発環境）
    // 環境変数の出力（デバッグ用）
    console.log('環境変数VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('環境変数VITE_ADMIN_API_URL:', import.meta.env.VITE_ADMIN_API_URL);
    // APIの基本URLを環境変数から設定（末尾のスラッシュを統一して削除）
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    this.baseURL = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

    // axiosインスタンスの初期化
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10秒タイムアウト
    });

    // リクエストインターセプター：JWTトークンの追加
    this.api.interceptors.request.use(
      async (config) => {
        // JWT認証トークンを取得
        const jwtToken = localStorage.getItem('df_access_token');
        if (jwtToken) {
          // トークンの有効期限をチェック
          try {
            const tokenData = JSON.parse(atob(jwtToken.split('.')[1]));
            const expirationTime = tokenData.exp * 1000; // JWTの有効期限はUNIXタイムスタンプ（秒）
            const currentTime = Date.now();
            
            if (expirationTime > currentTime) {
              // トークンが有効な場合は使用
              config.headers['Authorization'] = `Bearer ${jwtToken}`;
            } else {
              console.warn('トークンの有効期限が切れています。再ログインが必要です。');
              // トークンをクリア
              localStorage.removeItem('df_access_token');
              localStorage.removeItem('df_refresh_token');
              // 注: リフレッシュトークンでの自動更新機能は今後実装予定
            }
          } catch (e) {
            console.error('トークンの解析エラー:', e);
          }
        } else {
          console.warn('認証トークンが見つかりません');
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // レスポンスインターセプター：エラーハンドリング
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // サーバーからのエラーレスポンス
          const status = error.response.status;
          
          if (status === 401) {
            // 認証エラー：再ログインを促す
            console.error('認証エラー: 再ログインが必要です');
            // 必要に応じてログアウト処理やログイン画面へのリダイレクトを行う
            // 例: auth.signOut().then(() => window.location.href = '/login');
          } else if (status === 403) {
            // 権限エラー
            console.error('権限エラー: 必要な権限がありません');
          } else if (status >= 500) {
            // サーバーエラー
            console.error('サーバーエラー:', error.response.data);
          }
        } else if (error.request) {
          // リクエスト送信後にレスポンスが返ってこない
          console.error('ネットワークエラー: サーバーから応答がありません');
        } else {
          // リクエスト設定時のエラー
          console.error('リクエスト設定エラー:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * GETリクエスト
   */
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  /**
   * POSTリクエスト
   */
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  /**
   * PUTリクエスト
   */
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  /**
   * DELETEリクエスト
   */
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  /**
   * PATCHリクエスト
   */
  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }
}

// シングルトンインスタンスをエクスポート
export default new ApiService();