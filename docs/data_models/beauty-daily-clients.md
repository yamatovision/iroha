# 美姫命 - 本日の施術クライアント一覧 データモデル分析

## 1. 概要

「本日の施術クライアント一覧」機能は、スタイリストが当日担当する顧客の予約情報、四柱推命情報、およびコミュニケーションに役立つ情報を時間順に表示する画面です。このドキュメントでは、この機能の実装に必要なデータモデルを詳細に分析します。

## 2. エンティティの定義

### 2.1 主要エンティティ

#### 2.1.1 予約 (Appointment)
```typescript
interface Appointment {
  id: string;                   // 予約ID
  clientId: string;             // クライアントID
  stylistId: string;            // スタイリストID
  appointmentDate: Date;        // 予約日
  startTime: string;            // 開始時間 (例: "10:30")
  endTime: string;              // 終了時間
  duration: number;             // 所要時間（分）
  services: string[];           // サービス内容 (例: ["カット", "カラー"])
  status: AppointmentStatus;    // 予約ステータス
  notes: string;                // 予約メモ
  source: string;               // 予約元 (例: "手動", "ホットペッパー", "Google")
  externalIds: {                // 外部連携情報
    calendarEventId?: string;   // カレンダーイベントID
    hotpepperBookingId?: string; // ホットペッパー予約ID
    otherSystemId?: string;     // その他システムID
  };
  lastSyncTime?: Date;          // 最終同期時刻
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
}

enum AppointmentStatus {
  CONFIRMED = "confirmed",      // 確定
  PENDING = "pending",          // 保留中
  CANCELLED = "cancelled",      // キャンセル済み
  COMPLETED = "completed",      // 完了
  NO_SHOW = "no_show"           // 無断キャンセル
}
```

#### 2.1.2 クライアント (Client)
```typescript
interface Client {
  id: string;                   // クライアントID
  name: string;                 // 氏名
  nameKana?: string;            // 氏名（かな）
  gender?: Gender;              // 性別
  birthDate?: Date;             // 生年月日
  birthTime?: string;           // 生まれた時間 (例: "15:30")
  registrationStatus: RegistrationStatus; // 登録状態
  contact: {                    // 連絡先情報
    phoneNumber?: string;       // 電話番号
    email?: string;             // メールアドレス
  };
  address?: {                   // 住所
    postalCode?: string;        // 郵便番号
    prefecture?: string;        // 都道府県
    city?: string;              // 市区町村
    street?: string;            // 番地
    building?: string;          // 建物名・部屋番号
  };
  profileImage?: string;        // プロフィール画像URL
  tags?: string[];              // タグ（例: "常連", "ショートヘア"）
  firstVisitDate?: Date;        // 初回来店日
  sajuProfile?: SajuProfile;    // 四柱推命プロフィール
  preferredStyleId?: string[];  // 好みのヘアスタイルID
  hairCondition?: string;       // 髪の状態
  notes?: string;               // 特記事項
  externalIds?: {               // 外部システムID
    hotpepperId?: string;       // ホットペッパーID
    salonAnswerId?: string;     // サロンアンサーID
    otherSystemId?: string;     // その他システムID
  };
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
}

enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
  UNKNOWN = "unknown"
}

enum RegistrationStatus {
  FULLY_REGISTERED = "fully_registered",   // 完全登録済み
  PARTIAL = "partial",                     // 部分的に登録 
  UNREGISTERED = "unregistered"            // 未登録
}
```

