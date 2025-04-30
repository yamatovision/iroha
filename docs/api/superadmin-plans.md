# 課金・プラン管理 API仕様書

## 概要

この文書は美姫命アプリケーションのSuperAdmin向け課金・プラン管理機能のAPI仕様を定義します。収益シミュレーション、プラン設定、および請求管理に関するエンドポイントを提供します。

## 基本情報

- **ベースURL**: `/api/superadmin`
- **認証**: すべてのエンドポイントはJWT認証が必要です
- **権限**: SuperAdmin権限が必要です

## エンドポイント一覧

### 1. 収益シミュレーション API

#### 1.1 収益概要データ取得

```typescript
// リクエスト
GET /api/superadmin/revenue/summary

// レスポンス
interface RevenueSummaryResponse {
  currentMonth: {
    totalTokenUsage: number;
    tokenCost: number;
    totalRevenue: number;
    profitMargin: number;
    activeOrganizations: number;
    utilizationRate: number;
    monthlyChange: {
      tokenUsage: number;
      tokenCost: number;
      revenue: number;
    };
  };
  simulation: {
    exchangeRate: number;
    apiRate: number;
    sessionSize: number;
    profitMargin: number;
    costRatio: number;
  };
}
```

- **URL**: `/api/superadmin/revenue/summary`
- **メソッド**: GET
- **認証**: 必要
- **レスポンス**: 現在の収益概要データとシミュレーションパラメータ
- **エラーケース**:
  - `401`: 認証エラー
  - `403`: 権限エラー

#### 1.2 収益シミュレーション実行

```typescript
// リクエスト
POST /api/superadmin/revenue/simulate

// リクエストボディ
interface RevenueSimulationRequest {
  // シミュレーションパラメータ
  exchangeRate: number;  // 為替レート (円/ドル)
  apiRate: number;       // API単価 ($/1Kトークン)
  sessionSize: number;   // セッションサイズ (トークン/回)
  profitMargin: number;  // 目標利益率 (%)
  
  // 仮想組織数
  organizationCounts: {
    basic: number;
    standard: number;
    premium: number;
    trial: number;
  };
}

// レスポンス
interface RevenueSimulationResponse {
  // シミュレーション結果サマリー
  summary: {
    totalMonthlyRevenue: number;
    totalYearlyRevenue: number;
    totalTokenCost: number;
    averageProfitMargin: number;
    totalOrganizations: number;
  };
  
  // プラン別シミュレーション結果
  planResults: {
    [planKey: string]: {
      name: string;
      price: number;
      organizationCount: number;
      monthlyRevenue: number;
      yearlyRevenue: number;
      tokenLimit: number;
      estimatedSessionCount: number;
      tokenCost: number;
      otherCosts: number;
      profit: number;
      profitMargin: number;
    };
  };
  
  // 推奨トークン配布量
  optimalTokenDistribution: {
    [planKey: string]: {
      planName: string;
      monthlyPrice: number;
      costCap: number;
      recommendedTokens: number;
      estimatedSessions: number;
      targetAudience: string;
    };
  };
}
```

- **URL**: `/api/superadmin/revenue/simulate`
- **メソッド**: POST
- **認証**: 必要
- **リクエストボディ**: シミュレーションパラメータ
- **レスポンス**: シミュレーション結果
- **エラーケース**:
  - `400`: バリデーションエラー
  - `401`: 認証エラー
  - `403`: 権限エラー

#### 1.3 トークン使用量分析データ取得

```typescript
// リクエスト
GET /api/superadmin/revenue/token-usage-stats
?startDate=string
&endDate=string
&groupBy=string  // 'day', 'week', 'month'

// レスポンス
interface TokenUsageStatsResponse {
  overview: {
    totalTokens: number;
    totalCost: number;
    averageDailyUsage: number;
    peakUsage: {
      date: string;
      tokens: number;
    };
  };
  byPlan: {
    planId: string;
    planName: string;
    totalTokens: number;
    avgUsagePerOrg: number;
    utilizationPercentage: number;
  }[];
  timeSeriesData: {
    period: string;
    tokens: number;
    cost: number;
  }[];
}
```

