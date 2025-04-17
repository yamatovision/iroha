# 運勢更新フローの詳細設計

このドキュメントはDailyFortuneアプリケーションにおける運勢更新プロセスのデータフローを説明します。運勢更新は日次バッチジョブとして実行され、すべてのユーザーの日々の運勢を計算・保存します。

## 1. 概要

運勢更新プロセスは以下の主要なステップで構成されています：

1. スケジュールに従った自動実行またはスーパー管理者による手動実行
2. 運勢更新ログエントリの作成
3. 日柱データの計算または取得（日々のエネルギー）
4. 全ユーザーの四柱推命プロフィールの取得
5. 個々のユーザーの運勢計算とデータベースへの保存
6. 運勢更新ログの更新

## 2. データフロー図

### 2.1 自動運勢更新フロー

```
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│    Cronジョブ   │    │     運勢更新    │    │    MongoDB     │
│ (自動スケジューラ) │    │   処理モジュール  │    │   データベース   │
└───────┬────────┘    └───────┬────────┘    └───────┬────────┘
        │                     │                     │
        │ 実行開始（設定時間）   │                     │
        ├────────────────────►│                     │
        │                     │                     │
        │                     │                     │ DailyFortuneUpdateLog作成
        │                     │                     │ (status=scheduled)
        │                     │                     ├─┐
        │                     │                     │ │
        │                     │                     │◄┘
        │                     │                     │
        │                     │ 日柱データ生成・取得    │
        │                     ├────────────────────►│
        │                     │                     ├─┐
        │                     │                     │ │
        │                     │◄────────────────────┘ │
        │                     │                       │
        │                     │                       │
        │                     │ ユーザーリスト取得      │
        │                     ├────────────────────►│
        │                     │                     ├─┐
        │                     │◄────────────────────┘ │
        │                     │                       │
        │                     │ ユーザーごとに運勢生成   │
        │                     ├─┐                    │
        │                     │ │                    │
        │                     │◄┘                    │
        │                     │                      │
        │                     │                      │ DailyFortune複数作成
        │                     │                      ├─┐
        │                     │                      │ │
        │                     │                      │◄┘
        │                     │                      │
        │                     │                      │ DailyFortuneUpdateLog更新
        │                     │                      │ (status=completed)
        │                     │                      ├─┐
        │                     │                      │ │
        │                     │                      │◄┘
        │                     │                      │
        │ 実行完了             │                      │
        │◄────────────────────┴──────────────────────┘
```

### 2.2 手動運勢更新フロー

```
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│   SuperAdmin   │    │     運勢更新    │    │    MongoDB     │
│  管理者画面     │    │   処理モジュール  │    │   データベース   │
└───────┬────────┘    └───────┬────────┘    └───────┬────────┘
        │                     │                     │
        │ 手動実行リクエスト    │                     │
        ├────────────────────►│                     │
        │                     │                     │
        │                     │                     │ DailyFortuneUpdateLog作成
        │                     │                     │ (status=running)
        │                     │                     ├─┐
        │                     │                     │ │
        │                     │                     │◄┘
        │                     │                     │
        │ 開始確認レスポンス    │                     │
        │◄────────────────────┘                     │
        │                     │                     │
        │                     │ （以降は自動実行と同様）  │
        │                     ├─────────────────────┤
        │                     │                     │
```

## 3. 詳細プロセス

### 3.1 自動スケジュール実行

自動実行は以下のスケジュールで行われます：

1. 毎日午前3時（デフォルト設定）にCronジョブが起動
2. `SystemSetting`テーブルから`fortune_update_time`設定を取得
3. 指定された時間に`runFortuneUpdate()`メソッドを実行

### 3.2 ログエントリ作成

運勢更新プロセスが開始されると、最初にログエントリが作成されます：

