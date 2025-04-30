# 美姫命アプリケーション データモデル設計提案書

## 1. 概要

本書は、既存の四柱推命アプリケーション（DailyFortuneNative3）を美容師・美容サロン向けに拡張する「美姫命」アプリケーションのデータモデル設計を提案するものです。現在のデータモデルを分析し、美容業界に特化した機能を追加するための最適なデータモデル拡張手法を提案します。

## 2. 現状分析

### 2.1 既存データモデルの構造

既存のDailyFortuneNative3アプリケーションは、以下の主要なデータモデルを持っています：

1. **User**: ユーザー情報、四柱推命プロファイル情報を管理
2. **DailyFortune**: 日々の運勢情報
3. **DayPillar**: 日柱（日ごとの干支）情報
4. **Team/TeamMembership**: チーム情報とメンバーシップ
5. **TeamContextFortune**: チームコンテキストの運勢情報
6. **Friendship/Compatibility**: 友達関係と相性情報
7. **ChatHistory**: AIとのチャット履歴

### 2.2 課題と拡張ポイント

美姫命アプリケーションでは、これらの既存モデルを活用しつつ、以下の拡張ポイントに対応する必要があります：

1. **美容師とクライアントの関係モデル**: 既存の「Team」「Friendship」とは異なる関係性
2. **予約・施術管理機能**: 予約、施術履歴、施術内容の管理
3. **カレンダー連携**: 外部予約システムとの連携
4. **クライアント四柱推命情報**: 顧客の四柱推命情報管理と相性診断
5. **美容特化コンテンツ**: ヘアスタイル提案、カラー提案などの美容特化情報

## 3. データモデル拡張提案

既存のデータモデルを最大限活用しながら、美姫命アプリケーションに必要な機能を実現するためのデータモデル拡張を提案します。

### 3.1 基本的なアプローチ

1. **既存モデルの再利用**: User、DailyFortune、DayPillar等の基本モデルは共通利用
2. **拡張モデルの追加**: 美容業界特有の機能に対応する新規モデルを追加
3. **関連性の確立**: 既存モデルと新規モデルの関連付け

### 3.2 主要データモデル設計

#### 3.2.1 Salon（サロン）

```typescript
interface Salon {
  _id: ObjectId;               // サロンID
  name: string;                // サロン名
  address: string;             // 所在地
  contactInfo: {               // 連絡先情報
    phone: string;
    email: string;
    website?: string;
  };
  businessHours: {             // 営業時間
    dayOfWeek: number;         // 0-6 (日-土)
    openTime: string;          // "HH:MM" 形式
    closeTime: string;         // "HH:MM" 形式
    isHoliday: boolean;        // 休業日フラグ
  }[];
  adminUserId: ObjectId;       // 管理者ユーザーID（関連：User）
  settings: {                  // サロン設定
    defaultSessionLength: number;  // デフォルト施術時間（分）
    calendarSyncInterval: number;  // カレンダー同期間隔（分）
    calendarSyncEnabled: boolean;  // カレンダー同期有効フラグ
  };
  createdAt: Date;             // 作成日時
  updatedAt: Date;             // 更新日時
}
```

#### 3.2.2 StylistProfile（スタイリストプロファイル）

```typescript
interface StylistProfile {
  _id: ObjectId;               // スタイリストプロファイルID
  userId: ObjectId;            // 関連ユーザーID（関連：User）
  salonId: ObjectId;           // 所属サロンID（関連：Salon）
  position: string;            // 役職（例：シニアスタイリスト）
  specialties: string[];       // 得意分野
  experience: number;          // 経験年数
  biography: string;           // 経歴・自己紹介
  schedule: {                  // 勤務スケジュール
    dayOfWeek: number;         // 0-6 (日-土)
    startTime: string;         // "HH:MM" 形式
    endTime: string;           // "HH:MM" 形式
    isOffDay: boolean;         // 休日フラグ
  }[];
  isAdmin: boolean;            // サロン管理者権限フラグ
  createdAt: Date;             // 作成日時
  updatedAt: Date;             // 更新日時
}
```

#### 3.2.3 Client（クライアント）

```typescript
interface Client {
  _id: ObjectId;               // クライアントID
  salonId: ObjectId;           // 所属サロンID（関連：Salon）
  firstName: string;           // 名
  lastName: string;            // 姓
  gender: string;              // 性別
  contactInfo: {               // 連絡先情報
    phone: string;
    email: string;
  };
  birthInfo?: {                // 生年月日情報（四柱推命情報計算用）
    birthDate: Date;           // 生年月日
    birthTime?: string;        // 生まれた時間（"HH:MM" 形式）
    birthPlace?: string;       // 出生地
    timeZone?: string;         // タイムゾーン
  };
  sajuProfile?: {              // 四柱推命プロファイル（計算済みの場合）
    fourPillars: any;          // 四柱情報（年柱、月柱、日柱、時柱）
    elementAttributes: any;    // 五行属性（水、木、火、土、金）
    kakukyoku?: any;           // 格局情報
    yojin?: any;               // 用神情報
  };
  preferences: {               // クライアント好み
    hairStyles: string[];      // 好みのヘアスタイル
    colors: string[];          // 好みのカラー
    sensitivities: string[];   // 肌・髪の特徴、敏感さなど
  };
  externalIds?: {              // 外部システム連携用ID
    hotPepperId?: string;      // ホットペッパービューティーID
    salonAnswerId?: string;    // サロンアンサーID
    otherSystemId?: string;    // その他のシステムID
  };
  tags: string[];              // タグ（分類用）
  memo: string;                // 一般メモ
  createdAt: Date;             // 作成日時
  updatedAt: Date;             // 更新日時
  lastVisitDate?: Date;        // 最終来店日
}
```

#### 3.2.4 ClientSession（施術セッション）

```typescript
interface ClientSession {
  _id: ObjectId;               // セッションID
  clientId: ObjectId;          // クライアントID（関連：Client）
  stylistId: ObjectId;         // 担当スタイリストID（関連：User）
  salonId: ObjectId;           // サロンID（関連：Salon）
  appointmentInfo: {           // 予約情報
    dateTime: Date;            // 予約日時
    duration: number;          // 所要時間（分）
    status: string;            // 状態（予約済、完了、キャンセル等）
    source: string;            // 予約ソース（アプリ内、外部連携等）
  };
  services: {                  // 提供サービス
    name: string;              // サービス名（カット、カラー等）
    description?: string;      // 詳細
    duration?: number;         // 所要時間（分）
  }[];
  notes: {                     // セッションメモ（複数時系列）
    authorId: ObjectId;        // 記入者ID
    content: string;           // メモ内容
    createdAt: Date;           // 記入日時
  }[];
  beforeAfterImages?: {        // ビフォー/アフター画像
    before: string;            // 施術前画像URL
    after: string;             // 施術後画像URL
    createdAt: Date;           // 登録日時
  }[];
  products: {                  // 使用製品
    name: string;              // 製品名
    quantity?: number;         // 使用量
  }[];
  compatibilityScore?: number; // 四柱推命ベースの相性スコア
  dayPillarId?: ObjectId;      // 該当日の日柱ID
  createdAt: Date;             // 作成日時
  updatedAt: Date;             // 更新日時
}
```

#### 3.2.5 Appointment（予約）

```typescript
interface Appointment {
  _id: ObjectId;               // 予約ID
  salonId: ObjectId;           // サロンID（関連：Salon）
  clientId?: ObjectId;         // クライアントID（関連：Client）
  stylistId?: ObjectId;        // 担当スタイリストID（関連：User）
  dateTime: Date;              // 予約日時
  endTime: Date;               // 終了予定時間
  services: {                  // 予約サービス
    name: string;              // サービス名
    duration: number;          // 所要時間（分）
  }[];
  status: string;              // 状態（予約済、確定、キャンセル等）
  notes?: string;              // メモ
  compatibility?: {            // 顧客とスタイリストの相性情報
    score: number;             // 相性スコア
    elementRelationship: string; // 五行関係（相生・相剋）
  };
  externalInfo?: {             // 外部連携情報
    source: string;            // 予約ソース（ホットペッパー、Google等）
    externalId: string;        // 外部システム予約ID
    calendarEventId?: string;  // カレンダーイベントID
    lastSynced: Date;          // 最終同期日時
  };
  createdAt: Date;             // 作成日時
  updatedAt: Date;             // 更新日時
}
```

#### 3.2.6 BeautyStyleSuggestion（ヘアスタイル提案）

