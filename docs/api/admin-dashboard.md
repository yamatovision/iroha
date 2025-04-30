# 管理者ダッシュボードAPI仕様書

## 概要

管理者ダッシュボードは美容サロン全体の運営状況を一目で把握するための画面です。基本統計情報（予約数、クライアント数、スタイリスト数など）とGPT-4oトークン使用状況を表示します。このAPIはそれらの情報を取得するためのエンドポイントを提供します。

## エンドポイント一覧

### 1. ダッシュボード統計情報取得

```typescript
// shared/index.ts に追加
export const API_PATHS = {
  // 既存のパス...
  ADMIN: {
    // 既存のパス...
    DASHBOARD: {
      STATS: '/api/admin/dashboard/stats',
      TOKEN_USAGE: '/api/admin/dashboard/token-usage',
      UNASSIGNED_APPOINTMENTS: '/api/admin/dashboard/unassigned-appointments',
      ASSIGN_STYLIST: '/api/admin/appointments/:appointmentId/assign'
    }
  }
};
```

#### GET `/api/admin/dashboard/stats`

ダッシュボードに表示する基本統計情報を取得します。

##### リクエスト

- **認証**: 必要（JWT Bearer Token）
- **パラメータ**: なし

##### レスポンス

```typescript
interface DashboardStatsResponse {
  success: boolean;
  data: {
    todayAppointments: number;        // 本日の予約数
    clientsCount: number;             // 全クライアント数
    stylistsCount: number;            // スタイリスト数
    weeklyCompletedServices: number;  // 今週の施術完了数
  };
}
```

##### エラーケース

- **401 Unauthorized**: 認証エラー（トークンなし、または無効）
- **403 Forbidden**: 権限エラー（Adminまたはowner権限が必要）
- **500 Internal Server Error**: サーバー内部エラー

---

### 2. トークン使用状況取得

#### GET `/api/admin/dashboard/token-usage`

GPT-4oトークンの使用状況に関する情報を取得します。

##### リクエスト

- **認証**: 必要（JWT Bearer Token）
- **パラメータ**:
  - `period` (query, optional): 期間指定（"current_month", "last_month", "last_3_months"）。デフォルトは "current_month"

##### レスポンス

```typescript
interface TokenUsageResponse {
  success: boolean;
  data: {
    currentPeriod: {
      usedTokens: number;           // 使用済みトークン数
      totalTokens: number;          // プラン上限（追加分含む）
      usagePercentage: number;      // 使用率（%）
      remainingTokens: number;      // 残りトークン数
      planLimit: number;            // 基本プラン上限（追加分を除く）
      renewalDate: string;          // 更新日 (ISO 8601形式)
    };
    dailyUsage: {
      date: string;                 // 日付 (YYYY-MM-DD形式)
      tokenCount: number;           // その日のトークン使用量
    }[];
    dailyTarget: number;            // 日割り目安トークン数
  };
}
```

##### エラーケース

- **401 Unauthorized**: 認証エラー
- **403 Forbidden**: 権限エラー
- **500 Internal Server Error**: サーバー内部エラー

---

### 3. 未担当予約一覧取得

#### GET `/api/admin/dashboard/unassigned-appointments`

本日の未担当予約（スタイリスト未割り当て）の一覧を取得します。

##### リクエスト

- **認証**: 必要（JWT Bearer Token）
- **パラメータ**:
  - `date` (query, optional): 日付指定（YYYY-MM-DD形式）。デフォルトは本日

##### レスポンス

```typescript
interface UnassignedAppointmentsResponse {
  success: boolean;
  data: {
    appointments: {
      id: string;                // 予約ID
      clientId: string;          // クライアントID
      clientName: string;        // クライアント名
      serviceType: string;       // 施術内容
      timeSlot: {                // 予約時間枠
        start: string;           // 開始時間 (ISO 8601形式)
        end: string;             // 終了時間 (ISO 8601形式)
      };
      elementType: 'water' | 'wood' | 'fire' | 'earth' | 'metal';  // クライアントの五行タイプ
      assigned: boolean;         // 担当者割り当て済みかどうか
    }[];
  };
}
```

