import React, { useRef, useEffect } from 'react';
import { Box, Typography, Paper, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ChatMessageType } from './ChatContainer';
import ReactMarkdown from 'react-markdown';

// スタイル設定
const MessageContainer = styled(Box)({
  display: 'flex',
  padding: '4px 16px',
  marginBottom: '8px',
  animation: 'fadeIn 0.3s ease',
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' }
  }
});

const UserMessageContainer = styled(MessageContainer)({
  justifyContent: 'flex-end',
  marginLeft: 'auto',
  paddingLeft: '24px', // 左側の余白
  paddingRight: '32px'  // 右側の余白を大幅に増加
});

const AIMessageContainer = styled(MessageContainer)({
  justifyContent: 'flex-start',
  marginRight: 'auto',
  width: '100%' // AIメッセージは全幅
});

const MessageBubble = styled(Paper)(() => ({
  padding: '10px 14px',
  borderRadius: 16,
  wordBreak: 'break-word',
  boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
  lineHeight: 1.5
}));

const UserMessageBubble = styled(MessageBubble)({
  background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
  color: 'white',
  borderBottomRightRadius: 4,
  minWidth: '140px', // 最小幅を拡大して縦書き状態を防ぐ
  maxWidth: '70%',   // 幅をさらに狭めて右端から離す
  marginRight: '16px' // 右側の余白を大幅に増加
});

// AIメッセージ用のスタイル（吹き出しなし、全幅）
const AIMessageContent = styled(Box)(({ theme }) => ({
  padding: '10px 16px',
  width: '100%',
  color: '#3a3a3a',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  '& p': {
    margin: '6px 0'
  }
}));

const MessageTime = styled(Typography)({
  fontSize: '0.65rem',
  marginTop: '2px',
  opacity: 0.7,
  textAlign: 'right'
});

// コンポーネントのプロパティ
interface ChatMessageListProps {
  messages: ChatMessageType[];
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  
  // 新しいメッセージが追加されたらスクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // ユーザーが新しいメッセージを送信したらその位置までスクロール
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user' && lastUserMessageRef.current) {
      lastUserMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // タイムスタンプをフォーマット
  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  return (
    <Box sx={{ 
      padding: isMobile ? 0.5 : 1, 
      overflowY: 'auto', 
      height: '100%',
      scrollBehavior: 'smooth',
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    }} className="messages-container">
      <Box sx={{ flexGrow: messages.length < 3 ? 1 : 0 }} /> {/* Spacer to push initial messages to bottom */}
      {messages.map((message, index) => {
        const isLastUserMessage = message.role === 'user' && index === messages.length - 1;
        
        return (
          message.role === 'user' ? (
            // ユーザーメッセージ - アバターなしのシンプルな吹き出し形式
            <UserMessageContainer 
              key={index} 
              className="message user-message"
              ref={isLastUserMessage ? lastUserMessageRef : null}
            >
              <Box sx={{ width: isMobile ? '80%' : '70%' }}>
                <UserMessageBubble elevation={0}>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>{message.content}</Typography>
                </UserMessageBubble>
                <MessageTime sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {formatTime(message.timestamp)}
                </MessageTime>
              </Box>
            </UserMessageContainer>
          ) : (
            // AIメッセージ - アイコンなし、吹き出しなし、全幅のデザイン
            <Box
              key={index}
              sx={{
                width: '100%',
                py: 1
              }}
              className="message ai-message"
            >
              <Box 
                sx={{ 
                  width: '100%',
                  px: 2
                }}
              >
                <AIMessageContent>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <Typography variant="body1" sx={{ my: 0.5 }}>{children}</Typography>,
                      h1: ({ children }) => <Typography variant="h5" sx={{ mt: 1, mb: 0.5 }}>{children}</Typography>,
                      h2: ({ children }) => <Typography variant="h6" sx={{ mt: 1, mb: 0.5 }}>{children}</Typography>,
                      h3: ({ children }) => <Typography variant="subtitle1" sx={{ mt: 1, mb: 0.5 }}>{children}</Typography>,
                      li: ({ children }) => <Typography component="li" variant="body1" sx={{ my: 0.25 }}>{children}</Typography>,
                      ul: ({ children }) => <Box component="ul" sx={{ pl: 2, my: 0.5 }}>{children}</Box>,
                      ol: ({ children }) => <Box component="ol" sx={{ pl: 2, my: 0.5 }}>{children}</Box>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </AIMessageContent>
              </Box>
            </Box>
          )
        );
      })}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatMessageList;