# スーパー管理者API仕様書

## 概要

スーパー管理者API（SuperAdmin API）は、美姫命アプリケーション全体を管理するための上位管理者向けAPIエンドポイント群です。このAPIを通じて、複数の美容サロン（組織）の管理・監視、プラン管理、課金管理、システム設定などの機能を提供します。

## 認証

すべてのスーパー管理者APIリクエストには、JWT認証トークンが必要です。トークンは認証ヘッダーに以下の形式で含める必要があります：

```
Authorization: Bearer {token}
```

### 認証レベル

スーパー管理者のロールに応じて、以下の3つの認証レベルがあります：

1. `SUPER_ADMIN` - 完全な管理権限
2. `READ_ONLY` - 閲覧のみ可能
3. `SUPPORT` - サポート対応のみ可能

## エンドポイント

### 認証

#### スーパー管理者ログイン

```typescript
// リクエスト
POST /api/superadmin/auth/login

{
  "email": string,
  "password": string
}

// レスポンス
{
  "token": string,
  "user": {
    "_id": string,
    "name": string,
    "email": string,
    "role": "super_admin" | "read_only" | "support",
    "accessModules": string[]
  }
}
```

#### 現在のスーパー管理者情報取得

```typescript
// リクエスト
GET /api/superadmin/auth/me

// レスポンス
{
  "_id": string,
  "name": string,
  "email": string,
  "role": "super_admin" | "read_only" | "support",
  "accessModules": string[],
  "lastLogin": string | null
}
```

#### パスワード変更

```typescript
// リクエスト
PUT /api/superadmin/auth/password

{
  "currentPassword": string,
  "newPassword": string
}

// レスポンス
{
  "success": boolean,
  "message": string
}
```

### スーパー管理者管理

#### スーパー管理者一覧取得

```typescript
// リクエスト
GET /api/superadmin/admins
?page=number
&limit=number
&role=string

// レスポンス
{
  "admins": [
    {
      "_id": string,
      "name": string,
      "email": string,
      "role": string,
      "accessModules": string[],
      "lastLogin": string | null,
      "createdAt": string
    }
  ],
  "totalCount": number,
  "page": number,
  "totalPages": number
}
```

#### スーパー管理者詳細取得

```typescript
// リクエスト
GET /api/superadmin/admins/{id}

// レスポンス
{
  "_id": string,
  "name": string,
  "email": string,
  "role": string,
  "accessModules": string[],
  "lastLogin": string | null,
  "createdAt": string,
  "updatedAt": string
}
```

#### スーパー管理者作成

```typescript
// リクエスト
POST /api/superadmin/admins

{
  "name": string,
  "email": string,
  "password": string,
  "role": "super_admin" | "read_only" | "support",
  "accessModules": string[]
}

// レスポンス
{
  "_id": string,
  "name": string,
  "email": string,
  "role": string,
  "accessModules": string[],
  "createdAt": string
}
```

#### スーパー管理者更新

```typescript
// リクエスト
PUT /api/superadmin/admins/{id}

{
  "name": string,
  "email": string,
  "role": "super_admin" | "read_only" | "support",
  "accessModules": string[]
}

// レスポンス
{
  "_id": string,
  "name": string,
  "email": string,
  "role": string,
  "accessModules": string[],
  "updatedAt": string
}
```

#### スーパー管理者削除

```typescript
// リクエスト
DELETE /api/superadmin/admins/{id}

// レスポンス
{
  "success": boolean,
  "message": string
}
```

### 組織管理

#### 組織一覧取得

```typescript
// リクエスト
GET /api/superadmin/organizations
?page=number
&limit=number
&status=string
&search=string
&planId=string
&sortBy=string
&sortDirection=string

// レスポンス
{
  "organizations": [
    {
      "_id": string,
      "name": string,
      "email": string,
      "status": string,
      "plan": {
        "_id": string,
        "name": string
      },
      "stylistsCount": number,
      "clientsCount": number,
      "createdAt": string
    }
  ],
  "totalCount": number,
  "page": number,
  "totalPages": number
}
```

#### 組織詳細取得

```typescript
// リクエスト
GET /api/superadmin/organizations/{id}

// レスポンス
{
  "_id": string,
  "name": string,
  "logoUrl": string | null,
  "address": string | null,
  "phone": string | null,
  "email": string,
  "website": string | null,
  "status": string,
  "planId": string,
  "plan": {
    "_id": string,
    "name": string,
    "price": number
  },
  "subscription": {
    "_id": string,
    "status": string,
    "startDate": string,
    "endDate": string | null,
    "nextBillingDate": string
  },
  "trialEndsAt": string | null,
  "stylistsCount": number,
  "clientsCount": number,
  "createdAt": string,
  "updatedAt": string
}
```

