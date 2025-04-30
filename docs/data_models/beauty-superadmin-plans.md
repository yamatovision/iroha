# 課金・プラン管理と収益シミュレーションのデータモデル設計

## 目的
この文書は美姫命アプリケーションのSuperAdmin向け課金・プラン管理および収益シミュレーション機能のデータモデル設計を定義するものです。

## データモデル概要

### 関連するモデル間の依存関係図

```
                     +------------------+
                     | SimulationParams |
                     +------------------+
                             |
                             v
+-------------+      +---------------+      +------------+
|   PricePlan |<-----| Subscription  |----->| Organization|
+-------------+      +---------------+      +------------+
       ^                    |                   |
       |                    v                   v
       |             +-------------+     +------------------+
       +-------------|   Invoice   |     | TokenUsageStats  |
                     +-------------+     +------------------+
                                               |
                                               v
                                        +------------------+
                                        | RevenueSimulation|
                                        +------------------+
```

## 主要データモデル

### 1. PricePlan (料金プラン)

サービスの利用料金プランを定義するモデル。

```typescript
interface PricePlan {
  _id: string;                // プランID
  name: string;               // プラン名
  price: number;              // 月額料金
  description: string;        // プラン説明
  features: string[];         // 機能リスト
  maxStylists: number | null; // 最大スタイリスト数（nullは無制限）
  maxClients: number | null;  // 最大クライアント数（nullは無制限）
  isActive: boolean;          // 有効/無効フラグ
  displayOrder: number;       // 表示順序
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}
```

### 2. Subscription (サブスクリプション)

組織とプランを紐づけ、契約状態を管理するモデル。

```typescript
interface Subscription {
  _id: string;                // サブスクリプションID
  organizationId: string;     // 組織ID
  planId: string;             // プランID
  status: SubscriptionStatus; // ステータス
  startDate: Date;            // 開始日
  endDate: Date | null;       // 終了日（nullは無期限）
  billingCycle: BillingCycle; // 請求サイクル
  nextBillingDate: Date;      // 次回請求日
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

// 請求サイクル
enum BillingCycle {
  MONTHLY = 'monthly',        // 月額
  YEARLY = 'yearly'           // 年額
}
```

### 3. Invoice (請求書)

サブスクリプションに基づく請求書を管理するモデル。

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

### 4. Organization (組織)

サービスを利用する組織（美容サロン）を管理するモデル。プランとの紐付けのために参照されます。

```typescript
interface Organization {
  _id: string;                // 組織ID
  name: string;               // 組織名
  status: OrganizationStatus; // ステータス
  // 他の組織に関する情報（略）
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}

// 組織ステータス
enum OrganizationStatus {
  TRIAL = 'trial',            // トライアル中
  ACTIVE = 'active',          // アクティブ
  SUSPENDED = 'suspended',    // 一時停止中
  DELETED = 'deleted'         // 削除済み
}
```

## データの整合性と検証ルール

1. **プラン管理**
   - プラン名は一意であること
   - 料金は0以上の整数であること
   - 機能リストは空配列を許容する
   - 最大スタイリスト数と最大クライアント数は0以上の整数またはnull（無制限）であること

2. **サブスクリプション管理**
   - 組織IDとプランIDは必須
   - 開始日は必須で、現在日時よりも過去または現在の日時であること
   - 終了日はnullか開始日より後の日時であること
   - 次回請求日は開始日以降の日時であること

3. **請求書管理**
   - 請求書番号は一意であること
   - 発行日は必須
   - 支払期限は発行日以降であること
   - 支払日は支払済みの場合のみ値を持ち、それ以外はnullであること
   - 請求金額は0以上の数値であること

## データ遷移フロー

### プラン設定フロー
1. SuperAdminがプランを作成/編集
2. プランデータが保存される
3. 既存のサブスクリプションには影響しない（既存契約は保持）

### 組織のプラン割り当てフロー
1. SuperAdminが組織とプランを選択
2. サブスクリプションを作成/更新
3. 契約状態が更新される
4. 次回請求予定日が設定される

