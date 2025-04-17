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
  // サイズのマッピング
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60
  };
  
  const progressSize = sizeMap[size];

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
        size={progressSize} 
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