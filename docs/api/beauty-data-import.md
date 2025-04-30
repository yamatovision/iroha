# データインポート機能 API仕様書

## 概要

データインポート機能APIは、美容サロンが顧客（クライアント）データを効率的にシステムに取り込むためのインターフェースを提供します。本APIでは以下の2つの主要インポート方法をサポートします：

1. CSVファイルのアップロード - シンプルで万能なデータ取り込み方法
2. カレンダー連携 (Google/iCloud) - 予約情報からのクライアントデータ取り込み

カレンダーAPIを中間層として利用することで、美容サロン管理システムなどの外部サービスからも統一的な形式でデータを取り込むことが可能です。

## 基本情報

- ベースURL: `/api/v1/import`
- 認証: JWT認証必須（Admin、Ownerロール以上）
- 組織アクセス制御: 各エンドポイントは組織ID（organizationId）に基づくアクセス制御が適用される

## API エンドポイント

### 1. CSVインポート関連API

#### 1.1 CSVファイルアップロード

```typescript
// TypeScript型定義
interface UploadCSVRequest {
  file: File;                  // CSVファイル（multipart/form-data）
}

interface UploadCSVResponse {
  uploadId: string;            // アップロードID（次のステップで使用）
  fileName: string;            // ファイル名
  fileSize: number;            // ファイルサイズ (バイト)
  headers: string[];           // 検出されたCSVヘッダー
  previewRows: string[][];     // プレビュー用の最初の5行分のデータ
  recordCount: number;         // 推定総レコード数
  detectedEncoding: string;    // 検出された文字エンコーディング
}
```

- **URL**: `POST /api/v1/import/csv/upload`
- **メソッド**: POST
- **認証**: 必須（Admin以上）
- **説明**: CSVファイルをアップロードし、ヘッダー解析とプレビューを行います
- **リクエスト形式**: `multipart/form-data`
- **レスポンス**: アップロード成功時の情報とヘッダー解析結果

#### 1.2 フィールドマッピング設定

```typescript
// TypeScript型定義
interface FieldMappingRequest {
  uploadId: string;            // アップロードID（1.1で取得）
  mappings: {
    sourceField: string;       // CSVのカラム名（ヘッダー）
    targetField: string;       // システム側のフィールド名
    enabled: boolean;          // このフィールドを使用するか
  }[];
  options: {
    updateExisting: boolean;   // 既存データを更新するか
    matchBy: string[];         // マッチングに使用するフィールド
    autoCreateSajuProfile: boolean; // 四柱推命プロフィールを自動作成するか
    dateFormat?: string;       // 日付フォーマット
    timeFormat?: string;       // 時間フォーマット
    timezone?: string;         // タイムゾーン設定
  };
}

interface FieldMappingResponse {
  sessionId: string;           // インポートセッションID
  message: string;             // 成功メッセージ
  validMappings: number;       // 有効なマッピング数
  requiredFields: {            // 必須フィールドの状態
    name: boolean;             // 「名前」フィールドのマッピング状態
    // その他の必須フィールド
  };
  warnings?: string[];         // 警告メッセージ（あれば）
}
```

- **URL**: `POST /api/v1/import/csv/mapping`
- **メソッド**: POST
- **認証**: 必須（Admin以上）
- **説明**: CSVファイルとシステムのフィールドの対応関係を設定します
- **リクエストボディ**: マッピング情報とインポートオプション
- **レスポンス**: マッピング設定結果とインポートセッション情報

#### 1.3 インポート実行

```typescript
// TypeScript型定義
interface ExecuteImportRequest {
  sessionId: string;           // インポートセッションID（1.2で取得）
}

interface ExecuteImportResponse {
  importId: string;            // インポート履歴ID
  status: 'pending' | 'processing'; // 処理状態
  message: string;             // 成功メッセージ
  estimatedTimeSeconds: number; // 推定処理時間（秒）
}
```

- **URL**: `POST /api/v1/import/csv/execute`
- **メソッド**: POST
- **認証**: 必須（Admin以上）
- **説明**: 設定されたマッピングに基づいてCSVインポートを実行します
- **リクエストボディ**: インポートセッション情報
- **レスポンス**: インポート処理の開始確認と進行状況情報

