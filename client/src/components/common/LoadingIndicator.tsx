import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingIndicatorProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * アプリケーション全体で使用できる統一されたローディングインジケーター
 * @param message - 表示するメッセージ (オプション)
 * @param fullScreen - 画面全体を覆うかどうか (デフォルト: false)
 * @param size - インジケーターのサイズ (small/medium/large、デフォルト: medium)
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  fullScreen = false,
  size = 'medium'
}) => {
  // サイズのマッピング（モバイル向けに少し大きめに）
  const sizeMap = {
    small: { xs: 28, sm: 24 },    // モバイルでは少し大きく
    medium: { xs: 48, sm: 40 },   // モバイルでは少し大きく
    large: { xs: 64, sm: 60 }     // モバイルでは少し大きく
  };
  
  // レスポンシブ対応のためのサイズ設定
  const progressSize = size === 'small' 
    ? { xs: sizeMap.small.xs, sm: sizeMap.small.sm }
    : (size === 'medium' 
      ? { xs: sizeMap.medium.xs, sm: sizeMap.medium.sm }
      : { xs: sizeMap.large.xs, sm: sizeMap.large.sm });

  // 全画面表示用のスタイル
  const fullScreenStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    // iOSのセーフエリア対応
    paddingTop: 'env(safe-area-inset-top, 0px)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    paddingLeft: 'env(safe-area-inset-left, 0px)',
    paddingRight: 'env(safe-area-inset-right, 0px)',
  };

  // 通常表示用のスタイル
  const normalStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  };

  return (
    <Box sx={fullScreen ? fullScreenStyle : normalStyle} className="loading-indicator">
      <CircularProgress 
        size={typeof window !== 'undefined' && window.innerWidth < 600 ? progressSize.xs : progressSize.sm}
        thickness={4} 
        color="primary" 
      />
      {message && (
        <Typography 
          variant={fullScreen ? "h6" : "body1"} 
          sx={{ mt: 2, fontWeight: size === 'small' ? 'normal' : 'medium' }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingIndicator;