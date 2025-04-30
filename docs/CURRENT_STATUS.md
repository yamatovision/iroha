# iroha（いろは）実装マスターインデックス

このドキュメントは、irohaプロジェクトの実装状況と計画を一元管理します。データフローと依存関係を考慮し、各機能の実装順序を明確化しています。

## 1. 実装概要と進捗

| アプリケーション | 完了率 | 状態 |
|----------------|-------|------|
| SuperAdmin管理サイト | 5% | ログイン画面実装済み |
| サロン管理者サイト（Admin） | 0% | 未着手 |
| スタイリスト用モバイルアプリ（Client） | 40% | 基盤機能実装済み |

**全体進捗**: 7/21 機能完了 (33%)  
**最終更新日**: 2025/4/30

## 2. 実装優先順位順の機能リスト

### SuperAdmin管理サイト

#### 0. ログイン画面
- **状態**: ✅ 完了
- **API仕様**: [jwt-auth.routes.ts](/server/src/routes/jwt-auth.routes.ts)
- **依存関係**: なし
- **主要機能**:
  - JWT認証による管理者ログイン
  - SuperAdmin権限の検証
  - トークン管理（生成、リフレッシュ）
  - セキュアなパスワード認証

#### 1. 組織管理画面（メイン画面）
- **状態**: ❌ 未着手
- **API仕様**: 
  - [superadmin.md](/docs/api/superadmin.md)
  - [superadmin-role-v2.md](/docs/api/superadmin-role-v2.md)
  - [admin-role-expansion.md](/docs/api/admin-role-expansion.md)
- **依存関係**: 認証システム
- **主要機能**:
  - シンプルなメニュー構成
  - 統計情報表示
  - 組織の検索とフィルタリング
  - 組織の一括操作
  - 新規組織登録と初期オーナー設定

#### 2. 課金・プラン管理画面
- **状態**: ❌ 未着手
- **実装ガイド**: [beauty-superadmin-plans.md](/docs/implementation/beauty-superadmin-plans.md)
- **API仕様**: [superadmin-plans.md](/docs/api/superadmin-plans.md)
- **依存関係**: 組織管理
- **主要機能**:
  - 収益シミュレーション
  - プラン設定
  - 請求管理

#### 3. サポートチケット管理画面（SuperAdmin用）
- **状態**: ❌ 未着手
- **API仕様**: [support.md](/docs/api/support.md)
- **依存関係**: 組織管理
- **主要機能**:
  - 全組織からのチケット一元管理
  - シンプルな検索機能
  - 会話形式のチケット詳細表示
  - テキスト返信機能

### サロン管理者サイト（Admin）

#### 4. スタイリスト管理
- **状態**: ❌ 未着手
- **実装ガイド**: 
  - [beauty-stylist-management.md](/docs/implementation/beauty-stylist-management.md)
  - [beauty-stylist-management-update.md](/docs/implementation/beauty-stylist-management-update.md)
- **API仕様**: [stylist-management.md](/docs/api/stylist-management.md)
- **依存関係**: 認証システム、組織管理
- **主要機能**:
  - スタイリスト一覧表示
  - アカウント作成・編集・削除
  - 権限設定
  - 四柱推命情報の閲覧

#### 5. クライアント管理
- **状態**: ❌ 未着手
- **実装ガイド**: [beauty-client-management.md](/docs/implementation/beauty-client-management.md)
- **API仕様**: [client-management.md](/docs/api/client-management.md)
- **依存関係**: 認証システム、スタイリスト管理
- **主要機能**:
  - クライアント一覧表示
  - 四柱推命情報の自動計算と統合
  - スタイリストとの相性診断
  - 顧客メモと時系列記録
  - 検索・フィルタリング

#### 6. データインポート
- **状態**: ❌ 未着手
- **実装ガイド**: [beauty-data-import.md](/docs/implementation/beauty-data-import.md)
- **API仕様**: [beauty-data-import.md](/docs/api/beauty-data-import.md)
- **依存関係**: クライアント管理
- **主要機能**:
  - Googleカレンダー連携
  - iCloudカレンダー連携
  - CSVファイルアップロードとインポート
  - インポート履歴と結果管理

