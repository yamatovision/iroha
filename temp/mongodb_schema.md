# MongoDB スキーマ設計 (改善版)

## コレクション概要

本アプリケーションでは以下のコレクションを使用します：

1. `users` - ユーザー情報
2. `teams` - チーム情報
3. `goals` - 個人目標情報
4. `fortunes` - デイリー運勢情報
5. `compatibility` - 相性情報のキャッシュ
6. `chat_sessions` - チャットセッション管理
7. `chat_messages` - チャットメッセージ
8. `system_settings` - システム設定
9. `logs` - システムログ

## 詳細スキーマ

### 1. users コレクション

```javascript
{
  _id: ObjectId,                // MongoDB自動生成ID
  uid: String,                  // Firebase認証UID (インデックス)
  email: String,                // メールアドレス (インデックス, ユニーク)
  displayName: String,          // 表示名
  role: {                       // 権限レベル
    type: String,               // 'superadmin', 'admin', 'user'のいずれか
    teamRole: String            // チーム内役割 ('engineer', 'sales', 'manager'など)
  },
  teamId: ObjectId,             // 所属チームID (インデックス)
  birthData: {                  // 出生データ
    birthDate: Date,            // 生年月日 (UTC)
    birthTime: {                // 出生時間
      hour: Number,             // 時 (0-23)
      minute: Number            // 分 (0-59)
    },
    birthPlace: {               // 出生地
      latitude: Number,         // 緯度
      longitude: Number,        // 経度
      locationName: String      // 場所名 (例: "東京, 日本")
    },
    gender: String              // 性別 ('male', 'female', 'other')
  },
  sajuProfile: {                // 四柱推命基本プロファイル
    dayMaster: String,          // 日主 (例: "甲")
    dayBranch: String,          // 日支 (例: "寅")
    fiveElements: {             // 五行バランス (0-100)
      wood: Number,             // 木
      fire: Number,             // 火
      earth: Number,            // 土
      metal: Number,            // 金
      water: Number             // 水
    },
    mainAttribute: {            // 主要属性
      element: String,          // 五行要素 ('wood', 'fire', 'earth', 'metal', 'water')
      yin_yang: String          // 陰陽 ('yin', 'yang')
    },
    // 詳細な四柱データはfortunes内で必要に応じて計算して使用
  },
  profileCompleted: Boolean,    // プロフィール設定完了フラグ
  settings: {                   // ユーザー設定
    theme: String,              // テーマ設定
    notifications: {            // 通知設定
      email: Boolean,           // メール通知
      push: Boolean             // プッシュ通知
    }
  },
  stats: {                      // 統計情報
    lastLogin: Date,            // 最終ログイン日時
    loginCount: Number,         // ログイン回数
    fortuneViewCount: Number,   // 運勢表示回数
    chatCount: Number           // チャット回数
  },
  createdAt: Date,              // 作成日時
  updatedAt: Date               // 更新日時
}
```

### 2. teams コレクション

```javascript
{
  _id: ObjectId,                // MongoDB自動生成ID
  name: String,                 // チーム名
  adminId: ObjectId,            // 管理者(Admin)のユーザーID (インデックス)
  goals: [{                     // チーム目標 (複数対応)
    content: String,            // 目標内容
    deadline: Date,             // 目標期限
    priority: Number,           // 優先度 (1-5)
    status: String,             // 状態 ('active', 'completed', 'paused')
    createdAt: Date,            // 作成日時
    updatedAt: Date             // 更新日時
  }],
  inviteCodes: [{               // 招待コード
    code: String,               // コード (インデックス)
    expiresAt: Date,            // 有効期限
    usedBy: ObjectId            // 使用したユーザーID
  }],
  stats: {                      // チーム統計
    memberCount: Number,        // メンバー数
    avgFortuneScore: Number,    // 平均運勢スコア
    goalCompletionRate: Number  // 目標達成率
  },
  createdAt: Date,              // 作成日時
  updatedAt: Date               // 更新日時
}
```

