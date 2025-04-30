# サポートチケットシステム API仕様書

## 概要

サポートチケットシステムは、サロン管理者とスーパー管理者間のコミュニケーションを効率化するためのシステムです。サロン側ではチケットの作成・閲覧・返信が可能で、スーパー管理者側では全組織からのチケットを一括管理できます。

## 共通仕様

### 認証

- すべてのエンドポイントはJWT認証が必要です
- サロン側のエンドポイントはOwner/Admin権限が必要です
- SuperAdmin側のエンドポイントはSuperAdmin権限が必要です

### エラーレスポンス

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  errors?: string[];
}
```

## エンドポイント一覧

### 1. チケット作成 (サロン側)

```typescript
// リクエスト
interface CreateTicketRequest {
  title: string;          // チケットのタイトル
  content: string;        // 問い合わせ内容
}

// レスポンス
interface CreateTicketResponse {
  ticketId: string;       // 作成されたチケットID
  ticketNumber: string;   // 表示用チケット番号 (例: TK-0045)
  title: string;          // チケットのタイトル
  content: string;        // 問い合わせ内容
  status: 'pending';      // チケットの状態 (pending=未回答)
  createdAt: string;      // 作成日時 (ISO形式)
}
```

- **URL**: `/api/support/tickets`
- **メソッド**: POST
- **認証**: 必要 (Owner/Admin)
- **リクエストパラメータ**: チケットタイトルと内容
- **レスポンス**: 作成されたチケット情報
- **エラーケース**:
  - 400: 必須パラメータの欠如、不正な形式
  - 401: 認証エラー
  - 403: 権限不足
  - 500: サーバーエラー

### 2. チケット一覧取得 (サロン側)

```typescript
// クエリパラメータ
interface TicketListQuery {
  status?: 'all' | 'pending' | 'answered';  // フィルタリング条件 (デフォルト: all)
  page?: number;                           // ページ番号 (デフォルト: 1)
  limit?: number;                          // 1ページあたりの件数 (デフォルト: 10)
}

// レスポンス
interface TicketListResponse {
  tickets: {
    ticketId: string;         // チケットID
    ticketNumber: string;     // 表示用チケット番号
    title: string;            // タイトル
    status: 'pending' | 'answered';  // 状態
    createdAt: string;        // 作成日時
    updatedAt: string;        // 最終更新日時
  }[];
  pagination: {
    total: number;            // 総件数
    page: number;             // 現在のページ
    limit: number;            // 1ページあたりの件数
    pages: number;            // 総ページ数
  };
  counts: {
    all: number;              // 全チケット数
    pending: number;          // 未回答のチケット数
    answered: number;         // 回答済みのチケット数
  };
}
```

- **URL**: `/api/support/tickets`
- **メソッド**: GET
- **認証**: 必要 (Owner/Admin)
- **リクエストパラメータ**: クエリパラメータによるフィルタリング条件
- **レスポンス**: チケット一覧と件数情報
- **エラーケース**:
  - 401: 認証エラー
  - 403: 権限不足
  - 500: サーバーエラー

### 3. チケット詳細取得 (サロン側)

```typescript
// パスパラメータ
// ticketId: チケットID

// レスポンス
interface TicketDetailResponse {
  ticketId: string;           // チケットID
  ticketNumber: string;       // 表示用チケット番号
  title: string;              // タイトル
  status: 'pending' | 'answered';  // 状態
  createdAt: string;          // 作成日時
  updatedAt: string;          // 最終更新日時
  messages: {
    messageId: string;        // メッセージID
    content: string;          // メッセージ内容
    createdAt: string;        // 送信日時
    sender: {
      id: string;             // 送信者ID
      name: string;           // 送信者名
      type: 'salon' | 'superadmin';  // 送信者タイプ
    };
    isRead: boolean;          // 既読フラグ
  }[];
}
```

- **URL**: `/api/support/tickets/:ticketId`
- **メソッド**: GET
- **認証**: 必要 (Owner/Admin)
- **リクエストパラメータ**: チケットID
- **レスポンス**: チケット詳細情報とメッセージ履歴
- **エラーケース**:
  - 401: 認証エラー
  - 403: 権限不足
  - 404: チケットが存在しない
  - 500: サーバーエラー

### 4. チケットへの返信 (サロン側)

```typescript
// パスパラメータ
// ticketId: チケットID

