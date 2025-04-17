# 実装タスク詳細計画

このドキュメントでは、DailyFortuneの実装タスクをデータモデルの依存関係とビジネスロジックの流れに基づいて細分化し、論理的な実装順序で記述します。各フェーズは依存関係グラフに基づいて設計され、最適な開発順序を保証します。

## フェーズ1: 四柱推命プロフィールと日柱データ実装

### 1.1 SajuProfile API実装

#### 1.1.1 SajuEngine連携サービス (3日)
- [x] `server/src/services/saju-engine.service.ts` の作成
  - [x] sajuengine_packageとの連携インターフェース実装
  - [x] 年柱、月柱、日柱、時柱の計算ロジック連携
  - [x] 天干地支、蔵干、十神の取得メソッド実装
  - [x] 五行属性の判定ロジック実装
  - [x] ユニットテスト作成

#### 1.1.2 SajuProfile API実装 (2日)
- [x] `server/src/controllers/saju-profile.controller.ts` の作成
  - [x] プロフィール作成エンドポイント (`POST /api/saju-profiles`)
  - [x] プロフィール取得エンドポイント (`GET /api/saju-profiles/:userId`)
  - [x] プロフィール更新エンドポイント (`PUT /api/saju-profiles/:userId`)
  - [x] バリデーションミドルウェア実装
  - [x] 存在チェックミドルウェア実装

#### 1.1.3 SajuProfile ルーティング (1日)
- [x] `server/src/routes/saju-profile.routes.ts` の作成
  - [x] ルートの定義
  - [x] 認証ミドルウェア連携
  - [x] APIドキュメント用Swagger注釈追加

#### 1.1.4 ユニットテスト (2日)
- [x] `server/src/tests/controllers/real-auth-saju-profile.test.ts` の作成
- [x] `server/src/tests/services/saju-engine.service.test.ts` の作成
- [x] 異常系テストケース作成
- [x] モック作成とモジュール分離

### 1.2 DayPillar API実装

#### 1.2.1 DayPillar コントローラー (2日)
- [x] `server/src/controllers/day-pillar.controller.ts` の作成
  - [x] 日柱生成エンドポイント (`POST /api/day-pillars`)
  - [x] 特定日の日柱取得エンドポイント (`GET /api/day-pillars/:date`)
  - [x] 日付範囲の日柱一括取得エンドポイント (`GET /api/day-pillars?startDate=&endDate=`)
  - [x] 今日の日柱取得エンドポイント (`GET /api/day-pillars/today`)

#### 1.2.2 DayPillar ルーティング (1日)
- [x] `server/src/routes/day-pillar.routes.ts` の作成
  - [x] ルートの定義
  - [x] 管理者専用ルートの保護
  - [x] APIドキュメント用Swagger注釈追加

#### 1.2.3 日柱更新バッチ処理 (3日)
- [x] `server/src/batch/day-pillar-generator.ts` の作成
  - [x] 毎日の日柱生成ロジック実装
  - [x] スケジューラー設定 (毎日0時実行)
  - [x] エラーハンドリングと再試行ロジック
  - [x] ログ記録機能
  - [x] 実行結果通知

#### 1.2.4 ユニットテスト (2日)
- [x] `server/src/tests/controllers/real-auth-day-pillar.test.ts` の作成
- [x] `server/src/tests/batch/day-pillar-generator.test.ts` の作成
- [x] `server/src/tests/batch/scheduler.test.ts` の作成
- [x] テスト用データセット作成

### 1.3 フロントエンド - SajuProfile表示コンポーネント

#### 1.3.1 四柱推命プロフィールデータフェッチ (1日)
- [x] `client/src/services/saju-profile.service.ts` の作成
  - [x] SajuProfile APIとの通信機能実装
  - [x] エラーハンドリング実装
  - [x] キャッシュ戦略実装

#### 1.3.2 四柱推命情報表示コンポーネント (3日)
- [x] `client/src/components/profile/SajuProfileCard.tsx` の作成
  - [x] 四柱（年柱、月柱、日柱、時柱）表示
  - [x] 五行属性表示
  - [x] 天干地支と蔵干の視覚化
  - [x] レスポンシブデザイン対応
  
