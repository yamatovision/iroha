import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Tooltip, CircularProgress, Snackbar, Alert, Badge } from '@mui/material';
import { Send, Mic, MicOff, Add } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Capacitor } from '@capacitor/core';
import { ContextType } from '../../../../shared';

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

// Web Speech API用インターフェース
interface WebSpeechRecognition extends EventTarget {
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
  onContextButtonClick?: () => void;
  activeContexts?: {
    type: ContextType;
    id: string;
    name: string;
  }[];
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  onContextButtonClick,
  activeContexts = []
}) => {
  const [message, setMessage] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  
  const textFieldRef = useRef<HTMLInputElement>(null);
  const webSpeechRef = useRef<WebSpeechRecognition | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // 音声認識の初期化（Web版とネイティブ版で分岐）
  useEffect(() => {
    const initializeSpeechRecognition = async () => {
      setIsInitializing(true);
      
      try {
        if (isNative) {
          // Capacitorネイティブプラグインの初期化
          console.log('Initializing Capacitor Speech Recognition');
          const { available } = await SpeechRecognition.available();
          
          if (available) {
            console.log('Speech recognition is available on this device');
            
            // 権限のチェック
            await checkPermission();
          } else {
            console.warn('Speech recognition is not available on this device');
            setErrorMessage('この端末では音声認識が利用できません');
            setHasPermission(false);
          }
        } else {
          // Web Speech APIの初期化
          console.log('Initializing Web Speech API');
          // @ts-ignore: Web Speech APIの型定義
          const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
          
          if (SpeechRecognitionAPI) {
            webSpeechRef.current = new SpeechRecognitionAPI();
            
            if (webSpeechRef.current) {
              webSpeechRef.current.lang = 'ja-JP';
              webSpeechRef.current.continuous = false;
              webSpeechRef.current.interimResults = true;
              
              webSpeechRef.current.onresult = (event) => {
                // 中間結果と最終結果を取得
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = 0; i < event.results.length; i++) {
                  const result = event.results[i];
                  if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                  } else {
                    interimTranscript += result[0].transcript;
                  }
                }
                
                // 中間結果を表示
                setInterimTranscript(interimTranscript);
                
                // 最終結果があれば追加
                if (finalTranscript) {
                  setMessage(prev => prev + finalTranscript);
                  setInterimTranscript('');
                }
              };
              
              webSpeechRef.current.onerror = (event) => {
                console.error('Speech recognition error', event);
                setIsRecording(false);
                setErrorMessage('音声認識エラー: ' + (event.error || '不明なエラー'));
              };
              
              webSpeechRef.current.onend = () => {
                setIsRecording(false);
                setInterimTranscript('');
              };
              
              setHasPermission(true);
            }
          } else {
            console.warn('Web Speech API is not supported in this browser');
            setErrorMessage('このブラウザでは音声認識がサポートされていません');
            setHasPermission(false);
          }
        }
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setErrorMessage('音声認識の初期化に失敗しました');
        setHasPermission(false);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeSpeechRecognition();
    
    // クリーンアップ
    return () => {
      if (isRecording) {
        stopRecording();
      }
      
      // 確実にリスナーをクリーンアップ
      if (isNative) {
        SpeechRecognition.removeAllListeners();
      }
    };
  }, []);
  
  // 権限チェックと取得
  const checkPermission = async () => {
    try {
      const permissionStatus = await SpeechRecognition.checkPermissions();
      const permissionState = permissionStatus.speechRecognition;
      
      if (permissionState === 'granted') {
        setHasPermission(true);
      } else if (permissionState === 'prompt') {
        const newStatus = await SpeechRecognition.requestPermissions();
        setHasPermission(newStatus.speechRecognition === 'granted');
      } else {
        setHasPermission(false);
        setErrorMessage('音声認識の権限が許可されていません。設定から許可してください。');
      }
    } catch (error) {
      console.error('Permission check error:', error);
      setHasPermission(false);
      setErrorMessage('権限の確認中にエラーが発生しました');
    }
  };

  // Capacitorの音声認識開始
  const startNativeRecording = async () => {
    try {
      // 権限が未確認の場合は確認
      if (hasPermission === null) {
        await checkPermission();
      }
      
      if (!hasPermission) {
        setErrorMessage('マイクの使用権限がありません。設定から許可してください。');
        return;
      }
      
      // 開始前に既存のリスナーをクリア
      SpeechRecognition.removeAllListeners();
      
      setIsRecording(true);
      setInterimTranscript('(聞き取り中...)');
      
      // 先にリスナーを追加してから認識開始
      // 部分的な結果のリスナー
      await SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
        if (data.matches && data.matches.length > 0) {
          setInterimTranscript(data.matches[0]);
        }
      });
      
      // リスニング状態の監視
      await SpeechRecognition.addListener('listeningState', (data) => {
        if (data.status === 'stopped') {
          setIsRecording(false);
          setInterimTranscript('');
        }
      });
      
      // 認識開始（1回だけ実行）
      const result = await SpeechRecognition.start({
        language: 'ja-JP',
        maxResults: 3,
        prompt: '何かお話しください...',
        partialResults: true,
        popup: false,
      });
      
      // 結果が返ってきたら表示
      if (result && result.matches) {
        const matches = result.matches as string[];
        if (matches && matches.length > 0) {
          setMessage(prev => prev + matches[0]);
        }
      }
    } catch (error) {
      console.error('Error starting native recording:', error);
      setIsRecording(false);
      setInterimTranscript('');
      setErrorMessage('音声認識の開始に失敗しました');
      
      // エラー時にもリスナーをクリア
      SpeechRecognition.removeAllListeners();
    }
  };
  
  // Web Speech APIの音声認識開始
  const startWebRecording = () => {
    if (!webSpeechRef.current) return;
    
    try {
      webSpeechRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting web recording:', error);
      setIsRecording(false);
      setErrorMessage('音声認識の開始に失敗しました');
    }
  };
  
  // 音声認識停止
  const stopRecording = async () => {
    if (isNative) {
      try {
        // 停止処理
        await SpeechRecognition.stop();
        // リスナークリア
        SpeechRecognition.removeAllListeners();
      } catch (error) {
        console.error('Error stopping native recording:', error);
      } finally {
        // 状態をリセット（エラー時にも確実に実行）
        setIsRecording(false);
        setInterimTranscript('');
      }
    } else if (webSpeechRef.current) {
      try {
        webSpeechRef.current.stop();
      } catch (error) {
        console.error('Error stopping web recording:', error);
      } finally {
        // 状態をリセット（エラー時にも確実に実行）
        setIsRecording(false);
        setInterimTranscript('');
      }
    } else {
      // 念のための状態リセット
      setIsRecording(false);
      setInterimTranscript('');
    }
  };
  
  // 音声認識の開始・停止トグル
  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      if (isNative) {
        await startNativeRecording();
      } else {
        startWebRecording();
      }
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
  
  // エラーメッセージのクリア
  const handleCloseError = () => {
    setErrorMessage(null);
  };

  return (
    <InputContainer>
      {/* コンテキスト追加ボタン */}
      <Tooltip title="コンテキストを追加">
        <div style={{ position: 'relative', marginRight: '8px' }}>
          <Badge 
            badgeContent={activeContexts.length} 
            color="primary" 
            overlap="circular"
            max={9}
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#4caf50',
                color: 'white',
              }
            }}
          >
            <IconButton
              color="primary"
              onClick={onContextButtonClick}
              disabled={disabled}
              sx={{ 
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                color: 'white',
                boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
                '&:hover': {
                  transform: !disabled ? 'translateY(-2px)' : 'none',
                  boxShadow: !disabled ? '0 5px 12px rgba(0,0,0,0.2)' : '0 3px 8px rgba(0,0,0,0.15)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Add fontSize="small" />
            </IconButton>
          </Badge>
        </div>
      </Tooltip>
      
      {/* 音声入力ボタン */}
      <Tooltip title={isRecording ? "音声入力を停止" : "音声入力を開始"}>
        <div style={{ position: 'relative', marginRight: '8px' }}>
          <IconButton
            color={isRecording ? "error" : "primary"}
            onClick={toggleRecording}
            disabled={disabled || isInitializing || hasPermission === false}
            sx={{ 
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
                transform: !disabled && !isInitializing ? 'translateY(-2px)' : 'none',
                boxShadow: !disabled && !isInitializing ? '0 5px 12px rgba(0,0,0,0.2)' : '0 3px 8px rgba(0,0,0,0.15)',
              },
              transition: 'all 0.3s ease',
              opacity: (hasPermission === false) ? 0.5 : 1
            }}
          >
            {isInitializing ? (
              <CircularProgress size={24} color="inherit" />
            ) : isRecording ? (
              <MicOff fontSize="small" />
            ) : (
              <Mic fontSize="small" />
            )}
          </IconButton>
          
          {/* 録音インジケーター (波形を示すドット) */}
          {isRecording && (
            <Box
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#f44336',
                animation: 'blink 1s infinite',
                '@keyframes blink': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 }
                }
              }}
            />
          )}
        </div>
      </Tooltip>
      
      {/* テキスト入力フィールド */}
      <Box sx={{ position: 'relative', width: '100%' }}>
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
        
        {/* 中間認識結果の表示 */}
        {interimTranscript && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '100%',
              left: 10,
              right: 10,
              backgroundColor: 'rgba(156, 39, 176, 0.1)',
              padding: '8px 12px',
              borderRadius: '12px 12px 12px 0',
              marginBottom: '8px',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
              fontSize: '0.9rem',
              color: '#7b1fa2',
              maxWidth: 'calc(100% - 120px)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              animation: 'fadeIn 0.3s',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(10px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            {interimTranscript}
          </Box>
        )}
      </Box>
      
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
      
      {/* エラーメッセージSnackbar */}
      <Snackbar 
        open={!!errorMessage} 
        autoHideDuration={5000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </InputContainer>
  );
};

export default ChatInput;