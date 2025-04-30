# クライアント直接入力・チャット連携 実装ガイド

## 概要

このドキュメントでは、美容サロンのスタイリストが当日来店したクライアントの誕生日情報を収集し、四柱推命に基づいたパーソナライズされたアドバイスをチャットで提供するための機能実装について説明します。

## 実装の主要ポイント

1. **クライアント誕生日データの適切な紐付け**
   - 誕生日データは必ず担当スタイリストのクライアントに紐づける
   - 本日の施術予定画面（beauty-daily-clients）からの自然な動線確保

2. **プライバシー配慮と同意プロセス**
   - 既存の誕生日データがあっても、チャット履歴がない場合は明示的に再度誕生日入力を促す
   - データ利用に関する明示的な同意取得とその記録

3. **シームレスなチャットへの遷移**
   - チャット履歴がある場合は直接チャット画面に遷移
   - 誕生日情報入力後は四柱推命データを計算し、自動的にチャットコンテキストとして設定

## フロントエンド実装

### 1. 本日の施術予定画面の拡張 (`DailyClientsComponent`)

```typescript
// client/src/pages/DailyClients/index.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, Typography, Button, Chip, 
  List, ListItem, ListItemText, ListItemSecondaryAction, 
  IconButton, CircularProgress
} from '@mui/material';
import { AccountCircle, Edit, Chat, AccessTime } from '@mui/icons-material';
import { clientService } from '../../services/client.service';

const DailyClientsPage: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDailyClients();
  }, []);

  const loadDailyClients = async () => {
    try {
      setLoading(true);
      const response = await clientService.getDailyAppointments();
      setClients(response.timeSlots.all.appointments || []);
    } catch (error) {
      console.error('Error loading daily clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientClick = async (clientId: string) => {
    try {
      // クライアント詳細を取得して、チャット履歴の有無を確認
      const clientDetails = await clientService.getClientDetails(clientId);
      
      if (clientDetails.hasChatHistory) {
        // チャット履歴がある場合、直接チャット画面に遷移
        navigate(`/beauty-clients/${clientId}/chat`);
      } else {
        // チャット履歴がない場合、誕生日入力画面に遷移
        // たとえ誕生日データが既にあっても、同意を得るために入力画面に遷移
        navigate(`/beauty-clients/${clientId}/birth-info`);
      }
    } catch (error) {
      console.error('Error handling client click:', error);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <div className="daily-clients-container">
      <Typography variant="h5" component="h1" gutterBottom>
        本日の施術予定クライアント
      </Typography>
      
      <List>
        {clients.map((client) => (
          <ListItem 
            key={client.client.id}
            button 
            onClick={() => handleClientClick(client.client.id)}
            divider
          >
            <AccountCircle className="client-avatar" />
            <ListItemText
              primary={client.client.name}
              secondary={
                <>
                  <AccessTime fontSize="small" className="time-icon" />
                  {client.time}
                  {client.client.elementAttribute && (
                    <Chip 
                      label={elementToJapanese(client.client.elementAttribute)}
                      size="small"
                      className={`element-chip element-${client.client.elementAttribute}`}
                    />
                  )}
                </>
              }
            />
            <ListItemSecondaryAction>
              <IconButton 
                edge="end" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleClientClick(client.client.id);
                }}
              >
                {client.client.hasChatHistory ? (
                  <Chat color="primary" />
                ) : (
                  <Edit color="secondary" />
                )}
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

// ヘルパー関数：五行属性を日本語に変換
function elementToJapanese(element: string): string {
  const map: Record<string, string> = {
    'wood': '木',
    'fire': '火',
    'earth': '土',
    'metal': '金',
    'water': '水'
  };
  return map[element] || element;
}

export default DailyClientsPage;
```

### 2. クライアント誕生日情報入力コンポーネント (`ClientBirthInfoForm`)