#### 1.3.3 プロフィールページへの統合 (2日)
- [x] `client/src/pages/Profile/SajuProfileSection.tsx` の作成
  - [x] タブインターフェース内に四柱推命セクション追加
  - [x] プロフィール設定ページとの統合
  - [x] 異なるSajuProfileビジュアライザーの実装

#### 1.3.4 プロフィール入力フォーム (2日)
- [x] `client/src/components/profile/SajuProfileForm.tsx` の作成
  - [x] 誕生日入力（日付選択UI）
  - [x] 出生時間入力（時刻選択UI）
  - [x] 出生地入力（場所検索機能）
  - [x] バリデーション実装
  - [x] 送信機能実装

## フェーズ2: チーム機能のMVP実装

フェーズ2では、チーム管理機能のMVP（最小実用製品）バージョンを実装します。最初は基本機能のみに焦点を当て、後のフェーズで高度な機能を追加することでユーザー価値をできるだけ早く提供します。

### 2.1 チーム基本モデル実装

#### 2.1.1 Team モデルの拡張 (1日)
- [x] `server/src/models/Team.ts` の更新
  - [x] description, iconInitial, iconColor フィールド追加
  - [x] バリデーション実装（文字数制限など）
  - [x] モデルインデックスの最適化
  - [x] モデル関連メソッド実装（findByUserId, findAdminTeamsなど）

#### 2.1.2 TeamGoal モデルの拡張 (1日)
- [x] `server/src/models/TeamGoal.ts` の更新
  - [x] status, progress, collaborators フィールド追加
  - [x] バリデーション実装
  - [x] 進捗状況のヘルパーメソッド追加

#### 2.1.3 User モデルのチーム関連フィールド追加 (1日)
- [x] `server/src/models/User.ts` の更新
  - [x] teamRole フィールド追加
  - [x] teamId関連の参照整合性確保
  - [x] インデックス最適化

### 2.2 チーム基本API実装

#### 2.2.1 チーム管理サービス (3日)
- [x] `server/src/services/team/team.service.ts` の作成
  - [x] createTeam機能: チーム作成と管理者設定
  - [x] getTeams機能: ユーザーが所属/管理するチーム一覧取得
  - [x] getTeamById機能: チーム詳細情報取得
  - [x] updateTeam機能: チーム基本情報の更新
  - [x] 権限検証ヘルパー関数実装
  - [x] エラーハンドリング実装

#### 2.2.2 チームメンバー管理サービス (2日)
- [x] `server/src/services/team/team-member.service.ts` の作成
  - [x] getTeamMembers機能: チームメンバー一覧取得
  - [x] addMember機能: チームメンバー追加
  - [x] updateMemberRole機能: メンバーの役割更新
  - [x] removeMember機能: メンバーをチームから削除
  - [x] メンバーシップ検証機能
  - [x] エラーハンドリング実装

#### 2.2.3 チームコントローラー (2日)
- [x] `server/src/controllers/team/team.controller.ts` の作成
  - [x] チーム作成エンドポイント (`POST /api/v1/teams`)
  - [x] チーム一覧取得エンドポイント (`GET /api/v1/teams`)
  - [x] チーム詳細取得エンドポイント (`GET /api/v1/teams/:teamId`)
  - [x] チーム情報更新エンドポイント (`PUT /api/v1/teams/:teamId`)
  - [x] リクエスト検証機能実装
  - [x] レスポンス形式の統一

#### 2.2.4 チームメンバーコントローラー (2日)
- [x] `server/src/controllers/team/team-member.controller.ts` の作成
  - [x] メンバー一覧取得エンドポイント (`GET /api/v1/teams/:teamId/members`)
  - [x] メンバー追加エンドポイント (`POST /api/v1/teams/:teamId/members`)
  - [x] メンバー役割更新エンドポイント (`PUT /api/v1/teams/:teamId/members/:userId/role`)
  - [x] メンバー削除エンドポイント (`DELETE /api/v1/teams/:teamId/members/:userId`)
  - [x] パラメータ検証と安全な処理実装

### 2.3 チーム目標の基本API実装

#### 2.3.1 チーム目標サービス (2日)
- [x] `server/src/services/team/team-goal.service.ts` の作成
  - [x] getTeamGoal機能: チームの現在の目標取得
  - [x] createTeamGoal機能: 目標設定
  - [x] updateTeamGoal機能: 目標更新
  - [x] 権限確認ロジック実装
  - [x] エラーハンドリング実装

