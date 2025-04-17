/**
 * アプリケーション全体のエラーロギングユーティリティ
 * 将来的に外部エラー追跡サービス（Sentry等）と統合する準備ができています
 */

// エラーの詳細情報を記録する型
interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  context?: Record<string, any>;
  timestamp: number;
}

class ErrorLogger {
  // 最大保存エラー数（メモリ内）
  private readonly MAX_ERRORS = 20;
  
  // エラーログの保存配列
  private errorLogs: ErrorDetails[] = [];
  
  // 開発環境フラグ
  private isDev = process.env.NODE_ENV === 'development';
  
  /**
   * エラーをログに記録します
   * 
   * @param error - エラーオブジェクトまたはエラーメッセージ
   * @param componentStack - Reactコンポーネントスタック（エラーバウンダリから）
   * @param context - エラー発生時の追加コンテキスト情報
   */
  logError(
    error: Error | string,
    componentStack?: string,
    context?: Record<string, any>
  ): void {
    const errorDetails: ErrorDetails = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      componentStack,
      context,
      timestamp: Date.now()
    };
    
    // エラーログに追加
    this.errorLogs.push(errorDetails);
    
    // 最大保存数を超えた場合は古いものを削除
    if (this.errorLogs.length > this.MAX_ERRORS) {
      this.errorLogs.shift();
    }
    
    // 開発環境ではコンソールに詳細を出力
    if (this.isDev) {
      console.error('エラー詳細:', errorDetails);
    }
    
    // 本番環境では必要に応じて外部サービスに送信
    if (!this.isDev) {
      this.sendToExternalService(errorDetails);
    }
  }
  
  /**
   * 捕捉した未処理例外を記録します（グローバルエラーハンドラー用）
   * 
   * @param error - エラーオブジェクト
   * @param errorInfo - エラー追加情報
   */
  logUnhandledException(error: Error | string, errorInfo?: string): void {
    this.logError(error, errorInfo, { source: 'unhandled_exception' });
  }
  
  /**
   * 外部エラー追跡サービスにエラーを送信します
   * 現在はプレースホルダーとして実装
   * 
   * @param errorDetails - 送信するエラー詳細
   */
  private sendToExternalService(errorDetails: ErrorDetails): void {
    // 外部サービス（Sentry等）との統合はここに実装
    // 現在は実装されていません
    
    // ブラウザの localStorage に最新のクラッシュ情報を保存
    try {
      localStorage.setItem('lastCrash', JSON.stringify({
        message: errorDetails.message,
        timestamp: errorDetails.timestamp
      }));
    } catch (e) {
      // localStorageへのアクセスエラーは無視
    }
  }
  
  /**
   * デバッグ用：保存されているすべてのエラーログを取得
   */
  getAllLogs(): ErrorDetails[] {
    return [...this.errorLogs];
  }
  
  /**
   * 特定の期間内のエラーログのみを取得
   * 
   * @param startTime - 開始タイムスタンプ（ミリ秒）
   * @param endTime - 終了タイムスタンプ（ミリ秒）、デフォルトは現在時刻
   */
  getLogsByTimeRange(startTime: number, endTime: number = Date.now()): ErrorDetails[] {
    return this.errorLogs.filter(log => 
      log.timestamp >= startTime && log.timestamp <= endTime
    );
  }
  
  /**
   * エラーログをクリア
   */
  clearLogs(): void {
    this.errorLogs = [];
  }
}

// シングルトンインスタンスを作成
const errorLogger = new ErrorLogger();

export default errorLogger;