#### 1.4 インポート進行状況確認

```typescript
// TypeScript型定義
interface ImportStatusRequest {
  importId: string;            // インポート履歴ID（1.3で取得）
}

interface ImportStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'; // 処理状態
  progress: number;            // 進捗率（0-100）
  processedRecords: number;    // 処理済みレコード数
  totalRecords: number;        // 総レコード数
  importedRecords: number;     // インポート済みレコード数
  updatedRecords: number;      // 更新済みレコード数
  skippedRecords: number;      // スキップされたレコード数
  failedRecords: number;       // 失敗したレコード数
  elapsedTimeSeconds: number;  // 経過時間（秒）
  estimatedTimeRemainingSeconds?: number; // 残り推定時間（秒）
  errorSummary?: {             // エラー概要（あれば）
    errorTypes: { [key: string]: number }; // エラータイプ別の発生数
    mostCommonError?: string;  // 最も多いエラー
  };
}
```

- **URL**: `GET /api/v1/import/status/:importId`
- **メソッド**: GET
- **認証**: 必須（Admin以上）
- **説明**: インポート処理の進行状況を確認します
- **パスパラメータ**:
  - `importId`: インポート履歴ID
- **レスポンス**: 処理状況の詳細情報

### 2. カレンダー連携API

#### 2.1 カレンダー連携設定取得

```typescript
// TypeScript型定義
interface CalendarIntegrationListResponse {
  integrations: {
    id: string;                 // 連携ID
    type: 'google' | 'icloud';  // カレンダータイプ
    name: string;               // 表示名
    status: 'connected' | 'disconnected' | 'error'; // 連携状態
    lastSyncTime?: string;      // 最終同期日時
    syncFrequency: number;      // 同期頻度（分）
    selectedCalendars?: string[]; // 選択されたカレンダー名
    connectionDate: string;     // 連携開始日時
  }[];
}
```

- **URL**: `GET /api/v1/import/calendar`
- **メソッド**: GET
- **認証**: 必須（Admin以上）
- **説明**: 現在のカレンダー連携設定一覧を取得します
- **レスポンス**: カレンダー連携情報一覧

#### 2.2 Google カレンダー認証URL取得

```typescript
// TypeScript型定義
interface GoogleAuthUrlResponse {
  authUrl: string;             // 認証用URL
  state: string;               // 状態トークン（セキュリティ用）
}
```

- **URL**: `GET /api/v1/import/calendar/google/auth-url`
- **メソッド**: GET
- **認証**: 必須（Admin以上）
- **説明**: Googleカレンダー連携のための認証URLを取得します
- **レスポンス**: OAuth認証用のURL

#### 2.3 Google カレンダー認証コールバック処理

```typescript
// TypeScript型定義
interface GoogleAuthCallbackRequest {
  code: string;                // Googleから返された認証コード
  state: string;               // 状態トークン（2.2で取得）
}

interface GoogleAuthCallbackResponse {
  integrationId: string;       // 作成された連携ID
  status: 'connected';         // 連携状態
  availableCalendars: {        // 利用可能なカレンダー一覧
    id: string;                // カレンダーID
    name: string;              // カレンダー名
    primary: boolean;          // 主要カレンダーか
  }[];
  message: string;             // 成功メッセージ
}
```

- **URL**: `POST /api/v1/import/calendar/google/callback`
- **メソッド**: POST
- **認証**: 必須（Admin以上）
- **説明**: Google認証後のコールバック処理を行います
- **リクエストボディ**: 認証コードと状態トークン
- **レスポンス**: 連携設定結果と利用可能なカレンダー情報

#### 2.4 iCloud カレンダー認証URL取得

```typescript
// TypeScript型定義
interface ICloudAuthUrlResponse {
  authUrl: string;             // 認証用URL
  state: string;               // 状態トークン（セキュリティ用）
}
```

- **URL**: `GET /api/v1/import/calendar/icloud/auth-url`
- **メソッド**: GET
- **認証**: 必須（Admin以上）
- **説明**: iCloudカレンダー連携のための認証URLを取得します
- **レスポンス**: OAuth認証用のURL

#### 2.5 iCloud カレンダー認証コールバック処理