#### 2.3.2 チーム目標コントローラー (1日)
- [x] `server/src/controllers/team/team-goal.controller.ts` の作成
  - [x] 目標取得エンドポイント (`GET /api/v1/teams/:teamId/goal`)
  - [x] 目標設定エンドポイント (`POST /api/v1/teams/:teamId/goal`)
  - [x] 目標更新エンドポイント (`PUT /api/v1/teams/:teamId/goal`)
  - [x] 入力バリデーション実装

### 2.4 ルーティングとミドルウェア

#### 2.4.1 チーム関連ルーティング (1日)
- [x] `server/src/routes/team.routes.ts` の作成
  - [x] チーム操作ルート定義
  - [x] チームメンバー操作ルート定義
  - [x] チーム目標ルート定義
  - [x] APIドキュメント用注釈追加

#### 2.4.2 チーム認証・認可ミドルウェア (1日)
- [x] `server/src/middleware/team-auth.middleware.ts` の作成
  - [x] チームメンバーシップ確認（サービス内で実装）
  - [x] チーム管理者権限確認（サービス内で実装）
  - [x] 共通エラーレスポンス

### 2.5 ユニットテスト

#### 2.5.1 チームサービステスト (2日)
- [x] `server/src/tests/services/team.service.test.ts` の作成
  - [x] チーム作成・取得機能のテスト
  - [x] チーム更新機能のテスト
  - [x] エラーケーステスト

#### 2.5.2 チームメンバー管理テスト (1日)
- [x] `server/src/tests/services/team-member.service.test.ts` の作成
  - [x] メンバー追加・削除機能のテスト
  - [x] 役割更新機能のテスト
  - [x] 権限エラーケーステスト

#### 2.5.3 チーム目標サービステスト (1日)
- [x] `server/src/tests/services/team-goal.service.test.ts` の作成
  - [x] 目標設定・取得機能のテスト
  - [x] 目標更新機能のテスト
  - [x] バリデーションテスト

#### 2.5.4 コントローラー統合テスト (2日)
- [x] `server/src/tests/controllers/team.controller.test.ts` の作成
- [x] `server/src/tests/controllers/team-member.controller.test.ts` の作成
- [x] `server/src/tests/controllers/team-goal.controller.test.ts` の作成
  - [x] APIエンドポイントの動作テスト
  - [x] 認証・認可テスト
  - [x] エラーケーステスト

### 2.6 フロントエンド - チーム管理基本機能

#### 2.6.1 チームデータサービス (2日)
- [x] `client/src/services/team.service.ts` の作成
  - [x] Team APIとの通信機能実装
  - [x] TeamMember APIとの通信機能実装
  - [x] TeamGoal APIとの通信機能実装
  - [x] エラーハンドリングとリトライロジック
  - [x] キャッシュ戦略実装

#### 2.6.2 チーム管理基本コンポーネント (3日)
- [x] `client/src/components/team/TeamList.tsx` の作成
  - [x] チーム一覧表示
  - [x] チーム作成モーダル
  - [x] チーム選択機能
  - [x] レスポンシブデザイン対応
- [x] `client/src/components/team/TeamMembersList.tsx` の作成
  - [x] メンバー一覧表示（テーブル形式）
  - [x] メンバー追加フォーム
  - [x] メンバー編集モーダル
  - [x] 削除確認ダイアログ

#### 2.6.3 チーム目標管理コンポーネント (2日)
- [x] `client/src/components/team/TeamGoalForm.tsx` の作成
  - [x] 目標設定フォーム
  - [x] 期限選択カレンダー
  - [x] 目標表示カード
  - [x] バリデーション実装

#### 2.6.4 チームページ実装 (2日)
- [x] `client/src/pages/Team/index.tsx` の作成
  - [x] タブインターフェース実装
  - [x] コンポーネント統合
  - [x] ナビゲーション・ルーティング連携
  - [x] 認証・権限連携
  - [x] エラーハンドリング

## フェーズ3: デイリー運勢機能の実装

### 3.1 DailyFortune バックエンド実装