- **URL**: `/api/superadmin/revenue/token-usage-stats`
- **メソッド**: GET
- **認証**: 必要
- **クエリパラメータ**:
  - `startDate`: 分析開始日 (YYYY-MM-DD)
  - `endDate`: 分析終了日 (YYYY-MM-DD)
  - `groupBy`: データのグループ化単位 ('day', 'week', 'month')
- **レスポンス**: トークン使用量の分析データ
- **エラーケース**:
  - `400`: クエリパラメータ不正
  - `401`: 認証エラー
  - `403`: 権限エラー

### 2. プラン管理 API

#### 1.1 プラン一覧取得

```typescript
// リクエスト
GET /api/superadmin/plans

// レスポンス
interface PlanListResponse {
  plans: {
    _id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    maxStylists: number | null;
    maxClients: number | null;
    isActive: boolean;
    displayOrder: number;
    organizationsCount: number;  // このプランを利用している組織数
    createdAt: string;
    updatedAt: string;
  }[];
}
```

- **URL**: `/api/superadmin/plans`
- **メソッド**: GET
- **認証**: 必要
- **クエリパラメータ**:
  - `includeInactive` (オプション): 非アクティブなプランも含める場合は `true`
- **レスポンス**: プラン一覧
- **エラーケース**:
  - `401`: 認証エラー
  - `403`: 権限エラー

#### 1.2 プラン詳細取得

```typescript
// リクエスト
GET /api/superadmin/plans/{id}

// レスポンス
interface PlanDetailResponse {
  _id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  maxStylists: number | null;
  maxClients: number | null;
  isActive: boolean;
  displayOrder: number;
  organizationsCount: number;  // このプランを利用している組織数
  createdAt: string;
  updatedAt: string;
}
```

- **URL**: `/api/superadmin/plans/{id}`
- **メソッド**: GET
- **認証**: 必要
- **パスパラメータ**:
  - `id`: プランID
- **レスポンス**: プラン詳細情報
- **エラーケース**:
  - `401`: 認証エラー
  - `403`: 権限エラー
  - `404`: プランが見つからない

#### 1.3 プラン作成

```typescript
// リクエスト
POST /api/superadmin/plans

// リクエストボディ
interface CreatePlanRequest {
  name: string;
  price: number;
  description: string;
  features: string[];
  maxStylists: number | null;
  maxClients: number | null;
  isActive?: boolean;
  displayOrder?: number;
}

// レスポンス
interface CreatePlanResponse {
  _id: string;
  name: string;
  price: number;
  createdAt: string;
}
```

- **URL**: `/api/superadmin/plans`
- **メソッド**: POST
- **認証**: 必要
- **リクエストボディ**: プラン作成情報
- **レスポンス**: 作成されたプランの基本情報
- **エラーケース**:
  - `400`: バリデーションエラー
  - `401`: 認証エラー
  - `403`: 権限エラー
  - `409`: 同名のプランが既に存在する

#### 1.4 プラン更新

```typescript
// リクエスト
PUT /api/superadmin/plans/{id}

// リクエストボディ
interface UpdatePlanRequest {
  name?: string;
  price?: number;
  description?: string;
  features?: string[];
  maxStylists?: number | null;
  maxClients?: number | null;
  isActive?: boolean;
  displayOrder?: number;
}

// レスポンス
interface UpdatePlanResponse {
  _id: string;
  name: string;
  price: number;
  updatedAt: string;
}
```

- **URL**: `/api/superadmin/plans/{id}`
- **メソッド**: PUT
- **認証**: 必要
- **パスパラメータ**:
  - `id`: プランID
- **リクエストボディ**: 更新するプラン情報
- **レスポンス**: 更新されたプランの基本情報
- **エラーケース**:
  - `400`: バリデーションエラー
  - `401`: 認証エラー
  - `403`: 権限エラー
  - `404`: プランが見つからない
  - `409`: 更新内容が他のプランと競合する

#### 1.5 プラン削除

```typescript
// リクエスト
DELETE /api/superadmin/plans/{id}

// レスポンス
interface DeletePlanResponse {
  success: boolean;
  message: string;
}
```

