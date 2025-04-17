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
 * 5. Android端末のバックボタン処理
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
  // バックボタン履歴
  private backButtonPressTimestamp = 0;
  // 二重バックボタン検出期間 (ミリ秒)
  private readonly BACK_BUTTON_EXIT_INTERVAL = 2000;
  // ルート画面パス
  private readonly ROOT_PATHS = ['/', '/fortune', '/chat', '/team', '/profile'];
  // 履歴スタック
  private historyStack: string[] = [];

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
    
    // 履歴スタックの初期化
    this.initHistoryStack();
    
    this.initialized = true;
    console.log('セッションマネージャー：初期化完了');
  }

  /**
   * 履歴スタックの初期化
   */
  private initHistoryStack(): void {
    // 現在のパスを初期値として設定
    const currentPath = window.location.pathname;
    this.historyStack = [currentPath];

    // 履歴変更イベントのリスニング
    window.addEventListener('popstate', this.handlePopState.bind(this));
  }

  /**
   * 履歴変更イベントハンドラ
   */
  private handlePopState(_event: PopStateEvent): void {
    const currentPath = window.location.pathname;
    
    // 現在のパスをスタックに追加（重複しないように）
    if (this.historyStack.length === 0 || this.historyStack[this.historyStack.length - 1] !== currentPath) {
      this.historyStack.push(currentPath);
      
      // スタックサイズを管理（最大20エントリまで）
      if (this.historyStack.length > 20) {
        this.historyStack.shift();
      }
    }
    
    console.log('セッションマネージャー：履歴スタック更新', this.historyStack);
  }

  /**
   * 履歴スタックに新しいパスを追加
   */
  addToHistoryStack(path: string): void {
    if (this.historyStack.length === 0 || this.historyStack[this.historyStack.length - 1] !== path) {
      this.historyStack.push(path);
      
      // スタックサイズを管理（最大20エントリまで）
      if (this.historyStack.length > 20) {
        this.historyStack.shift();
      }
    }
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

    // Androidの戻るボタン処理
    App.addListener('backButton', () => {
      console.log('セッションマネージャー：戻るボタン検出');
      this.handleBackButton();
    });
    
    console.log('セッションマネージャー：ネイティブライフサイクルリスナーを設定');
  }

  /**
   * バックボタン処理
   */
  private handleBackButton(): void {
    const currentPath = window.location.pathname;
    
    // 現在がルート画面かどうかを確認
    const isRootScreen = this.ROOT_PATHS.some(path => 
      path === currentPath || (path !== '/' && currentPath.startsWith(path))
    );
    
    if (isRootScreen) {
      // ルート画面での戻るボタン処理（アプリ終了確認）
      const now = Date.now();
      if (now - this.backButtonPressTimestamp < this.BACK_BUTTON_EXIT_INTERVAL) {
        // 短時間内に2回バックボタンが押された場合はアプリ終了
        console.log('セッションマネージャー：アプリ終了処理');
        App.exitApp();
      } else {
        // 最初のバックボタン押下
        this.backButtonPressTimestamp = now;
        // トースト表示などのフィードバック
        this.showExitToast();
      }
    } else {
      // 通常の戻る処理
      console.log('セッションマネージャー：通常の戻る処理');
      window.history.back();
    }
  }
  
  /**
   * アプリ終了確認トーストの表示
   */
  private showExitToast(): void {
    // 簡易的なトースト表示（実際のアプリでは専用のトーストUIを使用）
    const toast = document.createElement('div');
    toast.textContent = 'もう一度戻るボタンを押すと終了します';
    toast.style.position = 'fixed';
    toast.style.bottom = '20%';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '20px';
    toast.style.zIndex = '9999';
    
    document.body.appendChild(toast);
    
    // 2秒後に消去
    setTimeout(() => {
      document.body.removeChild(toast);
    }, this.BACK_BUTTON_EXIT_INTERVAL);
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
    // セッション状態の保存とクリーンアップ
    if (this.tokenRefreshTimer !== null) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
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
    
    // Webリスナーを削除
    window.removeEventListener('popstate', this.handlePopState.bind(this));
    
    this.listeners = [];
    this.initialized = false;
    
    console.log('セッションマネージャー：クリーンアップ完了');
  }
}

// シングルトンインスタンスを作成
const sessionManager = new SessionManagerService();

export default sessionManager;