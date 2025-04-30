# 本日の担当クライアント API（更新版）

## 概要

本日の担当クライアント画面で使用するAPI仕様書です。この画面では、スタイリストの本日の予約クライアントを表示し、各クライアントに対するチャット機能へのアクセスを提供します。今回の更新では「相性表示」から「専用チャットへのリンク」機能へ変更しています。

## 必要なAPIエンドポイント

### 1. 本日の予約クライアント取得

```typescript
// TypeScript型定義
interface GetDailyClientsRequest {
  date: string; // YYYY-MM-DD形式の日付
  stylistId: string; // スタイリストID（未指定の場合はログインユーザー）
}

interface ClientAppointment {
  id: string; // 予約ID
  clientId: string; // クライアントID
  name: string; // クライアント名
  photoUrl: string | null; // プロフィール写真URL
  appointmentTime: string; // 予約時間 (ISO形式)
  duration: number; // 施術時間（分）
  services: string[]; // 施術内容の配列 (例: ['カット', 'カラー'])
  memo: string | null; // 予約メモ
  registrationStatus: 'registered' | 'unregistered'; // 登録状態
  hasChat: boolean; // チャット履歴があるかどうか
  conversationTip: string | null; // 会話のヒント
}

interface TimeGroup {
  period: 'morning' | 'afternoon' | 'evening'; // 時間帯
  appointments: ClientAppointment[]; // その時間帯の予約一覧
}

interface GetDailyClientsResponse {
  date: string; // YYYY-MM-DD形式の日付
  timeGroups: TimeGroup[]; // 時間帯ごとにグループ化された予約一覧 
}
```

- **URL**: `/api/appointments/daily`
- **メソッド**: GET
- **認証**: 必要
- **リクエストパラメータ**: 
  - `date`: 予約日（YYYY-MM-DD形式）、未指定の場合は本日
  - `stylistId`: スタイリストID、未指定の場合はログインユーザー
- **レスポンス**: 本日の予約一覧を時間帯ごとに分類したデータ
- **エラーケース**:
  - `401`: 認証エラー
  - `403`: 権限エラー（他のスタイリストの予約を参照しようとした場合）
  - `404`: スタイリストが見つからない
  - `500`: サーバーエラー

### 2. クライアントのチャット履歴確認

```typescript
// TypeScript型定義
interface CheckClientChatHistoryRequest {
  clientId: string; // クライアントID
}

interface CheckClientChatHistoryResponse {
  clientId: string; // クライアントID
  hasHistory: boolean; // チャット履歴があるかどうか
  lastMessageTimestamp: string | null; // 最後のメッセージのタイムスタンプ（ISO形式）
  messageCount: number; // メッセージ数
}
```

- **URL**: `/api/chat/client/{clientId}/history/check`
- **メソッド**: GET
- **認証**: 必要
- **リクエストパラメータ**: 
  - `clientId`: URLパスに含まれるクライアントID
- **レスポンス**: クライアントとのチャット履歴情報
- **エラーケース**:
  - `401`: 認証エラー
  - `403`: 権限エラー（アクセス権限のないクライアント情報）
  - `404`: クライアントが見つからない
  - `500`: サーバーエラー

### 3. クライアント詳細情報取得

```typescript
// TypeScript型定義
interface GetClientDetailRequest {
  clientId: string; // クライアントID
}

interface ClientDetail {
  id: string; // クライアントID
  name: string; // クライアント名
  photoUrl: string | null; // プロフィール写真URL
  phone: string | null; // 電話番号
  email: string | null; // メールアドレス
  birthDate: string | null; // 生年月日（YYYY-MM-DD形式）
  birthTime: string | null; // 生まれた時間（HH:MM形式）
  firstVisitDate: string | null; // 初回来店日（YYYY-MM-DD形式）
  tags: string[]; // タグ一覧（例: ['常連', 'ショートヘア']）
  memos: Array<{
    id: string; // メモID
    date: string; // 日付（YYYY-MM-DD形式）
    authorId: string; // 作成者ID
    authorName: string; // 作成者名
    content: string; // メモ内容
  }>;
  sajuProfile: {
    dayPillar: string | null; // 日柱
    elementBalance: {
      water: 'strong' | 'normal' | 'weak';
      wood: 'strong' | 'normal' | 'weak';
      fire: 'strong' | 'normal' | 'weak';
      earth: 'strong' | 'normal' | 'weak';
      metal: 'strong' | 'normal' | 'weak';
    } | null;
    dailyFortune: string | null; // 本日の運勢
  } | null;
  isRegistered: boolean; // 誕生日情報が登録されているか
}

interface GetClientDetailResponse {
  client: ClientDetail;
}
```

