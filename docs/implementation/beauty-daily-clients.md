# 「本日の施術クライアント一覧」実装ガイド（更新版）

## 1. 概要

「本日の施術クライアント一覧」機能は、美容師（スタイリスト）が当日担当するクライアントの予約情報を時間順にわかりやすく表示し、四柱推命情報と組み合わせた各種アドバイスを提供する画面です。今回の更新では、従来の「相性」表示からクライアント専用チャット機能へのアクセスを重視する変更を実装します。

## 2. 主要な変更点

1. 「相性」バッジの代わりに「専用チャットへ」ボタンを表示
2. 登録済みクライアントと未登録クライアントで異なるボタン表示とアクション
   - 登録済み：「専用チャットへ」ボタン → beauty-client-chat.htmlへ遷移
   - 未登録：「情報登録」ボタン → beauty-client-input.htmlへ遷移
3. クライアントのチャット履歴状態に基づいて適切な画面に誘導する処理の追加

## 3. フロントエンド実装

### 3.1 コンポーネント構成

```
BeautyDailyClients/
├── index.tsx                # メインコンポーネント
├── components/              # サブコンポーネント
│   ├── ClientCard.tsx       # クライアントカードを更新
│   ├── TimeSection.tsx      # 時間帯セクション（午前/午後/夜間）
│   ├── ClientDetailModal.tsx # クライアント詳細モーダル
│   └── ...
└── hooks/                   # カスタムフック
    ├── useDailyAppointments.ts # 日付別予約取得
    ├── useClientDetail.ts   # クライアント詳細取得
    ├── useClientChat.ts     # NEW: クライアントチャット状態確認用フック
    └── ...
```

### 3.2 ClientCard コンポーネント更新例

```tsx
// BeautyDailyClients/components/ClientCard.tsx
import React from 'react';
import { 
  Box, Paper, Typography, Button, 
  useTheme, Avatar
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ChatIcon from '@mui/icons-material/Chat';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { ClientAppointment } from '../../../shared/api.types';

interface ClientCardProps {
  appointment: ClientAppointment;
  onSelect: (clientId: string) => void;
  onRegister: (clientId: string) => void;
  onChatOpen: (clientId: string) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ 
  appointment, 
  onSelect,
  onRegister,
  onChatOpen
}) => {
  const theme = useTheme();
  const { client } = appointment;
  
  // 未登録クライアントかどうか
  const isUnregistered = client.registrationStatus === 'unregistered';
  
  return (
    <Paper
      elevation={1}
      sx={{
        display: 'flex',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.4s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: 5,
        }
      }}
    >
      {/* 時間表示部分 */}
      <Box
        sx={{
          minWidth: 70,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          p: '12px 8px',
        }}
      >
        <Typography variant="h6" fontWeight={700} color="text.primary">
          {appointment.startTime}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {appointment.startTime.split(':')[0] >= 12 ? 'PM' : 'AM'}
        </Typography>
      </Box>
      
      {/* クライアント情報 */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* プロフィール画像 */}
        <Avatar
          src={client.photoUrl}
          alt={client.name}
          sx={{ width: 56, height: 56, mr: 2 }}
        />
        
        {/* 詳細情報 */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {client.name}
            </Typography>
            
            {/* 未登録バッジ */}
            {isUnregistered && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  bgcolor: 'primary.50',
                  color: 'primary.dark',
                  px: 1,
                  py: 0.5,
                  borderRadius: 5,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  ml: 1,
                }}
              >
                <InfoIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                未登録
              </Box>
            )}
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {appointment.services.join('+')} | {appointment.duration}分
          </Typography>
          
          <Typography variant="body2" color="text.primary">
            {client.conversationTip}
          </Typography>
        </Box>
      </Box>
      
      {/* アクション部分 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: '12px 8px',
        }}
      >
        <Button
          onClick={() => onSelect(client.id)}
          sx={{
            minWidth: 40,
            width: 40,
            height: 40,
            borderRadius: '50%',
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'grey.100',
              color: 'primary.main',
            }
          }}
        >
          <VisibilityIcon />
        </Button>
        
        {/* 相性バッジをチャット/登録ボタンに変更 */}
        {isUnregistered ? (
          // 未登録クライアント用ボタン
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<PersonAddIcon />}
            onClick={() => onRegister(client.id)}
            sx={{
              mt: 1,
              borderRadius: 5,
              fontSize: '0.75rem',
              textTransform: 'none',
              whiteSpace: 'nowrap',
              py: 0.5,
              px: 1,
              minWidth: 'auto',
              bgcolor: 'primary.50',
              '&:hover': {
                bgcolor: 'primary.100',
                transform: 'translateY(-2px)',
                boxShadow: 2,
              }
            }}
          >
            情報登録
          </Button>
        ) : (
          // 登録済みクライアント用ボタン
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<ChatIcon />}
            onClick={() => onChatOpen(client.id)}
            sx={{
              mt: 1,
              borderRadius: 5,
              fontSize: '0.75rem',
              textTransform: 'none',
              whiteSpace: 'nowrap',
              py: 0.5,
              px: 1,
              minWidth: 'auto',
              bgcolor: 'primary.50',
              '&:hover': {
                bgcolor: 'primary.100',
                transform: 'translateY(-2px)',
                boxShadow: 2,
              }
            }}
          >
            専用チャットへ
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ClientCard;
```