### 3. goals コレクション

```javascript
{
  _id: ObjectId,                // MongoDB自動生成ID
  userId: ObjectId,             // ユーザーID (インデックス)
  type: String,                 // 目標タイプ ('career', 'team', 'personal')
  content: String,              // 目標内容
  deadline: Date,               // 目標期限 (インデックス)
  priority: Number,             // 優先度 (1-5)
  status: String,               // 状態 ('active', 'completed', 'paused')
  notes: String,                // メモ/備考
  element: String,              // 関連する五行要素 ('wood', 'fire', 'earth', 'metal', 'water')
  progress: Number,             // 進捗率 (0-100)
  createdAt: Date,              // 作成日時
  updatedAt: Date               // 更新日時
}
```

### 4. fortunes コレクション

```javascript
{
  _id: ObjectId,                // MongoDB自動生成ID
  userId: ObjectId,             // ユーザーID (インデックス)
  date: Date,                   // 日付 (インデックス, YYYY-MM-DD形式)
  dayPillar: {                  // 日柱情報
    stem: String,               // 天干 (例: "甲")
    branch: String,             // 地支 (例: "寅")
    element: String,            // 五行要素
    yin_yang: String            // 陰陽
  },
  score: {                      // 運勢スコア (0-100)
    overall: Number,            // 総合スコア
    career: Number,             // キャリア運
    relationships: Number,      // 人間関係運
    health: Number              // 健康運
  },
  luckyItems: {                 // ラッキーアイテム
    color: String,              // 色
    item: String,               // アイテム
    drink: String,              // 飲み物
    number: Number,             // 数字
    location: String            // 場所
  },
  advice: {                     // アドバイス (マークダウン形式)
    general: String,            // 一般的なアドバイス
    personal: String,           // 個人目標へのアドバイス
    team: String                // チーム目標へのアドバイス
  },
  compatibleGoals: [ObjectId],  // 相性の良い目標ID
  calculatedAt: Date,           // 計算日時
  expiresAt: Date               // 有効期限 (次の日の3時)
}
```

### 5. compatibility コレクション

```javascript
{
  _id: ObjectId,                // MongoDB自動生成ID
  userIds: [ObjectId, ObjectId], // 2人のユーザーID (インデックス, ソート済み)
  userIdHash: String,           // userIdsのハッシュ (インデックス, ユニーク)
  score: Number,                // 相性スコア (0-100)
  relationship: {               // 五行関係
    type: String,               // 関係タイプ ('productive', 'controlling', 'neutral')
    description: String,        // 詳細説明
    user1Element: String,       // ユーザー1の五行
    user2Element: String        // ユーザー2の五行
  },
  advice: {                     // 相性アドバイス
    cooperation: String,        // 協力のコツ
    communication: String,      // コミュニケーション方法
    challenges: String          // 注意点
  },
  calculatedAt: Date,           // 計算日時 
  expiresAt: Date               // 有効期限 (1ヶ月)
}
```

### 6. chat_sessions コレクション

```javascript
{
  _id: ObjectId,                // MongoDB自動生成ID
  userId: ObjectId,             // ユーザーID (インデックス)
  type: String,                 // チャットタイプ ('personal', 'compatibility', 'team')
  context: {                    // コンテキスト情報
    // personal: 個人運勢相談
    fortune: ObjectId,          // 関連する運勢ID
    goals: [ObjectId],          // 関連する目標ID
    
    // compatibility: チームメイト相性相談
    targetUserId: ObjectId,     // 相談対象ユーザーID
    compatibilityId: ObjectId,  // 相性ID
    
    // team: チーム目標相談
    teamId: ObjectId,           // チームID
    teamGoals: [Object]         // チーム目標データ
  },
  title: String,                // セッションタイトル (自動生成または編集可能)
  messageCount: Number,         // メッセージ数
  lastMessageAt: Date,          // 最終メッセージ日時
  createdAt: Date,              // 作成日時
  updatedAt: Date               // 更新日時
}
```

