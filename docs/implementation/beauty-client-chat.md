# 美容クライアントチャット実装ガイド

## 概要

美容クライアントチャットは、美容師がクライアント（お客様）に四柱推命情報に基づいたパーソナライズされた美容アドバイスを提供するための専用チャットインターフェースです。このドキュメントでは、同機能の実装における重要なポイントとベストプラクティスを提供します。

## 実装戦略

### 1. コアアーキテクチャ

#### バックエンド構成

```
server/
├── src/
│   ├── controllers/
│   │   └── beauty/
│   │       ├── client-chat.controller.ts   # クライアントチャットコントローラ
│   │       └── client-note.controller.ts   # クライアントメモコントローラ
│   ├── models/
│   │   ├── BeautyClientChat.ts             # クライアントチャットモデル
│   │   └── ClientNote.ts                   # クライアントメモモデル
│   ├── routes/
│   │   └── beauty-client-chat.routes.ts    # ルート定義
│   ├── services/
│   │   ├── beauty/
│   │   │   └── client-chat.service.ts      # クライアントチャットサービス
│   │   ├── chat/
│   │   │   ├── beauty-chat-context.ts      # 美容チャットコンテキストビルダー
│   │   │   └── beauty-prompt-builder.ts    # 美容プロンプトビルダー
```

#### フロントエンド構成

```
client/
├── src/
│   ├── components/
│   │   ├── beauty/
│   │   │   ├── ClientChatContainer.tsx     # チャットコンテナ
│   │   │   ├── ClientChatHeader.tsx        # チャットヘッダー
│   │   │   ├── ClientChatInput.tsx         # チャット入力
│   │   │   ├── ClientChatMessageList.tsx   # メッセージリスト
│   │   │   ├── StyleSuggestionCard.tsx     # スタイル提案カード
│   │   │   └── ClientInfoBar.tsx           # クライアント情報バー
│   ├── services/
│   │   └── beauty-client-chat.service.ts   # チャットサービス
│   ├── pages/
│   │   └── BeautyClientChat/
│   │       └── index.tsx                   # チャットページ
```

### 2. データフロー最適化

#### バックエンドフロー

1. **初期リクエスト処理**:
   - APIリクエストを受信（clientId付き）
   - クライアント情報とSaju情報の取得（並行処理）
   - 日柱情報の取得
   - 組織のトークン使用状況確認

2. **コンテキスト構築**:
   - 四柱推命情報の整形
   - 当日の日柱情報の統合
   - クライアント履歴情報の追加
   - システムメッセージの生成

3. **レスポンス処理**:
   - 非ストリーミングモード: 完全なレスポンスを待って返す
   - ストリーミングモード: SSEストリームを初期化し、チャンク送信

#### フロントエンドフロー

1. **UIレンダリング**:
   - クライアント選択時にチャット初期化
   - プレースホルダーUIの即時表示
   - データロード完了後に完全UIに置換

2. **メッセージ処理**:
   - 送信メッセージを即時表示
   - タイピングインジケータ表示
   - ストリーミングレスポンスのスムーズな表示
   - スタイル提案セクションの強調表示

### 3. 実装優先順位

1. **第1段階**: 基本機能実装
   - クライアントチャットモデル定義
   - シンプルなチャットUIの作成
   - 基本的なメッセージ送受信機能
   - 四柱情報統合（システムメッセージ）

2. **第2段階**: 体験向上
   - ストリーミングレスポンスの実装
   - スタイル提案カードのUI強化
   - クライアント情報バーの追加
   - 音声入力インターフェース統合

3. **第3段階**: 機能拡張
   - メモ追加機能
   - レスポンス分析と構造化
   - 施術履歴との連携
   - トークン使用量の監視と警告

### 4. パフォーマンス最適化

1. **データベースクエリ最適化**:
   - 必要なフィールドのみプロジェクション
   - コンパウンドインデックスの活用
   - クエリの実行計画分析と改善

2. **キャッシング戦略**:
   - 日柱情報のキャッシング（24時間TTL）
   - クライアント基本情報のキャッシング（短時間TTL）
   - 共有リソースのメモリキャッシュ

3. **レスポンスサイズ削減**:
   - 履歴取得時のページネーション
   - 不要な重複データの省略
   - 初期取得メッセージ数の最適化（最新10件）