```typescript
// TypeScript型定義
interface ICloudAuthCallbackRequest {
  code: string;                // iCloudから返された認証コード
  state: string;               // 状態トークン（2.4で取得）
}

interface ICloudAuthCallbackResponse {
  integrationId: string;       // 作成された連携ID
  status: 'connected';         // 連携状態
  availableCalendars: {        // 利用可能なカレンダー一覧
    id: string;                // カレンダーID
    name: string;              // カレンダー名
    primary: boolean;          // 主要カレンダーか
  }[];
  message: string;             // 成功メッセージ
}
```

- **URL**: `POST /api/v1/import/calendar/icloud/callback`
- **メソッド**: POST
- **認証**: 必須（Admin以上）
- **説明**: iCloud認証後のコールバック処理を行います
- **リクエストボディ**: 認証コードと状態トークン
- **レスポンス**: 連携設定結果と利用可能なカレンダー情報

#### 2.6 カレンダー選択と同期設定

```typescript
// TypeScript型定義
interface CalendarSyncConfigRequest {
  integrationId: string;       // 連携ID
  selectedCalendars: string[]; // 選択したカレンダーIDリスト
  syncFrequency: number;       // 同期頻度（分）
  syncBackwardsDays: number;   // 何日前までの予約を同期するか
  syncForwardDays: number;     // 何日先までの予約を同期するか
  autoImport: boolean;         // 自動インポート設定
}

interface CalendarSyncConfigResponse {
  integrationId: string;       // 連携ID
  message: string;             // 成功メッセージ
  nextSyncTime: string;        // 次回同期予定時刻
}
```

- **URL**: `PUT /api/v1/import/calendar/:integrationId/config`
- **メソッド**: PUT
- **認証**: 必須（Admin以上）
- **説明**: カレンダー連携の同期設定を更新します
- **パスパラメータ**:
  - `integrationId`: 連携ID
- **リクエストボディ**: 同期設定情報
- **レスポンス**: 設定更新結果と次回同期情報

#### 2.7 カレンダー連携手動同期実行

```typescript
// TypeScript型定義
interface ManualSyncRequest {
  integrationId: string;       // 連携ID
}

interface ManualSyncResponse {
  importId: string;            // 生成されたインポート履歴ID
  message: string;             // 成功メッセージ
  status: 'processing';        // 処理状態
}
```

- **URL**: `POST /api/v1/import/calendar/:integrationId/sync`
- **メソッド**: POST
- **認証**: 必須（Admin以上）
- **説明**: カレンダー連携の同期を手動で実行します
- **パスパラメータ**:
  - `integrationId`: 連携ID
- **リクエストボディ**: なし
- **レスポンス**: 同期処理開始確認

#### 2.8 カレンダー連携解除

```typescript
// TypeScript型定義
interface DisconnectCalendarResponse {
  integrationId: string;       // 連携ID
  message: string;             // 成功メッセージ
}
```

- **URL**: `DELETE /api/v1/import/calendar/:integrationId`
- **メソッド**: DELETE
- **認証**: 必須（Admin以上）
- **説明**: カレンダー連携を解除します
- **パスパラメータ**:
  - `integrationId`: 連携ID
- **レスポンス**: 連携解除確認

### 3. インポート履歴API

#### 3.1 インポート履歴一覧取得

```typescript
// TypeScript型定義
interface ImportHistoryListRequest {
  page?: number;               // ページ番号（デフォルト: 1）
  limit?: number;              // 1ページあたりの件数（デフォルト: 10）
  source?: string;             // データソースフィルター
  status?: string;             // ステータスフィルター
  startDate?: string;          // 開始日フィルター
  endDate?: string;            // 終了日フィルター
}

interface ImportHistoryListResponse {
  histories: {
    id: string;                // 履歴ID
    source: string;            // データソース
    status: string;            // ステータス
    startTime: string;         // 開始時刻
    endTime?: string;          // 終了時刻
    totalRecords: number;      // 総レコード数
    importedRecords: number;   // インポート済みレコード数
    updatedRecords: number;    // 更新済みレコード数
    errorRecords: number;      // エラーレコード数
    sourceName?: string;       // ソース名（ファイル名など）
    executedBy: {              // 実行者情報
      id: string;              // ユーザーID
      name: string;            // ユーザー名
    };
  }[];
  pagination: {
    total: number;             // 総履歴数
    page: number;              // 現在のページ
    pages: number;             // 総ページ数
    limit: number;             // 1ページあたりの件数
  };
  counts: {                    // ステータス別カウント
    total: number;             // 総数
    success: number;           // 成功数
    partial: number;           // 部分成功数
    error: number;             // エラー数
    inProgress: number;        // 処理中数
  };
}
```