- **URL**: `/api/superadmin/plans/{id}`
- **メソッド**: DELETE
- **認証**: 必要
- **パスパラメータ**:
  - `id`: プランID
- **レスポンス**: 削除結果
- **エラーケース**:
  - `401`: 認証エラー
  - `403`: 権限エラー
  - `404`: プランが見つからない
  - `409`: プランが使用中で削除できない

### 2. 請求書管理 API

#### 2.1 請求書一覧取得

```typescript
// リクエスト
GET /api/superadmin/invoices
?page=number
&limit=number
&status=string
&organizationId=string
&startDate=string
&endDate=string

// レスポンス
interface InvoiceListResponse {
  invoices: {
    _id: string;
    invoiceNumber: string;
    organization: {
      _id: string;
      name: string;
    };
    subscription: {
      _id: string;
      plan: {
        _id: string;
        name: string;
      }
    };
    amount: number;
    status: string;
    issueDate: string;
    dueDate: string;
    paidAt: string | null;
    createdAt: string;
  }[];
  totalCount: number;
  page: number;
  totalPages: number;
}
```

- **URL**: `/api/superadmin/invoices`
- **メソッド**: GET
- **認証**: 必要
- **クエリパラメータ**:
  - `page` (オプション): ページ番号（デフォルト: 1）
  - `limit` (オプション): 1ページあたりの件数（デフォルト: 10）
  - `status` (オプション): フィルタリングするステータス
  - `organizationId` (オプション): 組織IDでフィルタリング
  - `startDate` (オプション): 発行日の開始日
  - `endDate` (オプション): 発行日の終了日
- **レスポンス**: 請求書一覧とページング情報
- **エラーケース**:
  - `400`: クエリパラメータ不正
  - `401`: 認証エラー
  - `403`: 権限エラー

#### 2.2 請求書詳細取得

```typescript
// リクエスト
GET /api/superadmin/invoices/{id}

// レスポンス
interface InvoiceDetailResponse {
  _id: string;
  invoiceNumber: string;
  subscriptionId: string;
  subscription: {
    _id: string;
    organizationId: string;
    planId: string;
    plan: {
      _id: string;
      name: string;
      price: number;
    }
  };
  organization: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

- **URL**: `/api/superadmin/invoices/{id}`
- **メソッド**: GET
- **認証**: 必要
- **パスパラメータ**:
  - `id`: 請求書ID
- **レスポンス**: 請求書詳細情報
- **エラーケース**:
  - `401`: 認証エラー
  - `403`: 権限エラー
  - `404`: 請求書が見つからない

#### 2.3 請求書ステータス更新

```typescript
// リクエスト
PUT /api/superadmin/invoices/{id}/status

// リクエストボディ
interface UpdateInvoiceStatusRequest {
  status: 'pending' | 'paid' | 'past_due' | 'canceled';
  paidAt?: string | null;  // status=paidの場合のみ必要
}

// レスポンス
interface UpdateInvoiceStatusResponse {
  _id: string;
  status: string;
  updatedAt: string;
}
```

- **URL**: `/api/superadmin/invoices/{id}/status`
- **メソッド**: PUT
- **認証**: 必要
- **パスパラメータ**:
  - `id`: 請求書ID
- **リクエストボディ**: 更新するステータス情報
- **レスポンス**: 更新された請求書の基本情報
- **エラーケース**:
  - `400`: バリデーションエラー
  - `401`: 認証エラー
  - `403`: 権限エラー
  - `404`: 請求書が見つからない

#### 2.4 請求書手動作成

```typescript
// リクエスト
POST /api/superadmin/invoices

// リクエストボディ
interface CreateInvoiceRequest {
  subscriptionId: string;
  amount: number;
  dueDate: string;
  notes?: string;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
}