```typescript
// DailyFortuneUpdateLogの作成
const updateLog = await DailyFortuneUpdateLog.create({
  date: new Date(),
  status: 'scheduled',
  startTime: new Date(),
  totalUsers: 0,
  successCount: 0,
  failedCount: 0,
  errors: [],
  isAutomaticRetry: isRetry,
  createdBy: trigger // 'system'または管理者のID
});
```

### 3.3 日柱データの生成または取得

当日の日柱（その日の宇宙エネルギー）データを生成または取得します：

```typescript
// 現在の日付のDayPillarを取得または生成
async function getDayPillar(date) {
  // 日付の正規化（時間部分を切り落とす）
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  
  // 既存の日柱を検索
  let dayPillar = await DayPillar.findOne({ date: normalizedDate });
  
  // 存在しない場合は新規生成
  if (!dayPillar) {
    // SajuEngineを使用して日柱を計算
    const sajuEngine = new SajuEngine();
    const pillarData = sajuEngine.calculateDayPillar(normalizedDate);
    
    dayPillar = await DayPillar.create({
      date: normalizedDate,
      heavenlyStem: pillarData.heavenlyStem,
      earthlyBranch: pillarData.earthlyBranch,
      element: pillarData.element
    });
  }
  
  return dayPillar;
}
```

### 3.4 ユーザーリストの取得

運勢を生成する対象ユーザーを取得します：

```typescript
// 処理対象のユーザーリストを取得
async function getTargetUsers(targetUserIds) {
  const query = { 
    // アクティブなユーザーのみ
    isActive: true,
    // 四柱推命プロフィールが設定済みのユーザーのみ
    hasSajuProfile: true 
  };
  
  // 特定ユーザーのみを対象とする場合
  if (targetUserIds && targetUserIds.length > 0) {
    query._id = { $in: targetUserIds };
  }
  
  return await User.find(query).lean();
}
```

### 3.5 ユーザーごとの運勢生成

各ユーザーに対して、四柱推命プロフィールと日柱データに基づいて運勢を計算します：

```typescript
// 各ユーザーの運勢を生成
async function generateFortunes(users, dayPillar, logId) {
  const successfulUsers = [];
  const failedUsers = [];
  
  for (const user of users) {
    try {
      // ユーザーの四柱推命プロフィールを取得
      const sajuProfile = await SajuProfile.findOne({ userId: user._id });
      if (!sajuProfile) {
        throw new Error('四柱推命プロフィールが見つかりません');
      }
      
      // 運勢スコアの計算（日柱と四柱推命プロフィールの相性）
      const score = calculateFortuneScore(sajuProfile, dayPillar);
      
      // 運勢詳細テキストの生成（Claude AI連携）
      const details = await generateFortuneDetails(sajuProfile, dayPillar, score);
      
      // ラッキーアイテムの生成
      const luckyItems = generateLuckyItems(sajuProfile, dayPillar);
      
      // 個人目標アドバイスの生成
      const personalGoalAdvice = await generatePersonalAdvice(user, sajuProfile, dayPillar, score);
      
      // チーム目標アドバイスの生成（チームに所属している場合）
      let teamGoalAdvice = '';
      if (user.teamId) {
        const team = await Team.findById(user.teamId);
        if (team && team.goal) {
          teamGoalAdvice = await generateTeamAdvice(user, team, sajuProfile, dayPillar, score);
        }
      }
      
      // DailyFortuneの保存
      await DailyFortune.create({
        userId: user._id,
        date: dayPillar.date,
        dayPillar: {
          heavenlyStem: dayPillar.heavenlyStem,
          earthlyBranch: dayPillar.earthlyBranch
        },
        score,
        details,
        luckyItems,
        personalGoalAdvice,
        teamGoalAdvice
      });
      
      successfulUsers.push(user._id);
    } catch (error) {
      failedUsers.push({
        userId: user._id,
        error: error.message
      });
    }
  }
  
  // 処理結果をログに更新
  await DailyFortuneUpdateLog.findByIdAndUpdate(logId, {
    totalUsers: users.length,
    successCount: successfulUsers.length,
    failedCount: failedUsers.length,
    errors: failedUsers
  });
  
  return { successfulUsers, failedUsers };
}
```

