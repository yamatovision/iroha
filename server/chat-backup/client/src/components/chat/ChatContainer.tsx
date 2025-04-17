import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { ChatMode } from '../../../../shared';
import { chatService } from '../../services/chat.service';
import ChatModeSelector from './ChatModeSelector';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import MemberSelector from './MemberSelector';

// メッセージの型定義
export interface ChatMessageType {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// チャットコンポーネントのプロパティ
interface ChatContainerProps {
  initialMode?: ChatMode;
  onBack?: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  initialMode = ChatMode.PERSONAL,
  onBack
}) => {
  // 状態管理
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>(initialMode);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showMemberSelector, setShowMemberSelector] = useState<boolean>(false);
  const [chatId, setChatId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初回ロード時にウェルカムメッセージを表示
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        
        // モードを設定して初期メッセージを取得
        const response = await chatService.setMode(mode);
        
        setMessages([{
          role: 'assistant',
          content: response.welcomeMessage,
          timestamp: new Date().toISOString()
        }]);
        
        setChatId(response.chatHistory.id);
      } catch (error) {
        console.error('Chat initialization error:', error);
        setError('チャットの初期化に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeChat();
  }, []);

  // メッセージリストの末尾に自動スクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // モード変更ハンドラー
  const handleModeChange = async (newMode: ChatMode) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // チームメンバーモードの場合、メンバーセレクターを表示
      if (newMode === ChatMode.TEAM_MEMBER) {
        setShowMemberSelector(true);
        setMode(newMode);
        return;
      }
      
      // それ以外のモードの場合、APIを呼び出して切り替え
      const contextInfo = (newMode as string) === ChatMode.TEAM_MEMBER && selectedMemberId
        ? { memberId: selectedMemberId }
        : undefined;
      
      const response = await chatService.setMode(newMode, contextInfo);
      
      setMessages([{
        role: 'assistant',
        content: response.welcomeMessage,
        timestamp: new Date().toISOString()
      }]);
      
      setChatId(response.chatHistory.id);
      setMode(newMode);
      setShowMemberSelector(false);
    } catch (error: any) {
      console.error('Mode change error:', error);
      setError(error.message || 'モードの変更に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // メンバー選択ハンドラー
  const handleMemberSelect = async (memberId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await chatService.setMode(ChatMode.TEAM_MEMBER, { memberId });
      
      setMessages([{
        role: 'assistant',
        content: response.welcomeMessage,
        timestamp: new Date().toISOString()
      }]);
      
      setChatId(response.chatHistory.id);
      setSelectedMemberId(memberId);
      setShowMemberSelector(false);
    } catch (error: any) {
      console.error('Member selection error:', error);
      setError(error.message || 'メンバーの選択に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // メッセージ送信ハンドラー
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    try {
      // ユーザーメッセージをUIに表示
      const userMessage: ChatMessageType = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
      
      // APIを呼び出してAIレスポンスを取得
      const contextInfo = mode === ChatMode.TEAM_MEMBER && selectedMemberId
        ? { memberId: selectedMemberId }
        : undefined;
      
      const response = await chatService.sendMessage(message, mode, contextInfo);
      
      // AIメッセージをUIに表示
      const aiMessage: ChatMessageType = {
        role: 'assistant',
        content: response.aiMessage,
        timestamp: response.timestamp
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (!chatId) {
        setChatId(response.chatHistory.id);
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      setError(error.message || 'メッセージの送信に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // チャット履歴クリアハンドラー
  const handleClearChat = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await chatService.clearHistory({ mode });
      
      // モードを再設定して新しいチャットを開始
      const response = await chatService.setMode(mode, 
        mode === ChatMode.TEAM_MEMBER && selectedMemberId 
          ? { memberId: selectedMemberId } 
          : undefined
      );
      
      setMessages([{
        role: 'assistant',
        content: response.welcomeMessage,
        timestamp: new Date().toISOString()
      }]);
      
      setChatId(response.chatHistory.id);
    } catch (error: any) {
      console.error('Clear chat error:', error);
      setError(error.message || 'チャットのクリアに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        maxHeight: '80vh',
        overflow: 'hidden',
        borderRadius: 2
      }}
    >
      {/* モードセレクター */}
      <ChatModeSelector 
        currentMode={mode} 
        onModeChange={handleModeChange}
        onBack={onBack}
        onClearChat={handleClearChat}
      />
      
      {/* メンバーセレクター（チームメンバーモード時のみ表示） */}
      {showMemberSelector && (
        <MemberSelector onMemberSelect={handleMemberSelect} />
      )}
      
      {/* エラーメッセージ */}
      {error && (
        <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}
      
      {/* メッセージリスト */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <ChatMessageList messages={messages} />
        <div ref={messagesEndRef} />
        
        {/* ローディングインジケーター */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
      
      {/* 入力フォーム */}
      <ChatInput 
        onSendMessage={handleSendMessage} 
        disabled={isLoading || showMemberSelector}
      />
    </Paper>
  );
};

export default ChatContainer;