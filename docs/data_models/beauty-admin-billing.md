# 請求・支払い管理機能のデータモデル設計

このドキュメントでは、美姫命アプリケーションの請求・支払い管理機能に関連するデータモデル設計を定義します。ここで説明するモデルは、組織オーナー（Owner）がアクセスする請求・支払い管理機能で使用されます。

## 1. データモデル概要と関連図

以下は、請求・支払い管理機能に関連する主要なデータモデル間の関係を示す図です：

```
                     ┌─────────────────┐
                     │     組織        │
                     │  Organization   │
                     └─────────┬───────┘
                               │
                               │ 1
                               ▼
                     ┌─────────────────┐        ┌─────────────────┐
                     │ サブスクリプション│        │   料金プラン    │
                     │  Subscription   │◄───────┤   PricePlan     │
                     └─────────┬───────┘        └─────────────────┘
                               │
                               │ 1
                               ▼
       ┌───────────────────────┬─────────────────────┐
       │                       │                     │
       ▼                       ▼                     ▼
┌─────────────┐       ┌─────────────────┐    ┌─────────────────┐
│  請求書     │       │トークン使用統計   │    │ トークンチャージ │
│  Invoice    │       │TokenUsageStats   │    │  TokenCharge    │
└─────────────┘       └─────────────────┘    └─────────────────┘
       ▲
       │
       │
┌─────────────┐
│ 支払い方法  │
│PaymentMethod│
└─────────────┘
```

## 2. 主要エンティティの詳細定義

### 2.1 組織 (Organization)

組織（美容サロン）の基本情報を管理するエンティティ。

```typescript
interface Organization {
  _id: string;                // 組織ID
  name: string;               // 組織名
  status: OrganizationStatus; // 組織の状態（アクティブ、トライアル中、停止中等）
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}

// 組織ステータス
enum OrganizationStatus {
  ACTIVE = 'active',         // 有効
  TRIAL = 'trial',           // トライアル中
  SUSPENDED = 'suspended',   // 停止中（支払い問題等）
  DELETED = 'deleted'        // 削除済み
}
```

### 2.2 料金プラン (PricePlan)

提供される各サブスクリプションプランの詳細情報を定義するエンティティ。

```typescript
interface PricePlan {
  _id: string;                // プランID
  name: string;               // プラン名
  price: number;              // 月額基本料金
  yearlyPrice: number;        // 年額料金（通常は月額の12倍から割引）
  description: string;        // プラン説明
  features: string[];         // 機能リスト
  maxStylists: number | null; // 最大スタイリスト数（nullは無制限）
  maxClients: number | null;  // 最大クライアント数（nullは無制限）
  maxTokensPerMonth: number;  // 月間最大トークン数
  additionalTokenPrice: number; // 追加トークン1Mあたりの価格
  isActive: boolean;          // 有効/無効フラグ
  displayOrder: number;       // 表示順序
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}
```

### 2.3 サブスクリプション (Subscription)

組織と料金プランを紐づける契約情報を管理するエンティティ。

```typescript
interface Subscription {
  _id: string;                // サブスクリプションID
  organizationId: string;     // 組織ID
  planId: string;             // プランID
  status: SubscriptionStatus; // ステータス
  paymentStatus: PaymentStatus; // 支払いステータス
  startDate: Date;            // 開始日
  endDate: Date | null;       // 終了日（nullは無期限）
  billingCycle: BillingCycle; // 請求サイクル
  nextBillingDate: Date;      // 次回請求日
  currentPeriodStart: Date;   // 現在の請求期間開始日
  currentPeriodEnd: Date;     // 現在の請求期間終了日
  paymentFailCount: number;   // 支払い失敗回数
  lastPaymentDate?: Date;     // 最終支払い日
  lastFailureReason?: string; // 最後の失敗理由
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}

// サブスクリプションステータス
enum SubscriptionStatus {
  TRIAL = 'trial',            // トライアル中
  ACTIVE = 'active',          // アクティブ
  PAST_DUE = 'past_due',      // 支払い遅延
  CANCELED = 'canceled',      // キャンセル済み
  SUSPENDED = 'suspended'     // 一時停止中
}

// 支払いステータス
enum PaymentStatus {
  SUCCESS = 'success',   // 支払い成功
  FAILED = 'failed',     // 支払い失敗
  PENDING = 'pending'    // 処理中
}

// 請求サイクル
enum BillingCycle {
  MONTHLY = 'monthly',        // 月額
  YEARLY = 'yearly'           // 年額
}
```

