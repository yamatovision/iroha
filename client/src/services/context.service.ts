import { ContextType, IContextItem } from '../../../shared';
import { chatService } from './chat.service';

/**
 * コンテキスト管理サービス
 * チャットのコンテキスト情報を管理するためのサービス
 */
class ContextService {
  private activeContexts: IContextItem[] = [];
  private availableContextCache: any = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5分キャッシュ

  constructor() {
    // デフォルトで自分のコンテキストを設定（アプリ起動時に自動設定される基本コンテキスト）
    this.initializeDefaultContext();
  }

  /**
   * デフォルトのコンテキスト初期化（自分のコンテキスト）
   */
  private async initializeDefaultContext() {
    try {
      // キャッシュがあればそこから自分のコンテキストを取得
      if (this.availableContextCache && this.availableContextCache.self) {
        this.activeContexts = [this.availableContextCache.self];
        return;
      }

      // 利用可能なコンテキスト一覧を取得
      const availableContexts = await chatService.getAvailableContexts();
      
      if (availableContexts.self) {
        this.activeContexts = [availableContexts.self];
        this.availableContextCache = availableContexts;
        this.cacheTimestamp = Date.now();
      } else {
        // 自分の情報がない場合は空のコンテキストリスト
        this.activeContexts = [];
      }
    } catch (error) {
      console.error('Failed to initialize default context:', error);
      this.activeContexts = [];
    }
  }

  /**
   * 現在有効なコンテキスト一覧を取得
   */
  getActiveContexts(): IContextItem[] {
    return [...this.activeContexts];
  }

  /**
   * 現在有効なコンテキストIDの一覧を取得
   */
  getActiveContextIds(): string[] {
    return this.activeContexts.map(context => context.id);
  }

  /**
   * コンテキストの追加
   */
  async addContext(context: IContextItem): Promise<IContextItem[]> {
    // 既に追加済みの場合は何もしない
    if (this.activeContexts.some(c => c.id === context.id && c.type === context.type)) {
      return this.activeContexts;
    }
    
    this.activeContexts.push(context);
    return this.activeContexts;
  }

  /**
   * コンテキストの削除
   */
  removeContext(contextId: string): IContextItem[] {
    this.activeContexts = this.activeContexts.filter(context => {
      // 削除不可（removable = false）のコンテキストは削除しない
      if (!context.removable && context.id === contextId) {
        return true;
      }
      return context.id !== contextId;
    });
    
    return this.activeContexts;
  }

  /**
   * 全コンテキストのクリア（削除不可のコンテキストは残す）
   */
  clearContexts(): IContextItem[] {
    this.activeContexts = this.activeContexts.filter(context => !context.removable);
    return this.activeContexts;
  }

  /**
   * 利用可能なコンテキストの取得（キャッシュを使用）
   */
  async getAvailableContexts(): Promise<any> {
    // キャッシュが有効ならキャッシュを返す
    const now = Date.now();
    if (
      this.availableContextCache &&
      now - this.cacheTimestamp < this.CACHE_DURATION_MS
    ) {
      return this.availableContextCache;
    }
    
    // キャッシュが無効な場合はAPIから取得して更新
    try {
      const availableContexts = await chatService.getAvailableContexts();
      this.availableContextCache = availableContexts;
      this.cacheTimestamp = now;
      return availableContexts;
    } catch (error) {
      console.error('Failed to fetch available contexts:', error);
      throw error;
    }
  }

  /**
   * チャットリクエスト用のコンテキスト情報に変換
   */
  getContextItemsForRequest(): {
    type: ContextType;
    id?: string;
    additionalInfo?: any;
  }[] {
    return this.activeContexts.map(context => ({
      type: context.type,
      id: context.id,
      additionalInfo: context.payload ? undefined : undefined // 必要に応じて追加情報を渡す
    }));
  }
}

// シングルトンインスタンスをエクスポート
export const contextService = new ContextService();