```typescript
// client/src/components/beauty/ClientBirthInfoForm.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Card, CardContent, Typography, Button, 
  FormControl, InputLabel, MenuItem, Select, 
  FormHelperText, TextField, FormControlLabel, 
  Checkbox, Alert, CircularProgress 
} from '@mui/material';
import { Gender } from '../../../shared';
import { clientService } from '../../services/client.service';

const ClientBirthInfoForm: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  
  // フォーム状態
  const [birthYear, setBirthYear] = useState<string>('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');
  const [birthHour, setBirthHour] = useState<string>('');
  const [birthMinute, setBirthMinute] = useState<string>('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [birthPlace, setBirthPlace] = useState<string>('Tokyo');
  const [consent, setConsent] = useState<boolean>(false);
  
  // UI状態
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 年の選択肢生成
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 99 + i);
  
  // 月の選択肢
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // 日の選択肢生成（月によって変動）
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };
  
  const days = birthYear && birthMonth 
    ? Array.from(
        { length: getDaysInMonth(parseInt(birthYear), parseInt(birthMonth)) }, 
        (_, i) => i + 1
      )
    : Array.from({ length: 31 }, (_, i) => i + 1);
  
  // 時間の選択肢
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // 分の選択肢
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // バリデーション
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!birthYear) newErrors.birthYear = '年を選択してください';
    if (!birthMonth) newErrors.birthMonth = '月を選択してください';
    if (!birthDay) newErrors.birthDay = '日を選択してください';
    if (!gender) newErrors.gender = '性別を選択してください';
    
    // 時間は両方とも入力するか、両方とも入力しないか
    if ((birthHour && !birthMinute) || (!birthHour && birthMinute)) {
      newErrors.birthTime = '時間と分の両方を入力してください';
    }
    
    if (!consent) {
      newErrors.consent = 'データ利用に同意してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // 日付文字列の作成
    const birthdate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
    
    // 時間文字列の作成（指定があれば）
    const birthtime = birthHour && birthMinute 
      ? `${birthHour.padStart(2, '0')}:${birthMinute.padStart(2, '0')}`
      : undefined;
      
    try {
      setLoading(true);
      setErrorMessage(null);
      
      // クライアント誕生日情報の更新
      const response = await clientService.updateClientBirthInfo(clientId!, {
        birthdate,
        birthtime,
        birthPlace,
        gender: gender as Gender,
        explicitConsent: consent
      });
      
      if (response.success) {
        // 成功したら、チャット画面に遷移
        navigate(`/beauty-clients/${clientId}/chat`);
      }
    } catch (error) {
      console.error('Error updating client birth info:', error);
      setErrorMessage('情報の更新中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" align="center" gutterBottom>
            誕生日情報の入力
          </Typography>
          
          <Typography color="textSecondary" sx={{ mb: 3 }} align="center">
            クライアント様の誕生日情報を入力して、パーソナライズされたアドバイスを提供します
          </Typography>
          
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                生年月日
              </Typography>
              <Box display="flex" gap={2}>
                <FormControl error={!!errors.birthYear} sx={{ flex: 1 }}>
                  <InputLabel>年</InputLabel>
                  <Select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    label="年"
                  >
                    {years.map(year => (
                      <MenuItem key={year} value={year.toString()}>
                        {year}年
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.birthYear && (
                    <FormHelperText>{errors.birthYear}</FormHelperText>
                  )}
                </FormControl>
                
                <FormControl error={!!errors.birthMonth} sx={{ flex: 1 }}>
                  <InputLabel>月</InputLabel>
                  <Select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    label="月"
                  >
                    {months.map(month => (
                      <MenuItem key={month} value={month.toString()}>
                        {month}月
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.birthMonth && (
                    <FormHelperText>{errors.birthMonth}</FormHelperText>
                  )}
                </FormControl>
                
                <FormControl error={!!errors.birthDay} sx={{ flex: 1 }}>
                  <InputLabel>日</InputLabel>
                  <Select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    label="日"
                  >
                    {days.map(day => (
                      <MenuItem key={day} value={day.toString()}>
                        {day}日
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.birthDay && (
                    <FormHelperText>{errors.birthDay}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                性別
              </Typography>
              <FormControl fullWidth error={!!errors.gender}>
                <InputLabel>性別</InputLabel>
                <Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  label="性別"
                >
                  <MenuItem value={Gender.FEMALE}>女性</MenuItem>
                  <MenuItem value={Gender.MALE}>男性</MenuItem>
                </Select>
                {errors.gender && (
                  <FormHelperText>{errors.gender}</FormHelperText>
                )}
              </FormControl>
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                生まれた時間（より正確な診断のため、わかる場合）
              </Typography>
              <Box display="flex" gap={2}>
                <FormControl sx={{ flex: 1 }} error={!!errors.birthTime}>
                  <InputLabel>時</InputLabel>
                  <Select
                    value={birthHour}
                    onChange={(e) => setBirthHour(e.target.value)}
                    label="時"
                  >
                    <MenuItem value="">未指定</MenuItem>
                    {hours.map(hour => (
                      <MenuItem key={hour} value={hour.toString()}>
                        {hour}時
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl sx={{ flex: 1 }} error={!!errors.birthTime}>
                  <InputLabel>分</InputLabel>
                  <Select
                    value={birthMinute}
                    onChange={(e) => setBirthMinute(e.target.value)}
                    label="分"
                  >
                    <MenuItem value="">未指定</MenuItem>
                    {minutes.map(minute => (
                      <MenuItem key={minute} value={minute.toString()}>
                        {minute}分
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              {errors.birthTime && (
                <FormHelperText error>{errors.birthTime}</FormHelperText>
              )}
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    color="primary"
                  />
                }
                label="入力した情報を四柱推命に基づいたヘアスタイリングアドバイスのために使用することに同意します"
              />
              {errors.consent && (
                <FormHelperText error>{errors.consent}</FormHelperText>
              )}
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="textSecondary">
                ※入力いただいた情報は、より良いサービス提供のためにのみ使用され、お客様の同意なく第三者に提供されることはありません。
              </Typography>
            </Box>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading || !consent}
            >
              {loading ? <CircularProgress size={24} /> : 'チャットを開始する'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClientBirthInfoForm;
```