### 2.4 請求書 (Invoice)

サブスクリプションに基づいて発行される請求書情報を管理するエンティティ。

```typescript
interface Invoice {
  _id: string;                // 請求書ID
  invoiceNumber: string;      // 請求書番号
  subscriptionId: string;     // サブスクリプションID
  organizationId: string;     // 組織ID
  planId: string;             // プランID
  amount: number;             // 請求金額
  status: InvoiceStatus;      // ステータス
  issueDate: Date;            // 発行日
  dueDate: Date;              // 支払期限
  paidAt: Date | null;        // 支払日
  items: InvoiceItem[];       // 請求項目
  notes: string;              // 備考
  tokenUsage?: {              // トークン使用状況
    totalTokens: number;      // 合計トークン数
    planLimit: number;        // プラン上限
    additionalTokens: number; // 追加トークン
    utilizationPercentage: number; // 使用率
  };
  paymentMethod?: {           // 支払い方法
    id: string;               // 支払い方法ID
    type: string;             // 種類（クレジットカードなど）
    last4: string;            // 下4桁
    brand: string;            // ブランド（VISAなど）
  };
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}

// 請求書項目
interface InvoiceItem {
  description: string;        // 内容
  quantity: number;           // 数量
  unitPrice: number;          // 単価
  amount: number;             // 金額
}

// 請求書ステータス
enum InvoiceStatus {
  PENDING = 'pending',        // 支払い待ち
  PAID = 'paid',              // 支払い済み
  PAST_DUE = 'past_due',      // 支払い遅延
  CANCELED = 'canceled'       // キャンセル
}
```

### 2.5 トークン使用統計 (TokenUsageStats)

組織ごとのAPIトークン使用状況を集計・管理するエンティティ。

```typescript
interface TokenUsageStats {
  _id: string;                // 統計ID
  organizationId: string;     // 組織ID
  period: string;             // 期間（YYYY-MM形式）
  totalTokens: number;        // 合計トークン数
  planLimit: number;          // プラン上限
  additionalTokens: number;   // 追加チャージトークン
  utilizationPercentage: number; // 使用率
  byDay: {                    // 日別統計
    date: string;             // 日付
    tokens: number;           // トークン数
  }[];
  byUser: {                   // ユーザー別統計
    userId: string;           // ユーザーID
    userName: string;         // ユーザー名
    tokens: number;           // トークン数
    percentage: number;       // 割合
  }[];
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}
```

### 2.6 トークンチャージ (TokenCharge)

組織が購入した追加APIトークンチャージの履歴と残量を管理するエンティティ。

```typescript
interface TokenCharge {
  _id: string;                // チャージID
  organizationId: string;     // 組織ID
  userId: string;             // 購入者ID
  purchaseDate: Date;         // 購入日時
  chargeType: 'standard' | 'premium'; // チャージタイプ
  tokenAmount: number;        // トークン数
  price: number;              // 金額
  expirationDate: Date;       // 有効期限
  remainingTokens: number;    // 残りトークン数
  status: 'active' | 'expired' | 'exhausted'; // ステータス
  invoiceId?: string;         // 関連する請求書ID
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}
```

### 2.7 支払い方法 (PaymentMethod)

組織のサブスクリプション支払いに使用される支払い方法情報を管理するエンティティ。

```typescript
interface PaymentMethod {
  _id: string;                // 支払い方法ID
  organizationId: string;     // 組織ID
  type: string;               // 種類（クレジットカードなど）
  cardHolder?: string;        // カード保持者名
  last4?: string;             // 下4桁
  brand?: string;             // ブランド（VISAなど）
  expiryMonth?: number;       // 有効期限（月）
  expiryYear?: number;        // 有効期限（年）
  isDefault: boolean;         // デフォルトフラグ
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}
```

### 2.8 ユーザー・トークン使用ログ (UserTokenUsage)

個々のAPIリクエストごとのトークン使用ログを記録するエンティティ。集計や異常検知に使用。

