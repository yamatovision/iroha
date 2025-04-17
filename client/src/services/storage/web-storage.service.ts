import { IStorageService } from './storage.interface';

/**
 * Web向けlocalStorageを使用したストレージサービス実装
 * Web環境でのデータ永続化を提供します
 */
export class WebStorageService implements IStorageService {
  private isAvailable: boolean;

  constructor() {
    // localStorage APIが利用可能かどうかを確認
    this.isAvailable = this.checkAvailability();
  }

  /**
   * localStorage APIが使用可能かどうかを確認します
   * プライベートブラウジング等では使用できない場合があります
   */
  private checkAvailability(): boolean {
    try {
      const testKey = '__test_storage__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('WebStorageService: localStorage is not available', e);
      return false;
    }
  }

  /**
   * 指定されたキーに対応する値を取得します
   * @param key 取得するデータのキー
   * @returns キーに対応する値（存在しない場合はnull）を返すPromise
   */
  async get(key: string): Promise<string | null> {
    try {
      if (!this.isAvailable) return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`WebStorageService: ${key}の取得中にエラー発生`, error);
      return null;
    }
  }

  /**
   * 指定されたキーと値をストレージに保存します
   * @param key 保存するデータのキー
   * @param value 保存する値
   * @returns 操作の完了を示すPromise
   */
  async set(key: string, value: string): Promise<void> {
    try {
      if (!this.isAvailable) throw new Error('localStorage is not available');
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`WebStorageService: ${key}の保存中にエラー発生`, error);
      throw error;
    }
  }

  /**
   * オブジェクトをJSON文字列に変換して保存します
   * @param key 保存するデータのキー
   * @param value 保存するオブジェクト
   * @returns 操作の完了を示すPromise
   */
  async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.set(key, jsonValue);
    } catch (error) {
      console.error(`WebStorageService: ${key}のオブジェクト保存中にエラー発生`, error);
      throw error;
    }
  }

  /**
   * 保存されたJSON文字列をオブジェクトに変換して取得します
   * @param key 取得するデータのキー
   * @returns 解析されたオブジェクト（存在しない場合はnull）を返すPromise
   */
  async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await this.get(key);
      if (!jsonValue) return null;
      
      return JSON.parse(jsonValue) as T;
    } catch (error) {
      console.error(`WebStorageService: ${key}のオブジェクト取得中にエラー発生`, error);
      return null;
    }
  }

  /**
   * 指定されたキーのデータを削除します
   * @param key 削除するデータのキー
   * @returns 操作の完了を示すPromise
   */
  async remove(key: string): Promise<void> {
    try {
      if (!this.isAvailable) return;
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`WebStorageService: ${key}の削除中にエラー発生`, error);
      throw error;
    }
  }

  /**
   * すべてのデータを削除します
   * @returns 操作の完了を示すPromise
   */
  async clear(): Promise<void> {
    try {
      if (!this.isAvailable) return;
      localStorage.clear();
    } catch (error) {
      console.error('WebStorageService: ストレージのクリア中にエラー発生', error);
      throw error;
    }
  }

  /**
   * すべてのキーの一覧を取得します
   * @returns ストレージ内のすべてのキーの配列を返すPromise
   */
  async keys(): Promise<string[]> {
    try {
      if (!this.isAvailable) return [];
      
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      
      return keys;
    } catch (error) {
      console.error('WebStorageService: キー一覧の取得中にエラー発生', error);
      return [];
    }
  }
}