# DailyFortune TestLAB ガイドライン

## テスト方法の基本原則

1. **TypeScriptエラーがゼロの状態から始める**: テストを開始する前に必ずTypeScriptエラーが0であることを確認する
2. **データベース理解が最優先**: テスト作成前に必ずデータベースに接続し、コレクションの構造と実際のデータを確認する
3. **実データ把握**: モックを作る前に「実際に存在するデータ」を必ず確認し、そのデータに合わせてテストを設計する
4. **実認証**: 認証が必要な場合はまず実際にログインし、認証情報とユーザーデータの整合性を確認する
5. **実テスト**: 実データと実認証を使ってエンドポイントをテストする

**実践ルール**:
- テスト開始前に `cd server && npx tsc --noEmit` でTypeScriptエラーがないことを確認すること
- 新しいテスト作成時は必ず `node scripts/check-mongodb.js` などでデータベースの状況を確認すること
- エラーが発生した場合は、データベースの状態を最初に確認すること（データの有無、構造、型など）
- 複雑な条件分岐や回避策よりも、実データに基づくシンプルな実装を優先すること
- テスト失敗時は「テストを合わせる」のではなく「データの状態を把握する」こと

**重要**: モックを使用せず、実際のデータと環境を使用することで、本番環境に近いテスト結果を得ることができます。ただし、まず第一にTypeScriptエラーが0であることを確認し、次にデータを理解することが全ての基盤です。

---

このドキュメントはDailyFortuneプロジェクトのAIを活用したテスト環境(TestLAB)の中央管理ガイドラインです。複数のAIやテスト環境での開発を効率的に行うための標準プロセスを定義します。

## 1. 環境設定標準プロセス

### 1.1 環境変数と認証情報

- **環境変数ルール**: すべての環境変数はプロジェクトルートの`.env`ファイルに定義されています
- **環境変数の優先順位**: プロジェクトルート > サブディレクトリ > サンプル値
- **認証情報**:
  - Firebase認証情報は`.env`ファイルに定義されています:
    - **FIREBASE_SERVICE_ACCOUNT_PATH**: Firebase認証用JSONキーファイルの絶対パス（必須）
      - `/Users/tatsuya/Desktop/システム開発/DailyFortune/docs/scopes/sys-76614112762438486420044584-firebase-adminsdk-fbsvc-cfd0a33bc9.json`を使用してください
    - **FIREBASE_PROJECT_ID**: Firebaseプロジェクトのプロジェクトコード
    - **FIREBASE_CLIENT_EMAIL**: サービスアカウントのメールアドレス
  - **⚠️ 重要**: テスト環境でも本番環境と同じ認証情報を使用します。ダミー値やモック値を使用しないでください。
  - **テスト用認証情報**:
    - メールアドレス: `shiraishi.tatsuya@mikoto.co.jp`
    - パスワード: `aikakumei`
    - 権限: `super_admin`
  - MongoDB接続情報も`.env`ファイルで定義（MONGODB_URI）

### 1.1.1 秘密鍵とAPIキーの安全な取り扱い

- **⚠️ 重大な警告**: テストスクリプト内に秘密鍵やAPIキーを直接ハードコードしないでください
- **実装ルール**:
  1. すべての秘密鍵やAPIキーは`.env`ファイルにのみ保存する
  2. テストスクリプト内では必ず`process.env`から読み込む
  3. デフォルト値としても秘密情報を含めない
  4. 秘密情報を含むファイルは`.gitignore`に追加する

```typescript
// ❌ 危険: キーをハードコード（絶対にしないこと）
const CLAUDE_API_KEY = 'sk-ant-api03-XXXXXXXXXXXXXXX';

// ❌ 危険: デフォルト値にキーを設定（絶対にしないこと）
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || 'sk-ant-api03-XXXXXXXXXXXXXXX';

// ✅ 安全: 環境変数のみを使用
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!CLAUDE_API_KEY) {
  console.error('APIキーが設定されていません。.envファイルを確認してください。');
  process.exit(1);
}

// ✅ 安全: デフォルト値には秘密情報を含めない
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || 'API_KEY_NOT_SET';
```