- **URL**: `GET /api/v1/import/history`
- **メソッド**: GET
- **認証**: 必須（Admin以上）
- **説明**: インポート履歴一覧を取得します
- **クエリパラメータ**:
  - `page`: ページ番号
  - `limit`: 1ページあたりの件数
  - `source`: データソースフィルター
  - `status`: ステータスフィルター
  - `startDate`: 開始日フィルター（YYYY-MM-DD形式）
  - `endDate`: 終了日フィルター（YYYY-MM-DD形式）
- **レスポンス**: フィルタリングされたインポート履歴一覧

#### 3.2 インポート履歴詳細取得

```typescript
// TypeScript型定義
interface ImportHistoryDetailResponse {
  id: string;                  // 履歴ID
  source: string;              // データソース
  status: string;              // ステータス
  startTime: string;           // 開始時刻
  endTime?: string;            // 終了時刻
  duration?: number;           // 処理時間（秒）
  
  // 処理結果詳細
  results: {
    totalRecords: number;      // 総レコード数
    processedRecords: number;  // 処理済みレコード数
    importedRecords: number;   // 新規インポート数
    updatedRecords: number;    // 更新数
    skippedRecords: number;    // スキップ数
    errorRecords: number;      // エラー数
  };
  
  // ソース情報
  sourceDetails: {
    name?: string;             // ソース名（ファイル名など）
    size?: number;             // サイズ（バイト）
    type?: string;             // ファイルタイプ
    calendars?: string[];      // カレンダー名（カレンダー連携の場合）
  };
  
  // エラー詳細（最大100件）
  errors?: {
    recordIndex?: number;      // レコードインデックス
    fieldName?: string;        // フィールド名
    errorCode: string;         // エラーコード
    errorMessage: string;      // エラーメッセージ
    rawValue?: string;         // エラー発生時の値
  }[];
  
  // 実行者情報
  executedBy: {
    id: string;                // ユーザーID
    name: string;              // ユーザー名
    role: string;              // ロール
  };
  
  // 設定情報
  settings: {
    updateExisting: boolean;   // 既存データ更新設定
    autoCreateSajuProfile: boolean; // 四柱推命プロフィール自動作成設定
    fieldMappings?: {          // フィールドマッピング情報
      source: string;          // ソースフィールド
      target: string;          // ターゲットフィールド
    }[];
  };
}
```

- **URL**: `GET /api/v1/import/history/:importId`
- **メソッド**: GET
- **認証**: 必須（Admin以上）
- **説明**: 特定のインポート履歴の詳細情報を取得します
- **パスパラメータ**:
  - `importId`: インポート履歴ID
- **レスポンス**: インポート履歴の詳細情報

### 4. マスターデータ取得API

#### 4.1 インポート可能フィールド一覧取得

```typescript
// TypeScript型定義
interface ImportableFieldsResponse {
  fields: {
    id: string;                // フィールドID
    name: string;              // フィールド名（表示用）
    type: string;              // データ型
    required: boolean;         // 必須フィールドか
    description: string;       // 説明
    examples: string[];        // 例示
    validationRules?: string[]; // バリデーションルール
    category: 'basic' | 'contact' | 'saju' | 'custom'; // カテゴリ
  }[];
  categories: {                // カテゴリ情報
    id: string;                // カテゴリID
    name: string;              // カテゴリ名
    description: string;       // 説明
  }[];
  commonMappings: {            // 一般的なマッピングパターン
    sourcePattern: string;     // ソースパターン（正規表現）
    targetField: string;       // ターゲットフィールド
    priority: number;          // 優先度
  }[];
}
```