#### 3.1.1 DailyFortune サービス (3日)
- [x] `server/src/services/fortune.service.ts` の作成
  - [x] 運勢スコア計算アルゴリズム実装
  - [x] 日柱との相性計算ロジック実装
  - [x] モック運勢テキスト生成機能（後に Claude AI連携）
  - [x] ラッキーアイテム生成ロジック
  - [x] チーム目標・個人目標データ活用
  - [x] エラーハンドリング実装

#### 3.1.2 DailyFortune バッチ処理サービス (2日)
- [x] `server/src/batch/daily-fortune-update.ts` への実装
  - [x] 全ユーザー一括処理ロジック実装
  - [x] 段階的処理（大規模データ対応）
  - [x] 実行ログ管理機能実装
  - [x] サービス間依存関係処理
  - [x] エラーハンドリングと再試行ロジック

#### 3.1.3 DailyFortune コントローラー (2日)
- [x] `server/src/controllers/fortune.controller.ts` の作成
  - [x] 今日の運勢取得エンドポイント (`GET /api/v1/fortune/daily`)
  - [x] FortuneServiceとの連携実装

#### 3.1.4 DailyFortune ルーティング (1日)
- [x] `server/src/routes/fortune.routes.ts` の作成
  - [x] ルートの定義
  - [x] 認証ミドルウェア連携
  - [x] APIドキュメント用Swagger注釈追加

#### 3.1.5 運勢更新バッチ処理 (3日)
- [x] `server/src/batch/daily-fortune-update.ts` の作成
  - [x] 日柱生成後に実行されるよう設定
  - [x] スケジューラー設定 (毎日1時実行)
  - [x] 更新ログ記録 (DailyFortuneUpdateLog)
  - [x] 手動トリガー用管理APIエンドポイント実装

#### 3.1.6 DailyFortuneUpdateLog 管理 (2日)
- [x] `server/src/controllers/admin/fortune-update.controller.ts` の拡張
  - [x] 更新履歴一覧取得エンドポイント
  - [x] 更新詳細取得エンドポイント
  - [x] 手動更新トリガーエンドポイント
  - [x] 失敗ユーザーの再処理エンドポイント

#### 3.1.7 ユニットテスト (3日)
- [x] TypeScriptエラーの修正a
  - [x] 運勢サービスのCompatibilityAdvice型エラー修正
  - [x] 認証リクエスト型の修正
  - [x] バッチ処理でのモンゴDBドキュメント型安全性向上
- [x] `server/src/tests/services/fortune.service.test.ts` の作成
  - [x] 運勢計算機能のユニットテスト
  - [x] AI連携機能のモックテスト
- [x] `server/src/tests/controllers/fortune.controller.test.ts` の作成
  - [x] 今日の運勢取得エンドポイントのテスト
  - [x] 認証機能のテスト
- [x] `server/src/tests/batch/daily-fortune-update.test.ts` の作成
  - [x] バッチ処理の統合テスト
- [x] `server/src/tests/admin/real-auth-fortune-update.test.ts` の作成

### 3.2 DailyFortune フロントエンド実装

#### 3.2.1 運勢データサービス (1日)
- [x] `client/src/services/fortune.service.ts` の作成
  - [x] 今日の運勢取得API通信機能実装
  - [x] エラーハンドリング実装
  - [x] キャッシュ戦略実装
  - [x] 運勢コンテキストプロバイダー実装

#### 3.2.2 運勢表示カードコンポーネント (2日)
- [x] `client/src/components/fortune/FortuneCard.tsx` の作成
  - [x] 運勢スコア表示（円グラフ）
  - [x] 五行に基づいた色表現実装
  - [x] ラッキーアイテムカード表示
  - [x] レスポンシブデザイン対応

#### 3.2.3 運勢詳細コンポーネント (2日)
- [x] `client/src/components/fortune/FortuneDetails.tsx` の作成
  - [x] マークダウンパーサーによる運勢説明表示
  - [x] 個人目標へのアドバイス表示
  - [x] チーム目標へのアドバイス表示
  - [x] 五行アニメーション実装
  
#### 3.2.4 運勢ページ実装 (2日)
- [x] `client/src/pages/Fortune/index.tsx` の作成
  - [x] FortuneCardとFortuneDetailsの統合
  - [x] 運勢データロード処理実装
  - [x] AI相談ボタン連携
  - [x] ユーザー目標との連携表示