#### 2.1.3 四柱推命プロフィール (SajuProfile)
```typescript
interface SajuProfile {
  id: string;                   // 四柱推命プロフィールID
  clientId: string;             // クライアントID
  yearPillar: PillarInfo;       // 年柱
  monthPillar: PillarInfo;      // 月柱
  dayPillar: PillarInfo;        // 日柱
  timePillar: PillarInfo;       // 時柱
  fiveElementsBalance: {        // 五行バランス
    wood: ElementStrength;      // 木の強さ
    fire: ElementStrength;      // 火の強さ
    earth: ElementStrength;     // 土の強さ
    metal: ElementStrength;     // 金の強さ
    water: ElementStrength;     // 水の強さ
  };
  personalityTraits: string[];  // 性格特性
  suitableHairStyles: string[]; // 相性の良いヘアスタイル
  suitableColors: string[];     // 相性の良い色
  calculatedAt: Date;           // 計算日時
}

interface PillarInfo {
  heavenlyStem: string;         // 天干
  earthlyBranch: string;        // 地支
  element: FiveElement;         // 五行属性
}

enum FiveElement {
  WOOD = "wood",                // 木
  FIRE = "fire",                // 火
  EARTH = "earth",              // 土
  METAL = "metal",              // 金
  WATER = "water"               // 水
}

enum ElementStrength {
  VERY_STRONG = "very_strong",  // 非常に強い
  STRONG = "strong",            // 強い
  NORMAL = "normal",            // 普通
  WEAK = "weak",                // 弱い
  VERY_WEAK = "very_weak"       // 非常に弱い
}
```

#### 2.1.4 スタイリスト (Stylist)
```typescript
interface Stylist {
  id: string;                   // スタイリストID
  userId: string;               // ユーザーID（認証用）
  name: string;                 // 氏名
  nameKana?: string;            // 氏名（かな）
  role: StylistRole;            // 役割
  birthDate?: Date;             // 生年月日
  birthTime?: string;           // 生まれた時間
  profileImage?: string;        // プロフィール画像URL
  biography?: string;           // 経歴
  specialties?: string[];       // 得意分野
  sajuProfile?: SajuProfile;    // 四柱推命プロフィール
  organizationId: string;       // 組織ID（サロン）
  isActive: boolean;            // アクティブ状態
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
}

enum StylistRole {
  OWNER = "owner",              // オーナー
  ADMIN = "admin",              // 管理者
  STYLIST = "stylist"           // スタイリスト
}
```

#### 2.1.5 相性データ (Compatibility)
```typescript
interface Compatibility {
  id: string;                   // 相性ID
  stylistId: string;            // スタイリストID
  clientId: string;             // クライアントID
  score: number;                // 相性スコア（0-100）
  reasons: string[];            // 相性の理由
  elements: {                   // 五行相性の詳細
    wood: CompatibilityDetail;  // 木の相性
    fire: CompatibilityDetail;  // 火の相性
    earth: CompatibilityDetail; // 土の相性
    metal: CompatibilityDetail; // 金の相性
    water: CompatibilityDetail; // 水の相性
  };
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
}

interface CompatibilityDetail {
  score: number;                // 個別スコア
  factor: string;               // 具体的な要因
}
```

#### 2.1.6 クライアントメモ (ClientMemo)
```typescript
interface ClientMemo {
  id: string;                   // メモID
  clientId: string;             // クライアントID
  stylistId: string;            // 作成したスタイリストID
  content: string;              // メモ内容
  visitDate: Date;              // 来店日
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
}
```

#### 2.1.7 日柱データ (DayPillar)
```typescript
interface DayPillar {
  date: Date;                   // 日付
  heavenlyStem: string;         // 天干
  earthlyBranch: string;        // 地支
  element: FiveElement;         // 五行属性
  description: string;          // 基本解説
  updatedAt: Date;              // 更新日時
}
```

#### 2.1.8 会話トピック (ConversationTopic)
```typescript
interface ConversationTopic {
  id: string;                   // トピックID
  clientId: string;             // クライアントID
  topic: string;                // 会話トピック
  relevance: string;            // 関連性（五行属性との関連など）
  source: string;               // 情報源（メモ、AI生成など）
  createdAt: Date;              // 作成日時
}
```

## 3. エンティティ間の関係

```
┌───────────────┐     1     ┌───────────────┐
│    Stylist    │◄─────────┤  Appointment   │
└───────┬───────┘           └───────┬───────┘
        │                           │
        │                           │ 
        │                           │ 1
        │ 1                         │
        ▼                           ▼
┌───────────────┐     1     ┌───────────────┐
│ SajuProfile   │◄─────────┤    Client      │
└───────────────┘           └───────┬───────┘
                                    │
                                    │
                                    │ 1
                               ┌────┴────────┐
                               │             │
                          ┌────▼────┐   ┌────▼────┐
                          │ClientMemo│   │DayPillar│
                          └─────────┘   └─────────┘
```

