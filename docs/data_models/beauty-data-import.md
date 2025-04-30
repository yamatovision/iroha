# データインポート機能のデータモデル分析

## 概要

データインポート機能は、美容サロンが顧客（クライアント）データを効率的にシステムに取り込むための機能です。主に以下の2つのインポート手段をサポートします：

1. CSVファイルのアップロード
2. カレンダーサービス連携
   - Googleカレンダーとの連携
   - iCloudカレンダーとの連携

このデータモデル分析では、各インポート方法で必要なデータ構造と、既存のクライアントデータモデルとの統合方法を定義します。カレンダーサービスを中間統合レイヤーとして活用し、予約データを効率的に取り込む方法に焦点を当てています。

## データフロー図

```
+----------------+     +---------------+     +-----------------+
| 外部データソース| --> | インポート処理 | --> | クライアントDB  |
+----------------+     +---------------+     +-----------------+
  CSV, Google        データ変換・マッピング     保存・更新
  カレンダー,          重複チェック
  iCloudカレンダー
```

## 1. インポート設定データモデル

### インポート設定 (ImportConfig)

```typescript
interface ImportConfig {
  id: string;                         // 設定のユニークID
  organizationId: string;             // 美容サロンID
  importSource: ImportSourceType;     // インポート元タイプ
  syncFrequency?: number;             // 同期頻度（分）- カレンダー連携のみ
  lastSyncTime?: Date;                // 最終同期時刻
  connectionStatus: ConnectionStatus; // 接続状態
  credentials?: Record<string, any>;  // 接続に必要な認証情報（暗号化保存）
  createdAt: Date;                    // 作成日時
  updatedAt: Date;                    // 更新日時
  createdBy: string;                  // 作成者ID
  updatedBy: string;                  // 更新者ID
  fieldMappings: FieldMapping[];      // フィールドマッピング設定
  enabled: boolean;                   // 有効/無効フラグ
}

enum ImportSourceType {
  CSV = 'csv',
  GOOGLE_CALENDAR = 'google_calendar',
  ICLOUD_CALENDAR = 'icloud_calendar'
}

enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  PENDING = 'pending'
}

interface FieldMapping {
  sourceField: string;     // 外部データのフィールド名
  targetField: string;     // システム内のフィールド名
  enabled: boolean;        // このフィールドを使用するか
  dataQualityScore?: number; // データ品質スコア（0-100）
  isRequired: boolean;     // 必須フィールドか
}
```

## 2. インポート履歴データモデル

### インポート履歴 (ImportHistory)

```typescript
interface ImportHistory {
  id: string;                     // インポート履歴ID
  organizationId: string;         // 美容サロンID
  importConfigId: string;         // 使用されたインポート設定ID
  importSource: ImportSourceType; // インポート元タイプ
  status: ImportStatus;           // インポート結果ステータス
  startTime: Date;                // 開始時刻
  endTime: Date;                  // 終了時刻
  totalRecords: number;           // 処理レコード総数
  newRecords: number;             // 新規作成レコード数
  updatedRecords: number;         // 更新レコード数
  errorRecords: number;           // エラーレコード数
  errorDetails?: ImportError[];   // エラー詳細
  fileName?: string;              // CSVインポート時のファイル名
  fileSize?: number;              // CSVインポート時のファイルサイズ
  createdBy: string;              // 実行者ID
}

enum ImportStatus {
  SUCCESS = 'success',
  PARTIAL_SUCCESS = 'partial_success',
  ERROR = 'error',
  IN_PROGRESS = 'in_progress'
}

interface ImportError {
  recordIndex?: number;     // エラーレコードのインデックス
  sourceIdentifier?: string; // エラーレコードの識別子
  errorCode: string;        // エラーコード
  errorMessage: string;     // エラーメッセージ
  fieldName?: string;       // エラーが発生したフィールド
}
```

## 3. カレンダー連携のデータモデル