### 3. クライアントチャットコンポーネント (`ClientChatComponent`)

```typescript
// client/src/components/beauty/ClientChatComponent.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, Paper, Typography, TextField, Button, 
  CircularProgress, Avatar, Chip, Divider 
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { clientService } from '../../services/client.service';
import { Element } from '../../../shared';

interface Message {
  role: 'stylist' | 'assistant';
  content: string;
  timestamp: string;
}

const ClientChatComponent: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 初期データロード
  useEffect(() => {
    fetchChatSession();
  }, [clientId]);
  
  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // チャットセッション取得
  const fetchChatSession = async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await clientService.getClientChatSession(clientId);
      
      if (response.success) {
        setMessages(response.chatSession.messageHistory || []);
        setClientInfo(response.chatSession.sajuContext || null);
        
        // 最初のメッセージがない場合は自動生成
        if (!response.chatSession.messageHistory?.length) {
          await sendWelcomeMessage();
        }
      }
    } catch (error) {
      console.error('Error fetching chat session:', error);
      setError('チャット履歴の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };
  
  // 初回メッセージ自動生成
  const sendWelcomeMessage = async () => {
    try {
      const welcomeResponse = await clientService.sendClientChatMessage(
        clientId!,
        { message: 'こんにちは、よろしくお願いします。' }
      );
      
      if (welcomeResponse.success && welcomeResponse.messages) {
        setMessages(welcomeResponse.messages);
      }
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  };
  
  // メッセージ送信
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !clientId) return;
    
    const newMessage: Message = {
      role: 'stylist',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };
    
    // 楽観的UI更新
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    try {
      setSending(true);
      
      const response = await clientService.sendClientChatMessage(
        clientId,
        { message: newMessage.content }
      );
      
      if (response.success && response.aiResponse) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: response.aiResponse.content,
            timestamp: response.aiResponse.timestamp
          }
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('メッセージの送信に失敗しました。もう一度お試しください。');
    } finally {
      setSending(false);
    }
  };
  
  // 最新メッセージにスクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // 五行属性を色に変換
  const elementToColor = (element?: string): string => {
    const colors: Record<string, string> = {
      [Element.WOOD]: '#a5d6a7',  // 木：グリーン
      [Element.FIRE]: '#ef9a9a',  // 火：レッド
      [Element.EARTH]: '#ffcc80', // 土：オレンジ
      [Element.METAL]: '#fff59d', // 金：イエロー
      [Element.WATER]: '#90caf9', // 水：ブルー
    };
    return element ? colors[element] : '#e0e0e0';
  };
  
  // 五行属性を日本語に変換
  const elementToJapanese = (element?: string): string => {
    const japaneseNames: Record<string, string> = {
      [Element.WOOD]: '木',
      [Element.FIRE]: '火',
      [Element.EARTH]: '土',
      [Element.METAL]: '金',
      [Element.WATER]: '水',
    };
    return element ? japaneseNames[element] : '不明';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      {/* クライアント情報ヘッダー */}
      {clientInfo && (
        <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{ 
                bgcolor: elementToColor(clientInfo.elementAttribute),
                width: 48,
                height: 48
              }}
            >
              {elementToJapanese(clientInfo.elementAttribute)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1">
                {clientInfo.clientName || '顧客'}
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {clientInfo.personalityTraits?.map((trait: string, index: number) => (
                  <Chip 
                    key={index} 
                    label={trait} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
      
      {/* メッセージエリア */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 2,
          backgroundColor: '#f5f5f5',
          borderRadius: 2
        }}
      >
        {error && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              mb: 2, 
              backgroundColor: '#ffebee',
              borderRadius: 2
            }}
          >
            <Typography color="error">{error}</Typography>
          </Paper>
        )}
        
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: message.role === 'stylist' ? 'row-reverse' : 'row',
              mb: 2
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                maxWidth: '70%',
                borderRadius: 2,
                backgroundColor: message.role === 'stylist' ? '#e3f2fd' : 'white'
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </Typography>
              <Typography 
                variant="caption" 
                color="textSecondary"
                sx={{ 
                  display: 'block', 
                  mt: 1,
                  textAlign: message.role === 'stylist' ? 'right' : 'left'
                }}
              >
                {new Date(message.timestamp).toLocaleTimeString('ja-JP', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* 入力エリア */}
      <Paper 
        elevation={3} 
        component="form" 
        sx={{ 
          p: 2, 
          mt: 2,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 2
        }}
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="メッセージを入力..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={sending}
          size="small"
          autoFocus
          sx={{ mr: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
          disabled={!inputMessage.trim() || sending}
          type="submit"
        >
          送信
        </Button>
      </Paper>
    </Box>
  );
};

export default ClientChatComponent;
```

