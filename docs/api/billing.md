# サロン管理者向け請求・支払い管理API仕様

このドキュメントでは、美姫命アプリケーションのサロン管理者（Owner）向け請求・支払い管理機能のAPI仕様を定義します。このAPIを利用して、サロン管理者は自組織のプラン情報の確認、APIトークン使用状況の確認、支払い方法の管理、請求書の閲覧などを行うことができます。

実装ガイド: [請求・支払い管理実装ガイド](/docs/implementation/beauty-admin-billing.md)  
データモデル: [請求・支払い管理データモデル](/docs/data_models/beauty-admin-billing.md)

## 1. エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/v1/billing/plan` | 現在のプラン情報取得 |
| PUT | `/api/v1/billing/plan` | プラン変更 |
| GET | `/api/v1/billing/token-usage` | APIトークン使用状況取得 |
| POST | `/api/v1/billing/purchase-tokens` | 追加トークン購入 |
| GET | `/api/v1/billing/payment-methods` | 支払い方法一覧取得 |
| POST | `/api/v1/billing/payment-methods` | 支払い方法追加 |
| PUT | `/api/v1/billing/payment-methods/:methodId` | 支払い方法更新 |
| DELETE | `/api/v1/billing/payment-methods/:methodId` | 支払い方法削除 |
| POST | `/api/v1/billing/payment-methods/:methodId/default` | デフォルト支払い方法設定 |
| GET | `/api/v1/billing/invoices` | 請求書一覧取得 |
| GET | `/api/v1/billing/invoices/:invoiceId` | 請求書詳細取得 |
| GET | `/api/v1/billing/invoices/:invoiceId/pdf` | 請求書PDF取得 |
| POST | `/api/v1/billing/cycle` | 課金サイクル変更 |

## 2. 認証と権限

- すべてのエンドポイントは認証済みのユーザーのみがアクセス可能
- 請求・支払い管理機能は**Owner権限を持つユーザーのみ**がアクセス可能
- Admin権限以下のユーザーがアクセスした場合は403エラーを返す

## 3. API詳細

### 3.1 現在のプラン情報取得

**エンドポイント**: `GET /api/v1/billing/plan`

**説明**: 組織の現在のサブスクリプションプラン情報と、APIトークン使用状況を取得します。

**レスポンス例**:
```json
{
  "subscription": {
    "_id": "60a7b3c5e4b0a7b3c5e4b0a7",
    "status": "active",
    "billingCycle": "monthly",
    "nextBillingDate": "2025-05-01T00:00:00.000Z",
    "currentPeriodStart": "2025-04-01T00:00:00.000Z",
    "currentPeriodEnd": "2025-04-30T23:59:59.999Z"
  },
  "plan": {
    "_id": "60a7b3c5e4b0a7b3c5e4b0a8",
    "name": "プロフェッショナル",
    "price": 18000,
    "description": "最大10名のスタイリストまで登録可能なプラン",
    "features": [
      "最大スタイリスト数：10名",
      "クライアント数：無制限",
      "カレンダー連携：利用可能",
      "データエクスポート：毎日"
    ],
    "maxStylists": 10,
    "maxClients": null,
    "maxTokensPerMonth": 5000000
  },
  "monthlyPrice": 18000,
  "yearlyPrice": 181440,
  "tokenUsage": {
    "currentUsage": 3250000,
    "planLimit": 5000000,
    "additionalTokens": 2000000,
    "utilizationPercentage": 65,
    "estimatedConversationsLeft": 2000
  }
}
```

### 3.2 プラン変更

**エンドポイント**: `PUT /api/v1/billing/plan`

**説明**: 組織のサブスクリプションプランを変更します。

**リクエストパラメータ**:
```json
{
  "planId": "60a7b3c5e4b0a7b3c5e4b0a8",
  "billingCycle": "yearly",
  "startImmediately": false
}
```

**レスポンス例**:
```json
{
  "success": true,
  "message": "プランが変更されました。次回請求時から適用されます。",
  "effectiveDate": "2025-05-01T00:00:00.000Z",
  "newPlan": {
    "name": "プロフェッショナル (年間)",
    "price": 181440
  }
}
```

### 3.3 APIトークン使用状況取得

**エンドポイント**: `GET /api/v1/billing/token-usage`

**説明**: 組織のAPIトークン使用状況の詳細を取得します。日別使用量やユーザー別の使用状況も含まれます。