### カレンダー連携設定 (CalendarIntegration)

```typescript
interface CalendarIntegration extends ImportConfig {
  // ImportConfigを拡張
  calendarIds: string[];    // 連携する特定のカレンダーID（複数可）
  syncBackwardsDays: number; // 何日前までの予約を同期するか
  syncForwardDays: number;  // 何日先までの予約を同期するか
  refreshToken?: string;    // OAuth更新トークン（暗号化保存）
  tokenExpiry?: Date;       // トークン有効期限
  webhookUrl?: string;      // 更新通知を受け取るWebhook URL
  calendarProvider: CalendarProvider; // カレンダープロバイダ情報
}

enum CalendarProvider {
  GOOGLE = 'google',
  ICLOUD = 'icloud'
}

interface CalendarProviderConfig {
  apiKey?: string;          // APIキー（必要な場合）
  clientId: string;         // OAuthクライアントID
  scopes: string[];         // 必要なOAuthスコープ
  redirectUri: string;      // OAuthリダイレクトURI
  authEndpoint: string;     // 認証エンドポイント
  tokenEndpoint: string;    // トークン取得エンドポイント
}
```

### カレンダーイベントマッピング (CalendarEventMapping)

```typescript
interface CalendarEventMapping {
  id: string;                    // マッピングID
  organizationId: string;        // 美容サロンID
  calendarEventId: string;       // カレンダーイベントID
  eventSummary: string;          // イベントタイトル
  eventDescription?: string;     // イベント説明
  eventStartTime: Date;          // イベント開始時間
  eventEndTime: Date;            // イベント終了時間
  eventLocation?: string;        // イベント場所
  eventCreator?: string;         // イベント作成者
  attendees?: string[];          // イベント参加者
  calendarId: string;            // ソースカレンダーID
  recurringEventId?: string;     // 定期イベントの場合の親ID
  clientName?: string;           // イベントから抽出したクライアント名
  clientPhone?: string;          // イベントから抽出した電話番号
  clientEmail?: string;          // イベントから抽出したメールアドレス
  stylistName?: string;          // イベントから抽出したスタイリスト名
  serviceType?: string;          // イベントから抽出した施術種類
  mappedClientId?: string;       // 紐付けられたクライアントID
  mappedStylistId?: string;      // 紐付けられたスタイリストID
  mappedServiceId?: string;      // 紐付けられた施術ID
  autoMatchConfidence?: number;  // 自動マッチング信頼度（0-100）
  isManuallyMapped: boolean;     // 手動でマッピングされたか
  lastSyncTime: Date;            // 最終同期時刻
  source: ImportSourceType;      // ソース（GoogleかiCloud）
  status: MappingStatus;         // マッピング状態
  notes?: string;                // 追加メモ情報
}

enum MappingStatus {
  MAPPED = 'mapped',             // 正しくマッピングされている
  PARTIALLY_MAPPED = 'partial',  // 一部マッピングされている
  UNMAPPED = 'unmapped',         // マッピングされていない
  ERROR = 'error'                // エラー状態
}
```

## 4. CSVインポートのデータモデル

### CSVインポート設定 (CSVImportConfig)

```typescript
interface CSVImportConfig extends ImportConfig {
  // ImportConfigを拡張
  delimiter: string;             // 区切り文字（カンマ、タブなど）
  hasHeaderRow: boolean;         // ヘッダー行があるか
  encoding: string;              // ファイルエンコーディング
  dateFormat: string;            // 日付フォーマット
  skipRows?: number;             // スキップする行数
  columnValidations: ColumnValidation[]; // カラム単位のバリデーション
  previewLines?: string[];       // プレビュー用の行データ
}

interface ColumnValidation {
  columnIndex: number;           // カラムインデックス
  columnName?: string;           // カラム名（ヘッダーがある場合）
  dataType: DataType;            // 期待されるデータ型
  required: boolean;             // 必須項目か
  validationRegex?: string;      // バリデーション用正規表現
  transformFunction?: string;    // 変換関数名
}

enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  EMAIL = 'email',
  PHONE = 'phone',
  BOOLEAN = 'boolean'
}
```