## バックエンド実装

### 1. クライアント検索機能

```typescript
// server/src/controllers/beauty-client.controller.ts

import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { Client } from '../models/Client';
import { ClientChat } from '../models/ClientChat';

export const searchClients = async (req: AuthRequest, res: Response) => {
  try {
    const { searchTerm, appointmentDate } = req.query;
    const organizationId = req.user?.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({
        success: false,
        error: { 
          code: 'UNAUTHORIZED',
          message: '組織IDが見つかりません'
        }
      });
    }
    
    // 日付指定がなければ当日
    const targetDate = appointmentDate 
      ? new Date(appointmentDate as string) 
      : new Date();
    
    // 当日の日付範囲
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // クライアント検索クエリ構築
    let query: any = { organizationId };
    
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm as string, $options: 'i' } },
        { phone: { $regex: searchTerm as string, $options: 'i' } },
        { email: { $regex: searchTerm as string, $options: 'i' } },
      ];
    }
    
    // 予約情報と併せて検索（MongoDB集約パイプライン）
    const clients = await Client.aggregate([
      { $match: query },
      // 予約情報とのルックアップ
      {
        $lookup: {
          from: 'appointments',
          let: { clientId: '$_id' },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ['$clientId', '$$clientId'] },
                    { $gte: ['$date', startOfDay] },
                    { $lt: ['$date', endOfDay] }
                  ]
                }
              }
            }
          ],
          as: 'appointments'
        }
      },
      // チャット履歴とのルックアップ（チャット履歴の有無を確認）
      {
        $lookup: {
          from: 'clientchats',
          let: { clientId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$clientId', '$$clientId'] } } }
          ],
          as: 'chats'
        }
      },
      // 変換
      {
        $project: {
          id: '$_id',
          name: 1,
          phone: 1,
          email: 1,
          birthdate: 1,
          hasSajuProfile: { $cond: [{ $ifNull: ['$birthdate', false] }, true, false] },
          hasChatHistory: { $cond: [{ $gt: [{ $size: '$chats' }, 0] }, true, false] },
          appointmentTime: { $arrayElemAt: ['$appointments.time', 0] }
        }
      }
    ]);
    
    res.json({
      success: true,
      clients
    });
  } catch (error) {
    console.error('Client search error:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'SEARCH_ERROR',
        message: 'クライアント検索中にエラーが発生しました'
      }
    });
  }
};
```

### 2. クライアント誕生日情報更新