- **理由**: 秘密情報をコードにハードコードすると、GitHubなどのバージョン管理システムに漏洩する可能性があり、セキュリティリスクが発生します。また、GitHubの自動セキュリティ検出により、プッシュが拒否される原因になります。

### 1.2 サーバー起動・停止プロセス

**起動前の確認事項**:
```bash
# ポートの使用状況を確認
lsof -i :8080

# 使用中の場合は停止
kill -9 <PID>
```

**起動方法**:
```bash
# サーバーディレクトリで
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server

# ビルド & 起動
npm run build && node dist/index.js
```

**停止方法**:
```bash
# Ctrl+C でターミナルプロセスを停止
# または別ターミナルから
lsof -i :8080
kill -9 <PID>
```

### 1.3 環境のリセット

```bash
# MongoDB接続をリセット
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
npm run db:reset  # ※実装必要

# ソースコードのリビルド
npm run build
```

## 2. テスト実行ガイドライン

### 2.1 モデルテスト

```bash
# 特定のモデルテストの実行
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
npm test src/tests/models/[モデル名].test.ts

# 全モデルテスト実行
npm test src/tests/models/
```

### 2.2 API統合テスト

```bash
# 特定のAPIテストの実行
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
npm test src/tests/api/[APIカテゴリ].test.ts

# 全APIテスト実行
npm test src/tests/api/
```

### 2.3 管理者APIテスト（実認証使用）

```bash
# 管理者API専用テスト実行スクリプト
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
./scripts/run-admin-tests.sh

# 個別の実認証テストファイルを実行
npm test -- --testPathPattern=src/tests/admin/real-auth-users.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-users-actions.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-fortune-update.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-fortune-logs.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-fortune-run.test.ts

# 実際の認証情報を使用してトークンを取得
node scripts/get-token.js shiraishi.tatsuya@mikoto.co.jp aikakumei
```

#### 2.3.1 管理者API実認証テスト

管理者APIテストでは実際のFirebase認証を使用する新しいアプローチを採用しています：

- **実認証テストファイル**:
  - `real-auth-users.test.ts`: ユーザー一覧取得API
  - `real-auth-users-actions.test.ts`: ユーザー権限・プラン変更API
  - `real-auth-fortune-update.test.ts`: 運勢更新設定API
  - `real-auth-fortune-logs.test.ts`: 運勢更新ログAPI
  - `real-auth-fortune-run.test.ts`: 手動運勢更新実行API

- **認証方法**:
  - テスト認証情報：`shiraishi.tatsuya@mikoto.co.jp`/`aikakumei`（SuperAdmin権限）
  - 専用のテストヘルパー：`withRealAuth()` 関数を使用してリクエストヘッダーに認証情報を追加
  - 認証トークン取得ツール：`get-token.js`で実際の認証トークンを取得可能

- **エラー処理**:
  - 認証情報が利用できない場合は適切にスキップして安全にテストを進行
  - モックトークンへのフォールバック機能があり、認証失敗時にもテストを継続可能

- **検証方法**:
  - API応答のステータスコードと構造を検証
  - 特定の条件下でのみ詳細な検証を実施（認証成功時）
  - データベースへの変更が実際に反映されているかも確認

**重要**: モックベースのテスト（users.test.ts, fortune-update.test.ts, users.complete.test.ts, fortune-update.complete.test.ts）は廃止され、実認証テスト（real-auth-*.test.ts）に置き換えられました。モックの維持が複雑で信頼性の低いテスト結果になるため、実認証テストを優先的に使用してください。

### 2.4 テスト記録

- 各テスト実行の記録はログファイルに保存
- ログディレクトリ: `/Users/tatsuya/Desktop/システム開発/DailyFortune/logs/tests/`

## 3. 問題デバッグガイド

### 3.1 一般的な問題と解決策

| 問題 | 解決策 |
|------|--------|
| MongoDB接続エラー | `.env`のMONGODB_URIを確認 |
| Firebase認証エラー | `.env`のFIREBASE_*変数を確認、特にFIREBASE_PRIVATE_KEYの改行文字(`\\n`) |
| ポート使用中エラー | `lsof -i :8080`で確認し`kill -9 <PID>`で解放 |
| データモデル型エラー | モデル定義とテストコードの型一致を確認 |
| コントローラーエラー | `UserRole`などの定義を確認。auth.middleware.tsから正しくインポートしているか確認 |
| Gitプッシュ拒否 | 秘密鍵・APIキーがコード内にハードコードされていないか確認し、削除する |

