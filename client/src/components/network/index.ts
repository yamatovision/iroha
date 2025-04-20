import { useState, useEffect } from 'react';
import NetworkStatusIndicator from './NetworkStatusIndicator';
import NetworkStatusOverlay from './NetworkStatusOverlay';
import networkMonitorService from '../../services/network/network-monitor.service';
import fortuneService from '../../services/fortune.service';

/**
 * ネットワーク状態監視とデータ更新を連携させるカスタムフック
 * @param onStatusChange ネットワーク状態変化時のコールバック
 * @returns 現在のネットワーク接続状態と接続復旧フラグ
 */
export const useNetworkAwareDataSync = (onStatusChange?: (isConnected: boolean) => void) => {
  const [isConnected, setIsConnected] = useState(true);
  const [wasDisconnected, setWasDisconnected] = useState(false);

  useEffect(() => {
    // ネットワーク状態変化のリスナーを登録
    const unsubscribe = networkMonitorService.addListener(async (connected) => {
      // 元の状態を保存
      const wasOffline = !isConnected;
      
      // 新しい状態を設定
      setIsConnected(connected);
      
      // 状態変化を通知
      if (onStatusChange) {
        onStatusChange(connected);
      }
      
      // オフラインからオンラインに変わった場合
      if (wasOffline && connected) {
        console.log('ネットワーク接続が復活しました。最新データを取得します');
        setWasDisconnected(true);
        
        try {
          // 日付変更チェックを含めた運勢データの更新
          await fortuneService.checkDateChange();
          
          // キャッシュの有効性チェック
          const wasCacheCleared = fortuneService.checkAndClearCache();
          
          // キャッシュがクリアされた場合は最新データ取得
          if (wasCacheCleared) {
            await fortuneService.getDailyFortune();
          }
        } catch (error) {
          console.error('ネットワーク復旧時のデータ更新エラー:', error);
        }
      }
    });
    
    // 初期状態を確認
    networkMonitorService.isConnected().then(connected => {
      setIsConnected(connected);
    });
    
    // クリーンアップ
    return () => {
      unsubscribe();
    };
  }, [isConnected, onStatusChange]);

  return { isConnected, wasDisconnected };
};

export {
  NetworkStatusIndicator,
  NetworkStatusOverlay
};