- **Appointment ↔ Stylist**: 各予約は一人のスタイリストに割り当てられる
- **Appointment ↔ Client**: 各予約は一人のクライアントに関連付けられる
- **Client ↔ SajuProfile**: 各クライアントは一つの四柱推命プロフィールを持つ
- **Stylist ↔ SajuProfile**: 各スタイリストも一つの四柱推命プロフィールを持つ
- **Stylist ↔ Client ↔ Compatibility**: スタイリストとクライアント間の相性情報
- **Client ↔ ClientMemo**: クライアントに対する複数のメモ
- **Client ↔ ConversationTopic**: クライアントに関連する会話トピック

## 4. 画面データフロー

### 4.1 本日の施術クライアント一覧画面

1. **データ取得フロー**:
   ```
   クライアント ──> API要求 ──> サーバー
                                │
                  ┌────────────┘
                  │
   ┌─────────┐    │    ┌─────────┐    ┌─────────┐
   │Appointment│◄──┘    │ Client  │    │SajuProfile│
   └─────┬────┘         └────┬────┘    └─────┬────┘
         │                   │               │
         └───────────┬───────┘               │
                     │                       │
                     └───────────────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ クライアント応答 │
                        └───────────────┘
   ```

2. **主要データポイント**:
   - 日付別の予約一覧（午前/午後/夜間でグループ化）
   - 各クライアントの基本情報（名前、画像、予約内容）
   - 各クライアントの四柱推命情報からの導出データ
   - 各クライアントとスタイリストの相性スコア
   - 会話トピック提案
   - 未登録クライアントの識別と登録支援

### 4.2 クライアント詳細モーダル

1. **データ取得フロー**:
   ```
   クライアント ──> 詳細要求 ──> サーバー
                                  │
           ┌─────────────────────┘
           │
   ┌───────▼───────┐    ┌─────────────┐    ┌─────────────┐
   │ClientDetail    │    │ClientMemo    │    │SajuProfile   │
   └───────┬───────┘    └──────┬──────┘    └──────┬──────┘
           │                    │                  │
           └────────────┬──────┘                  │
                        │                          │
                        └──────────────────┬──────┘
                                           │
                                   ┌───────▼───────┐
                                   │AIヘアスタイル提案│
                                   └───────────────┘
   ```

2. **主要データポイント**:
   - クライアント基本情報の詳細表示
   - 過去のクライアントメモ（時系列表示）
   - 四柱推命プロフィール詳細
   - AIによるヘアスタイル提案（四柱推命情報とメモに基づく）
   - 新規メモ追加機能

## 5. データの整合性と注意点

1. **登録状態の管理**:
   - 未登録クライアントの識別と登録ワークフロー
   - 部分的に登録されたクライアントの完全登録への誘導

2. **相性計算の一貫性**:
   - 四柱推命データに基づく相性計算のアルゴリズムの一貫性確保
   - 定期的な再計算メカニズム

3. **時系列データの正確性**:
   - メモの時系列管理と表示順序の一貫性
   - 予約時間に基づく正確なソート

4. **AI提案の依存性**:
   - AIヘアスタイル提案が四柱推命データとメモに強く依存
   - データ不足時の代替提案メカニズム

5. **外部データ連携**:
   - カレンダーから取得した予約との紐付け
   - 未登録クライアントの自動仮登録と情報補完

## 6. 実装の優先順位

1. 基本予約表示機能（時間順、グループ化）
2. クライアント基本情報表示
3. 登録状態の識別と表示
4. 四柱推命データと相性スコアの統合
5. クライアント詳細モーダル
6. 会話トピック提案機能
7. AIヘアスタイル提案機能
8. メモ機能

## 7. スケーラビリティと将来拡張

- **多サロン対応**:
  - 組織（サロン）単位でのデータ分離
  - 複数サロン間でのスタイリスト移動時のデータ継続性

- **オフライン対応**:
  - 重要データのローカルキャッシュ
  - オフライン時の基本機能維持

- **API使用量最適化**:
  - AIヘアスタイル提案のキャッシュ戦略
  - 必要に応じたデータ取得（遅延ロード）