#### 組織作成

```typescript
// リクエスト
POST /api/superadmin/organizations

{
  "name": string,
  "email": string,
  "logoUrl": string | null,
  "address": string | null,
  "phone": string | null,
  "website": string | null,
  "planId": string,
  "adminEmail": string
}

// レスポンス
{
  "_id": string,
  "name": string,
  "email": string,
  "status": "trial",
  "adminInvitationSent": boolean,
  "createdAt": string
}
```

#### 組織更新

```typescript
// リクエスト
PUT /api/superadmin/organizations/{id}

{
  "name": string,
  "email": string,
  "logoUrl": string | null,
  "address": string | null,
  "phone": string | null,
  "website": string | null
}

// レスポンス
{
  "_id": string,
  "name": string,
  "email": string,
  "updatedAt": string
}
```

#### 組織ステータス変更

```typescript
// リクエスト
PUT /api/superadmin/organizations/{id}/status

{
  "status": "active" | "trial" | "suspended" | "deleted"
}

// レスポンス
{
  "_id": string,
  "name": string,
  "status": string,
  "updatedAt": string
}
```

#### 組織プラン変更

```typescript
// リクエスト
PUT /api/superadmin/organizations/{id}/plan

{
  "planId": string,
  "effectiveDate": string
}

// レスポンス
{
  "_id": string,
  "name": string,
  "plan": {
    "_id": string,
    "name": string
  },
  "subscription": {
    "_id": string,
    "status": string,
    "startDate": string,
    "endDate": string | null,
    "nextBillingDate": string
  },
  "updatedAt": string
}
```

#### 組織のスタイリスト一覧取得

```typescript
// リクエスト
GET /api/superadmin/organizations/{id}/stylists
?page=number
&limit=number

// レスポンス
{
  "stylists": [
    {
      "_id": string,
      "name": string,
      "email": string,
      "role": string,
      "hasSajuProfile": boolean,
      "lastLogin": string | null,
      "createdAt": string
    }
  ],
  "totalCount": number,
  "page": number,
  "totalPages": number
}
```

### プラン管理

#### プラン一覧取得

```typescript
// リクエスト
GET /api/superadmin/plans

// レスポンス
{
  "plans": [
    {
      "_id": string,
      "name": string,
      "price": number,
      "description": string,
      "features": string[],
      "maxStylists": number | null,
      "maxClients": number | null,
      "createdAt": string
    }
  ]
}
```

#### プラン詳細取得

```typescript
// リクエスト
GET /api/superadmin/plans/{id}

// レスポンス
{
  "_id": string,
  "name": string,
  "price": number,
  "description": string,
  "features": string[],
  "maxStylists": number | null,
  "maxClients": number | null,
  "createdAt": string,
  "updatedAt": string
}
```

#### プラン作成

```typescript
// リクエスト
POST /api/superadmin/plans

{
  "name": string,
  "price": number,
  "description": string,
  "features": string[],
  "maxStylists": number | null,
  "maxClients": number | null
}

// レスポンス
{
  "_id": string,
  "name": string,
  "price": number,
  "createdAt": string
}
```

#### プラン更新

```typescript
// リクエスト
PUT /api/superadmin/plans/{id}

{
  "name": string,
  "price": number,
  "description": string,
  "features": string[],
  "maxStylists": number | null,
  "maxClients": number | null
}

// レスポンス
{
  "_id": string,
  "name": string,
  "price": number,
  "updatedAt": string
}
```

### サブスクリプション管理

#### サブスクリプション一覧取得

```typescript
// リクエスト
GET /api/superadmin/subscriptions
?page=number
&limit=number
&status=string
&planId=string

// レスポンス
{
  "subscriptions": [
    {
      "_id": string,
      "organization": {
        "_id": string,
        "name": string
      },
      "plan": {
        "_id": string,
        "name": string,
        "price": number
      },
      "status": string,
      "nextBillingDate": string,
      "createdAt": string
    }
  ],
  "totalCount": number,
  "page": number,
  "totalPages": number
}
```

#### サブスクリプション詳細取得

