import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle, Box, Collapse, IconButton, Snackbar, Tooltip, Typography } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SignalCellular4BarIcon from '@mui/icons-material/SignalCellular4Bar';
import CloseIcon from '@mui/icons-material/Close';
import networkMonitorService from '../../services/network/network-monitor.service';

interface NetworkStatusIndicatorProps {
  /**
   * 表示モード（'badge', 'alert', 'snackbar'）
   */
  mode?: 'badge' | 'alert' | 'snackbar';
  
  /**
   * オフライン通知を表示するか
   */
  showOfflineOnly?: boolean;
  
  /**
   * 親コンポーネントへの状態変化通知用コールバック
   */
  onNetworkStatusChange?: (isConnected: boolean) => void;
}

/**
 * ネットワーク状態を表示するインジケータコンポーネント
 * 
 * @param mode - 表示モード（'badge', 'alert', 'snackbar'）
 * @param showOfflineOnly - オフラインの時だけ表示するかどうか
 * @param onNetworkStatusChange - 親コンポーネントへの状態変化通知用コールバック
 */
const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  mode = 'badge',
  showOfflineOnly = false,
  onNetworkStatusChange
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  
  // ネットワーク状態の監視
  useEffect(() => {
    // 初期状態を取得して設定
    const checkInitialStatus = async () => {
      try {
        const connected = await networkMonitorService.isConnected();
        const type = await networkMonitorService.getConnectionType();
        
        setIsConnected(connected);
        setConnectionType(type);
        
        // アラートモードでは接続状態に応じて表示
        if (mode === 'alert') {
          setShowAlert(!connected || !showOfflineOnly);
        }
        
        // スナックバーモードではオフラインになった時だけ表示
        if (mode === 'snackbar' && !connected) {
          setShowSnackbar(true);
        }
        
        // 親コンポーネントに通知
        if (onNetworkStatusChange) {
          onNetworkStatusChange(connected);
        }
      } catch (error) {
        console.error('ネットワーク初期状態取得エラー:', error);
      }
    };
    
    checkInitialStatus();
    
    // ネットワーク状態変化のリスナーを登録
    const unsubscribe = networkMonitorService.addListener((connected) => {
      setIsConnected(connected);
      
      // 接続タイプを取得
      networkMonitorService.getConnectionType().then(type => {
        setConnectionType(type);
      });
      
      // アラートモードでは接続状態に応じて表示
      if (mode === 'alert') {
        if (!connected || !showOfflineOnly) {
          setShowAlert(true);
        } else {
          // オンラインに戻った時の自動非表示
          setTimeout(() => setShowAlert(false), 3000);
        }
      }
      
      // スナックバーモードでは接続状態に応じて表示
      if (mode === 'snackbar') {
        if (!connected) {
          setShowSnackbar(true);
        } else {
          // オンラインに戻った時の自動非表示
          setTimeout(() => setShowSnackbar(false), 3000);
        }
      }
      
      // 親コンポーネントに通知
      if (onNetworkStatusChange) {
        onNetworkStatusChange(connected);
      }
    });
    
    // クリーンアップ関数
    return () => {
      unsubscribe();
    };
  }, [mode, showOfflineOnly, onNetworkStatusChange]);
  
  // バッジモードのレンダリング
  const renderBadge = () => {
    // オフラインのみ表示モードで、接続中の場合は何も表示しない
    if (showOfflineOnly && isConnected) {
      return null;
    }
    
    let Icon = WifiIcon;
    let tooltipText = 'オンライン（Wi-Fi）';
    let color = 'success.main';
    
    if (!isConnected) {
      Icon = WifiOffIcon;
      tooltipText = 'オフライン';
      color = 'error.main';
    } else if (connectionType === 'cellular') {
      Icon = SignalCellular4BarIcon;
      tooltipText = 'オンライン（モバイルデータ）';
      color = 'info.main';
    }
    
    return (
      <Tooltip title={tooltipText}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', ml: 1 }}>
          <Icon sx={{ color, fontSize: 20 }} />
        </Box>
      </Tooltip>
    );
  };
  
  // アラートモードのレンダリング
  const renderAlert = () => {
    // 表示しない場合は何も返さない
    if (!showAlert) {
      return null;
    }
    
    // オフラインのみ表示モードで、接続中の場合は何も表示しない
    if (showOfflineOnly && isConnected) {
      return null;
    }
    
    let severity = isConnected ? 'success' as const : 'error' as const;
    let title = isConnected ? 'オンライン' : 'オフライン';
    let message = isConnected
      ? `${connectionType === 'wifi' ? 'Wi-Fi' : 'モバイルデータ'}で接続中です`
      : 'インターネット接続がありません。一部の機能が制限されます。';
    
    return (
      <Collapse in={showAlert}>
        <Alert
          severity={severity}
          sx={{ mb: 2 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowAlert(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <AlertTitle>{title}</AlertTitle>
          {message}
        </Alert>
      </Collapse>
    );
  };
  
  // スナックバーモードのレンダリング
  const renderSnackbar = () => {
    // オフラインのみ表示モードで、接続中の場合は何も表示しない
    if (showOfflineOnly && isConnected) {
      return null;
    }
    
    const Icon = isConnected ? WifiIcon : WifiOffIcon;
    const getConnectionLabel = (type: string): string => {
      switch(type) {
        case 'wifi': return 'Wi-Fi';
        case 'cellular': return 'モバイルデータ通信';
        case 'none': return 'オフライン';
        case 'unknown': return '不明';
        default: return type;
      }
    };
    
    const message = isConnected
      ? `インターネットに接続されました (${getConnectionLabel(connectionType)})`
      : 'インターネット接続がありません。一部の機能が制限されます。';
    
    return (
      <Snackbar
        open={showSnackbar}
        autoHideDuration={isConnected ? 3000 : null}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={isConnected ? 'success' : 'error'}
          icon={<Icon />}
          onClose={() => setShowSnackbar(false)}
        >
          <Typography variant="body2">{message}</Typography>
        </Alert>
      </Snackbar>
    );
  };
  
  // 指定されたモードに応じたレンダリング
  switch (mode) {
    case 'badge':
      return renderBadge();
    case 'alert':
      return renderAlert();
    case 'snackbar':
      return renderSnackbar();
    default:
      return renderBadge();
  }
};

export default NetworkStatusIndicator;