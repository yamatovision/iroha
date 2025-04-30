# クライアント管理API仕様書

## 概要

クライアント管理APIは美容サロン向けに、顧客（クライアント）情報の管理、四柱推命に基づく相性診断、チャット機能との連携を提供するAPIです。このAPIは既存の認証システムとデータモデルに基づいて、美容サロン単位でのクライアント管理を実現します。

## 基本情報

- ベースURL: `/api/v1/clients`
- 認証: JWT認証必須（Admin、Owner、Userロール）
- 組織アクセス制御: 各エンドポイントは組織ID（organizationId）に基づくアクセス制御が適用される

## データモデル

### Client（クライアント）

```typescript
interface Client {
  id: string;                 // クライアントのユニークID
  organizationId: string;     // 所属組織ID（美容サロンID）
  name: string;               // 氏名
  nameReading?: string;       // 読み仮名
  gender?: Gender;            // 性別
  birthdate?: Date;           // 生年月日
  birthtime?: string;         // 生まれた時間（HH:MM形式）
  phone?: string;             // 電話番号
  email?: string;             // メールアドレス
  address?: string;           // 住所
  memo?: string;              // メモ・備考
  
  // カスタムプロパティ（サロンが自由に定義できる）
  customFields?: Record<string, any>; // カスタムフィールド
  
  // 外部システム連携情報
  externalSources?: {
    [sourceKey: string]: string;  // 例: { "hotpepper": "HP12345", "salonanswer": "SA67890" }
  };
  
  // 四柱推命情報
  birthPlace?: string;        // 出生地
  birthplaceCoordinates?: {   // 出生地座標
    longitude: number;
    latitude: number;
  };
  localTimeOffset?: number;   // 地方時オフセット（分単位）
  timeZone?: string;          // タイムゾーン
  elementAttribute?: Element; // 主要五行属性
  fourPillars?: {             // 四柱（年月日時）
    year: GanShiPillar;
    month: GanShiPillar;
    day: GanShiPillar;
    hour: GanShiPillar;
  };
  elementProfile?: {          // 五行バランス
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  kakukyoku?: {               // 格局情報
    type: string;
    category: 'special' | 'normal';
    strength: 'strong' | 'weak' | 'neutral';
    description?: string;
  };
  yojin?: {                   // 用神情報
    tenGod: string;
    element: string;
    description?: string;
    supportElements?: string[];
  };
  personalityDescription?: string; // 性格特性
  
  // 内部管理用
  isFavorite: boolean;        // お気に入り登録
  hasCompleteSajuProfile: boolean; // 四柱推命プロフィール完成状態
  createdAt: Date;            // 登録日時
  updatedAt: Date;            // 更新日時
  lastVisitDate?: Date;       // 最終来店日
  createdBy: string;          // 作成者ID
  updatedBy: string;          // 更新者ID
}

enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  UNKNOWN = 'unknown'
}

interface GanShiPillar {
  gan: string;                 // 天干
  shi: string;                 // 地支
  element: Element;            // 五行属性
}

enum Element {
  WATER = 'water',             // 水
  WOOD = 'wood',               // 木
  FIRE = 'fire',               // 火
  EARTH = 'earth',             // 土
  METAL = 'metal'              // 金
}
```

### ClientStylistCompatibility（クライアント-スタイリスト相性）

```typescript
interface ClientStylistCompatibility {
  id: string;                  // 相性情報ID
  clientId: string;            // クライアントID
  stylistId: string;           // スタイリストID
  organizationId: string;      // 組織ID
  overallScore: number;        // 総合相性スコア (0-100)
  calculatedAt: Date;          // 計算日時
  calculationVersion: string;  // 計算アルゴリズムバージョン
}
```

### ClientNote（クライアントメモ）

```typescript
interface ClientNote {
  id: string;                  // メモID
  clientId: string;            // クライアントID
  organizationId: string;      // 組織ID
  authorId: string;            // 記入者ID (スタイリストID)
  content: string;             // 本文
  noteType: NoteType;          // メモタイプ
  isPrivate: boolean;          // プライベートメモか
  createdAt: Date;             // 作成日時
  updatedAt: Date;             // 更新日時
  isRemoved: boolean;          // 削除フラグ
}

enum NoteType {
  GENERAL = 'general',         // 一般メモ
  PREFERENCE = 'preference',   // 好みメモ
  TREATMENT = 'treatment',     // 施術メモ
  FOLLOW_UP = 'follow_up'      // フォローアップメモ
}
```