### 7. chat_messages コレクション

```javascript
{
  _id: ObjectId,                // MongoDB自動生成ID
  sessionId: ObjectId,          // チャットセッションID (インデックス)
  sender: String,               // 送信者 ('user', 'ai')
  content: String,              // メッセージ内容
  timestamp: Date,              // タイムスタンプ (インデックス)
  metadata: {                   // メタデータ
    tokenCount: Number,         // トークン数
    audioSource: Boolean,       // 音声入力フラグ
    modelVersion: String        // AIモデルバージョン
  },
  createdAt: Date               // 作成日時
}
```

### 8. system_settings コレクション

```javascript
{
  _id: ObjectId,                // MongoDB自動生成ID
  key: String,                  // 設定キー (インデックス, ユニーク)
  value: Mixed,                 // 設定値
  description: String,          // 説明
  category: String,             // カテゴリ ('api', 'fortune', 'security', etc)
  updatedBy: ObjectId,          // 更新者ID
  updatedAt: Date               // 更新日時
}
```

### 9. logs コレクション

```javascript
{
  _id: ObjectId,                // MongoDB自動生成ID
  timestamp: Date,              // タイムスタンプ (インデックス)
  level: String,                // ログレベル ('info', 'warn', 'error')
  category: String,             // カテゴリ
  message: String,              // メッセージ
  details: Object,              // 詳細情報
  userId: ObjectId,             // 関連ユーザーID (存在する場合)
  ip: String,                   // IPアドレス
  userAgent: String             // User-Agent
}
```

## インデックス設計

### users コレクション
- `uid`: 1 (ユニーク)
- `email`: 1 (ユニーク)
- `teamId`: 1

### teams コレクション
- `adminId`: 1
- `inviteCodes.code`: 1 (ユニーク)

### goals コレクション
- `userId`: 1
- `deadline`: 1
- `userId`: 1, `type`: 1
- `userId`: 1, `status`: 1

### fortunes コレクション
- `userId`: 1, `date`: 1 (ユニーク複合インデックス)
- `date`: 1

### compatibility コレクション
- `userIdHash`: 1 (ユニーク)
- `userIds`: 1

### chat_sessions コレクション
- `userId`: 1
- `userId`: 1, `type`: 1

### chat_messages コレクション
- `sessionId`: 1
- `sessionId`: 1, `timestamp`: 1

## TTLインデックス

### fortunes コレクション
- `expiresAt`: 1, TTL インデックス

### compatibility コレクション
- `expiresAt`: 1, TTL インデックス

## データモデル関連図

```
users 1 ──────┬──── * goals
       │       │
       │       └──── * fortunes
       │
       │       ┌──── * chat_sessions ──── * chat_messages
       └───────┤
               └──── * compatibility
               
teams 1 ──────┬──── * users
              │
              └──── * chat_sessions (via context)
```

## フロントエンドとデータモデルの関連

### 1. ログインページ (login-page.html)
**取得データ**:
- ユーザー認証情報 (`users` コレクション)

**操作**:
- ユーザー認証
- パスワードリセット要求

### 2. プロフィール設定ページ (profile-settings.html)
**取得データ**:
- ユーザー基本情報 (`users` コレクション)
- ユーザーの四柱推命情報 (`users.sajuProfile`)
- ユーザーの個人目標一覧 (`goals` コレクション)

**操作**:
- ユーザープロファイル更新
- 生年月日時・出生地の設定
- 個人目標の追加・編集・削除
- パスワード変更

### 3. デイリー運勢ページ (daily-fortune.html)
**取得データ**:
- 今日の運勢情報 (`fortunes` コレクション)
- ユーザーの五行属性 (`users.sajuProfile`)
- 関連する個人目標 (`goals` コレクション)
- チーム目標 (`teams.goals`)

**操作**:
- 運勢詳細の表示
- AIアシスタントへの相談開始