### 3.1.1 秘密情報によるGitプッシュ問題

Gitプッシュが「リポジトリルール違反」で拒否される場合は、以下の手順で対処してください：

1. **問題の特定**:
   ```bash
   # 秘密情報を含むファイルを検索
   grep -r -i "APIKey\|secret\|password\|token\|credential\|mongodb+srv\|sk-ant" --include="*.js" --include="*.ts" .
   ```

2. **修正方法**:
   - 秘密情報を含むファイルから直接ハードコードされた値を削除
   - 代わりに環境変数から読み込むよう変更
   - 該当ファイルを`.gitignore`に追加

3. **コミット履歴に秘密情報がある場合**:
   ```bash
   # ★重要★ 機密情報漏洩対策手順 (docs/gitrule.mdも参照)
   # 1. 現状の作業を外部バックアップ
   # 2. 新しいorphanブランチ作成
   git checkout --orphan clean-branch-new
   # 3. すべてのファイルをステージング
   git add .
   # 4. 機密ファイルをアンステージ
   git reset scripts/test-lucky-items/
   # 5. コミット
   git commit -m "安全なクリーンアップ: 機密情報除去"
   # 6. プッシュ
   git push -u origin clean-branch-new
   ```

このような問題を防ぐため、常にコード内に秘密情報をハードコードしないでください。

### 3.2 テスト失敗時のチェックリスト

1. TypeScriptエラーは0か（`npx tsc --noEmit`を実行して確認）
2. 環境変数は正しく読み込まれているか
3. MongoDB接続は成功しているか
4. Firebase認証情報は正しいか
5. ビルドは最新か（`npm run build`を実行済みか）
6. 既存のプロセスと競合していないか

## 4. AIアシスタント連携ガイドライン

### 4.1 AIへの指示標準フォーマット

```
## テスト目的
[テストの意図と目的を記述]

## 実行環境
- サーバー状態: [起動済み/停止中]
- 使用DB: [本番/テスト]
- 認証方法: [Firebase/テスト用]

## 実行手順
1. [手順1]
2. [手順2]
3. [...]

## 期待結果
[期待される出力または振る舞い]
```

### 4.2 AIの動作制限

- **サーバープロセス**: 既存のサーバーがある場合は停止してからテスト開始
- **環境変数**: 直接編集せず、必要なら上書きして一時的に使用
- **DB操作**: テスト用DBのみ使用し、本番データは参照のみ
- **ポート使用**: 8080, 3000, 3001以外のポートを使用する場合は明示的に指定

## 5. テスト実装規約

### 5.1 モデルテスト

```typescript
// テンプレート
import mongoose from 'mongoose';
import { ModelName } from '../../models/ModelName';

describe('ModelName Tests', () => {
  // 事前セットアップ (共通)
  beforeAll(async () => {
    // テスト用DB接続
  });

  afterAll(async () => {
    // 接続クローズ
  });

  beforeEach(async () => {
    // コレクションクリア
  });

  // テストケース
  it('should do something expected', async () => {
    // テスト実装
  });
});
```

### 5.2 APIテスト

```typescript
// テンプレート
import request from 'supertest';
import { app } from '../../app';
import { generateTestToken } from '../util/auth-helper';

describe('API Tests', () => {
  // 認証トークン準備
  let authToken: string;

  beforeAll(async () => {
    authToken = await generateTestToken(/* roleなど */);
  });

  // テストケース
  it('should return correct response', async () => {
    const response = await request(app)
      .get('/api/path')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    // その他のアサーション
  });
});
```

## 6. テスト管理システム

### 6.1 テスト実行結果の保存

テスト結果はJSON形式で保存し、実行日時・実行者・結果・パフォーマンスを記録:

```json
{
  "testId": "uuid-generated",
  "testName": "ModelName Tests",
  "timestamp": "2025-04-07T10:30:00Z",
  "executor": "AIアシスタント名",
  "status": "PASS/FAIL",
  "duration": 1250,
  "failedTests": [],
  "logs": "..."
}
```