```typescript
// server/src/controllers/beauty-client.controller.ts

import { SajuEngine } from '../services/saju-engine.service';

export const updateClientBirthInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const { 
      birthdate, 
      birthtime, 
      birthPlace = 'Tokyo', 
      gender, 
      explicitConsent 
    } = req.body;
    
    const organizationId = req.user?.organizationId;
    const stylistId = req.user?._id;
    
    // 必須パラメータチェック
    if (!birthdate || !gender) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: '生年月日と性別は必須です'
        }
      });
    }
    
    // 同意チェック
    if (!explicitConsent) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONSENT_REQUIRED',
          message: 'データ利用同意が必要です'
        }
      });
    }

    // クライアント存在確認
    const client = await Client.findOne({ 
      _id: clientId, 
      organizationId 
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: '指定されたクライアントが見つかりません'
        }
      });
    }
    
    // SajuEngineで四柱推命計算
    const sajuEngine = new SajuEngine();
    const sajuResult = await sajuEngine.calculateSaju({
      birthDate: new Date(birthdate),
      birthTime: birthtime || '12:00', // デフォルト時間
      birthPlace,
      gender,
      useInternationalMode: true // 国際対応モード
    });
    
    // クライアント情報を更新
    client.birthdate = new Date(birthdate);
    client.birthtime = birthtime;
    client.birthPlace = birthPlace;
    client.gender = gender;
    
    // 四柱推命情報を保存
    client.elementAttribute = sajuResult.mainElement;
    client.fourPillars = sajuResult.fourPillars;
    client.elementProfile = sajuResult.elementProfile;
    client.hasCompleteSajuProfile = true;
    
    // 同意日時と更新者を記録
    client.consentDate = new Date();
    client.updatedBy = stylistId;
    
    await client.save();
    
    // チャットセッションURLを生成
    const chatSessionUrl = `/api/v1/beauty-clients/${clientId}/chat`;
    
    res.json({
      success: true,
      message: 'クライアント情報を更新しました',
      clientId,
      chatSessionUrl
    });
  } catch (error) {
    console.error('Update client birth info error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'クライアント情報の更新中にエラーが発生しました'
      }
    });
  }
};
```

### 3. クライアントチャットセッション管理

```typescript
// server/src/controllers/beauty-client-chat.controller.ts

import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { Client } from '../models/Client';
import { ClientChat } from '../models/ClientChat';
import { DayPillar } from '../models/DayPillar';
import { OpenAIService } from '../services/openai.service';

// チャットセッション取得/作成
export const getClientChatSession = async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const organizationId = req.user?.organizationId;
    
    // クライアント検証
    const client = await Client.findOne({ 
      _id: clientId, 
      organizationId 
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: '指定されたクライアントが見つかりません'
        }
      });
    }
    
    // チャットセッション取得または作成
    let chatSession = await ClientChat.findOne({ 
      clientId, 
      organizationId 
    });
    
    // 存在しなければ新規作成
    if (!chatSession) {
      chatSession = new ClientChat({
        clientId,
        organizationId,
        messages: [],
        lastMessageAt: new Date()
      });
      
      await chatSession.save();
    }
    
    // 四柱推命コンテキスト情報の準備
    let sajuContext = null;
    
    if (client.hasCompleteSajuProfile) {
      // 当日の日柱取得
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayPillar = await DayPillar.findOne({
        date: { $gte: today, $lt: tomorrow }
      });
      
      // 性格特性を生成
      const personalityTraits = generatePersonalityTraits(
        client.elementAttribute,
        client.elementProfile
      );
      
      // コンテキスト情報を構築
      sajuContext = {
        clientName: client.name,
        elementAttribute: client.elementAttribute,
        dayMaster: client.fourPillars?.day?.heavenlyStem,
        personalityTraits,
        todayDayPillar: dayPillar ? {
          heavenlyStem: dayPillar.heavenlyStem,
          earthlyBranch: dayPillar.earthlyBranch,
          element: dayPillar.element
        } : null
      };
    }
    
    res.json({
      success: true,
      chatSession: {
        id: chatSession._id,
        clientId: chatSession.clientId,
        messageHistory: chatSession.messages,
        sajuContext
      }
    });
  } catch (error) {
    console.error('Get client chat session error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHAT_SESSION_ERROR',
        message: 'チャットセッションの取得中にエラーが発生しました'
      }
    });
  }
};

// クライアントチャットメッセージ送信
export const sendClientChatMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const { message } = req.body;
    const organizationId = req.user?.organizationId;
    const stylistId = req.user?._id;
    
    // メッセージ検証
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MESSAGE',
          message: 'メッセージが空または無効です'
        }
      });
    }
    
    // クライアント検証
    const client = await Client.findOne({ 
      _id: clientId, 
      organizationId 
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: '指定されたクライアントが見つかりません'
        }
      });
    }
    
    // チャットセッション取得または作成
    let chatSession = await ClientChat.findOne({ 
      clientId, 
      organizationId 
    });
    
    if (!chatSession) {
      chatSession = new ClientChat({
        clientId,
        organizationId,
        messages: [],
        lastMessageAt: new Date()
      });
    }
    
    // タイムスタンプ生成
    const timestamp = new Date();
    
    // 新しいメッセージ追加
    const newMessage = {
      role: 'stylist',
      content: message,
      timestamp,
      stylistId
    };
    
    chatSession.messages.push(newMessage);
    chatSession.lastMessageAt = timestamp;
    
    // システムコンテキスト構築（四柱推命情報を含む）
    let systemContext = '';
    
    if (client.hasCompleteSajuProfile) {
      // 当日の日柱取得
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayPillar = await DayPillar.findOne({
        date: { $gte: today, $lt: tomorrow }
      });
      
      // システムコンテキスト構築
      systemContext = buildClientSajuSystemContext(client, dayPillar);
    } else {
      // 四柱推命情報がない場合の基本コンテキスト
      systemContext = `
