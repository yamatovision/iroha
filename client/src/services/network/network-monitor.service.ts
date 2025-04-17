import { Network } from '@capacitor/network';
import { INetworkMonitorService, NetworkStatus, NetworkStatusCallback, NetworkTypeCallback } from './network-monitor.interface';
import { isNativePlatform } from '../storage/platform-detector';

/**
 * Capacitorのネットワークプラグインを使用したネットワーク監視サービスの実装
 * Webとネイティブプラットフォームで共通のネットワーク状態監視機能を提供
 */
class NetworkMonitorService implements INetworkMonitorService {
  private statusListeners: NetworkStatusCallback[] = [];
  private typeListeners: Map<string, NetworkTypeCallback[]> = new Map();
  private currentStatus: NetworkStatus = {
    connected: true, // 最初は接続されていると仮定
    connectionType: 'unknown'
  };
  private initialized = false;
  
  constructor() {
    this.initialize();
  }
  
  /**
   * サービスの初期化
   * プラットフォームに応じたネットワーク監視を設定
   */
  private async initialize() {
    if (this.initialized) return;
    
    try {
      // ネットワーク状態変化のリスナーを設定
      Network.addListener('networkStatusChange', (status) => {
        this.currentStatus = {
          connected: status.connected,
          connectionType: status.connectionType
        };
        
        // 接続状態変化を通知
        this.notifyStatusListeners(status.connected);
        
        // 接続タイプ変化を通知
        this.notifyTypeListeners(status.connectionType);
        
        console.log(`ネットワーク状態変化: ${status.connected ? '接続' : '切断'}, タイプ: ${status.connectionType}`);
      });
      
      // 初期状態を取得
      const initialStatus = await Network.getStatus();
      this.currentStatus = {
        connected: initialStatus.connected,
        connectionType: initialStatus.connectionType
      };
      
      console.log(`初期ネットワーク状態: ${initialStatus.connected ? '接続' : '切断'}, タイプ: ${initialStatus.connectionType}`);
      this.initialized = true;
    } catch (error) {
      // WebブラウザやCapacitorが利用できない環境でのフォールバック
      console.error('ネットワーク監視の初期化に失敗:', error);
      console.log('ネットワーク監視はフォールバックモードで動作します');
      
      // オンライン/オフライン検出をブラウザAPIで実装（フォールバック）
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          this.currentStatus.connected = true;
          this.currentStatus.connectionType = 'wifi';
          this.notifyStatusListeners(true);
          this.notifyTypeListeners(this.currentStatus.connectionType);
        });
        
        window.addEventListener('offline', () => {
          this.currentStatus.connected = false;
          this.currentStatus.connectionType = 'none';
          this.notifyStatusListeners(false);
          this.notifyTypeListeners(this.currentStatus.connectionType);
        });
        
        // 初期状態を設定
        this.currentStatus = {
          connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
          connectionType: typeof navigator !== 'undefined' && navigator.onLine ? 'wifi' : 'none'
        };
      }
      
      this.initialized = true;
    }
  }
  
  /**
   * 現在のネットワーク接続状態を確認
   * @returns 接続中はtrue、接続なしはfalseを返すPromise
   */
  async isConnected(): Promise<boolean> {
    try {
      // Capacitorネイティブ環境でのネットワーク状態取得
      if (isNativePlatform()) {
        const status = await Network.getStatus();
        return status.connected;
      }
      
      // ブラウザ環境でのフォールバック
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    } catch (error) {
      console.error('ネットワーク状態取得エラー:', error);
      // エラー時は現在のキャッシュ状態を返す
      return this.currentStatus.connected;
    }
  }
  
  /**
   * 現在のネットワーク接続種別を取得
   * @returns 接続タイプを示す文字列を返すPromise (wifi, cellular, none など)
   */
  async getConnectionType(): Promise<string> {
    try {
      // Capacitorネイティブ環境での接続タイプ取得
      if (isNativePlatform()) {
        const status = await Network.getStatus();
        return status.connectionType;
      }
      
      // ブラウザ環境でのフォールバック
      return typeof navigator !== 'undefined' && navigator.onLine ? 'wifi' : 'none';
    } catch (error) {
      console.error('ネットワーク接続タイプ取得エラー:', error);
      // エラー時は現在のキャッシュ状態を返す
      return this.currentStatus.connectionType;
    }
  }
  
  /**
   * ネットワーク状態変化のリスナーを追加
   * @param callback ネットワーク状態変化時に呼び出されるコールバック関数
   * @returns リスナー登録解除用の関数
   */
  addListener(callback: NetworkStatusCallback): () => void {
    this.statusListeners.push(callback);
    
    // 現在の状態を即座に通知
    callback(this.currentStatus.connected);
    
    // リスナー解除用の関数を返す
    return () => {
      this.statusListeners = this.statusListeners.filter(listener => listener !== callback);
    };
  }
  
  /**
   * 特定の接続タイプのリスナーを追加
   * @param type 監視する接続タイプ
   * @param callback 状態変化時に呼び出されるコールバック関数
   * @returns リスナー登録解除用の関数
   */
  addConnectionTypeListener(type: string, callback: NetworkTypeCallback): () => void {
    // タイプ別のリスナーマップに追加
    if (!this.typeListeners.has(type)) {
      this.typeListeners.set(type, []);
    }
    
    const listeners = this.typeListeners.get(type)!;
    listeners.push(callback);
    
    // 現在の状態が一致する場合に即座に通知
    if (this.currentStatus.connectionType === type) {
      callback(type);
    }
    
    // リスナー解除用の関数を返す
    return () => {
      if (this.typeListeners.has(type)) {
        const listeners = this.typeListeners.get(type)!;
        this.typeListeners.set(
          type,
          listeners.filter(listener => listener !== callback)
        );
      }
    };
  }
  
  /**
   * 接続状態変化をすべてのリスナーに通知
   * @param isConnected 接続状態
   */
  private notifyStatusListeners(isConnected: boolean): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(isConnected);
      } catch (error) {
        console.error('ステータスリスナー呼び出しエラー:', error);
      }
    });
  }
  
  /**
   * 接続タイプ変化を対応するリスナーに通知
   * @param connectionType 接続タイプ
   */
  private notifyTypeListeners(connectionType: string): void {
    // 対象の接続タイプのリスナーが存在する場合、通知
    if (this.typeListeners.has(connectionType)) {
      const listeners = this.typeListeners.get(connectionType)!;
      listeners.forEach(listener => {
        try {
          listener(connectionType);
        } catch (error) {
          console.error('タイプリスナー呼び出しエラー:', error);
        }
      });
    }
    
    // すべての接続タイプに対する通知も行う (type = '*' の場合)
    if (this.typeListeners.has('*')) {
      const allTypeListeners = this.typeListeners.get('*')!;
      allTypeListeners.forEach(listener => {
        try {
          listener(connectionType);
        } catch (error) {
          console.error('全タイプリスナー呼び出しエラー:', error);
        }
      });
    }
  }

  /**
   * ネットワーク接続のタイプを人間が読みやすい形式に変換
   * @param connectionType 接続タイプの文字列
   * @returns 表示用の接続タイプ文字列
   */
  static getConnectionTypeLabel(connectionType: string): string {
    switch (connectionType) {
      case 'wifi':
        return 'Wi-Fi';
      case 'cellular':
        return 'モバイルデータ通信';
      case 'none':
        return 'オフライン';
      case 'unknown':
        return '不明';
      default:
        return connectionType;
    }
  }
}

// シングルトンインスタンスをエクスポート
export default new NetworkMonitorService();