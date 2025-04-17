import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

// トークンの有効期限設定
const ACCESS_TOKEN_EXPIRY = '15m';  // アクセストークンは短め（15分）
const REFRESH_TOKEN_EXPIRY = '7d';  // リフレッシュトークンは長め（7日）

/**
 * JWTサービス
 * トークンの生成と検証を行う
 */
export class JwtService {
  /**
   * 現在の環境変数からアクセストークンシークレットを取得
   * index.tsで設定された値を使用するため、実行時に取得
   */
  private static getAccessTokenSecret(): string {
    return process.env.JWT_ACCESS_SECRET || 'dailyfortune_access_token_secret_dev';
  }

  /**
   * 現在の環境変数からリフレッシュトークンシークレットを取得
   * index.tsで設定された値を使用するため、実行時に取得
   */
  private static getRefreshTokenSecret(): string {
    return process.env.JWT_REFRESH_SECRET || 'dailyfortune_refresh_token_secret_dev';
  }

  /**
   * アクセストークンを生成
   * @param user ユーザー情報
   * @returns 生成されたアクセストークン
   */
  static generateAccessToken(user: any): string {
    const payload = {
      sub: user._id?.toString(),
      email: user.email,
      role: user.role
    };

    // シークレットを実行時に取得
    const secretKey = this.getAccessTokenSecret();
    
    // デバッグログ（本番環境では削除または無効化する）
    console.log('アクセストークン生成: シークレットの長さ =', secretKey.length);

    return jwt.sign(payload, secretKey, {
      expiresIn: ACCESS_TOKEN_EXPIRY
    });
  }

  /**
   * リフレッシュトークンを生成
   * @param user ユーザー情報
   * @returns 生成されたリフレッシュトークン
   */
  static generateRefreshToken(user: any): string {
    const payload = {
      sub: user._id?.toString(),
      // リフレッシュトークンには最小限の情報のみ含める
      tokenVersion: user.tokenVersion || 0 // トークン無効化のためのバージョン
    };

    // シークレットを実行時に取得
    const secretKey = this.getRefreshTokenSecret();
    
    // デバッグログ（本番環境では削除または無効化する）
    console.log('リフレッシュトークン生成: シークレットの長さ =', secretKey.length);

    return jwt.sign(payload, secretKey, {
      expiresIn: REFRESH_TOKEN_EXPIRY
    });
  }

  /**
   * アクセストークンを検証
   * @param token 検証するトークン
   * @returns 検証結果とペイロード
   */
  static verifyAccessToken(token: string): { valid: boolean; payload?: any; error?: any } {
    try {
      // シークレットを実行時に取得
      const secretKey = this.getAccessTokenSecret();
      const payload = jwt.verify(token, secretKey);
      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error };
    }
  }

  /**
   * リフレッシュトークンを検証
   * @param token 検証するトークン
   * @returns 検証結果とペイロード
   */
  static verifyRefreshToken(token: string): { valid: boolean; payload?: any; error?: any } {
    try {
      // シークレットを実行時に取得
      const secretKey = this.getRefreshTokenSecret();
      const payload = jwt.verify(token, secretKey);
      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error };
    }
  }

  /**
   * トークンからユーザーIDを抽出
   * @param token JWTトークン 
   * @returns ユーザーID
   */
  static getUserIdFromToken(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as { sub?: string };
      return decoded?.sub || null;
    } catch (error) {
      return null;
    }
  }
}