### 3.3 クライアントチャット状態フック

```typescript
// BeautyDailyClients/hooks/useClientChat.ts
import { useQuery } from '@tanstack/react-query';
import { clientService } from '../../../services/client.service';
import { ClientChatHistoryCheck } from '../../../shared/api.types';

export const useClientChatHistory = (clientId: string | null) => {
  return useQuery<ClientChatHistoryCheck, Error>({
    queryKey: ['client-chat-history', clientId],
    queryFn: () => clientId 
      ? clientService.checkClientChatHistory(clientId) 
      : Promise.reject('No client ID'),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });
};
```

### 3.4 メインコンポーネント更新例

```tsx
// BeautyDailyClients/index.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// ... 他のインポート

const BeautyDailyClients: React.FC = () => {
  // ... 既存のステート

  // クライアント詳細を表示
  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
    setIsModalOpen(true);
  };
  
  // 未登録クライアントの登録画面へ
  const handleRegisterClient = (clientId: string) => {
    // クライアント情報を渡して登録画面へ遷移
    navigate(`/beauty-client-input?clientId=${clientId}`);
  };
  
  // クライアント専用チャット画面へ
  const handleChatOpen = (clientId: string) => {
    // すでにチャット履歴がある場合のみチェック
    clientService.checkClientChatHistory(clientId)
      .then(result => {
        // 結果に関わらずチャット画面に遷移（APIは履歴の有無を記録するため）
        navigate(`/beauty-client-chat?clientId=${clientId}`);
      })
      .catch(err => {
        console.error('チャット履歴確認エラー:', err);
        // エラー時でもチャット画面に遷移（新規セッション作成として扱う）
        navigate(`/beauty-client-chat?clientId=${clientId}`);
      });
  };
  
  // ... 残りのコンポーネント実装

  return (
    // ... 既存のJSX
    <TimeSection
      title="午前の予約"
      icon="wb_sunny"
      appointments={data.appointments.morning.appointments}
      onClientSelect={handleClientSelect}
      onRegisterClient={handleRegisterClient}
      onChatOpen={handleChatOpen} // 新規追加
    />
    // ... 他のセクション
  );
};

export default BeautyDailyClients;
```

### 3.5 TimeSection コンポーネント更新例

```tsx
// BeautyDailyClients/components/TimeSection.tsx
import React from 'react';
// ... 他のインポート
import ClientCard from './ClientCard';
import { ClientAppointment } from '../../../shared/api.types';

interface TimeSectionProps {
  title: string;
  icon: string;
  appointments: ClientAppointment[];
  onClientSelect: (clientId: string) => void;
  onRegisterClient: (clientId: string) => void;
  onChatOpen: (clientId: string) => void; // 新規追加
}

const TimeSection: React.FC<TimeSectionProps> = ({
  title,
  icon,
  appointments,
  onClientSelect,
  onRegisterClient,
  onChatOpen
}) => {
  // ... その他の実装
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          color: 'primary.dark',
          fontWeight: 600,
        }}
      >
        <Icon sx={{ mr: 1 }}>{icon}</Icon>
        {title}
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {appointments.map((appointment) => (
          <ClientCard
            key={appointment.id}
            appointment={appointment}
            onSelect={onClientSelect}
            onRegister={onRegisterClient}
            onChatOpen={onChatOpen} // 新規追加
          />
        ))}
      </Box>
    </Box>
  );
};

export default TimeSection;
```

### 3.6 サービス実装更新例

```typescript
// services/client.service.ts
import { apiService } from './api.service';
import { API_PATHS, ClientDetailResponse, ClientChatHistoryCheck } from '../shared/api.types';

class ClientService {
  // ... 既存のメソッド
  
  /**
   * クライアントのチャット履歴を確認
   */
  async checkClientChatHistory(clientId: string): Promise<ClientChatHistoryCheck> {
    const url = API_PATHS.CLIENT_CHAT_HISTORY.replace(':clientId', clientId);
    return await apiService.get<ClientChatHistoryCheck>(url);
  }
}

export const clientService = new ClientService();
```

## 4. バックエンド実装

### 4.1 クライアントチャットコントローラー更新