```typescript
interface UserTokenUsage {
  _id: string;                // ログID
  organizationId: string;     // 組織ID
  userId: string;             // ユーザーID
  timestamp: Date;            // タイムスタンプ
  promptTokens: number;       // プロンプトトークン数（入力）
  completionTokens: number;   // 完了トークン数（出力）
  totalTokens: number;        // 合計トークン数
  endpoint: string;           // エンドポイント（'chat', 'image'など）
  sessionId?: string;         // セッションID
  cost: number;               // コスト（計算値）
  model: string;              // モデル（'gpt-4o'）
  requestId?: string;         // リクエスト識別子（外部APIリクエストID）
  createdAt: Date;            // 作成日時
}
```

## 3. リレーションシップ

データモデル間の関連性を以下に定義します：

1. **Organization → Subscription**: 1対1関係
   - 各組織は1つのサブスクリプションを持つ
   - `Subscription.organizationId` が `Organization._id` を参照

2. **PricePlan → Subscription**: 1対多関係
   - 1つの料金プランを複数の組織が利用可能
   - `Subscription.planId` が `PricePlan._id` を参照

3. **Subscription → Invoice**: 1対多関係
   - 1つのサブスクリプションが複数の請求書を持つ
   - `Invoice.subscriptionId` が `Subscription._id` を参照

4. **Organization → PaymentMethod**: 1対多関係
   - 1つの組織が複数の支払い方法を持つ
   - `PaymentMethod.organizationId` が `Organization._id` を参照

5. **Organization → TokenUsageStats**: 1対多関係
   - 1つの組織が複数期間のトークン使用統計を持つ
   - `TokenUsageStats.organizationId` が `Organization._id` を参照

6. **Organization → TokenCharge**: 1対多関係
   - 1つの組織が複数のトークンチャージを持つ
   - `TokenCharge.organizationId` が `Organization._id` を参照

7. **Organization → UserTokenUsage**: 1対多関係
   - 1つの組織の複数ユーザーが複数のトークン使用ログを持つ
   - `UserTokenUsage.organizationId` が `Organization._id` を参照

8. **Invoice ← TokenCharge**: 多対1関係
   - トークンチャージは対応する請求書へ紐づけられる
   - `TokenCharge.invoiceId` が `Invoice._id` を参照

## 4. インデックス設計

検索効率と一貫性を保つためのインデックス設計を以下に定義します：

### 4.1 PricePlan コレクション

- `name`: 一意インデックス（プラン名検索用）
- `isActive`: 非一意インデックス（有効プラン検索用）
- `displayOrder`: 非一意インデックス（表示順序用）

### 4.2 Subscription コレクション

- `organizationId`: 一意インデックス（組織ID検索用）
- `planId`: 非一意インデックス（プラン別検索用）
- `status`: 非一意インデックス（ステータス別検索用）
- `nextBillingDate`: 非一意インデックス（請求処理用）
- `{organizationId, planId}`: 複合インデックス（一意制約）

### 4.3 Invoice コレクション

- `invoiceNumber`: 一意インデックス（請求書番号検索用）
- `organizationId`: 非一意インデックス（組織別検索用）
- `subscriptionId`: 非一意インデックス（サブスクリプション別検索用）
- `status`: 非一意インデックス（ステータス別検索用）
- `dueDate`: 非一意インデックス（期限管理用）
- `issueDate`: 非一意インデックス（発行日検索用）

### 4.4 TokenCharge コレクション

- `organizationId`: 非一意インデックス（組織別検索用）
- `status`: 非一意インデックス（ステータス別検索用）
- `expirationDate`: 非一意インデックス（有効期限管理用）
- `{organizationId, status}`: 複合インデックス（有効なチャージ検索用）

### 4.5 PaymentMethod コレクション

- `organizationId`: 非一意インデックス（組織別検索用）
- `{organizationId, isDefault}`: 複合インデックス（デフォルト支払い方法検索用）

### 4.6 TokenUsageStats コレクション

- `organizationId`: 非一意インデックス（組織別検索用）
- `period`: 非一意インデックス（期間別検索用）
- `{organizationId, period}`: 複合インデックス（一意制約）

### 4.7 UserTokenUsage コレクション

- `organizationId`: 非一意インデックス（組織別検索用）
- `userId`: 非一意インデックス（ユーザー別検索用）
- `timestamp`: 非一意インデックス（時系列検索用）
- `{organizationId, timestamp}`: 複合インデックス（組織別時系列データ検索用）
- `{organizationId, userId, timestamp}`: 複合インデックス（ユーザー別時系列データ検索用）

