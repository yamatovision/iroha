import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import networkMonitorService from '../../services/network/network-monitor.service';

interface NetworkStatusOverlayProps {
  /**
   * オーバーレイの表示条件
   * - strict: 常にオフライン時に表示
   * - auto: 初期読み込み後のオフラインのみ表示
   * - manual: 手動でコントロール（show属性で制御）
   */
  mode?: 'strict' | 'auto' | 'manual';
  
  /**
   * manualモード時の表示制御フラグ
   */
  show?: boolean;
  
  /**
   * 子要素表示制御（オフライン時に子要素を非表示にするか）
   */
  hideContent?: boolean;
  
  /**
   * オーバーレイスタイル
   */
  overlayStyle?: React.CSSProperties;
  
  /**
   * オーバーレイのメッセージ
   */
  message?: string;
  
  /**
   * 再試行ボタンのテキスト
   */
  retryButtonText?: string;
  
  /**
   * 再試行ボタンクリック時のコールバック
   */
  onRetry?: () => void;
  
  /**
   * オフライン状態変化時のコールバック
   */
  onNetworkStatusChange?: (isConnected: boolean) => void;
  
  /**
   * 子コンポーネント
   */
  children?: React.ReactNode;
}

/**
 * オフライン状態を表示するオーバーレイコンポーネント
 * オフライン時にコンテンツを覆い、ユーザーにネットワーク状態を通知します
 */
const NetworkStatusOverlay: React.FC<NetworkStatusOverlayProps> = ({
  mode = 'strict',
  show = false,
  hideContent = false,
  overlayStyle,
  message = 'インターネット接続がありません',
  retryButtonText = '再接続を確認',
  onRetry,
  onNetworkStatusChange,
  children
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);
  const [manualShow, setManualShow] = useState<boolean>(show);
  
  // プロップの変更を内部状態に反映
  useEffect(() => {
    if (mode === 'manual') {
      setManualShow(show);
    }
  }, [show, mode]);
  
  // ネットワーク状態の監視
  useEffect(() => {
    // 初期状態を取得
    const checkInitialStatus = async () => {
      try {
        const connected = await networkMonitorService.isConnected();
        setIsConnected(connected);
        
        // 親コンポーネントに通知
        if (onNetworkStatusChange) {
          onNetworkStatusChange(connected);
        }
        
        setInitialCheckDone(true);
      } catch (error) {
        console.error('ネットワーク初期状態取得エラー:', error);
        setInitialCheckDone(true);
      }
    };
    
    checkInitialStatus();
    
    // ネットワーク状態変化のリスナーを登録
    const unsubscribe = networkMonitorService.addListener((connected) => {
      setIsConnected(connected);
      
      // 親コンポーネントに通知
      if (onNetworkStatusChange) {
        onNetworkStatusChange(connected);
      }
    });
    
    // クリーンアップ
    return () => {
      unsubscribe();
    };
  }, [onNetworkStatusChange]);
  
  // オーバーレイを表示するかどうかの判定
  const shouldShowOverlay = (): boolean => {
    if (mode === 'manual') {
      return manualShow;
    }
    
    if (mode === 'auto' && !initialCheckDone) {
      return false;
    }
    
    return !isConnected;
  };
  
  // 再試行ボタンクリックハンドラ
  const handleRetry = () => {
    // ネットワーク状態を再チェック
    networkMonitorService.isConnected().then(connected => {
      setIsConnected(connected);
      
      // 親コンポーネントに通知
      if (onNetworkStatusChange) {
        onNetworkStatusChange(connected);
      }
      
      // カスタムの再試行ハンドラがあれば実行
      if (onRetry) {
        onRetry();
      }
    });
  };
  
  // オーバーレイのデフォルトスタイル
  const defaultOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
    padding: 16,
    ...overlayStyle
  };
  
  return (
    <Box position="relative" width="100%" height="100%">
      {/* メインコンテンツ */}
      <Box 
        sx={{ 
          opacity: shouldShowOverlay() && hideContent ? 0.3 : 1,
          transition: 'opacity 0.3s ease-in-out',
          height: '100%'
        }}
      >
        {children}
      </Box>
      
      {/* オフラインオーバーレイ */}
      {shouldShowOverlay() && (
        <Box sx={defaultOverlayStyle}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              maxWidth: 400
            }}
          >
            <WifiOffIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" align="center" gutterBottom>
              {message}
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
              インターネット接続を確認してください。一部の機能が制限されています。
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
            >
              {retryButtonText}
            </Button>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default NetworkStatusOverlay;