## 実装詳細

### 1. モデル実装

#### BeautyClientChat モデル

```typescript
// server/src/models/BeautyClientChat.ts
import mongoose, { Document, Schema } from 'mongoose';

/**
 * チャットメッセージのインターフェース
 */
export interface IBeautyClientChatMessage {
  sender: 'user' | 'assistant';
  senderId?: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  additionalContext?: Record<string, any>;
}

/**
 * クライアントチャットモデルのインターフェース
 */
export interface IBeautyClientChat {
  organizationId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  lastMessageAt: Date;
  tokenCount: number;
  aiModel: string;
  contextData: Record<string, any>;
  messages: IBeautyClientChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IBeautyClientChatDocument extends IBeautyClientChat, Document {}

/**
 * チャットメッセージスキーマ定義
 */
const clientChatMessageSchema = new Schema<IBeautyClientChatMessage>(
  {
    sender: {
      type: String,
      enum: ['user', 'assistant'],
      required: [true, '送信者は必須です']
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    content: {
      type: String,
      required: [true, 'メッセージ内容は必須です']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    tokenUsage: {
      prompt: Number,
      completion: Number,
      total: Number
    },
    additionalContext: Schema.Types.Mixed
  },
  {
    _id: false
  }
);

/**
 * クライアントチャットスキーマ定義
 */
const beautyClientChatSchema = new Schema<IBeautyClientChatDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      required: [true, '組織IDは必須です'],
      index: true
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'BeautyClient',
      required: [true, 'クライアントIDは必須です'],
      index: true
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    tokenCount: {
      type: Number,
      default: 0,
      min: [0, 'トークン数は0以上である必要があります'],
      index: true
    },
    aiModel: {
      type: String,
      enum: ['gpt-4o', 'claude-3-opus', 'claude-3-sonnet'],
      default: 'gpt-4o'
    },
    contextData: {
      type: Schema.Types.Mixed,
      default: {}
    },
    messages: {
      type: [clientChatMessageSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// バリデーション
beautyClientChatSchema.pre('validate', function(next) {
  // 必要なバリデーション追加
  next();
});

// インデックス
beautyClientChatSchema.index({ organizationId: 1, clientId: 1 });
beautyClientChatSchema.index({ clientId: 1, lastMessageAt: -1 });
beautyClientChatSchema.index({ organizationId: 1, lastMessageAt: -1 });

/**
 * クライアントチャットモデル
 */
export const BeautyClientChat = mongoose.model<IBeautyClientChatDocument>(
  'BeautyClientChat',
  beautyClientChatSchema
);
```

### 2. サービス実装

#### クライアントチャットサービス