## 5. データフロー

請求・支払い管理機能における主要なデータフローを以下に説明します：

### 5.1 サブスクリプション更新フロー

1. **データフロートリガー**: 
   - スケジュールされたジョブが実行される（毎日）
   - 該当日が `Subscription.nextBillingDate` と一致

2. **処理ステップ**:
   - バッチ処理は `nextBillingDate` が当日のサブスクリプションを取得
   - 各サブスクリプションについて:
     a. 関連する `PricePlan` 情報を取得
     b. 前月の `TokenUsageStats` を取得
     c. 新しい `Invoice` を生成
     d. `Subscription` の請求期間と次回請求日を更新

3. **データ変更**:
   - 新しい `Invoice` レコードが作成される
   - `Subscription` の `currentPeriodStart`, `currentPeriodEnd`, `nextBillingDate` が更新される

### 5.2 トークン購入フロー

1. **データフロートリガー**:
   - ユーザーがUIでAPIトークン追加チャージを購入

2. **処理ステップ**:
   - ユーザーが購入タイプを選択（standard/premium）
   - 支払い方法が検証される
   - `TokenCharge` レコードが作成される
   - 当月の請求書に料金が追加または新規請求書が作成される

3. **データ変更**:
   - 新しい `TokenCharge` レコードが作成される
   - `Invoice` が更新または新規作成される
   - `TokenUsageStats` の `additionalTokens` が更新される

### 5.3 トークン使用量更新フロー

1. **データフロートリガー**:
   - ユーザーがAPIリクエスト（チャット等）を実行
   - リクエスト処理後に使用トークン数が記録される

2. **処理ステップ**:
   - `UserTokenUsage` エントリが作成される
   - 日次バッチ処理で `TokenUsageStats` が集計・更新される

3. **データ変更**:
   - 新しい `UserTokenUsage` レコードが作成される
   - `TokenUsageStats` の合計値と内訳が更新される
   - トークンチャージを使用した場合、`TokenCharge.remainingTokens` が減少

### 5.4 支払い処理フロー

1. **データフロートリガー**:
   - 請求書の支払い期日到来
   - またはオーナーによる手動支払い

2. **処理ステップ**:
   - デフォルト支払い方法情報を取得
   - 支払いゲートウェイで決済処理
   - 支払い結果に基づき請求書ステータス更新

3. **データ変更**:
   - `Invoice.status` が `PENDING` から `PAID` に更新
   - `Invoice.paidAt` が現在時刻に設定
   - `Subscription.paymentStatus` が更新される
   - `Subscription.lastPaymentDate` が更新される

## 6. バリデーションルール

データの整合性を保つための主要なバリデーションルールを以下に定義します：

### 6.1 PricePlan

- `name`: 必須、一意
- `price`: 必須、正の数値
- `yearlyPrice`: 必須、正の数値、`price * 12` 以下（割引率の考慮）
- `maxTokensPerMonth`: 必須、正の整数
- `additionalTokenPrice`: 必須、正の数値

### 6.2 Subscription

- `organizationId`: 必須、存在する組織IDへの参照
- `planId`: 必須、存在する料金プランIDへの参照
- `status`: 許可された値のみ（`SubscriptionStatus` 列挙型）
- `billingCycle`: 許可された値のみ（`BillingCycle` 列挙型）
- `nextBillingDate`: 現在日時以降の日付
- `currentPeriodEnd`: `currentPeriodStart` より後の日付

### 6.3 Invoice

- `invoiceNumber`: 必須、一意、フォーマット規則に準拠
- `subscriptionId`: 必須、存在するサブスクリプションIDへの参照
- `organizationId`: 必須、存在する組織IDへの参照
- `amount`: 必須、非負数値
- `status`: 許可された値のみ（`InvoiceStatus` 列挙型）
- `dueDate`: `issueDate` より後の日付
- `items`: 少なくとも1つのアイテムを含む配列

### 6.4 TokenCharge

- `organizationId`: 必須、存在する組織IDへの参照
- `userId`: 必須、存在するユーザーIDへの参照
- `tokenAmount`: 必須、正の整数、定義された値の一つ（1,000,000または10,000,000）
- `price`: 必須、非負数値
- `expirationDate`: 必須、`purchaseDate` より後の日付
- `remainingTokens`: `tokenAmount` 以下の正の整数

