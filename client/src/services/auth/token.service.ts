import { jwtDecode } from 'jwt-decode';
import { IStorageService, StorageKeys } from '../storage/storage.interface';
import storageService from '../storage/storage-factory';

export interface JwtTokenPayload {
  sub: string;        // ユーザーID
  email?: string;     // メールアドレス
  role?: string;      // ユーザー権限
  exp: number;        // 有効期限タイムスタンプ
  iat: number;        // 発行時刻タイムスタンプ
  tokenVersion?: number; // トークンバージョン
}

export interface TokenService {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(accessToken: string, refreshToken: string): Promise<void>;
  clearTokens(): Promise<void>;
  isAccessTokenValid(): Promise<boolean>;
  isRefreshTokenValid(): Promise<boolean>;
  getTokenPayload(): Promise<JwtTokenPayload | null>;
  getRemainingTime(): Promise<number | null>;
}

// ストレージインターフェースを使用したトークン管理サービス
class PersistentTokenService implements TokenService {
  private readonly ACCESS_TOKEN_KEY = StorageKeys.ACCESS_TOKEN;
  private readonly REFRESH_TOKEN_KEY = StorageKeys.REFRESH_TOKEN;
  private storageService: IStorageService;
  
  constructor(storageService: IStorageService) {
    this.storageService = storageService;
  }

  // アクセストークン取得
  async getAccessToken(): Promise<string | null> {
    return this.storageService.get(this.ACCESS_TOKEN_KEY);
  }

  // リフレッシュトークン取得
  async getRefreshToken(): Promise<string | null> {
    return this.storageService.get(this.REFRESH_TOKEN_KEY);
  }

  // トークンの保存
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.storageService.set(this.ACCESS_TOKEN_KEY, accessToken);
    await this.storageService.set(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  // トークンのクリア
  async clearTokens(): Promise<void> {
    await this.storageService.remove(this.ACCESS_TOKEN_KEY);
    await this.storageService.remove(this.REFRESH_TOKEN_KEY);
  }

  // アクセストークンの有効性チェック
  async isAccessTokenValid(): Promise<boolean> {
    const token = await this.getAccessToken();
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
  async isRefreshTokenValid(): Promise<boolean> {
    const token = await this.getRefreshToken();
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
  async getTokenPayload(): Promise<JwtTokenPayload | null> {
    const token = await this.getAccessToken();
    if (!token) return null;
    
    try {
      return jwtDecode<JwtTokenPayload>(token);
    } catch (error) {
      console.error('トークンデコードエラー:', error);
      return null;
    }
  }

  // アクセストークンの残り有効時間を取得（ミリ秒）
  async getRemainingTime(): Promise<number | null> {
    const token = await this.getAccessToken();
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

// 新しいストレージサービスを使用したトークンサービスのインスタンスをエクスポート
export default new PersistentTokenService(storageService);