#### 7. 管理者ダッシュボード
- **状態**: ❌ 未着手
- **実装ガイド**: [admin-dashboard.md](/docs/implementation/admin-dashboard.md)
- **API仕様**: [admin-dashboard.md](/docs/api/admin-dashboard.md)
- **依存関係**: クライアント管理、スタイリスト管理
- **主要機能**:
  - スタイリスト・クライアント数表示
  - 今日の予約数表示
  - GPT-4oトークン使用状況グラフ
  - 未担当予約の一覧表示と割り当て管理

#### 8. 予約・担当管理
- **状態**: ❌ 未着手
- **実装ガイド**: [beauty-appointment-management.md](/docs/implementation/beauty-appointment-management.md)
- **API仕様**: [appointment-management.md](/docs/api/appointment-management.md)
- **依存関係**: クライアント管理、スタイリスト管理
- **主要機能**:
  - 日付別クライアント一覧表示
  - 各カードに担当者選択機能
  - 未割り当て予約のフィルタリング
  - 相性順のスタイリスト提案
  - タイムスロット調整
  - カレンダー連携機能

#### 9. 請求・支払い管理
- **状態**: ❌ 未着手
- **実装ガイド**: [beauty-admin-billing.md](/docs/implementation/beauty-admin-billing.md)
- **API仕様**: [billing.md](/docs/api/billing.md)
- **依存関係**: スタイリスト管理、プラン管理
- **主要機能**:
  - 現在のプラン概要表示
  - APIトークン使用状況の視覚的表示
  - 追加チャージ済みトークンの表示
  - プラン詳細情報の表示
  - プラン変更機能
  - 支払い方法の管理

#### 10. サポート管理（サロン用）
- **状態**: ❌ 未着手
- **実装ガイド**: [support-system.md](/docs/implementation/support-system.md)
- **API仕様**: [support.md](/docs/api/support.md)
- **依存関係**: 認証システム
- **主要機能**:
  - サポートチケット一覧表示
  - 新規チケット作成フォーム
  - チケット詳細と会話履歴
  - 返信機能
  - ステータス管理

### スタイリスト用モバイルアプリケーション（Client）

#### 11. ログイン・登録ページ `/login`
- **状態**: ✅ 完了
- **API仕様**: [auth.md](/docs/api/auth.md)
- **依存関係**: スタイリスト管理
- **主要機能**:
  - アカウントログイン
  - パスワードリセット

#### 12. プロフィール設定 `/profile`
- **状態**: ✅ 完了
- **API仕様**: [saju-profile.md](/docs/api/saju-profile.md)
- **依存関係**: 認証システム
- **主要機能**:
  - 基本情報表示・編集
  - 命式情報表示
  - パスワード変更
  - 通知設定

#### 13. 運勢ページ `/fortune`
- **状態**: ✅ 完了
- **API仕様**: [fortune.md](/docs/api/fortune.md)
- **依存関係**: 四柱推命プロフィール、日柱情報
- **主要機能**:
  - 今日の運勢スコアと詳細表示
  - 施術に関連するアドバイス表示
  - ラッキーアイテム表示

#### 14. 本日の施術クライアント一覧
- **状態**: ❌ 未着手
- **実装ガイド**: [beauty-daily-clients.md](/docs/implementation/beauty-daily-clients.md)
- **API仕様**: [daily-clients.md](/docs/api/daily-clients.md)
- **依存関係**: クライアント管理、予約管理
- **主要機能**:
  - クライアント一覧（時間順）
  - 各クライアントの五行属性表示
  - クライアントとの相性スコア表示
  - クリックで詳細表示

