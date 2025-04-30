# 「クライアント専用チャット」実装ガイド

## 概要

クライアント専用チャット機能は、美容師がクライアント（お客様）に対して、四柱推命情報に基づいたパーソナライズされた美容アドバイスを提供するためのチャットインターフェースです。このチャットシステムは、クライアントの命式データ（カクキョク、用神など）と当日の日柱情報をシステムメッセージとして自動的に設定し、それらの情報に基づいた適切な美容提案を行います。

## 必要なAPIエンドポイント

### 1. クライアント専用チャット履歴の取得

```typescript
interface BeautyClientChatHistoryRequest {
  clientId: string;     // クライアントID
  limit?: number;       // 取得するメッセージ数（デフォルト：10）
  offset?: number;      // 取得開始位置（ページネーション用）
}

interface BeautyClientChatHistoryResponse {
  success: boolean;
  clientChatHistory: {
    id: string;         // チャットセッションID
    clientId: string;   // クライアントID
    clientName: string; // クライアント名
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
    createdAt: string;
    lastMessageAt: string;
  };
  contextData: {
    sajuProfile: {
      fourPillars: {
        yearPillar: { stem: string; branch: string; hiddenStems?: string[] };
        monthPillar: { stem: string; branch: string; hiddenStems?: string[] };
        dayPillar: { stem: string; branch: string; hiddenStems?: string[] };
        hourPillar: { stem: string; branch: string; hiddenStems?: string[] };
      };
      kakukyoku?: {
        type: string;
        category: string;
        strength: string;
        description: string;
      };
      yojin?: {
        tenGod: string;
        element: string;
        description: string;
        supportElements: string[];
      };
      elementProfile: {
        wood: number;
        fire: number;
        earth: number;
        metal: number;
        water: number;
        mainElement: string;
        secondaryElement?: string;
      };
    };
    todayDayPillar: {
      date: string;
      heavenlyStem: string;
      earthlyBranch: string;
      hiddenStems: string[];
      energyDescription: string;
    };
    clientProfile: {
      name: string;
      gender: 'M' | 'F';
      birthdate: string;
      notes?: string[];
      visitHistory?: Array<{
        date: string;
        service: string;
        stylist: string;
        notes?: string;
      }>;
    };
  };
}
```

- **URL**: `/api/v1/beauty/client-chat/history`
- **メソッド**: GET
- **認証**: 必要
- **リクエストパラメータ**: クライアントID、取得制限、オフセット
- **レスポンス**: クライアントのチャット履歴と四柱推命コンテキスト情報
- **エラーケース**:
  - 400: クライアントIDが指定されていない
  - 404: 指定されたクライアントが見つからない
  - 403: クライアント情報へのアクセス権がない（異なるサロンのクライアント等）

### 2. クライアント専用チャットメッセージの送信

```typescript
interface BeautyClientChatSendRequest {
  clientId: string;     // クライアントID
  message: string;      // 送信メッセージ内容
  additionalContext?: {
    visitPurpose?: string;      // 来店目的（カット、カラー、パーマなど）
    clientConcerns?: string[];  // クライアントの悩み・要望
    seasonalEvent?: string;     // 季節イベント（旅行、結婚式など）
    hairCondition?: string;     // 現在の髪の状態
  };
}

interface BeautyClientChatSendResponse {
  success: boolean;
  aiMessage: string;    // AI応答メッセージ
  timestamp: string;    // タイムスタンプ
  chatHistory: {
    id: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
  };
  tokenUsage?: {
    prompt: number;     // プロンプトトークン数
    completion: number; // 完了トークン数
    total: number;      // 合計トークン数
  };
}
```

- **URL**: `/api/v1/beauty/client-chat/message`
- **メソッド**: POST
- **認証**: 必要
- **リクエストボディ**: クライアントID、メッセージ内容、追加コンテキスト（オプション）
- **レスポンス**: AI応答メッセージ、タイムスタンプ、更新されたチャット履歴
- **エラーケース**:
  - 400: 必須パラメータの欠落または無効な形式
  - 404: 指定されたクライアントが見つからない
  - 403: クライアント情報へのアクセス権がない
  - 429: API使用制限超過

### 3. クライアント専用チャットメッセージのストリーミング送信