// リクエスト
interface ReplyTicketRequest {
  content: string;          // 返信メッセージ内容
}

// レスポンス
interface ReplyTicketResponse {
  messageId: string;        // 作成されたメッセージID
  content: string;          // メッセージ内容
  createdAt: string;        // 送信日時
  sender: {
    id: string;             // 送信者ID
    name: string;           // 送信者名
    type: 'salon';          // 送信者タイプ = salon
  };
  ticketStatus: 'pending';  // 返信後のチケットステータス (サロンからの返信は常にpending)
}
```

- **URL**: `/api/support/tickets/:ticketId/reply`
- **メソッド**: POST
- **認証**: 必要 (Owner/Admin)
- **リクエストパラメータ**: チケットIDと返信内容
- **レスポンス**: 作成されたメッセージ情報
- **エラーケース**:
  - 400: 必須パラメータの欠如
  - 401: 認証エラー
  - 403: 権限不足
  - 404: チケットが存在しない
  - 500: サーバーエラー

### 5. チケット一覧取得 (SuperAdmin側)

```typescript
// クエリパラメータ
interface AdminTicketListQuery {
  status?: 'all' | 'pending' | 'answered';  // フィルタリング条件 (デフォルト: all)
  organizationId?: string;                  // 組織ID (指定した場合、その組織のチケットのみ)
  search?: string;                          // 検索キーワード
  page?: number;                            // ページ番号 (デフォルト: 1)
  limit?: number;                           // 1ページあたりの件数 (デフォルト: 20)
}

// レスポンス
interface AdminTicketListResponse {
  tickets: {
    ticketId: string;         // チケットID
    ticketNumber: string;     // 表示用チケット番号
    title: string;            // タイトル
    status: 'pending' | 'answered';  // 状態
    createdAt: string;        // 作成日時
    updatedAt: string;        // 最終更新日時
    organization: {
      id: string;             // 組織ID
      name: string;           // 組織名
    };
    creator: {
      id: string;             // 作成者ID
      name: string;           // 作成者名
    };
  }[];
  pagination: {
    total: number;            // 総件数
    page: number;             // 現在のページ
    limit: number;            // 1ページあたりの件数
    pages: number;            // 総ページ数
  };
  counts: {
    all: number;              // 全チケット数
    pending: number;          // 未回答のチケット数
    answered: number;         // 回答済みのチケット数
  };
}
```

- **URL**: `/api/admin/support/tickets`
- **メソッド**: GET
- **認証**: 必要 (SuperAdmin)
- **リクエストパラメータ**: クエリパラメータによるフィルタリング条件
- **レスポンス**: チケット一覧と件数情報
- **エラーケース**:
  - 401: 認証エラー
  - 403: 権限不足
  - 500: サーバーエラー

### 6. チケット詳細取得 (SuperAdmin側)

```typescript
// パスパラメータ
// ticketId: チケットID

// レスポンス
interface AdminTicketDetailResponse {
  ticketId: string;           // チケットID
  ticketNumber: string;       // 表示用チケット番号
  title: string;              // タイトル
  status: 'pending' | 'answered';  // 状態
  createdAt: string;          // 作成日時
  updatedAt: string;          // 最終更新日時
  organization: {
    id: string;               // 組織ID
    name: string;             // 組織名
  };
  creator: {
    id: string;               // 作成者ID
    name: string;             // 作成者名
    role: 'owner' | 'admin';  // 作成者役割
  };
  messages: {
    messageId: string;        // メッセージID
    content: string;          // メッセージ内容
    createdAt: string;        // 送信日時
    sender: {
      id: string;             // 送信者ID
      name: string;           // 送信者名
      type: 'salon' | 'superadmin';  // 送信者タイプ
    };
    isRead: boolean;          // 既読フラグ
  }[];
}
```

- **URL**: `/api/admin/support/tickets/:ticketId`
- **メソッド**: GET
- **認証**: 必要 (SuperAdmin)
- **リクエストパラメータ**: チケットID
- **レスポンス**: チケット詳細情報とメッセージ履歴
- **エラーケース**:
  - 401: 認証エラー
  - 403: 権限不足
  - 404: チケットが存在しない
  - 500: サーバーエラー

### 7. チケットへの返信 (SuperAdmin側)

```typescript
// パスパラメータ
// ticketId: チケットID