### 請求書管理フロー
1. 定期的なバッチ処理または手動操作で請求書が作成される
2. サブスクリプションの次回請求日に基づいて請求書が発行される
3. 請求書は「支払い待ち」状態で作成される
4. 支払いが完了すると「支払い済み」に更新される
5. 請求書の支払いが確認されるとサブスクリプションの次回請求日が更新される

## データ間の整合性保持のポイント

1. **サブスクリプションとプランの整合性**
   - プランが削除される場合、関連するサブスクリプションへの影響を考慮すること
   - プラン変更時の既存サブスクリプションへの影響を明確に定義すること

2. **請求書とサブスクリプションの整合性**
   - 請求書発行後のサブスクリプション情報変更の扱いを定義すること
   - サブスクリプションキャンセル時の未払い請求書の扱いを明確にすること

3. **組織状態とサブスクリプション状態の同期**
   - 組織が無効化された場合、サブスクリプションも自動的に一時停止するなどの連動処理を実装すること
   - トライアル期間終了時のステータス自動更新ロジックを明確にすること

## インデックス設計

性能最適化のための各コレクションのインデックス設計。

1. **PricePlan コレクション**
   - `name`: 一意インデックス（プラン名検索用）
   - `isActive`: 非一意インデックス（有効プラン検索用）
   - `displayOrder`: 非一意インデックス（表示順序用）

2. **Subscription コレクション**
   - `organizationId`: 非一意インデックス（組織別検索用）
   - `planId`: 非一意インデックス（プラン別検索用）
   - `status`: 非一意インデックス（ステータス別検索用）
   - `nextBillingDate`: 非一意インデックス（請求処理用）
   - `{organizationId, planId}`: 複合インデックス（重複チェック用）

3. **Invoice コレクション**
   - `invoiceNumber`: 一意インデックス（請求書番号検索用）
   - `organizationId`: 非一意インデックス（組織別検索用）
   - `subscriptionId`: 非一意インデックス（サブスクリプション別検索用）
   - `status`: 非一意インデックス（ステータス別検索用）
   - `dueDate`: 非一意インデックス（期限管理用）

## 移行・初期データ設定

システム初期化時のデフォルトプラン設定：

1. **ベーシックプラン**
   - 月額料金：4,980円
   - 最大スタイリスト数：5名
   - 最大クライアント数：200名
   - 機能：基本機能セット

2. **スタンダードプラン**
   - 月額料金：9,800円
   - 最大スタイリスト数：無制限
   - 最大クライアント数：500名
   - 機能：基本機能セット + 拡張機能

3. **プレミアムプラン**
   - 月額料金：19,800円
   - 最大スタイリスト数：無制限
   - 最大クライアント数：無制限
   - 機能：全機能セット

4. **トライアルプラン**
   - 月額料金：0円
   - 最大スタイリスト数：無制限（トライアル期間中）
   - 最大クライアント数：無制限（トライアル期間中）
   - 機能：全機能セット（トライアル期間中）
   - 期間：30日間

## 収益シミュレーション関連のデータモデル

### 1. SimulationParams (シミュレーションパラメータ)

収益シミュレーションの基本パラメータを管理するモデル。

```typescript
interface SimulationParams {
  _id: string;                  // パラメータセットID
  name: string;                 // 設定名（デフォルト設定など）
  exchangeRate: number;         // 為替レート (円/ドル)
  apiRate: number;              // API単価 ($/1Kトークン)
  sessionSize: number;          // 平均セッションサイズ (トークン/回)
  profitMargin: number;         // 目標利益率 (%)
  costRatio: number;            // 原価率 (%)
  isDefault: boolean;           // デフォルト設定フラグ
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
}
```

### 2. TokenUsageStats (トークン使用統計)

API使用量の統計データを管理するモデル。