### 6.5 PaymentMethod

- `organizationId`: 必須、存在する組織IDへの参照
- 組織ごとのデフォルト支払い方法は1つのみ

## 7. データマイグレーション計画

既存システムやスキーマの変更に対応するためのデータマイグレーション戦略を定義します：

### 7.1 初期データ設定

1. **デフォルト料金プランの作成**
   - ベーシック、スタンダード、プロフェッショナル、エンタープライズの各プラン
   - 各プランのトークン上限とその他の制限設定

2. **既存組織のサブスクリプション設定**
   - 現在の契約情報に基づくサブスクリプションレコードの作成
   - 請求サイクルと次回請求日の設定

### 7.2 トークン使用量データ初期化

1. **過去のAPI使用ログの移行**
   - 既存のログデータから`UserTokenUsage`レコードの作成
   - 月別の集計データを`TokenUsageStats`に変換

2. **既存請求書データの移行**
   - 現在の請求情報を新しい`Invoice`スキーマに変換

### 7.3 段階的デプロイ

1. **読み取り専用モードでのデプロイ**
   - 最初は新しいスキーマで読み取り操作のみを許可
   - 既存機能との並行運用で整合性を検証

2. **書き込み機能の有効化**
   - 検証後に新しいスキーマでの書き込み操作を許可
   - 段階的に古い機能を新しい実装に置き換え

## 8. パフォーマンス考慮点

システムのスケーラビリティとパフォーマンスを確保するための考慮点を定義します：

1. **高頻度アクセスへの対応**
   - `TokenUsageStats`の集計データはキャッシュの活用
   - トークン使用量のリアルタイム表示のための効率的なクエリ

2. **大量データの処理**
   - `UserTokenUsage`テーブルは定期的なアーカイブ処理が必要
   - 古いデータは集計後に圧縮保存または別テーブルに移行

3. **請求処理の効率化**
   - インデックス設計の最適化（特に日付ベースのクエリ）
   - バッチ処理の分散実行（組織IDによるシャーディング）

4. **分析クエリの最適化**
   - 頻繁なレポートクエリに対する集計ビューの作成
   - 必要に応じて分析用の別ストレージへの複製

## 9. セキュリティ考慮点

支払い情報と業務データの保護のための考慮点を定義します：

1. **機密情報の保護**
   - カード情報は外部決済サービスでのトークン化
   - `PaymentMethod`にはカード全番号を保存しない
   - 生体認証やMFAによる支払い処理の保護

2. **アクセス制御**
   - 請求・支払い情報へのアクセスはOwnerロールのみに制限
   - トークン使用統計は役割に応じた表示制限（Admin, Owner）

3. **監査とコンプライアンス**
   - 支払い操作は監査ログに詳細記録
   - 個人情報と支払い情報の処理はPCI DSSに準拠

4. **データ暗号化**
   - 全ての支払い情報はデータベースレベルでの暗号化
   - APIレベルではHTTPSとJWT認証の徹底

## 10. データ一貫性の確保

サービス全体におけるデータの一貫性を確保するための戦略を定義します：

1. **トランザクション管理**
   - 支払い処理とサブスクリプション更新はトランザクション内で実行
   - 分散トランザクションが困難な場合は補償トランザクションパターンの適用

2. **非同期処理の整合性**
   - 支払い確認とトークン利用可能化は順序保証
   - 操作結果の確認と失敗時の自動リトライ

3. **データ整合性チェック**
   - 定期的な整合性確認ジョブの実行
   - `TokenUsageStats`と`UserTokenUsage`の合計値一致検証
   - `Invoice`項目の合計と`amount`フィールドの一致検証

## 11. スキーマ進化の方向性

データモデルの将来の発展方向について考慮点を定義します：

1. **柔軟なプラン構造への対応**
   - 将来的なカスタムプランやアドオン機能のサポート
   - 料金プラン構造のバージョニング対応

2. **異なる課金モデルのサポート**
   - 従量課金、階層型課金など様々なモデルへの拡張
   - 期間限定の割引やプロモーション対応

3. **国際化対応**
   - 多通貨対応のための価格設計
   - 税制や規制の地域差に対応するスキーマ拡張