### ClientChat（クライアントチャット）

```typescript
interface ClientChat {
  id: string;                  // チャットID
  clientId: string;            // クライアントID
  organizationId: string;      // 組織ID
  messages: ClientChatMessage[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientChatMessage {
  role: 'stylist' | 'assistant';  // スタイリストからの入力、またはAI回答
  content: string;                // メッセージ内容
  timestamp: Date;                // タイムスタンプ
  stylistId?: string;             // メッセージを送信したスタイリストID（スタイリスト役割の場合）
  contextItems?: {                // 会話コンテキスト情報
    type: string;                 // コンテキストタイプ
    refId?: string;               // 参照ID
    data?: any;                   // 追加データ
  }[];
}
```

## API エンドポイント

### 1. クライアント管理基本API

#### 1.1 クライアント一覧取得

```typescript
// TypeScript型定義
interface ClientListRequest {
  page?: number;               // ページ番号（1から開始）
  limit?: number;              // 1ページあたりの件数
  search?: string;             // 検索キーワード（名前、電話、メールなど）
  filter?: string;             // フィルター条件（all, no_birthday, recent_visit, favorite）
  sortBy?: string;             // ソート項目（name, last_visit, created_at）
  sortOrder?: 'asc' | 'desc';  // ソート順
}

interface ClientListResponse {
  clients: {
    id: string;
    name: string;
    gender?: string;
    phone?: string;
    email?: string;
    birthdate?: string;
    hasCompleteSajuProfile: boolean;
    isFavorite: boolean;
    lastVisitDate?: string;
    elementAttribute?: string;
  }[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  counts: {
    all: number;
    no_birthday: number;
    recent_visit: number;
    favorite: number;
  };
}
```

- **URL**: `GET /api/v1/clients`
- **メソッド**: GET
- **認証**: 必須
- **説明**: 組織に所属するクライアント一覧を取得します
- **クエリパラメータ**:
  - `page`: ページ番号（デフォルト: 1）
  - `limit`: 1ページあたりの件数（デフォルト: 20）
  - `search`: 検索キーワード
  - `filter`: フィルター条件
  - `sortBy`: ソート項目
  - `sortOrder`: ソート順（asc/desc）
- **レスポンス**: クライアント一覧と件数情報

#### 1.2 クライアント詳細取得

```typescript
// TypeScript型定義
interface ClientDetailResponse {
  client: Client;
  stylistCompatibility?: {  // 現在のスタイリストとの相性
    stylistId: string;
    stylistName: string;
    overallScore: number;
  }[];
  recentVisits?: {  // 最近の来店履歴
    date: string;
    stylistName: string;
    treatmentTypes: string[];
  }[];
}
```

- **URL**: `GET /api/v1/clients/:clientId`
- **メソッド**: GET
- **認証**: 必須
- **説明**: 指定したクライアントの詳細情報を取得します
- **パスパラメータ**:
  - `clientId`: クライアントID
- **レスポンス**: クライアント詳細情報、相性情報、来店履歴

#### 1.3 クライアント新規作成

```typescript
// TypeScript型定義
interface CreateClientRequest {
  name: string;               // 氏名（必須）
  nameReading?: string;       // 読み仮名
  gender?: Gender;            // 性別
  birthdate?: string;         // 生年月日（YYYY-MM-DD形式）
  birthtime?: string;         // 生まれた時間（HH:MM形式）
  birthPlace?: string;        // 出生地
  phone?: string;             // 電話番号
  email?: string;             // メールアドレス
  address?: string;           // 住所
  memo?: string;              // メモ・備考
  customFields?: Record<string, any>; // カスタムフィールド
  isFavorite?: boolean;       // お気に入り登録
}

interface CreateClientResponse {
  id: string;                 // 作成されたクライアントID
  name: string;               // 氏名
  message: string;            // 成功メッセージ
  hasCompleteSajuProfile: boolean; // 四柱推命プロフィール完成状態
}
```

