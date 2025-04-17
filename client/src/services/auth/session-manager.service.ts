import { App } from '@capacitor/app';
import tokenService from './token.service';
import jwtAuthService from './jwt-auth.service';
import { isNativePlatform } from '../storage/platform-detector';

/**
 * セッション管理サービス
 * アプリのライフサイクルイベントを監視し、セッションの維持と最適化を行う
 * 
 * 主な機能:
 * 1. アプリのバックグラウンド/フォアグラウンド状態検出
 * 2. トークン自動更新の最適化（バックグラウンド時は実行しない）
 * 3. アプリ再開時のセッション状態復元
 * 4. トークンの有効期限管理と事前更新
 * 
 * @class SessionManagerService
 */
class SessionManagerService {
  private initialized = false;
  private listeners: Array<(isActive: boolean) => void> = [];
  private isAppActive = true;
  private tokenRefreshTimer: number | null = null;
  // トークン有効期限の閾値 (15分)
  private readonly TOKEN_REFRESH_THRESHOLD = 15 * 60 * 1000;
  // 最後にトークンを更新した時刻
  private lastTokenRefresh: number = 0;
  // トークン更新の最小間隔 (1分)
  private readonly MIN_REFRESH_INTERVAL = 60 * 1000;

  /**
   * セッションマネージャーを初期化
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('セッションマネージャー：初期化を開始');
    
    if (isNativePlatform()) {
      // ネイティブ環境でのライフサイクルイベント処理
      this.setupNativeAppListeners();
    } else {
      // Web環境でのライフサイクルイベント処理
      this.setupWebAppListeners();
    }

    // トークン更新タイマーの設定
    this.setupTokenRefreshTimer();
    
    this.initialized = true;
    console.log('セッションマネージャー：初期化完了');
  }

  /**
   * ネイティブアプリ用のライフサイクルイベントリスナーを設定
   */
  private setupNativeAppListeners(): void {
    // アプリのバックグラウンド移行検出
    App.addListener('appStateChange', ({ isActive }) => {
      console.log(`セッションマネージャー：アプリ状態変更 - アクティブ: ${isActive}`);
      this.isAppActive = isActive;
      this.notifyListeners(isActive);
      
      if (isActive) {
        // フォアグラウンドに戻った時の処理
        this.handleAppResume();
      } else {
        // バックグラウンドに移行した時の処理
        this.handleAppPause();
      }
    });

    // アプリの終了処理
    App.addListener('backButton', () => {
      console.log('セッションマネージャー：戻るボタン検出');
      this.prepareForExit();
    });
    
    console.log('セッションマネージャー：ネイティブライフサイクルリスナーを設定');
  }

  /**
   * Web環境用のライフサイクルイベントリスナーを設定
   */
  private setupWebAppListeners(): void {
    // ページの可視性変更イベント
    document.addEventListener('visibilitychange', () => {
      const isActive = document.visibilityState === 'visible';
      console.log(`セッションマネージャー：ページ可視性変更 - 表示中: ${isActive}`);
      this.isAppActive = isActive;
      this.notifyListeners(isActive);
      
      if (isActive) {
        // ページがアクティブになった時の処理
        this.handleAppResume();
      } else {
        // ページが非アクティブになった時の処理
        this.handleAppPause();
      }
    });

    // ウィンドウのフォーカス/ブラー検出
    window.addEventListener('focus', () => {
      console.log('セッションマネージャー：ウィンドウフォーカス取得');
      this.isAppActive = true;
      this.notifyListeners(true);
      this.handleAppResume();
    });
    
    window.addEventListener('blur', () => {
      console.log('セッションマネージャー：ウィンドウフォーカス喪失');
      this.isAppActive = false;
      this.notifyListeners(false);
      this.handleAppPause();
    });
    
    // ページ終了時の処理
    window.addEventListener('beforeunload', () => {
      this.prepareForExit();
    });
    
    console.log('セッションマネージャー：Webライフサイクルリスナーを設定');
  }

