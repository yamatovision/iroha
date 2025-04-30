import jwtAuthService from './jwt-auth.service';
import tokenService from './token.service';
import apiService from '../api.service';
import storageService from '../storage/storage-factory';
import { USER } from '@shared/index';

// 認証管理サービスの型定義
export interface AuthManager {
  login(email: string, password: string): Promise<any>;
  register(email: string, password: string, displayName: string): Promise<any>;
  logout(): Promise<void>;
  refreshJwtTokenIfNeeded(): Promise<boolean>;
  isAuthenticated(): Promise<boolean>;
}

class AuthManagerService implements AuthManager {
  
  constructor() {
    console.log('JWT認証サービスを初期化しました');
  }
  
  // ログイン処理
  async login(email: string, password: string): Promise<any> {
    return jwtAuthService.login(email, password);
  }
  
  // ユーザー登録処理
  async register(email: string, password: string, displayName: string): Promise<any> {
    return jwtAuthService.register(email, password, displayName);
  }
  
  // ログアウト処理
  async logout(): Promise<void> {
    try {
      console.log('JWTからログアウトします');
      await jwtAuthService.logout();
      console.log('ログアウト完了');
    } catch (error) {
      console.error('ログアウト処理中にエラーが発生しました', error);
      
      // エラーが発生してもローカルのトークンとキャッシュをクリア試行
      try {
        await apiService.clearCache();
        await tokenService.clearTokens();
        console.log('エラー後にトークンとキャッシュをクリアしました');
      } catch (clearError) {
        console.error('トークンとキャッシュのクリア中にエラーが発生しました', clearError);
      }
      
      throw error;
    }
  }
  
  // 必要に応じてJWTトークンを更新
  async refreshJwtTokenIfNeeded(): Promise<boolean> {
    try {
      // アクセストークンの残り時間を確認
      const remainingTime = await tokenService.getRemainingTime();
      
      // トークンがない場合は更新不可
      if (remainingTime === null) {
        console.log('アクセストークンが存在しないため更新をスキップします');
        return false;
      }
      
      // 残り5分以内ならトークンを更新
      const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5分（ミリ秒）
      
      if (remainingTime < REFRESH_THRESHOLD) {
        console.log(`アクセストークンの残り時間が少ないため更新します（残り${Math.floor(remainingTime / 1000)}秒）`);
        try {
          console.log('リフレッシュトークン更新プロセスを開始');
          const result = await jwtAuthService.refreshToken();
          
          if (result) {
            console.log('リフレッシュトークン更新に成功しました');
          } else {
            console.warn('リフレッシュトークン更新に失敗しました');
          }
          
          return result.success;
        } catch (error) {
          console.error('トークン更新エラー:', error);
          return false;
        }
      } else {
        // デバッグ用：残り時間を表示
        console.log(`アクセストークンの残り時間が十分あります（残り${Math.floor(remainingTime / 1000)}秒）`);
      }
      
      return true; // トークンは有効
    } catch (error) {
      console.error('トークン残り時間チェックエラー:', error);
      return false;
    }
  }
  
  // 認証状態を確認する
  async isAuthenticated(): Promise<boolean> {
    try {
      // JWTトークンの有効性をチェック
      return await tokenService.isAccessTokenValid();
    } catch (error) {
      console.error('認証状態確認エラー:', error);
      return false;
    }
  }
}

export default new AuthManagerService();