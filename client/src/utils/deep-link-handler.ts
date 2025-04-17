import { App, URLOpenListenerEvent } from '@capacitor/app';
import { isNativePlatform } from '../services/storage/platform-detector';

/**
 * ディープリンクハンドラー
 * 外部アプリや通知からのアプリ起動時のURLパラメータを処理します
 */
class DeepLinkHandler {
  private initialized = false;
  private pendingUrl: string | null = null;
  private routes: Record<string, (params: URLSearchParams) => void> = {};

  /**
   * ディープリンクハンドラーを初期化します
   */
  initialize(): void {
    if (this.initialized) return;
    
    console.log('DeepLinkHandler: 初期化中');
    
    if (isNativePlatform()) {
      // ネイティブプラットフォームでのディープリンク処理
      App.addListener('appUrlOpen', this.handleAppUrlOpen.bind(this));
      
      // 初期URLを処理（アプリがURLで起動された場合）
      App.getLaunchUrl().then((result) => {
        if (result && result.url) {
          console.log('DeepLinkHandler: 初期URLを取得:', result.url);
          this.processUrl(result.url);
        }
      }).catch(err => {
        console.error('DeepLinkHandler: 初期URL取得エラー:', err);
      });
    } else {
      // Webブラウザ環境での処理
      // URLのハッシュフラグメントからディープリンクパラメータを抽出
      this.processUrl(window.location.href);
      
      // ハッシュ変更イベントをリッスン
      window.addEventListener('hashchange', () => {
        this.processUrl(window.location.href);
      });
    }
    
    this.initialized = true;
    console.log('DeepLinkHandler: 初期化完了');
  }
  
  /**
   * アプリURL起動イベントハンドラー
   */
  private handleAppUrlOpen(event: URLOpenListenerEvent): void {
    console.log('DeepLinkHandler: URLで起動:', event.url);
    this.processUrl(event.url);
  }
  
  /**
   * URLを処理してルーティングします
   */
  private processUrl(url: string): void {
    console.log('DeepLinkHandler: URL処理:', url);
    
    if (!url) return;
    
    // カスタムスキームを持つURLをパース
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      const queryParams = new URLSearchParams(urlObj.search);
      
      // カスタムスキームの場合
      if (urlObj.protocol === 'dailyfortune:') {
        // パスに基づいてルーティング
        const route = pathSegments[0] || '';
        console.log('DeepLinkHandler: カスタムスキームルート:', route);
        
        if (this.routes[route]) {
          this.routes[route](queryParams);
        } else {
          // 登録されていないルートの場合は保留
          this.pendingUrl = url;
        }
      } 
      // HTTP(S)リンクの場合
      else if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        // パスに基づいてルーティング
        // 例: /fortune, /team/123, など
        const route = pathSegments[0] || '';
        console.log('DeepLinkHandler: Webルート:', route);
        
        if (this.routes[route]) {
          this.routes[route](queryParams);
        } else {
          // URLをそのまま内部ルーティングに変換
          // 例: /fortune -> #/fortune
          window.location.hash = urlObj.pathname + urlObj.search;
        }
      }
    } catch (error) {
      console.error('DeepLinkHandler: URL処理エラー:', error);
    }
  }
  
  /**
   * ルートハンドラーを登録します
   * 
   * @param route - ルートパス（最初のパスセグメント）
   * @param handler - URLパラメータを処理するハンドラー関数
   */
  registerRoute(route: string, handler: (params: URLSearchParams) => void): void {
    console.log('DeepLinkHandler: ルート登録:', route);
    this.routes[route] = handler;
    
    // 保留中のURLがあれば処理
    if (this.pendingUrl && this.pendingUrl.includes(`/${route}`)) {
      this.processUrl(this.pendingUrl);
      this.pendingUrl = null;
    }
  }
  
  /**
   * ディープリンクURLを生成します
   * 
   * @param route - ルート（例: 'fortune', 'team'）
   * @param params - URLパラメータ
   * @param useCustomScheme - カスタムスキームを使用するかどうか
   * @returns 生成されたURL
   */
  createDeepLink(
    route: string,
    params: Record<string, string> = {},
    useCustomScheme = true
  ): string {
    const searchParams = new URLSearchParams();
    
    // パラメータを追加
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });
    
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    
    // カスタムスキームまたはウェブURLを生成
    if (useCustomScheme) {
      return `dailyfortune://${route}${queryString}`;
    } else {
      return `https://dailyfortune.web.app/${route}${queryString}`;
    }
  }
}

// シングルトンインスタンスを作成
const deepLinkHandler = new DeepLinkHandler();

export default deepLinkHandler;