  /**
   * アプリがフォアグラウンドに戻った時の処理
   */
  private async handleAppResume(): Promise<void> {
    console.log('セッションマネージャー：アプリ再開処理');
    
    try {
      // トークンの有効性を確認
      const isValid = await tokenService.isAccessTokenValid();
      
      if (isValid) {
        // トークンが有効な場合は残り時間をチェック
        const remainingTime = await tokenService.getRemainingTime();
        
        if (remainingTime !== null && remainingTime < this.TOKEN_REFRESH_THRESHOLD) {
          // 残り時間が閾値より短い場合はトークンを更新
          console.log(`セッションマネージャー：アプリ再開時のトークン更新（残り ${Math.floor(remainingTime / 1000)} 秒）`);
          this.refreshTokenIfNeeded(true);
        }
      } else {
        // トークンが無効な場合はログイン画面へリダイレクト
        console.log('セッションマネージャー：無効なセッション、ログイン画面へリダイレクト');
        window.location.href = '/login?expired=true';
      }
    } catch (error) {
      console.error('セッションマネージャー：アプリ再開処理エラー', error);
    }
  }

  /**
   * アプリがバックグラウンドに移行した時の処理
   */
  private handleAppPause(): void {
    console.log('セッションマネージャー：アプリ一時停止処理');
    // 必要に応じてセッション状態を保存
  }

  /**
   * アプリ終了前の準備処理
   */
  private prepareForExit(): void {
    console.log('セッションマネージャー：アプリ終了準備');
    // 必要に応じてセッション状態を保存
  }

  /**
   * トークン更新タイマーの設定
   */
  private setupTokenRefreshTimer(): void {
    // 既存のタイマーがあれば削除
    if (this.tokenRefreshTimer !== null) {
      clearInterval(this.tokenRefreshTimer);
    }
    
    // 30秒ごとにトークンの有効期限をチェック
    this.tokenRefreshTimer = window.setInterval(() => {
      this.refreshTokenIfNeeded();
    }, 30 * 1000);
    
    console.log('セッションマネージャー：トークン更新タイマーを設定（30秒ごと）');
  }

  /**
   * 必要に応じてトークンを更新
   * @param force 強制更新フラグ
   */
  private async refreshTokenIfNeeded(force = false): Promise<void> {
    // アプリがアクティブでない場合は更新しない
    if (!this.isAppActive && !force) {
      return;
    }
    
    try {
      const currentTime = Date.now();
      
      // 最小更新間隔をチェック（トークン更新のスロットリング）
      if (!force && currentTime - this.lastTokenRefresh < this.MIN_REFRESH_INTERVAL) {
        return;
      }
      
      // トークンの残り時間をチェック
      const remainingTime = await tokenService.getRemainingTime();
      
      if (remainingTime === null) {
        // トークンが存在しない場合
        return;
      }
      
      if (force || remainingTime < this.TOKEN_REFRESH_THRESHOLD) {
        console.log(`セッションマネージャー：トークンを更新します（残り ${Math.floor(remainingTime / 1000)} 秒）`);
        const success = await jwtAuthService.refreshToken();
        
        if (success) {
          this.lastTokenRefresh = currentTime;
          console.log('セッションマネージャー：トークン更新成功');
        } else {
          console.warn('セッションマネージャー：トークン更新失敗');
        }
      }
    } catch (error) {
      console.error('セッションマネージャー：トークン更新エラー', error);
    }
  }

  /**
   * アプリ状態リスナーの追加
   * @param callback アプリ状態変更時に呼び出されるコールバック関数
   * @returns リスナー削除用の関数
   */
  addListener(callback: (isActive: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * 登録されたすべてのリスナーに通知
   * @param isActive アプリのアクティブ状態
   */
  private notifyListeners(isActive: boolean): void {
    this.listeners.forEach(listener => listener(isActive));
  }

  /**
   * 現在のセッション状態を確認
   * @returns セッションが有効かどうか
   */
  async isSessionValid(): Promise<boolean> {
    return await tokenService.isAccessTokenValid();
  }

  /**
   * 現在のアプリアクティブ状態を取得
   * @returns アプリがアクティブかどうか
   */
  isActive(): boolean {
    return this.isAppActive;
  }
  
  /**
   * セッション終了時のクリーンアップ処理
   */
  async cleanup(): Promise<void> {
    // タイマーをクリア
    if (this.tokenRefreshTimer !== null) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    // リスナーを削除
    if (isNativePlatform()) {
      await App.removeAllListeners();
    }
    
    this.listeners = [];
    this.initialized = false;
    
    console.log('セッションマネージャー：クリーンアップ完了');
  }
}

// シングルトンインスタンスを作成
const sessionManager = new SessionManagerService();

export default sessionManager;