あなたは美容サロンの担当者「美姫命」として、クライアントに最適なヘアスタイルやカラーをアドバイスします。
クライアント情報：
- 名前: ${client.name}
`;
    }
    
    // OpenAI APIを使用してAI応答を生成
    const openAI = new OpenAIService();
    const aiResponse = await openAI.generateClientChatResponse(
      chatSession.messages,
      systemContext
    );
    
    // AI応答の追加
    if (aiResponse) {
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date()
      };
      
      chatSession.messages.push(assistantMessage);
      chatSession.lastMessageAt = new Date();
    }
    
    // チャットセッションを保存
    await chatSession.save();
    
    res.json({
      success: true,
      message: 'メッセージを送信しました',
      aiResponse: aiResponse ? {
        content: aiResponse.content,
        timestamp: new Date().toISOString()
      } : null,
      messages: chatSession.messages // 全メッセージ履歴を返す
    });
  } catch (error) {
    console.error('Send client chat message error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_MESSAGE_ERROR',
        message: 'メッセージの送信中にエラーが発生しました'
      }
    });
  }
};

// 性格特性生成ヘルパー関数
function generatePersonalityTraits(elementAttribute: string, elementProfile: any): string[] {
  const traits: string[] = [];
  
  switch (elementAttribute) {
    case 'wood':
      traits.push('成長志向', '活動的', '柔軟性がある');
      break;
    case 'fire':
      traits.push('情熱的', '社交的', '明るい');
      break;
    case 'earth':
      traits.push('安定志向', '思いやりがある', '責任感が強い');
      break;
    case 'metal':
      traits.push('完璧主義', '正確さを重視', '洗練された');
      break;
    case 'water':
      traits.push('直感的', '知的好奇心', '適応力がある');
      break;
    default:
      traits.push('個性的');
  }
  
  return traits;
}

// システムコンテキスト構築ヘルパー関数
function buildClientSajuSystemContext(client: any, dayPillar: any): string {
  // 五行属性の日本語名
  const elementToJapanese: Record<string, string> = {
    'wood': '木',
    'fire': '火',
    'earth': '土',
    'metal': '金',
    'water': '水'
  };
  
  const mainElement = elementToJapanese[client.elementAttribute] || '不明';
  const todayElement = dayPillar ? elementToJapanese[dayPillar.element] || '不明' : '不明';
  
  return `
あなたは美容サロンの担当者「美姫命」として、クライアントに最適なヘアスタイルやカラーをアドバイスします。
四柱推命の原理に基づいて、クライアントの命式情報から最適な提案を行ってください。