```typescript
// server/src/services/beauty/client-chat.service.ts
import { BeautyClientChat } from '../../models/BeautyClientChat';
import { BeautyClient } from '../../models/BeautyClient';
import { DayPillar } from '../../models/DayPillar';
import { User } from '../../models/User';
import { ValidationError } from '../../utils/error-handler';
import { buildClientChatSystemMessage } from '../chat/beauty-prompt-builder';

export class BeautyClientChatService {
  /**
   * クライアントチャット履歴を取得する
   */
  async getClientChatHistory(clientId: string, userId: string, organizationId: string, options: any = {}) {
    const { limit = 10, offset = 0 } = options;
    
    // クライアント情報の取得と権限確認
    const client = await BeautyClient.findOne({
      _id: clientId,
      organizationId
    });
    
    if (!client) {
      throw new ValidationError('クライアントが見つからないか、アクセス権限がありません');
    }
    
    // チャット履歴の取得
    let clientChat = await BeautyClientChat.findOne({
      clientId,
      organizationId
    });
    
    // 履歴がない場合は新規作成
    if (!clientChat) {
      // 今日の日柱情報取得
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDayPillar = await DayPillar.findOne({
        date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      });
      
      // 四柱推命情報とクライアント情報を収集
      const clientContextData = await this.buildClientContextData(client, todayDayPillar);
      
      // 新規チャット作成
      clientChat = new BeautyClientChat({
        clientId,
        organizationId,
        contextData: clientContextData,
        messages: [{
          sender: 'assistant',
          content: 'こんにちは。今日のヘアスタイルやカラーについて何かご提案できることはありますか？',
          timestamp: new Date()
        }],
        lastMessageAt: new Date(),
        aiModel: 'gpt-4o'
      });
      
      await clientChat.save();
    }
    
    // ページネーションされたメッセージ情報を返す
    const totalMessages = clientChat.messages.length;
    const paginatedMessages = clientChat.messages
      .slice(-Math.min(totalMessages, limit + offset))
      .slice(Math.max(0, totalMessages - limit - offset));
    
    return {
      clientChat: {
        id: clientChat._id,
        clientId: clientChat.clientId,
        clientName: client.name,
        messages: paginatedMessages,
        createdAt: clientChat.createdAt,
        lastMessageAt: clientChat.lastMessageAt
      },
      contextData: clientChat.contextData,
      pagination: {
        total: totalMessages,
        limit,
        offset,
        hasMore: offset + limit < totalMessages
      }
    };
  }
  
  /**
   * メッセージを送信する
   */
  async sendMessage(clientId: string, userId: string, organizationId: string, message: string, additionalContext?: any) {
    // クライアント情報の取得と権限確認
    const client = await BeautyClient.findOne({
      _id: clientId,
      organizationId
    });
    
    if (!client) {
      throw new ValidationError('クライアントが見つからないか、アクセス権限がありません');
    }
    
    // チャット履歴取得または作成
    let clientChat = await BeautyClientChat.findOne({
      clientId,
      organizationId
    });
    
    if (!clientChat) {
      clientChat = await this.initializeClientChat(client, organizationId);
    }
    
    // 送信者情報の取得
    const sender = await User.findById(userId).select('name');
    
    // 今日の日柱情報確認と更新
    await this.updateTodayDayPillar(clientChat);
    
    // ユーザーメッセージの追加
    const userMessage = {
      sender: 'user' as const,
      senderId: userId,
      content: message,
      timestamp: new Date(),
      additionalContext
    };
    
    clientChat.messages.push(userMessage);
    clientChat.lastMessageAt = new Date();
    
    // システムメッセージの構築
    const systemMessage = buildClientChatSystemMessage(
      clientChat.contextData.sajuProfile,
      clientChat.contextData.todayDayPillar,
      clientChat.contextData.clientProfile,
      clientChat.contextData.visitHistory
    );
    
    // 履歴メッセージの準備（最新10件）
    const historyMessages = clientChat.messages
      .slice(-10)
      .map(msg => ({
        role: msg.sender,
        content: msg.content
      }));
    
    // OpenAI APIリクエストの準備
    const openaiMessages = [
      { role: 'system', content: systemMessage },
      ...historyMessages
    ];
    
    // AIレスポンス取得
    const aiResponse = await this.getAIResponse(openaiMessages, clientChat.aiModel);
    
    // AIメッセージの追加
    const aiMessage = {
      sender: 'assistant' as const,
      content: aiResponse.message,
      timestamp: new Date(),
      tokenUsage: {
        prompt: aiResponse.tokenUsage.prompt,
        completion: aiResponse.tokenUsage.completion,
        total: aiResponse.tokenUsage.total
      }
    };
    
    clientChat.messages.push(aiMessage);
    
    // トークン使用量の更新
    clientChat.tokenCount += aiResponse.tokenUsage.total;
    
    // 保存
    await clientChat.save();
    
    // レスポンスの構築
    return {
      aiMessage: aiResponse.message,
      timestamp: aiMessage.timestamp.toISOString(),
      chatHistory: {
        id: clientChat._id,
        messages: clientChat.messages.slice(-2) // 最新の2件（ユーザーとAI）のみ返す
      },
      tokenUsage: aiMessage.tokenUsage
    };
  }
  
  /**
   * ストリーミングメッセージを送信する
   */
  async streamMessage(clientId: string, userId: string, organizationId: string, message: string, additionalContext?: any) {
    // 基本チェックと初期化
    const client = await BeautyClient.findOne({
      _id: clientId,
      organizationId
    });
    
    if (!client) {
      throw new ValidationError('クライアントが見つからないか、アクセス権限がありません');
    }
    
    // チャット履歴取得または作成
    let clientChat = await BeautyClientChat.findOne({
      clientId,
      organizationId
    });
    
    if (!clientChat) {
      clientChat = await this.initializeClientChat(client, organizationId);
    }
    
    // 今日の日柱情報確認と更新
    await this.updateTodayDayPillar(clientChat);
    
    // ユーザーメッセージの追加
    const userMessage = {
      sender: 'user' as const,
      senderId: userId,
      content: message,
      timestamp: new Date(),
      additionalContext
    };
    
    clientChat.messages.push(userMessage);
    clientChat.lastMessageAt = new Date();
    await clientChat.save();
    
    // システムメッセージの構築
    const systemMessage = buildClientChatSystemMessage(
      clientChat.contextData.sajuProfile,
      clientChat.contextData.todayDayPillar,
      clientChat.contextData.clientProfile,
      clientChat.contextData.visitHistory
    );
    
    // 履歴メッセージの準備（最新10件）
    const historyMessages = clientChat.messages
      .slice(-10)
      .map(msg => ({
        role: msg.sender,
        content: msg.content
      }));
    
    // OpenAI APIリクエストの準備
    const openaiMessages = [
      { role: 'system', content: systemMessage },
      ...historyMessages
    ];
    
    // ストリーミングセッション情報を返す
    return {
      sessionId: clientChat._id.toString(),
      messages: openaiMessages,
      model: clientChat.aiModel
    };
  }
  
  // 残りのヘルパーメソッド実装...
}
```