```typescript
// リクエストはBeautyClientChatSendRequestと同一
interface BeautyClientChatStreamRequest {
  clientId: string;     // クライアントID
  message: string;      // 送信メッセージ内容
  additionalContext?: {
    visitPurpose?: string;      // 来店目的
    clientConcerns?: string[];  // クライアントの悩み・要望
    seasonalEvent?: string;     // 季節イベント
    hairCondition?: string;     // 現在の髪の状態
  };
}

// SSEイベント形式でストリーミングレスポンスを返す
// 各チャンクは次の形式のJSONオブジェクト
interface BeautyClientChatStreamChunk {
  event: 'start' | 'chunk' | 'end' | 'error';
  sessionId?: string;   // start時に返されるセッションID
  text?: string;        // チャンク時に返される部分テキスト
  error?: string;       // エラー時に返されるエラーメッセージ
  tokenUsage?: {        // end時に返されるトークン使用量
    prompt: number;
    completion: number;
    total: number;
  };
}
```

- **URL**: `/api/v1/beauty/client-chat/stream-message`
- **メソッド**: POST
- **認証**: 必要
- **リクエストボディ**: クライアントID、メッセージ内容、追加コンテキスト（オプション）
- **レスポンス**: Server-Sent Events（SSE）形式のストリーミングレスポンス
- **エラーケース**:
  - 400: 必須パラメータの欠落または無効な形式
  - 404: 指定されたクライアントが見つからない
  - 403: クライアント情報へのアクセス権がない
  - 429: API使用制限超過
  - 500: ストリーミング処理中のサーバーエラー

### 4. クライアントに関するメモの追加

```typescript
interface AddClientNoteRequest {
  clientId: string;     // クライアントID
  note: string;         // メモ内容
  serviceType?: string; // サービスタイプ（カット、カラー等）
  timestamp?: string;   // タイムスタンプ（指定なしの場合は現在時刻）
}

interface AddClientNoteResponse {
  success: boolean;
  clientNote: {
    id: string;
    clientId: string;
    note: string;
    serviceType?: string;
    createdBy: string;  // 作成者ID
    createdAt: string;
  };
}
```

- **URL**: `/api/v1/beauty/client/notes`
- **メソッド**: POST
- **認証**: 必要
- **リクエストボディ**: クライアントID、メモ内容、サービスタイプ（オプション）、タイムスタンプ（オプション）
- **レスポンス**: 追加されたメモ情報
- **エラーケース**:
  - 400: 必須パラメータの欠落または無効な形式
  - 404: 指定されたクライアントが見つからない
  - 403: クライアント情報への書き込み権限がない

### 5. クライアントプロフィール情報の取得

```typescript
interface GetClientProfileRequest {
  clientId: string;     // クライアントID
}

interface GetClientProfileResponse {
  success: boolean;
  clientProfile: {
    id: string;
    name: string;
    gender: 'M' | 'F';
    birthdate: string;
    birthtime?: string;
    contactInfo?: {
      phone?: string;
      email?: string;
    };
    sajuProfile?: {
      fourPillars: {
        yearPillar: { stem: string; branch: string; hiddenStems?: string[] };
        monthPillar: { stem: string; branch: string; hiddenStems?: string[] };
        dayPillar: { stem: string; branch: string; hiddenStems?: string[] };
        hourPillar: { stem: string; branch: string; hiddenStems?: string[] };
      };
      kakukyoku?: {
        type: string;
        category: string;
        strength: string;
        description: string;
      };
      yojin?: {
        tenGod: string;
        element: string;
        description: string;
        supportElements: string[];
      };
      elementProfile: {
        wood: number;
        fire: number;
        earth: number;
        metal: number;
        water: number;
        mainElement: string;
        secondaryElement?: string;
      };
    };
    visitHistory: Array<{
      id: string;
      date: string;
      serviceType: string;
      stylistId: string;
      stylistName: string;
      notes?: string;
    }>;
    notes: Array<{
      id: string;
      content: string;
      createdAt: string;
      createdBy: string;
      createdByName: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
}
```

- **URL**: `/api/v1/beauty/client/profile`
- **メソッド**: GET
- **認証**: 必要
- **リクエストパラメータ**: クライアントID
- **レスポンス**: クライアントの詳細プロフィール情報
- **エラーケース**:
  - 400: クライアントIDが指定されていない
  - 404: 指定されたクライアントが見つからない
  - 403: クライアント情報へのアクセス権がない