## フェーズ3.5: チーム相性ページ（Aisyou）実装

### 3.5.1 チーム相性データモデルとAPI

#### 3.5.1.1 Compatibility データモデル拡張 (1日)
- [x] `server/src/models/Compatibility.ts` の拡張
  - [x] 詳細説明フィールド (detailDescription) の追加（Claude AIからの返答をそのまま格納）
  - [x] 関係性タイプ表示 (relationshipType) の追加（'相生' | '相克' | '中和'）
  - [x] compatibilityScoreフィールドの削除（数値化は不要）
  - [x] バリデーション実装
  - [x] インデックス最適化

#### 3.5.1.2 チーム運勢ランキングAPI (2日)
- [x] `server/src/controllers/fortune.controller.ts` の拡張
  - [x] チーム運勢ランキング取得エンドポイント (`GET /api/v1/fortune/team/:teamId/ranking`)
  - [x] ユーザーのDailyFortune連携・集計ロジック
  - [x] 順位付けとエレメント情報の付与
  - [x] メンバーごとのラッキーアイテム情報の付与

#### 3.5.1.3 チームメンバー相性取得API (2日)
- [x] `server/src/controllers/team/team-compatibility.controller.ts` の作成
  - [x] メンバー間相性取得エンドポイント (`GET /api/v1/teams/:teamId/compatibility/:userId1/:userId2`)
  - [x] 相性情報の取得と生成ロジック
  - [x] 相性分析へのClaudeAI連携
  - [x] 認証とチームメンバーシップ確認

#### 3.5.1.4 相性サービス (3日)
- [x] `server/src/services/compatibility.service.ts` の作成
  - [x] 五行相性関係判定ロジック（相生・相克・中和の分類のみ）
  - [x] ClaudeAIによる相性詳細説明生成（統合されたテキスト形式）
  - [x] 相性データのキャッシュと保存ロジック

#### 3.5.1.5 ルーティングとミドルウェア (1日)
- [x] `server/src/routes/team.routes.ts` の拡張
  - [x] 相性関連エンドポイントの追加
  - [x] 運勢ランキングエンドポイントの追加
  - [x] 認証・認可ミドルウェア連携
  - [x] APIドキュメント用Swagger注釈追加

#### 3.5.1.6 ユニットテスト (2日)
- [x] `server/src/tests/services/compatibility.service.test.ts` の作成
- [x] `server/src/tests/controllers/team-compatibility.controller.test.ts` の作成
- [x] `server/src/tests/controllers/fortune.controller.team-ranking.test.ts` の作成
  - [x] 相性計算の正確性テスト
  - [x] ランキング生成ロジックのテスト
  - [x] ClaudeAI連携のモックテスト
  - [x] エラーハンドリングテスト

### 3.5.2 フロントエンド - チーム相性ページ

#### 3.5.2.1 相性データサービス (1日)
- [ ] `client/src/services/compatibility.service.ts` の作成
  - [x] チームメンバー相性API連携 (team.service.tsに実装済み)
  - [x] 運勢ランキングAPI連携 (team.service.tsに実装済み)
  - [x] エラーハンドリング
  - [x] キャッシュ戦略実装

#### 3.5.2.2 チーム相性ページコンポーネント (3日)
- [x] `client/src/pages/Team/Aisyou.tsx` の作成 (計画と異なりpages/Team/内に実装)
  - [x] ページレイアウト実装
  - [x] 認証・権限連携
  - [x] チームID取得処理
  - [x] ページナビゲーション
  - [x] エラーハンドリング

#### 3.5.2.3 運勢ランキングコンポーネント (2日)
- [x] 運勢ランキング機能の実装 (Aisyou.tsx内に直接実装)
  - [x] ランキングカード表示
  - [x] 五行属性に応じたカラー表示
  - [x] 自分のランキング強調表示
  - [x] レスポンシブデザイン対応
  - [x] アニメーション効果

#### 3.5.2.4 チームメンバーリストコンポーネント (2日)
- [x] チームメンバーリスト機能の実装 (Aisyou.tsx内に直接実装)
  - [x] メンバーカード表示
  - [x] 五行属性表示
  - [x] 「相性を見る」ボタン実装
  - [x] レスポンシブグリッドレイアウト