```typescript
// リクエスト
GET /api/superadmin/subscriptions/{id}

// レスポンス
{
  "_id": string,
  "organizationId": string,
  "organization": {
    "_id": string,
    "name": string,
    "email": string
  },
  "planId": string,
  "plan": {
    "_id": string,
    "name": string,
    "price": number
  },
  "status": string,
  "startDate": string,
  "endDate": string | null,
  "billingCycle": string,
  "nextBillingDate": string,
  "createdAt": string,
  "updatedAt": string
}
```

#### サブスクリプション作成/更新

```typescript
// リクエスト
POST /api/superadmin/subscriptions

{
  "organizationId": string,
  "planId": string,
  "status": string,
  "startDate": string,
  "endDate": string | null,
  "billingCycle": "monthly" | "yearly",
  "nextBillingDate": string
}

// レスポンス
{
  "_id": string,
  "organization": {
    "_id": string,
    "name": string
  },
  "plan": {
    "_id": string,
    "name": string
  },
  "status": string,
  "createdAt": string
}
```

#### サブスクリプション更新

```typescript
// リクエスト
PUT /api/superadmin/subscriptions/{id}

{
  "planId": string,
  "status": string,
  "endDate": string | null,
  "billingCycle": "monthly" | "yearly",
  "nextBillingDate": string
}

// レスポンス
{
  "_id": string,
  "status": string,
  "updatedAt": string
}
```

### 請求書管理

#### 請求書一覧取得

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
{
  "invoices": [
    {
      "_id": string,
      "organization": {
        "_id": string,
        "name": string
      },
      "subscription": {
        "_id": string,
        "plan": {
          "_id": string,
          "name": string
        }
      },
      "amount": number,
      "status": string,
      "dueDate": string,
      "paidAt": string | null,
      "createdAt": string
    }
  ],
  "totalCount": number,
  "page": number,
  "totalPages": number
}
```

#### 請求書詳細取得

```typescript
// リクエスト
GET /api/superadmin/invoices/{id}

// レスポンス
{
  "_id": string,
  "subscriptionId": string,
  "subscription": {
    "_id": string,
    "organizationId": string,
    "planId": string,
    "plan": {
      "_id": string,
      "name": string,
      "price": number
    }
  },
  "organization": {
    "_id": string,
    "name": string,
    "email": string
  },
  "amount": number,
  "status": string,
  "dueDate": string,
  "paidAt": string | null,
  "createdAt": string,
  "updatedAt": string
}
```

#### 請求書ステータス更新

```typescript
// リクエスト
PUT /api/superadmin/invoices/{id}/status

{
  "status": "pending" | "paid" | "past_due" | "canceled",
  "paidAt": string | null
}

// レスポンス
{
  "_id": string,
  "status": string,
  "updatedAt": string
}
```

#### 請求書手動作成

```typescript
// リクエスト
POST /api/superadmin/invoices

{
  "subscriptionId": string,
  "amount": number,
  "dueDate": string
}

// レスポンス
{
  "_id": string,
  "subscription": {
    "_id": string
  },
  "organization": {
    "_id": string,
    "name": string
  },
  "amount": number,
  "status": "pending",
  "dueDate": string,
  "createdAt": string
}
```

### サポートチケット管理

#### サポートチケット一覧取得

```typescript
// リクエスト
GET /api/superadmin/support-tickets
?page=number
&limit=number
&status=string
&priority=string
&organizationId=string
&assignedTo=string

// レスポンス
{
  "tickets": [
    {
      "_id": string,
      "organization": {
        "_id": string,
        "name": string
      },
      "title": string,
      "status": string,
      "priority": string,
      "assignedTo": {
        "_id": string,
        "name": string
      } | null,
      "createdAt": string
    }
  ],
  "totalCount": number,
  "page": number,
  "totalPages": number
}
```

#### サポートチケット詳細取得

```typescript
// リクエスト
GET /api/superadmin/support-tickets/{id}

// レスポンス
{
  "_id": string,
  "organizationId": string,
  "organization": {
    "_id": string,
    "name": string,
    "email": string
  },
  "title": string,
  "description": string,
  "status": string,
  "priority": string,
  "assignedTo": {
    "_id": string,
    "name": string,
    "email": string
  } | null,
  "resolvedAt": string | null,
  "messages": [
    {
      "_id": string,
      "sender": {
        "type": string,
        "id": string,
        "name": string
      },
      "message": string,
      "createdAt": string
    }
  ],
  "createdAt": string,
  "updatedAt": string
}
```

#### サポートチケット更新

```typescript
// リクエスト
PUT /api/superadmin/support-tickets/{id}

{
  "status": string,
  "priority": string,
  "assignedTo": string | null
}

