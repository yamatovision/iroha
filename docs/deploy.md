# DailyFortune デプロイガイド

このドキュメントでは、DailyFortuneアプリケーションのデプロイ方法について説明します。DailyFortuneは3つの主要コンポーネント（フロントエンド、バックエンド、データベース）で構成されており、それぞれが異なるサービスにデプロイされます。

## デプロイ構成

DailyFortuneの各コンポーネントは以下のサービスにデプロイされます：

1. **フロントエンド**: Firebase Hosting
2. **バックエンド**: Google Cloud Run
3. **データベース**: MongoDB Atlas
4. **認証**: Firebase Authentication

この構成は、以下の理由から選択されました：

- 日本語の管理画面と充実したドキュメント（Firebase, Google Cloud）
- シンプルな操作性と使いやすい管理ツール
- スケーラビリティと信頼性
- コスト効率（小規模から始めて徐々に拡張可能）
- サーバーレスアーキテクチャによる運用負荷の軽減

## 前提条件

デプロイを開始する前に、以下のアカウントと環境を準備してください：

1. [Google Cloud Platform](https://cloud.google.com/) アカウント
2. [Firebase](https://firebase.google.com/) プロジェクト（GCPと連携）
3. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) アカウント
4. ローカル開発環境：
   - Node.js (v16以上)
   - npm または yarn
   - Google Cloud SDK
   - Firebase CLI

## 1. Firebaseプロジェクト設定

### 1.1 Firebaseプロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名に「DailyFortune」を入力
4. Google Analyticsを有効化（推奨）
5. プロジェクトを作成

### 1.2 Firebase Authentication設定

1. 左側のメニューから「Authentication」を選択
2. 「始める」をクリック
3. 「メール / パスワード」を選択し、有効化
4. （オプション）他の認証方法（Google、Apple IDなど）も必要に応じて設定

### 1.3 Firebaseアプリの登録

1. プロジェクトの概要ページで「</>」（Webアプリ）をクリック
2. アプリのニックネームを入力（例：「DailyFortune-client」）
3. 「Firebase Hostingも設定する」にチェック
4. 「アプリを登録」をクリック
5. 設定情報が表示されるので保存（環境変数として使用）

## 2. MongoDB Atlas設定

### 2.1 クラスター作成

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)にログイン
2. 「Create」をクリックし新しいクラスターを作成
3. 無料階層（Shared Cluster）を選択
4. リージョンは「東京」（ap-northeast-1）を選択
5. クラスター名を「dailyfortune-db」に設定
6. 「Create Cluster」をクリック

### 2.2 データベースユーザー作成

1. 左側のメニューから「Database Access」を選択
2. 「Add New Database User」をクリック
3. 認証方法は「Password」を選択
4. ユーザー名とパスワードを設定（安全なパスワードを生成）
5. データベース権限は「Atlas admin」を選択
6. 「Add User」をクリック

### 2.3 ネットワーク設定

1. 左側のメニューから「Network Access」を選択
2. 「Add IP Address」をクリック
3. 開発段階では「Allow Access from Anywhere」を選択（`0.0.0.0/0`）
4. 実運用時は適切なIPアドレス制限を設定
5. 「Confirm」をクリック

### 2.4 接続文字列の取得

1. クラスター画面で「Connect」をクリック
2. 「Connect your application」を選択
3. ドライバーとバージョンを確認（Node.js、最新バージョン）
4. 接続文字列をコピー（環境変数として使用）

## 3. Google Cloud Run設定

### 3.1 Google Cloud SDKの設定

```bash
# Google Cloud SDKをインストール（まだの場合）
# https://cloud.google.com/sdk/docs/install からインストール

# Google Cloudにログイン
gcloud auth login

# プロジェクトを設定
gcloud config set project YOUR_FIREBASE_PROJECT_ID
```

### 3.2 必要なAPIの有効化

```bash
# Cloud Run APIの有効化
gcloud services enable run.googleapis.com

# Cloud Build APIの有効化
gcloud services enable cloudbuild.googleapis.com

# Artifact Registry APIの有効化
gcloud services enable artifactregistry.googleapis.com
```