#### 15. クライアントプロフィール
- **状態**: ❌ 未着手
- **実装ガイド**: クライアント詳細モーダル（beauty-daily-clients内）
- **API仕様**: [client-management.md](/docs/api/client-management.md)
- **依存関係**: クライアント管理
- **主要機能**:
  - 基本情報表示（名前、性別、連絡先等）
  - 四柱推命プロフィール表示
  - 性格特性と施術アドバイス
  - 施術履歴一覧

#### 16. 一般チャット相談 `/chat`
- **状態**: ✅ 完了
- **API仕様**: [chat.md](/docs/api/chat.md)
- **依存関係**: 四柱推命プロフィール
- **主要機能**:
  - 自由なテキスト入力
  - コンテキスト選択
  - 相談履歴表示
  - ナレッジベースとしての活用

#### 17. クライアント専用チャット
- **状態**: ⚠️ 進行中
- **実装ガイド**: [beauty-client-chat.md](/docs/implementation/beauty-client-chat.md)
- **API仕様**: [beauty-client-chat.md](/docs/api/beauty-client-chat.md)
- **依存関係**: AIチャット機能、クライアント管理
- **主要機能**:
  - クライアント情報の自動コンテキスト設定
  - 当日の日柱情報に基づくアドバイス
  - ヘアスタイル・カラーのパーソナライズされた提案
  - クライアント別の会話履歴の永続化

#### 18. クライアント直接入力・結果表示
- **状態**: ❌ 未着手
- **実装ガイド**: [beauty-client-input.md](/docs/implementation/beauty-client-input.md)
- **API仕様**: [beauty-client-input.md](/docs/api/beauty-client-input.md)
- **依存関係**: 四柱推命プロフィール
- **主要機能**:
  - 生年月日・時間の簡易入力フォーム
  - 性別選択
  - 命式計算と五行属性の即時表示
  - パーソナライズされたヘアスタイル・カラー提案
  - 結果の保存・共有機能

## 3. 実際の実装状況

| # | 機能名 | 状態 | アプリ |
|---|-------|------|-------|
| 0 | ログイン画面 | ✅ 完了 | SuperAdmin |
| 1 | 組織管理画面 | ❌ 未着手 | SuperAdmin |
| 2 | 課金・プラン管理画面 | ❌ 未着手 | SuperAdmin |
| 3 | サポートチケット管理画面（SuperAdmin） | ❌ 未着手 | SuperAdmin |
| 4 | スタイリスト管理 | ❌ 未着手 | Admin |
| 5 | クライアント管理 | ❌ 未着手 | Admin |
| 6 | データインポート | ❌ 未着手 | Admin |
| 7 | 管理者ダッシュボード | ❌ 未着手 | Admin |
| 8 | 予約・担当管理 | ❌ 未着手 | Admin |
| 9 | 請求・支払い管理 | ❌ 未着手 | Admin |
| 10 | サポート管理（サロン用） | ❌ 未着手 | Admin |
| 11 | ログイン・登録ページ | ✅ 完了 | Client |
| 12 | プロフィール設定 | ✅ 完了 | Client |
| 13 | 運勢ページ | ✅ 完了 | Client |
| 14 | 本日の施術クライアント一覧 | ❌ 未着手 | Client |
| 15 | クライアントプロフィール | ❌ 未着手 | Client |
| 16 | 一般チャット相談 | ✅ 完了 | Client |
| 17 | クライアント専用チャット | ⚠️ 進行中 | Client |
| 18 | クライアント直接入力・結果表示 | ❌ 未着手 | Client |

## 4. 実装時の依存関係と注意点

### データフロー図
```
[組織管理(1)] → [課金管理(2)] → [スタイリスト管理(4)] → [クライアント管理(5)]
                                          ↓                    ↓
                                  [ログイン・プロフィール(11,12)]  ↓
                                          ↓                    ↓
                        [運勢(13)]←[四柱推命データ]            ↓
                            ↓                              ↓
[予約管理(8)]←[本日のクライアント(14)]←[クライアントプロフィール(15)]
        ↓
[チャット機能(16,17)]
```