```typescript
interface BeautyStyleSuggestion {
  _id: ObjectId;               // 提案ID
  clientId: ObjectId;          // クライアントID（関連：Client）
  stylistId: ObjectId;         // スタイリストID（関連：User）
  salonId: ObjectId;           // サロンID（関連：Salon）
  sessionId?: ObjectId;        // 関連セッションID（関連：ClientSession）
  suggestionDate: Date;        // 提案日
  dayPillarId: ObjectId;       // 該当日の日柱ID
  styleType: string;           // スタイルタイプ（カット、カラー、パーマ等）
  suggestionContent: {         // 提案内容
    hairStyle?: {              // ヘアスタイル提案
      description: string;     // スタイル説明
      length: string;          // 長さ
      layering: string;        // レイヤー
      bangsStyle?: string;     // 前髪スタイル
    };
    colorSuggestion?: {        // カラー提案
      baseColor: string;       // ベースカラー
      highlights?: string;     // ハイライト
      technique: string;       // 技法
      colorTheory: string;     // 色理論（五行に基づく）
    };
    careRoutine?: {            // ケア方法提案
      dailyCare: string;       // 日々のケア
      products: string[];      // おすすめ製品
      specialTreatments?: string; // 特別トリートメント
    };
  };
  sajuBasedReasoning: string;  // 四柱推命に基づく提案理由
  clientFeedback?: {           // クライアントフィードバック
    rating?: number;           // 評価（1-5等）
    comments?: string;         // コメント
    recordedDate?: Date;       // 記録日
  };
  images?: string[];           // 関連画像URL（スタイル参考画像等）
  createdAt: Date;             // 作成日時
  updatedAt: Date;             // 更新日時
}
```

#### 3.2.7 CalendarSync（カレンダー同期）

```typescript
interface CalendarSync {
  _id: ObjectId;               // 同期ID
  salonId: ObjectId;           // サロンID（関連：Salon）
  calendarType: string;        // カレンダータイプ（Google、iCloud等）
  calendarId: string;          // 外部カレンダーID
  authInfo: {                  // 認証情報
    accessToken?: string;      // アクセストークン
    refreshToken?: string;     // リフレッシュトークン
    expiresAt: Date;           // トークン期限
  };
  syncSettings: {              // 同期設定
    syncInterval: number;      // 同期間隔（分）
    lastSyncTime: Date;        // 最終同期日時
    autoMatchClients: boolean; // クライアント自動マッチング有効
    autoAssignStylists: boolean; // スタイリスト自動割り当て有効
  };
  mappingRules: {              // マッピングルール
    titlePattern?: string;     // タイトルパターン
    descriptionPattern?: string; // 説明パターン
    clientIdentifiers: string[]; // クライアント識別子（名前、電話等）
  };
  syncStatus: {                // 同期状態
    status: string;            // 状態（正常、エラー等）
    lastError?: string;        // 最後のエラー
    lastRunStats: {            // 最終実行統計
      appointmentsCreated: number; // 作成予約数
      appointmentsUpdated: number; // 更新予約数
      errorsCount: number;     // エラー数
    };
  };
  createdAt: Date;             // 作成日時
  updatedAt: Date;             // 更新日時
}
```

#### 3.2.8 BeautyChat（美容チャット）

```typescript
interface BeautyChat {
  _id: ObjectId;               // チャットID
  salonId: ObjectId;           // サロンID
  clientId: ObjectId;          // クライアントID（関連：Client）
  contextType: string;         // コンテキストタイプ（クライアント専用、一般相談等）
  messages: {                  // メッセージリスト
    senderId: ObjectId;        // 送信者ID（スタイリストまたはシステム）
    content: string;           // メッセージ内容
    timestamp: Date;           // タイムスタンプ
    type: string;              // メッセージタイプ（テキスト、提案、画像等）
    attachments?: string[];    // 添付ファイル（画像URL等）
  }[];
  contextData: {               // コンテキストデータ
    clientSajuProfile?: any;   // クライアント四柱推命プロファイル
    dayPillarInfo?: any;       // 当日の日柱情報
    appointmentId?: ObjectId;  // 関連予約ID
    sessionId?: ObjectId;      // 関連セッションID
    serviceType?: string[];    // サービスタイプ（カット、カラー等）
    clientNotes?: string;      // クライアントメモ（要約）
  };
  aiSettings: {                // AI設定
    model: string;             // 使用AIモデル
    temperature?: number;      // 温度（創造性パラメータ）
    specialPrompt?: string;    // 特別プロンプト
  };
  archivedAt?: Date;           // アーカイブ日時
  createdAt: Date;             // 作成日時
  updatedAt: Date;             // 更新日時
}
```

