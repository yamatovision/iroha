import { Preferences } from '@capacitor/preferences';
import { IStorageService } from './storage.interface';

/**
 * Capacitor Preferencesを使用したストレージサービス実装
 * ネイティブアプリでのデータ永続化を提供します
 */
export class CapacitorStorageService implements IStorageService {
  /**
   * 指定されたキーに対応する値を取得します
   * @param key 取得するデータのキー
   * @returns キーに対応する値（存在しない場合はnull）を返すPromise
   */
  async get(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      console.error(`CapacitorStorageService: ${key}の取得中にエラー発生`, error);
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
      await Preferences.set({ key, value });
    } catch (error) {
      console.error(`CapacitorStorageService: ${key}の保存中にエラー発生`, error);
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
      console.error(`CapacitorStorageService: ${key}のオブジェクト保存中にエラー発生`, error);
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
      console.error(`CapacitorStorageService: ${key}のオブジェクト取得中にエラー発生`, error);
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
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`CapacitorStorageService: ${key}の削除中にエラー発生`, error);
      throw error;
    }
  }

  /**
   * すべてのデータを削除します
   * @returns 操作の完了を示すPromise
   */
  async clear(): Promise<void> {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('CapacitorStorageService: ストレージのクリア中にエラー発生', error);
      throw error;
    }
  }

  /**
   * すべてのキーの一覧を取得します
   * @returns ストレージ内のすべてのキーの配列を返すPromise
   */
  async keys(): Promise<string[]> {
    try {
      const { keys } = await Preferences.keys();
      return keys;
    } catch (error) {
      console.error('CapacitorStorageService: キー一覧の取得中にエラー発生', error);
      return [];
    }
  }
}