// レスポンス
interface CreateInvoiceResponse {
  _id: string;
  invoiceNumber: string;
  subscription: {
    _id: string;
  };
  organization: {
    _id: string;
    name: string;
  };
  amount: number;
  status: string;
  dueDate: string;
  createdAt: string;
}
```

- **URL**: `/api/superadmin/invoices`
- **メソッド**: POST
- **認証**: 必要
- **リクエストボディ**: 請求書作成情報
- **レスポンス**: 作成された請求書の基本情報
- **エラーケース**:
  - `400`: バリデーションエラー
  - `401`: 認証エラー
  - `403`: 権限エラー
  - `404`: サブスクリプションが見つからない

#### 2.5 請求書PDF取得

```typescript
// リクエスト
GET /api/superadmin/invoices/{id}/pdf

// レスポンス
// PDFファイル（application/pdf）
```

- **URL**: `/api/superadmin/invoices/{id}/pdf`
- **メソッド**: GET
- **認証**: 必要
- **パスパラメータ**:
  - `id`: 請求書ID
- **レスポンス**: PDF形式の請求書
- **エラーケース**:
  - `401`: 認証エラー
  - `403`: 権限エラー
  - `404`: 請求書が見つからない
  - `500`: PDF生成エラー

#### 2.6 請求書メール再送信

```typescript
// リクエスト
POST /api/superadmin/invoices/{id}/resend

// リクエストボディ
interface ResendInvoiceRequest {
  message?: string;  // 任意のメッセージ
}

// レスポンス
interface ResendInvoiceResponse {
  success: boolean;
  message: string;
}
```

- **URL**: `/api/superadmin/invoices/{id}/resend`
- **メソッド**: POST
- **認証**: 必要
- **パスパラメータ**:
  - `id`: 請求書ID
- **リクエストボディ**: 再送信オプション
- **レスポンス**: 再送信結果
- **エラーケース**:
  - `401`: 認証エラー
  - `403`: 権限エラー
  - `404`: 請求書が見つからない
  - `500`: メール送信エラー

#### 2.7 支払い催促メール送信

```typescript
// リクエスト
POST /api/superadmin/invoices/{id}/remind

// リクエストボディ
interface RemindInvoiceRequest {
  message?: string;  // 任意のメッセージ
}

// レスポンス
interface RemindInvoiceResponse {
  success: boolean;
  message: string;
}
```

- **URL**: `/api/superadmin/invoices/{id}/remind`
- **メソッド**: POST
- **認証**: 必要
- **パスパラメータ**:
  - `id`: 請求書ID
- **リクエストボディ**: 催促オプション
- **レスポンス**: 催促メール送信結果
- **エラーケース**:
  - `400`: 請求書が支払い済み
  - `401`: 認証エラー
  - `403`: 権限エラー
  - `404`: 請求書が見つからない
  - `500`: メール送信エラー

## 型定義

### 共通定義

既存の型定義ファイル（`shared/index.ts`）に追加する型定義。

```typescript
// shared/index.ts に追加する型定義

// プラン関連の型定義
export interface PricePlan {
  _id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  maxStylists: number | null;
  maxClients: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// サブスクリプションのステータス
export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  SUSPENDED = 'suspended'
}

// 請求サイクル
export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

// 請求書のステータス
export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled'
}

// 請求書項目
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// API パス定義の拡張
export const API_PATHS = {
  // ... 既存のパス定義
  
  // 収益シミュレーションAPI
  ADMIN_REVENUE_SUMMARY: '/api/superadmin/revenue/summary',
  ADMIN_REVENUE_SIMULATE: '/api/superadmin/revenue/simulate',
  ADMIN_REVENUE_TOKEN_USAGE: '/api/superadmin/revenue/token-usage-stats',
  
  // プラン管理API
  ADMIN_PLANS: '/api/superadmin/plans',
  ADMIN_PLAN_DETAIL: (id: string) => `/api/superadmin/plans/${id}`,
  
  // 請求書管理API
  ADMIN_INVOICES: '/api/superadmin/invoices',
  ADMIN_INVOICE_DETAIL: (id: string) => `/api/superadmin/invoices/${id}`,
  ADMIN_INVOICE_STATUS: (id: string) => `/api/superadmin/invoices/${id}/status`,
  ADMIN_INVOICE_PDF: (id: string) => `/api/superadmin/invoices/${id}/pdf`,
  ADMIN_INVOICE_RESEND: (id: string) => `/api/superadmin/invoices/${id}/resend`,
  ADMIN_INVOICE_REMIND: (id: string) => `/api/superadmin/invoices/${id}/remind`,
};
```

## エラー処理

すべてのAPIエンドポイントは、エラー発生時に一貫した形式でレスポンスを返します。

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": { /* 追加情報（オプション） */ }
  }
}
```

