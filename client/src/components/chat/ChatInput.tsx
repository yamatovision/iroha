import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Tooltip } from '@mui/material';
import { Send, Mic, MicOff } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// スタイル設定
const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5, 2),
  borderTop: '1px solid #e6e0eb',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
  position: 'sticky',
  bottom: 0,
  zIndex: 10
}));

// 音声認識インターフェース
interface SpeechRecognition extends EventTarget {
  start(): void;
  stop(): void;
  abort(): void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

// コンポーネントのプロパティ
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const textFieldRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Web Speech APIの初期化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore: Web Speech APIの型定義
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        
        if (recognitionRef.current) {
          recognitionRef.current.lang = 'ja-JP';
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          
          recognitionRef.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setMessage(prev => prev + transcript);
          };
          
          recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error', event);
            setIsRecording(false);
          };
          
          recognitionRef.current.onend = () => {
            setIsRecording(false);
          };
        }
      }
    }
    
    // クリーンアップ
    return () => {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // 音声認識の開始・停止
  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  // メッセージ送信
  const handleSendMessage = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      
      // 送信後にテキストフィールドにフォーカスを戻す
      if (textFieldRef.current) {
        textFieldRef.current.focus();
      }
    }
  };

  // Enterキーでの送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <InputContainer>
      {/* 音声入力ボタン */}
      <Tooltip title={isRecording ? "音声入力を停止" : "音声入力を開始"}>
        <IconButton
          color={isRecording ? "error" : "primary"}
          onClick={toggleRecording}
          disabled={disabled || !recognitionRef.current}
          sx={{ 
            mr: 1,
            width: '44px',
            height: '44px',
            background: isRecording 
              ? 'linear-gradient(135deg, #d81b60, #c2185b)' 
              : 'linear-gradient(135deg, #9575cd, #7e57c2)',
            color: 'white',
            boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
            animation: isRecording ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(156, 39, 176, 0.4)'
              },
              '70%': {
                boxShadow: '0 0 0 10px rgba(156, 39, 176, 0)'
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(156, 39, 176, 0)'
              }
            },
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 5px 12px rgba(0,0,0,0.2)',
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isRecording ? <MicOff fontSize="small" /> : <Mic fontSize="small" />}
        </IconButton>
      </Tooltip>
      
      {/* テキスト入力フィールド */}
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="メッセージを入力..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        inputRef={textFieldRef}
        variant="outlined"
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 24,
            padding: '14px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1rem',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #e6e0eb',
            maxHeight: '120px',
            transition: 'all 0.3s ease',
            '&.Mui-focused': {
              boxShadow: '0 0 0 2px rgba(156, 39, 176, 0.1)'
            }
          }
        }}
      />
      
      {/* 送信ボタン */}
      <Tooltip title="送信">
        <span>
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!message.trim() || disabled}
            sx={{ 
              ml: 1,
              width: '44px',
              height: '44px',
              background: (!message.trim() || disabled) ? '#e0e0e0' : 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
              color: 'white',
              boxShadow: (!message.trim() || disabled) ? 'none' : '0 3px 8px rgba(156, 39, 176, 0.3)',
              '&:hover': {
                background: (!message.trim() || disabled) ? '#e0e0e0' : 'linear-gradient(135deg, #aa2bc5, #8a27b0)',
                transform: (!message.trim() || disabled) ? 'none' : 'translateY(-2px)',
                boxShadow: (!message.trim() || disabled) ? 'none' : '0 5px 12px rgba(156, 39, 176, 0.4)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            <Send fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </InputContainer>
  );
};

export default ChatInput;