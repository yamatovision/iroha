# スーパー管理者システム データモデル設計

## 概要

スーパー管理者システムは、「美姫命」アプリケーション全体を管理するための上位管理者向け機能群です。このシステムでは、複数の美容サロン（組織）の管理・監視、プラン管理、課金管理、システム設定などの機能を提供します。

## エンティティ関連図

```
+-------------------+     +------------------+     +--------------------+
| SuperAdmin        |     | Organization     |     | OrganizationAdmin  |
+-------------------+     +------------------+     +--------------------+
| _id               |     | _id              |     | _id                |
| name              |     | name             |     | name               |
| email             |     | logoUrl          |     | email              |
| password          |     | address          |     | password           |
| role              |--+  | phone            |     | organizationId     |
| accessModules     |  |  | email            |--+  | role               |
| lastLogin         |  |  | website          |  |  | lastLogin          |
| createdAt         |  |  | planId           |  |  | createdAt          |
| updatedAt         |  |  | status           |  |  | updatedAt          |
+-------------------+  |  | trialEndsAt      |  |  +--------------------+
                       |  | createdAt        |  |
                       |  | updatedAt        |  |     +-----------------+
                       |  +------------------+  |     | SajuProfile     |
                       |                        |     +-----------------+
                       |  +------------------+  |     | _id             |
                       |  | User (Stylist)   |  |     | userId          |
                       +->| _id              |  |     | birthDate       |
                          | name             |<-+     | birthTime       |
                          | email            |        | birthPlace      |
                          | password         |------->| ...（他の四柱推命情報）|
                          | organizationId   |        +-----------------+
                          | role             |
                          | lastLogin        |
                          | createdAt        |
                          | updatedAt        |
                          +------------------+

+-------------------+     +------------------+     +--------------------+
| Subscription      |     | Plan             |     | Invoice            |
+-------------------+     +------------------+     +--------------------+
| _id               |     | _id              |     | _id                |
| organizationId    |--+  | name             |     | subscriptionId     |
| planId            |--|  | price            |     | amount             |
| status            |  |  | description      |     | status             |
| startDate         |  |  | features         |     | dueDate            |
| endDate           |  |  | maxStylists      |     | paidAt             |
| billingCycle      |  |  | maxClients       |     | createdAt          |
| nextBillingDate   |  |  | createdAt        |     | updatedAt          |
| createdAt         |  |  | updatedAt        |     +--------------------+
| updatedAt         |  |  +------------------+
+-------------------+  |
                       |  +------------------+
                       |  | SupportTicket    |
                       +->| _id              |
                          | organizationId   |
                          | title            |
                          | description      |
                          | status           |
                          | priority         |
                          | assignedTo       |
                          | resolvedAt       |
                          | createdAt        |
                          | updatedAt        |
                          +------------------+

+-------------------+     +------------------+
| SystemSettings    |     | ActivityLog      |
+-------------------+     +------------------+
| _id               |     | _id              |
| key               |     | userType         |
| value             |     | userId           |
| description       |     | action           |
| createdAt         |     | targetType       |
| updatedAt         |     | targetId         |
|                   |     | details          |
|                   |     | ipAddress        |
|                   |     | userAgent        |
|                   |     | createdAt        |
+-------------------+     +------------------+
```

## データモデル詳細

### 1. SuperAdmin（スーパー管理者）

システム全体を管理するスーパー管理者のアカウント情報を管理するモデル。

```typescript
interface SuperAdmin {
  _id: ObjectId;             // 管理者ID
  name: string;              // 名前
  email: string;             // メールアドレス（ログインID）
  password: string;          // ハッシュ化されたパスワード
  role: SuperAdminRole;      // 権限レベル（SUPER_ADMIN, READ_ONLY, SUPPORT）
  accessModules: string[];   // アクセス可能なモジュール ['organizations', 'users', 'billing', 'support', 'analytics', 'settings']
  lastLogin: Date | null;    // 最終ログイン日時
  createdAt: Date;           // 作成日時
  updatedAt: Date;           // 更新日時
}

enum SuperAdminRole {
  SUPER_ADMIN = 'super_admin',  // 完全な管理権限
  READ_ONLY = 'read_only',      // 閲覧のみ可能
  SUPPORT = 'support'           // サポート対応のみ可能
}
```

### 2. Organization（組織）

美容サロンなどの組織に関する情報を管理するモデル。