### 6.2 AI実行記録

AIが実行した操作の記録:

```json
{
  "sessionId": "uuid-generated",
  "timestamp": "2025-04-07T10:30:00Z",
  "aiName": "AIアシスタント名",
  "commands": [
    {
      "command": "npm test src/tests/models/DailyFortuneUpdateLog.test.ts",
      "result": "PASS/FAIL",
      "duration": 1250
    }
  ],
  "modifications": [
    {
      "file": "/path/to/file",
      "type": "EDIT/CREATE/DELETE",
      "timestamp": "2025-04-07T10:31:00Z"
    }
  ]
}
```

## 7. リソース・参照情報

### 7.1 プロジェクト構造

```
/Users/tatsuya/Desktop/システム開発/DailyFortune/
  ├── server/                   # バックエンド
  │   ├── src/                  # ソースコード
  │   │   ├── config/           # 設定
  │   │   ├── controllers/      # コントローラー
  │   │   ├── middleware/       # ミドルウェア
  │   │   ├── models/           # データモデル
  │   │   ├── routes/           # ルーティング
  │   │   ├── tests/            # テスト
  │   │   └── index.ts          # エントリーポイント
  │   ├── dist/                 # ビルド済みコード
  │   └── .env                  # 環境変数（サーバー固有）
  ├── client/                   # フロントエンド
  ├── admin/                    # 管理画面
  ├── docs/                     # ドキュメント
  │   └── testlab.md            # このガイドライン
  ├── .env                      # 環境変数（プロジェクト全体）
  └── logs/                     # ログ
      └── tests/                # テスト実行ログ
```

### 7.2 重要なモデルと関連

- `User`: ユーザー情報
- `SajuProfile`: 四柱推命プロフィール
- `DailyFortune`: 日々の運勢データ
- `DailyFortuneUpdateLog`: 運勢更新ログ
- `Team`: チーム情報
- `Compatibility`: 相性データ

## 8. 緊急時の対応手順

### 8.1 テスト環境リセット

```bash
# 全環境リセット
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/
./scripts/reset-testlab.sh  # ※実装必要

# データベースのみリセット
cd server
npm run db:reset:test  # ※実装必要
```

### 8.2 サポート連絡先

- テスト環境の問題: [担当者名] ([連絡先])
- 認証関連の問題: [担当者名] ([連絡先])
- データモデル・API: [担当者名] ([連絡先])

### 8.3 管理者API実証試験ツール

**認証トークン取得**:
```bash
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
node scripts/get-token.js shiraishi.tatsuya@mikoto.co.jp aikakumei
```

**管理者APIテスト**:
```bash
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
./scripts/run-admin-tests.sh
```

## 9. データベース中心のテスト駆動開発（DB-TDD）アプローチ

DailyFortuneプロジェクトでは「データベース中心のテスト駆動開発（DB-TDD）」を採用しています。このアプローチは従来のTDDを拡張し、実際のデータベースとの対話を開発サイクルの中心に据えています。

### 9.1 DB-TDDの基本原則

1. **データ理解**: まずデータベースの実際の状態を正確に把握する（これが最優先）
2. **テスト設計**: 実データに基づいて適切なテストを設計する
3. **実装**: 実データに合わせた最小限の実装を行う
4. **検証**: 常にデータベースの実際の状態を確認しながら進める

### 9.2 開発・デバッグサイクル

以下のサイクルを繰り返すことで、堅牢で高品質なコードを効率的に開発します：

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│ 1. DB状態確認   │────▶│ 2. テスト設計   │────▶│ 3. 実装        │
│   (最重要)      │     │  (実データ基準) │     │                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
        ▲                                                 │
        │                                                 │
        │                                                 ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│ 6. ドキュメント │◀────│ 5. 再度DB検証   │◀────│ 4. テスト実行   │
│    と引き継ぎ   │     │  (常に確認)    │     │                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 9.3 テスト実装の基本方針

1. **データ確認を最優先**: コードを書く前に必ずデータベースを確認すること
   ```javascript
   // 良い例: テスト開始前にデータベース接続状態を確認
   beforeAll(async () => {
     console.log('データベース接続確認...');
     await checkDatabaseConnection();
     console.log('テスト対象データ確認...');
     const testData = await findTestData();
     console.log('確認済みデータ:', testData);
   });
   ```

