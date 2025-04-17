# DailyFortune TestLAB 概要

DailyFortune TestLABは複数のAIアシスタントを活用したテスト・開発環境の中央管理システムです。AIによる開発支援を効率化し、一貫した開発・テストプロセスを提供します。

## テスト実行の前提条件

テスト実行を始める前に、以下の前提条件を必ず確認してください：

1. **TypeScriptエラーの確認**：テストを開始する前に、TypeScriptエラーが0であることを確認します
   ```bash
   cd server && npx tsc --noEmit
   ```
   エラーがある場合は、先にそれらを修正してからテストを実行してください。

2. **環境変数の確認**：必要な環境変数がすべて設定されていることを確認します
3. **データベース接続の確認**：MongoDB接続が正常に機能していることを確認します

`setup-testlab.sh` スクリプトは自動的にTypeScriptエラーをチェックし、エラーがある場合は警告を表示します。

## 現在のテスト状況

### 成功しているテスト
- **実認証テスト**: すべての実認証テストが正常に動作しています
  - `real-auth-users.test.ts`: ユーザー一覧取得API
  - `real-auth-users-actions.test.ts`: ユーザー権限・プラン変更API
  - `real-auth-fortune-update.test.ts`: 運勢更新設定API
  - `real-auth-fortune-logs.test.ts`: 運勢更新ログAPI
  - `real-auth-fortune-run.test.ts`: 手動運勢更新実行API
- **基本モデルテスト**: 
  - `simple-admin.test.ts`: モデル単体テスト

### 失敗しているテスト
- **モックテスト**: Firebase認証のモック処理に問題があり失敗しています
  - `users.test.ts`: モックでの認証トークン検証が機能していない
  - `fortune-update.test.ts`: TypeScriptエラーと認証トークン検証の問題
  - `users.complete.test.ts`: モックオブジェクトの動作に問題がある
  
## 優先すべきテスト戦略

当プロジェクトでは、**実認証テスト**を優先すべきです。理由は以下の通りです：

1. **信頼性**: 実認証テストは実際のFirebase認証を使用しており、本番環境に近い条件でテストを実行できる
2. **保守性**: モックの維持・更新は複雑で、Firebase SDKの変更に追従するのが難しい
3. **テスト効率**: モックテストで発生する型エラーやモック設定の問題が回避できる
4. **コード網羅率**: 実認証テストは実際の認証処理を通るため、コード網羅率が向上する

## 利用可能なスクリプト

| スクリプト | 説明 | 使用方法 |
|----------|------|---------|
| `setup-testlab.sh` | テスト環境の初期セットアップ | `./server/scripts/setup-testlab.sh` |
| `reset-testlab.sh` | 環境のリセットと再構築 | `./server/scripts/reset-testlab.sh` |
| `run-test.sh` | テスト実行とログ記録 | `./server/scripts/run-test.sh [テストファイルパス]` |
| `run-admin-tests.sh` | 管理者API専用テスト実行 | `./server/scripts/run-admin-tests.sh` |
| `get-token.js` | 認証トークン取得ツール | `node ./server/scripts/get-token.js [メール] [パスワード]` |

## 実認証テストの実行方法

実認証テストを実行するには、以下のコマンドを使用します：

```bash
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
./scripts/run-admin-tests.sh
```

または個別のテストを実行する場合：

```bash
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
npm test -- --testPathPattern=src/tests/admin/real-auth-users.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-users-actions.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-fortune-update.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-fortune-logs.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-fortune-run.test.ts
```

## 環境要件

- Node.js v16以上
- MongoDB 4.4以上
- Firebase Admin SDK設定済み
  - **⚠️ 重要**: テスト環境でも本番環境と同じFirebase認証情報を使用します
  - FIREBASE_SERVICE_ACCOUNT_PATH環境変数に有効なJSONキーファイルのパスを設定してください
  - テストでダミー値やモック値を使用せず、本物の認証情報を使用してください
  - **認証情報**: 
    - メール: `shiraishi.tatsuya@mikoto.co.jp`
    - パスワード: `aikakumei`
    - 権限: `SuperAdmin`
    - JSONキーファイル: `/Users/tatsuya/Desktop/システム開発/DailyFortune/docs/scopes/sys-76614112762438486420044584-firebase-adminsdk-fbsvc-cfd0a33bc9.json`
- 環境変数は`.env`ファイルに定義

## 今後の課題

1. テストの自動化と継続的インテグレーションの設定
2. テスト環境のクリーンアップと独立性の強化
3. テストカバレッジの向上
4. モックテストから実認証テストへの完全移行

## データベース中心のテスト駆動開発（DB-TDD）

DailyFortuneプロジェクトでは「データベース中心のテスト駆動開発（DB-TDD）」を採用しています。このアプローチは以下の特徴を持ちます：

1. **実データ検証**: すべてのテストステップでデータベースの実際の状態を確認
2. **TDDサイクルの拡張**: レッド→グリーン→リファクタリング→データ検証
3. **検証スクリプト**: 各機能に対応するデータベース検証スクリプトを作成
4. **エラー時の検証**: エラー発生時には必ずデータベースの状態を直接確認

### DB検証の主要コマンド

```bash
# MongoDB接続（テスト環境）
cd server && node scripts/check-mongodb.js

# 特定コレクションの内容確認
cd server && node scripts/check-mongodb-collections.js User

# 特定ユーザーの情報確認
cd server && node scripts/check-user-info.ts "Bs2MacLtK1Z1fVnau2dYPpsWRpa2"
```

DB-TDDアプローチを徹底することで、「動く」だけでなく「正しく動く」コードを効率的に開発できます。

## 詳細ドキュメント

完全なガイドラインと詳細な使用方法については、[TestLAB詳細ドキュメント](./testlab.md)を参照してください。