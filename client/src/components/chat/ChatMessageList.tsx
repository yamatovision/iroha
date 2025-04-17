import React from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Person, Psychology } from '@mui/icons-material';
import { ChatMessageType } from './ChatContainer';
import ReactMarkdown from 'react-markdown';

// スタイル設定
const MessageContainer = styled(Box)({
  display: 'flex',
  padding: '8px 16px',
  marginBottom: '16px',
  animation: 'fadeIn 0.3s ease',
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' }
  }
});

const UserMessageContainer = styled(MessageContainer)({
  justifyContent: 'flex-end',
  marginLeft: 'auto'
});

const AIMessageContainer = styled(MessageContainer)({
  justifyContent: 'flex-start',
  marginRight: 'auto'
});

const MessageBubble = styled(Paper)(() => ({
  padding: '14px 18px',
  maxWidth: '85%',
  borderRadius: 16,
  wordBreak: 'break-word',
  boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
  lineHeight: 1.6
}));

const UserMessageBubble = styled(MessageBubble)({
  background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
  color: 'white',
  borderBottomRightRadius: 4
});

const AIMessageBubble = styled(MessageBubble)({
  backgroundColor: 'white',
  color: '#3a3a3a',
  borderBottomLeftRadius: 4,
  borderLeft: '3px solid #e1bee7'
});

const MessageTime = styled(Typography)({
  fontSize: '0.7rem',
  marginTop: '4px',
  opacity: 0.7,
  textAlign: 'right'
});

// コンポーネントのプロパティ
interface ChatMessageListProps {
  messages: ChatMessageType[];
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages }) => {
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
      padding: 2, 
      overflowY: 'auto', 
      height: '100%',
      scrollBehavior: 'smooth',
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    }} className="messages-container">
      <Box sx={{ flexGrow: messages.length < 3 ? 1 : 0 }} /> {/* Spacer to push initial messages to bottom */}
      {messages.map((message, index) => (
        message.role === 'user' ? (
          // ユーザーメッセージ
          <UserMessageContainer key={index} className="message user-message">
            <Box sx={{ maxWidth: '85%' }}>
              <UserMessageBubble elevation={0}>
                <Typography>{message.content}</Typography>
              </UserMessageBubble>
              <MessageTime sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {formatTime(message.timestamp)}
              </MessageTime>
            </Box>
            <Avatar 
              sx={{ 
                ml: 1, 
                bgcolor: '#8e24aa',
                background: 'linear-gradient(135deg, #8e24aa, #6a1b9a)',
                boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
                width: 36,
                height: 36
              }}
              className="user-avatar"
            >
              <Person fontSize="small" />
            </Avatar>
          </UserMessageContainer>
        ) : (
          // AIメッセージ
          <AIMessageContainer key={index} className="message ai-message">
            <Avatar 
              sx={{ 
                mr: 1, 
                bgcolor: '#ba68c8',
                background: 'linear-gradient(135deg, #ba68c8, #9c27b0)',
                boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
                width: 36,
                height: 36
              }}
              className="ai-avatar"
            >
              <Psychology fontSize="small" />
            </Avatar>
            <Box sx={{ maxWidth: '85%' }}>
              <AIMessageBubble elevation={0}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <Typography variant="body1">{children}</Typography>,
                    h1: ({ children }) => <Typography variant="h5" gutterBottom>{children}</Typography>,
                    h2: ({ children }) => <Typography variant="h6" gutterBottom>{children}</Typography>,
                    h3: ({ children }) => <Typography variant="subtitle1" gutterBottom>{children}</Typography>,
                    li: ({ children }) => <Typography component="li" variant="body1">{children}</Typography>,
                    ul: ({ children }) => <Box component="ul" sx={{ pl: 2 }}>{children}</Box>,
                    ol: ({ children }) => <Box component="ol" sx={{ pl: 2 }}>{children}</Box>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </AIMessageBubble>
              <MessageTime sx={{ color: '#666' }}>
                {formatTime(message.timestamp)}
              </MessageTime>
            </Box>
          </AIMessageContainer>
        )
      ))}
    </Box>
  );
};

export default ChatMessageList;