## API接続フロー

### 美容クライアントチャットの基本フロー

1. **チャット初期化**:
   - 本日の施術予定画面でクライアントを選択すると、`GET /api/v1/beauty/client/profile`でクライアント情報を取得
   - `GET /api/v1/beauty/client-chat/history`でチャット履歴を取得
   - システムメッセージとして四柱推命情報と当日の日柱情報が自動的に設定される

2. **メッセージ送信**:
   - ユーザーがメッセージを入力
   - モバイル環境ではストリーミング対応を確認し、対応している場合は`POST /api/v1/beauty/client-chat/stream-message`を使用
   - 非対応の場合は`POST /api/v1/beauty/client-chat/message`を使用

3. **メモ追加**:
   - チャット中の重要な情報や施術内容を`POST /api/v1/beauty/client/notes`でメモとして記録
   - これらのメモは次回の施術時に参照可能

### 日柱情報の自動更新

- クライアントとの会話は永続的に保存されるが、システムメッセージは毎日更新される
- 日付が変わると、その日の日柱情報を自動的に取得して新しいシステムメッセージとして設定
- 過去の会話は保持されるが、新しい日柱情報に基づいてアドバイスが更新される

### トークン使用量の管理

- 各チャットセッションのトークン使用量は組織のサブスクリプションプランに応じて制限される
- チャットレスポンスのたびにトークン使用量が返され、クライアント側で表示・管理される
- 上限に近づくと警告通知を表示し、超過すると課金オプションまたはプラン変更を促す

## 共通のAPI情報

### 認証要件

- JWT認証ヘッダー（Authorization: Bearer [token]）が必須
- トークンには組織ID（サロンID）とユーザーID（スタイリストID）が含まれる
- サロン所属の確認とスタイリスト権限の検証が行われる

### エラーレスポンス形式

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;       // エラーコード
    message: string;    // エラーメッセージ
    details?: any;      // 追加の詳細情報（オプション）
  };
}
```

### リクエスト制限

- 1分あたりのリクエスト数: サブスクリプションプランに依存
- ストリーミングセッションの最大時間: 60秒
- 最大メッセージサイズ: 4000文字
- チャット履歴保持期間: 無制限（削除操作がない限り）

## システムメッセージ構造

美容クライアントチャットでは、AI応答の質を高めるために、以下の構造化されたシステムメッセージが使用されます:

```
あなたは美容師のアシスタントAIです。クライアントについての四柱推命情報と今日の日柱情報に基づいて、パーソナライズされた美容アドバイスを提供してください。

【クライアント情報】
名前: {clientName}
性別: {gender}
生年月日: {birthdate}

【四柱推命情報】
四柱: {yearPillar.stem}{yearPillar.branch} {monthPillar.stem}{monthPillar.branch} {dayPillar.stem}{dayPillar.branch} {hourPillar.stem}{hourPillar.branch}
格局: {kakukyoku.type}（{kakukyoku.strength}）
用神: {yojin.tenGod}（{yojin.element}）
五行バランス: 木{elementProfile.wood} 火{elementProfile.fire} 土{elementProfile.earth} 金{elementProfile.metal} 水{elementProfile.water}
主要五行: {elementProfile.mainElement}

【今日の日柱情報】
日柱: {todayDayPillar.heavenlyStem}{todayDayPillar.earthlyBranch}
エネルギー: {todayDayPillar.energyDescription}

【最近の施術履歴】
{visitHistory}

【アドバイス指針】
1. クライアントの四柱推命情報と今日の日柱情報を踏まえて、調和のとれたヘアスタイル・カラーを提案してください。
2. 質問に対しては具体的かつ専門的に回答し、必要に応じて選択肢を提示してください。
3. 回答は簡潔で明瞭に、かつ美容のプロフェッショナルとして信頼性のある内容にしてください。
4. 五行理論に基づいた提案をする場合は、わかりやすく説明してください。
5. クライアントの悩みや要望に共感し、寄り添った回答を心がけてください。
```

## 型定義

この仕様に基づく型定義は`shared/index.ts`と`server/src/types/index.ts`に追加されます。