2. **エラーが発生したらまずデータベースを確認**:
   ```javascript
   // 悪い例: ✘
   if (error) console.log('エラー発生:', error);
   
   // 良い例: ✓
   if (error) {
     console.log('エラー発生:', error);
     console.log('現在のDB状態を確認します...');
     const dbState = await checkDatabaseState();
     console.log('DB状態:', dbState);
   }
   ```

3. **複雑な条件分岐を避け、シンプルに保つ**:
   ```javascript
   // 悪い例: ✘
   if (!user) {
     user = await findAnotherUser();
     if (!user) {
       user = await createFakeUser();
     }
   }
   
   // 良い例: ✓
   const user = await findUser();
   if (!user) {
     console.log('テスト対象ユーザーが見つかりません - テストをスキップします');
     return;
   }
   ```

4. **データ構造をテスト前に明確に理解**:
   ```javascript
   // 良い例
   console.log('ユーザーデータの実際の構造:', Object.keys(user));
   console.log('_idの型:', typeof user._id, user._id instanceof mongoose.Types.ObjectId);
   ```

### 9.4 データベース検証のタイミング

**常にデータベースに接続して検証すべき状況**:

1. **テスト作成前**: まず最初にデータ構造とコンテンツを正確に理解する
2. **テスト実行前**: テストが使用するデータが実際に存在するか確認する
3. **テスト失敗時**: まずデータベースの状態を確認し、テストの想定と実際の差異を特定する
4. **コードの複雑化を感じたとき**: データ構造に立ち返ってシンプルな解決策を模索する
5. **リファクタリング前後**: 実データに基づいてリファクタリングの効果を確認する
6. **ヘッドスクラッチモーメント**: 頭を掻きたくなったときは、データを可視化して理解を深める

**ポイント**: テストが複雑化する前に、データ構造を完全に理解することで、シンプルな解決策が見えてきます。

### 9.5 実用的なDB検証コマンド

**テスト作成・修正前に必ず実行すべきコマンド**:

```bash
# MongoDB接続して全体構造を確認（これが最優先）
cd server && node scripts/check-mongodb.js

# 特定コレクションの内容を詳細確認（実データ構造理解）
cd server && node scripts/check-mongodb-collections.js users

# データ型を詳細に確認（_idの型、参照の型を把握）
cd server && node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune').then(async () => { console.log('Connected to MongoDB'); const user = await mongoose.connection.collection('users').findOne({}); console.log('User structure:', JSON.stringify({id_type: typeof user._id, keys: Object.keys(user)})); mongoose.disconnect(); })"

# 各種データ確認コマンド
cd server && node scripts/check-user-info.ts "Bs2MacLtK1Z1fVnau2dYPpsWRpa2"
cd server && node scripts/check-saju-profiles.ts "Bs2MacLtK1Z1fVnau2dYPpsWRpa2"
cd server && node scripts/check-team-member-cards.ts "67f4fe4bfe04b371f21576f7" "Bs2MacLtK1Z1fVnau2dYPpsWRpa2"
```

**テスト実装前のチェックリスト**:

1. [ ] データベース接続確認: `node scripts/check-mongodb.js`
2. [ ] テスト対象コレクション構造確認: `node scripts/check-mongodb-collections.js コレクション名`
3. [ ] 実データの_id型確認: String型かObjectId型か
4. [ ] テスト対象ユーザー確認: 実際に存在するユーザーを特定
5. [ ] 関連データ確認: テスト対象データに関連する他のデータを確認

**エラー発生時のチェックリスト**:

1. [ ] データベース接続状態確認
2. [ ] データ型の不一致確認（特に_id型）
3. [ ] 参照整合性確認（存在しない外部キーを参照していないか）
4. [ ] コレクションの実際の構造とスキーマの不一致確認
5. [ ] テスト前提条件の確認（テストが期待するデータが実際にあるか）

**重要**: テスト実装で悩んだら、必ずデータベースの実際の状態に立ち返ること。これが最も効率的な問題解決方法です。

### 9.6 DB検証用スクリプトの作成規約

