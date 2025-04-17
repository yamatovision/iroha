import React from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Person, Psychology } from '@mui/icons-material';
import { ChatMessageType } from './ChatContainer';
import ReactMarkdown from 'react-markdown';

// スタイル設定
const MessageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(1),
}));

const UserMessageContainer = styled(MessageContainer)({
  justifyContent: 'flex-end',
});

const AIMessageContainer = styled(MessageContainer)({
  justifyContent: 'flex-start',
});

const MessageBubble = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  maxWidth: '80%',
  borderRadius: 16,
  wordBreak: 'break-word',
}));

const UserMessageBubble = styled(MessageBubble)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderBottomRightRadius: 4,
}));

const AIMessageBubble = styled(MessageBubble)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderBottomLeftRadius: 4,
  border: `1px solid ${theme.palette.divider}`,
}));

const MessageTime = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  marginTop: theme.spacing(0.5),
  opacity: 0.7,
  textAlign: 'right',
}));

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
    <Box sx={{ padding: 2, overflowY: 'auto', height: '100%' }}>
      {messages.map((message, index) => (
        message.role === 'user' ? (
          // ユーザーメッセージ
          <UserMessageContainer key={index}>
            <Box sx={{ maxWidth: '85%' }}>
              <UserMessageBubble elevation={1}>
                <Typography>{message.content}</Typography>
              </UserMessageBubble>
              <MessageTime color="primary.contrastText">
                {formatTime(message.timestamp)}
              </MessageTime>
            </Box>
            <Avatar sx={{ ml: 1, bgcolor: 'primary.dark' }}>
              <Person />
            </Avatar>
          </UserMessageContainer>
        ) : (
          // AIメッセージ
          <AIMessageContainer key={index}>
            <Avatar sx={{ mr: 1, bgcolor: 'secondary.main' }}>
              <Psychology />
            </Avatar>
            <Box sx={{ maxWidth: '85%' }}>
              <AIMessageBubble elevation={1}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <Typography variant="body1" paragraph>{children}</Typography>,
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
              <MessageTime color="text.secondary">
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