### エラーコード一覧

- `UNAUTHORIZED`: 認証エラー
- `FORBIDDEN`: 権限エラー
- `NOT_FOUND`: リソースが見つからない
- `VALIDATION_ERROR`: バリデーションエラー
- `CONFLICT`: リソースの競合
- `INTERNAL_SERVER_ERROR`: サーバー内部エラー

## セキュリティ考慮事項

1. **アクセス制御**
   - すべてのエンドポイントはSuperAdmin権限を持つユーザーのみアクセス可能
   - JWTトークンの検証を厳格に行う
   - 権限チェックを確実に実施

2. **入力検証**
   - すべてのリクエストパラメータとボディを厳格に検証
   - 金額などの重要データの整合性チェック
   - SQLインジェクションやNoSQLインジェクション対策

3. **データ保護**
   - 金融情報の安全な処理
   - ログでの機密情報マスキング
   - 請求書PDFの安全な生成と送信

## 実装ガイドライン

1. **コントローラー実装**
   - 各エンドポイントに対応するコントローラー関数を実装
   - 入力検証を徹底する
   - エラーハンドリングを適切に行う

2. **サービス層の実装**
   - ビジネスロジックをサービス層に集約
   - データベース操作と分離
   - トランザクション管理を適切に行う

3. **モデル実装**
   - スキーマ定義と検証
   - インデックス設定を適切に行う
   - 仮想フィールドや関連データの取得方法を定義

## 支払いステータス管理 API

支払いステータスに応じた組織アクセス制御を管理するためのAPI仕様です。

### 基本情報

- **ベースURL**: `/api/v1/superadmin`
- **認証ヘッダー**: `Authorization: Bearer <token>`

### エンドポイント一覧

#### 1. 組織の支払いステータス変更

組織の支払いステータスを更新し、必要に応じてアクセス権を停止します。

```typescript
// リクエスト
PUT /api/v1/superadmin/organizations/:organizationId/payment-status

// リクエストボディ
interface UpdatePaymentStatusRequest {
  paymentStatus: 'success' | 'failed' | 'pending';
  reason?: string;
  suspendAccess: boolean;
  notifyOwner: boolean;
}

// レスポンス
interface UpdatePaymentStatusResponse {
  organization: {
    _id: string;
    name: string;
    previousStatus: string;
    status: string;
  };
  subscription: {
    _id: string;
    status: string;
    paymentStatus: string;
  };
  notificationSent: boolean;
  suspendedAt?: string;
}
```

- **URL**: `PUT /api/v1/superadmin/organizations/:organizationId/payment-status`
- **メソッド**: PUT
- **認証**: 必要
- **パスパラメータ**: 
  - `organizationId`: 組織ID
- **リクエストボディ**: 支払いステータス更新情報
- **レスポンス**: 更新結果と組織・サブスクリプション情報
- **エラーケース**:
  - `400`: バリデーションエラー
  - `403`: 権限エラー
  - `404`: 組織が見つからない

#### 2. 組織の支払い状態詳細取得

特定組織の支払い状態詳細情報を取得します。

```typescript
// リクエスト
GET /api/v1/superadmin/organizations/:organizationId/payment-status

// レスポンス
interface PaymentStatusDetailResponse {
  organization: {
    _id: string;
    name: string;
    status: string;
    suspendedAt?: string;
    suspensionReason?: string;
  };
  subscription: {
    _id: string;
    status: string;
    paymentStatus: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    paymentFailCount: number;
    lastFailureReason?: string;
    lastPaymentDate?: string;
  };
  invoices: {
    _id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    dueDate: string;
    createdAt: string;
  }[];
}
```

- **URL**: `GET /api/v1/superadmin/organizations/:organizationId/payment-status`
- **メソッド**: GET
- **認証**: 必要
- **パスパラメータ**: 
  - `organizationId`: 組織ID