### 3.3 データモデル間の関連性

各データモデル間の関連性を図式化します：

```
User <--- StylistProfile <--- ClientSession ---> Client
 |                                |                |
 v                                v                v
DailyFortune                 Appointment     BeautyStyleSuggestion
 |                                |                |
 v                                v                v
DayPillar                   CalendarSync      BeautyChat
```

### 3.4 既存モデルの拡張

#### 3.4.1 Userモデルの拡張

既存のUserモデルに美容師関連の情報を追加するフィールドを追加します：

```typescript
// User モデルへの追加フィールド
interface UserBeautyExtension {
  isStylist?: boolean;          // スタイリストフラグ
  stylistProfileId?: ObjectId;  // スタイリストプロファイルID
  salonId?: ObjectId;           // 所属サロンID
  beautyPreferences?: {         // 美容好み（一般ユーザー用）
    preferredStyles: string[];  // 好みのスタイル
    preferredColors: string[];  // 好みのカラー
    hairCondition: string[];    // 髪の状態
  };
}
```

#### 3.4.2 ChatHistoryモデルの拡張

既存のChatHistoryモデルに美容関連のコンテキスト情報を追加します：

```typescript
// ChatHistory モデルへの追加フィールド
interface ChatHistoryBeautyExtension {
  beautyContext?: {
    clientId?: ObjectId;        // クライアントID
    appointmentId?: ObjectId;   // 予約ID
    sessionId?: ObjectId;       // セッションID
    beautyServiceType?: string; // 美容サービスタイプ
  };
}
```

## 4. データフロー設計

### 4.1 主要データフロー

美姫命アプリケーションの主要なデータフローを以下に示します：

1. **クライアント情報登録フロー**
   - 手動入力またはカレンダー連携で基本的なクライアント情報を登録
   - 誕生日情報が入力されると四柱推命情報が自動計算される
   - クライアントプロファイルが作成される

2. **予約・施術フロー**
   - 予約情報がカレンダー連携またはアプリ内で作成される
   - 予約からClientSessionが生成される
   - 施術後に施術記録やビフォー/アフター画像が追加される

3. **スタイリスト-クライアント相性診断フロー**
   - クライアントとスタイリストの四柱推命情報から相性が計算される
   - 相性情報が予約割り当ての参考情報となる

4. **美容提案フロー**
   - クライアントの四柱推命情報、当日の日柱情報、施術履歴から最適な提案を生成
   - 提案内容がBeautyStyleSuggestionとして保存される
   - チャットコンテキストとして活用される

5. **チャットコンテキストフロー**
   - クライアント情報、四柱推命情報、施術履歴がチャットのコンテキストとして設定される
   - AIがこれらのコンテキストに基づいて応答を生成する

### 4.2 外部連携データフロー

外部システムとの連携データフローを以下に示します：

1. **カレンダー連携フロー**
   - Google/iCloudカレンダーからイベント情報を定期的に取得
   - イベント情報をAppointmentデータに変換
   - クライアント名などからClientとの紐付けを行う
   - 未登録クライアントの場合は仮登録を行う

2. **外部予約システム連携フロー**
   - カレンダーを介して間接的に外部予約システムと連携
   - ホットペッパービューティーなどの予約情報をカレンダー経由で取得
   - カレンダーイベントの内容からAppointmentとClientデータを生成

## 5. 実装戦略

### 5.1 段階的実装計画

美姫命アプリケーションのデータモデル実装を以下の段階で進めることを提案します：

1. **フェーズ1: 基盤モデル実装**
   - 基本モデル（Salon、StylistProfile、Client）の実装
   - 既存モデル（User）の拡張

2. **フェーズ2: クライアント管理機能実装**
   - Appointment、ClientSessionモデルの実装
   - 基本的なクライアント管理機能の実装

3. **フェーズ3: 美容特化機能実装**
   - BeautyStyleSuggestion、BeautyChatモデルの実装
   - 四柱推命情報を活用した美容提案機能の実装