## 5. クライアントデータモデル（インポート関連部分）

既存のクライアントモデルには、カレンダーとの紐付けのための追加フィールドが必要です：

```typescript
interface Client {
  // 既存のフィールド（ID、名前、連絡先情報、生年月日など）
  
  // カレンダー連携関連のフィールド
  externalIds: {
    googleCalendarIds?: string[];    // Googleカレンダーでの関連イベントID
    iCloudCalendarIds?: string[];    // iCloudカレンダーでの関連イベントID
    otherSystemIds?: Record<string, string>; // その他の識別子
  };
  
  importSource?: ImportSourceType;  // 初回インポート元
  importHistoryId?: string;         // 初回インポート履歴ID
  lastImportHistoryId?: string;     // 最後に更新したインポート履歴ID
  lastSyncTime?: Date;              // 最終同期時刻
  
  // 識別用のハッシュ（電話番号やメールアドレスのハッシュ値）
  identificationHashes?: {
    emailHash?: string;           // メールアドレスのハッシュ
    phoneHash?: string;           // 電話番号のハッシュ
    nameHash?: string;            // 名前のハッシュ（部分一致用）
  };
  
  calendarEventLinks: CalendarEventLink[]; // カレンダーイベントとの関連付け
}

interface CalendarEventLink {
  calendarEventId: string;     // カレンダーイベントID
  eventMappingId: string;      // イベントマッピングID
  source: ImportSourceType;    // ソースタイプ
  linkedAt: Date;              // 紐付け日時
  isPrimary: boolean;          // 主要な予約情報か
  status: EventLinkStatus;     // リンクステータス
}

enum EventLinkStatus {
  ACTIVE = 'active',           // アクティブな予約
  COMPLETED = 'completed',     // 完了した予約
  CANCELLED = 'cancelled',     // キャンセルされた予約
  RESCHEDULED = 'rescheduled'  // 再スケジュールされた予約
}
```

## 6. エンティティ間の関係図

```
               +-------------------+
               | ImportConfig      |
               +-------------------+
               | id                |
               | organizationId    |
               | importSource      |
               | ...               |
               +--------+----------+
                        |
                        | 1:N
                 +------+------+
                 |             |
        +--------v-----+    +--v--------------+
        | CSVImportConfig    | CalendarIntegration
        +----------------+    +------------------+
        | delimiter      |    | calendarIds      |
        | hasHeaderRow   |    | syncSettings     |
        | ...            |    | ...              |
        +----------------+    +------------------+
                |                      |
                | 1:N                  | 1:N
                |                      |
        +-------v--------+    +--------v---------+
        | ImportHistory  |    | CalendarEventMapping
        +----------------+    +--------------------+
        | id             |    | id                 |
        | importConfigId |    | calendarEventId    |
        | status         |    | eventSummary       |
        | ...            |    | ...                |
        +-------+--------+    +--------------------+
                |                      |
                | 1:N                  | N:1
                v                      |
        +----------------+             |
        | ImportError    |             |
        +----------------+             |
        | recordIndex    |             |
        | errorMessage   |             |
        | ...            |             |
        +----------------+             |
                                       |
        +----------------+             |
        | Client         |<------------+
        +----------------+     1:N
        | id             |
        | name           |
        | externalIds    |
        | calendarEventLinks
        | ...            |
        +----------------+
```

## 7. データの整合性と紐付けロジック

### クライアント重複検出ロジック

1. **一次識別キー**:
   - 電話番号
   - メールアドレス
   - カレンダーイベント内の一意識別子

2. **二次識別キー**（一次キーがない場合）:
   - 氏名＋性別の組み合わせ
   - 氏名＋生年月日の組み合わせ