- **レスポンス**: 支払い状態と関連する請求書の詳細情報
- **エラーケース**:
  - `403`: 権限エラー
  - `404`: 組織が見つからない

#### 3. 支払い遅延組織一覧取得

支払いが遅延している組織の一覧を取得します。

```typescript
// リクエスト
GET /api/v1/superadmin/payment-status/overdue-organizations
?page=number
&limit=number
&status=string
&sortBy=string
&sortDir=string

// レスポンス
interface OverdueOrganizationsResponse {
  organizations: {
    _id: string;
    name: string;
    status: string;
    subscription: {
      status: string;
      paymentStatus: string;
      currentPeriodEnd: string;
      paymentFailCount: number;
    };
    latestInvoice: {
      invoiceNumber: string;
      amount: number;
      status: string;
      dueDate: string;
      daysOverdue: number;
    };
    owner: {
      name: string;
      email: string;
    };
    suspendedAt?: string;
  }[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
```

- **URL**: `GET /api/v1/superadmin/payment-status/overdue-organizations`
- **メソッド**: GET
- **認証**: 必要
- **クエリパラメータ**:
  - `page`: ページ番号（デフォルト: 1）
  - `limit`: 1ページあたりの件数（デフォルト: 20）
  - `status`: 組織ステータスでフィルタリング
  - `sortBy`: ソートフィールド（例: "dueDate", "amount"）
  - `sortDir`: ソート方向（"asc"または"desc"）
- **レスポンス**: 支払い遅延組織のリストとページング情報
- **エラーケース**:
  - `400`: クエリパラメータ不正
  - `403`: 権限エラー

#### 4. 組織の支払いアクセス復元

支払い停止状態の組織のアクセスを復元します。

```typescript
// リクエスト
POST /api/v1/superadmin/organizations/:organizationId/restore-access

// リクエストボディ
interface RestoreAccessRequest {
  reason?: string;
  resetPaymentStatus: boolean;
  extendDueDate: boolean;
  extensionDays?: number;
  notifyOwner: boolean;
}

// レスポンス
interface RestoreAccessResponse {
  organization: {
    _id: string;
    name: string;
    previousStatus: string;
    status: string;
  };
  subscription: {
    _id: string;
    status: string;
    paymentStatus: string;
    currentPeriodEnd?: string;
  };
  notificationSent: boolean;
  restoredAt: string;
}
```

- **URL**: `POST /api/v1/superadmin/organizations/:organizationId/restore-access`
- **メソッド**: POST
- **認証**: 必要
- **パスパラメータ**: 
  - `organizationId`: 組織ID
- **リクエストボディ**: アクセス復元オプション
- **レスポンス**: 復元結果と組織・サブスクリプション情報
- **エラーケース**:
  - `400`: バリデーションエラー
  - `403`: 権限エラー
  - `404`: 組織が見つからない

#### 5. 一括支払い状態チェック実行

支払いステータスの一括チェックを実行し、条件に合致する組織のアクセスを停止します。

```typescript
// リクエスト
POST /api/v1/superadmin/payment-status/batch-check

// リクエストボディ
interface BatchCheckRequest {
  autoSuspend: boolean;
  gracePeriodDays?: number;
  suspensionReason?: string;
  notifyOwners: boolean;
  filters?: {
    planIds?: string[];
    statuses?: string[];
  };
}

// レスポンス
interface BatchCheckResponse {
  checkedCount: number;
  overdueCount: number;
  suspendedOrganizations: {
    _id: string;
    name: string;
    previousStatus: string;
    status: string;
    daysOverdue: number;
  }[];
  notificationsSent: number;
  executedAt: string;
}
```

- **URL**: `POST /api/v1/superadmin/payment-status/batch-check`
- **メソッド**: POST
- **認証**: 必要
- **リクエストボディ**: 一括チェックオプション
- **レスポンス**: チェック結果とアクション実行結果
- **エラーケース**:
  - `400`: バリデーションエラー
  - `403`: 権限エラー

#### 6. 支払い催促メール送信

支払い遅延中の組織に催促メールを送信します。