- **URL**: `/api/clients/{clientId}/detail`
- **メソッド**: GET
- **認証**: 必要
- **リクエストパラメータ**: 
  - `clientId`: URLパスに含まれるクライアントID
- **レスポンス**: クライアントの詳細情報
- **エラーケース**:
  - `401`: 認証エラー
  - `403`: 権限エラー（アクセス権限のないクライアント情報）
  - `404`: クライアントが見つからない
  - `500`: サーバーエラー

### 4. AIスタイル提案取得

```typescript
// TypeScript型定義
interface GetAIStyleSuggestionRequest {
  clientId: string; // クライアントID
}

interface AIStyleSuggestion {
  id: string; // 提案ID
  timestamp: string; // 生成日時（ISO形式）
  colorSuggestion: string; // カラー提案内容
  cutSuggestion: string; // カット提案内容
  stylingSuggestion: string; // スタイリング提案内容
  reasoning: string; // 提案理由の説明文
}

interface GetAIStyleSuggestionResponse {
  suggestion: AIStyleSuggestion;
}
```

- **URL**: `/api/clients/{clientId}/ai-suggestion`
- **メソッド**: GET
- **認証**: 必要
- **リクエストパラメータ**: 
  - `clientId`: URLパスに含まれるクライアントID
- **レスポンス**: AIによるスタイル提案
- **エラーケース**:
  - `401`: 認証エラー
  - `403`: 権限エラー（アクセス権限のないクライアント情報）
  - `404`: クライアントが見つからない
  - `500`: サーバーエラー

### 5. クライアントメモ追加

```typescript
// TypeScript型定義
interface AddClientMemoRequest {
  clientId: string; // クライアントID
  content: string; // メモ内容
}

interface AddClientMemoResponse {
  id: string; // 作成されたメモID
  date: string; // 日付（YYYY-MM-DD形式）
  authorId: string; // 作成者ID
  authorName: string; // 作成者名
  content: string; // メモ内容
}
```

- **URL**: `/api/clients/{clientId}/memos`
- **メソッド**: POST
- **認証**: 必要
- **リクエストボディ**: 
  - `content`: メモ内容
- **レスポンス**: 作成されたメモ情報
- **エラーケース**:
  - `400`: リクエスト不正（メモ内容が空など）
  - `401`: 認証エラー
  - `403`: 権限エラー（アクセス権限のないクライアント情報）
  - `404`: クライアントが見つからない
  - `500`: サーバーエラー

## 型定義の追加

以下の型定義を `shared/index.ts` と `server/src/types/index.ts` に追加してください。

```typescript
// クライアント関連の型定義
export interface ClientAppointment {
  id: string;
  clientId: string;
  name: string;
  photoUrl: string | null;
  appointmentTime: string;
  duration: number;
  services: string[];
  memo: string | null;
  registrationStatus: 'registered' | 'unregistered';
  hasChat: boolean;
  conversationTip: string | null;
}

export interface TimeGroup {
  period: 'morning' | 'afternoon' | 'evening';
  appointments: ClientAppointment[];
}

export interface DailyClientsData {
  date: string;
  timeGroups: TimeGroup[];
}

export interface ClientDetail {
  id: string;
  name: string;
  photoUrl: string | null;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  birthTime: string | null;
  firstVisitDate: string | null;
  tags: string[];
  memos: Array<{
    id: string;
    date: string;
    authorId: string;
    authorName: string;
    content: string;
  }>;
  sajuProfile: {
    dayPillar: string | null;
    elementBalance: {
      water: 'strong' | 'normal' | 'weak';
      wood: 'strong' | 'normal' | 'weak';
      fire: 'strong' | 'normal' | 'weak';
      earth: 'strong' | 'normal' | 'weak';
      metal: 'strong' | 'normal' | 'weak';
    } | null;
    dailyFortune: string | null;
  } | null;
  isRegistered: boolean;
}

export interface AIStyleSuggestion {
  id: string;
  timestamp: string;
  colorSuggestion: string;
  cutSuggestion: string;
  stylingSuggestion: string;
  reasoning: string;
}

export interface ClientChatHistoryCheck {
  clientId: string;
  hasHistory: boolean;
  lastMessageTimestamp: string | null;
  messageCount: number;
}

// API Path 定数
export const API_PATHS = {
  // ... 既存のパス
  DAILY_CLIENTS: '/api/appointments/daily',
  CLIENT_DETAIL: '/api/clients/:clientId/detail',
  CLIENT_CHAT_HISTORY: '/api/chat/client/:clientId/history/check',
  CLIENT_AI_SUGGESTION: '/api/clients/:clientId/ai-suggestion',
  CLIENT_MEMOS: '/api/clients/:clientId/memos'
};
```