# クライアント情報
- 名前: ${client.name}
- 主要五行属性: ${mainElement}（${client.elementAttribute}）
- 性別: ${client.gender === 'M' ? '男性' : '女性'}
- 四柱:
  - 年柱: ${client.fourPillars?.year?.heavenlyStem || ''}${client.fourPillars?.year?.earthlyBranch || ''}
  - 月柱: ${client.fourPillars?.month?.heavenlyStem || ''}${client.fourPillars?.month?.earthlyBranch || ''}
  - 日柱: ${client.fourPillars?.day?.heavenlyStem || ''}${client.fourPillars?.day?.earthlyBranch || ''}
  - 時柱: ${client.fourPillars?.hour?.heavenlyStem || ''}${client.fourPillars?.hour?.earthlyBranch || ''}
- 五行バランス:
  ${Object.entries(client.elementProfile || {})
    .map(([element, value]) => `  - ${elementToJapanese[element] || element}: ${value}%`)
    .join('\n')}

# 本日の日柱情報
- 日柱: ${dayPillar?.heavenlyStem || ''}${dayPillar?.earthlyBranch || ''}
- 五行: ${todayElement}

# ${mainElement}の特性
- ヘアスタイル特性: ${getElementHairStyleCharacteristics(client.elementAttribute)}
- 相性の良い色: ${getElementGoodColors(client.elementAttribute)}
- 避けた方が良い色: ${getElementBadColors(client.elementAttribute)}

# 応答の心得
- クライアントからの質問に対して、四柱推命の原理に基づいたアドバイスをしてください
- 具体的で実現可能なヘアスタイルやカラーの提案をしてください
- 現代的なスタイルと四柱推命の知恵を組み合わせた提案をすることが重要です
- クライアントの質問が四柱推命や美容と関係ない場合は、丁寧に美容についての話題に戻してください
`;
}

// 五行属性別のヘアスタイル特徴ヘルパー関数
function getElementHairStyleCharacteristics(element: string): string {
  switch (element) {
    case 'wood':
      return '自然なシルエット、ナチュラルなテクスチャー、成長と変化を表現するスタイル';
    case 'fire':
      return '動きのあるスタイル、ボリュームとウェーブ、明るく華やかな印象を与えるデザイン';
    case 'earth':
      return '安定感のあるシルエット、まとまりのあるスタイル、自然な素材感を大切にしたデザイン';
    case 'metal':
      return '洗練されたシャープなシルエット、クリーンな質感、高級感と精密さを感じるスタイル';
    case 'water':
      return '流れるようなシルエット、柔らかな質感、適応性と変化を表現する自由なデザイン';
    default:
      return 'バランスのとれた汎用性の高いスタイル';
  }
}

// 五行属性別の相性の良い色ヘルパー関数
function getElementGoodColors(element: string): string {
  switch (element) {
    case 'wood':
      return 'ナチュラルグリーン、オリーブ、ミントカラー、明るいブラウン';
    case 'fire':
      return 'ワインレッド、バーガンディ、ローズ、コーラル、明るいオレンジ';
    case 'earth':
      return 'ベージュ、テラコッタ、マスタード、キャメル、アースカラー全般';
    case 'metal':
      return 'シルバー、プラチナ、ホワイト、アッシュ、明るいグレー';
    case 'water':
      return 'ブルー系、ネイビー、パープル、ダークブラウン、ブラック';
    default:
      return 'ナチュラルな色調';
  }
}

// 五行属性別の避けた方が良い色ヘルパー関数
function getElementBadColors(element: string): string {
  switch (element) {
    case 'wood':
      return '強すぎるシルバー、メタリックカラー、ゴールド';
    case 'fire':
      return '暗いブルー、ネイビー、ブラック';
    case 'earth':
      return '強すぎるグリーン、明るすぎるブルー';
    case 'metal':
      return '強すぎる赤、オレンジ、過度に明るいカラー';
    case 'water':
      return '強すぎるイエロー、オレンジ、ベージュ';
    default:
      return '極端な色調';
  }
}
```

### 4. OpenAIサービス実装