**新機能実装前には必ずデータ確認用スクリプトを先に作成すること**。これは「データ理解を最優先」の原則に基づいています。

```typescript
// scripts/check-feature-data.ts の理想的なテンプレート
import mongoose from 'mongoose';
import { config } from 'dotenv';

// 環境変数読み込み
config();

// DB接続
async function checkData() {
  try {
    console.log('MongoDB接続を試みます...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('MongoDB接続成功');
    
    // 1. コレクション存在確認
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('利用可能なコレクション:', collections.map(c => c.name));
    
    // 2. 引数処理（柔軟なクエリに対応）
    const query = process.argv[2] ? JSON.parse(process.argv[2]) : {};
    console.log('使用クエリ:', query);
    
    // 3. サンプルデータ取得と構造解析
    const collection = process.argv[3] || 'yourCollection';
    const data = await mongoose.connection.collection(collection).findOne(query);
    
    if (data) {
      // 4. データ構造・型の詳細分析（テスト作成に不可欠）
      console.log('データ構造:');
      console.log('- ID型:', typeof data._id);
      console.log('- フィールド一覧:', Object.keys(data));
      
      // 5. 値の例示（どんな値が格納されているか）
      Object.entries(data).forEach(([key, value]) => {
        const type = Array.isArray(value) ? `Array(${value.length})` : typeof value;
        const sample = value === null ? 'null' : 
                      typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : 
                      String(value).substring(0, 50);
        console.log(`- ${key}: [${type}] ${sample}`);
      });
      
      // 6. 関連データへの参照確認
      const refs = Object.entries(data)
        .filter(([k, v]) => k.endsWith('Id') || k.endsWith('_id'))
        .map(([k, v]) => ({field: k, value: v}));
      
      if (refs.length > 0) {
        console.log('参照フィールド:', refs);
      }
    } else {
      console.log(`${collection}内にデータが見つかりません`);
    }
    
    await mongoose.disconnect();
    console.log('MongoDB切断');
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

checkData();
```

**必須要素**:
1. コレクション一覧の確認
2. データ構造と型の詳細分析
3. 参照関係の把握
4. 実際の値の例示

### 9.7 テスト前にすべきDB検証作業

1. **接続テスト**: データベースに接続できるか確認
   ```bash
   node -e "require('mongoose').connect(process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune').then(() => console.log('成功')).catch(e => console.error('接続エラー:', e))"
   ```

2. **データ存在確認**: テストに必要なデータが存在するか確認
   ```bash
   # ユーザー確認の例
   cd server && node scripts/check-mongodb-collections.js users
   ```

3. **データ構造確認**: 特にIDフィールドの型確認
   ```bash
   # シンプルなデータ構造確認
   node -e "const mongoose=require('mongoose'); mongoose.connect(process.env.MONGODB_URI||'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune').then(async()=>{const d=await mongoose.connection.collection('users').findOne({});console.log({_id_type:typeof d._id,_id:d._id,fields:Object.keys(d)});mongoose.disconnect()})"
   ```

4. **テスト前提条件確認**: テストが期待するデータ状態を確認

**重要**: データ確認をショートカットせず、必ず上記ステップを踏むこと。これにより、テスト実装がスムーズになり、無駄な試行錯誤を避けられます。

### 9.8 エラー時の対応フロー

テストでエラーが発生した場合は、以下のフローに従って対応します：

1. データベース接続確認
2. データの存在確認
3. データの構造（特に_id型）確認
4. テストコードの修正（データ型や構造に合わせる）
5. 再テスト

```
データベース確認 → テスト修正 → 再テスト
```

この循環を繰り返すことで、最終的に強固なテストを実装できます。決して逆のアプローチ（テストを先に書いてデータを後回し）を取らないでください。

DB-TDDアプローチでは、データ理解を最優先することで、堅牢で信頼性の高いテストを効率的に開発できます。データ構造を常に把握し、それに合わせたテスト実装を行うことが成功の鍵です。

---

**注意**: このガイドラインは継続的に更新されます。最新バージョンを参照してください。

**最終更新**: 2025-04-13


 モックデータを作る前に　とありますがこれはデータベースにモックデータを入れるということですか？