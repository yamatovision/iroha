# 「予約・担当管理」データモデル設計

## 概要

美姫命アプリの予約管理システムは、美容サロンの予約情報を効率的に管理し、四柱推命に基づいたスタイリストとクライアントのマッチングを実現するためのデータモデルです。このデータモデルは、カレンダー連携や相性計算を統合し、予約情報の一元管理を可能にします。

## ERダイアグラム

```
┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│    Appointment    │      │       Client       │      │       User        │
├───────────────────┤      ├───────────────────┤      ├───────────────────┤
│ _id               │◄─┐   │ _id               │◄─┐   │ _id               │
│ organizationId    │  │   │ organizationId    │  │   │ email             │
│ clientId ─────────┼──┘   │ name              │  │   │ password          │
│ stylistId ────────┼──────┼─────────────────┐ │  │   │ displayName       │
│ date              │      │ gender           │ │  │   │ profileImage      │
│ startTime         │      │ birthdate        │ │  │   │ role              │
│ endTime           │      │ birthtime        │ │  │   │ organizationId    │
│ duration          │      │ elementAttribute │ │  └───┤ jobTitle          │
│ serviceType       │      │ fourPillars      │ │      │ specialties       │
│ serviceDetails    │      │ // その他クライアント情報 │ │      │ elementAttribute    │
│ status            │      └───────────────────┘ │      │ sajuProfile       │
│ notes             │                            │      │ // その他ユーザー情報   │
│ externalSource    │                            │      └───────────────────┘
│ compatibilityScores│                            │  
│ createdAt         │                            │      ┌───────────────────┐
│ updatedAt         │                            │      │     TimeSlot      │
│ createdBy         │                            │      ├───────────────────┤
│ updatedBy         │                            │      │ _id               │
└───────────────────┘                            │      │ organizationId    │
                                                 │      │ date              │
┌───────────────────┐                            │      │ startTime         │
│  ClientStylist    │                            │      │ endTime           │
│  Compatibility    │                            │      │ availableStylists │
├───────────────────┤                            │      │ maximumAppointments│
│ _id               │                            │      │ isAvailable       │
│ clientId ─────────┼────────────────────────────┘      │ notes             │
│ stylistId ────────┼────────────────────────────┐      │ createdAt         │
│ organizationId    │                            │      │ updatedAt         │
│ overallScore      │                            │      └───────────────────┘
│ calculatedAt      │                            │               ▲
│ calculationVersion│                            │               │
└───────────────────┘                            │               │
                                                 │      ┌───────────────────┐
┌───────────────────┐                            │      │   CalendarSync    │
│     SyncLog       │                            │      ├───────────────────┤
├───────────────────┤                            │      │ _id               │
│ _id               │                            │      │ organizationId    │
│ organizationId    │◄───────────────────────────┼──────┤ type              │
│ calendarSyncId    │◄───────────────────────────┘      │ calendarId        │
│ startTime         │                                   │ name              │
│ endTime           │                                   │ syncEnabled       │
│ status            │                                   │ syncInterval      │
│ processedEvents   │                                   │ autoAssignEnabled │
│ newAppointments   │                                   │ lastSyncedAt      │
│ updatedAppointments│                                  │ syncToken         │
│ errors            │                                   │ mappingRules      │
└───────────────────┘                                   │ authCredentials   │
                                                        │ createdAt         │
                                                        │ updatedAt         │
                                                        │ createdBy         │
                                                        └───────────────────┘
```

## 詳細データモデル

### 1. Appointment（予約）

予約の基本情報を管理するコレクションです。1つの予約は1人のクライアントと0または1人のスタイリストに関連付けられます。

