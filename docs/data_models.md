# DailyFortune データモデル定義

> **最終更新**: 2025/04/09

## 変更履歴
- 2025/04/09: Team モデルから members フィールドを削除 (User.teamId に一元化)
- 2025/04/08: SajuProfile モデルを User モデルに完全に統合

## AIチーム開発への注意事項
このドキュメントは単一の真実源です。モデルを変更する場合は、必ずこのドキュメントを更新してください。

## 基本モデル

### Organization（組織）モデル
```typescript
interface Organization {
  _id: ObjectId;
  name: string;
  superAdminId: ObjectId; // SuperAdmin参照
  subscriptionPlan: {
    type: 'none' | 'active' | 'trial' | 'cancelled';
    isActive: boolean;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  };
  billingInfo: {
    companyName?: string;
    contactName: string;
    contactEmail: string;
    address?: string;
    postalCode?: string;
    country?: string;
    taxId?: string;
    paymentMethodId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Subscription（サブスクリプション）モデル
```typescript
interface Subscription {
  _id: ObjectId;
  organizationId: ObjectId;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string; // 料金プランID
  quantity: number; // ユーザー数
  totalAmount: number; // 合計金額
  currency: string; // 通貨（JPY）
  paymentMethodId?: string;
  adminCount: number; // Admin（エリートプラン）数
  userCount: number; // User（ライトプラン）数
  lastInvoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### User（ユーザー）モデル
```typescript
interface User {
  _id: ObjectId;
  email: string;
  password: string; // ハッシュ化
  displayName: string;
  role: 'SuperAdmin' | 'Admin' | 'User';
  organizationId: ObjectId; // 組織への参照
  teamId: ObjectId; // チームへの参照（第一フェーズではチーム必須）
  jobTitle?: string; // 役割（エンジニア、営業など）
  
  // 基本的な誕生情報
  birthDate?: Date;                 // 生年月日
  birthTime?: string;               // 出生時間（HH:MM形式）
  birthPlace?: string;              // 出生地
  gender?: 'M' | 'F';               // 性別
  birthplaceCoordinates?: {         // 出生地の座標
    longitude: number;
    latitude: number;
  };
  localTimeOffset?: number;         // 地方時オフセット（分単位）
  
  // 個人目標
  goal?: string;                    // ユーザーの設定した目標
  
  // 四柱推命情報（SajuProfileから統合）
  elementAttribute?: 'wood' | 'fire' | 'earth' | 'metal' | 'water';  // 五行属性
  dayMaster?: string;               // 日主
  fourPillars?: {                   // 四柱（年月日時）
    year: {
      heavenlyStem: string;         // 天干
      earthlyBranch: string;        // 地支
      heavenlyStemTenGod?: string;  // 天干十神
      earthlyBranchTenGod?: string; // 地支十神
      hiddenStems?: string[];       // 隠れ干
    };
    month: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
    day: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
    hour: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
  };
  elementProfile?: {               // 五行バランス
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  personalityDescription?: string;  // 性格特性の説明
  careerAptitude?: string;          // 職業適性の説明
  
  plan: 'elite' | 'lite'; // エリート(Sonnet)またはライト(Haiku)プラン
  isActive: boolean; // アクティブ状態
  createdAt: Date;
  updatedAt: Date;
}
```

### UserGoal（ユーザー目標）モデル
```typescript
interface UserGoal {
  _id: ObjectId;
  userId: ObjectId; // ユーザーへの参照
  type: 'career' | 'team' | 'personal'; // 目標タイプ
  content: string; // 目標内容
  deadline: Date; // 目標期限
  createdAt: Date;
  updatedAt: Date;
}
```

### Team（チーム）モデル
```typescript
interface Team {
  _id: ObjectId;
  name: string;
  adminId: ObjectId; // 管理者（Admin）への参照
  organizationId: ObjectId; // 組織への参照
  description?: string;
  iconInitial?: string;
  iconColor?: 'primary' | 'water' | 'wood' | 'fire' | 'earth' | 'metal';
  createdAt: Date;
  updatedAt: Date;
}
```

> **注意**: 2025/04/09 のリファクタリングにより、チームメンバーシップ管理は User.teamId のみを使用するように変更されました。Team.members フィールドは削除され、すべてのメンバーシップ操作は User モデルの teamId フィールドを通じて行われます。

### TeamGoal（チーム目標）モデル
```typescript
interface TeamGoal {
  _id: ObjectId;
  teamId: ObjectId; // チームへの参照
  content: string; // 目標内容
  deadline?: Date; // オプションの期限
  createdAt: Date;
  updatedAt: Date;
}
```

### DayPillar（日柱）モデル
```typescript
interface DayPillar {
  _id: ObjectId;
  date: Date; // 日付（時間情報なし）
  heavenlyStem: string; // 天干
  earthlyBranch: string; // 地支
  hiddenStems: string[]; // 蔵干
  energyDescription: string; // その日のエネルギーの説明
  createdAt: Date;
}
```

### DailyFortune（デイリー運勢）モデル
```typescript
interface DailyFortune {
  _id: ObjectId;
  userId: ObjectId; // ユーザーへの参照
  date: Date; // 運勢の日付
  dayPillarId: ObjectId; // 日柱への参照
  fortuneScore: number; // 運勢スコア（0-100）
  advice: string; // 統合されたアドバイス（個人目標・チーム目標・その日の運勢を含む）
  luckyItems: {
    color: string; // ラッキーカラー
    item: string; // ラッキーアイテム
    drink: string; // ラッキードリンク
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Compatibility（相性）モデル
```typescript
interface Compatibility {
  _id: ObjectId;
  user1Id: ObjectId; // ユーザー1への参照（常に小さいIDが先）
  user2Id: ObjectId; // ユーザー2への参照
  compatibilityScore: number; // 相性スコア（0-100）
  relationship: 'mutual_generation' | 'mutual_restriction' | 'neutral'; // 相生・相克・中和関係
  user1Element: 'wood' | 'fire' | 'earth' | 'metal' | 'water'; // ユーザー1の五行属性
  user2Element: 'wood' | 'fire' | 'earth' | 'metal' | 'water'; // ユーザー2の五行属性
  detailDescription: string; // 相性詳細説明文
  createdAt: Date;
  updatedAt: Date;
}
```

### ChatHistory（チャット履歴）モデル
```typescript
interface ChatMessage {
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatHistory {
  _id: ObjectId;
  userId: ObjectId; // ユーザーへの参照
  chatType: 'personal' | 'team_member' | 'team_goal'; // チャットタイプ
  relatedInfo?: {
    teamMemberId?: ObjectId; // 相性相談時のチームメイトID
    teamGoalId?: ObjectId; // 目標相談時のチーム目標ID
  };
  messages: ChatMessage[]; // メッセージ履歴
  tokenCount: number; // メッセージのトークン数合計
  contextData: Record<string, any>; // チャットに提供されるコンテキスト情報（JSONとして）
  aiModel: 'sonnet' | 'haiku'; // 使用しているAIモデル
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date; // 最終メッセージ時間
}
```

### SystemSetting（システム設定）モデル
```typescript
interface SystemSetting {
  _id: ObjectId;
  organizationId?: ObjectId; // 組織固有の設定の場合
  key: string; // 設定キー（e.g. 'fortune_update_time'）
  value: string; // 設定値
  description: string; // 説明
  updatedAt: Date;
  updatedBy: ObjectId; // 更新者ID
}
```

### UsageStatistics（利用統計）モデル
```typescript
interface UsageStatistics {
  _id: ObjectId;
  organizationId: ObjectId; // 組織ID
  type: 'user' | 'ai'; // 統計タイプ
  date: Date; // 日付
  metrics: {
    totalUsers?: number; // ユーザー総数
    activeUsers?: number; // アクティブユーザー数
    newUsers?: number; // 新規ユーザー数
    aiRequests?: number; // AI APIリクエスト数
    averageResponseTime?: number; // 平均レスポンス時間（ms）
    haikusUsed?: number; // Haikuモデル使用回数
    sonnetsUsed?: number; // Sonnetモデル使用回数 
  };
  createdAt: Date;
}
```

### PricePlan（料金プラン）モデル
```typescript
interface PricePlan {
  _id: ObjectId;
  name: string; // 表示名（例: 'エリートプラン', 'ライトプラン'）
  code: 'elite' | 'lite'; // プランコード
  price: number; // 単価（円）
  userType: 'Admin' | 'User'; // ユーザータイプ
  features: {
    aiModel: 'sonnet' | 'haiku'; // AIモデル種別
    allowTeamCreation: boolean; // チーム作成機能の有無
    maxChatsPerDay?: number; // 1日あたりの最大チャット数（無制限はnull）
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Invoice（請求書）モデル
```typescript
interface Invoice {
  _id: ObjectId;
  organizationId: ObjectId;
  subscriptionId: ObjectId;
  invoiceNumber: string;
  amount: number;
  currency: string; // 'JPY'
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
  paidAt?: Date;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  paymentMethodId?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Alert（アラート）モデル
```typescript
interface Alert {
  _id: ObjectId;
  teamId: ObjectId; // チームへの参照
  userId: ObjectId; // アラート対象ユーザーへの参照
  type: 'motivation_low' | 'leave_risk'; // アラートタイプ
  severity: 'low' | 'medium' | 'high'; // 重要度
  description: string; // アラート説明
  suggestion: string; // 対応案
  isRead: boolean; // 既読フラグ
  createdAt: Date;
  updatedAt: Date;
}
```

## AI相談用データモデル（Claude AIへの入力コンテキスト）

### 1. 運勢相談コンテキスト
```typescript
interface FortuneConsultationContext {
  // ユーザー情報
  user: {
    displayName: string;
    elementAttribute: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
    dayMaster: string;
    jobTitle: string;
    pillars: {
      year: { heavenlyStem: string, earthlyBranch: string, heavenlyStemTenGod: string, earthlyBranchTenGod: string, hiddenStems: string[] },
      month: { /* 同上 */ },
      day: { /* 同上 */ },
      time: { /* 同上 */ }
    }
  };

  // 今日の運勢情報
  dailyFortune: {
    date: string;
    dayPillar: {
      heavenlyStem: string;
      earthlyBranch: string;
      hiddenStems: string[];
    };
    fortuneScore: number;
    luckyItems: {
      color: string;
      item: string;
      drink: string;
    };
  };

  // ユーザー目標
  userGoals: {
    type: 'career' | 'team' | 'personal';
    content: string;
    deadline: string;
  }[];

  // チーム情報
  team?: {
    name: string;
    role: string; // ユーザーのチーム内役割
  };

  // チーム目標
  teamGoals?: {
    content: string;
    deadline?: string;
  }[];
}
```

### 2. チームメンバー相性相談コンテキスト
```typescript
interface TeamMemberConsultationContext {
  // 相談者（ユーザー自身）の情報
  user: {
    displayName: string;
    elementAttribute: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
    dayMaster: string;
    pillars: {
      year: { heavenlyStem: string, earthlyBranch: string, heavenlyStemTenGod: string, earthlyBranchTenGod: string, hiddenStems: string[] },
      month: { /* 同上 */ },
      day: { /* 同上 */ },
      time: { /* 同上 */ }
    },
    jobTitle: string;
  };
  
  // 相談対象のチームメンバー情報
  targetMember: {
    displayName: string;
    elementAttribute: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
    dayMaster: string;
    pillars: {
      year: { /* ユーザーと同様 */ },
      month: { /* 同上 */ },
      day: { /* 同上 */ },
      time: { /* 同上 */ }
    },
    jobTitle: string;
  };
  
  // 両者の相性情報
  compatibility: {
    score: number;
    relationship: 'mutual_generation' | 'mutual_restriction' | 'neutral';
    detailDescription: string;
  };
  
  // 今日の運勢情報
  todaysEnergy: {
    date: string;
    dayPillar: {
      heavenlyStem: string;
      earthlyBranch: string;
      hiddenStems: string[];
    };
  };
  
  // 共有チーム目標
  teamGoals: {
    content: string;
    deadline?: string;
  }[];
}
```

### 3. チーム目標相談コンテキスト
```typescript
interface TeamGoalConsultationContext {
  // ユーザー（相談者）の情報
  user: {
    displayName: string;
    elementAttribute: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
    dayMaster: string;
    jobTitle: string;
    pillars: {
      day: { heavenlyStem: string, earthlyBranch: string, heavenlyStemTenGod: string, earthlyBranchTenGod: string, hiddenStems: string[] }
    }
  };
  
  // チーム情報
  team: {
    name: string;
    size: number;  // メンバー数
  };
  
  // チーム目標データ
  teamGoal: {
    content: string;
    deadline?: string;
  };
  
  // チームメンバーのデータ
  teamMembers: {
    displayName: string;
    elementAttribute: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
    jobTitle: string;
    dayMaster: string;
  }[];
  
  // 今日の日柱情報
  todaysEnergy: {
    date: string;
    dayPillar: {
      heavenlyStem: string;
      earthlyBranch: string;
      hiddenStems: string[];
    };
  };
}
```

## インデックス設計

### Organization コレクション
- `superAdminId` にインデックス（管理者検索用）
- `subscriptionPlan.isActive` にインデックス（アクティブ組織検索用）

### User コレクション
- `email` にユニークインデックス（ログイン時）
- `teamId` にインデックス（チーム別ユーザー取得時）
- `role` にインデックス（権限別のユーザー検索時）
- `organizationId` にインデックス（組織別ユーザー取得時）
- `organizationId` と `role` の複合インデックス（組織内の役割別検索時）
- `organizationId` と `plan` の複合インデックス（プラン別ユーザー検索時）
- `isActive` にインデックス（アクティブユーザー検索用）

### Team コレクション
- `organizationId` にインデックス（組織別チーム取得時）
- `adminId` にインデックス（管理者検索時）

### DailyFortune コレクション
- `userId` と `date` の複合インデックス（特定日の運勢取得）
- `date` にインデックス（同じ日の全ユーザー運勢取得時）

### ChatHistory コレクション
- `userId` にインデックス（ユーザー別チャット履歴取得）
- `userId` と `chatType` の複合インデックス（特定種類のチャット取得）
- `lastMessageAt` にインデックス（最新チャット順取得）
- `tokenCount` にインデックス（トークン数制限監視用）

### Compatibility コレクション
- `user1Id` と `user2Id` の複合インデックス（特定ユーザー間の相性取得）
- `user1Id` にインデックス（特定ユーザーの全相性取得時）
- `user2Id` にインデックス（特定ユーザーの全相性取得時）

### Subscription コレクション
- `organizationId` にユニークインデックス（組織のサブスクリプション検索用）
- `status` にインデックス（ステータス別検索用）
- `currentPeriodEnd` にインデックス（更新時期検索用）

### Invoice コレクション
- `organizationId` にインデックス（組織別請求書検索用）
- `status` にインデックス（ステータス別検索用）
- `dueDate` にインデックス（支払期限検索用）

### UsageStatistics コレクション
- `organizationId` と `date` の複合インデックス（日別統計取得用）
- `organizationId` と `type` の複合インデックス（統計タイプ別取得用）

### DailyFortuneUpdateLog コレクション
- `date` にインデックス（日付検索用）
- `status` にインデックス（ステータス検索用）
- `isAutomaticRetry` と `status` の複合インデックス（リトライ候補検索用）

### SystemSetting コレクション
- `key` にインデックス（設定キー検索用）
- `key` と `organizationId` の複合ユニークインデックス（組織別設定用）

> 注: 運勢更新設定は SystemSetting モデルに `fortune_update_time` キーで格納され、値は `HH:MM` 形式（例: `03:00`）で保存されます。

## ログ・監査モデル

### AuditLog（監査ログ）モデル
```typescript
interface AuditLog {
  _id: ObjectId;
  organizationId: ObjectId;
  userId: ObjectId; // 操作実行ユーザー
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'payment' | 'subscription_change';
  resourceType: 'user' | 'team' | 'subscription' | 'organization' | 'system_setting';
  resourceId?: ObjectId; // 操作対象リソースID
  details: Record<string, any>; // 操作の詳細情報
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

### BatchJobLog（バッチ処理ログ）モデル
```typescript
interface BatchJobLog {
  _id: ObjectId;
  jobType: 'daily_fortune_update' | 'subscription_check' | 'backup';
  status: 'started' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  totalItems: number;
  processedItems: number;
  errorItems: number;
  errors: {
    itemId?: ObjectId;
    message: string;
    stack?: string;
  }[];
  details?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### DailyFortuneUpdateLog（運勢更新ログ）モデル
```typescript
interface DailyFortuneUpdateLog {
  _id: ObjectId;
  date: Date;  // 更新実行日
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  totalUsers: number;  // 更新対象ユーザー数
  successCount: number;  // 成功数
  failedCount: number;  // 失敗数
  errors?: {
    userId?: ObjectId;
    message: string;
    stack?: string;
  }[];  // エラー情報
  isAutomaticRetry: boolean;  // 自動リトライかどうか
  retryCount?: number;  // リトライ回数
  lastRetryAt?: Date;  // 最終リトライ日時
  createdBy: ObjectId;  // 作成者（自動実行の場合はシステム管理者ID）
  createdAt: Date;
  updatedAt: Date;
}
```

### NotificationLog（通知ログ）モデル
```typescript
interface NotificationLog {
  _id: ObjectId;
  organizationId: ObjectId;
  userId: ObjectId; // 通知先ユーザー
  type: 'payment_failed' | 'subscription_expiring' | 'system_alert';
  channel: 'email' | 'in_app';
  status: 'pending' | 'sent' | 'failed' | 'read';
  subject: string;
  content: string;
  metadata?: Record<string, any>;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```