```typescript
// server/src/services/openai.service.ts

import { Configuration, OpenAIApi } from 'openai';
import { systemLogger } from '../utils/logger';

export class OpenAIService {
  private openai: OpenAIApi;
  
  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.openai = new OpenAIApi(configuration);
  }
  
  /**
   * クライアントチャット用の応答を生成
   */
  async generateClientChatResponse(
    messages: any[],
    systemContext: string
  ): Promise<{ content: string } | null> {
    try {
      // 過去メッセージの整形（最大15件）
      const recentMessages = messages.slice(-15);
      const formattedMessages = recentMessages.map(msg => ({
        role: msg.role === 'stylist' ? 'user' : 'assistant',
        content: msg.content
      }));
      
      // システムメッセージを先頭に追加
      const apiMessages = [
        {
          role: 'system',
          content: systemContext
        },
        ...formattedMessages
      ];
      
      // OpenAI API呼び出し
      const completion = await this.openai.createChatCompletion({
        model: 'gpt-4o',
        messages: apiMessages,
        max_tokens: 1000,
        temperature: 0.7,
      });
      
      const responseMessage = completion.data.choices[0]?.message?.content;
      
      if (!responseMessage) {
        throw new Error('OpenAI APIからの応答がありません');
      }
      
      return { content: responseMessage };
    } catch (error) {
      systemLogger.error('OpenAI API error:', error);
      return null;
    }
  }
  
  /**
   * トークン使用量を記録（サブスクリプションプラン管理用）
   */
  async recordTokenUsage(
    organizationId: string,
    userId: string,
    promptTokens: number,
    completionTokens: number
  ): Promise<void> {
    try {
      // ここでトークン使用量を記録するロジックを実装
      // （実際の実装は組織のサブスクリプションプランによって異なる）
    } catch (error) {
      systemLogger.error('Token usage recording error:', error);
    }
  }
}
```

### 5. APIルーティング設定

```typescript
// server/src/routes/beauty-client.routes.ts

import express from 'express';
import { 
  searchClients,
  updateClientBirthInfo,
  getClientDetails
} from '../controllers/beauty-client.controller';
import {
  getClientChatSession,
  sendClientChatMessage
} from '../controllers/beauty-client-chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// クライアント検索・詳細
router.get('/search', authenticate, searchClients);
router.get('/:clientId/details', authenticate, getClientDetails);

// 誕生日情報更新
router.put('/:clientId/birth-info', authenticate, updateClientBirthInfo);

// チャット関連
router.get('/:clientId/chat', authenticate, getClientChatSession);
router.post('/:clientId/chat', authenticate, sendClientChatMessage);

export default router;
```

## 実装優先順位

1. **本日の施術予定画面（beauty-daily-clients）の拡張**
   - クライアントカードの表示
   - チャット履歴有無の表示
   - 適切な遷移フロー設計

2. **クライアント検索/詳細API**
   - クライアント情報と予約情報の連携
   - チャット履歴の有無確認ロジック

3. **誕生日情報入力フォーム**
   - プライバシー配慮の同意取得
   - SajuEngineとの連携

4. **クライアントチャット機能**
   - 四柱推命コンテキストの自動設定
   - GPT-4oとの連携
   - メッセージの永続化

5. **バックエンドAPI実装**
   - データモデルの設計と実装
   - コントローラーの実装
   - OpenAI連携サービスの実装

## 注意点とリスク軽減

1. **プライバシー配慮**
   - 明示的な同意取得と記録
   - 同意手続きのわかりやすい説明
   - 同意日時を記録

2. **データの整合性**
   - クライアント情報更新時のバリデーション
   - サロン単位でのアクセス管理

3. **UX最適化**
   - ローディング状態の適切な表示
   - エラーメッセージの明確な表示
   - 動線の単純化

4. **パフォーマンス**
   - チャット履歴のページング
   - API呼び出しの最適化
   - 適切なキャッシュ戦略

## テスト計画

1. **ユニットテスト**
   - コントローラー関数の入力検証
   - ビジネスロジックの正確性検証

2. **統合テスト**
   - 誕生日情報入力からチャット画面遷移までの一連のフロー
   - 異なるステータスのクライアントへの対応

3. **UIテスト**
   - フォーム入力バリデーション
   - レスポンシブ表示

## 結論

この実装は、クライアント誕生日情報の収集を適切に行い、プライバシーに配慮しながら、パーソナライズされたチャットアドバイスを提供するものです。本日の施術予定画面からのスムーズな動線設計と、チャット履歴の有無に応じた分岐処理により、ユーザー体験を最適化します。

SajuEngineで計算した四柱推命データをチャットのシステムコンテキストとして活用することで、GPT-4oはクライアントに合わせたパーソナライズされたアドバイスを提供できます。この実装によって、美容サロンのスタイリストは最小限の労力で高品質な顧客体験を提供できるようになります。