```javascript
{
  _id: ObjectId,                   // MongoDB ObjectId
  organizationId: ObjectId,        // 所属組織ID（美容サロンID）
  clientId: ObjectId,              // クライアントID（必須）
  stylistId: ObjectId,             // 担当スタイリストID（null=未割り当て）
  date: Date,                      // 予約日（日付のみのISOフォーマット）
  startTime: String,               // 開始時間（"HH:MM"形式）
  endTime: String,                 // 終了時間（"HH:MM"形式）
  duration: Number,                // 所要時間（分）
  serviceType: String,             // 施術タイプ（"カット"、"カラー"、"パーマ"など）
  serviceDetails: String,          // 施術詳細（自由テキスト）
  status: String,                  // 予約ステータス（enum: "confirmed", "pending", "canceled", "completed", "no_show"）
  notes: String,                   // メモ・備考
  
  // 外部連携情報
  externalSource: {
    source: String,                // データソース（enum: "google", "apple", "hotpepper", "manual"）
    eventId: String,               // 外部カレンダーのイベントID
    lastSyncedAt: Date,            // 最終同期日時
  },
  
  // 相性評価情報 - 複数のスタイリストとの相性をキャッシュ
  compatibilityScores: {
    [stylistId: String]: Number,   // スタイリストIDと相性スコア（0-100）のマッピング
  },
  
  // 監査情報
  createdAt: Date,                 // 作成日時
  updatedAt: Date,                 // 更新日時
  createdBy: ObjectId,             // 作成者ID
  updatedBy: ObjectId,             // 更新者ID
}
```

#### インデックス設計

```javascript
// Appointment コレクションのインデックス
db.appointments.createIndex({ "organizationId": 1, "date": 1 });                  // 日付別組織の予約検索
db.appointments.createIndex({ "organizationId": 1, "clientId": 1, "date": 1 });   // クライアント別予約検索
db.appointments.createIndex({ "organizationId": 1, "stylistId": 1, "date": 1 });  // スタイリスト別予約検索
db.appointments.createIndex({ "organizationId": 1, "status": 1, "date": 1 });     // ステータス別予約検索
db.appointments.createIndex({ "externalSource.eventId": 1 });                     // 外部イベントIDによる検索
```

### 2. TimeSlot（時間枠）

サロンの営業時間枠を管理するコレクションです。各時間枠に対して利用可能なスタイリストや最大予約数を設定できます。

```javascript
{
  _id: ObjectId,                   // MongoDB ObjectId
  organizationId: ObjectId,        // 所属組織ID
  date: Date,                      // 日付（日付のみのISOフォーマット）
  startTime: String,               // 開始時間（"HH:MM"形式）
  endTime: String,                 // 終了時間（"HH:MM"形式）
  availableStylists: [ObjectId],   // 利用可能なスタイリストIDリスト
  maximumAppointments: Number,     // 最大予約数（デフォルト: 利用可能なスタイリスト数）
  isAvailable: Boolean,            // 予約受付可能かどうか
  notes: String,                   // メモ・備考
  createdAt: Date,                 // 作成日時
  updatedAt: Date,                 // 更新日時
}
```

#### インデックス設計

```javascript
// TimeSlot コレクションのインデックス
db.timeSlots.createIndex({ "organizationId": 1, "date": 1 });                       // 日付別組織の時間枠検索
db.timeSlots.createIndex({ "organizationId": 1, "date": 1, "startTime": 1 });       // 開始時間での検索
db.timeSlots.createIndex({ "organizationId": 1, "availableStylists": 1, "date": 1 });  // スタイリスト別時間枠検索
```

### 3. CalendarSync（カレンダー同期設定）

外部カレンダー（Google/Apple）との同期設定を管理するコレクションです。複数のカレンダーとの連携が可能です。

```javascript
{
  _id: ObjectId,                   // MongoDB ObjectId
  organizationId: ObjectId,        // 所属組織ID
  type: String,                    // カレンダータイプ（enum: "google", "apple"）
  calendarId: String,              // 外部カレンダーID
  name: String,                    // カレンダー名
  syncEnabled: Boolean,            // 同期有効状態
  syncInterval: Number,            // 同期間隔（分）
  autoAssignEnabled: Boolean,      // 自動担当割り当て有効状態
  lastSyncedAt: Date,              // 最終同期日時
  syncToken: String,               // 同期トークン（差分同期用）
  
  // マッピングルール
  mappingRules: {
    matchClientByName: Boolean,    // クライアント名での照合
    matchClientByPhone: Boolean,   // 電話番号での照合
    matchClientByEmail: Boolean,   // メールアドレスでの照合
    matchStylistByName: Boolean,   // スタイリスト名での照合
    autoRegisterNewClients: Boolean, // 未登録クライアント自動登録
  },
  
  // 認証情報（暗号化して保存）
  authCredentials: {
    accessToken: String,           // アクセストークン
    refreshToken: String,          // リフレッシュトークン
    expiresAt: Date,               // トークン有効期限
  },
  
  createdAt: Date,                 // 作成日時
  updatedAt: Date,                 // 更新日時
  createdBy: ObjectId,             // 作成者ID
}
```

