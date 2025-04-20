import apiService from '../api.service';
import tokenService from './token.service';
import { JWT_AUTH } from '@shared/index';

// JWT認証サービスの型定義
export interface JwtAuthService {
  login(email: string, password: string): Promise<any>;
  register(email: string, password: string, displayName: string): Promise<any>;
  logout(): Promise<void>;
  refreshToken(): Promise<{success: boolean; error?: string}>;
  migrateToJwt(password: string): Promise<any>;
  isAuthenticated(): Promise<boolean>;
}

class JwtAuthServiceImpl implements JwtAuthService {
  // ログイン処理
  async login(email: string, password: string): Promise<any> {
    try {
      console.log('JWT認証ログイン開始 - リクエスト送信先:', JWT_AUTH.LOGIN);
      
      // ログイン前に既存のキャッシュをクリア
      await apiService.clearCache();
      console.log('ログイン前にキャッシュをクリアしました');
      
      // Augment login data with additional information for debugging on server
      const loginData = { 
        email, 
        password,
        clientInfo: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          viewport: `${window.innerWidth}x${window.innerHeight}`
        }
      };
      
      const response = await apiService.post(JWT_AUTH.LOGIN, loginData);
      
      console.log('ログインレスポンス受信:', {
        status: response.status,
        hasTokens: !!response.data?.tokens,
        user: response.data?.user ? 'データあり' : 'なし'
      });
      
      if (response.status === 200 && response.data.tokens) {
        const { accessToken, refreshToken } = response.data.tokens;
        
        // Tokenの形式をチェック（セキュリティのために先頭と末尾のみ表示）
        const accessTokenPreview = accessToken ? 
          `${accessToken.substring(0, 5)}...${accessToken.substring(accessToken.length - 5)}` : 
          'undefined';
        const refreshTokenPreview = refreshToken ? 
          `${refreshToken.substring(0, 5)}...${refreshToken.substring(refreshToken.length - 5)}` : 
          'undefined';
          
        console.log('トークン受信:', {
          accessToken: accessTokenPreview,
          refreshToken: refreshTokenPreview,
          accessTokenLength: accessToken ? accessToken.length : 0,
          refreshTokenLength: refreshToken ? refreshToken.length : 0
        });
        
        // トークンをローカルストレージに保存
        tokenService.setTokens(accessToken, refreshToken);
        console.log('トークンを保存しました');
        
        return response.data;
      } else {
        console.error('無効なログインレスポンス:', {
          status: response.status,
          data: response.data
        });
        throw new Error('ログインレスポンスが不正です');
      }
    } catch (error: any) {
      console.error('JWT認証ログインエラー:', error);
      // レスポンスがある場合、詳細を記録
      if (error.response) {
        console.error('サーバーレスポンス:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw error;
    }
  }

  // ユーザー登録処理
  async register(email: string, password: string, displayName: string): Promise<any> {
    try {
      const response = await apiService.post(JWT_AUTH.REGISTER, { 
        email, 
        password, 
        displayName 
      });
      
      if (response.status === 201 && response.data.tokens) {
        const { accessToken, refreshToken } = response.data.tokens;
        
        // トークンをローカルストレージに保存
        tokenService.setTokens(accessToken, refreshToken);
        
        return response.data;
      } else {
        throw new Error('ユーザー登録レスポンスが不正です');
      }
    } catch (error) {
      console.error('JWT認証ユーザー登録エラー:', error);
      throw error;
    }
  }

  // Firebase認証からJWT認証への移行
  async migrateToJwt(password: string): Promise<any> {
    try {
      // このエンドポイントはFirebase認証が必要
      const response = await apiService.post(JWT_AUTH.MIGRATE_TO_JWT, { password });
      
      if (response.status === 200 && response.data.tokens) {
        const { accessToken, refreshToken } = response.data.tokens;
        
        // トークンをローカルストレージに保存
        tokenService.setTokens(accessToken, refreshToken);
        
        return response.data;
      } else {
        throw new Error('JWT認証移行レスポンスが不正です');
      }
    } catch (error) {
      console.error('JWT認証移行エラー:', error);
      throw error;
    }
  }

  // ログアウト処理
  async logout(): Promise<void> {
    try {
      // リフレッシュトークンを取得
      const refreshToken = await tokenService.getRefreshToken();
      
      if (refreshToken) {
        // サーバー側のリフレッシュトークンを無効化
        await apiService.post(JWT_AUTH.LOGOUT, { refreshToken });
      }
      
      // すべてのキャッシュをクリア
      await apiService.clearCache();
      
      // ローカルのトークンをクリア
      await tokenService.clearTokens();
    } catch (error) {
      console.error('JWT認証ログアウトエラー:', error);
      // エラーが発生してもローカルのトークンとキャッシュは必ずクリア
      await apiService.clearCache();
      await tokenService.clearTokens();
      throw error;
    }
  }

  // トークンリフレッシュ処理
  async refreshToken(): Promise<{success: boolean; error?: string}> {
    try {
      const refreshToken = await tokenService.getRefreshToken();
      
      if (!refreshToken) {
        console.warn('リフレッシュトークンがありません');
        return { success: false, error: 'no_refresh_token' };
      }
      
      // デバッグ用にリフレッシュトークンの一部を表示（セキュリティのため完全なトークンは表示しない）
      const tokenPreview = refreshToken.substring(0, 10) + '...' + refreshToken.substring(refreshToken.length - 10);
      console.log(`リフレッシュトークン使用: ${tokenPreview} (長さ: ${refreshToken.length})`);
      
      // カスタムヘッダーを追加して、リクエストを直接送信
      // 通常のAPIサービスのインターセプターをバイパスしてトークン更新の循環を防ぐ
      const axios = (await import('axios')).default;
      const baseURL = import.meta.env.PROD 
        ? import.meta.env.VITE_API_URL 
        : '';
      
      console.log('リフレッシュトークンリクエスト送信中...');
      
      // 本番環境では、baseURLの重複を確認して処理
      let refreshUrl;
      if (baseURL) {
        // baseURLに '/api/v1' が含まれている場合は重複を防ぐ
        if (baseURL.includes('/api/v1')) {
          // '/api/v1'を除去してパスを連結
          const cleanBaseUrl = baseURL.replace('/api/v1', '');
          refreshUrl = `${cleanBaseUrl}${JWT_AUTH.REFRESH_TOKEN}`;
        } else {
          // 通常通り連結
          refreshUrl = `${baseURL}${JWT_AUTH.REFRESH_TOKEN}`;
        }
      } else {
        // 開発環境: 相対パスを使用
        refreshUrl = JWT_AUTH.REFRESH_TOKEN;
      }
      
      // 最終的なURLにパスの重複がないかチェック
      if (refreshUrl.includes('/api/v1/api/v1/')) {
        console.warn('⚠️ リフレッシュURLにパスの重複が検出されました: ', refreshUrl);
        refreshUrl = refreshUrl.replace('/api/v1/api/v1/', '/api/v1/');
        console.log('🔧 修正後のリフレッシュURL: ', refreshUrl);
      }

      console.log('Refresh URL being used:', refreshUrl);
      console.log('JWT_AUTH.REFRESH_TOKEN value:', JWT_AUTH.REFRESH_TOKEN);
      
      const response = await axios({
        method: 'post',
        url: refreshUrl,
        data: { refreshToken },
        headers: {
          'Content-Type': 'application/json',
          'X-Direct-Refresh': 'true' // カスタムヘッダーを追加して直接リフレッシュを示す
        }
      });
      
      console.log('リフレッシュレスポンス受信:', response.status);
      
      if (response.status === 200 && response.data.tokens) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
        
        // 新しいトークンの一部をログに出力（デバッグ用）
        const newTokenPreview = newRefreshToken.substring(0, 10) + '...' + newRefreshToken.substring(newRefreshToken.length - 10);
        console.log(`新しいリフレッシュトークン受信: ${newTokenPreview} (長さ: ${newRefreshToken.length})`);
        
        // 新しいトークンをローカルストレージに保存
        await tokenService.setTokens(accessToken, newRefreshToken);
        console.log('新しいトークンを保存しました');
        
        return { success: true };
      } else {
        console.warn('リフレッシュレスポンスにトークンが含まれていません');
        return { success: false, error: 'invalid_response' };
      }
    } catch (error: any) {
      console.error('トークンリフレッシュエラー:', error);
      
      // リフレッシュトークンの不一致エラーを特定
      if (error.response?.status === 401 && 
          (error.response?.data?.message === 'リフレッシュトークンが一致しません' ||
           error.response?.data?.message === 'トークンバージョンが一致しません')) {
        
        console.warn('リフレッシュトークンの不一致を検出、自動修復を試みます...');
        
        // リフレッシュトークンをクリアして次回ログイン時に再取得させる
        await tokenService.clearTokens();
        
        // エラー情報を返す（画面遷移はAuthContextなど上位レイヤーで処理）
        return { 
          success: false, 
          error: 'token_mismatch' 
        };
      }
      
      return { success: false, error: 'refresh_failed' };
    }
  }
  
  // 認証状態をチェック
  async isAuthenticated(): Promise<boolean> {
    return await tokenService.isAccessTokenValid();
  }
}

export default new JwtAuthServiceImpl();