- **URL**: `POST /api/v1/clients`
- **メソッド**: POST
- **認証**: 必須
- **説明**: 新規クライアントを作成します
- **リクエストボディ**: クライアント作成情報
- **レスポンス**: 作成されたクライアントの基本情報

#### 1.4 クライアント更新

```typescript
// TypeScript型定義
interface UpdateClientRequest {
  name?: string;              // 氏名
  nameReading?: string;       // 読み仮名
  gender?: Gender;            // 性別
  birthdate?: string;         // 生年月日（YYYY-MM-DD形式）
  birthtime?: string;         // 生まれた時間（HH:MM形式）
  birthPlace?: string;        // 出生地
  phone?: string;             // 電話番号
  email?: string;             // メールアドレス
  address?: string;           // 住所
  memo?: string;              // メモ・備考
  customFields?: Record<string, any>; // カスタムフィールド
  isFavorite?: boolean;       // お気に入り登録
}

interface UpdateClientResponse {
  id: string;                 // 更新されたクライアントID
  message: string;            // 成功メッセージ
  hasCompleteSajuProfile: boolean; // 四柱推命プロフィール完成状態（更新後）
}
```

- **URL**: `PUT /api/v1/clients/:clientId`
- **メソッド**: PUT
- **認証**: 必須
- **説明**: 指定したクライアントの情報を更新します
- **パスパラメータ**:
  - `clientId`: クライアントID
- **リクエストボディ**: 更新するクライアント情報（部分更新可能）
- **レスポンス**: 更新されたクライアントの基本情報

#### 1.5 クライアント削除

```typescript
// TypeScript型定義
interface DeleteClientResponse {
  id: string;                 // 削除されたクライアントID
  message: string;            // 成功メッセージ
}
```

- **URL**: `DELETE /api/v1/clients/:clientId`
- **メソッド**: DELETE
- **認証**: 必須（Adminロール以上）
- **説明**: 指定したクライアントを削除します
- **パスパラメータ**:
  - `clientId`: クライアントID
- **レスポンス**: 削除確認メッセージ

### 2. 四柱推命関連API

#### 2.1 クライアント四柱推命情報更新

```typescript
// TypeScript型定義
interface UpdateClientSajuRequest {
  birthdate: string;          // 生年月日（YYYY-MM-DD形式）
  birthtime?: string;         // 生まれた時間（HH:MM形式）
  birthPlace?: string;        // 出生地
  gender: Gender;             // 性別
  birthplaceCoordinates?: {   // 出生地座標
    longitude: number;
    latitude: number;
  };
  timeZone?: string;          // タイムゾーン
}

interface UpdateClientSajuResponse {
  clientId: string;
  message: string;
  elementAttribute: string;   // 主要五行属性
  hasCompleteSajuProfile: boolean; // 四柱推命プロフィール完成状態
}
```

- **URL**: `PUT /api/v1/clients/:clientId/saju`
- **メソッド**: PUT
- **認証**: 必須
- **説明**: 指定したクライアントの四柱推命情報を更新し、命式を再計算します
- **パスパラメータ**:
  - `clientId`: クライアントID
- **リクエストボディ**: 四柱推命計算に必要な情報
- **レスポンス**: 更新確認と計算結果の基本情報

#### 2.2 クライアント-スタイリスト相性取得

```typescript
// TypeScript型定義
interface ClientStylistCompatibilityRequest {
  stylistIds?: string[];      // スタイリストIDリスト（指定なしの場合は全スタイリスト）
}

interface ClientStylistCompatibilityResponse {
  clientId: string;
  clientName: string;
  elementAttribute?: string;  // クライアントの主要五行属性
  compatibilities: {
    stylistId: string;
    stylistName: string;
    stylistElementAttribute?: string; // スタイリストの主要五行属性
    overallScore: number;     // 相性スコア (0-100)
  }[];
}
```

- **URL**: `GET /api/v1/clients/:clientId/compatibility`
- **メソッド**: GET
- **認証**: 必須
- **説明**: 指定したクライアントとスタイリストとの相性情報を取得します
- **パスパラメータ**:
  - `clientId`: クライアントID
- **クエリパラメータ**:
  - `stylistIds`: カンマ区切りのスタイリストIDリスト（オプション）
- **レスポンス**: クライアントとスタイリストの相性スコア一覧

#### 2.3 相性スコア再計算