```typescript
// リクエスト
POST /api/v1/superadmin/organizations/:organizationId/payment-reminder

// リクエストボディ
interface PaymentReminderRequest {
  message?: string;
  templateId?: string;
  ccEmails?: string[];
}

// レスポンス
interface PaymentReminderResponse {
  organization: {
    _id: string;
    name: string;
  };
  sentTo: {
    name: string;
    email: string;
  };
  reminderSent: boolean;
  sentAt: string;
}
```

- **URL**: `POST /api/v1/superadmin/organizations/:organizationId/payment-reminder`
- **メソッド**: POST
- **認証**: 必要
- **パスパラメータ**: 
  - `organizationId`: 組織ID
- **リクエストボディ**: 催促メールオプション
- **レスポンス**: 送信結果
- **エラーケース**:
  - `400`: バリデーションエラー
  - `403`: 権限エラー
  - `404`: 組織またはオーナーが見つからない

### 追加データモデル

```typescript
// shared/index.ts に追加する型定義

// 支払いステータス
export enum PaymentStatus {
  SUCCESS = 'success',   // 支払い成功
  FAILED = 'failed',     // 支払い失敗
  PENDING = 'pending'    // 処理中
}

// 組織ステータス（拡張）
export enum OrganizationStatus {
  ACTIVE = 'active',         // 有効
  TRIAL = 'trial',           // トライアル中
  SUSPENDED = 'suspended',   // 停止中（支払い問題等）
  DELETED = 'deleted'        // 削除済み
}

// API パス定義の拡張
export const API_PATHS = {
  // ... 既存のパス定義
  
  // 支払い状態管理API
  ADMIN_ORG_PAYMENT_STATUS: (id: string) => `/api/v1/superadmin/organizations/${id}/payment-status`,
  ADMIN_ORG_RESTORE_ACCESS: (id: string) => `/api/v1/superadmin/organizations/${id}/restore-access`,
  ADMIN_OVERDUE_ORGANIZATIONS: '/api/v1/superadmin/payment-status/overdue-organizations',
  ADMIN_PAYMENT_BATCH_CHECK: '/api/v1/superadmin/payment-status/batch-check',
  ADMIN_PAYMENT_REMINDER: (id: string) => `/api/v1/superadmin/organizations/${id}/payment-reminder`,
};
```

## 支払い停止時の自動サービス停止フロー

支払いステータスの変更をトリガーとした組織アクセスの自動制御フローを実装します。

### 監視サービス実装

`SubscriptionMonitorService` を実装し、定期的に支払い状態をチェックします。支払い失敗時には即時に組織アクセスを停止し、関係者に通知します。

### 認証フロー拡張

認証ミドルウェアを拡張し、組織の状態（`status`）に応じたアクセス制御を実装します。停止中の組織に所属するユーザーのアクセスを拒否し、適切なエラーメッセージを返します。

### 停止・復元ワークフロー

1. **支払い失敗検知**: 決済サービスからのWebhookまたは一括チェックによる検知
2. **組織停止**: OrganizationステータスをSUSPENDEDに変更、監査ログ記録
3. **ユーザー通知**: 組織オーナーへの通知メール送信、ユーザーへのエラー表示
4. **支払い復旧**: 支払い成功検知または手動復元
5. **アクセス復元**: OrganizationステータスをACTIVEに変更、監査ログ記録
6. **復元通知**: 組織オーナーへの通知メール送信

## テスト戦略

1. **単体テスト**
   - 各API関数の基本動作を検証
   - エラーケースの処理を検証
   - 入力バリデーションの動作を検証

2. **統合テスト**
   - 実際のデータベースを使用して一連の操作を検証
   - 請求書生成から支払い完了までのフローを検証
   - 異常系シナリオの検証
   - 支払い失敗→組織停止→アクセス拒否のフロー検証
   - 支払い成功→組織再開→アクセス許可のフロー検証

3. **エンドツーエンドテスト**
   - 実際のUI操作を模擬したテスト
   - 複雑なビジネスフローの検証
   - SuperAdminによる手動停止/再開操作の検証
   - 自動停止通知の確認
   - 停止中組織ユーザーのアクセス試行の検証