/**
 * ストレージサービスのインターフェース
 * Webとネイティブプラットフォームで共通のストレージアクセスを提供します
 */
export interface IStorageService {
  /**
   * 指定されたキーに対応する値を取得します
   * @param key 取得するデータのキー
   * @returns キーに対応する値（存在しない場合はnull）を返すPromise
   */
  get(key: string): Promise<string | null>;

  /**
   * 指定されたキーと値をストレージに保存します
   * @param key 保存するデータのキー
   * @param value 保存する値
   * @returns 操作の完了を示すPromise
   */
  set(key: string, value: string): Promise<void>;

  /**
   * オブジェクトをJSON文字列に変換して保存します
   * @param key 保存するデータのキー
   * @param value 保存するオブジェクト
   * @returns 操作の完了を示すPromise
   */
  setObject<T>(key: string, value: T): Promise<void>;

  /**
   * 保存されたJSON文字列をオブジェクトに変換して取得します
   * @param key 取得するデータのキー
   * @returns 解析されたオブジェクト（存在しない場合はnull）を返すPromise
   */
  getObject<T>(key: string): Promise<T | null>;

  /**
   * 指定されたキーのデータを削除します
   * @param key 削除するデータのキー
   * @returns 操作の完了を示すPromise
   */
  remove(key: string): Promise<void>;

  /**
   * すべてのデータを削除します
   * @returns 操作の完了を示すPromise
   */
  clear(): Promise<void>;

  /**
   * すべてのキーの一覧を取得します
   * @returns ストレージ内のすべてのキーの配列を返すPromise
   */
  keys(): Promise<string[]>;
}

/**
 * アプリの主要ストレージキー一覧
 * キーの命名とアクセスを一貫させるための定数
 */
export const StorageKeys = {
  ACCESS_TOKEN: 'df_access_token',
  REFRESH_TOKEN: 'df_refresh_token',
  USER_PROFILE: 'df_user_profile',
  FORTUNE_CACHE: 'df_fortune_cache',
  APP_SETTINGS: 'df_app_settings',
  THEME_PREFERENCE: 'df_theme_preference',
  LAST_SYNC: 'df_last_sync',
  NOTIFICATION_SETTINGS: 'df_notification_settings',
};