## 4. アプリケーションのデプロイ

### 4.1 Firebase Hostingの設定（複数サイト）

DailyFortuneアプリケーションでは、一般ユーザー向けと管理者向けの2つのサイトを別々のURLでホスティングします。

```bash
# Firebase CLIのインストール（まだの場合）
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# プロジェクトディレクトリに移動
cd /path/to/DailyFortune

# 一般ユーザー向けサイトの作成
firebase hosting:sites:create dailyfortune --project YOUR_PROJECT_ID

# 管理者向けサイトの作成
firebase hosting:sites:create dailyfortune-admin --project YOUR_PROJECT_ID

# firebase.jsonの作成（手動または下記コマンドで）
cat > firebase.json << 'EOF'
{
  "hosting": [
    {
      "target": "client",
      "public": "client/dist",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    },
    {
      "target": "admin",
      "public": "admin/dist",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ]
}
EOF

# .firebasercの作成
cat > .firebaserc << 'EOF'
{
  "projects": {
    "default": "YOUR_PROJECT_ID"
  },
  "targets": {
    "YOUR_PROJECT_ID": {
      "hosting": {
        "client": [
          "dailyfortune"
        ],
        "admin": [
          "dailyfortune-admin"
        ]
      }
    }
  }
}
EOF

# ホスティングターゲットの設定
firebase target:apply hosting client dailyfortune --project YOUR_PROJECT_ID
firebase target:apply hosting admin dailyfortune-admin --project YOUR_PROJECT_ID
```

### 4.2 クライアントアプリのデプロイ

```bash
# クライアントディレクトリに移動
cd /path/to/DailyFortune/client

# 依存関係のインストール（必要な場合）
npm install

# 環境変数の設定（.envファイル）
cat > .env << 'EOF'
# Firebase設定
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID

# API設定
VITE_API_URL=https://YOUR_BACKEND_URL/api/v1
VITE_AUTH_API_URL=https://YOUR_BACKEND_URL/api/v1/auth
EOF

# ビルド
npm run build

# デプロイ（プロジェクトのルートディレクトリから実行することも可能）
cd ..
firebase deploy --only hosting:client
```

**デプロイ後のURL**: https://dailyfortune.web.app

### 4.3 管理者アプリのデプロイ

```bash
# 管理者ディレクトリに移動
cd /path/to/DailyFortune/admin

# 依存関係のインストール（必要な場合）
npm install

# 環境変数の設定（.envファイル）
cat > .env << 'EOF'
# Firebase設定
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID

# API設定
VITE_API_URL=https://YOUR_BACKEND_URL/api/v1
VITE_AUTH_API_URL=https://YOUR_BACKEND_URL/api/v1/auth
EOF

# ビルド
npm run build

# デプロイ（プロジェクトのルートディレクトリから実行することも可能）
cd ..
firebase deploy --only hosting:admin
```

**デプロイ後のURL**: https://dailyfortune-admin.web.app

### 4.4 バックエンドのデプロイ（Google Cloud Run）

バックエンドのデプロイには、Google Cloud RunとSecret Managerを使用して機密情報を安全に管理します。

#### 4.4.1 共有モジュールの設定

バックエンドでは、`shared/index.ts`の代わりに`server/src/types/index.ts`を使用するように設定します。これにより、デプロイ時の問題を回避します。

```bash
# server/src/types/index.tsを作成し、shared/index.tsの内容をコピー
mkdir -p ./server/src/types
cp ./shared/index.ts ./server/src/types/index.ts

# すべてのインポートパスを更新
# @shared/index のインポートを ../types/index または ./types/index に変更
```

#### 4.4.2 Secret Managerの設定

Firebase Admin SDKのサービスアカウントJSONなどの機密情報はSecret Managerで管理します。