- **URL**: `GET /api/v1/import/fields`
- **メソッド**: GET
- **認証**: 必須（Admin以上）
- **説明**: インポート可能なシステムフィールドの一覧と関連情報を取得します
- **レスポンス**: フィールド情報とマッピングパターン

#### 4.2 サポートされているデータソース一覧取得

```typescript
// TypeScript型定義
interface DataSourcesResponse {
  sources: {
    id: string;                // ソースID
    name: string;              // ソース名
    type: 'file' | 'calendar'; // ソースタイプ
    description: string;       // 説明
    status: 'available' | 'coming_soon' | 'deprecated'; // 状態
    capabilities: string[];    // 機能
    setupInstructions?: string; // セットアップ手順
  }[];
}
```

- **URL**: `GET /api/v1/import/sources`
- **メソッド**: GET
- **認証**: 必須（Admin以上）
- **説明**: サポートされているインポートデータソースの一覧を取得します
- **レスポンス**: データソース情報

## 共有モジュール定義

データインポートAPIの型定義は共有モジュールに追加して使用します。

### shared/index.ts への追加

```typescript
// API定義
export const IMPORT = {
  // CSVインポート
  CSV_UPLOAD: `${API_BASE_PATH}/import/csv/upload`,
  CSV_MAPPING: `${API_BASE_PATH}/import/csv/mapping`,
  CSV_EXECUTE: `${API_BASE_PATH}/import/csv/execute`,
  
  // インポート状態・履歴
  STATUS: (importId: string) => `${API_BASE_PATH}/import/status/${importId}`,
  HISTORY: `${API_BASE_PATH}/import/history`,
  HISTORY_DETAIL: (importId: string) => `${API_BASE_PATH}/import/history/${importId}`,
  
  // カレンダー連携
  CALENDAR: `${API_BASE_PATH}/import/calendar`,
  GOOGLE_AUTH_URL: `${API_BASE_PATH}/import/calendar/google/auth-url`,
  GOOGLE_CALLBACK: `${API_BASE_PATH}/import/calendar/google/callback`,
  ICLOUD_AUTH_URL: `${API_BASE_PATH}/import/calendar/icloud/auth-url`,
  ICLOUD_CALLBACK: `${API_BASE_PATH}/import/calendar/icloud/callback`,
  CALENDAR_CONFIG: (integrationId: string) => 
    `${API_BASE_PATH}/import/calendar/${integrationId}/config`,
  CALENDAR_SYNC: (integrationId: string) => 
    `${API_BASE_PATH}/import/calendar/${integrationId}/sync`,
  CALENDAR_DISCONNECT: (integrationId: string) => 
    `${API_BASE_PATH}/import/calendar/${integrationId}`,
  
  // マスターデータ
  FIELDS: `${API_BASE_PATH}/import/fields`,
  SOURCES: `${API_BASE_PATH}/import/sources`,
};

// データモデル定義
export enum ImportSourceType {
  CSV = 'csv',
  GOOGLE_CALENDAR = 'google_calendar',
  ICLOUD_CALENDAR = 'icloud_calendar'
}

export enum ImportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial'
}

export interface ImportOptions {
  updateExisting: boolean;
  matchBy: string[];
  autoCreateSajuProfile: boolean;
  importNotes: boolean;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
}
```

## エラー定義

データインポートAPIで使用される主要なエラーコードとその意味は以下のとおりです：

| エラーコード | 意味 | 説明 |
|------------|-----|-----|
| `FILE_TOO_LARGE` | ファイルサイズ超過 | アップロードされたファイルが許容サイズを超えています |
| `INVALID_FILE_FORMAT` | 不正なファイル形式 | CSVとして解析できないファイル形式です |
| `MISSING_REQUIRED_FIELD` | 必須フィールド欠落 | 必須フィールドのマッピングがありません |
| `INVALID_MAPPING` | 不正なマッピング | フィールドマッピングが不正です |
| `DUPLICATE_DETECTION` | 重複データ検出 | 既存データと重複するデータが検出されました |
| `DATA_VALIDATION_ERROR` | データ検証エラー | データが形式要件を満たしていません |
| `AUTH_FAILURE` | 認証失敗 | カレンダーAPI等への認証に失敗しました |
| `API_RATE_LIMIT` | APIレート制限 | 外部APIのレート制限に達しました |
| `IMPORT_TIMEOUT` | インポートタイムアウト | インポート処理が時間制限を超えました |
| `CALENDAR_SYNC_ERROR` | カレンダー同期エラー | カレンダーデータ同期中にエラーが発生しました |
| `INTERNAL_SERVER_ERROR` | サーバーエラー | サーバー側での処理エラーが発生しました |