#### インデックス設計

```javascript
// CalendarSync コレクションのインデックス
db.calendarSync.createIndex({ "organizationId": 1 });                      // 組織別カレンダー同期設定検索
db.calendarSync.createIndex({ "organizationId": 1, "type": 1 });           // カレンダータイプ別検索
db.calendarSync.createIndex({ "syncEnabled": 1, "lastSyncedAt": 1 });      // 同期スケジューリング用
```

### 4. SyncLog（同期ログ）

カレンダー同期の実行履歴を記録するコレクションです。同期の成功/失敗や処理されたイベント数を追跡します。

```javascript
{
  _id: ObjectId,                   // MongoDB ObjectId
  organizationId: ObjectId,        // 所属組織ID
  calendarSyncId: ObjectId,        // カレンダー同期設定ID
  startTime: Date,                 // 同期開始時間
  endTime: Date,                   // 同期終了時間
  status: String,                  // 同期ステータス（enum: "success", "partial", "failed"）
  processedEvents: Number,         // 処理されたイベント数
  newAppointments: Number,         // 新規追加された予約数
  updatedAppointments: Number,     // 更新された予約数
  errors: [{                       // エラー情報リスト
    message: String,               // エラーメッセージ
    eventId: String,               // 関連するイベントID
    details: Object,               // 詳細情報
  }],
}
```

#### インデックス設計

```javascript
// SyncLog コレクションのインデックス
db.syncLogs.createIndex({ "organizationId": 1, "startTime": -1 });          // 組織別実行時間順
db.syncLogs.createIndex({ "calendarSyncId": 1, "startTime": -1 });          // カレンダー別実行時間順
db.syncLogs.createIndex({ "status": 1, "organizationId": 1 });              // ステータス別検索
```

### 5. ClientStylistCompatibility（クライアント-スタイリスト相性）

クライアントとスタイリスト間の相性評価を永続化するコレクションです。これにより、頻繁な相性計算を避け、パフォーマンスを向上させます。

```javascript
{
  _id: ObjectId,                   // MongoDB ObjectId
  clientId: ObjectId,              // クライアントID
  stylistId: ObjectId,             // スタイリストID
  organizationId: ObjectId,        // 組織ID
  overallScore: Number,            // 総合相性スコア (0-100)
  calculatedAt: Date,              // 計算日時
  calculationVersion: String,      // 計算アルゴリズムバージョン
}
```

#### インデックス設計

```javascript
// ClientStylistCompatibility コレクションのインデックス
db.clientStylistCompatibility.createIndex({ "organizationId": 1, "clientId": 1 });   // クライアント別相性検索
db.clientStylistCompatibility.createIndex({ "organizationId": 1, "stylistId": 1 });  // スタイリスト別相性検索
db.clientStylistCompatibility.createIndex({ 
  "organizationId": 1, 
  "clientId": 1, 
  "overallScore": -1                  // 相性スコア降順
});
```

## データ関連の主要ビジネスロジック

### 1. 予約作成時の相性検証

```javascript
// 予約作成時に最適なスタイリストを提案するロジック
async function suggestStylists(clientId, date, timeSlot) {
  // 1. 指定日時で利用可能なスタイリストを取得
  const availableStylists = await findAvailableStylists(date, timeSlot);
  
  // 2. クライアントとの相性を計算
  const compatibilities = await findCompatibilities(clientId, availableStylists);
  
  // 3. 相性スコアでソート
  return compatibilities.sort((a, b) => b.overallScore - a.overallScore);
}
```

