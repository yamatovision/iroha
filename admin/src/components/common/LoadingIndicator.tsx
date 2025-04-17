import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingIndicatorProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

/**
 * ローディングインジケーターコンポーネント
 * データ読み込み中などに表示する
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'ロード中...',
  size = 40,
  fullScreen = false
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          {message}
        </Typography>
      )}
    </Box>
  );

  // フルスクリーン表示
  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 9999
        }}
      >
        {content}
      </Box>
    );
  }

  // 通常表示
  return content;
};

export default LoadingIndicator;