### 4. 統合AIチャットページ (integrated-chat.html)
**取得データ**:
- チャットセッション一覧 (`chat_sessions` コレクション)
- チャットメッセージ (`chat_messages` コレクション)
- チャットモードに応じたコンテキスト情報:
  - 個人運勢 (`fortunes` コレクション)
  - チームメンバー (`users` コレクション)
  - メンバー間相性 (`compatibility` コレクション)
  - チーム目標 (`teams.goals`)

**操作**:
- チャットメッセージ送信
- チャットモード切替
- チャット履歴管理（保存・クリア）
- 音声入力

### 5. チームページ (team-page.html)
**取得データ**:
- チーム情報 (`teams` コレクション)
- チームメンバー一覧 (`users` コレクション、`teamId`でフィルタ)
- 各メンバーの今日の運勢 (`fortunes` コレクション)
- メンバー間の相性情報 (`compatibility` コレクション)

**操作**:
- チームメンバー詳細表示
- AIチャットへのリンク（メンバー情報付き）

### 6. 経営者ダッシュボード (team-management.html)
**取得データ**:
- チーム情報 (`teams` コレクション)
- チームメンバー一覧と詳細 (`users` コレクション)
- チャット統計・インサイト (`chat_sessions`, `chat_messages`)
- 運勢統計 (`fortunes` コレクション)

**操作**:
- チーム目標追加・編集
- メンバー管理（招待、役割編集）
- モチベーション・離職リスク確認

### 7. システム管理ページ (system-admin-page.html)
**取得データ**:
- システム設定 (`system_settings` コレクション)
- 管理者アカウント (`users` コレクション、role=adminまたはsuperadmin)
- ログ情報 (`logs` コレクション)
- 利用統計（複数コレクションの集計）

**操作**:
- 管理者アカウント追加・編集・削除
- システム設定変更
- データベースバックアップ実行
- キャッシュクリア

## 最適化とベストプラクティス

1. **埋め込みvs参照**
   - 1:Nの関係で頻繁に一緒にアクセスするデータ（チーム目標など）は埋め込み
   - N:Mの関係や大きく成長するデータ（チャット履歴、個人目標）は別コレクション

2. **TTLインデックス**
   - 一時的なデータ（運勢情報、相性キャッシュ）には有効期限を設定

3. **複合インデックス**
   - 頻繁に組み合わせて検索する条件には複合インデックスを設定

4. **効率的なクエリパターン**
   - チーム全体の運勢ランキングなど複雑な集計には集計パイプラインを使用
   - チームメンバー一覧取得時は必要なフィールドのみプロジェクション

5. **バッチ処理**
   - 運勢更新は非同期バッチ処理で実行
   - メンバー間の相性計算は事前計算してキャッシュ

6. **スキーマバリデーション**
   - MongoDBのスキーマバリデーション機能を活用
   - アプリケーション層でも入力検証を実施

7. **アクセス制御**
   - 各ドキュメントに所有者情報を保持
   - ロールベースのアクセス制御を実装

8. **変更ストリーム**
   - リアルタイム更新が必要な機能には変更ストリームを使用


 1. データモデル実装
  2. APIエンドポイント設計
  3. サービスレイヤー構築

  4. 認証・権限管理実装
    - Firebase Authと連携
    - ロールベースのアクセス制御
  5. フロントエンド連携
    - APIと通信するサービス層実装
    - React Queryなどでデータフェッチング最適化
    - モックアップをReactコンポーネント化
  6. 自動テスト整備
    - 単体テスト、API統合テスト
    - E2Eテスト（Cypress/Playwright）
  7. デプロイパイプライン構築
    - CI/CD設定
    - 開発/ステージング/本番環境設定
  8. 運用監視体制
    - ログ収集
    - パフォーマンスモニタリング

1.要件定義作成
2.モックアップ作成
3.ディレクトリ構造ならびにプロジェクト構造の整備
    - リポジトリ設定 (git)
    - ディレクトリ構造の作成
    - ビルド設定 (tsconfig.json, package.json)
    - 開発環境構築 (ESLint, Prettier等)