## クライアントチャット遷移の判定ロジック

クライアントのチャット状態に基づいて適切な画面に遷移するロジックの概要:

1. クライアントカードのチャットボタンがクリックされた時:
   - 登録済みクライアント (`registrationStatus === 'registered'`):
     - チャット履歴あり (`hasChat === true`): `beauty-client-chat.html` に遷移
     - チャット履歴なし (`hasChat === false`): 既存情報を使って新規チャットセッション作成 → `beauty-client-chat.html` に遷移
   - 未登録クライアント (`registrationStatus === 'unregistered'`):
     - `beauty-client-input.html` に遷移して誕生日情報を入力
     - 入力後、自動的に `beauty-client-chat.html` に遷移

2. この流れを実装するための具体的なフロントエンドロジック:
   ```javascript
   // クライアントカードのチャットボタンクリックハンドラ
   function handleChatButtonClick(client) {
     if (client.registrationStatus === 'unregistered') {
       // 未登録クライアントの場合
       window.location.href = `/beauty-client-input.html?clientId=${client.clientId}&name=${encodeURIComponent(client.name)}`;
     } else {
       // 登録済みクライアントの場合（チャット履歴の有無に関わらず直接チャット画面に遷移）
       window.location.href = `/beauty-client-chat.html?clientId=${client.clientId}`;
     }
   }
   ```

## APIレスポンス例

### クライアント一覧のレスポンス例
```json
{
  "date": "2025-04-25",
  "timeGroups": [
    {
      "period": "morning",
      "appointments": [
        {
          "id": "appt123456",
          "clientId": "client123",
          "name": "佐藤 美咲",
          "photoUrl": "https://example.com/images/client123.jpg",
          "appointmentTime": "2025-04-25T10:30:00+09:00",
          "duration": 60,
          "services": ["カット", "カラー"],
          "memo": "前回より少し明るめのカラーを希望",
          "registrationStatus": "registered",
          "hasChat": true,
          "conversationTip": "最近のお出かけについて話してみると良いかもしれません"
        }
      ]
    },
    {
      "period": "afternoon",
      "appointments": [
        {
          "id": "appt123460",
          "clientId": "client127",
          "name": "山田 優子",
          "photoUrl": "https://example.com/images/default-female.jpg",
          "appointmentTime": "2025-04-25T16:30:00+09:00", 
          "duration": 60,
          "services": ["カット"],
          "memo": null,
          "registrationStatus": "unregistered",
          "hasChat": false,
          "conversationTip": "誕生日情報を登録していただくと、より詳しい提案ができます。"
        }
      ]
    }
  ]
}
```

### チャット履歴確認のレスポンス例
```json
{
  "clientId": "client123",
  "hasHistory": true,
  "lastMessageTimestamp": "2025-04-24T18:30:22.456Z",
  "messageCount": 15
}
```

```json
{
  "clientId": "client127",
  "hasHistory": false,
  "lastMessageTimestamp": null,
  "messageCount": 0
}
```

## 変更点まとめ

1. クライアント情報内の `compatibility` プロパティを削除し、代わりに `hasChat` プロパティを追加
2. `/api/chat/client/{clientId}/history/check` エンドポイントを新規追加
3. クライアントチャット履歴情報を表すための `ClientChatHistoryCheck` インターフェースを追加
4. API_PATHSに `CLIENT_CHAT_HISTORY` エントリを追加