3. **マッチング処理**:
   - 完全一致: 一次識別キーで完全一致した場合は同一人物
   - 部分一致: 名前の類似度が高い場合は候補として表示（手動連携）
   - 信頼度スコア: マッチング条件の強さに基づいて0-100の信頼度を算出

### カレンダーイベント解析ロジック

1. **イベントタイトルからの情報抽出**:
   - 正規表現パターンでクライアント名を抽出
   - よくある形式: `[施術内容] 顧客名`、`顧客名様`など
   - サービス種類の識別（カット、カラー、パーマなど）

2. **イベント説明からの情報抽出**:
   - 電話番号パターン（例: `090-XXXX-XXXX`）
   - メールアドレスパターン
   - スタイリスト名（例: `担当: スタッフ名`）
   - サービス詳細や追加メモ

3. **日時情報の処理**:
   - タイムゾーン正規化（iCloudとGoogleでのタイムゾーン扱いの違いを統一）
   - 営業時間内の予約のみ処理（非営業時間の予定は無視）
   - 定期的な予約の処理とパターン認識

4. **参加者情報の活用**:
   - カレンダーイベントの参加者情報からメールアドレスを抽出
   - スタイリストの認識（内部スタッフのメールアドレスと一致する場合）

## 8. CSVデータの解析と処理

1. **ヘッダー行の自動認識**:
   - 一般的なヘッダー名パターンの検出
   - 類似フィールド名のマッピング（例: "TEL" と "電話番号" を同じフィールドと認識）

2. **インテリジェントなカラムタイプ推論**:
   - データサンプルからカラムの種類を自動推定
   - 日付形式の自動認識と変換
   - 電話番号・メールアドレスの形式検証

3. **データ前処理**:
   - 空白行のスキップ
   - 重複行の検出
   - 基本的なデータクレンジング（空白除去、全角/半角統一など）

## 9. データの変換・正規化ルール

### 名前の正規化
- 全角/半角統一
- 姓名間のスペース統一
- 「様」「さん」などの敬称除去

### 電話番号の正規化
- ハイフン有無に関わらず同一視
- 市外局番の0省略対応
- 国際番号（+81など）の標準化

### 日付・時間の正規化
- ISO形式への統一
- JSTタイムゾーンへの変換
- 和暦対応（CSV入力時）

### カレンダーイベントの正規化
- イベントタイトル・説明のパターン統一
- 施術内容の標準化
- 定期イベントの展開と例外処理

## 10. データ品質管理

- 必須項目のバリデーション（最低限名前は必須）
- データ型チェック（日付、電話番号など）
- フォーマットバリデーション（メールアドレス、電話番号）
- データ品質スコアの計算と表示
  - 完全性: 必要フィールドがどれだけ埋まっているか
  - 正確性: フォーマットが正しいか
  - 一貫性: 他のデータと矛盾がないか

## 11. カレンダー連携の実装詳細

### Google Calendar API統合
- OAuth 2.0認証フロー
- カレンダーリスト取得と選択UI
- Webhookを利用したリアルタイム更新通知
- インクリメンタル同期（変更のあったイベントのみ取得）

### iCloud Calendar統合
- CalDAV/WebDAVプロトコル対応
- Apple ID認証と連携許可フロー
- カレンダーイベント定期取得（ポーリング）

### カレンダープロバイダ抽象レイヤー
- プロバイダ間の差異を吸収するアダプターパターン
- 統一されたイベントオブジェクトモデル
- エラーハンドリングと再試行ロジック

## 12. インポート設定の保存と再利用

- 組織ごとのフィールドマッピング設定の保存
- カレンダーアクセストークンのセキュアな保存
- インポートプロファイルの作成と再利用
- マッピングテンプレートのエクスポート/インポート

## 13. セキュリティ対策

- 個人情報の暗号化保存
- OAuth認証情報の安全な管理
- アクセストークンの定期的なローテーション
- インポートファイルの一時保存と安全な削除
- データアクセス監査ログの記録