// レスポンス
{
  "_id": string,
  "status": string,
  "priority": string,
  "assignedTo": {
    "_id": string,
    "name": string
  } | null,
  "updatedAt": string
}
```

#### サポートチケットメッセージ追加

```typescript
// リクエスト
POST /api/superadmin/support-tickets/{id}/messages

{
  "message": string
}

// レスポンス
{
  "_id": string,
  "ticketId": string,
  "sender": {
    "type": "super_admin",
    "id": string,
    "name": string
  },
  "message": string,
  "createdAt": string
}
```

### システム設定

#### システム設定一覧取得

```typescript
// リクエスト
GET /api/superadmin/settings

// レスポンス
{
  "settings": [
    {
      "_id": string,
      "key": string,
      "value": string,
      "description": string,
      "updatedAt": string
    }
  ]
}
```

#### システム設定更新

```typescript
// リクエスト
PUT /api/superadmin/settings/{key}

{
  "value": string
}

// レスポンス
{
  "key": string,
  "value": string,
  "updatedAt": string
}
```

### 統計・分析

#### ダッシュボード概要統計取得

```typescript
// リクエスト
GET /api/superadmin/analytics/dashboard

// レスポンス
{
  "organizations": {
    "total": number,
    "active": number,
    "trial": number,
    "suspended": number,
    "growthRate": number
  },
  "users": {
    "total": number,
    "active": number,
    "growthRate": number
  },
  "revenue": {
    "monthly": number,
    "annual": number,
    "growthRate": number
  },
  "clients": {
    "total": number,
    "growthRate": number
  }
}
```

#### 組織登録統計取得

```typescript
// リクエスト
GET /api/superadmin/analytics/organizations
?period=7d|30d|90d|1y

// レスポンス
{
  "period": string,
  "data": [
    {
      "date": string,
      "count": number
    }
  ],
  "total": number,
  "previousPeriodTotal": number,
  "growthRate": number
}
```

#### 収益統計取得

```typescript
// リクエスト
GET /api/superadmin/analytics/revenue
?period=7d|30d|90d|1y

// レスポンス
{
  "period": string,
  "data": [
    {
      "date": string,
      "amount": number
    }
  ],
  "total": number,
  "previousPeriodTotal": number,
  "growthRate": number
}
```

#### プラン別組織数統計取得

```typescript
// リクエスト
GET /api/superadmin/analytics/plans

// レスポンス
{
  "data": [
    {
      "plan": {
        "_id": string,
        "name": string
      },
      "count": number,
      "percentage": number
    }
  ],
  "total": number
}
```

### アクティビティログ

#### アクティビティログ一覧取得

```typescript
// リクエスト
GET /api/superadmin/activity-logs
?page=number
&limit=number
&userType=string
&userId=string
&action=string
&startDate=string
&endDate=string

// レスポンス
{
  "logs": [
    {
      "_id": string,
      "userType": string,
      "user": {
        "_id": string,
        "name": string
      },
      "action": string,
      "targetType": string,
      "target": {
        "_id": string,
        "name": string
      } | null,
      "ipAddress": string,
      "createdAt": string
    }
  ],
  "totalCount": number,
  "page": number,
  "totalPages": number
}
```

#### アクティビティログ詳細取得

```typescript
// リクエスト
GET /api/superadmin/activity-logs/{id}

// レスポンス
{
  "_id": string,
  "userType": string,
  "userId": string,
  "user": {
    "_id": string,
    "name": string,
    "email": string
  },
  "action": string,
  "targetType": string,
  "targetId": string | null,
  "target": {
    "_id": string,
    "name": string
  } | null,
  "details": object,
  "ipAddress": string,
  "userAgent": string,
  "createdAt": string
}
```

## エラーレスポンス

すべてのAPIエンドポイントで、エラーが発生した場合は以下の形式でレスポンスが返されます：

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "any" // オプショナル
  }
}
```

### 共通エラーコード

- `UNAUTHORIZED` - 認証に失敗した場合
- `FORBIDDEN` - 必要な権限がない場合
- `NOT_FOUND` - リクエストされたリソースが見つからない場合
- `BAD_REQUEST` - リクエストが不正な場合
- `INTERNAL_SERVER_ERROR` - サーバー内部エラーが発生した場合

## リクエスト制限

- すべてのAPIエンドポイントには、レート制限が適用されます。
- レート制限を超えた場合、`429 Too Many Requests`ステータスコードが返されます。

## ドキュメント変更履歴

- 2025-04-28: 初版作成