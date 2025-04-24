import React, { useEffect } from 'react';
import { Box, IconButton, Typography, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatContainer from '../../components/chat/ChatContainer';
import { ChatMode } from '../../services/chat.service';
import { Capacitor } from '@capacitor/core';

/**
 * チャットページコンポーネント
 * AIとのチャットインターフェースを提供
 */
const ChatPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isIOS = Capacitor.getPlatform() === 'ios';
  
  // URLクエリパラメータからモードを取得
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') as ChatMode || ChatMode.PERSONAL;
  
  // 戻るハンドラー
  const handleBack = () => {
    navigate(-1);
  };

  // 子コンポーネントからの参照
  const chatContainerRef = React.useRef<any>(null);

  // チャット履歴削除ハンドラー
  const handleClearChat = () => {
    if (chatContainerRef.current && chatContainerRef.current.handleClearChat) {
      chatContainerRef.current.handleClearChat();
    }
  };

  // コンポーネントマウント時にステータスバースタイルを調整
  useEffect(() => {
    // アプリネイティブ環境でのみ実行
    if (Capacitor.isNativePlatform()) {
      try {
        // ステータスバースタイル設定
        const setupStatusBar = async () => {
          if (Capacitor.isPluginAvailable('StatusBar')) {
            const { StatusBar, Style } = await import('@capacitor/status-bar');
            // ステータスバーテキストを白に
            await StatusBar.setStyle({ style: Style.Light });
            
            // iOS限定: オーバーレイモードに設定
            if (Capacitor.getPlatform() === 'ios') {
              await StatusBar.setOverlaysWebView({ overlay: true });
            }
          }
        };
        
        setupStatusBar();
      } catch (error) {
        console.error('Status bar setup error:', error);
      }
    }
  }, []);

  // iOS向けセーフエリア上部パディング (最小44px、実際の値はiOS環境変数から取得)
  const safeAreaTopPadding = isIOS ? '44px' : '16px';
  
  return (
    <Box 
      sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100vh',
        width: '100vw',
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'background.default',
        background: 'linear-gradient(135deg, #fcf7ff 0%, #f6edff 100%)',
        zIndex: 1300, // Modal-like z-index to be above everything
        // Desktop styling
        ...((!isMobile) && {
          maxWidth: '100%',
          margin: '0 auto'
        })
      }}
    >
      {/* Custom header with dynamic safe area */}
      <Box
        sx={{
          background: 'linear-gradient(120deg, #9c27b0, #7b1fa2)',
          color: 'white',
          // 固定パディングでiOSサポート
          paddingTop: isIOS ? safeAreaTopPadding : '16px',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 1300, // 最上位に表示
          boxShadow: '0 2px 15px rgba(0,0,0,0.15)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleBack}
          sx={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            mr: 1,
            '&:active': {
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            textAlign: 'center',
            fontWeight: 400,
            fontSize: '1.3rem',
            letterSpacing: '0.5px',
          }}
        >
          運勢相談
        </Typography>
        <IconButton
          color="inherit"
          onClick={handleClearChat}
          sx={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            '&:active': {
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      {/* Chat container takes all remaining space */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: '100%',
        // 動的にヘッダーの高さを考慮
        height: isIOS ? `calc(100vh - ${safeAreaTopPadding} - 56px)` : 'calc(100vh - 72px)',
        position: 'relative',
        backgroundColor: '#f8f8f8' // 背景色を設定してUIを統一
      }}>
        <ChatContainer
          ref={chatContainerRef}
          initialMode={initialMode}
          fullscreen={true}
          hideContextBar={true} // コンテキストバーは非表示
          removeHeader={true} // 内部ヘッダーを削除
        />
      </Box>
    </Box>
  );
};

export default ChatPage;