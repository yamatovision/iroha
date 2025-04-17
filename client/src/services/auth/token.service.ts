import { jwtDecode } from 'jwt-decode';

export interface JwtTokenPayload {
  sub: string;        // ユーザーID
  email?: string;     // メールアドレス
  role?: string;      // ユーザー権限
  exp: number;        // 有効期限タイムスタンプ
  iat: number;        // 発行時刻タイムスタンプ
  tokenVersion?: number; // トークンバージョン
}

export interface TokenService {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(accessToken: string, refreshToken: string): void;
  clearTokens(): void;
  isAccessTokenValid(): boolean;
  isRefreshTokenValid(): boolean;
  getTokenPayload(): JwtTokenPayload | null;
  getRemainingTime(): number | null;
}

// LocalStorageベースのトークン管理サービス
class LocalStorageTokenService implements TokenService {
  private readonly ACCESS_TOKEN_KEY = 'df_access_token';
  private readonly REFRESH_TOKEN_KEY = 'df_refresh_token';

  // アクセストークン取得
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // リフレッシュトークン取得
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // トークンの保存
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  // トークンのクリア
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // アクセストークンの有効性チェック
  isAccessTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    try {
      const payload = jwtDecode<JwtTokenPayload>(token);
      // 現在時刻と有効期限を比較
      return payload.exp * 1000 > Date.now();
    } catch (error) {
      console.error('アクセストークンの検証エラー:', error);
      return false;
    }
  }

  // リフレッシュトークンの有効性チェック
  isRefreshTokenValid(): boolean {
    const token = this.getRefreshToken();
    if (!token) return false;
    
    try {
      const payload = jwtDecode<JwtTokenPayload>(token);
      // 現在時刻と有効期限を比較
      return payload.exp * 1000 > Date.now();
    } catch (error) {
      console.error('リフレッシュトークンの検証エラー:', error);
      return false;
    }
  }

  // トークンからペイロードを取得
  getTokenPayload(): JwtTokenPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;
    
    try {
      return jwtDecode<JwtTokenPayload>(token);
    } catch (error) {
      console.error('トークンデコードエラー:', error);
      return null;
    }
  }

  // アクセストークンの残り有効時間を取得（ミリ秒）
  getRemainingTime(): number | null {
    const token = this.getAccessToken();
    if (!token) return null;
    
    try {
      const payload = jwtDecode<JwtTokenPayload>(token);
      const expiryTime = payload.exp * 1000; // JWTの有効期限はUNIXタイムスタンプ（秒）
      return Math.max(0, expiryTime - Date.now());
    } catch (error) {
      console.error('有効期限取得エラー:', error);
      return null;
    }
  }
}

// トークンサービスのインスタンスをエクスポート
export default new LocalStorageTokenService();