# 統合データモデル設計書

## 1. 概要

このドキュメントは、美姫命（びきめい）アプリケーションの統合データモデル設計を提供します。各エンティティの属性、関係性、整合性制約を明確にし、システム全体を一貫したデータ構造で実装するためのガイドラインを示します。

## 2. 主要エンティティとその関係

### 2.1 組織とユーザー関連モデル

#### 2.1.1 組織モデル (Organization)

組織（美容サロン）を表すモデルです。

```typescript
interface IOrganization {
  _id: mongoose.Types.ObjectId;  // 組織ID
  name: string;                  // 組織名（サロン名）
  ownerId: mongoose.Types.ObjectId; // オーナーのユーザーID
  address?: {                    // 住所情報
    street: string;              // 町名・番地
    city: string;                // 市区町村
    state: string;               // 都道府県
    postalCode: string;          // 郵便番号
    country: string;             // 国
  };
  contactEmail?: string;         // 連絡先メールアドレス
  contactPhone?: string;         // 連絡先電話番号
  logoUrl?: string;              // ロゴ画像URL
  websiteUrl?: string;           // ウェブサイトURL
  businessHours?: {              // 営業時間
    start: string;               // 開始時間
    end: string;                 // 終了時間
    dayOfWeek: number;           // 曜日（0=日曜〜6=土曜）
  }[];
  description?: string;          // 組織の説明文
  planId?: mongoose.Types.ObjectId; // 契約プランID
  subscriptionPlan: {            // サブスクリプション情報
    type: 'none' | 'active' | 'trial' | 'cancelled';
    isActive: boolean;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  };
  billingInfo: {                 // 請求情報
    companyName?: string;
    contactName: string;
    contactEmail: string;
    address?: string;
    postalCode?: string;
    country?: string;
    taxId?: string;
    paymentMethodId?: string;
  };
  stripeCustomerId?: string;     // Stripe顧客ID（課金用）
  isActive: boolean;             // アクティブ状態
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.1.2 ユーザーモデル (User)

スタイリスト、管理者など全てのユーザーを表すモデルです。階層化された4層のロール（SuperAdmin, Owner, Admin, User）を実装しています。

```typescript
interface IUser {
  _id: mongoose.Types.ObjectId;  // ユーザーID
  email: string;                 // メールアドレス（ログイン用）
  password: string;              // ハッシュ化されたパスワード
  displayName: string;           // 表示名
  profileImage?: string;         // プロフィール画像URL
  role: 'SuperAdmin' | 'Owner' | 'Admin' | 'User'; // 4階層ロール
  organizationId?: mongoose.Types.ObjectId; // 所属組織ID（SuperAdmin以外は必須）
  jobTitle?: string;             // 役職/ポジション
  phoneNumber?: string;          // 電話番号
  
  // JWT認証関連
  refreshToken?: string;         // JWTリフレッシュトークン
  tokenVersion?: number;         // リフレッシュトークンの無効化に使用するバージョン
  lastLogin?: Date;              // 最終ログイン日時
  
  // 基本的な誕生情報（四柱推命算出用）
  birthDate?: Date;              // 生年月日
  birthTime?: string;            // 出生時間（HH:MM形式）
  birthPlace?: string;           // 出生地
  gender?: 'M' | 'F';            // 性別
  birthplaceCoordinates?: {      // 出生地の座標
    longitude: number;
    latitude: number;
  };
  localTimeOffset?: number;      // 地方時オフセット（分単位）
  
  // 国際対応拡張情報
  timeZone?: string;             // タイムゾーン識別子（例：'Asia/Tokyo'）
  extendedLocation?: {           // 拡張ロケーション情報
    name?: string;               // 都市名
    country?: string;            // 国名
    coordinates: {               // 座標（必須）
      longitude: number;
      latitude: number;
    };
    timeZone?: string;           // タイムゾーン識別子
  };
  
  // ユーザー行動関連
  motivation?: number;           // モチベーションスコア（0-100）
  leaveRisk?: 'none' | 'low' | 'medium' | 'high'; // 離職リスク
  goal?: string;                 // ユーザーの設定した目標
  