### 3. コントローラ実装

```typescript
// server/src/controllers/beauty/client-chat.controller.ts
import { Request, Response } from 'express';
import { BeautyClientChatService } from '../../services/beauty/client-chat.service';
import { handleError } from '../../utils/error-handler';

const clientChatService = new BeautyClientChatService();

export const getClientChatHistory = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.query;
    const { id: userId, organizationId } = req.user as any;
    const { limit, offset } = req.query;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'クライアントIDは必須です'
        }
      });
    }
    
    const result = await clientChatService.getClientChatHistory(
      clientId as string,
      userId,
      organizationId,
      {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      }
    );
    
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    return handleError(error, req, res);
  }
};

export const sendClientChatMessage = async (req: Request, res: Response) => {
  try {
    const { clientId, message, additionalContext } = req.body;
    const { id: userId, organizationId } = req.user as any;
    
    if (!clientId || !message) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'クライアントIDとメッセージは必須です'
        }
      });
    }
    
    const result = await clientChatService.sendMessage(
      clientId,
      userId,
      organizationId,
      message,
      additionalContext
    );
    
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    return handleError(error, req, res);
  }
};

export const streamClientChatMessage = async (req: Request, res: Response) => {
  try {
    const { clientId, message, additionalContext } = req.body;
    const { id: userId, organizationId } = req.user as any;
    
    if (!clientId || !message) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'クライアントIDとメッセージは必須です'
        }
      });
    }
    
    // SSEヘッダーの設定
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // ストリーミングセッション初期化
    const session = await clientChatService.streamMessage(
      clientId,
      userId,
      organizationId,
      message,
      additionalContext
    );
    
    // SSEスタートイベント
    res.write(`data: ${JSON.stringify({
      event: 'start',
      sessionId: session.sessionId
    })}\n\n`);
    
    // ストリーミング処理の実行
    await clientChatService.processStreamingChat(
      session,
      (chunk) => {
        // チャンクイベント送信
        res.write(`data: ${JSON.stringify({
          event: 'chunk',
          text: chunk
        })}\n\n`);
      },
      (tokenUsage) => {
        // 完了イベント送信
        res.write(`data: ${JSON.stringify({
          event: 'end',
          tokenUsage
        })}\n\n`);
        
        // ストリームを閉じる
        res.end();
      },
      (error) => {
        // エラーイベント送信
        res.write(`data: ${JSON.stringify({
          event: 'error',
          error: error.message
        })}\n\n`);
        
        // ストリームを閉じる
        res.end();
      }
    );
  } catch (error) {
    return handleError(error, req, res);
  }
};
```

### 4. フロントエンド実装

#### クライアントチャットコンテナ（主要コンポーネント）