##### エラーケース

- **401 Unauthorized**: 認証エラー
- **403 Forbidden**: 権限エラー
- **500 Internal Server Error**: サーバー内部エラー

---

### 4. スタイリスト割り当て

#### POST `/api/admin/appointments/:appointmentId/assign`

予約に対してスタイリストを割り当てます。

##### リクエスト

- **認証**: 必要（JWT Bearer Token）
- **パラメータ**:
  - `appointmentId` (path): 予約ID
  - リクエストボディ:
```json
{
  "stylistId": "string"  // 割り当てるスタイリストのID
}
```

##### レスポンス

```typescript
interface AssignStylistResponse {
  success: boolean;
  data: {
    appointmentId: string;       // 予約ID
    stylistId: string;           // 割り当てられたスタイリストID
    stylistName: string;         // スタイリスト名
    updatedAt: string;           // 更新日時 (ISO 8601形式)
  };
}
```

##### エラーケース

- **400 Bad Request**: 不正なリクエスト（スタイリストIDなし）
- **401 Unauthorized**: 認証エラー
- **403 Forbidden**: 権限エラー
- **404 Not Found**: 予約またはスタイリストが見つからない
- **500 Internal Server Error**: サーバー内部エラー

## 型定義

以下の型定義を `shared/index.ts` に追加します：

```typescript
// ダッシュボード関連の型定義
export interface DashboardStats {
  todayAppointments: number;
  clientsCount: number;
  stylistsCount: number;
  weeklyCompletedServices: number;
}

export interface TokenUsageStats {
  currentPeriod: {
    usedTokens: number;
    totalTokens: number;
    usagePercentage: number;
    remainingTokens: number;
    planLimit: number;
    renewalDate: string;
  };
  dailyUsage: {
    date: string;
    tokenCount: number;
  }[];
  dailyTarget: number;
}

export interface UnassignedAppointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  timeSlot: {
    start: string;
    end: string;
  };
  elementType: 'water' | 'wood' | 'fire' | 'earth' | 'metal';
  assigned: boolean;
}

export interface AssignStylistRequest {
  stylistId: string;
}

export interface AssignStylistResponse {
  appointmentId: string;
  stylistId: string;
  stylistName: string;
  updatedAt: string;
}
```

## 認証と権限

このAPIの各エンドポイントへのアクセスには以下の権限が必要です：

1. 統計情報取得、トークン使用状況取得、未担当予約一覧取得
   - Admin権限以上（AdminまたはOwner）のユーザーがアクセス可能

2. Owner専用機能
   - 一部の機能（例: トークン追加チャージ購入機能）はOwner権限が必要
   - 権限チェックはフロントエンドとバックエンドの両方で実施

## エラーハンドリング

すべてのAPIレスポンスは統一された形式で返されます：

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

一般的なエラーコード：

- `UNAUTHORIZED`: 認証エラー（401）
- `FORBIDDEN`: 権限エラー（403）
- `NOT_FOUND`: リソースが見つからない（404）
- `INTERNAL_ERROR`: サーバー内部エラー（500）

## 実装上の注意点

1. **トークン使用量の集計について**
   - トークン使用量はリアルタイムではなく、定期的（数分〜1時間ごと）に集計される可能性があるため、
     最新の使用量が即座に反映されない場合があることをフロントエンドに通知することを検討

2. **日割り目安の計算方法**
   - 日割り目安は「月間上限 ÷ 月の日数」で計算される
   - 月初に計算され、月の途中でプラン変更があった場合も再計算される

3. **不要なクエリ最適化**
   - ダッシュボードの統計情報取得は複数のコレクションから集計するため、
     パフォーマンスを考慮してキャッシュ戦略の導入を検討