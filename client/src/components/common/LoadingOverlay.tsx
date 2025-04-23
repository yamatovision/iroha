import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, CircularProgress, useTheme, alpha } from '@mui/material';
import { tipsByCategory, TipCategory } from '../../data/tips';

interface LoadingOverlayProps {
  // ロード状態（必須）
  isLoading: boolean;
  
  // 表示設定
  variant?: 'transparent' | 'opaque';
  contentType?: 'simple' | 'tips' | 'quotes';
  message?: string;
  category?: TipCategory;
  
  // 透過設定
  opacity?: number;
  blurEffect?: boolean;
  
  // 進捗表示
  showProgress?: boolean;
  estimatedTime?: number;
  simulateProgress?: boolean;
  
  // その他
  zIndex?: number;
  children?: React.ReactNode;
  onComplete?: () => void;
}

/**
 * 汎用ローディングオーバーレイコンポーネント
 * - 透過/不透過の背景をサポート
 * - 豆知識表示や進捗バー表示をサポート
 * - モバイル対応済み
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  variant = 'transparent',
  contentType = 'simple',
  message = 'Loading...',
  category = 'general',
  opacity = 0.7,
  blurEffect = true,
  showProgress = false,
  estimatedTime = 10,
  simulateProgress = true,
  zIndex = 1000,
  children,
  onComplete
}) => {
  const theme = useTheme();
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // 現在のカテゴリーのヒント配列を取得
  const tips = useMemo(() => tipsByCategory[category], [category]);
  
  // 豆知識を一定間隔で切り替え
  useEffect(() => {
    if (!isLoading || contentType !== 'tips') return;
    
    const intervalId = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length);
    }, 4000);
    
    return () => clearInterval(intervalId);
  }, [isLoading, contentType, tips]);
  
  // 進捗バーのシミュレーション
  useEffect(() => {
    if (!isLoading || !showProgress || !simulateProgress) {
      setProgress(0);
      return;
    }
    
    const interval = (estimatedTime * 1000) / 100;
    let currentProgress = 0;
    
    const intervalId = setInterval(() => {
      currentProgress += 1;
      if (currentProgress >= 100) {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
      setProgress(currentProgress);
    }, interval);
    
    return () => clearInterval(intervalId);
  }, [isLoading, showProgress, estimatedTime, simulateProgress, onComplete]);
  
  // ローディング中でなければ子要素のみ表示
  if (!isLoading) {
    return <>{children}</>;
  }
  
  return (
    <Box sx={{ position: 'relative' }}>
      {/* 子要素を表示（透過モードの場合のみ背景として表示） */}
      {variant === 'transparent' && children}
      
      {/* オーバーレイ */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: zIndex,
          backgroundColor: variant === 'transparent' 
            ? alpha(theme.palette.background.default, opacity)
            : theme.palette.background.default,
          backdropFilter: blurEffect && variant === 'transparent' ? 'blur(4px)' : 'none',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        {/* ローディングコンテンツ */}
        <Box
          sx={{
            backgroundColor: alpha(theme.palette.background.paper, variant === 'transparent' ? 0.8 : 1),
            borderRadius: '16px',
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.shadows[4],
            maxWidth: '90%',
            width: contentType === 'simple' ? 'auto' : '400px',
            minWidth: contentType === 'simple' ? '200px' : '300px',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* ローディングインジケータ */}
          <CircularProgress size={56} thickness={4} color="primary" />
          
          {/* メッセージ表示 */}
          {message && (
            <Typography 
              variant="h6" 
              sx={{ 
                mt: 2, 
                fontWeight: 'medium', 
                textAlign: 'center'
              }}
            >
              {message}
            </Typography>
          )}
          
          {/* 豆知識表示 */}
          {contentType === 'tips' && tips && tips.length > 0 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                豆知識
              </Typography>
              <Box sx={{ 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    opacity: 1,
                    transition: 'opacity 0.5s ease-in-out',
                    animation: 'fadeInOut 4s infinite'
                  }}
                >
                  {tips[tipIndex % tips.length]}
                </Typography>
              </Box>
            </Box>
          )}
          
          {/* 進捗バー */}
          {showProgress && (
            <Box 
              sx={{ 
                width: '100%', 
                mt: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center' 
              }}
            >
              <Box sx={{ 
                width: '90%', 
                height: '4px', 
                bgcolor: alpha(theme.palette.primary.main, 0.2), 
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <Box 
                  sx={{ 
                    height: '100%', 
                    width: `${progress}%`, 
                    bgcolor: theme.palette.primary.main,
                    borderRadius: '2px',
                    transition: 'width 0.3s ease-in-out'
                  }} 
                />
              </Box>
              <Typography variant="caption" sx={{ mt: 1 }}>
                {progress}% 完了
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(LoadingOverlay);