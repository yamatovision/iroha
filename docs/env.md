# 環境変数リスト

このドキュメントでは、DailyFortuneアプリケーションで使用する環境変数の一覧を提供します。以下の環境変数は開発環境と本番環境の両方で適切に設定する必要があります。

## 使用方法

- 開発環境: `.env`ファイルを各アプリケーションのルートディレクトリに作成
- 本番環境: デプロイプラットフォーム（Cloud Run、Firebase等）の環境変数設定で構成

## ステータス表記

- [ ] - 未設定の環境変数
- [x] - 設定済みの環境変数
- [!] - 重要度が高い環境変数

## バックエンド環境変数 (server/.env)

### データベース設定

[ ] `MONGODB_URI` - MongoDB接続文字列
```
例: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dailyfortune?retryWrites=true&w=majority
```

[ ] `DB_NAME` - データベース名
```
例: dailyfortune
```

### サーバー設定

[ ] `PORT` - サーバーが使用するポート番号
```
例: 8080
```

[ ] `NODE_ENV` - アプリケーション実行環境
```
例: development, production, test
```

[ ] `API_BASE_URL` - APIのベースURL（CORSとリダイレクト用）
```
例: http://localhost:8080/api/v1 （開発環境）
例: https://api.dailyfortune.example.com/api/v1 （本番環境）
```

[ ] `LOG_LEVEL` - ロギングレベル
```
例: debug, info, warn, error
```

### 認証設定

[!] `JWT_SECRET` - JWTトークン生成用のシークレットキー
```
例: your-super-secret-jwt-key-that-should-be-long-and-random
```

[ ] `JWT_EXPIRES_IN` - JWTトークンの有効期限
```
例: 1d （1日）
```

[ ] `REFRESH_TOKEN_EXPIRES_IN` - リフレッシュトークンの有効期限
```
例: 30d （30日）
```

### Firebase Admin設定（認証用）

[!] `FIREBASE_PROJECT_ID` - Firebaseプロジェクトのプロジェクトグループ（tenant）ID
```
例: dailyfortune-12345
```

[!] `FIREBASE_PRIVATE_KEY` - Firebaseサービスアカウントの秘密鍵
```
例: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

[!] `FIREBASE_CLIENT_EMAIL` - Firebaseサービスアカウントのクライアントメール
```
例: firebase-adminsdk-xxxxx@dailyfortune-12345.iam.gserviceaccount.com
```

### Claude AI API設定

[!] `ANTHROPIC_API_KEY` - Anthropic Claude API キー
```
例: sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

[ ] `CLAUDE_API_MODEL` - 使用するClaudeモデル名
```
例: claude-3-7-sonnet-20250219
```

[ ] `CLAUDE_API_MAX_TOKENS` - レスポンスの最大トークン数
```
例: 4096
```

[ ] `CLAUDE_API_TEMPERATURE` - モデルの温度パラメータ
```
例: 0.7
```

### システム固有設定

[ ] `FORTUNE_UPDATE_HOUR` - 日次運勢更新処理を実行する時刻（デフォルト: 3）
```
例: 3 （午前3時）
```

[ ] `MAX_CHAT_HISTORY` - 保存するチャット履歴の最大メッセージ数
```
例: 50
```

[ ] `AI_REQUEST_RATE_LIMIT` - ユーザーあたりの1日のAIリクエスト最大数
```
例: 100
```

## フロントエンド環境変数 (client/.env)

### API接続設定

[ ] `VITE_API_URL` - バックエンドAPIのベースURL
```
例: http://localhost:8080/api/v1 （開発環境）
例: https://api.dailyfortune.example.com/api/v1 （本番環境）
```

### Firebase設定（クライアント用）

[ ] `VITE_FIREBASE_API_KEY` - FirebaseウェブアプリのAPIキー
```
例: AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

[ ] `VITE_FIREBASE_AUTH_DOMAIN` - Firebase認証ドメイン
```
例: dailyfortune-12345.firebaseapp.com
```

[ ] `VITE_FIREBASE_PROJECT_ID` - Firebaseプロジェクトのプロジェクトグループ（tenant）ID
```
例: dailyfortune-12345
```

[ ] `VITE_FIREBASE_STORAGE_BUCKET` - Firebaseストレージバケット
```
例: dailyfortune-12345.appspot.com
```

[ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebaseメッセージング送信者ID
```
例: 1234567890
```

[ ] `VITE_FIREBASE_APP_ID` - Firebaseアプリケーション識別子
```
例: 1:1234567890:web:abcdef1234567890
```

### 基本設定

[ ] `VITE_APP_NAME` - アプリケーション名
```
例: DailyFortune
```

[ ] `VITE_APP_VERSION` - アプリケーションのバージョン
```
例: 1.0.0
```

## SuperAdmin管理サイト環境変数 (admin/.env)

### API接続設定

[ ] `VITE_ADMIN_API_URL` - 管理者用APIのベースURL
```
例: http://localhost:8080/api/v1/admin （開発環境）
例: https://api.dailyfortune.example.com/api/v1/admin （本番環境）
```

### Firebase設定（管理サイト用）

[ ] `VITE_FIREBASE_API_KEY` - FirebaseウェブアプリのAPIキー
```
例: AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

[ ] `VITE_FIREBASE_AUTH_DOMAIN` - Firebase認証ドメイン
```
例: dailyfortune-12345.firebaseapp.com
```

[ ] `VITE_FIREBASE_PROJECT_ID` - Firebaseプロジェクトのプロジェクトグループ（tenant）ID
```
例: dailyfortune-12345
```

## CI/CD用環境変数

### GitHub Actions

[ ] `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin SDKのサービスアカウントキー（JSONファイル全体）
```
例: {
  "type": "service_account",
  "project_id": "dailyfortune-12345",
  ...
}
```

[ ] `GCP_SA_KEY` - Google Cloud Platformのサービスアカウントキー（JSONファイル全体）
```
例: {
  "type": "service_account",
  "project_id": "dailyfortune-12345",
  ...
}
```

## 環境別の環境変数ファイル例

### 開発環境 (.env.development)

```
NODE_ENV=development
PORT=8080
MONGODB_URI=mongodb://localhost:27017/dailyfortune
API_BASE_URL=http://localhost:8080/api/v1
LOG_LEVEL=debug
FORTUNE_UPDATE_HOUR=3
```

### テスト環境 (.env.test)

```
NODE_ENV=test
PORT=8081
MONGODB_URI=mongodb://localhost:27017/dailyfortune_test
API_BASE_URL=http://localhost:8081/api/v1
LOG_LEVEL=error
```

### 本番環境 (.env.production)

```
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dailyfortune?retryWrites=true&w=majority
API_BASE_URL=https://api.dailyfortune.example.com/api/v1
LOG_LEVEL=warn
FORTUNE_UPDATE_HOUR=3
```

## 環境変数の安全な管理

1. 環境変数ファイル（`.env`）は常に`.gitignore`に含め、リポジトリにコミットしないこと
2. 開発者間での共有には`.env.example`を使用し、機密情報は含めない
3. 本番環境の機密情報は、Google Cloud Secret ManagerやFirebase Environment Configuration等の安全な方法で管理する
4. CI/CDパイプラインでは、ビルド時に環境変数を安全に注入する仕組みを使用する