```bash
# Secret Manager APIを有効化
gcloud services enable secretmanager.googleapis.com

# Firebase Admin SDKのサービスアカウントをシークレットとして保存
gcloud secrets create firebase-admin-sdk --replication-policy="automatic"
cat /path/to/service-account.json | gcloud secrets versions add firebase-admin-sdk --data-file=-

# Firebase Database URLをシークレットとして保存
gcloud secrets create firebase-database-url --replication-policy="automatic"
echo "https://YOUR_PROJECT_ID.firebaseio.com" | gcloud secrets versions add firebase-database-url --data-file=-

# JWT Secretをシークレットとして保存
gcloud secrets create jwt-secret --replication-policy="automatic"
echo "YOUR_JWT_SECRET_KEY" | gcloud secrets versions add jwt-secret --data-file=-
```

#### 4.4.3 Cloud Runへのデプロイ

```bash
# プロジェクトディレクトリに移動
cd /path/to/DailyFortune/server

# Dockerイメージをビルド
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/dailyfortune-api

# Secret Managerを使用してCloud Runにデプロイ
gcloud run deploy dailyfortune-api \
  --image gcr.io/YOUR_PROJECT_ID/dailyfortune-api \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT=firebase-admin-sdk:latest" \
  --set-env-vars="NODE_ENV=production,MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dailyfortune?retryWrites=true&w=majority,CLIENT_URL=https://dailyfortune.web.app,ADMIN_URL=https://dailyfortune-admin.web.app,FIREBASE_DATABASE_URL=https://YOUR_PROJECT_ID.firebaseio.com,JWT_SECRET=YOUR_JWT_SECRET_KEY"
```

## 5. 継続的デプロイ（CI/CD）の設定

### 5.1 GitHub Actions設定（推奨）

クライアントとサーバー用の`.github/workflows`ディレクトリに以下のワークフローファイルを作成：

#### 5.1.1 フロントエンドデプロイ (.github/workflows/deploy-client.yml)

```yaml
name: Deploy Client

on:
  push:
    branches: [ main ]
    paths:
      - 'client/**'
      - 'shared/**'

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install Dependencies
        run: |
          cd client
          npm ci
      - name: Build
        run: |
          cd client
          npm run build
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-firebase-project-id
          entryPoint: './client'
```

#### 5.1.2 バックエンドデプロイ (.github/workflows/deploy-server.yml)

```yaml
name: Deploy Server

on:
  push:
    branches: [ main ]
    paths:
      - 'server/**'
      - 'shared/**'

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v0
        with:
          project_id: your-project-id
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          export_default_credentials: true
      - name: Build and Deploy to Cloud Run
        run: |
          cd server
          gcloud builds submit --tag gcr.io/your-project-id/dailyfortune-api
          gcloud run deploy dailyfortune-api \
            --image gcr.io/your-project-id/dailyfortune-api \
            --platform managed \
            --region asia-northeast1 \
            --allow-unauthenticated
```

### 5.2 必要なシークレットの設定

GitHub Repositoryの「Settings」→「Secrets」→「New repository secret」で以下を設定：

1. `FIREBASE_SERVICE_ACCOUNT`: Firebase Admin SDKのサービスアカウントキー
2. `GCP_SA_KEY`: Google Cloud Platformのサービスアカウントキー

## 6. デプロイ状況と確認（2025/04/07更新）

### 6.1 フロントエンド（デプロイ完了）

- **一般ユーザー向け**: https://dailyfortune.web.app
  * Firebase Hostingにデプロイ済み
  * Firebaseプロジェクト: sys-76614112762438486420044584
  * カスタムドメイン: 未設定（必要に応じて追加予定）
  * 確認事項: ログイン、プロフィール設定、運勢表示などの基本機能

- **管理者向け**: https://dailyfortune-admin.web.app
  * Firebase Hostingにデプロイ済み（マルチサイト構成）
  * 同一Firebaseプロジェクト内の別サイトとして設定
  * 確認事項: 管理者ログイン、ユーザー管理、チーム管理機能

### 6.2 バックエンド（デプロイ成功）

