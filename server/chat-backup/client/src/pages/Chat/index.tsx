import React from 'react';
import { Container, Typography, Box, Paper, useTheme, useMediaQuery } from '@mui/material';
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
    <Container maxWidth="md" sx={{ py: 3, height: '100%' }}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* ページタイトル（モバイルでは非表示） */}
        {!isMobile && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: 'background.paper',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="h5" component="h1" align="center" fontWeight={500}>
              AI相談
            </Typography>
          </Paper>
        )}
        
        {/* チャットコンテナ */}
        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
          <ChatContainer
            initialMode={initialMode}
            onBack={handleBack}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default ChatPage;