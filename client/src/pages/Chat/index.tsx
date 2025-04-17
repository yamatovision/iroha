import React from 'react';
import { Box, IconButton, Typography, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatContainer from '../../components/chat/ChatContainer';
import { ChatMode } from '../../../../shared';

/**
 * チャットページコンポーネント
 * AIとのチャットインターフェースを提供
 */
const ChatPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // URLクエリパラメータからモードを取得
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') as ChatMode || ChatMode.PERSONAL;
  
  // 戻るハンドラー
  const handleBack = () => {
    navigate(-1);
  };

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
      {/* Custom header */}
      <Box
        sx={{
          background: 'linear-gradient(120deg, #9c27b0, #7b1fa2)',
          color: 'white',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
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
          AI相談
        </Typography>
        <Box sx={{ width: '40px' }} /> {/* Spacer for visual balance */}
      </Box>

      {/* Chat container takes all remaining space */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: '100%',
        height: 'calc(100vh - 64px)', // Subtract header height
        position: 'relative'
      }}>
        <ChatContainer
          initialMode={initialMode}
          fullscreen={true}
        />
      </Box>
    </Box>
  );
};

export default ChatPage;