### 実装時の注意点
1. **データの一貫性**:
   - 組織→スタイリスト→クライアントの階層構造を維持
   - ID参照の整合性を確保（特にMongoDBでの参照）

2. **認証とアクセス制御**:
   - SuperAdmin、サロン管理者、スタイリストの権限階層を明確に実装
   - 各APIエンドポイントでの権限チェックを徹底

3. **開発効率化のポイント**:
   - スタイリスト管理とクライアント管理は類似したUIパターンを持つため、共通コンポーネントを活用
   - チャット機能は汎用コンポーネントとして実装し、一般チャットとクライアント専用チャットで再利用

4. **リスク要因**:
   - カレンダー連携（Google/Apple）は技術的複雑性が高い
   - トークン使用量管理は課金に直結するため慎重に実装

## 5. 次に実装すべき機能

現状の実装状況を考慮すると、以下の順序で実装を進めることを推奨します：

1. **第一優先**: クライアント専用チャット (17) の完成
   - 既に進行中であり、完了させることで価値を提供できる
   - 一般チャット機能の拡張として効率的に実装可能

2. **第二優先**: 組織管理画面 (1) とスタイリスト管理 (4)
   - データフローの上流部分を確立
   - 他の機能の前提条件となるため早期に完成させるべき

3. **第三優先**: クライアント管理 (5) と本日の施術クライアント一覧 (14)
   - スタイリストが実際に業務で使用する中核機能
   - 美容サロンの日常業務をサポートする実用的な機能

## 6. SuperAdmin管理サイト実装計画

### 6.1 ディレクトリ構造

プロジェクトはフロントエンドとバックエンドを分離した構成で実装します。