```typescript
// TypeScript型定義
interface RecalculateCompatibilityRequest {
  stylistIds?: string[];      // スタイリストIDリスト（指定なしの場合は全スタイリスト）
}

interface RecalculateCompatibilityResponse {
  clientId: string;
  message: string;
  updatedCount: number;       // 更新された相性データ数
}
```

- **URL**: `POST /api/v1/clients/:clientId/compatibility/recalculate`
- **メソッド**: POST
- **認証**: 必須
- **説明**: 指定したクライアントとスタイリストの相性スコアを再計算します
- **パスパラメータ**:
  - `clientId`: クライアントID
- **リクエストボディ**: 再計算対象のスタイリストIDs（オプション）
- **レスポンス**: 再計算結果の概要

### 3. メモ管理API

#### 3.1 クライアントメモ一覧取得

```typescript
// TypeScript型定義
interface ClientNoteListRequest {
  noteType?: NoteType;        // メモタイプでフィルタリング
  includePrivate?: boolean;   // プライベートメモも含めるか
}

interface ClientNoteListResponse {
  clientId: string;
  notes: {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    noteType: NoteType;
    isPrivate: boolean;
    createdAt: string;
  }[];
}
```

- **URL**: `GET /api/v1/clients/:clientId/notes`
- **メソッド**: GET
- **認証**: 必須
- **説明**: 指定したクライアントのメモ一覧を取得します
- **パスパラメータ**:
  - `clientId`: クライアントID
- **クエリパラメータ**:
  - `noteType`: メモタイプ（オプション）
  - `includePrivate`: プライベートメモを含めるか（デフォルト: false）
- **レスポンス**: クライアントのメモ一覧

#### 3.2 クライアントメモ作成

```typescript
// TypeScript型定義
interface CreateClientNoteRequest {
  content: string;            // メモ内容
  noteType: NoteType;         // メモタイプ
  isPrivate?: boolean;        // プライベートメモか
}

interface CreateClientNoteResponse {
  id: string;                 // 作成されたメモID
  clientId: string;
  message: string;
}
```

- **URL**: `POST /api/v1/clients/:clientId/notes`
- **メソッド**: POST
- **認証**: 必須
- **説明**: 指定したクライアントに新規メモを作成します
- **パスパラメータ**:
  - `clientId`: クライアントID
- **リクエストボディ**: メモ情報
- **レスポンス**: 作成されたメモの基本情報

#### 3.3 クライアントメモ更新

```typescript
// TypeScript型定義
interface UpdateClientNoteRequest {
  content?: string;           // メモ内容
  noteType?: NoteType;        // メモタイプ
  isPrivate?: boolean;        // プライベートメモか
}

interface UpdateClientNoteResponse {
  id: string;                 // 更新されたメモID
  clientId: string;
  message: string;
}
```

- **URL**: `PUT /api/v1/clients/:clientId/notes/:noteId`
- **メソッド**: PUT
- **認証**: 必須
- **説明**: 指定したクライアントのメモを更新します
- **パスパラメータ**:
  - `clientId`: クライアントID
  - `noteId`: メモID
- **リクエストボディ**: 更新するメモ情報
- **レスポンス**: 更新されたメモの基本情報

#### 3.4 クライアントメモ削除

```typescript
// TypeScript型定義
interface DeleteClientNoteResponse {
  id: string;                 // 削除されたメモID
  clientId: string;
  message: string;
}
```

- **URL**: `DELETE /api/v1/clients/:clientId/notes/:noteId`
- **メソッド**: DELETE
- **認証**: 必須
- **説明**: 指定したクライアントのメモを削除します
- **パスパラメータ**:
  - `clientId`: クライアントID
  - `noteId`: メモID
- **レスポンス**: 削除確認メッセージ

### 4. データインポート/エクスポートAPI

#### 4.1 クライアントデータインポート

```typescript
// TypeScript型定義
interface ImportClientsRequest {
  source: 'hotpepper' | 'salonanswer' | 'csv';  // データソース
  apiKey?: string;            // 外部APIキー（ホットペッパー等の場合）
  fileContent?: string;       // CSVファイルのBase64エンコード文字列
  mapping?: {                 // CSVカラムマッピング
    [key: string]: string;    // フィールド名: CSVカラム名
  };
  options?: {
    updateExisting: boolean;  // 既存データを更新するか
    importNotes: boolean;     // メモもインポートするか
  };
}

interface ImportClientsResponse {
  message: string;
  totalProcessed: number;
  imported: number;
  updated: number;
  skipped: number;
  errors?: {
    row: number;
    message: string;
  }[];
}
```