```typescript
interface Organization {
  _id: ObjectId;             // 組織ID
  name: string;              // 組織名
  logoUrl: string | null;    // ロゴ画像のURL
  address: string | null;    // 住所
  phone: string | null;      // 電話番号
  email: string;             // 連絡先メールアドレス
  website: string | null;    // ウェブサイトURL
  planId: ObjectId;          // 契約プランID
  status: OrganizationStatus; // 組織のステータス
  trialEndsAt: Date | null;  // トライアル終了日時（トライアル中の場合）
  createdAt: Date;           // 作成日時
  updatedAt: Date;           // 更新日時
}

enum OrganizationStatus {
  ACTIVE = 'active',         // アクティブ
  TRIAL = 'trial',           // トライアル中
  SUSPENDED = 'suspended',   // 停止中
  DELETED = 'deleted'        // 削除済み
}
```

### 3. OrganizationAdmin（組織管理者）

各組織の管理者アカウント情報を管理するモデル。

```typescript
interface OrganizationAdmin {
  _id: ObjectId;             // 管理者ID
  name: string;              // 名前
  email: string;             // メールアドレス（ログインID）
  password: string;          // ハッシュ化されたパスワード
  organizationId: ObjectId;  // 所属組織ID
  role: string;              // 権限（admin, restricted_admin）
  lastLogin: Date | null;    // 最終ログイン日時
  createdAt: Date;           // 作成日時
  updatedAt: Date;           // 更新日時
}
```

### 4. User（スタイリスト）

既存のUser（スタイリスト）モデルに組織IDを追加。

```typescript
interface User {
  _id: ObjectId;             // ユーザーID
  name: string;              // 名前
  email: string;             // メールアドレス（ログインID）
  password: string;          // ハッシュ化されたパスワード
  organizationId: ObjectId;  // 所属組織ID
  role: string;              // 役割（stylist, admin）
  lastLogin: Date | null;    // 最終ログイン日時
  createdAt: Date;           // 作成日時
  updatedAt: Date;           // 更新日時
  // 他の既存フィールド...
}
```

### 5. Plan（プラン）

提供するサブスクリプションプランの情報を管理するモデル。

```typescript
interface Plan {
  _id: ObjectId;             // プランID
  name: string;              // プラン名（ベーシック、スタンダード、プレミアム等）
  price: number;             // 月額料金（円）
  description: string;       // プラン説明
  features: string[];        // 含まれる機能のリスト
  maxStylists: number | null; // 最大スタイリスト数（null=無制限）
  maxClients: number | null; // 最大クライアント数（null=無制限）
  createdAt: Date;           // 作成日時
  updatedAt: Date;           // 更新日時
}
```

### 6. Subscription（サブスクリプション）

組織のサブスクリプション情報を管理するモデル。

```typescript
interface Subscription {
  _id: ObjectId;             // サブスクリプションID
  organizationId: ObjectId;  // 組織ID
  planId: ObjectId;          // プランID
  status: SubscriptionStatus; // ステータス
  startDate: Date;           // 開始日
  endDate: Date | null;      // 終了日（無期限の場合はnull）
  billingCycle: BillingCycle; // 請求サイクル
  nextBillingDate: Date;     // 次回請求日
  createdAt: Date;           // 作成日時
  updatedAt: Date;           // 更新日時
}

enum SubscriptionStatus {
  ACTIVE = 'active',         // アクティブ
  TRIAL = 'trial',           // トライアル中
  PAST_DUE = 'past_due',     // 支払い遅延
  CANCELED = 'canceled',     // キャンセル済み
  EXPIRED = 'expired'        // 期限切れ
}

enum BillingCycle {
  MONTHLY = 'monthly',       // 月額
  YEARLY = 'yearly'          // 年額
}
```

### 7. Invoice（請求書）

請求書情報を管理するモデル。

```typescript
interface Invoice {
  _id: ObjectId;             // 請求書ID
  subscriptionId: ObjectId;  // サブスクリプションID
  amount: number;            // 請求金額
  status: InvoiceStatus;     // ステータス
  dueDate: Date;             // 支払期限
  paidAt: Date | null;       // 支払日時
  createdAt: Date;           // 作成日時
  updatedAt: Date;           // 更新日時
}

enum InvoiceStatus {
  PENDING = 'pending',       // 支払い待ち
  PAID = 'paid',             // 支払い済み
  PAST_DUE = 'past_due',     // 支払い遅延
  CANCELED = 'canceled'      // キャンセル
}
```

### 8. SupportTicket（サポートチケット）

サポート問い合わせ情報を管理するモデル。