```tsx
// client/src/components/beauty/ClientChatContainer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { beautyClientChatService } from '../../services/beauty-client-chat.service';
import ClientChatHeader from './ClientChatHeader';
import ClientChatMessageList from './ClientChatMessageList';
import ClientChatInput from './ClientChatInput';
import ClientInfoBar from './ClientInfoBar';

interface ClientChatContainerProps {
  clientId: string;
  clientName: string;
  onBack?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const ClientChatContainer: React.FC<ClientChatContainerProps> = ({
  clientId,
  clientName,
  onBack
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [clientContext, setClientContext] = useState<any>(null);
  
  const streamContentRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 初期ロード
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await beautyClientChatService.getClientChatHistory(clientId);
        
        if (response.success) {
          setMessages(response.clientChatHistory.messages);
          setClientContext(response.contextData);
        } else {
          setError('チャット履歴の取得に失敗しました');
        }
      } catch (error: any) {
        setError(error.message || 'チャットの初期化に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeChat();
  }, [clientId]);
  
  // スクロール処理
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // メッセージ送信
  const handleSendMessage = async (message: string, additionalContext?: any) => {
    if (!message.trim()) return;
    
    try {
      // ユーザーメッセージを即時表示
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setIsSending(true);
      setError(null);
      
      // AI応答メッセージのプレースホルダー
      const assistantMessagePlaceholder: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessagePlaceholder]);
      
      // ストリーミングコンテンツをリセット
      streamContentRef.current = '';
      
      // ストリーミングコールバックを設定
      beautyClientChatService.setStreamCallback((chunk) => {
        streamContentRef.current += chunk;
        
        // UIを更新
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = streamContentRef.current;
          }
          return newMessages;
        });
      });
      
      // メッセージを送信
      const response = await beautyClientChatService.sendClientChatMessage(
        clientId,
        message,
        additionalContext
      );
      
      // ストリーミングコールバックをクリア
      beautyClientChatService.clearStreamCallback();
      
      // 非ストリーミングの場合の処理
      if (response.success && streamContentRef.current === '') {
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
    } catch (error: any) {
      setError(error.message || 'メッセージの送信に失敗しました');
      
      // エラー時にプレースホルダーを削除
      setMessages(prev => prev.filter(msg => msg.content !== ''));
    } finally {
      setIsSending(false);
      
      // ストリーミングコールバックを確実にクリア
      beautyClientChatService.clearStreamCallback();
    }
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <ClientChatHeader
        clientName={clientName}
        onBack={onBack}
      />
      
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* エラーメッセージ */}
          {error && (
            <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
              <Typography variant="body2">{error}</Typography>
            </Box>
          )}
          
          {/* メッセージリスト */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ClientChatMessageList messages={messages} />
            )}
            <div ref={messagesEndRef} />
          </Box>
          
          {/* 入力フォーム */}
          <ClientChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading || isSending}
          />
        </Box>
        
        {/* クライアント情報サイドバー */}
        {clientContext && (
          <ClientInfoBar
            clientInfo={clientContext.clientProfile}
            sajuProfile={clientContext.sajuProfile}
            todayDayPillar={clientContext.todayDayPillar}
          />
        )}
      </Box>
    </Box>
  );
};

export default ClientChatContainer;
```

### 5. APIルート定義

```typescript
// server/src/routes/beauty-client-chat.routes.ts
import express from 'express';
import * as clientChatController from '../controllers/beauty/client-chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// 認証ミドルウェアを適用
router.use(authenticate);

// クライアントチャット履歴の取得
router.get(
  '/history',
  clientChatController.getClientChatHistory
);

// クライアントチャットメッセージの送信
router.post(
  '/message',
  clientChatController.sendClientChatMessage
);

// クライアントチャットストリーミングメッセージの送信
router.post(
  '/stream-message',
  clientChatController.streamClientChatMessage
);

export default router;
```

## パフォーマンスと最適化

### 1. データベースアクセス最適化

- **最小限のプロジェクション**:
  ```typescript
  const client = await BeautyClient.findById(clientId)
    .select('name gender birthdate birthtime sajuProfileId')
    .lean();
  ```

- **複合クエリの使用**:
  ```typescript
  const clientChat = await BeautyClientChat.findOne({
    clientId,
    organizationId
  }).sort({ lastMessageAt: -1 });
  ```

- **バッチ処理の活用**:
  ```typescript
  // 並行クエリの実行
  const [client, todayDayPillar] = await Promise.all([
    BeautyClient.findById(clientId).lean(),
    DayPillar.findOne({ date: { $gte: today, $lt: tomorrow } }).lean()
  ]);
  ```

### 2. フロントエンド最適化