- **URL**: `POST /api/v1/clients/import`
- **メソッド**: POST
- **認証**: 必須（Adminロール以上）
- **説明**: 外部システムからクライアントデータをインポートします
- **リクエストボディ**: インポート設定
- **レスポンス**: インポート結果の概要

#### 4.2 クライアントデータエクスポート

```typescript
// TypeScript型定義
interface ExportClientsRequest {
  format: 'csv' | 'json';     // エクスポート形式
  filter?: string;            // フィルター条件
  fields?: string[];          // エクスポートするフィールド
  includeNotes?: boolean;     // メモも含めるか
}

interface ExportClientsResponse {
  message: string;
  fileName: string;
  fileUrl: string;            // ダウンロード用の一時URL
  expiresAt: string;          // URLの有効期限
}
```

- **URL**: `POST /api/v1/clients/export`
- **メソッド**: POST
- **認証**: 必須（Adminロール以上）
- **説明**: クライアントデータをエクスポートします
- **リクエストボディ**: エクスポート設定
- **レスポンス**: エクスポートファイルの情報

### 5. チャット連携API

#### 5.1 クライアントチャット履歴取得

```typescript
// TypeScript型定義
interface ClientChatHistoryRequest {
  limit?: number;             // 取得するメッセージ数
}

interface ClientChatHistoryResponse {
  clientId: string;
  clientName: string;
  chatId: string;
  messages: {
    role: 'stylist' | 'assistant';
    content: string;
    timestamp: string;
    stylistId?: string;
    stylistName?: string;
  }[];
  hasMoreMessages: boolean;
}
```

- **URL**: `GET /api/v1/clients/:clientId/chat`
- **メソッド**: GET
- **認証**: 必須
- **説明**: 指定したクライアントのチャット履歴を取得します
- **パスパラメータ**:
  - `clientId`: クライアントID
- **クエリパラメータ**:
  - `limit`: 取得するメッセージ数（デフォルト: 50）
- **レスポンス**: クライアントのチャットメッセージ一覧

#### 5.2 クライアントチャットメッセージ送信

```typescript
// TypeScript型定義
interface SendClientChatRequest {
  message: string;            // メッセージ内容
  includeContext?: boolean;   // クライアント情報をコンテキストに含めるか
}

interface SendClientChatResponse {
  clientId: string;
  chatId: string;
  message: {
    role: 'stylist';
    content: string;
    timestamp: string;
    stylistId: string;
  };
  response: {
    role: 'assistant';
    content: string;
    timestamp: string;
  };
}
```

- **URL**: `POST /api/v1/clients/:clientId/chat`
- **メソッド**: POST
- **認証**: 必須
- **説明**: 指定したクライアントのチャットにメッセージを送信します
- **パスパラメータ**:
  - `clientId`: クライアントID
- **リクエストボディ**: メッセージ内容
- **レスポンス**: 送信メッセージとAIからの応答

## 共有モジュール定義

クライアント管理APIの型定義は共有モジュールに追加して使用します。これにより、フロントエンドとバックエンドで一貫した型定義が使用できます。

### shared/index.ts への追加

```typescript
// API定義
export const CLIENT = {
  LIST: `${API_BASE_PATH}/clients`,
  DETAIL: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}`,
  CREATE: `${API_BASE_PATH}/clients`,
  UPDATE: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}`,
  DELETE: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}`,
  
  // 四柱推命関連
  UPDATE_SAJU: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/saju`,
  GET_COMPATIBILITY: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/compatibility`,
  RECALCULATE_COMPATIBILITY: (clientId: string) => 
    `${API_BASE_PATH}/clients/${clientId}/compatibility/recalculate`,
    
  // メモ関連
  GET_NOTES: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/notes`,
  CREATE_NOTE: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/notes`,
  UPDATE_NOTE: (clientId: string, noteId: string) => 
    `${API_BASE_PATH}/clients/${clientId}/notes/${noteId}`,
  DELETE_NOTE: (clientId: string, noteId: string) => 
    `${API_BASE_PATH}/clients/${clientId}/notes/${noteId}`,
    
  // データインポート/エクスポート
  IMPORT: `${API_BASE_PATH}/clients/import`,
  EXPORT: `${API_BASE_PATH}/clients/export`,
  
  // チャット連携
  GET_CHAT: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/chat`,
  SEND_CHAT: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/chat`,
};

