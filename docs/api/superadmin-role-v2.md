# 美姫命 スーパー管理者API仕様書 (4階層ロール対応版)

## 1. 概要

本仕様書は美姫命システムにおけるスーパー管理者（SuperAdmin）向けAPIの設計を定義するものです。特に4階層のロール構造（SuperAdmin、Owner、Admin、User）を実装するためのAPIエンドポイントと、組織管理に関連するAPIを中心に定義しています。

## 2. 認証と権限

SuperAdmin APIへのアクセスには、JWT認証トークンが必要です：

```
Authorization: Bearer <token>
```

### 2.1 ロール階層

システムでは以下の4階層のロール構造を採用します：

1. **SuperAdmin**: システム全体の管理権限
   - プラットフォーム全体の管理・監視
   - すべての組織とユーザーにアクセス可能
2. **Owner**: 組織（サロン）の所有者権限
   - 自組織内の最高権限
   - 課金情報管理、Admin権限付与が可能
3. **Admin**: 組織内の管理者権限
   - 日常運営に関する権限
   - スタイリスト管理、クライアント管理が可能
4. **User**: 一般スタイリスト権限
   - 担当クライアントの管理
   - 日常業務の実行

## 3. 組織管理API

### 3.1 組織一覧取得

**エンドポイント**: `GET /api/v1/superadmin/organizations`

**クエリパラメータ**:
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）
- `status`: フィルタリング（例: "active", "trial", "suspended"）
- `search`: 組織名による検索
- `planId`: プランIDによるフィルタリング
- `sortBy`: ソートフィールド（例: "name", "createdAt"）
- `sortDir`: ソート方向（"asc"または"desc"）