  // 四柱推命情報
  elementAttribute?: 'wood' | 'fire' | 'earth' | 'metal' | 'water'; // 五行属性
  dayMaster?: string;            // 日主
  fourPillars?: {                // 四柱（年月日時）
    year: {
      heavenlyStem: string;      // 天干
      earthlyBranch: string;     // 地支
      heavenlyStemTenGod?: string; // 天干十神
      earthlyBranchTenGod?: string; // 地支十神
      hiddenStems?: string[];    // 隠れ干
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
  elementProfile?: {             // 五行バランス
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  
  // 格局（気質タイプ）情報
  kakukyoku?: {                  // 格局情報
    type: string;                // 例: '従旺格', '建禄格'など
    category: 'special' | 'normal'; // 特別格局か普通格局か
    strength: 'strong' | 'weak' | 'neutral'; // 身強か身弱か中和か
    description?: string;        // 格局の説明
  };
  yojin?: {                      // 用神情報
    tenGod: string;              // 十神表記: 例 '比肩', '食神'
    element: string;             // 五行表記: 例 'wood', 'fire'
    description?: string;        // 用神の説明
    supportElements?: string[];  // 用神をサポートする五行
    kijin?: {                    // 喜神情報（用神を助ける要素）
      tenGod: string;            // 十神表記
      element: string;           // 五行表記
      description?: string;      // 説明
    };
    kijin2?: {                   // 忌神情報（避けるべき要素）
      tenGod: string;            // 十神表記
      element: string;           // 五行表記
      description?: string;      // 説明
    };
    kyujin?: {                   // 仇神情報（強く避けるべき要素）
      tenGod: string;            // 十神表記
      element: string;           // 五行表記
      description?: string;      // 説明
    };
  };
  personalityDescription?: string; // 性格特性の説明
  careerAptitude?: string;       // 職業適性の説明
  
  // サブスクリプション情報
  plan: 'elite' | 'lite';        // プランタイプ
  isActive: boolean;             // アクティブ状態
  
  // デバイス情報
  deviceTokens?: string[];       // プッシュ通知用デバイストークン
  
  // 時間情報
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.1.3 プランモデル (PricePlan)

料金プラン情報を管理するモデルです。

```typescript
interface IPricePlan {
  _id: mongoose.Types.ObjectId;  // プランID
  name: string;                  // プラン名
  description: string;           // プラン説明
  price: number;                 // 価格
  currency: string;              // 通貨単位（JPY等）
  billingCycle: 'monthly' | 'yearly'; // 課金サイクル
  features: {                    // 機能制限
    maxUsers: number;            // 最大ユーザー数
    maxClients: number;          // 最大クライアント数
    allowedFeatures: string[];   // 利用可能機能リスト
    maxTokensPerMonth: number;   // 月間最大トークン数
  };
  additionalTokenPrice: number;  // 追加トークン1Mあたりの価格
  isActive: boolean;             // アクティブ状態
  displayOrder: number;          // 表示順序
  stripeProductId?: string;      // StripeプロダクトID
  stripePriceId?: string;        // Stripe価格ID
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.1.4 サブスクリプションモデル (Subscription)

組織のサブスクリプション情報を管理するモデルです。

```typescript
interface ISubscription {
  _id: mongoose.Types.ObjectId;  // サブスクリプションID
  organizationId: mongoose.Types.ObjectId; // 組織ID
  planId: mongoose.Types.ObjectId; // プランID
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'suspended'; // ステータス
  paymentStatus: 'success' | 'failed' | 'pending'; // 支払いステータス
  startDate: Date;               // 開始日
  endDate: Date | null;          // 終了日（nullは無期限）
  billingCycle: 'monthly' | 'yearly'; // 請求サイクル
  nextBillingDate: Date;         // 次回請求日
  currentPeriodStart: Date;      // 現在の請求期間開始日
  currentPeriodEnd: Date;        // 現在の請求期間終了日
  paymentFailCount: number;      // 支払い失敗回数
  lastPaymentDate?: Date;        // 最終支払い日
  lastFailureReason?: string;    // 最後の失敗理由
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.1.5 請求書モデル (Invoice)

請求書情報を管理するモデルです。

```typescript
interface IInvoice {
  _id: mongoose.Types.ObjectId;  // 請求書ID
  invoiceNumber: string;         // 請求書番号
  subscriptionId: mongoose.Types.ObjectId; // サブスクリプションID
  organizationId: mongoose.Types.ObjectId; // 組織ID
  planId: mongoose.Types.ObjectId; // プランID
  amount: number;                // 請求金額
  status: 'pending' | 'paid' | 'past_due' | 'canceled'; // ステータス
  issueDate: Date;               // 発行日
  dueDate: Date;                 // 支払期限
  paidAt: Date | null;           // 支払日
  items: {                       // 請求項目
    description: string;         // 内容
    quantity: number;            // 数量
    unitPrice: number;           // 単価
    amount: number;              // 金額
  }[];
  notes: string;                 // 備考
  tokenUsage?: {                 // トークン使用状況
    totalTokens: number;         // 合計トークン数
    planLimit: number;           // プラン上限
    additionalTokens: number;    // 追加トークン
    utilizationPercentage: number; // 使用率
  };
  paymentMethod?: {              // 支払い方法
    type: string;                // 種類（クレジットカードなど）
    last4: string;               // 下4桁
    brand: string;               // ブランド（VISAなど）
  };
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.1.6 トークンチャージモデル (TokenCharge)

APIトークンの追加チャージを管理するモデルです。

```typescript
interface ITokenCharge {
  _id: mongoose.Types.ObjectId;  // チャージID
  organizationId: mongoose.Types.ObjectId; // 組織ID
  userId: mongoose.Types.ObjectId; // 購入者ID
  purchaseDate: Date;            // 購入日時
  chargeType: 'standard' | 'premium'; // チャージタイプ
  tokenAmount: number;           // トークン数
  price: number;                 // 金額
  expirationDate: Date;          // 有効期限
  remainingTokens: number;       // 残りトークン数
  status: 'active' | 'expired' | 'exhausted'; // ステータス
  invoiceId?: mongoose.Types.ObjectId; // 関連する請求書ID
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

### 2.2 クライアント関連モデル

#### 2.2.1 クライアントモデル (Client)

美容サロンの顧客情報を管理するモデルです。

```typescript
interface IClient {
  _id: mongoose.Types.ObjectId;  // クライアントID
  organizationId: mongoose.Types.ObjectId; // 所属組織ID（美容サロンID）
  name: string;                  // 氏名
  nameReading?: string;          // 読み仮名
  gender?: 'M' | 'F';            // 性別
  birthdate?: Date;              // 生年月日
  birthtime?: string;            // 生まれた時間（HH:MM形式）
  birthPlace?: string;           // 出生地
  phone?: string;                // 電話番号
  email?: string;                // メールアドレス
  address?: string;              // 住所
  memo?: string;                 // メモ・備考
  
  // カスタムプロパティ
  customFields?: Record<string, any>; // カスタムフィールド
  
  // 外部システム連携情報
  externalSources?: {
    [sourceKey: string]: string; // 例: { "hotpepper": "HP12345", "salonanswer": "SA67890" }
  };
  
  // 四柱推命情報
  birthplaceCoordinates?: {      // 出生地座標
    longitude: number;
    latitude: number;
  };
  localTimeOffset?: number;      // 地方時オフセット（分単位）
  timeZone?: string;             // タイムゾーン
  elementAttribute?: string;     // 主要五行属性
  fourPillars?: {                // 四柱（年月日時）
    year: {
      gan: string;               // 天干
      shi: string;               // 地支
      element: string;           // 五行属性
    };
    month: {
      gan: string;
      shi: string;
      element: string;
    };
    day: {
      gan: string;
      shi: string;
      element: string;
    };
    hour: {
      gan: string;
      shi: string;
      element: string;
    };
  };
  elementProfile?: {             // 五行バランス
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  kakukyoku?: {                  // 格局情報
    type: string;
    category: 'special' | 'normal';
    strength: 'strong' | 'weak' | 'neutral';
    description?: string;
  };
  yojin?: {                      // 用神情報
    tenGod: string;
    element: string;
    description?: string;
    supportElements?: string[];
  };
  personalityDescription?: string; // 性格特性
  
  // 内部管理用
  isFavorite: boolean;           // お気に入り登録
  hasCompleteSajuProfile: boolean; // 四柱推命プロフィール完成状態
  lastVisitDate?: Date;          // 最終来店日
  createdBy: mongoose.Types.ObjectId; // 作成者ID
  updatedBy: mongoose.Types.ObjectId; // 更新者ID
  createdAt: Date;               // 登録日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.2.2 クライアントメモモデル (ClientNote)

クライアントに関するメモ情報を管理するモデルです。

```typescript
interface IClientNote {
  _id: mongoose.Types.ObjectId;  // メモID
  clientId: mongoose.Types.ObjectId; // クライアントID
  organizationId: mongoose.Types.ObjectId; // 組織ID
  authorId: mongoose.Types.ObjectId; // 作成者ID
  content: string;               // メモ内容
  noteType: 'general' | 'preference' | 'treatment' | 'follow_up'; // メモタイプ
  isPrivate: boolean;            // プライベートメモかどうか
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
  isRemoved: boolean;            // 削除フラグ
}
```

#### 2.2.3 予約モデル (Appointment)

クライアントの予約情報を管理するモデルです。

```typescript
interface IAppointment {
  _id: mongoose.Types.ObjectId;  // 予約ID
  organizationId: mongoose.Types.ObjectId; // 組織ID
  clientId: mongoose.Types.ObjectId; // クライアントID
  stylistId: mongoose.Types.ObjectId; // スタイリストID
  appointmentDate: Date;         // 予約日
  startTime: string;             // 開始時間 (例: "10:30")
  endTime: string;               // 終了時間
  duration: number;              // 所要時間（分）
  services: string[];            // サービス内容 (例: ["カット", "カラー"])
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show'; // 予約ステータス
  notes: string;                 // 予約メモ
  source: string;                // 予約元 (例: "手動", "ホットペッパー", "Google")
  timeSlot: 'morning' | 'afternoon' | 'evening'; // 時間帯区分
  externalIds: {                 // 外部連携情報
    calendarEventId?: string;    // カレンダーイベントID
    hotpepperBookingId?: string; // ホットペッパー予約ID
    otherSystemId?: string;      // その他システムID
  };
  lastSyncTime?: Date;           // 最終同期時刻
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.2.4 クライアント-スタイリスト相性モデル (ClientStylistCompatibility)

クライアントとスタイリスト間の相性情報を管理するモデルです。

```typescript
interface IClientStylistCompatibility {
  _id: mongoose.Types.ObjectId;  // 相性ID
  clientId: mongoose.Types.ObjectId; // クライアントID
  stylistId: mongoose.Types.ObjectId; // スタイリストID
  organizationId: mongoose.Types.ObjectId; // 組織ID
  overallScore: number;          // 総合相性スコア（0-100）
  elementRelation: 'producing' | 'controlling' | 'neutral'; // 五行関係
  details: {                     // 相性の詳細
    wood: { score: number; factor: string; },
    fire: { score: number; factor: string; },
    earth: { score: number; factor: string; },
    metal: { score: number; factor: string; },
    water: { score: number; factor: string; }
  };
  calculatedAt: Date;            // 計算日時
  calculationVersion: string;    // 計算アルゴリズムバージョン
}
```

### 2.3 四柱推命・運勢関連モデル

#### 2.3.1 日柱モデル (DayPillar)

日柱情報を管理するモデルです。

```typescript
interface IDayPillar {
  _id: mongoose.Types.ObjectId;  // ID
  date: Date;                    // 日付
  heavenlyStem: string;          // 天干
  earthlyBranch: string;         // 地支
  hiddenStems: string[];         // 蔵干
  element: string;               // 五行属性
  energyDescription: string;     // エネルギー説明
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.3.2 運勢モデル (DailyFortune)

ユーザーの日々の運勢を管理するモデルです。

```typescript
interface IDailyFortune {
  _id: mongoose.Types.ObjectId;  // 運勢ID
  userId: mongoose.Types.ObjectId; // ユーザーID
  date: Date;                    // 対象日
  dayPillarId: mongoose.Types.ObjectId; // 日柱ID
  dayPillar: {                   // 日柱情報
    heavenlyStem: string;
    earthlyBranch: string;
    hiddenStems?: string[];
  };
  score: number;                 // 運勢スコア（0-100）
  advice: string;                // マークダウン形式のアドバイス
  luckyItems: {                  // ラッキーアイテム
    color: string;
    item: string;
    drink: string;
  };
  calculationDetails?: {         // 計算詳細（内部用）
    stemElement: string;
    branchElement: string;
    balanceStatus?: {
      wood: string;
      fire: string;
      earth: string;
      metal: string;
      water: string;
    };
    yojinRelation?: string;
    fortuneType?: string;
  };
  useBalancedAlgorithm: boolean; // バランスアルゴリズム使用フラグ
  useEnhancedAlgorithm: boolean; // 拡張アルゴリズム使用フラグ
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.3.3 チームコンテキスト運勢モデル (TeamContextFortune)

チーム特化の運勢情報を管理するモデルです。

```typescript
interface ITeamContextFortune {
  _id: mongoose.Types.ObjectId;  // ID
  userId: mongoose.Types.ObjectId; // ユーザーID
  teamId: mongoose.Types.ObjectId; // チームID
  date: Date;                    // 対象日
  dayPillarId: mongoose.Types.ObjectId; // 日柱ID
  teamGoalId?: mongoose.Types.ObjectId; // チーム目標ID（オプション）
  score: number;                 // 運勢スコア（0-100）
  teamContextAdvice: string;     // チーム特化アドバイス
  collaborationTips: string[];   // チーム協力のためのヒント
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.3.4 運勢更新ログモデル (DailyFortuneUpdateLog)

運勢の一括更新処理のログを管理するモデルです。

```typescript
interface IDailyFortuneUpdateLog {
  _id: mongoose.Types.ObjectId;  // ログID
  startTime: Date;               // 開始時間
  endTime: Date;                 // 終了時間
  status: 'success' | 'partial' | 'failed'; // 処理状態
  totalUsers: number;            // 総ユーザー数
  processedUsers: number;        // 処理済みユーザー数
  successCount: number;          // 成功件数
  failCount: number;             // 失敗件数
  errors: {                      // エラー情報
    userId: mongoose.Types.ObjectId;
    error: string;
  }[];
  executedBy?: mongoose.Types.ObjectId; // 実行者ID（手動実行時）
  isManualRun: boolean;          // 手動実行かどうか
  version: string;               // 実行バージョン
}
```

### 2.4 チーム関連モデル

#### 2.4.1 チームモデル (Team)

チーム情報を管理するモデルです。

```typescript
interface ITeam {
  _id: mongoose.Types.ObjectId;  // チームID
  name: string;                  // チーム名
  description?: string;          // 説明
  iconInitial?: string;          // アイコン初期文字
  iconColor?: 'primary' | 'water' | 'wood' | 'fire' | 'earth' | 'metal'; // アイコン色
  organizationId: mongoose.Types.ObjectId; // 組織ID
  createdBy: mongoose.Types.ObjectId; // 作成者ID
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.4.2 チームメンバーシップモデル (TeamMembership)

チームメンバーシップ情報を管理するモデルです。

```typescript
interface ITeamMembership {
  _id: mongoose.Types.ObjectId;  // ID
  userId: mongoose.Types.ObjectId; // ユーザーID
  teamId: mongoose.Types.ObjectId; // チームID
  role: string;                  // 職務役割（例：エンジニア、マーケター）
  memberRole: 'creator' | 'admin' | 'member'; // メンバー権限ロール
  isAdmin: boolean;              // 管理者フラグ（後方互換性用）
  joinedAt: Date;                // 参加日時
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.4.3 チーム目標モデル (TeamGoal)

チーム目標情報を管理するモデルです。

```typescript
interface ITeamGoal {
  _id: mongoose.Types.ObjectId;  // 目標ID
  teamId: mongoose.Types.ObjectId; // チームID
  content: string;               // 目標内容
  deadline?: Date;               // 期限
  progressRate: number;          // 進捗率（0-100）
  createdBy: mongoose.Types.ObjectId; // 作成者ID
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.4.4 チームメンバーカードモデル (TeamMemberCard)

チームメンバーカード情報を管理するモデルです。

```typescript
interface ITeamMemberCard {
  _id: mongoose.Types.ObjectId;  // カードID
  teamId: mongoose.Types.ObjectId; // チームID
  userId: mongoose.Types.ObjectId; // ユーザーID
  membershipId: mongoose.Types.ObjectId; // メンバーシップID
  position?: string;             // 配置位置
  customNotes?: string;          // カスタムメモ
  visibilitySettings?: {         // 表示設定
    showPersonalityInfo: boolean; // 性格情報を表示
    showLuckyItems: boolean;     // ラッキーアイテムを表示
    showCompatibility: boolean;  // 相性情報を表示
  };
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

### 2.5 友達関連モデル

#### 2.5.1 友達関係モデル (Friendship)

ユーザー間の友達関係を管理するモデルです。

```typescript
interface IFriendship {
  _id: mongoose.Types.ObjectId;  // 友達関係ID
  userId1: mongoose.Types.ObjectId; // ユーザー1 ID
  userId2: mongoose.Types.ObjectId; // ユーザー2 ID
  requesterId: mongoose.Types.ObjectId; // リクエスト送信者ID
  status: 'pending' | 'accepted' | 'rejected'; // ステータス
  compatibilityScore?: number;   // 相性スコア
  acceptedAt?: Date;             // 承認日時
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.5.2 相性モデル (Compatibility)

ユーザー間の相性情報を管理するモデルです。

```typescript
interface ICompatibility {
  _id: mongoose.Types.ObjectId;  // 相性ID
  userId1: mongoose.Types.ObjectId; // ユーザー1 ID
  userId2: mongoose.Types.ObjectId; // ユーザー2 ID
  score: number;                 // 相性スコア（0-100）
  relationType: 'producing' | 'controlling' | 'neutral'; // 関係タイプ
  element1: string;              // ユーザー1の属性
  element2: string;              // ユーザー2の属性
  description: string;           // 相性の説明
  details?: {                    // 詳細情報
    elementMatch: number;        // 五行属性マッチ度
    kakukyokuMatch?: number;     // 格局マッチ度
    yojinMatch?: number;         // 用神マッチ度
  };
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.5.3 招待リンクモデル (InvitationLink)

システムへの招待リンク情報を管理するモデルです。

```typescript
interface IInvitationLink {
  _id: mongoose.Types.ObjectId;  // 招待ID
  code: string;                  // 招待コード
  teamId?: mongoose.Types.ObjectId; // チームID（チーム招待の場合）
  inviterId: mongoose.Types.ObjectId; // 招待者ID
  email: string;                 // 招待先メールアドレス
  type: 'team' | 'friend';       // 招待タイプ
  role?: string;                 // 役割（チーム招待時）
  status: 'pending' | 'accepted' | 'expired'; // ステータス
  expiresAt: Date;               // 有効期限
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

### 2.6 チャット関連モデル

#### 2.6.1 一般チャット履歴モデル (ChatHistory)

ユーザーのチャット履歴を管理するモデルです。

```typescript
interface IChatHistory {
  _id: mongoose.Types.ObjectId;  // チャットID
  userId: mongoose.Types.ObjectId; // ユーザーID
  messages: {                    // メッセージ配列
    role: 'user' | 'assistant';  // 役割
    content: string;             // 内容
    timestamp: Date;             // タイムスタンプ
    contextItems?: {             // コンテキスト情報
      type: string;              // コンテキストタイプ
      refId?: string;            // 参照ID
      data?: any;                // 追加データ
    }[];
  }[];
  lastMessageAt: Date;           // 最終メッセージ日時
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.6.2 クライアントチャットモデル (BeautyClientChat)

美容クライアント専用のチャット情報を管理するモデルです。

```typescript
interface IBeautyClientChat {
  _id: mongoose.Types.ObjectId;  // チャットID
  organizationId: mongoose.Types.ObjectId; // サロン組織ID
  clientId: mongoose.Types.ObjectId; // クライアントID
  lastMessageAt: Date;           // 最終メッセージ日時
  tokenCount: number;            // 累積トークン使用量
  aiModel: string;               // 使用AIモデル（例: 'gpt-4o'）
  contextData: {                 // コンテキストデータ
    sajuProfile?: {              // 四柱推命プロフィール
      fourPillars: {
        yearPillar: { stem: string; branch: string; hiddenStems?: string[] };
        monthPillar: { stem: string; branch: string; hiddenStems?: string[] };
        dayPillar: { stem: string; branch: string; hiddenStems?: string[] };
        hourPillar: { stem: string; branch: string; hiddenStems?: string[] };
      };
      kakukyoku?: {
        type: string;
        category: string;
        strength: string;
        description: string;
      };
      yojin?: {
        tenGod: string;
        element: string;
        description: string;
        supportElements: string[];
      };
      elementProfile: {
        wood: number;
        fire: number;
        earth: number;
        metal: number;
        water: number;
        mainElement: string;
        secondaryElement?: string;
      };
    };
    clientProfile?: {            // クライアントプロフィール
      name: string;
      gender: 'M' | 'F';
      birthdate: string;
      birthtime?: string;
      preferences?: string[];
      hairType?: string;
      skinTone?: string;
    };
    visitHistory?: Array<{      // 施術履歴
      date: string;
      serviceType: string;
      stylistId: string;
      stylistName: string;
      notes?: string;
    }>;
    additionalNotes?: string[];  // 追加メモ
  };
  messages: {                    // チャットメッセージ配列
    sender: 'stylist' | 'assistant'; // 送信者タイプ
    senderId?: mongoose.Types.ObjectId; // 送信者ID（stylistの場合）
    content: string;             // メッセージ内容
    timestamp: Date;             // タイムスタンプ
    tokenUsage?: {               // トークン使用量
      prompt: number;            // プロンプトトークン
      completion: number;        // レスポンストークン
      total: number;             // 合計トークン
    };
    additionalContext?: {        // 追加コンテキスト
      visitPurpose?: string;     // 来店目的
      clientConcerns?: string[]; // クライアントの悩み
      seasonalEvent?: string;    // 季節イベント
      hairCondition?: string;    // 髪の状態
      dayPillar?: {              // 当日の日柱情報
        heavenlyStem: string;
        earthlyBranch: string;
        hiddenStems: string[];
        energyDescription: string;
      };
    };
  }[];
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

### 2.7 サポート関連モデル

#### 2.7.1 サポートチケットモデル (SupportTicket)

サポートチケット情報を管理するモデルです。

```typescript
interface ISupportTicket {
  _id: mongoose.Types.ObjectId;  // チケットID
  ticketNumber: string;          // 表示用チケット番号（TK-XXXX形式）
  organizationId: mongoose.Types.ObjectId; // 組織ID
  creatorId: mongoose.Types.ObjectId; // 作成者ID
  title: string;                 // タイトル
  status: 'pending' | 'answered'; // ステータス
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.7.2 チケットメッセージモデル (TicketMessage)

サポートチケットのメッセージを管理するモデルです。

```typescript
interface ITicketMessage {
  _id: mongoose.Types.ObjectId;  // メッセージID
  ticketId: mongoose.Types.ObjectId; // チケットID
  senderId: mongoose.Types.ObjectId | 'superadmin'; // 送信者ID
  senderType: 'salon' | 'superadmin'; // 送信者タイプ
  content: string;               // メッセージ内容
  createdAt: Date;               // 作成日時
  isRead: boolean;               // 既読フラグ
}
```

### 2.8 統計・監査関連モデル

#### 2.8.1 トークン使用統計モデル (UsageStatistics)

APIトークン使用状況を管理するモデルです。

```typescript
interface IUsageStatistics {
  _id: mongoose.Types.ObjectId;  // 統計ID
  organizationId: mongoose.Types.ObjectId; // 組織ID
  userId?: mongoose.Types.ObjectId; // ユーザーID（null=組織全体）
  period: string;                // 期間（YYYY-MM形式）
  date: Date;                    // 日付
  totalTokens: number;           // 合計トークン数
  promptTokens: number;          // プロンプトトークン数
  completionTokens: number;      // 完了トークン数
  endpoint: string;              // エンドポイント（'chat', 'image'など）
  model: string;                 // モデル名（'gpt-4o'など）
  cost: number;                  // 推定コスト
  createdAt: Date;               // 作成日時
}
```

#### 2.8.2 監査ログモデル (AuditLog)

システム操作の監査ログを管理するモデルです。

```typescript
interface IAuditLog {
  _id: mongoose.Types.ObjectId;  // ログID
  userId: mongoose.Types.ObjectId; // 実行者ID
  action: string;                // アクション種別
  resource: string;              // 対象リソース種別
  resourceId?: mongoose.Types.ObjectId; // 対象リソースID
  organizationId?: mongoose.Types.ObjectId; // 組織ID
  details: any;                  // 詳細情報
  ipAddress?: string;            // IPアドレス
  userAgent?: string;            // ユーザーエージェント
  timestamp: Date;               // タイムスタンプ
}
```

## 3. エンティティ間の関係

```
┌────────────┐      ┌────────────┐      ┌────────────┐
│Organization│◄─────┤PricePlan   │      │Subscription│
└─────┬──────┘      └────────────┘      └────┬───────┘
      │                                       │
      │                                       │
      │                                       │
      │                                       │
      ▼                                       │
┌────────────┐      ┌────────────┐      ┌─────▼──────┐
│User        │◄─────┤TeamMember  │◄─────┤Invoice     │
└─────┬──────┘      └─────┬──────┘      └────────────┘
      │                   │
      │                   │
      │                   │
┌─────▼──────┐      ┌─────▼──────┐      ┌────────────┐
│DailyFortune│      │Team        │◄─────┤TeamGoal    │
└────────────┘      └─────┬──────┘      └────────────┘
                          │
                          │
┌────────────┐      ┌─────▼──────┐      ┌────────────┐
│Friendship  │      │TeamContext │      │TokenCharge │
└─────┬──────┘      │Fortune     │      └────────────┘
      │             └────────────┘
      │
┌─────▼──────┐      ┌────────────┐      ┌────────────┐
│Compatibility│      │ChatHistory │      │DayPillar   │
└────────────┘      └────────────┘      └────────────┘

┌────────────┐      ┌────────────┐      ┌────────────┐
│Client      │◄─────┤Appointment │      │ClientNote  │
└─────┬──────┘      └────────────┘      └────────────┘
      │
      │
┌─────▼──────┐      ┌────────────┐      ┌────────────┐
│BeautyClient│      │ClientStylist│      │UsageStats  │
│Chat        │      │Compatibility│      │            │
└────────────┘      └────────────┘      └────────────┘

┌────────────┐      ┌────────────┐
│SupportTicket│◄─────┤TicketMessage│
└────────────┘      └────────────┘
```

## 4. データアクセスパターン

### 4.1 階層化ロールモデルのデータアクセス

1. **SuperAdmin**: 
   - 全組織データにアクセス可能
   - 組織の作成・管理・停止
   - プランの管理

2. **Owner**:
   - 自組織内のデータにアクセス可能
   - Admin権限の付与・管理
   - 請求情報の管理

3. **Admin**:
   - 自組織内のデータにアクセス可能（一部制限あり）
   - スタイリストの追加・管理
   - クライアントデータの管理

4. **User**（スタイリスト）:
   - 自分のデータと担当クライアントのデータにアクセス可能
   - クライアントとのチャット
   - 四柱推命に基づく提案

### 4.2 クライアント管理のデータアクセス

1. **クライアント一覧取得**:
   - 組織IDに基づくフィルタリング
   - 検索・ソート条件に基づく絞り込み
   - ページネーション

2. **クライアント詳細取得**:
   - 基本情報、四柱推命情報の取得
   - メモ履歴の取得
   - 来店履歴の取得
   - スタイリストとの相性情報取得

3. **クライアントチャット**:
   - クライアントIDに基づくチャット履歴の取得
   - 四柱推命情報や来店履歴をコンテキストに設定
   - 日柱情報に基づく動的なコンテキスト更新

## 5. データ整合性と制約

1. **ユーザーの組織所属**:
   - SuperAdmin以外のユーザーは必ず1つの組織に所属する
   - Owner、Admin、Userは自分の所属組織のデータにのみアクセス可能

2. **クライアントの組織帰属**:
   - クライアントは必ず1つの組織（サロン）に帰属する
   - クライアントデータは組織内でのみ共有される

3. **チームメンバーシップ**:
   - チームの作成者は自動的にcreatorロールとなる
   - 各チームにはcreatorロールが必ず1人存在する

4. **サブスクリプションと制限**:
   - 組織のプランに基づいて、最大ユーザー数やクライアント数が制限される
   - トークン使用量もプランに基づいて制限される

5. **クライアントデータの保護**:
   - プライベートメモは作成者のみが閲覧可能
   - クライアント情報は組織内でのみ共有される

6. **チャットコンテキストの一貫性**:
   - クライアントチャットのコンテキストデータは、クライアントの基本情報と四柱推命データが一致していること
   - 日付が変わると当日の日柱情報が自動的に更新される

## 6. インデックス設計

効率的なデータアクセスを実現するため、以下のインデックスを設定します：

### 6.1 ユーザー関連インデックス
```typescript
// User
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ organizationId: 1 });
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ isActive: 1 });

// Organization
organizationSchema.index({ name: 1 });
organizationSchema.index({ 'subscriptionPlan.isActive': 1 });
organizationSchema.index({ ownerId: 1 }, { unique: true });
```

### 6.2 クライアント関連インデックス
```typescript
// Client
clientSchema.index({ organizationId: 1 });
clientSchema.index({ organizationId: 1, name: 1 });
clientSchema.index({ organizationId: 1, phone: 1 });
clientSchema.index({ organizationId: 1, email: 1 });
clientSchema.index({ hasCompleteSajuProfile: 1 });
clientSchema.index({ lastVisitDate: -1 });

// ClientNote
clientNoteSchema.index({ clientId: 1, createdAt: -1 });
clientNoteSchema.index({ organizationId: 1, createdAt: -1 });

// Appointment
appointmentSchema.index({ organizationId: 1, appointmentDate: 1 });
appointmentSchema.index({ clientId: 1 });
appointmentSchema.index({ stylistId: 1 });
appointmentSchema.index({ status: 1 });
```

### 6.3 チャット関連インデックス
```typescript
// BeautyClientChat
beautyClientChatSchema.index({ organizationId: 1, clientId: 1 });
beautyClientChatSchema.index({ clientId: 1, lastMessageAt: -1 });
beautyClientChatSchema.index({ organizationId: 1, lastMessageAt: -1 });

// ChatHistory
chatHistorySchema.index({ userId: 1 });
chatHistorySchema.index({ userId: 1, lastMessageAt: -1 });
```

### 6.4 その他インデックス
```typescript
// SupportTicket
supportTicketSchema.index({ organizationId: 1, status: 1 });
supportTicketSchema.index({ createdAt: -1 });

// UsageStatistics
usageStatisticsSchema.index({ organizationId: 1, period: 1 });
usageStatisticsSchema.index({ organizationId: 1, userId: 1, period: 1 });
```

## 7. キャッシング戦略

高頻度でアクセスされるデータには、以下のキャッシング戦略を適用します：

1. **ユーザープロファイル**:
   - Redis TTLキャッシュ（5分）
   - キー：`user:${userId}`
   - 更新時にキャッシュを無効化

2. **組織情報**:
   - Redis TTLキャッシュ（15分）
   - キー：`organization:${organizationId}`
   - 更新時にキャッシュを無効化

3. **日柱データ**:
   - Redis TTLキャッシュ（24時間）
   - キー：`day_pillar:${date}`
   - 一日単位で自動更新

4. **クライアント一覧**:
   - Redis TTLキャッシュ（10分）
   - キー：`organization:${organizationId}:clients`
   - クライアント追加/更新/削除時にキャッシュを無効化

5. **運勢データ**:
   - Redis TTLキャッシュ（12時間）
   - キー：`fortune:${userId}:${date}`
   - 日次更新時に無効化

## 8. データマイグレーション戦略

既存データから新しいデータモデルへの移行のためのマイグレーション戦略：

1. **ロール階層化マイグレーション**:
   - 既存のAdminユーザーをOwnerロールに変更
   - 組織レコードを作成し、Ownerとのリレーションシップを確立
   - 関連するUserレコードのorganizationIdを設定

2. **クライアントデータ導入**:
   - 新しいClientコレクションの作成
   - 外部ソース（CSVやAPI）からのデータインポート
   - 四柱推命計算機能によるプロファイル拡充

3. **チャットデータマイグレーション**:
   - 既存のChatHistoryからBeautyClientChatへの移行
   - クライアントコンテキスト情報の追加
   - メッセージフォーマットの標準化

## 9. 統合データモデルの実装例

最後に、フロントエンドで使用する統合型定義の実装例を示します。これは`shared/index.ts`に追加して、クライアントとサーバー間で型の一貫性を確保します。

```typescript
// shared/integrated_types.ts

// 組織モデル
export interface IOrganization {
  id: string;
  name: string;
  ownerId: string;
  // 他のフィールド
}

// ユーザーモデル（4階層ロール対応）
export interface IUser {
  id: string;
  email: string;
  displayName: string;
  role: 'SuperAdmin' | 'Owner' | 'Admin' | 'User';
  organizationId?: string;
  // 他のフィールド
}

// クライアントモデル
export interface IClient {
  id: string;
  organizationId: string;
  name: string;
  // 他のフィールド
}

// クライアントチャットモデル
export interface IBeautyClientChat {
  id: string;
  organizationId: string;
  clientId: string;
  // 他のフィールド
}

// 以下、他のモデル定義
```

## 10. まとめ

この統合データモデル設計は、美姫命アプリケーションの全体的なデータ構造を一貫性を持って定義しています。階層化された4層のロールモデル、組織ベースのデータアクセス、クライアント管理機能、チャットシステムなど、主要な機能をサポートする包括的なデータモデルを提供します。

この設計に基づいて実装することで、システム全体の整合性が確保され、将来的な拡張にも柔軟に対応できるアーキテクチャを実現できます。