- **Cloud Run**:
  * プロジェクト: yamatovision-blue-lamp
  * サービス名: dailyfortune-api
  * リージョン: asia-northeast1
  * URL: https://dailyfortune-api-6clpzmy5pa-an.a.run.app
  * 確認事項: ステータスエンドポイント、ログ、モニタリング

- **実装された対応策**:
  * 共有モジュール（shared/index.ts）の問題を解決するために server/src/types/index.ts を作成
  * バックエンドコードの参照先を変更（@shared/index → ../types/index）
  * Firebase初期化コードを改善し、より堅牢なエラーハンドリングを実装
  * 環境変数管理方法を改善（プレーンJSON、Base64両方をサポート）

- **デプロイ完了した機能**:
  * ユーザー認証API（Firebase Auth連携）
  * 管理者API（ユーザー管理機能）
  * セキュリティミドルウェア
  * MongoDB接続設定

### 6.3 データベース（接続完了）

- **MongoDB Atlas**:
  * クラスター名: motherprompt-cluster
  * データベース名: dailyfortune
  * 接続方法: 接続文字列（環境変数で管理）
  * ネットワークアクセス: Cloud Runからのアクセス許可済み
  * 確認事項: クラスター健全性、初期データ、パフォーマンスメトリクス

### 6.4 シークレット管理と環境変数

#### バックエンド（Cloud Run）

Cloud Run環境変数で以下の設定を管理:

```bash
# 環境変数
NODE_ENV=production
CLIENT_URL=https://dailyfortune.web.app
ADMIN_URL=https://dailyfortune-admin.web.app
FIREBASE_DATABASE_URL=https://sys-76614112762438486420044584.firebaseio.com
JWT_SECRET=SecureJwtKey2025

# MongoDB接続
MONGODB_URI=mongodb+srv://lisence:********@motherprompt-cluster.np3xp.mongodb.net/dailyfortune?retryWrites=true&w=majority&appName=MotherPrompt-Cluster
DB_NAME=dailyfortune

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT # サービスアカウントJSONデータを環境変数として設定
```

#### フロントエンド（Firebase Hosting）

本番環境用の環境変数ファイルを作成・ビルド時に組み込み:

```bash
# client/.env.production
VITE_API_URL=https://dailyfortune-api-6clpzmy5pa-an.a.run.app/api/v1
VITE_AUTH_API_URL=https://dailyfortune-api-6clpzmy5pa-an.a.run.app/api/v1/auth

# admin/.env.production
VITE_ADMIN_API_URL=https://dailyfortune-api-6clpzmy5pa-an.a.run.app/api/v1/admin
VITE_AUTH_API_URL=https://dailyfortune-api-6clpzmy5pa-an.a.run.app/api/v1/auth
```

## 7. 注意事項とベストプラクティス

1. **セキュリティ**
   - 本番環境では環境変数でシークレットを管理
   - Firebase Security Rulesを適切に設定
   - MongoDB接続文字列にはパスワードを含めない方法も検討

2. **コスト管理**
   - Google Cloud予算アラートを設定
   - Firebase Blazeプランのコスト監視
   - MongoDB Atlasの利用状況モニタリング

3. **バックアップ**
   - MongoDB Atlasの自動バックアップを有効化
   - 定期的な手動バックアップの実施

4. **モニタリング**
   - Google Cloud Monitoringでパフォーマンス監視
   - Firebase Performance Monitoringの活用
   - エラー追跡にFirebase Crashlyticsを導入

## 8. トラブルシューティング

### 8.1 デプロイ失敗時の対応

1. ビルドログを確認
2. 環境変数が正しく設定されているか確認
3. 権限の問題はないか確認
4. 依存関係が解決されているか確認

### 8.2 パフォーマンス問題

1. フロントエンドのChunkサイズを最適化
2. Cloud Runのメモリ割り当てを調整
3. MongoDB Atlasのインデックス設定を見直し

### 8.3 一般的なエラー

- CORS問題：Cloud Runの設定を確認
- 認証エラー：Firebaseの設定を確認
- DB接続エラー：MongoDB接続文字列とネットワーク設定を確認