### 3.6 運勢更新ログの更新

処理が完了したら、運勢更新ログのステータスを更新します：

```typescript
// 処理完了時のログ更新
await DailyFortuneUpdateLog.findByIdAndUpdate(logId, {
  status: failedUsers.length > 0 ? 'partially_completed' : 'completed',
  endTime: new Date(),
  updatedAt: new Date()
});
```

## 4. エラー処理とリトライメカニズム

### 4.1 運勢更新監視・リトライフロー

```
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│    Cronジョブ   │    │     運勢監視    │    │    MongoDB     │
│   (監視用)     │    │   処理モジュール  │    │   データベース   │
└───────┬────────┘    └───────┬────────┘    └───────┬────────┘
        │                     │                     │
        │ 定期チェック実行     │                     │
        ├────────────────────►│                     │
        │                     │                     │
        │                     │ 未完了ログ検索        │
        │                     ├────────────────────►│
        │                     │                     ├─┐
        │                     │◄────────────────────┘ │
        │                     │                       │
        │                     │ 異常ログ発見時          │
        │                     ├─┐                    │
        │                     │ │                    │
        │                     │◄┘                    │
        │                     │                      │
        │                     │ リトライ実行           │
        │                     ├──────────────────────┤
        │                     │  (isAutomaticRetry=true) │
        │                     │                      │
```

### 4.2 リトライロジック

監視ジョブは10分ごとに実行され、異常終了した運勢更新ジョブを検出します：

```typescript
// 異常ログの検出と自動リトライ
async function checkAndRetryFailedUpdates() {
  // 24時間以内の失敗または未完了のログを検索
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);
  
  const failedLogs = await DailyFortuneUpdateLog.find({
    status: { $in: ['failed', 'partially_completed'] },
    createdAt: { $gt: oneDayAgo },
    retryCount: { $lt: 3 } // 最大3回までリトライ
  });
  
  for (const log of failedLogs) {
    // リトライカウントを更新
    await DailyFortuneUpdateLog.findByIdAndUpdate(log._id, {
      retryCount: (log.retryCount || 0) + 1
    });
    
    // 失敗したユーザーのみをターゲットにリトライ
    const failedUserIds = log.errors.map(e => e.userId);
    if (failedUserIds.length > 0) {
      // 自動リトライフラグをtrueにして実行
      await runFortuneUpdate({
        targetDate: log.date,
        targetUserIds: failedUserIds,
        isAutomaticRetry: true
      });
    }
  }
}
```

## 5. 実装上の注意点

### 5.1 データの一貫性

- 同じ日付のユーザーの運勢データが重複しないよう、生成前に既存データを確認して更新する
- トランザクションを活用して、運勢データの一括作成と更新ログ更新の整合性を確保する

### 5.2 パフォーマンス最適化

- ユーザー数が多い場合は、バッチサイズを設定してチャンク単位で処理する
- インデックスを適切に設定し、クエリパフォーマンスを最適化する
- AIサービス呼び出しのレート制限に注意し、必要に応じてキューイングシステムを導入する

### 5.3 エラーログと通知

- 運勢更新の失敗は詳細なエラーログに記録し、再現性を確保する
- 重大なエラーや複数回のリトライ失敗時は管理者に通知する仕組みを導入する

## 6. モニタリングポイント

運勢更新プロセスの健全性を監視するための主要なメトリクス：

1. 成功率：`successCount / totalUsers`（目標: 99.9%以上）
2. 処理時間：`endTime - startTime`（目標: 300ユーザーあたり5分以内）
3. リトライ率：自動リトライが必要な運勢更新の割合（目標: 1%未満）
4. エラーパターン：同じユーザーや特定の条件で繰り返し発生するエラー

これらのメトリクスを定期的に分析し、運勢更新プロセスの継続的な改善を行います。