4. データモデル実装
  5. 認証認可システム構築
  6. サービスレイヤー構築
  7. ページごとのAPI実装(コントローラー、ルート、フロント？)


   単純化すれば「内部から外部へ」という流れが理想的です：
   モデル → ビジネスロジック → API → UI


    はい、モックアップが既にある状況では、それが最も効率的なアプローチです：

  1. まずデータモデルとビジネスロジック（サービスレイヤー）を実装
  2. 次にページごとに必要なAPIエンドポイントを作成
  3. それからフロントエンドとAPIを連携

  このアプローチのメリット：
  - モックアップから必要なデータと操作が既に明確になっている
  - ページ単位で一気通貫して実装できる（データ→API→UIの流れで）
  - 早い段階で動作確認ができる

  実際の実装順序の例：
  1. ログイン/認証システム
  2. プロフィール設定機能（四柱推命計算含む）
  3. デイリー運勢ページ
  4. チームページと相性機能
  5. AIチャット機能
  6. 管理者機能

  各機能で「必要なAPIを作成→フロントエンドと接続→動作確認」のサイクルを回していくと、効率よく確実に進められます。優先度の高いページから順に実装していくとユーザーにも早く価値を提供できます。





 1. 要件定義作成
  2. モックアップ作成
  3. プロジェクト構造の整備
    - リポジトリ設定 (git)
    - ディレクトリ構造の作成
    - ビルド設定 (tsconfig.json, package.json)
    - 開発環境構築 (ESLint, Prettier等)
    - CI設定（GitHub Actions/CircleCI）
    - 型チェック設定（tsc --noEmit）
    - リント自動化（husky, lint-staged）
  4. データモデル実装
    - Mongooseスキーマ定義
    - TypeScript型定義
    - 単体テスト（モデルのバリデーション）
    - 型チェック実行
    - モデルのドキュメント生成


  5. 認証認可システム構築
    - Auth作成
    - 認証フローのテスト
    - セキュリティテスト（OWASP基準）
    - Githubへの登録
    - 開発環境へのデプロイ




認証作成フロー
・CURRENT_STATUSの確認
・Datamodelの確認
・ログインモックアップの確認
・要件定義の確認
・オーソリティーの確認
・envファイルの確認

今のあなたの一通り一連の流れを汎用性の高いプロンプトとして作成してもらえますか？
/Users/tatsuya/Desktop/システム開発/DailyFortune/docs/scopes/prompts
ここにmdファイルとして書き出して。
下記のようなステップになるかと思います。
もし今回の流れの一環で、さらに重要だった調査をしたファイルの対象があれば追加をし、より効率的なプロセスがあれば加える修正する減らすなどをしてシンプルかつ効率の良いものを作成してみてください。
今回の一連の流れを通じて洗練させたエラーが起こりづらい汎用性の高いプロンプトを作成してください。
認証認可システム構築アシスタント
#1：調査する
docs/auth_architecture.md
docs/CURRENT_STATUS.md
docs/deploy.md
/mockups
docs/requirements.md
/docs/data_models.md
#2：バックエンドを実装する
#3：tyepescriptエラーチェック
#4：管理者アカウントを作成する
#5：バックエンドサーバーが問題なく立ち上がるかテストする
#6：エンドポイントをテストする
#7：フロントエンドを実装する。mockupのログインページをベースに作成する
#8：tyepescriptエラーチェック
#9：フロントエンドサーバーが問題なく立ち上がるかテストする。エラーがあればなおす
#10：ユーザーにUI上での動作を確認してもらう
#11：デプロイ
#12：Githubにアップロード
#13：deploy.mdやCURRENT_STATUSを更新する