#### 3.5.2.5 相性詳細モーダルコンポーネント (3日)
- [x] 相性詳細モーダル機能の実装 (Aisyou.tsx内に直接実装)
  - [x] 相性情報表示（関係性タイプのみ）
  - [x] 五行関係の視覚化
  - [x] 詳細説明のマークダウン表示（Claude AIからの返答を整形）
  - [x] 「相談する」ボタン（将来連携用）
  - [x] アニメーション効果

#### 3.5.2.6 統合テスト (1日)
- [ ] E2Eテスト
  - [ ] ページロードと表示
  - [ ] データ取得フロー
  - [ ] モーダル表示と動作
  - [ ] レスポンシブ対応確認

## フェーズ4: 相性機能とAIチャットの実装

### 4.1 Compatibility API実装

#### 4.1.1 Compatibility コントローラー拡張 (2日)
- [ ] `server/src/controllers/compatibility.controller.ts` の拡張
  - [ ] 相性計算エンドポイント (`POST /api/compatibility`)
  - [ ] 相性取得エンドポイント (`GET /api/compatibility/:user1Id/:user2Id`)
  - [ ] ユーザーの全相性取得エンドポイント (`GET /api/users/:userId/compatibilities`)
  - [ ] チーム内相性一括取得エンドポイント (`GET /api/teams/:teamId/compatibilities`)
  - [ ] チーム相性マトリックス取得エンドポイント (`GET /api/teams/:teamId/compatibility/matrix`)
  - [ ] チーム相性分析レポート取得エンドポイント (`GET /api/teams/:teamId/compatibility/analysis`)

#### 4.1.2 Compatibility ルーティング (1日)
- [ ] `server/src/routes/compatibility.routes.ts` の作成
  - [ ] ルートの定義
  - [ ] 認証ミドルウェア連携
  - [ ] チームメンバー確認ミドルウェア
  - [ ] APIドキュメント用Swagger注釈追加

#### 4.1.4 ユニットテスト (2日)
- [ ] `server/src/tests/services/compatibility.service.test.ts` の作成
  - [ ] 五行相性計算の正確性テスト
  - [ ] チーム相性マトリックス生成テスト
  - [ ] チーム分析レポート生成テスト
- [ ] `server/src/tests/controllers/compatibility.controller.test.ts` の作成
  - [ ] エンドポイント統合テスト

#### 4.1.5 フロントエンド - チーム相性機能 (3日)
- [ ] `client/src/components/team/CompatibilityMatrix.tsx` の作成
  - [ ] マトリックス形式での相性表示
  - [ ] 色分けによる相性関係の視覚化
  - [ ] レスポンシブデザイン対応
- [ ] `client/src/components/team/CompatibilityAnalysis.tsx` の作成
  - [ ] チーム相性分析レポート表示
  - [ ] 強み・課題・アドバイスの表示
  - [ ] 詳細レポート表示モーダル

### 4.2 ChatHistory API実装

#### 4.2.1 Claude AI連携サービス (4日)
- [ ] `server/src/services/claude.service.ts` の作成
  - [ ] Claude AI API連携
  - [ ] コンテキスト構築ロジック
    - [ ] 運勢相談コンテキスト
    - [ ] チームメンバー相談コンテキスト
    - [ ] チーム目標相談コンテキスト
  - [ ] プロンプトエンジニアリング実装
  - [ ] レスポンス処理と構造化

#### 4.2.2 Chat コントローラー (3日)
- [ ] `server/src/controllers/chat.controller.ts` の作成
  - [ ] メッセージ送信エンドポイント (`POST /api/chat-history/:userId/messages`)
  - [ ] 会話履歴取得エンドポイント (`GET /api/chat-history/:userId`)
  - [ ] 会話クリアエンドポイント (`DELETE /api/chat-history/:userId`)
  - [ ] チャットタイプ変更エンドポイント (`PUT /api/chat-history/:userId/type`)
  - [ ] 相談相手選択エンドポイント (`PUT /api/chat-history/:userId/related-info`)