```typescript
interface TokenUsageStats {
  _id: string;                  // 統計ID
  periodStart: Date;            // 期間開始日
  periodEnd: Date;              // 期間終了日
  totalTokens: number;          // 総トークン使用量
  totalCost: number;            // 総コスト
  byPlan: {                     // プラン別統計
    planId: string;             // プランID
    planName: string;           // プラン名
    totalTokens: number;        // プラン全体のトークン使用量
    organizationCount: number;  // 組織数
    avgTokensPerOrg: number;    // 組織あたり平均使用量
    utilizationPercentage: number; // 使用率（上限に対する割合）
  }[];
  byOrganization: {             // 組織別統計
    organizationId: string;     // 組織ID
    organizationName: string;   // 組織名
    planId: string;             // プランID
    totalTokens: number;        // 組織のトークン使用量
    utilizationPercentage: number; // 使用率（上限に対する割合）
  }[];
  dailyData: {                  // 日次データ
    date: Date;                 // 日付
    tokens: number;             // トークン数
    cost: number;               // コスト
  }[];
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
}
```

### 3. RevenueSimulation (収益シミュレーション)

シミュレーション結果を保存するモデル。

```typescript
interface RevenueSimulation {
  _id: string;                  // シミュレーションID
  name: string;                 // シミュレーション名
  description: string;          // 説明
  
  // 入力パラメータ
  params: {
    exchangeRate: number;       // 為替レート (円/ドル)
    apiRate: number;            // API単価 ($/1Kトークン)
    sessionSize: number;        // 平均セッションサイズ (トークン/回)
    profitMargin: number;       // 目標利益率 (%)
    
    // プラン別組織数
    organizationCounts: {
      [planId: string]: number; // プランIDと組織数のマッピング
    };
  };
  
  // 結果サマリー
  summary: {
    totalMonthlyRevenue: number;  // 合計月額収益
    totalYearlyRevenue: number;   // 合計年額収益
    totalTokenCost: number;       // 合計トークンコスト
    averageProfitMargin: number;  // 平均粗利率
    totalOrganizations: number;   // 合計組織数
  };
  
  // プラン別結果
  planResults: {
    [planId: string]: {
      planName: string;           // プラン名
      price: number;              // 料金
      organizationCount: number;  // 組織数
      monthlyRevenue: number;     // 月額収益
      yearlyRevenue: number;      // 年額収益
      tokenLimit: number;         // トークン上限
      estimatedSessionCount: number; // 推定セッション数
      tokenCost: number;          // トークンコスト
      otherCosts: number;         // その他コスト
      profit: number;             // 利益
      profitMargin: number;       // 利益率
    };
  };
  
  // 最適トークン配布
  optimalTokenDistribution: {
    [planId: string]: {
      planName: string;           // プラン名
      monthlyPrice: number;       // 月額料金
      costCap: number;            // 原価上限
      recommendedTokens: number;  // 推奨トークン量
      estimatedSessions: number;  // 推定セッション数
      targetAudience: string;     // 対象ユーザー層
    };
  };
  
  createdAt: Date;              // 作成日時
  createdBy: string;            // 作成者（SuperAdmin ID）
}
```

## 収益シミュレーション関連の整合性考慮点

1. **シミュレーションパラメータの整合性**
   - 為替レートは正の数値であること (100〜200円/ドルの範囲が一般的)
   - API単価は正の数値であること (0.001〜0.1$/1Kトークンの範囲が一般的)
   - セッションサイズは正の整数であること (1000〜10000トークンの範囲が一般的)
   - 目標利益率は0〜100の範囲の数値であること

2. **トークン使用統計の整合性**
   - 期間開始日は期間終了日より前であること
   - トークン数とコストは0以上の数値であること
   - プラン別・組織別集計値の合計と全体値が一致すること

3. **収益シミュレーションの整合性**
   - シミュレーションパラメータは有効な値であること
   - 組織数は0以上の整数であること
   - 計算結果の整合性を確認すること（各プランの合計値とサマリー値が一致など）

## 収益シミュレーションワークフロー

1. **シミュレーションパラメータ設定**
   - SuperAdminがパラメータを入力/調整
   - フォームでの入力値検証
   - 設定の保存（オプション）

2. **シミュレーション実行**
   - パラメータを元に計算処理実行
   - 各プランの収益・コスト計算
   - 最適トークン配布量の算出
   - 結果の表示・保存

3. **比較・分析**
   - 複数シミュレーションの比較
   - 実際のデータとの比較分析
   - パラメータ調整による最適化