**レスポンス例**:
```json
{
  "currentPeriod": {
    "start": "2025-04-01T00:00:00.000Z",
    "end": "2025-04-30T23:59:59.999Z"
  },
  "usage": {
    "totalTokens": 3250000,
    "planLimit": 5000000,
    "additionalTokens": 2000000,
    "utilizationPercentage": 65,
    "estimatedConversationsLeft": 2000
  },
  "dailyUsage": [
    {
      "date": "2025-04-01",
      "tokens": 120000
    },
    {
      "date": "2025-04-02",
      "tokens": 150000
    }
  ],
  "userBreakdown": [
    {
      "userId": "60a7b3c5e4b0a7b3c5e4b0a9",
      "userName": "鈴木 太郎",
      "tokens": 1200000,
      "percentage": 36.92
    }
  ],
  "trendData": {
    "previousMonthUsage": 3100000,
    "monthOverMonthChange": 4.8,
    "averageDailyUsage": 110000
  }
}
```

### 3.4 追加トークン購入

**エンドポイント**: `POST /api/v1/billing/purchase-tokens`

**説明**: 追加のAPIトークンをチャージ購入します。

**リクエストパラメータ**:
```json
{
  "chargeType": "standard",
  "paymentMethodId": "60a7b3c5e4b0a7b3c5e4b0aa"
}
```

- `chargeType`: `"standard"` (1,000,000トークン / 980円) または `"premium"` (10,000,000トークン / 8,000円)
- `paymentMethodId`: 任意、指定しない場合はデフォルト支払い方法を使用

**レスポンス例**:
```json
{
  "success": true,
  "message": "トークンチャージが完了しました",
  "tokenCharge": {
    "tokenAmount": 1000000,
    "price": 980,
    "expirationDate": "2025-04-30T23:59:59.999Z",
    "remainingTokens": 1000000
  },
  "invoiceId": "60a7b3c5e4b0a7b3c5e4b0ab"
}
```

### 3.5 支払い方法一覧取得

**エンドポイント**: `GET /api/v1/billing/payment-methods`

**説明**: 組織の登録済み支払い方法一覧を取得します。

**レスポンス例**:
```json
{
  "paymentMethods": [
    {
      "_id": "60a7b3c5e4b0a7b3c5e4b0aa",
      "type": "credit_card",
      "cardHolder": "鈴木 太郎",
      "last4": "4242",
      "brand": "Visa",
      "expiryMonth": 12,
      "expiryYear": 2025,
      "isDefault": true
    }
  ]
}
```

### 3.6 支払い方法追加

**エンドポイント**: `POST /api/v1/billing/payment-methods`

**説明**: 新しい支払い方法を追加します。

**リクエストパラメータ**:
```json
{
  "cardHolder": "鈴木 太郎",
  "cardNumber": "4242424242424242",
  "expiryMonth": 12,
  "expiryYear": 2026,
  "cvc": "123",
  "isDefault": true
}
```

**レスポンス例**:
```json
{
  "success": true,
  "message": "支払い方法が追加されました",
  "paymentMethod": {
    "_id": "60a7b3c5e4b0a7b3c5e4b0aa",
    "type": "credit_card",
    "cardHolder": "鈴木 太郎",
    "last4": "4242",
    "brand": "Visa",
    "expiryMonth": 12,
    "expiryYear": 2026,
    "isDefault": true
  }
}
```

### 3.7 支払い方法削除

**エンドポイント**: `DELETE /api/v1/billing/payment-methods/:methodId`

**説明**: 指定した支払い方法を削除します。

**レスポンス例**:
```json
{
  "success": true,
  "message": "支払い方法が削除されました"
}
```

### 3.8 デフォルト支払い方法設定

**エンドポイント**: `POST /api/v1/billing/payment-methods/:methodId/default`

**説明**: 指定した支払い方法をデフォルトに設定します。

**レスポンス例**:
```json
{
  "success": true,
  "message": "デフォルト支払い方法が設定されました",
  "paymentMethod": {
    "_id": "60a7b3c5e4b0a7b3c5e4b0aa",
    "type": "credit_card",
    "cardHolder": "鈴木 太郎",
    "last4": "4242",
    "brand": "Visa",
    "expiryMonth": 12,
    "expiryYear": 2026,
    "isDefault": true
  }
}
```

### 3.9 請求書一覧取得

**エンドポイント**: `GET /api/v1/billing/invoices`

**説明**: 組織の請求書一覧を取得します。

**クエリパラメータ**:
- `status`: `"all"` (デフォルト), `"paid"`, `"pending"`, `"past_due"`, `"canceled"`
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 10）
- `startDate`: 開始日（ISO形式: YYYY-MM-DD）
- `endDate`: 終了日（ISO形式: YYYY-MM-DD）