4. **フェーズ4: 外部連携機能実装**
   - CalendarSyncモデルの実装
   - 外部予約システムとの連携機能の実装

### 5.2 既存コードベースとの統合

既存のDailyFortuneNative3コードベースとの統合を以下のように進めます：

1. **共通モジュールの活用**
   - 四柱推命計算エンジン
   - 認証システム
   - データベース接続管理

2. **APIエンドポイントの拡張**
   - 既存のAPIエンドポイントを維持しつつ、美容関連のエンドポイントを追加
   - RESTful設計原則に従った一貫性のあるAPI設計

3. **フロントエンド統合**
   - 既存のコンポーネントライブラリを活用
   - 美容特化のUIコンポーネントを追加

## 6. データベース最適化

### 6.1 インデックス設計

効率的なクエリ実行のための主要なインデックス設計を以下に提案します：

1. **Clientコレクション**
   - `{ salonId: 1, lastName: 1, firstName: 1 }`: クライアント検索用
   - `{ salonId: 1, lastVisitDate: -1 }`: 最終来店日ソート用

2. **Appointmentコレクション**
   - `{ salonId: 1, dateTime: 1 }`: 日付別予約検索用
   - `{ clientId: 1, dateTime: -1 }`: クライアント別予約履歴用
   - `{ stylistId: 1, dateTime: 1 }`: スタイリスト別予約検索用

3. **ClientSessionコレクション**
   - `{ clientId: 1, appointmentInfo.dateTime: -1 }`: クライアント別施術履歴用
   - `{ stylistId: 1, appointmentInfo.dateTime: -1 }`: スタイリスト別施術履歴用

4. **BeautyChatコレクション**
   - `{ clientId: 1, updatedAt: -1 }`: クライアント別チャット履歴用

### 6.2 パフォーマンス最適化戦略

1. **クエリ最適化**
   - 頻繁に使用されるクエリのプロジェクション最適化
   - 必要なフィールドのみを取得するクエリ設計

2. **データ分割戦略**
   - サロン単位でのデータ分割
   - 時間経過によるデータのアーカイブ戦略

3. **キャッシュ戦略**
   - 頻繁にアクセスされるデータ（日柱情報、四柱推命プロファイル等）のキャッシュ
   - クライアント側での適切なキャッシュ設計

## 7. セキュリティ設計

### 7.1 認証・認可設計

1. **ユーザー役割とアクセス制御**
   - サロン管理者: すべての機能にアクセス可能
   - スタイリスト: 担当クライアントと自分の情報にアクセス可能
   - クライアント: 自分の情報のみアクセス可能（将来的な拡張）

2. **データアクセス制限**
   - サロン単位でのデータ分離
   - クライアント情報へのアクセス制限

### 7.2 個人情報保護

1. **センシティブデータの保護**
   - クライアント連絡先情報の暗号化
   - アクセスログの記録

2. **GDPR/個人情報保護法対応**
   - クライアント情報の利用目的の明確化
   - 情報削除リクエスト対応機能

## 8. まとめと次のステップ

### 8.1 提案まとめ

本提案書では、美姫命アプリケーションのデータモデル設計を行いました。既存のDailyFortuneNative3アプリケーションのデータモデルを活用しつつ、美容サロン業界特有の要件に対応するための拡張モデルを設計しました。

主な特徴は以下の通りです：

1. 既存の四柱推命関連モデルを最大限に活用
2. サロン、スタイリスト、クライアント関係のモデル化
3. 予約・施術管理のためのデータモデル
4. 外部システム連携のためのモデル設計
5. 美容特化コンテンツのためのモデル設計

### 8.2 次のステップ

1. **モデル設計のレビューと承認**
   - 関係者によるデータモデル設計のレビュー
   - 改善点の洗い出しとモデル調整

2. **プロトタイプ実装**
   - 主要モデルの最小限の実装
   - APIエンドポイントの設計と実装

3. **段階的実装の計画作成**
   - 優先機能の特定
   - 実装スケジュールの作成

4. **技術検証**
   - MongoDB上でのパフォーマンス検証
   - スケーラビリティテスト

以上のステップを経て、美姫命アプリケーションのデータモデル実装を進めることで、効率的かつ堅牢なシステム構築が可能となります。