#### 4.2.3 Chat ルーティング (1日)
- [ ] `server/src/routes/chat.routes.ts` の作成
  - [ ] ルートの定義
  - [ ] 認証ミドルウェア連携
  - [ ] プラン利用制限ミドルウェア
  - [ ] APIドキュメント用Swagger注釈追加

#### 4.2.4 ユニットテスト (3日)
- [ ] `server/src/tests/services/claude.service.test.ts` の作成
- [ ] `server/src/tests/controllers/chat.controller.test.ts` の作成
- [ ] モックテストとエラーケース

### 4.3 フロントエンド - 相性表示

#### 4.3.1 相性データサービス (1日)
- [ ] `client/src/services/compatibility.service.ts` の作成
  - [ ] Compatibility APIとの通信機能実装
  - [ ] キャッシュ戦略実装

#### 4.3.2 相性表示コンポーネント (2日)
- [ ] `client/src/components/team/CompatibilityDisplay.tsx` の作成
  - [ ] 相性スコア表示
  - [ ] 五行関係の視覚化（相生・相克）
  - [ ] 相性詳細モーダル
  - [ ] アニメーション効果

#### 4.3.3 チームページへの統合 (1日)
- [ ] TeamMembersListコンポーネントに相性表示機能統合
- [ ] 相性フィルター機能追加
- [ ] メンバー詳細モーダルに相性情報表示追加

### 4.4 フロントエンド - AIチャット

#### 4.4.1 チャットデータサービス (2日)
- [ ] `client/src/services/chat.service.ts` の作成
  - [ ] Chat APIとの通信機能実装
  - [ ] WebSocketによるリアルタイム応答対応
  - [ ] 音声入力機能実装（Web Speech API）
  - [ ] メッセージ履歴管理

#### 4.4.2 チャットインターフェース (3日)
- [ ] `client/src/components/chat/ChatInterface.tsx` の作成
  - [ ] メッセージ表示UI
  - [ ] 入力フォームと送信機能
  - [ ] 音声入力ボタン
  - [ ] タイピングインジケーター
  - [ ] モード切替セレクター（個人/チームメイト/チーム目標）
  - [ ] 相談相手選択UI
  - [ ] マークダウンパーサーによるレスポンス表示

#### 4.4.3 AIチャットページ (2日)
- [ ] `client/src/pages/Chat/index.tsx` の作成
  - [ ] ChatInterfaceコンポーネント統合
  - [ ] チャットモード管理ロジック実装
  - [ ] チャット履歴ロード処理
  - [ ] チャットコンテキスト連携
  - [ ] プラン制限表示（ライトプラン用）

### 実装タスク優先順序（MVP対応）

1. **フェーズ1**: 四柱推命プロフィールと日柱データ実装 [完了済み]
2. **フェーズ2のMVP**: チーム基本機能（チーム作成、メンバー管理、基本的なチーム目標機能）
3. **フェーズ3**: デイリー運勢機能の実装
4. **フェーズ2の残り**: チーム機能の完全実装（チーム相性分析、統計機能など）
5. **フェーズ4**: 相性機能とAIチャットの実装

## 工程管理

ビジネスロジックの依存関係を考慮した実装フローを以下に示します。MVPアプローチに基づく実装順序は以下の通りです：

1. SajuProfile API → DayPillar API → SajuProfile表示コンポーネント [完了済み]
2. Team API（基本機能のみ） → チームの基本管理UI → TeamGoal API（基本機能のみ）
3. DailyFortune API → 運勢更新バッチ処理 → 運勢表示コンポーネント  
4. UserGoal API → 目標設定UI
5. Team API（高度な機能） → TeamGoal API（高度な機能） → チーム管理の高度なUI
6. Compatibility API → チーム相性UI
7. ChatHistory API → AIチャットインターフェース

重要な依存関係：
- チーム基本機能はデイリーフォーチュン機能の前提となるため、まずMVPバージョンを優先実装
- DailyFortune生成には、チームメンバーシップ情報が必要
- 高度な機能（詳細な相性分析など）はMVP後に実装

並行して進められるタスク：
- フロントエンドの基本コンポーネント実装
- 共通ユーティリティとエラーハンドリング機能

クリティカルパス上のタスク（最優先）：
- Team API基本実装（チーム作成とメンバー管理）
- DailyFortune生成サービス（コアビジネスロジック）