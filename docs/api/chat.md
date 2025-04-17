# チャットAPI仕様書

> **最終更新**: 2025/04/09

## 概要

チャットAPIは、AIとのインタラクティブな相談をサポートするインターフェースを提供します。ユーザーは3つの異なるモード（個人相談、チームメンバー相性相談、チーム目標相談）でAIと対話し、四柱推命に基づいたパーソナライズされたアドバイスを受け取ることができます。

## データモデル

ChatHistoryモデルはチャット履歴を管理します：

```typescript
interface ChatMessage {
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatHistory {
  _id: ObjectId;
  userId: ObjectId; // ユーザーへの参照
  chatType: 'personal' | 'team_member' | 'team_goal'; // チャットタイプ
  relatedInfo?: {
    teamMemberId?: ObjectId; // 相性相談時のチームメイトID
    teamGoalId?: ObjectId; // 目標相談時のチーム目標ID
  };
  messages: ChatMessage[]; // メッセージ履歴
  tokenCount: number; // メッセージのトークン数合計
  contextData: Record<string, any>; // チャットに提供されるコンテキスト情報（JSONとして）
  aiModel: 'sonnet' | 'haiku'; // 使用しているAIモデル
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date; // 最終メッセージ時間
}
```

## エンドポイント

### 1. メッセージ送信

新しいメッセージを送信し、AIからの応答を取得します。

**エンドポイント:** `POST /api/v1/chat/message`

**認証要件:** 要認証 (JWT)

**リクエスト:**

```json
{
  "message": "今日の運勢について教えてください",
  "mode": "personal",
  "contextInfo": {
    "memberId": "team-memberモード時のメンバーID",
    "teamGoalId": "team-goalモード時のチーム目標ID"
  }
}
```

**レスポンス:**

```json
{
  "success": true,
  "response": {
    "message": "AIからの応答メッセージ",
    "timestamp": "2025-04-09T12:34:56.789Z"
  },
  "chatHistory": {
    "id": "チャット履歴ID",
    "messages": [
      {
        "sender": "user",
        "content": "今日の運勢について教えてください",
        "timestamp": "2025-04-09T12:34:45.678Z"
      },
      {
        "sender": "ai",
        "content": "AIからの応答メッセージ",
        "timestamp": "2025-04-09T12:34:56.789Z"
      }
    ]
  }
}
```

**エラーレスポンス:**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_MODE",
    "message": "指定されたモードが無効です"
  }
}
```

### 2. チャット履歴の取得

ユーザーのチャット履歴を取得します。

**エンドポイント:** `GET /api/v1/chat/history`

**認証要件:** 要認証 (JWT)

**クエリパラメータ:**
- `limit` (オプション): 取得する履歴の最大数（デフォルト: 10）
- `offset` (オプション): ページネーション用オフセット
- `mode` (オプション): フィルタリングするチャットモード
- `memberId` (オプション): 特定のメンバーとの相談履歴のフィルタリング

**レスポンス:**

```json
{
  "success": true,
  "chatHistories": [
    {
      "id": "チャット履歴ID",
      "chatType": "personal",
      "messages": [
        {
          "sender": "user",
          "content": "今日の運勢について教えてください",
          "timestamp": "2025-04-09T12:34:45.678Z"
        },
        {
          "sender": "ai",
          "content": "AIからの応答メッセージ",
          "timestamp": "2025-04-09T12:34:56.789Z"
        }
      ],
      "createdAt": "2025-04-09T12:34:45.678Z",
      "lastMessageAt": "2025-04-09T12:34:56.789Z"
    }
  ],
  "pagination": {
    "total": 35,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### 3. チャット履歴のクリア

ユーザーのチャット履歴をクリアします。

**エンドポイント:** `DELETE /api/v1/chat/clear`

**認証要件:** 要認証 (JWT)

**クエリパラメータ:**
- `mode` (オプション): クリアするチャットモード（指定しない場合はすべてのモード）
- `chatId` (オプション): 特定のチャット履歴のIDを指定

**レスポンス:**

```json
{
  "success": true,
  "message": "チャット履歴がクリアされました"
}
```

### 4. チャットモードの設定

チャットモードを変更します。

**エンドポイント:** `PUT /api/v1/chat/mode`

**認証要件:** 要認証 (JWT)

**リクエスト:**

```json
{
  "mode": "team_member",
  "contextInfo": {
    "memberId": "チームメンバーのID",
    "teamGoalId": "チーム目標ID"
  }
}
```

**レスポンス:**

```json
{
  "success": true,
  "mode": "team_member",
  "contextInfo": {
    "memberId": "チームメンバーのID"
  },
  "welcomeMessage": "チームメンバー相性相談モードに切り替えました。〇〇さんとの相性について質問してください。"
}
```

## API利用制限

1. リクエスト制限: 
   - 通常ユーザー: 30リクエスト/分
   - プレミアムユーザー: 60リクエスト/分

2. トークン数制限:
   - 通常ユーザー（ライトプラン）: 1日あたり最大10,000トークン
   - プレミアムユーザー（エリートプラン）: 1日あたり最大50,000トークン

## エラーコード

| コード | 説明 |
|--------|------|
| INVALID_MODE | 指定されたチャットモードが無効 |
| RATE_LIMIT_EXCEEDED | APIリクエスト制限を超過 |
| TOKEN_LIMIT_EXCEEDED | 1日のトークン使用量制限を超過 |
| AI_SERVICE_ERROR | AI処理サービスでエラーが発生 |
| INVALID_MEMBER_ID | 指定されたメンバーIDが無効 |
| INVALID_GOAL_ID | 指定されたチーム目標IDが無効 |

## 実装注意事項

1. **コンテキスト管理**:
   - チャットの状態とコンテキストはサーバー側で管理
   - モード切替時に前のモードのコンテキストをクリア

2. **チーム相性相談**: 
   - チームメンバーIDが指定された場合、両ユーザーの四柱推命データから相性情報を計算
   - 相性コンテキストをAIプロンプトに含める

3. **チャット履歴の保存**:
   - メッセージはリアルタイムで保存し、画面リロード時に復元可能
   - ユーザーのアクセスコントロールを実装（自分のチャット履歴のみアクセス可）

4. **AIモデル選択**:
   - ユーザープランに応じて適切なAIモデルを選択
   - ライトプラン：Haiku（短い応答）
   - エリートプラン：Sonnet（詳細な応答）