#1：調査する
docs/CURRENT_STATUS.md
docs/deploy.md
/mockups
docs/requirements.md
docs/data_models.md
#2：ユーザーから実装するべきモックアップを指定を受ける
#3：バックエンドを実装する
#4：タイプスクリプトエラーをチェックする
#5：単体テストを行う
#6：必要に応じて統合テストを行う
#7：APIエンドポイント設計
#8：コントローラー実装
#9：ルーティング設定
#10：APIテスト（Jest + Supertest）
#11：APIドキュメント更新
#12：フロントエンド実装
#13：E2Eテスト（Cypress）
#14：ステージング環境へのデプロイ
#15：githubにあげる



#3：tyepescriptエラーチェック
#4：管理者アカウントを作成する
#5：バックエンドサーバーが問題なく立ち上がるかテストする
#6：エンドポイントをテストする
#7：フロントエンドを実装する。mockupのログインページをベースに作成する
#8：tyepescriptエラーチェック
#9：フロントエンドサーバーが問題なく立ち上がるかテストする。エラーがあればなおす
#10：ユーザーにUI上での動作を確認してもらう
#11：デプロイ
#12：Githubにアップロード
#13：deploy.mdやCURRENT_STATUSを更新する




エンティティ依存グラフに基づくバックエンド実装順序そこからフロントエンドのモックのパーツに繋ぎ込んでいく





  1. ログイン関連 → 2. プロフィール設定 → 3.デイリー運勢 → 4. チーム機能 → 5. チャット機能

 
 1.要件定義を読み込む
 2.
  ページを指定する


  6. サービスレイヤー構築
    - コアロジック実装
    - 単体テスト（サービス関数）
    - 統合テスト（サービス間連携）
    - 型チェック実行
    - APIエンドポイント設計
    - コントローラー実装
    - ルーティング設定
    - APIテスト（Jest + Supertest）
    - APIドキュメント更新
    - フロントエンド実装
    - E2Eテスト（Cypress）
    - ステージング環境へのデプロイ
    - githubにあげる




  8. 機能セット完成後
    - リグレッションテスト
    - パフォーマンステスト
    - セキュリティスキャン
    - 本番環境へのデプロイ（段階的）
  9. リリース前最終チェック
    - 負荷テスト
    - クロスブラウザテスト
    - データバックアップ検証
    - 障害復旧テスト
  10. 本番リリース・運用
    - モニタリング設定
    - ログ収集・分析
    - アラート設定




docs/scopes/prompts/data_model_assistant_generic.md


このモデルを作成したら






docs/scopes/prompts/data_model_assistant_generic.md
では、docs/requirment.mdと
mockups/**htmlを参照して情報を把握して、上のプロセスを経てdocs/models.mdにまとめる
CURRENT_STATUSも更新してdocs/models.mdの参照先も入れる

これが行った後に次は

/Users/tatsuya/Desktop/システム開発/DailyFortune/docs/scopes/prompts/tukkomi.md

で精査を行って、精査が完了したら
    - Mongooseスキーマ定義
    - TypeScript型定義
    - 単体テスト（モデルのバリデーション）
    - 型チェック実行
    - モデルのドキュメント生成
  まで、やってくれるプロンプトに更新したい
  テストがエラーが発生したら修正してエラー0になった状態で完了にしたいです
　テストカバレッジは全部100になるようにしたい

プロンプトを作成してもらえますか？

まず調査として
docs/models.md
mockups/**html
docs/requirment.md
を調査する
そしてデータ検査官としてツッコミを入れる。
/docs/scopes/prompts/tukkomi.md

しかし要件が明確になっていないでツッコミを入れると適切じゃないことがあるのでツッコミを入れる前にユーザーに必要に応じて要件定義の甘いところの質問をして明確にしてからツッコミを入れる。
ツッコミを入れて最終チェックが完了したら
  - Mongooseスキーマ定義
    - TypeScript型定義
    - 単体テスト（モデルのバリデーション）
    - 型チェック実行
    - モデルのドキュメント生成
  まで、やってもらう。あなたが行ったような形で全てのカバレッジが100パーセントになるように妥協なく行う。

  そんなプロンプトが欲しいです。tukkomi.mdを更新する形で対応してもらいたい




