# スーパー管理者 - ユーザー管理機能のデータモデル分析

## 1. データモデルの概要

ユーザー管理機能は、美姫命システム全体のユーザーアカウントを管理するための重要な機能です。本文書では、このモジュールで必要となるデータモデルと関連性を詳細に分析します。

## 2. 主要エンティティ

### 2.1 ユーザー (User)

ユーザーは美姫命システムを使用するすべての人物を表し、管理者やスタイリストなど異なるロールを持ちます。

```typescript
interface User {
  _id: string;            // MongoDB ObjectId
  email: string;          // メールアドレス（一意）
  name: string;           // 氏名
  roleType: string;       // "admin" または "stylist"
  status: string;         // "active", "inactive", "trial"
  organizationId: string; // 所属サロン参照 (Organization._id)
  password: string;       // ハッシュ化されたパスワード
  lastLoginAt: Date;      // 最終ログイン日時
  lastLoginIp: string;    // 最終ログインIPアドレス
  loginAttempts: number;  // ログイン試行回数
  lockedUntil: Date;      // アカウントロック解除日時
  createdAt: Date;        // 作成日時
  updatedAt: Date;        // 更新日時
  createdBy: string;      // 作成者ID (User._id または SuperAdmin._id)
  updatedBy: string;      // 更新者ID (User._id または SuperAdmin._id)
}
```

### 2.2 スーパー管理者 (SuperAdmin)

スーパー管理者は美姫命サービス全体を管理する特権ユーザーで、Userエンティティとは別に管理します。

```typescript
interface SuperAdmin {
  _id: string;               // MongoDB ObjectId
  email: string;             // メールアドレス（一意）
  name: string;              // 氏名
  roleLevel: string;         // "master", "operation", "support"
  password: string;          // ハッシュ化されたパスワード
  lastLoginAt: Date;         // 最終ログイン日時
  lastLoginIp: string;       // 最終ログインIPアドレス
  twoFactorEnabled: boolean; // 二要素認証有効フラグ
  twoFactorSecret: string;   // 二要素認証シークレット
  createdAt: Date;           // 作成日時
  updatedAt: Date;           // 更新日時
  createdBy: string;         // 作成者ID (SuperAdmin._id)
  updatedBy: string;         // 更新者ID (SuperAdmin._id)
}
```

### 2.3 組織 (Organization)

サロンを表すエンティティで、ユーザーが所属する組織単位です。

```typescript
interface Organization {
  _id: string;                 // MongoDB ObjectId
  name: string;                // サロン名
  status: string;              // "active", "inactive", "trial"
  subscriptionPlanId: string;  // サブスクリプションプラン参照
  subscriptionStatus: string;  // サブスクリプション状態
  trialEndDate: Date;          // トライアル終了日
  maxStylists: number;         // 登録可能な最大スタイリスト数
  createdAt: Date;             // 作成日時
  updatedAt: Date;             // 更新日時
  createdBy: string;           // 作成者ID (SuperAdmin._id)
  updatedBy: string;           // 更新者ID (SuperAdmin._id または User._id)
}
```

### 2.4 ログイン履歴 (LoginHistory)

ユーザーやスーパー管理者のログイン履歴を記録します。

```typescript
interface LoginHistory {
  _id: string;               // MongoDB ObjectId
  userId: string;            // User._id または SuperAdmin._id
  userType: string;          // "user" または "superadmin"
  timestamp: Date;           // ログイン試行日時
  ip: string;                // IPアドレス
  userAgent: string;         // ユーザーエージェント情報
  device: string;            // デバイス情報
  location: string;          // 地理的位置情報
  status: string;            // "success" または "failed"
  failureReason: string;     // 失敗理由 (失敗時のみ)
}
```

### 2.5 操作ログ (ActivityLog)

ユーザーやスーパー管理者の操作履歴を記録します。

```typescript
interface ActivityLog {
  _id: string;               // MongoDB ObjectId
  userId: string;            // User._id または SuperAdmin._id
  userType: string;          // "user" または "superadmin"
  timestamp: Date;           // 操作日時
  action: string;            // 実行されたアクション
  targetType: string;        // 操作対象の種類 (user, client, etc.)
  targetId: string;          // 操作対象のID
  details: string;           // 操作の詳細
  ip: string;                // IPアドレス
  success: boolean;          // 成功フラグ
}
```

### 2.6 監査ログ (AuditLog)

特に重要な操作（権限変更、アカウント削除など）の詳細な監査記録を行います。

```typescript
interface AuditLog {
  _id: string;               // MongoDB ObjectId
  performedBy: string;       // 操作実行者ID (User._id または SuperAdmin._id)
  performerType: string;     // "user" または "superadmin"
  performerRole: string;     // 実行者の役割
  timestamp: Date;           // 操作日時
  action: string;            // 監査対象アクション
  category: string;          // カテゴリ（権限変更、アカウント管理など）
  targetType: string;        // 対象エンティティタイプ
  targetId: string;          // 対象ID
  previousState: object;     // 変更前の状態
  newState: object;          // 変更後の状態
  reason: string;            // 操作理由
  ip: string;                // IPアドレス
  additionalInfo: object;    // その他の追加情報
}
```