// リクエスト
interface AdminReplyTicketRequest {
  content: string;          // 返信メッセージ内容
}

// レスポンス
interface AdminReplyTicketResponse {
  messageId: string;        // 作成されたメッセージID
  content: string;          // メッセージ内容
  createdAt: string;        // 送信日時
  sender: {
    id: string;             // 送信者ID
    name: string;           // 送信者名
    type: 'superadmin';     // 送信者タイプ = superadmin
  };
  ticketStatus: 'answered'; // 返信後のチケットステータス (スーパー管理者からの返信は常にanswered)
}
```

- **URL**: `/api/admin/support/tickets/:ticketId/reply`
- **メソッド**: POST
- **認証**: 必要 (SuperAdmin)
- **リクエストパラメータ**: チケットIDと返信内容
- **レスポンス**: 作成されたメッセージ情報
- **エラーケース**:
  - 400: 必須パラメータの欠如
  - 401: 認証エラー
  - 403: 権限不足
  - 404: チケットが存在しない
  - 500: サーバーエラー

### 8. サポート統計情報取得 (SuperAdmin側)

```typescript
// レスポンス
interface SupportStatsResponse {
  totalTickets: number;        // 総チケット数
  pendingTickets: number;      // 未回答チケット数
  answeredTickets: number;     // 回答済みチケット数
  avgResponseTime: number;     // 平均応答時間（時間単位）
  topOrganizations: {          // チケット数上位の組織
    id: string;                // 組織ID
    name: string;              // 組織名
    ticketCount: number;       // チケット数
  }[];
  ticketsPerDay: {             // 日別チケット数（直近7日間）
    date: string;              // 日付
    count: number;             // チケット数
  }[];
}
```

- **URL**: `/api/admin/support/stats`
- **メソッド**: GET
- **認証**: 必要 (SuperAdmin)
- **リクエストパラメータ**: なし
- **レスポンス**: サポート統計情報
- **エラーケース**:
  - 401: 認証エラー
  - 403: 権限不足
  - 500: サーバーエラー

## 通知の扱いについて

サポートチケットに関連する通知は、既存の通知システムを使用して実装します。

### 通知トリガーイベント

1. 新規チケット作成時
   - SuperAdmin向けに通知
   - 通知タイプ: `NEW_SUPPORT_TICKET`

2. スーパー管理者からの返信時
   - チケット作成者およびその組織のOwner/Admin向けに通知
   - 通知タイプ: `SUPPORT_TICKET_REPLIED`

3. サロンからの返信時
   - SuperAdmin向けに通知
   - 通知タイプ: `SUPPORT_TICKET_UPDATED`

## データベースモデル参照

`/docs/data_models/`および`/docs/requirements.md`の8.8、8.9セクションを参照してください。

```typescript
// shared/index.tsに追加する型定義

export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  organizationId: string;
  creatorId: string;
  title: string;
  status: 'pending' | 'answered';
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  _id: string;
  ticketId: string;
  senderId: string;
  senderType: 'salon' | 'superadmin';
  content: string;
  createdAt: string;
  isRead: boolean;
}

// API_PATHSに追加する定数
export const API_PATHS = {
  // 既存のパスはそのまま維持
  ...

  // サポートチケット関連API (サロン側)
  SUPPORT_TICKETS: '/api/support/tickets',
  SUPPORT_TICKET_DETAIL: (id: string) => `/api/support/tickets/${id}`,
  SUPPORT_TICKET_REPLY: (id: string) => `/api/support/tickets/${id}/reply`,
  
  // サポートチケット関連API (SuperAdmin側)
  ADMIN_SUPPORT_TICKETS: '/api/admin/support/tickets',
  ADMIN_SUPPORT_TICKET_DETAIL: (id: string) => `/api/admin/support/tickets/${id}`,
  ADMIN_SUPPORT_TICKET_REPLY: (id: string) => `/api/admin/support/tickets/${id}/reply`,
  ADMIN_SUPPORT_STATS: '/api/admin/support/stats',
};
```