### 2. カレンダー同期処理のトランザクション

```javascript
// カレンダー同期のトランザクション処理
async function syncCalendar(calendarSyncId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  const syncLog = {
    calendarSyncId,
    startTime: new Date(),
    processedEvents: 0,
    newAppointments: 0,
    updatedAppointments: 0,
    errors: []
  };
  
  try {
    // 1. カレンダー同期設定を取得
    const syncSettings = await CalendarSync.findById(calendarSyncId).session(session);
    
    // 2. 外部APIから新しいイベントを取得
    const events = await fetchCalendarEvents(syncSettings);
    
    // 3. イベントを予約データに変換
    for (const event of events) {
      try {
        const result = await processCalendarEvent(event, syncSettings, session);
        syncLog.processedEvents++;
        
        if (result.created) syncLog.newAppointments++;
        else if (result.updated) syncLog.updatedAppointments++;
      } catch (error) {
        syncLog.errors.push({
          message: error.message,
          eventId: event.id,
          details: error
        });
      }
    }
    
    // 4. 同期設定を更新
    syncSettings.lastSyncedAt = new Date();
    syncSettings.syncToken = events.nextSyncToken;
    await syncSettings.save({ session });
    
    // 5. ログを完了状態で保存
    syncLog.status = syncLog.errors.length === 0 ? 'success' : 'partial';
    syncLog.endTime = new Date();
    await SyncLog.create([syncLog], { session });
    
    // コミット
    await session.commitTransaction();
    return syncLog;
  } catch (error) {
    // エラー時はロールバック
    await session.abortTransaction();
    
    // エラーログを保存
    syncLog.status = 'failed';
    syncLog.endTime = new Date();
    syncLog.errors.push({
      message: error.message,
      details: error
    });
    await SyncLog.create([syncLog], { session: null });
    
    throw error;
  } finally {
    session.endSession();
  }
}
```

### 3. 自動担当割り当てロジック

```javascript
// 未割り当て予約の自動担当割り当て
async function autoAssignStylists(date, organizationId) {
  // 1. 指定日の未割り当て予約を取得
  const unassignedAppointments = await Appointment.find({
    organizationId,
    date,
    stylistId: null,
    status: 'confirmed'
  });
  
  const results = {
    totalProcessed: unassignedAppointments.length,
    assigned: 0,
    skipped: 0,
    failed: 0,
    assignments: []
  };
  
  // 2. 各予約に最適なスタイリストを割り当て
  for (const appointment of unassignedAppointments) {
    try {
      // 時間枠で利用可能なスタイリストを取得
      const timeSlot = await TimeSlot.findOne({
        organizationId,
        date: appointment.date,
        startTime: appointment.startTime
      });
      
      if (!timeSlot || !timeSlot.isAvailable) {
        results.skipped++;
        continue;
      }
      
      // 予約時間に既に他の予約が入っているスタイリストを除外
      const busyStylists = await getBusyStylists(
        organizationId, 
        appointment.date, 
        appointment.startTime, 
        appointment.endTime
      );
      
      const availableStylists = timeSlot.availableStylists
        .filter(id => !busyStylists.includes(id.toString()));
      
      if (availableStylists.length === 0) {
        results.skipped++;
        continue;
      }
      
      // 相性スコアでソート
      const compatibilities = await ClientStylistCompatibility.find({
        organizationId,
        clientId: appointment.clientId,
        stylistId: { $in: availableStylists }
      }).sort({ overallScore: -1 });
      
      if (compatibilities.length === 0) {
        results.skipped++;
        continue;
      }
      
      // 最適な相性のスタイリストを割り当て
      const bestMatch = compatibilities[0];
      appointment.stylistId = bestMatch.stylistId;
      appointment.updatedAt = new Date();
      await appointment.save();
      
      // スタイリスト情報を取得
      const stylist = await User.findById(bestMatch.stylistId);
      
      results.assigned++;
      results.assignments.push({
        appointmentId: appointment._id,
        clientName: (await Client.findById(appointment.clientId)).name,
        assignedStylistName: stylist.displayName,
        compatibilityScore: bestMatch.overallScore
      });
    } catch (error) {
      results.failed++;
    }
  }
  
  return results;
}
```