### 8.4 共有モジュール問題の解決

共有モジュール（shared/index.ts）の参照によるデプロイ問題を解決するために以下の方法を採用:

1. **独立型定義の使用**:
   - バックエンドでは `server/src/types/index.ts` に型定義をコピー
   - フロントエンドは引き続き `shared/index.ts` を直接使用
   - 両ファイルは手動で同期を維持

2. **Firebase初期化の堅牢化**:
   - 環境変数読み込みの改善（プレーンJSON、Base64両方をサポート）
   - フォールバックメカニズムの導入
   - 詳細なエラーログ

3. **シークレット管理の改善**:
   - Secret Managerを使用することで環境変数の長さや特殊文字の問題を回避
   - シークレットへのアクセス権限を明示的に設定

## 9. 将来の拡張計画

1. **グローバル展開**
   - Cloud CDNの導入
   - リージョン別のCloud Run設定

2. **スケーリング**
   - MongoDBシャーディングの検討
   - Cloud Runの自動スケーリング最適化

3. **高度なモニタリング**
   - サードパーティ監視ツールの導入
   - アラート体制の強化

## 10. デプロイルールと履歴管理

デプロイプロセスを一貫性を持って管理するため、以下のルールに従ってください：

### 10.1 デプロイルール

1. **計画と準備**
   - デプロイ前に必要な環境変数とシークレットを確認
   - 必要なAPIが有効化されているか確認
   - コードが最新版か確認（git pull origin main）

2. **段階的デプロイ**
   - サーバー側（バックエンド）→ クライアント側（フロントエンド）の順にデプロイ
   - 各段階でテストを実施
   - 一度に複数の大きな変更を行わない

3. **デプロイ手順の記録**
   - 実行したコマンドを漏れなく記録
   - 環境変数の変更を記録（パスワードなどの機密情報は除く）
   - 発生した問題と解決策を記録

4. **テストとデプロイ確認**
   - デプロイ後、主要機能が動作することを確認
   - エラーログを確認
   - パフォーマンスメトリクスを確認

### 10.2 デプロイ履歴管理

**デプロイ履歴ファイル**: プロジェクトのルートディレクトリに [`deploy-history.md`](/Users/tatsuya/Desktop/システム開発/DailyFortune/deploy-history.md) ファイルを作成し、以下のフォーマットでデプロイの記録を残してください：

```markdown
# デプロイ日時: YYYY-MM-DD

## 1. デプロイ概要
- デプロイしたコンポーネント（バックエンド/フロントエンド）
- 主な変更点
- デプロイ担当者

## 2. デプロイ手順
- 実行したコマンド（コピペで再利用可能な形式）
- 設定した環境変数（機密情報は除く）
- 特記事項

## 3. 発生した問題と解決策
- 問題1: 問題の詳細な説明
  - 症状（エラーメッセージ、ログなど）
  - 原因
  - 解決策
- 問題2: ...

## 4. デプロイ結果
- デプロイURK
- 確認した機能
- パフォーマンス指標
- 今後の課題
```

### 10.3 デプロイ中の問題対応

デプロイ中に問題が発生した場合は、以下のステップに従ってください：

1. **問題の特定と記録**
   - エラーメッセージとログを収集
   - 問題が発生した正確な手順を記録
   - スクリーンショットを取得（可能な場合）

2. **トラブルシューティング**
   - 本ドキュメントの「8. トラブルシューティング」セクションを参照
   - 同様の問題がデプロイ履歴に記録されていないか確認
   - Google Cloud RunやFirebaseのドキュメントを参照

3. **解決策の実施と検証**
   - 解決策を実施
   - 問題が解決したことを確認
   - 解決策をデプロイ履歴に詳細に記録

4. **知識共有**
   - 新しい問題と解決策を文書化
   - チームメンバーに共有
   - 必要に応じてデプロイガイドを更新

これらのルールに従うことで、デプロイプロセスの透明性が向上し、問題発生時の対応が迅速化します。過去の経験を活かし、継続的に改善していくことが重要です。