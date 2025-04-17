import { IStorageService } from './storage.interface';
import { CapacitorStorageService } from './capacitor-storage.service';
import { WebStorageService } from './web-storage.service';
import { isNativePlatform, detectPlatform } from './platform-detector';

/**
 * ストレージサービスを作成するファクトリクラス
 * 実行環境に最適なストレージサービスのインスタンスを提供します
 */
export class StorageFactory {
  private static instance: IStorageService | null = null;
  
  /**
   * 実行環境に適したストレージサービスのインスタンスを取得します
   * シングルトンパターンを使用しています
   * @returns ストレージサービスのインスタンス
   */
  public static getStorageService(): IStorageService {
    if (this.instance) {
      return this.instance;
    }
    
    // 実行環境に応じて適切なストレージサービスを作成
    if (isNativePlatform()) {
      console.log('プラットフォーム検出: ネイティブ環境 - Capacitor Preferencesを使用します');
      this.instance = new CapacitorStorageService();
    } else {
      console.log('プラットフォーム検出: Web環境 - localStorageを使用します');
      this.instance = new WebStorageService();
    }
    
    return this.instance;
  }
  
  /**
   * 現在使用中のストレージサービスの種類を取得します
   * @returns ストレージサービスの種類を示す文字列
   */
  public static getStorageType(): string {
    const instance = this.getStorageService();
    
    if (instance instanceof CapacitorStorageService) {
      return 'Capacitor Preferences';
    } else if (instance instanceof WebStorageService) {
      return 'Web localStorage';
    } else {
      return 'Unknown';
    }
  }
  
  /**
   * プラットフォーム情報を含む詳細な情報文字列を取得します
   * @returns プラットフォームとストレージ情報を含む文字列
   */
  public static getStorageInfo(): string {
    const platform = detectPlatform();
    const storageType = this.getStorageType();
    
    return `Platform: ${platform}, Storage: ${storageType}`;
  }
}

// デフォルトのストレージサービスをエクスポート
export default StorageFactory.getStorageService();