## 相性評価の計算ロジック

クライアントとスタイリストの相性評価は、五行相性（四柱推命）に基づいて計算されます。

```javascript
// 相性スコア計算
async function calculateCompatibilityScore(clientId, stylistId) {
  // 1. クライアントとスタイリストの四柱推命データを取得
  const client = await Client.findById(clientId);
  const stylist = await User.findById(stylistId);
  
  if (!client.elementAttribute || !stylist.elementAttribute) {
    return { overallScore: 50 }; // デフォルト値（データ不足の場合）
  }
  
  // 2. 基本五行相性の計算（相生相剋関係）
  const elementCompatibility = calculateElementCompatibility(
    client.elementAttribute,
    stylist.elementAttribute
  );
  
  // 3. 格局・用神の相性計算
  const kakukyokuCompatibility = calculateKakukyokuCompatibility(
    client.fourPillars,
    stylist.sajuProfile
  );
  
  // 4. スタイリストの得意分野との整合性
  let specialtyBonus = 0;
  if (stylist.specialties) {
    // 例：「カラー」得意のスタイリストは「火」属性のクライアントと相性が良い
    if (stylist.specialties.includes('カラー') && client.elementAttribute === 'fire') {
      specialtyBonus += 10;
    }
    // 他の得意分野についても同様のロジック
  }
  
  // 5. 総合スコアの計算（0-100）
  const overallScore = Math.min(100, Math.max(0,
    elementCompatibility * 0.5 +
    kakukyokuCompatibility * 0.3 +
    specialtyBonus
  ));
  
  return {
    overallScore: Math.round(overallScore),
    elementCompatibility,
    kakukyokuCompatibility,
    specialtyBonus
  };
}
```

## データマイグレーション計画

既存のクライアント管理とスタイリスト管理のデータから予約管理システムを構築するためのマイグレーション手順です。

1. **TimeSlotコレクションの初期設定**:
   - サロンの営業時間に基づく標準的な時間枠を自動生成
   - スタイリストの勤務情報を反映

2. **Client-Stylist相性データの事前計算**:
   - 既存のクライアント・スタイリストデータを使用して相性データを一括生成
   - 一度計算された相性情報はキャッシュとして保存し、パフォーマンスを向上

3. **Google/Appleカレンダーの初期同期**:
   - 認証フローの実装と接続設定
   - 過去30日間の予約データの取り込み
   - クライアント名による自動マッピングと未登録クライアントの識別

## データバリデーションルール

### 1. Appointment（予約）のバリデーション

```javascript
const appointmentSchema = new Schema({
  // 基本フィールド
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  stylistId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  date: {
    type: Date,
    required: true,
    validate: {
      // 過去の日付は許可しない（ただし当日は許可）
      validator: function(v) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return v >= today;
      },
      message: '過去の日付には予約を作成できません'
    }
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: '開始時間は HH:MM 形式である必要があります'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: '終了時間は HH:MM 形式である必要があります'
    }
  },
  // 他のフィールドとバリデーション...
});

// カスタムバリデーションフック
appointmentSchema.pre('save', async function(next) {
  // 終了時間が開始時間より後であることを確認
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  if (endMinutes <= startMinutes) {
    throw new Error('終了時間は開始時間より後である必要があります');
  }
  
  // 同一スタイリストの予約重複チェック
  if (this.stylistId) {
    const conflictingAppointment = await this.constructor.findOne({
      _id: { $ne: this._id }, // 自分自身を除外
      organizationId: this.organizationId,
      stylistId: this.stylistId,
      date: this.date,
      $or: [
        { 
          // 既存予約の時間枠内に開始時間が含まれる
          startTime: { $lte: this.startTime },
          endTime: { $gt: this.startTime }
        },
        {
          // 既存予約の時間枠内に終了時間が含まれる
          startTime: { $lt: this.endTime },
          endTime: { $gte: this.endTime }
        },
        {
          // この予約が既存予約を完全に包含
          startTime: { $gte: this.startTime },
          endTime: { $lte: this.endTime }
        }
      ],
      status: { $nin: ['canceled', 'no_show'] }
    });
    
    if (conflictingAppointment) {
      throw new Error('指定されたスタイリストは選択した時間枠で既に予約があります');
    }
  }
  
  next();
});
```