```typescript
interface SupportTicket {
  _id: ObjectId;             // チケットID
  organizationId: ObjectId;  // 組織ID
  title: string;             // タイトル
  description: string;       // 問い合わせ内容
  status: TicketStatus;      // ステータス
  priority: TicketPriority;  // 優先度
  assignedTo: ObjectId | null; // 担当者ID（スーパー管理者ID）
  resolvedAt: Date | null;   // 解決日時
  createdAt: Date;           // 作成日時
  updatedAt: Date;           // 更新日時
}

enum TicketStatus {
  OPEN = 'open',             // 未対応
  IN_PROGRESS = 'in_progress', // 対応中
  RESOLVED = 'resolved',     // 解決済み
  CLOSED = 'closed'          // クローズ
}

enum TicketPriority {
  LOW = 'low',               // 低
  MEDIUM = 'medium',         // 中
  HIGH = 'high',             // 高
  URGENT = 'urgent'          // 緊急
}
```

### 9. SystemSettings（システム設定）

システム全体の設定を管理するモデル。

```typescript
interface SystemSettings {
  _id: ObjectId;             // 設定ID
  key: string;               // 設定キー
  value: string;             // 設定値
  description: string;       // 説明
  createdAt: Date;           // 作成日時
  updatedAt: Date;           // 更新日時
}
```

### 10. ActivityLog（アクティビティログ）

システム内の重要な操作ログを記録するモデル。

```typescript
interface ActivityLog {
  _id: ObjectId;             // ログID
  userType: string;          // ユーザータイプ（super_admin, organization_admin, user）
  userId: ObjectId;          // ユーザーID
  action: string;            // 実行されたアクション
  targetType: string;        // 対象のタイプ（organization, user, subscription, etc.）
  targetId: ObjectId | null; // 対象のID
  details: Record<string, any>; // 詳細情報
  ipAddress: string;         // IPアドレス
  userAgent: string;         // ユーザーエージェント
  createdAt: Date;           // 作成日時
}
```

## データの関連性と整合性

### 主要な関連性

1. **SuperAdmin → Organization**: スーパー管理者は複数の組織を管理します。
2. **Organization → OrganizationAdmin**: 組織には1人以上の組織管理者が属します。
3. **Organization → User**: 組織には複数のスタイリスト（ユーザー）が属します。
4. **Organization → Subscription**: 組織は1つのサブスクリプションを持ちます。
5. **Subscription → Plan**: サブスクリプションは1つのプランに紐づきます。
6. **Subscription → Invoice**: サブスクリプションからは複数の請求書が生成されます。
7. **Organization → SupportTicket**: 組織からは複数のサポートチケットが作成されます。

### 整合性制約

1. 組織が削除される場合、関連するすべてのデータ（管理者、ユーザー、サブスクリプション、請求書、サポートチケット）も適切に処理する必要があります。
2. サブスクリプションのステータスは組織のステータスと整合性を保つ必要があります。
3. ユーザーのロールや権限は適切に管理し、不正アクセスを防止する必要があります。

## データのライフサイクル

### 組織の登録と初期設定フロー

1. スーパー管理者が新規組織を登録
2. 組織の基本情報を入力
3. トライアルプランを設定（通常30日間）
4. 組織管理者の招待メールを送信
5. 組織管理者がアカウント設定を完了

### サブスクリプションのライフサイクル

1. トライアル開始
2. トライアル期間中のサービス利用
3. トライアル終了前の通知
4. 正規プランへの移行または期限切れ
5. 定期的な請求と更新
6. プランの変更管理

### サポートチケットのライフサイクル

1. 組織からのサポート問い合わせ作成
2. チケットの受付と優先度設定
3. スーパー管理者による担当者割り当て
4. 対応と進捗管理
5. 解決と完了処理

## データの移行・バックアップ戦略

1. 既存のユーザー・サロンデータを組織モデルへ移行するための一時的なマッピングを用意
2. データ移行中のサービス継続性を確保するための段階的な移行計画
3. 日次のデータバックアップと災害復旧計画
4. 長期データアーカイブの方針策定

## スケーラビリティ考慮事項

1. 組織数の増加に対応するためのデータベースシャーディング戦略
2. 高トラフィック時のパフォーマンス最適化
3. 大量データに対するインデックス戦略
4. キャッシュ層の導入によるデータアクセス最適化

## セキュリティ設計

1. 異なる権限レベル（スーパー管理者、組織管理者、一般ユーザー）に応じたアクセス制御
2. センシティブなデータ（支払い情報など）の暗号化
3. アクティビティログによる監査証跡の保持
4. 不正アクセス検出と防止メカニズム
5. データの安全な削除と匿名化プロセス

## 将来の拡張性

1. 組織間の連携機能のための拡張可能なデータモデル設計
2. マルチテナント環境でのデータ分離戦略
3. 国際化対応（多言語、多通貨、タイムゾーン）
4. 分析・レポーティング機能の強化に備えたデータ構造