// モデル定義（抜粋、実際には上述の型定義全体を追加）
export interface IClient {
  id: string;
  organizationId: string;
  name: string;
  // 他のフィールド
}

export enum ClientNoteType {
  GENERAL = 'general',
  PREFERENCE = 'preference',
  TREATMENT = 'treatment',
  FOLLOW_UP = 'follow_up'
}

// その他必要な型定義
```

## エラーハンドリング

クライアント管理APIは以下のHTTPステータスコードを使用してエラーを通知します：

| ステータスコード | 意味 | 説明 |
|--------------|-----|-----|
| 400 | Bad Request | リクエストパラメータが不正 |
| 401 | Unauthorized | 認証されていない |
| 403 | Forbidden | 権限がない |
| 404 | Not Found | 指定したリソースが見つからない |
| 409 | Conflict | 重複するリソースが存在する |
| 422 | Unprocessable Entity | 入力データが処理できない |
| 500 | Internal Server Error | サーバーエラー |

エラーレスポンスは以下の形式で返されます：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": { "追加情報": "値" }
  }
}
```

## 認証と権限

クライアント管理APIは以下の権限レベルに基づいてアクセス制御を行います：

- **Owner**: すべての操作が可能
- **Admin**: 削除以外のすべての操作が可能
- **User**: 読み取りと一部の更新操作が可能

各エンドポイントは、リクエスト内のJWTトークンから取得したユーザーIDと組織IDに基づいて、適切なアクセス制御を実施します。

## パフォーマンス考慮点

1. **ページネーション**:
   - クライアント一覧取得のような大量データを返す可能性のあるエンドポイントではページネーションを実装
   - デフォルトでは20件ずつ返すよう設計

2. **インデックス**:
   - `organizationId`、`name`、`phone`、`email`、`birthdate` フィールドにインデックスを作成
   - 検索機能のパフォーマンス向上のため

3. **キャッシュ**:
   - 頻繁に参照されるデータはクライアント側でキャッシュするよう設計
   - クライアント詳細などの変更頻度の低いデータはサーバー側でもキャッシュ可能

4. **バルク処理**:
   - インポート/エクスポート処理はバックグラウンドジョブとして実行
   - 大規模データの場合にタイムアウトを回避

## セキュリティ考慮点

1. **アクセス制御**:
   - すべてのエンドポイントは認証必須
   - 組織ID単位でのアクセス制限を実装

2. **データ保護**:
   - クライアントの個人情報は適切に暗号化して保存
   - 電話番号やメールアドレスなどの個人情報は部分的にマスク処理

3. **入力検証**:
   - すべてのリクエストパラメータは厳密に検証
   - SQLインジェクションやXSSなどの脆弱性対策を実施

4. **監査ログ**:
   - 重要な操作（作成、更新、削除）は監査ログに記録
   - 誰がいつどのような操作を行ったかを追跡可能に

## バージョニング

クライアント管理APIは`/api/v1/`のプレフィックスを使用してバージョン管理されています。将来的に互換性のない変更が必要な場合は、新しいバージョン（例：`/api/v2/`）として実装します。

## テスト

各エンドポイントには以下のテストケースを実装します：

1. 正常系テスト（期待通りの入力で期待通りの結果が得られるか）
2. 異常系テスト（不正な入力に対して適切なエラーを返すか）
3. 認証テスト（認証なしや権限がない場合に適切に拒否するか）
4. パフォーマンステスト（大量データでも適切に動作するか）

## 連携ポイント

クライアント管理APIは以下のシステムと連携します：

1. **認証システム**: ユーザー認証と権限チェック
2. **四柱推命エンジン**: クライアントの命式計算と相性診断
3. **チャットシステム**: クライアント特化型のAIチャット機能
4. **カレンダー連携**: 予約情報との連携
5. **外部システム連携**: ホットペッパー等からのデータインポート