## キャッシング戦略

高頻度でアクセスされるデータのキャッシング戦略：

1. **日別予約データ**:
   - Redis TTLキャッシュ（5分）
   - キー：`appointments:org:${organizationId}:date:${dateString}`
   - 予約変更時にキャッシュを無効化

2. **クライアント-スタイリスト相性データ**:
   - MongoDB内のClientStylistCompatibilityコレクションに永続化
   - 相性データの計算は重いため、計算結果を保存してパフォーマンスを向上
   - データ更新トリガー: クライアント情報変更時、スタイリスト情報変更時

3. **時間枠データ**:
   - Redis TTLキャッシュ（15分）
   - キー：`timeslots:org:${organizationId}:date:${dateString}`
   - 時間枠更新時にキャッシュを無効化

## セキュリティ考慮事項

1. **権限ベースのアクセス制御**:
   - Owner/Admin: 全予約の表示・編集、時間枠管理、カレンダー同期設定
   - User (スタイリスト): 自分の担当予約の表示、未割り当て予約の表示、自分への割り当て

2. **カレンダー認証情報の保護**:
   - 外部カレンダーのアクセストークン、リフレッシュトークンは暗号化して保存
   - サーバー環境変数で暗号化キーを管理

3. **クライアント個人情報のアクセス制限**:
   - クライアント情報へのアクセスはロギング
   - 必要最小限の情報のみをクライアントサイドに送信

4. **同期処理のロック機構**:
   - 同時実行による問題を防ぐため、組織単位での同期処理ロックを実装
   - Redis Lockを使用した排他制御

## パフォーマンス最適化

1. **インデックス戦略**:
   - 上記の各コレクションに対して最適なインデックスを設定
   - 定期的なインデックス使用状況の監視と最適化

2. **ページネーションとフィルタリングの最適化**:
   - 大量の予約データに対するページネーション実装
   - 効率的なフィルタリングのためのインデックス活用

3. **バッチ処理**:
   - 相性計算などの重い処理はバックグラウンドジョブとして実行
   - 定期的なデータ集計・分析の自動化

4. **カレンダー同期の最適化**:
   - 差分同期による通信量・処理量の削減
   - 同期頻度の調整機能（組織サイズや更新頻度に応じて）

## データの一貫性と整合性

1. **トランザクション処理**:
   - 予約作成/更新プロセスにMongoDBトランザクションを使用
   - カレンダー同期処理のアトミック性確保

2. **競合解決戦略**:
   - 同一時間枠に対する複数予約の競合解決ルール
   - 外部カレンダーと内部データの同期競合解決

3. **監査ログ**:
   - 予約変更・ステータス変更の履歴追跡
   - スタイリスト割り当て変更の記録

## モデル間の関連性

美姫命アプリの既存モデルとの関連：

1. **User（スタイリスト）との関連**:
   - スタイリストの四柱推命情報と相性評価を連携
   - スタイリストの稼働状況と予約スケジュールの統合

2. **Client（クライアント）との関連**:
   - クライアントの四柱推命情報と相性評価を連携
   - クライアントの施術履歴と予約履歴の統合

3. **Organization（組織）との関連**:
   - 組織単位での予約管理と設定
   - 組織のサブスクリプションプランと機能制限の連携

## 将来の拡張性

1. **スマートスケジューリング**:
   - AIを活用した最適スケジュール提案
   - スタイリストの専門性と相性を考慮した自動スケジューリング

2. **高度な予約分析**:
   - 予約パターン分析と需要予測
   - スタイリスト別パフォーマンス分析

3. **顧客エンゲージメント機能**:
   - 予約リマインダー通知
   - 自動フォローアップメッセージ

4. **多様な外部連携**:
   - 他の美容サロン管理システムとの連携拡大
   - 決済システムとの統合