- **レンダリング最適化**:
  ```typescript
  // メッセージ再レンダリングの最小化
  const memoizedMessages = useMemo(() => {
    return messages.map(msg => ({
      ...msg,
      formattedTime: formatTime(msg.timestamp)
    }));
  }, [messages]);
  ```

- **ストリーミングの効率化**:
  ```typescript
  // 効率的なストリーミング更新
  const updateStreamContent = useCallback((chunk: string) => {
    streamContentRef.current += chunk;
    setLastChunkTime(Date.now());
    
    if (Date.now() - lastRenderTime.current > 100) {
      // 100ms以上経過していれば更新
      updateAssistantMessage(streamContentRef.current);
      lastRenderTime.current = Date.now();
    }
  }, []);
  ```

- **メモリ使用量の最適化**:
  ```typescript
  // 大量のメッセージ履歴を効率的に処理
  useEffect(() => {
    // 表示されるメッセージのみを保持
    const visibleMessages = messages.slice(-50);
    setVisibleMessages(visibleMessages);
    
    // スクロール位置の復元が必要な場合
    if (shouldRestoreScroll) {
      restoreScrollPosition();
    }
  }, [messages, shouldRestoreScroll]);
  ```

## エラー処理

### 1. エラーの階層化

```typescript
// サービス層での詳細なエラーハンドリング
try {
  // 処理
} catch (error) {
  if (error.name === 'CastError') {
    throw new ValidationError('無効なID形式です');
  } else if (error.name === 'ValidationError') {
    throw new ValidationError(error.message);
  } else if (error.code === 11000) {
    throw new ValidationError('重複するデータが存在します');
  } else if (error.response?.status === 429) {
    throw new RateLimitError('APIリクエスト制限に達しました');
  } else {
    // その他未分類エラー
    console.error('未分類エラー:', error);
    throw new ServerError('サーバー内部エラーが発生しました');
  }
}
```

### 2. フロントエンドエラー処理

```typescript
// エラーメッセージコンポーネント
const ErrorMessage = ({ error, onRetry }) => {
  // エラータイプに基づいて異なるメッセージを表示
  const getErrorMessage = () => {
    if (error.includes('APIリクエスト制限')) {
      return {
        title: 'APIリクエスト制限に達しました',
        message: 'しばらく待ってから再試行するか、サブスクリプションをアップグレードしてください',
        action: 'アップグレード'
      };
    } else if (error.includes('ネットワーク')) {
      return {
        title: 'ネットワークエラー',
        message: 'インターネット接続を確認して再試行してください',
        action: '再試行'
      };
    } else {
      return {
        title: 'エラーが発生しました',
        message: error,
        action: '再試行'
      };
    }
  };
  
  const errorInfo = getErrorMessage();
  
  return (
    <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1, my: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold">{errorInfo.title}</Typography>
      <Typography variant="body2">{errorInfo.message}</Typography>
      <Button size="small" onClick={onRetry} sx={{ mt: 1 }}>
        {errorInfo.action}
      </Button>
    </Box>
  );
};
```

## テスト戦略

### 1. 単体テスト

```typescript
// server/src/services/beauty/client-chat.service.test.ts
describe('BeautyClientChatService', () => {
  beforeEach(async () => {
    // テスト用DBのセットアップ
    await mongoose.connect(process.env.MONGODB_TEST_URI as string);
  });
  
  afterEach(async () => {
    // テスト後のクリーンアップ
    await BeautyClientChat.deleteMany({});
    await BeautyClient.deleteMany({});
    await mongoose.connection.close();
  });
  
  describe('getClientChatHistory', () => {
    test('有効なクライアントIDでチャット履歴を取得できる', async () => {
      // テストデータのセットアップ
      const organizationId = new mongoose.Types.ObjectId();
      const client = await BeautyClient.create({
        name: 'テストクライアント',
        gender: 'F',
        birthdate: new Date('1990-01-01'),
        organizationId
      });
      
      const chatService = new BeautyClientChatService();
      const result = await chatService.getClientChatHistory(
        client._id.toString(),
        'user123',
        organizationId.toString()
      );
      
      expect(result).toBeDefined();
      expect(result.clientChat).toBeDefined();
      expect(result.clientChat.clientId).toEqual(client._id.toString());
      expect(Array.isArray(result.clientChat.messages)).toBe(true);
    });
    
    test('無効なクライアントIDでエラーがスローされる', async () => {
      const chatService = new BeautyClientChatService();
      const organizationId = new mongoose.Types.ObjectId();
      
      await expect(
        chatService.getClientChatHistory(
          'invalid_id',
          'user123',
          organizationId.toString()
        )
      ).rejects.toThrow();
    });
  });
  
  // 他のテストケース...
});
```

