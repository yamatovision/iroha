/**
 * ネットワーク監視サービスのインターフェース
 * アプリケーション全体でネットワーク状態を一元管理するためのAPI
 */
export interface INetworkMonitorService {
  /**
   * 現在のネットワーク接続状態を確認
   * @returns 接続中はtrue、接続なしはfalseを返すPromise
   */
  isConnected(): Promise<boolean>;
  
  /**
   * 現在のネットワーク接続種別を取得
   * @returns 接続タイプを示す文字列を返すPromise (wifi, cellular, none など)
   */
  getConnectionType(): Promise<string>;
  
  /**
   * ネットワーク状態変化のリスナーを追加
   * @param callback ネットワーク状態変化時に呼び出されるコールバック関数
   * @returns リスナー登録解除用の関数
   */
  addListener(callback: NetworkStatusCallback): () => void;
  
  /**
   * 特定の接続タイプのリスナーを追加
   * @param type 監視する接続タイプ
   * @param callback 状態変化時に呼び出されるコールバック関数
   * @returns リスナー登録解除用の関数
   */
  addConnectionTypeListener(type: string, callback: NetworkTypeCallback): () => void;
}

/**
 * ネットワーク状態変化通知用のコールバック型定義
 */
export type NetworkStatusCallback = (isConnected: boolean) => void;

/**
 * ネットワーク接続タイプ変化通知用のコールバック型定義
 */
export type NetworkTypeCallback = (type: string) => void;

/**
 * ネットワーク状態情報の型定義
 */
export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}