```
/
├── superadmin/            # SuperAdmin管理サイト（フロントエンド）
│   ├── .env               # 環境変数設定
│   ├── .env.example       # 環境変数サンプル
│   ├── index.html         # エントリーポイントHTML
│   ├── package.json       # 依存パッケージ定義
│   ├── tsconfig.json      # TypeScript設定
│   ├── vite.config.ts     # Vite設定
│   ├── src/
│   │   ├── App.tsx        # メインアプリケーションコンポーネント
│   │   ├── main.tsx       # アプリケーションエントリーポイント
│   │   ├── index.css      # グローバルスタイル
│   │   ├── components/    # 共通コンポーネント
│   │   │   ├── common/    # 汎用コンポーネント
│   │   │   │   ├── ConfirmDialog.tsx        # 確認ダイアログ
│   │   │   │   ├── LoadingIndicator.tsx     # ローディング表示
│   │   │   │   └── SuperAdminRoute.tsx      # 保護されたルート
│   │   │   ├── layout/    # レイアウト関連
│   │   │   │   ├── SuperAdminLayout.tsx     # 管理サイトレイアウト
│   │   │   │   ├── SuperAdminMenu.tsx       # 左側メニュー
│   │   │   │   └── SuperAdminUserMenu.tsx   # ユーザーメニュー
│   │   │   └── dashboard/ # ダッシュボード関連
│   │   │       ├── StatsCard.tsx            # 統計情報カード
│   │   │       ├── OrganizationsTable.tsx   # 組織一覧テーブル
│   │   │       └── StatusBadge.tsx          # ステータスバッジ
│   │   ├── config/        # 設定
│   │   │   └── constants.ts                 # 定数定義
│   │   ├── contexts/      # コンテキスト
│   │   │   ├── AuthContext.tsx              # 認証コンテキスト
│   │   │   └── NotificationContext.tsx      # 通知コンテキスト
│   │   ├── pages/         # ページコンポーネント
│   │   │   ├── Dashboard/                   # ダッシュボード(組織管理)
│   │   │   │   ├── index.tsx                # ダッシュボードメイン
│   │   │   │   ├── OrganizationDetails.tsx  # 組織詳細モーダル
│   │   │   │   └── CreateOrganization.tsx   # 組織作成フォーム
│   │   │   ├── Login/                       # ログイン
│   │   │   │   └── index.tsx                # ログインページ
│   │   │   ├── BillingManagement/           # 課金・プラン管理
│   │   │   │   ├── index.tsx                # 課金管理メイン
│   │   │   │   ├── RevenueSimulation.tsx    # 収益シミュレーション
│   │   │   │   ├── PlanSettings.tsx         # プラン設定
│   │   │   │   └── InvoiceManagement.tsx    # 請求書管理
│   │   │   ├── Support/                     # サポート管理
│   │   │   │   ├── index.tsx                # サポートチケット一覧
│   │   │   │   └── TicketDetails.tsx        # チケット詳細・返信
│   │   │   └── Unauthorized/                # 未認証ページ
│   │   │       └── index.tsx                # 未認証エラー表示
│   │   ├── services/      # サービス
│   │   │   ├── api.service.ts               # API通信
│   │   │   ├── auth.service.ts              # 認証サービス
│   │   │   ├── organizations.service.ts     # 組織サービス
│   │   │   ├── billing.service.ts           # 課金サービス
│   │   │   └── support.service.ts           # サポートサービス
│   │   └── types/         # 型定義
│   │       ├── index.ts                     # 共通型定義
│   │       ├── api.types.ts                 # API関連型定義
│   │       └── auth.types.ts                # 認証関連型定義
│   └── public/           # 静的ファイル
│       ├── favicon.ico    # ファビコン
│       └── logo.svg       # ロゴ
│
└── server/                # 既存のサーバーサイド実装と統合
    └── src/
        ├── controllers/   # 既存コントローラーに追加
        │   └── superadmin/
        │       ├── organizations.controller.ts    # 組織管理
        │       ├── billing.controller.ts          # 課金管理
        │       └── support.controller.ts          # サポート管理
        ├── routes/        # 既存ルートに追加
        │   └── superadmin.routes.ts               # SuperAdmin APIルート
        ├── models/        # 既存モデルを活用
        │   └── (Organization, User, etc.)
        ├── middleware/    # 既存ミドルウェアに追加
        │   └── superadmin-auth.middleware.ts      # SuperAdmin権限チェック
        └── services/      # 既存サービスに追加
            └── superadmin/
                ├── organization.service.ts        # 組織管理サービス
                ├── billing.service.ts             # 課金サービス
                └── support.service.ts             # サポートサービス
```

### 6.2 実装計画

1. **基盤構築** (2日) ✅
   - プロジェクト初期化（React + TypeScript + Vite）✅
   - ディレクトリ構造セットアップ ✅
   - 基本的なルーティング設定 ✅

2. **認証機能実装** (3日) ✅
   - JWT認証実装 ✅
   - SuperAdminRouteコンポーネント実装 ✅
   - ログインページ実装 ✅

3. **組織管理機能実装** (5日)
   - ダッシュボード画面実装
   - 組織一覧表示機能
   - 組織詳細表示モーダル
   - 組織作成・編集機能
   - 組織ステータス管理機能

4. **課金・プラン管理実装** (4日)
   - 収益シミュレーション機能
   - プラン設定画面
   - 請求書管理画面

5. **サポート管理実装** (3日)
   - チケット一覧表示
   - チケット詳細・会話表示
   - 返信機能

6. **テストとバグ修正** (3日)
   - 単体テスト実施
   - 統合テスト実施
   - バグ修正

合計: 約3週間（20営業日）

## 7. 参考資料

- [要件定義書](/docs/requirements.md) - プロジェクト全体の要件定義
- [実装順序計画](/docs/implementation_order.md) - データ依存関係に基づく実装順序
- [実装タスク詳細計画](/docs/implementation_tasks.md) - 詳細なタスクブレークダウン
- [技術スタック](/docs/tech_stack.md) - 使用技術とライブラリの概要
- [データモデル](/docs/data_models.md) - データベースモデルの定義