## カレンダーデータ処理の特徴

カレンダー連携によるデータインポートの主な特徴：

1. **予約情報の自動取得**:
   - 既存のカレンダーから予約情報を自動取得
   - 新規予約の検出と追加
   - 変更・キャンセルの自動反映

2. **クライアント情報の抽出**:
   - カレンダーイベントのタイトルや説明からクライアント情報を抽出
   - 正規表現を使用した名前、電話番号、メールアドレスの自動認識
   - フォーマットの異なるイベント情報にも対応

3. **定期的な自動同期**:
   - 設定した頻度で自動同期実行
   - 一方向同期（カレンダー→システム）と双方向同期の選択
   - 日時範囲指定による過去/未来の予約取得制限

## 非同期処理アーキテクチャ

特に大量データを扱うCSVインポートとカレンダー同期は、以下の非同期処理アーキテクチャで実装されます：

1. **クライアントからのリクエスト処理**：
   - APIエンドポイントでリクエストを受け付け
   - バリデーションと初期処理を同期的に実行
   - インポートセッションレコードを作成
   - 処理IDをクライアントに返却

2. **バックグラウンド処理**：
   - キューシステムを使用した非同期タスク実行
   - 進捗状況をデータベースに随時更新
   - エラーはログに記録し、セッションレコードにも保存

3. **状態確認API**：
   - クライアントは定期的に状態確認APIを呼び出し
   - 進捗状況、完了状態、エラー情報を取得

4. **Webhook通知** (オプション)：
   - 処理完了時にWebhookでクライアントに通知
   - 成功、部分成功、失敗の各状態を通知

## セキュリティ考慮事項

1. **ファイルバリデーション**：
   - アップロードされるCSVファイルの拡張子チェック
   - MIMEタイプの検証
   - ファイルサイズ制限（デフォルト10MB）
   - 潜在的な悪意のあるコンテンツの検出

2. **権限管理**：
   - インポート機能はAdmin権限以上で利用可能
   - カレンダー連携のOAuth認証は安全な方法で実装
   - カレンダーアクセストークンは暗号化して保存

3. **データ保護**：
   - アップロードされたCSVファイルは処理後に安全に削除
   - クライアント個人情報は適切に暗号化
   - 敏感なデータのログ出力を制限

4. **レート制限**：
   - インポートAPI全体にレート制限を適用
   - 同時実行インポート数の制限
   - 1組織あたりの日次インポート上限

## テスト要件

データインポートAPIの品質を確保するため、以下のテストを実施する必要があります：

1. **単体テスト**：
   - 各エンドポイントの基本機能
   - バリデーションロジック
   - エラーハンドリング

2. **統合テスト**：
   - ファイルアップロードからインポート完了までの一連のフロー
   - カレンダー連携の認証フロー
   - 非同期処理の状態管理

3. **性能テスト**：
   - 大規模データセット（10,000行以上）のインポート
   - 複数同時インポートの処理
   - メモリ使用量のモニタリング

4. **エッジケーステスト**：
   - 様々な形式のCSVファイル（区切り文字、エンコーディング）
   - 不完全または形式不正なデータ
   - ネットワーク障害時の挙動

## 実装優先順位

データインポート機能の実装優先順位は以下のとおりです：

1. **CSVインポート基本機能**：
   - ファイルアップロード
   - フィールドマッピング
   - 基本インポート処理

2. **Googleカレンダー連携**：
   - 認証連携
   - 同期設定
   - 自動同期

3. **インポート履歴管理**：
   - 履歴一覧表示
   - 詳細表示
   - エラーログ

4. **iCloudカレンダー連携**：
   - 認証連携
   - 同期設定
   - 自動同期

5. **高度な機能追加**：
   - インポートテンプレート
   - スマートマッピング
   - エラー自動修正提案