### 2. 統合テスト

```typescript
// server/src/tests/integration/beauty-client-chat.test.ts
describe('Beauty Client Chat API', () => {
  let authToken: string;
  let clientId: string;
  
  beforeAll(async () => {
    // テストユーザーでログイン
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword'
      });
    
    authToken = loginResponse.body.token;
    
    // テストクライアントを作成
    const clientResponse = await request(app)
      .post('/api/v1/beauty/clients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'テストクライアント',
        gender: 'F',
        birthdate: '1990-01-01'
      });
    
    clientId = clientResponse.body.client.id;
  });
  
  describe('GET /api/v1/beauty/client-chat/history', () => {
    test('認証済みユーザーがチャット履歴を取得できる', async () => {
      const response = await request(app)
        .get(`/api/v1/beauty/client-chat/history?clientId=${clientId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.clientChatHistory).toBeDefined();
    });
    
    test('認証なしでアクセスするとエラーになる', async () => {
      const response = await request(app)
        .get(`/api/v1/beauty/client-chat/history?clientId=${clientId}`);
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('POST /api/v1/beauty/client-chat/message', () => {
    test('メッセージを送信するとAI応答が返ってくる', async () => {
      const response = await request(app)
        .post('/api/v1/beauty/client-chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId,
          message: 'こんにちは、髪型のアドバイスをください'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.aiMessage).toBeDefined();
      expect(typeof response.body.aiMessage).toBe('string');
      expect(response.body.aiMessage.length).toBeGreaterThan(0);
    });
  });
  
  // 他のテストケース...
});
```

## デプロイと監視

### 1. 段階的デプロイ戦略

1. **検証環境でのテスト**:
   - モデル更新のみデプロイ
   - サービス実装のテスト
   - コントローラー・ルート実装

2. **限定ユーザーへのリリース**:
   - テストユーザーグループの設定
   - フィードバックの収集と分析
   - 重要な指標のモニタリング

3. **全ユーザーへの段階的展開**:
   - ユーザーの10%にリリース、問題なければ50%、そして100%に拡大
   - 各段階でのメトリクスと安定性の評価

### 2. トークン使用量管理と監視

- **使用量のリアルタイム追跡**:
  - 組織ごとのトークン使用量Dashboard実装
  - 使用パターンの分析と異常検知

- **アラート設定**:
  - 上限に対する使用率アラート（80%、95%）
  - 異常パターン検知時の通知

- **自動制限機能**:
  - 上限超過時の優雅な機能制限
  - 追加チャージオプションの提示

## 移行計画

既存のチャットシステムからの移行は以下の手順で行います：

1. **データ分析と準備**:
   - 既存のChatHistoryデータからクライアントチャットを識別
   - データモデルの互換性検証

2. **データ変換スクリプト**:
   - ChatHistoryからBeautyClientChatへのマッピング定義
   - コンテキストデータの構築と統合

3. **段階的移行**:
   - 少量のデータで変換プロセスをテスト
   - バッチ処理による大規模データ移行
   - 移行検証と整合性チェック

4. **リスク軽減**:
   - 移行中の読み取り専用モード
   - ロールバック計画の準備
   - 詳細な移行ログの記録

## まとめ

美容クライアントチャット機能の実装では、以下の点を重視します：

1. **パーソナライズされた体験**:
   - 四柱推命情報と当日の日柱情報を活用
   - クライアント固有のコンテキストに基づくアドバイス

2. **パフォーマンスとUX**:
   - ストリーミングレスポンスによる高速な対話
   - 効率的なデータ構造とクエリ最適化

3. **拡張性とメンテナンス性**:
   - 整理されたコードベース
   - 明確な責任分離

4. **セキュリティとプライバシー**:
   - 組織間のデータ分離
   - 適切なアクセス制御

この実装アプローチにより、美容師はクライアントに対して一貫性のある個別化された提案を行うことができ、顧客満足度と再訪率の向上に貢献します。