## 3. エンティティ間の関係

```
                 ┌───────────────┐
                 │  SuperAdmin   │
                 └───────┬───────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             │             ▼
┌───────────────┐        │    ┌────────────────┐
│  Organization │◄───────┘    │   AuditLog     │
└───────┬───────┘             └────────────────┘
        │                              ▲
        │                              │
        ▼                              │
┌───────────────┐            ┌────────────────┐
│     User      │──────────► │  ActivityLog   │
└───────┬───────┘            └────────────────┘
        │                              ▲
        │                              │
        ▼                              │
┌───────────────┐                      │
│ LoginHistory  │──────────────────────┘
└───────────────┘
```

### 関係性の説明:

1. **SuperAdmin と Organization**:
   - SuperAdminは組織（サロン）を作成・管理します（1対多）
   - 複数のOrganizationを管理可能

2. **Organization と User**:
   - 組織（サロン）には複数のユーザー（管理者、スタイリスト）が所属（1対多）
   - ユーザーは1つの組織にのみ所属可能

3. **User/SuperAdmin と LoginHistory**:
   - ユーザーおよびスーパー管理者は複数のログイン履歴を持つ（1対多）

4. **User/SuperAdmin と ActivityLog**:
   - ユーザーおよびスーパー管理者は複数の操作ログを持つ（1対多）

5. **User/SuperAdmin/Organization と AuditLog**:
   - 監査ログは様々なエンティティの重要な変更を記録（多対多）
   - 操作者と操作対象の両方の関連を持つ

## 4. データフローの概要

### 4.1 ユーザー検索フロー

1. スーパー管理者がユーザー検索条件を入力
2. バックエンドでUserコレクションに対してクエリ実行
3. 検索結果を取得し、必要に応じてOrganizationデータと結合
4. 結果をフロントエンドに返却して表示

### 4.2 ユーザー詳細表示フロー

1. スーパー管理者が特定ユーザーの詳細表示を要求
2. Userデータを取得
3. 関連するLoginHistoryデータを取得
4. 関連するActivityLogデータを取得
5. 関連するOrganizationデータを取得
6. すべてのデータを結合してフロントエンドに返却

### 4.3 特別操作フロー（例：権限変更）

1. スーパー管理者が特定ユーザーの権限変更を要求
2. 操作前の確認ダイアログ表示
3. 確認後、バックエンドでUserデータを更新
4. ActivityLogに操作記録を保存
5. AuditLogに詳細な監査記録（変更前後の状態を含む）を保存
6. 操作結果をフロントエンドに返却

## 5. 潜在的なデータの整合性問題と対策

### 5.1 ユーザーとサロンの整合性

**問題**: サロンが削除された場合、そこに所属するユーザーが宙に浮く可能性がある。
**対策**: 
- サロン削除時は所属ユーザーも連動して処理する（無効化または削除）
- データベースレベルでの参照整合性制約の設定

### 5.2 権限変更のセキュリティ

**問題**: 権限変更は重要な操作であり、不正な変更やミスのリスクがある。
**対策**:
- 権限変更は上位権限（マスターSuperAdmin）のみが実行可能
- すべての権限変更操作は詳細な監査ログを記録
- 権限変更時には確認のための多要素認証を要求

### 5.3 並行操作による競合

**問題**: 複数のSuperAdminが同時に同じユーザーを編集した場合の競合。
**対策**:
- 楽観的ロック機構の実装（バージョン管理）
- 編集操作時のロック機構
- コンフリクト発生時の通知と解決メカニズム

### 5.4 パスワードリセットのセキュリティ

**問題**: パスワードリセット機能が悪用される可能性。
**対策**:
- リセット操作の詳細な監査ログ記録
- リセット後のワンタイムパスワード生成と安全な配布
- リセット操作後のユーザーへの通知
- リセット操作の頻度制限

## 6. データ分離と保護

### 6.1 データ分離ポリシー

- サロン（Organization）間のデータは厳格に分離
- SuperAdminのみが複数サロンのデータにアクセス可能
- SuperAdminの権限レベルによってアクセス範囲を制限

### 6.2 個人情報保護

- 個人識別情報（PII）へのアクセスはログ記録
- 特権操作（ユーザーデータへの変更など）には追加承認が必要
- 必要に応じてデータマスキングを実施
- すべてのデータアクセスに対して目的とコンテキストが必要

## 7. 結論と実装推奨事項

### 7.1 モデル設計の要点

1. **柔軟性と拡張性**:
   - ユーザー権限モデルは将来の拡張を見越した設計
   - 監査ログは様々な操作に対応できる汎用的な構造

2. **セキュリティと監査**:
   - すべての重要操作が追跡可能
   - 操作前後の状態を記録
   - 理由と承認の記録

3. **効率的なクエリ対応**:
   - 頻出検索パターンに基づくインデックス設計
   - ユーザー検索の効率化

### 7.2 実装優先順位

1. 基本ユーザーモデルとスーパー管理者モデルの実装
2. ログイン履歴と監査ログの実装
3. 検索とフィルタリング機能の実装
4. 特別操作（権限変更、アカウント管理）の実装
5. 詳細なレポートと分析機能の実装