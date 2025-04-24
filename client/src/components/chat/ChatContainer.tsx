import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { IContextItem } from '../../../../shared';
import { chatService } from '../../services/chat.service';
import { contextService } from '../../services/context.service';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import ChatContextSelector from './ChatContextSelector';

// メッセージの型定義
export interface ChatMessageType {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  contextItems?: {
    type: string;
    refId?: string;
    data?: any;
  }[];
}

// チャットコンポーネントのプロパティ
interface ChatContainerProps {
  onBack?: () => void;
  fullscreen?: boolean;
  initialMode?: any; // ChatModeを使用する予定がある場合の対応
  hideContextBar?: boolean; // コンテキストバーを非表示にするオプション
  removeHeader?: boolean; // 内部ヘッダーを削除するオプション（親にヘッダーがある場合など）
}

// 親コンポーネントに公開するメソッド
export interface ChatContainerHandle {
  handleClearChat: () => Promise<void>;
}

const ChatContainer = forwardRef<ChatContainerHandle, ChatContainerProps>(({
  onBack,
  fullscreen = false,
  initialMode,
  hideContextBar = false,
  removeHeader = false
}, ref) => {
  // 状態管理
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeContexts, setActiveContexts] = useState<IContextItem[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [showContextSelector, setShowContextSelector] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 親コンポーネントに公開するメソッド
  useImperativeHandle(ref, () => ({
    handleClearChat
  }));

  // 初回ロード時にチャットを初期化
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        
        console.log('コンテキストベースチャットの初期化開始');
        
        // 初期コンテキスト（自分の情報）を取得
        const contexts = await contextService.getAvailableContexts();
        if (contexts.self) {
          await contextService.addContext(contexts.self);
          setActiveContexts([contexts.self]);
        }
        
        // チャット履歴を取得
        const historyResponse = await chatService.getHistory();
        if (historyResponse.chatHistories && historyResponse.chatHistories.length > 0) {
          const latestHistory = historyResponse.chatHistories[0];
          setChatId(latestHistory.id);
          
          // 最新の履歴からメッセージを取得
          if (latestHistory.messages && latestHistory.messages.length > 0) {
            setMessages(latestHistory.messages.map(msg => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
              contextItems: msg.contextItems
            })));
          } else {
            // 履歴がない場合はウェルカムメッセージを表示
            setMessages([{
              role: 'assistant',
              content: 'こんにちは。今日の運勢や個人的な質問について相談したいことがあれば、お気軽にお尋ねください。',
              timestamp: new Date().toISOString()
            }]);
          }
        } else {
          // 履歴がない場合はウェルカムメッセージを表示
          setMessages([{
            role: 'assistant',
            content: 'こんにちは。今日の運勢や個人的な質問について相談したいことがあれば、お気軽にお尋ねください。',
            timestamp: new Date().toISOString()
          }]);
        }
        
        console.log('チャット初期化完了');
      } catch (error: any) {
        console.error('Chat initialization error:', error);
        setError(error.message || 'チャットの初期化に失敗しました。');
        
        // エラー時も最低限のメッセージを表示
        setMessages([{
          role: 'assistant',
          content: 'こんにちは。今日の運勢や個人的な質問について相談したいことがあれば、お気軽にお尋ねください。',
          timestamp: new Date().toISOString()
        }]);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeChat();
  }, []);

  // アクティブコンテキストが変更されたときに更新
  useEffect(() => {
    const updateActiveContexts = async () => {
      const contexts = contextService.getActiveContexts();
      setActiveContexts(contexts);
    };
    
    updateActiveContexts();
  }, []);

  // メッセージリストの末尾に自動スクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // コンテキスト追加ボタンクリックハンドラー
  const handleContextButtonClick = () => {
    setShowContextSelector(true);
  };

  // コンテキストセレクターを閉じるハンドラー
  const handleCloseContextSelector = () => {
    setShowContextSelector(false);
  };

  // コンテキスト選択ハンドラー
  const handleSelectContext = async (context: IContextItem) => {
    const updatedContexts = await contextService.addContext(context);
    setActiveContexts([...updatedContexts]);
  };

  // ストリーミングコンテンツを保持するためのRef
  const streamContentRef = useRef('');
  
  // メッセージ送信ハンドラー
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    try {
      // ユーザーメッセージをUIに追加
      const userMessage: ChatMessageType = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
      
      // コンテキスト情報をリクエスト用に変換
      const contextItems = contextService.getContextItemsForRequest();
      
      // ストリーミング用の初期AIメッセージを作成
      const timestamp = new Date().toISOString();
      const aiMessage: ChatMessageType = {
        role: 'assistant',
        content: '',  // 空のコンテンツで初期化
        timestamp
      };
      
      // ストリーミング開始前にコンテンツをリセット
      streamContentRef.current = '';
      
      // メッセージリストにユーザーメッセージとAIの空メッセージを追加
      setMessages(prev => [...prev, aiMessage]);
      
      // ストリーミングチャンク受信時のコールバックを設定
      chatService.setStreamChunkCallback((chunk) => {
        // チャンクをコンテンツ参照に追加
        streamContentRef.current += chunk;
        
        // 最新のメッセージを更新（レンダリングを最適化）
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            // 既存のメッセージに新しい完全な内容を設定
            lastMessage.content = streamContentRef.current;
          }
          return newMessages;
        });
      });
      
      // ストリーミングでメッセージを送信
      const response = await chatService.sendMessage(message, contextItems, true);
      
      // ストリーミングが完了したら、コールバックをクリア
      chatService.clearStreamChunkCallback();
      
      // 非ストリーミングモードで返ってきた場合（フォールバック時）は、レスポンスの内容を直接設定
      if (response.aiMessage && streamContentRef.current === '') {
        console.log('非ストリーミングレスポンスを表示します', response.aiMessage.length, 'バイト');
        // 最新のメッセージを更新
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = response.aiMessage;
            lastMessage.timestamp = response.timestamp;
          }
          return newMessages;
        });
      }
      
      if (!chatId) {
        setChatId(response.chatHistory.id);
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      setError(error.message || 'メッセージの送信に失敗しました。');
      // エラー時もコールバックをクリア
      chatService.clearStreamChunkCallback();
    } finally {
      setIsLoading(false);
    }
  };

  // チャット履歴クリアハンドラー
  const handleClearChat = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await chatService.clearHistory();
      
      // ウェルカムメッセージを表示
      setMessages([{
        role: 'assistant',
        content: 'こんにちは。今日の運勢や個人的な質問について相談したいことがあれば、お気軽にお尋ねください。',
        timestamp: new Date().toISOString()
      }]);
      
      // コンテキストもクリア（削除不可のものは残す）
      const remainingContexts = contextService.clearContexts();
      setActiveContexts([...remainingContexts]);
      
    } catch (error: any) {
      console.error('Clear chat error:', error);
      setError(error.message || 'チャットのクリアに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        width: '100%',
        flex: 1,
        overflow: 'hidden',
        background: 'transparent',
        ...(fullscreen ? {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        } : {
          maxHeight: { xs: '100vh', md: '85vh' },
          borderRadius: { xs: 0, md: 2 },
          boxShadow: { xs: 'none', md: '0 3px 15px rgba(0,0,0,0.1)' },
          backgroundColor: 'white'
        })
      }}
    >
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
        disabled={isLoading}
        onContextButtonClick={handleContextButtonClick}
        activeContexts={activeContexts}
      />
      
      {/* コンテキスト選択ポップアップ - hideContextBarまたはremoveHeaderが有効の場合は表示しない */}
      {showContextSelector && !hideContextBar && !removeHeader && (
        <ChatContextSelector
          onSelectContext={handleSelectContext}
          onClose={handleCloseContextSelector}
          activeContextIds={activeContexts.map(c => c.id)}
        />
      )}
    </Box>
  );
});

export default ChatContainer;