**レスポンス**:
```json
{
  "organizations": [
    {
      "_id": "org123",
      "name": "サロン名",
      "status": "active",
      "owner": {
        "_id": "user456",
        "name": "オーナー名",
        "email": "owner@example.com"
      },
      "plan": {
        "_id": "plan789",
        "name": "スタンダード"
      },
      "userCount": 5,
      "clientCount": 120,
      "createdAt": "2025-04-01T00:00:00.000Z",
      "updatedAt": "2025-04-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### 3.2 組織詳細取得

**エンドポイント**: `GET /api/v1/superadmin/organizations/:organizationId`

**レスポンス**:
```json
{
  "_id": "org123",
  "name": "サロン名",
  "address": "東京都新宿区...",
  "contactInfo": {
    "phone": "03-1234-5678",
    "email": "contact@salon.example.com",
    "website": "https://salon.example.com"
  },
  "owner": {
    "_id": "user456",
    "name": "オーナー名",
    "email": "owner@example.com",
    "lastLoginAt": "2025-04-20T00:00:00.000Z"
  },
  "adminUsers": [
    {
      "_id": "user789",
      "name": "管理者名",
      "email": "admin@example.com",
      "role": "Admin"
    }
  ],
  "status": "active",
  "plan": {
    "_id": "plan789",
    "name": "スタンダード",
    "price": 9800
  },
  "subscription": {
    "status": "active",
    "startDate": "2025-04-01T00:00:00.000Z",
    "currentPeriodEnd": "2025-05-01T00:00:00.000Z",
    "trialEndsAt": null
  },
  "statistics": {
    "userCount": 5,
    "clientCount": 120,
    "activeUserCount": 4
  },
  "createdAt": "2025-04-01T00:00:00.000Z",
  "updatedAt": "2025-04-15T00:00:00.000Z"
}
```

### 3.3 組織作成

**エンドポイント**: `POST /api/v1/superadmin/organizations`

**リクエストボディ**:
```json
{
  "name": "新規サロン",
  "address": "東京都新宿区...",
  "contactInfo": {
    "phone": "03-1234-5678",
    "email": "contact@new-salon.example.com",
    "website": "https://new-salon.example.com"
  },
  "initialOwner": {
    "name": "オーナー名",
    "email": "owner@new-salon.example.com",
    "password": "securePassword123"
  },
  "plan": "plan789",
  "trialDays": 30
}
```

**レスポンス**:
```json
{
  "organization": {
    "_id": "org123",
    "name": "新規サロン",
    "status": "trial",
    "createdAt": "2025-04-25T00:00:00.000Z"
  },
  "owner": {
    "_id": "user456",
    "name": "オーナー名",
    "email": "owner@new-salon.example.com",
    "role": "Owner"
  },
  "invitationSent": true
}
```

### 3.4 組織更新

**エンドポイント**: `PUT /api/v1/superadmin/organizations/:organizationId`

**リクエストボディ**:
```json
{
  "name": "更新後サロン名",
  "address": "東京都新宿区...",
  "contactInfo": {
    "phone": "03-1234-5678",
    "email": "contact@salon.example.com",
    "website": "https://salon.example.com"
  }
}
```

**レスポンス**:
```json
{
  "_id": "org123",
  "name": "更新後サロン名",
  "updatedAt": "2025-04-25T00:00:00.000Z"
}
```

### 3.5 組織ステータス変更

**エンドポイント**: `PUT /api/v1/superadmin/organizations/:organizationId/status`

**リクエストボディ**:
```json
{
  "status": "suspended",
  "reason": "支払い遅延のため",
  "notifyOwner": true  // オーナーに通知するかどうか
}
```

**レスポンス**:
```json
{
  "_id": "org123",
  "name": "サロン名",
  "previousStatus": "active",
  "status": "suspended",
  "updatedAt": "2025-04-25T00:00:00.000Z",
  "notificationSent": true
}
```

### 3.6 支払い状態管理API

#### 3.6.1 組織の支払い状態詳細取得

**エンドポイント**: `GET /api/v1/superadmin/organizations/:organizationId/payment-status`

**レスポンス**:
```json
{
  "organization": {
    "_id": "org123",
    "name": "サロン名",
    "status": "suspended",
    "suspendedAt": "2025-04-25T00:00:00.000Z",
    "suspensionReason": "カード決済失敗"
  },
  "subscription": {
    "_id": "sub456",
    "status": "past_due",
    "paymentStatus": "failed",
    "currentPeriodStart": "2025-04-01T00:00:00.000Z",
    "currentPeriodEnd": "2025-05-01T00:00:00.000Z",
    "paymentFailCount": 2,
    "lastFailureReason": "insufficient_funds",
    "lastPaymentDate": "2025-03-31T23:59:59.999Z"
  },
  "invoices": [
    {
      "_id": "inv789",
      "invoiceNumber": "INV-2025-04-001",
      "amount": 9800,
      "status": "open",
      "dueDate": "2025-05-01T00:00:00.000Z",
      "createdAt": "2025-04-01T00:00:00.000Z"
    }
  ]
}
```

#### 3.6.2 組織の支払いステータス変更

**エンドポイント**: `PUT /api/v1/superadmin/organizations/:organizationId/payment-status`

**リクエストボディ**:
```json
{
  "paymentStatus": "failed",       // "success", "failed", "pending"
  "reason": "カード決済失敗",      // 停止理由
  "suspendAccess": true,          // アクセス停止フラグ
  "notifyOwner": true             // オーナー通知フラグ
}
```

**レスポンス**:
```json
{
  "organization": {
    "_id": "org123",
    "name": "サロン名",
    "previousStatus": "active",
    "status": "suspended"
  },
  "subscription": {
    "_id": "sub456",
    "status": "past_due",
    "paymentStatus": "failed"
  },
  "notificationSent": true,
  "suspendedAt": "2025-04-25T00:00:00.000Z"
}
```

#### 3.6.3 支払い遅延組織一覧取得

**エンドポイント**: `GET /api/v1/superadmin/payment-status/overdue-organizations`

**クエリパラメータ**:
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）
- `status`: 組織ステータスでフィルタリング（例: "active", "suspended"）
- `sortBy`: ソートフィールド（例: "dueDate", "amount"）
- `sortDir`: ソート方向（"asc"または"desc"）

**レスポンス**:
```json
{
  "organizations": [
    {
      "_id": "org123",
      "name": "サロン名",
      "status": "suspended",
      "subscription": {
        "status": "past_due",
        "paymentStatus": "failed",
        "currentPeriodEnd": "2025-05-01T00:00:00.000Z",
        "paymentFailCount": 2
      },
      "latestInvoice": {
        "invoiceNumber": "INV-2025-04-001",
        "amount": 9800,
        "status": "open",
        "dueDate": "2025-05-01T00:00:00.000Z",
        "daysOverdue": 7
      },
      "owner": {
        "name": "オーナー名",
        "email": "owner@example.com"
      },
      "suspendedAt": "2025-04-25T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

#### 3.6.4 組織アクセス復元

**エンドポイント**: `POST /api/v1/superadmin/organizations/:organizationId/restore-access`

**リクエストボディ**:
```json
{
  "reason": "管理者による手動復元",
  "resetPaymentStatus": true,      // 支払いステータスもリセットするか
  "extendDueDate": true,           // 支払い期限を延長するか
  "extensionDays": 14,             // 延長日数
  "notifyOwner": true              // オーナー通知フラグ
}
```

**レスポンス**:
```json
{
  "organization": {
    "_id": "org123",
    "name": "サロン名",
    "previousStatus": "suspended",
    "status": "active"
  },
  "subscription": {
    "_id": "sub456",
    "status": "active",
    "paymentStatus": "pending",
    "currentPeriodEnd": "2025-05-15T00:00:00.000Z" // 延長された場合
  },
  "notificationSent": true,
  "restoredAt": "2025-04-25T00:00:00.000Z"
}
```

#### 3.6.5 支払い催促メール送信

**エンドポイント**: `POST /api/v1/superadmin/organizations/:organizationId/payment-reminder`

**リクエストボディ**:
```json
{
  "message": "お支払いが遅延しています。至急ご対応ください。",
  "templateId": "payment_reminder_urgent", // テンプレートID（オプション）
  "ccEmails": ["support@example.com"]     // CC先（オプション）
}
```

**レスポンス**:
```json
{
  "organization": {
    "_id": "org123",
    "name": "サロン名"
  },
  "sentTo": {
    "name": "オーナー名",
    "email": "owner@example.com"
  },
  "reminderSent": true,
  "sentAt": "2025-04-25T00:00:00.000Z"
}
```

#### 3.6.6 一括支払い状態チェック実行

**エンドポイント**: `POST /api/v1/superadmin/payment-status/batch-check`

**リクエストボディ**:
```json
{
  "autoSuspend": true,             // 自動停止するか
  "gracePeriodDays": 7,            // 猶予期間（日数）
  "suspensionReason": "支払い遅延", // 停止理由
  "notifyOwners": true,            // オーナー通知フラグ
  "filters": {
    "planIds": ["plan1", "plan2"], // 特定プランのみ対象にする（オプション）
    "statuses": ["active", "trial"] // 特定ステータスのみ対象にする（オプション）
  }
}
```

**レスポンス**:
```json
{
  "checkedCount": 45,
  "overdueCount": 3,
  "suspendedOrganizations": [
    {
      "_id": "org123",
      "name": "サロン名",
      "previousStatus": "active",
      "status": "suspended",
      "daysOverdue": 14
    }
  ],
  "notificationsSent": 3,
  "executedAt": "2025-04-25T00:00:00.000Z"
}
```

## 4. 組織オーナー管理API

### 4.1 組織オーナー情報取得

**エンドポイント**: `GET /api/v1/superadmin/organizations/:organizationId/owner`

**レスポンス**:
```json
{
  "_id": "user456",
  "name": "オーナー名",
  "email": "owner@example.com",
  "role": "Owner",
  "organizationId": "org123",
  "lastLoginAt": "2025-04-20T00:00:00.000Z",
  "createdAt": "2025-04-01T00:00:00.000Z"
}
```

### 4.2 組織オーナー変更

**エンドポイント**: `PUT /api/v1/superadmin/organizations/:organizationId/owner`

**リクエストボディ**:
```json
{
  "userId": "user789",
  "notifyPreviousOwner": true,
  "notifyNewOwner": true
}
```

**レスポンス**:
```json
{
  "organization": {
    "_id": "org123",
    "name": "サロン名"
  },
  "newOwner": {
    "_id": "user789",
    "name": "新オーナー名",
    "email": "new-owner@example.com",
    "previousRole": "Admin"
  },
  "previousOwner": {
    "_id": "user456",
    "name": "前オーナー名",
    "email": "previous-owner@example.com",
    "newRole": "Admin"
  },
  "notificationSent": {
    "previousOwner": true,
    "newOwner": true
  },
  "updatedAt": "2025-04-25T00:00:00.000Z"
}
```

### 4.3 組織オーナー作成（初期設定）

**エンドポイント**: `POST /api/v1/superadmin/organizations/:organizationId/owner`

**リクエストボディ**:
```json
{
  "name": "新規オーナー",
  "email": "new-owner@example.com",
  "password": "securePassword123",
  "sendInvitation": true
}
```

**レスポンス**:
```json
{
  "organization": {
    "_id": "org123",
    "name": "サロン名"
  },
  "owner": {
    "_id": "user123",
    "name": "新規オーナー",
    "email": "new-owner@example.com",
    "role": "Owner"
  },
  "invitationSent": true,
  "createdAt": "2025-04-25T00:00:00.000Z"
}
```

## 5. ユーザー管理API（4階層ロール対応）

### 5.1 ユーザー一覧取得

**エンドポイント**: `GET /api/v1/superadmin/users`

**クエリパラメータ**:
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）
- `role`: ロールでフィルタリング（例: "SuperAdmin", "Owner", "Admin", "User"）
- `organizationId`: 組織IDでフィルタリング
- `search`: 名前またはメールで検索

**レスポンス**:
```json
{
  "users": [
    {
      "_id": "user123",
      "name": "ユーザー名",
      "email": "user@example.com",
      "role": "Owner",
      "organization": {
        "_id": "org123",
        "name": "サロン名"
      },
      "lastLoginAt": "2025-04-20T00:00:00.000Z",
      "createdAt": "2025-04-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 120,
    "page": 1,
    "limit": 20,
    "pages": 6
  }
}
```

### 5.2 ユーザー詳細取得

**エンドポイント**: `GET /api/v1/superadmin/users/:userId`

**レスポンス**:
```json
{
  "_id": "user123",
  "name": "ユーザー名",
  "email": "user@example.com",
  "role": "Owner",
  "organization": {
    "_id": "org123",
    "name": "サロン名"
  },
  "jobTitle": "代表",
  "sajuProfileCompleted": true,
  "lastLoginAt": "2025-04-20T00:00:00.000Z",
  "authHistory": {
    "registeredAt": "2025-04-01T00:00:00.000Z",
    "lastPasswordChangeAt": "2025-04-01T00:00:00.000Z",
    "loginCount": 25
  },
  "createdAt": "2025-04-01T00:00:00.000Z",
  "updatedAt": "2025-04-20T00:00:00.000Z"
}
```

### 5.3 SuperAdmin作成

**エンドポイント**: `POST /api/v1/superadmin/superadmins`

**リクエストボディ**:
```json
{
  "name": "スーパー管理者名",
  "email": "superadmin@example.com",
  "password": "securePassword123",
  "superAdminType": "full" // full, readonly, support
}
```

**レスポンス**:
```json
{
  "_id": "user123",
  "name": "スーパー管理者名",
  "email": "superadmin@example.com",
  "role": "SuperAdmin",
  "superAdminType": "full",
  "createdAt": "2025-04-25T00:00:00.000Z"
}
```

### 5.4 ユーザーロール変更

**エンドポイント**: `PUT /api/v1/superadmin/users/:userId/role`

**リクエストボディ**:
```json
{
  "role": "Admin",
  "notifyUser": true
}
```

**レスポンス**:
```json
{
  "_id": "user123",
  "name": "ユーザー名",
  "email": "user@example.com",
  "previousRole": "User",
  "role": "Admin",
  "organizationId": "org123",
  "notificationSent": true,
  "updatedAt": "2025-04-25T00:00:00.000Z"
}
```

### 5.5 ユーザー組織変更

**エンドポイント**: `PUT /api/v1/superadmin/users/:userId/organization`

**リクエストボディ**:
```json
{
  "organizationId": "org456",
  "role": "Admin", // 省略時は現在のロールを維持
  "notifyUser": true
}
```

**レスポンス**:
```json
{
  "_id": "user123",
  "name": "ユーザー名",
  "previousOrganization": {
    "_id": "org123",
    "name": "前サロン名"
  },
  "organization": {
    "_id": "org456",
    "name": "新サロン名"
  },
  "role": "Admin",
  "notificationSent": true,
  "updatedAt": "2025-04-25T00:00:00.000Z"
}
```

## 6. 組織メンバー管理API

### 6.1 組織メンバー一覧取得

**エンドポイント**: `GET /api/v1/superadmin/organizations/:organizationId/members`

**クエリパラメータ**:
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）
- `role`: ロールでフィルタリング（例: "Owner", "Admin", "User"）
- `search`: 名前またはメールで検索

**レスポンス**:
```json
{
  "members": [
    {
      "_id": "user123",
      "name": "メンバー名",
      "email": "member@example.com",
      "role": "Admin",
      "jobTitle": "店長",
      "lastLoginAt": "2025-04-20T00:00:00.000Z",
      "createdAt": "2025-04-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### 6.2 組織メンバー追加

**エンドポイント**: `POST /api/v1/superadmin/organizations/:organizationId/members`

**リクエストボディ**:
```json
{
  "name": "新メンバー名",
  "email": "new-member@example.com",
  "password": "securePassword123",
  "role": "Admin",
  "jobTitle": "店長",
  "sendInvitation": true
}
```

**レスポンス**:
```json
{
  "organization": {
    "_id": "org123",
    "name": "サロン名"
  },
  "member": {
    "_id": "user456",
    "name": "新メンバー名",
    "email": "new-member@example.com",
    "role": "Admin",
    "jobTitle": "店長"
  },
  "invitationSent": true,
  "createdAt": "2025-04-25T00:00:00.000Z"
}
```

### 6.3 組織メンバー削除

**エンドポイント**: `DELETE /api/v1/superadmin/organizations/:organizationId/members/:userId`

**レスポンス**:
```json
{
  "success": true,
  "message": "メンバーを正常に削除しました",
  "organization": {
    "_id": "org123",
    "name": "サロン名"
  },
  "deletedMember": {
    "_id": "user456",
    "name": "削除メンバー名",
    "email": "deleted-member@example.com"
  }
}
```

## 7. サブスクリプション管理API

### 7.1 組織プラン変更

**エンドポイント**: `PUT /api/v1/superadmin/organizations/:organizationId/plan`

**リクエストボディ**:
```json
{
  "planId": "plan456",
  "effectiveDate": "2025-05-01T00:00:00.000Z",
  "notifyOwner": true
}
```

**レスポンス**:
```json
{
  "organization": {
    "_id": "org123",
    "name": "サロン名"
  },
  "previousPlan": {
    "_id": "plan123",
    "name": "ベーシック"
  },
  "newPlan": {
    "_id": "plan456",
    "name": "スタンダード"
  },
  "effectiveDate": "2025-05-01T00:00:00.000Z",
  "notificationSent": true,
  "updatedAt": "2025-04-25T00:00:00.000Z"
}
```

### 7.2 トライアル延長

**エンドポイント**: `POST /api/v1/superadmin/organizations/:organizationId/extend-trial`

**リクエストボディ**:
```json
{
  "days": 14,
  "reason": "機能検証のため",
  "notifyOwner": true
}
```

**レスポンス**:
```json
{
  "organization": {
    "_id": "org123",
    "name": "サロン名"
  },
  "trial": {
    "previousEndDate": "2025-05-01T00:00:00.000Z",
    "newEndDate": "2025-05-15T00:00:00.000Z",
    "extensionDays": 14
  },
  "reason": "機能検証のため",
  "notificationSent": true,
  "updatedAt": "2025-04-25T00:00:00.000Z"
}
```

## 8. 監査・ログAPI

### 8.1 ユーザーロール変更履歴取得

**エンドポイント**: `GET /api/v1/superadmin/audit/role-changes`

**クエリパラメータ**:
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）
- `userId`: 特定ユーザーの履歴のみ取得
- `organizationId`: 特定組織の履歴のみ取得
- `startDate`: 開始日
- `endDate`: 終了日

**レスポンス**:
```json
{
  "roleChanges": [
    {
      "_id": "audit123",
      "user": {
        "_id": "user123",
        "name": "ユーザー名",
        "email": "user@example.com"
      },
      "organization": {
        "_id": "org123",
        "name": "サロン名"
      },
      "previousRole": "User",
      "newRole": "Admin",
      "changedBy": {
        "_id": "user456",
        "name": "変更者名",
        "role": "Owner"
      },
      "reason": "店長昇格のため",
      "ipAddress": "192.168.1.1",
      "createdAt": "2025-04-20T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### 8.2 組織オーナー変更履歴取得

**エンドポイント**: `GET /api/v1/superadmin/audit/owner-changes`

**クエリパラメータ**:
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）
- `organizationId`: 特定組織の履歴のみ取得
- `startDate`: 開始日
- `endDate`: 終了日

**レスポンス**:
```json
{
  "ownerChanges": [
    {
      "_id": "audit456",
      "organization": {
        "_id": "org123",
        "name": "サロン名"
      },
      "previousOwner": {
        "_id": "user123",
        "name": "前オーナー名",
        "email": "previous-owner@example.com"
      },
      "newOwner": {
        "_id": "user456",
        "name": "新オーナー名",
        "email": "new-owner@example.com"
      },
      "changedBy": {
        "_id": "user789",
        "name": "変更者名",
        "role": "SuperAdmin"
      },
      "reason": "経営権譲渡のため",
      "ipAddress": "192.168.1.1",
      "createdAt": "2025-04-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

## 9. 組織サポートAPI

### 9.1 サポートチケット一覧取得

**エンドポイント**: `GET /api/v1/superadmin/support/tickets`

**クエリパラメータ**:
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）
- `status`: ステータスでフィルタリング（例: "open", "in_progress", "resolved", "closed"）
- `organizationId`: 特定組織のチケットのみ取得
- `search`: タイトルまたは内容で検索

**レスポンス**:
```json
{
  "tickets": [
    {
      "_id": "ticket123",
      "title": "予約同期の問題について",
      "status": "open",
      "organization": {
        "_id": "org123",
        "name": "サロン名"
      },
      "createdBy": {
        "_id": "user456",
        "name": "作成者名",
        "role": "Owner"
      },
      "assignedTo": null,
      "lastUpdatedAt": "2025-04-20T00:00:00.000Z",
      "createdAt": "2025-04-20T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 35,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

### 9.2 サポートチケット詳細取得

**エンドポイント**: `GET /api/v1/superadmin/support/tickets/:ticketId`

**レスポンス**:
```json
{
  "_id": "ticket123",
  "title": "予約同期の問題について",
  "description": "GoogleカレンダーとAPIの同期に問題があります。[...]",
  "status": "open",
  "organization": {
    "_id": "org123",
    "name": "サロン名"
  },
  "createdBy": {
    "_id": "user456",
    "name": "作成者名",
    "role": "Owner",
    "email": "owner@example.com"
  },
  "assignedTo": null,
  "messages": [
    {
      "_id": "msg123",
      "sender": {
        "type": "user",
        "id": "user456",
        "name": "作成者名",
        "role": "Owner"
      },
      "content": "GoogleカレンダーとAPIの同期に問題があります。[...]",
      "attachments": [],
      "createdAt": "2025-04-20T00:00:00.000Z"
    }
  ],
  "lastUpdatedAt": "2025-04-20T00:00:00.000Z",
  "createdAt": "2025-04-20T00:00:00.000Z"
}
```

### 9.3 サポートチケットメッセージ送信

**エンドポイント**: `POST /api/v1/superadmin/support/tickets/:ticketId/messages`

**リクエストボディ**:
```json
{
  "content": "ご報告ありがとうございます。調査いたします。",
  "updateStatus": "in_progress"
}
```

**レスポンス**:
```json
{
  "ticket": {
    "_id": "ticket123",
    "title": "予約同期の問題について",
    "status": "in_progress"
  },
  "message": {
    "_id": "msg456",
    "sender": {
      "type": "superadmin",
      "id": "user789",
      "name": "サポート担当者名"
    },
    "content": "ご報告ありがとうございます。調査いたします。",
    "attachments": [],
    "createdAt": "2025-04-25T00:00:00.000Z"
  },
  "statusUpdated": true,
  "previousStatus": "open"
}
```

## 10. 一括操作API

### 10.1 組織一括ステータス変更

**エンドポイント**: `PUT /api/v1/superadmin/batch/organizations/status`

**リクエストボディ**:
```json
{
  "organizationIds": ["org123", "org456", "org789"],
  "status": "active",
  "reason": "トライアル期間終了、正式契約開始",
  "notifyOwners": true
}
```

**レスポンス**:
```json
{
  "updatedCount": 3,
  "organizations": [
    {
      "_id": "org123",
      "name": "サロン名1",
      "previousStatus": "trial",
      "status": "active"
    },
    {
      "_id": "org456",
      "name": "サロン名2",
      "previousStatus": "trial",
      "status": "active"
    },
    {
      "_id": "org789",
      "name": "サロン名3",
      "previousStatus": "trial",
      "status": "active"
    }
  ],
  "notificationsSent": 3,
  "updatedAt": "2025-04-25T00:00:00.000Z"
}
```

### 10.2 組織一括トライアル延長

**エンドポイント**: `POST /api/v1/superadmin/batch/organizations/extend-trial`

**リクエストボディ**:
```json
{
  "organizationIds": ["org123", "org456"],
  "days": 14,
  "reason": "キャンペーン延長",
  "notifyOwners": true
}
```

**レスポンス**:
```json
{
  "updatedCount": 2,
  "organizations": [
    {
      "_id": "org123",
      "name": "サロン名1",
      "trial": {
        "previousEndDate": "2025-05-01T00:00:00.000Z",
        "newEndDate": "2025-05-15T00:00:00.000Z"
      }
    },
    {
      "_id": "org456",
      "name": "サロン名2",
      "trial": {
        "previousEndDate": "2025-05-05T00:00:00.000Z",
        "newEndDate": "2025-05-19T00:00:00.000Z"
      }
    }
  ],
  "notificationsSent": 2,
  "updatedAt": "2025-04-25T00:00:00.000Z"
}
```

## 11. エラーハンドリング

システムは標準的なHTTPステータスコードとともに、詳細なエラー情報を返します：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {} // 追加情報（オプション）
  }
}
```

### 11.1 共通エラーコード

- `UNAUTHORIZED`: 認証されていないか、トークンが無効（401）
- `FORBIDDEN`: 必要な権限がない（403）
- `NOT_FOUND`: リソースが見つからない（404）
- `BAD_REQUEST`: リクエストが不正（400）
- `VALIDATION_ERROR`: 入力検証エラー（400）
- `CONFLICT`: リソースの競合（409）
- `INTERNAL_SERVER_ERROR`: サーバー内部エラー（500）

### 11.2 特定のエラーコード

- `LAST_OWNER_DEMOTION`: 組織の唯一のオーナーを降格しようとした（400）
- `OWNER_REQUIRED`: 組織にはオーナーが必要（400）
- `INVALID_ROLE_TRANSITION`: 無効なロール変更（例：User→SuperAdmin）（400）
- `SELF_ROLE_CHANGE`: 自分自身のロールは変更できない（403）
- `TRIAL_ALREADY_EXTENDED`: トライアルはすでに延長されている（409）

## 12. 型定義

### 12.1 ロール型定義

```typescript
export enum Role {
  SUPER_ADMIN = 'SuperAdmin',
  OWNER = 'Owner',
  ADMIN = 'Admin',
  USER = 'User'
}
```

### 12.2 組織関連の型定義

```typescript
export enum OrganizationStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

export interface Organization {
  _id: string;
  name: string;
  address?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  status: OrganizationStatus;
  settings?: Record<string, any>; // 組織固有の設定
  suspendedAt?: string; // 停止日時（停止状態の場合のみ）
  suspensionReason?: string; // 停止理由（停止状態の場合のみ）
  createdAt: string;
  updatedAt: string;
}
```

### 12.3 支払い状態関連の型定義

```typescript
// 支払いステータス
export enum PaymentStatus {
  SUCCESS = 'success',   // 支払い成功
  FAILED = 'failed',     // 支払い失敗
  PENDING = 'pending'    // 処理中
}

// サブスクリプションステータス
export enum SubscriptionStatus {
  ACTIVE = 'active',         // 有効
  TRIALING = 'trialing',     // トライアル中
  PAST_DUE = 'past_due',     // 支払い遅延
  CANCELED = 'canceled',     // キャンセル済み
  INCOMPLETE = 'incomplete'  // 不完全
}

// 請求書ステータス
export enum InvoiceStatus {
  DRAFT = 'draft',           // 下書き
  OPEN = 'open',             // 未払い
  PAID = 'paid',             // 支払い済み
  VOID = 'void',             // 無効
  UNCOLLECTIBLE = 'uncollectible' // 回収不能
}

// サブスクリプションインターフェース
export interface Subscription {
  _id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  paymentStatus: PaymentStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  paymentFailCount: number;
  lastFailureReason?: string;
  lastPaymentDate?: string;
  cancelAtPeriodEnd?: boolean;
  trialEndsAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 請求書インターフェース
export interface Invoice {
  _id: string;
  invoiceNumber: string;
  organizationId: string;
  subscriptionId: string;
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidAt?: string | null;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

## 13. 実装ガイドライン

### 13.1 認証・認可フロー

1. リクエストヘッダーからJWTトークンを取得
2. トークンを検証し、ユーザー情報を取得
3. ユーザーのロールが「SuperAdmin」であることを確認
4. 各エンドポイントに対する適切な権限チェックを実行

### 13.2 SuperAdmin APIでの注意点

1. **ロール変更の整合性保証**:
   - 組織には必ず1人以上のOwnerが必要
   - Owner→Adminへの降格時は、別のOwnerが存在するか確認

2. **トランザクション処理**:
   - 複数のデータ操作（例：オーナー変更）はトランザクション内で実行
   - エラー発生時は全ての変更をロールバック

3. **監査ログ**:
   - 重要な操作（ロール変更、組織作成など）は監査ログに記録
   - 操作者、操作内容、対象、タイムスタンプを必ず記録

4. **通知処理**:
   - 重要な変更は関係者に通知
   - 通知は非同期で処理し、APIレスポンスを遅延させない

5. **支払い状態と組織状態の整合性**:
   - 支払い状態変更時は組織状態と確実に連動させる
   - 支払いステータスと組織アクセス権の整合性を定期的に確認
   - 自動停止・復元処理のフックと監査を確実に実装

### 13.3 セキュリティ考慮事項

1. **入力検証**:
   - すべてのリクエストパラメータを厳格に検証
   - 特に権限変更、組織操作などの重要操作は二重チェック

2. **レートリミット**:
   - ブルートフォース攻撃防止のためレートリミットを適用
   - 特に認証関連エンドポイントは厳格に制限

3. **データアクセス制限**:
   - 必要最小限のデータのみを返却
   - センシティブ情報（パスワードハッシュなど）は決して返却しない

## 14. 変更履歴

- 2025-04-28: 初版作成 - 4階層ロール構造（SuperAdmin、Owner、Admin、User）対応API仕様
- 2025-04-30: 支払い状態管理APIを追加 - 組織アクセス停止・復元機能、一括支払い状態チェック機能