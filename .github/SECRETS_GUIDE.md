# GitHub Secrets 設定ガイド

このプロジェクトのCI/CDパイプラインを適切に動作させるには、以下のSecretsをGitHubリポジトリに設定する必要があります。

## Secretsの設定方法

1. GitHubリポジトリのページに移動
2. 「Settings」タブをクリック
3. 左側のメニューから「Secrets and variables」→「Actions」を選択
4. 「New repository secret」ボタンをクリック
5. 下記の各Secretを追加

## 必要なSecrets一覧

### Google Cloud関連

| Secret名 | 説明 | 取得方法 |
|---------|------|--------|
| `GCP_PROJECT_ID` | Google CloudプロジェクトのプロジェクトID | Google Cloudコンソールのプロジェクト設定から取得 |
| `GCP_SA_KEY` | Google Cloudのサービスアカウントキー（JSON形式） | Google Cloudコンソールのサービスアカウントページからキーを作成・ダウンロード |
| `MONGODB_URI` | MongoDB接続文字列 | MongoDB Atlasのクラスター「Connect」オプションから取得 |

### Firebase関連

| Secret名 | 説明 | 取得方法 |
|---------|------|--------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebaseサービスアカウント（JSON形式） | Firebaseコンソールのプロジェクト設定→サービスアカウントから取得 |
| `FIREBASE_API_KEY` | Firebase Web APIキー | Firebaseコンソールのプロジェクト設定→ウェブアプリから取得 |
| `FIREBASE_AUTH_DOMAIN` | Firebase認証ドメイン | 同上 |
| `FIREBASE_PROJECT_ID` | Firebaseプロジェクトのプロジェクトid | 同上 |
| `FIREBASE_STORAGE_BUCKET` | Firebaseストレージバケット | 同上 |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebaseメッセージ送信者ID | 同上 |
| `FIREBASE_APP_ID` | FirebaseアプリのID | 同上 |

## サービスアカウント権限

### Google Cloudサービスアカウント

このサービスアカウントには以下の権限が必要です：

- Cloud Build サービスアカウント (`roles/cloudbuild.builds.builder`)
- Cloud Run 管理者 (`roles/run.admin`)
- Storage 管理者 (`roles/storage.admin`)
- Service Account User (`roles/iam.serviceAccountUser`)

### Firebaseサービスアカウント

このサービスアカウントには以下の権限が必要です：

- Firebase Hosting 管理者 (`roles/firebasehosting.admin`)
- Firebase Admin SDK 管理者 (`roles/firebase.admin`)

## 注意事項

- JSONフォーマットのシークレット（`GCP_SA_KEY`、`FIREBASE_SERVICE_ACCOUNT`）は、改行を含めた完全なJSONをコピー＆ペーストしてください。
- 実際の環境変数の値は、Secretsに設定された値で自動的に置き換えられます。
- シークレットは環境変数として使用されるため、引用符や特殊文字を含む場合は適切にエスケープされます。