```typescript
// src/controllers/chat.controller.ts
import { Request, Response } from 'express';
import { ChatHistory } from '../models/ChatHistory';

// クライアントのチャット履歴を確認
export const checkClientChatHistory = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    
    // チャット履歴を確認
    const chatHistory = await ChatHistory.find({ 
      clientId,
      organizationId: req.user.organizationId
    }).sort({ timestamp: -1 }).limit(1);
    
    // 履歴の有無とメッセージ数を確認
    const hasHistory = chatHistory.length > 0;
    let messageCount = 0;
    let lastMessageTimestamp = null;
    
    if (hasHistory) {
      // メッセージ数を集計
      messageCount = await ChatHistory.countDocuments({
        clientId,
        organizationId: req.user.organizationId
      });
      
      // 最後のメッセージタイムスタンプを取得
      lastMessageTimestamp = chatHistory[0].timestamp;
    }
    
    res.status(200).json({
      clientId,
      hasHistory,
      lastMessageTimestamp: lastMessageTimestamp ? lastMessageTimestamp.toISOString() : null,
      messageCount
    });
  } catch (error) {
    console.error('Error checking client chat history:', error);
    res.status(500).json({ error: 'Failed to check client chat history' });
  }
};
```

### 4.2 チャットルーティング更新

```typescript
// src/routes/chat.routes.ts
import express from 'express';
import { createChat, getChatHistory, checkClientChatHistory } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// ... 既存のルート

// クライアントのチャット履歴を確認
router.get('/client/:clientId/history/check', authMiddleware, checkClientChatHistory);

export default router;
```

## 5. 実装上の注意点

### 5.1 チャットボタンの振る舞い

1. **視覚的な明確性**
   - チャットボタンは十分な大きさと視認性を持たせる
   - 未登録クライアントは「情報登録」として明確に区別
   - クライアントカードの視覚的階層を保ち、主要情報が埋もれないよう注意

2. **操作性**
   - モバイル環境での操作性を考慮し、タップ領域を十分に確保
   - ボタンのホバーエフェクトでインタラクティブ性を視覚化
   - 色や形で機能を直感的に伝える（チャットアイコンの使用など）

### 5.2 パフォーマンス最適化

1. **チャット履歴確認の最適化**
   - チャット履歴確認はボタンクリック時のみ実行（事前一括取得はしない）
   - 履歴確認中にもUI応答性を確保するため非同期処理
   - チャット履歴の確認結果をキャッシュ（React Queryの活用）

2. **遷移の高速化**
   - クライアント情報のプリフェッチでチャット初期表示を高速化
   - チャット履歴の確認と画面遷移を並行処理

### 5.3 エラーハンドリング

1. **チャット履歴確認エラー**
   - 履歴確認がエラーの場合も新規チャットとして扱い、UXを妨げない
   - エラーログは詳細に記録するが、ユーザーへの表示は最小限に

2. **未登録クライアント対応**
   - 必須情報が不足している場合は登録画面で明示
   - 登録完了後の自動チャット画面遷移を担保

### 5.4 セキュリティ配慮

1. **認証とアクセス制御**
   - チャット履歴確認APIも認証ミドルウェアを適用
   - 組織（サロン）単位でのクライアントチャットデータ分離の徹底

2. **チャットデータ保護**
   - チャット履歴へのアクセスを適切に制限
   - 履歴確認APIでは最小限の情報のみを返却

## 6. テスト戦略

### 6.1 フロントエンドテスト

1. **ボタン挙動のテスト**
   - 登録済み/未登録クライアントでの正しいボタン表示確認
   - クリックイベントでの正しい画面遷移確認

2. **エラー状態のテスト**
   - チャット履歴確認APIがエラーを返した場合の対応確認
   - ネットワーク途絶時の振る舞い確認

### 6.2 バックエンドテスト

1. **チャット履歴確認APIテスト**
   - 履歴があるケースと無いケースの両方を検証
   - 不正なクライアントIDに対する適切なエラーレスポンス
   - 認証切れや権限不足時の403エラー返却確認

2. **パフォーマンステスト**
   - 大量のチャット履歴がある場合の応答時間確認
   - 複数の並行リクエスト処理に問題がないか確認

## 7. リリース前チェックリスト

- [ ] チャット履歴確認APIの動作確認
- [ ] 未登録クライアントから登録→チャットへの遷移フロー確認
- [ ] 登録済みクライアントのチャットボタン動作確認
- [ ] モバイル/タブレット両方での表示・操作確認
- [ ] オフライン動作確認
- [ ] コンポーネントのアクセシビリティ確認
- [ ] パフォーマンス（応答性）確認

## 8. 注意すべき考慮事項

1. **チャット統合型フロー**
   - クライアント情報登録からチャット画面への自然な遷移
   - チャット画面では対象クライアントの情報を適切に表示

2. **メンテナンス性**
   - コンポーネント間の責務分離の徹底
   - 変更の影響範囲を最小限に抑える設計
   - チャット関連機能の拡張性を確保

3. **UI一貫性**
   - 既存の美容師向けアプリケーションのデザイン言語に準拠
   - チャットボタンは他の操作と視覚的に区別しつつも調和させる