**レスポンス例**:
```json
{
  "invoices": [
    {
      "_id": "60a7b3c5e4b0a7b3c5e4b0ab",
      "invoiceNumber": "INV-2025-04-001",
      "amount": 18000,
      "status": "paid",
      "issueDate": "2025-04-01T00:00:00.000Z",
      "dueDate": "2025-04-15T00:00:00.000Z",
      "paidAt": "2025-04-03T10:15:20.000Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

### 3.10 請求書詳細取得

**エンドポイント**: `GET /api/v1/billing/invoices/:invoiceId`

**説明**: 請求書の詳細情報を取得します。

**レスポンス例**:
```json
{
  "_id": "60a7b3c5e4b0a7b3c5e4b0ab",
  "invoiceNumber": "INV-2025-04-001",
  "subscription": {
    "_id": "60a7b3c5e4b0a7b3c5e4b0a7",
    "plan": {
      "name": "プロフェッショナル",
      "price": 18000
    }
  },
  "amount": 19000,
  "status": "paid",
  "issueDate": "2025-04-01T00:00:00.000Z",
  "dueDate": "2025-04-15T00:00:00.000Z",
  "paidAt": "2025-04-03T10:15:20.000Z",
  "items": [
    {
      "description": "プロフェッショナルプラン 月額利用料（2025年4月）",
      "quantity": 1,
      "unitPrice": 18000,
      "amount": 18000
    },
    {
      "description": "APIトークン追加チャージ（スタンダード）",
      "quantity": 1,
      "unitPrice": 980,
      "amount": 980
    }
  ],
  "notes": "ご利用ありがとうございます。",
  "tokenUsage": {
    "totalTokens": 4250000,
    "planLimit": 5000000,
    "additionalTokens": 1000000,
    "utilizationPercentage": 85,
    "details": [
      {
        "date": "2025-04-01",
        "tokens": 120000
      },
      {
        "date": "2025-04-02",
        "tokens": 150000
      }
    ]
  },
  "paymentMethod": {
    "type": "credit_card",
    "last4": "4242",
    "brand": "Visa"
  }
}
```

### 3.11 請求書PDF取得

**エンドポイント**: `GET /api/v1/billing/invoices/:invoiceId/pdf`

**説明**: 請求書のPDFファイルを取得します。

**レスポンス**:
- Content-Type: `application/pdf`
- ファイル名: `invoice-{invoiceId}.pdf`

### 3.12 課金サイクル変更

**エンドポイント**: `POST /api/v1/billing/cycle`

**説明**: 課金サイクル（月額/年額）を変更します。

**リクエストパラメータ**:
```json
{
  "billingCycle": "yearly"
}
```
- `billingCycle`: `"monthly"` または `"yearly"`

**レスポンス例**:
```json
{
  "success": true,
  "message": "課金サイクルが年間プランに変更されました。次回請求時から適用されます。",
  "effectiveDate": "2025-05-01T00:00:00.000Z",
  "newCycle": "yearly",
  "priceChange": {
    "oldPrice": 18000,
    "newPrice": 15120,
    "savingsPercentage": 16
  }
}
```

## 4. エラーレスポンス

エラーが発生した場合は、以下の形式でエラーレスポンスを返します：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {}  // オプション：エラーの詳細情報
  }
}
```

### 4.1 主なエラーコード

| コード | 説明 | HTTPステータス |
|--------|------|---------------|
| `UNAUTHORIZED` | 認証されていないアクセス | 401 |
| `FORBIDDEN` | 権限不足（Owner権限が必要） | 403 |
| `RESOURCE_NOT_FOUND` | リソースが見つからない | 404 |
| `INVALID_REQUEST` | リクエストパラメータが不正 | 400 |
| `PAYMENT_ERROR` | 支払い処理中のエラー | 400 |
| `INSUFFICIENT_PAYMENT_METHODS` | 支払い方法が登録されていない | 400 |
| `RATE_LIMIT_EXCEEDED` | APIリクエスト制限超過 | 429 |
| `SERVER_ERROR` | サーバー内部エラー | 500 |

## 5. 実装例（クライアントサイド）

```typescript
// billing.service.ts
import { API_BASE_PATH, BILLING } from '../shared';
import { apiService } from './api.service';

export const billingService = {
  // 現在のプラン情報を取得
  async getCurrentPlan() {
    const response = await apiService.get(BILLING.GET_CURRENT_PLAN);
    return response.data;
  },
  
  // トークン使用状況を取得
  async getTokenUsage() {
    const response = await apiService.get(BILLING.GET_TOKEN_USAGE);
    return response.data;
  },
  
  // 追加トークンを購入
  async purchaseTokens(data) {
    const response = await apiService.post(BILLING.PURCHASE_TOKENS, data);
    return response.data;
  },
  
  // 支払い方法一覧を取得
  async getPaymentMethods() {
    const response = await apiService.get(BILLING.GET_PAYMENT_METHODS);
    return response.data;
  },
  
  // その他の必要なメソッド...
};
```