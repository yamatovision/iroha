# DailyFortune CI/CD パイプライン ガイド

このプロジェクトは、GitHub Actionsを使用して継続的インテグレーション/継続的デプロイ（CI/CD）パイプラインを実装しています。このガイドでは、パイプラインの概要と使用方法について説明します。

## パイプラインの概要

このCI/CDパイプラインは3つの主要なワークフローで構成されています：

1. **サーバーデプロイ** (`deploy-server.yml`)
   - バックエンドコードの変更を検出してビルド
   - Google Cloud Runへの自動デプロイ

2. **クライアントデプロイ** (`deploy-client.yml`)
   - フロントエンドWebアプリの変更を検出してビルド
   - Firebase Hostingへの自動デプロイ

3. **モバイルビルド準備** (`prepare-mobile.yml`)
   - フロントエンドの変更を検出
   - モバイルアプリのビルド準備
   - AndroidプロジェクトファイルをGitHubアーティファクトとして保存

## トリガー条件

各ワークフローは以下の条件でトリガーされます：

- **サーバーデプロイ**: `server/` または `shared/` ディレクトリが変更された場合
- **クライアントデプロイ**: `client/` または `shared/` ディレクトリが変更された場合
- **モバイルビルド準備**: `client/` または `shared/` ディレクトリが変更された場合

## デプロイフロー

### サーバーのデプロイ

1. コードが `main` ブランチにプッシュされる
2. `server/` または `shared/` ディレクトリに変更があった場合、サーバーデプロイワークフローが起動
3. Google Cloud SDKをセットアップ
4. サーバーコードをDocker化してCloud Buildに送信
5. ビルドされたイメージをCloud Runにデプロイ

### クライアントのデプロイ

1. コードが `main` ブランチにプッシュされる
2. `client/` または `shared/` ディレクトリに変更があった場合、クライアントデプロイワークフローが起動
3. Node.jsをセットアップし依存関係をインストール
4. 環境変数ファイルを生成
5. クライアントコードをビルド
6. Firebase Hostingにデプロイ

### モバイルビルド準備

1. コードが `main` ブランチにプッシュされる
2. `client/` または `shared/` ディレクトリに変更があった場合、モバイルビルド準備ワークフローが起動
3. Node.jsをセットアップし依存関係をインストール
4. 環境変数ファイルを生成
5. クライアントコードをビルド
6. Capacitorを使用してネイティブプロジェクトを更新
7. Androidプロジェクトファイルを生成
8. ビルドファイルをアーティファクトとして保存

## モバイルアプリのビルド

モバイルアプリのビルドは以下の段階で行われます：

1. **自動ビルド準備**:
   - Web部分のビルドとCapacitor同期は自動化
   - ビルドファイルはGitHubアーティファクトとして保存

2. **手動ビルド**:
   - アーティファクトをダウンロード
   - 署名とリリースビルドは手動で実行
   - アプリストアへの提出も手動

### Androidビルド手順

1. GitHub Actionsの「Actions」タブからモバイルビルド準備ワークフローの実行結果を開く
2. 「Artifacts」セクションから「android-project」をダウンロード
3. ダウンロードしたzipファイルを展開
4. Android Studioでプロジェクトを開く
5. 署名設定を追加
6. リリースビルドを生成
7. Google Playにアップロード

### iOSビルド手順

iOSビルドについては現在自動化されていませんが、以下の手順で手動ビルドを行えます：

1. 最新コードをチェックアウト
2. `cd client && npm install && npm run build`
3. `npx cap sync ios`
4. `npx cap copy ios`
5. `cd ios/App && pod install`
6. Xcodeでプロジェクトを開く
7. 署名設定を追加
8. リリースビルドを生成
9. App Storeにアップロード

## パイプラインの拡張

### セキュリティスキャンの追加

セキュリティスキャンを追加するには、以下のような新しいワークフローを作成します：

```yaml
name: Security Scan

on:
  push:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0'  # 毎週日曜日に実行

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run npm audit
        run: |
          cd client
          npm audit
          cd ../server
          npm audit
          
      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'DailyFortune'
          path: '.'
          format: 'HTML'
          out: 'reports'
          
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: reports/
```

### iOSビルドの追加

iOSビルドを自動化するには、macOSランナーを使用したワークフローを追加します：

```yaml
name: Build iOS App

on:
  workflow_dispatch:  # 手動トリガー

jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Dependencies
        run: |
          cd client
          npm ci
      
      - name: Build Web
        run: |
          cd client
          npm run build
      
      - name: Update Capacitor
        run: |
          cd client
          npm install -g @capacitor/cli
          npx cap sync
          npx cap copy ios
      
      - name: Install CocoaPods
        run: |
          cd client/ios/App
          pod install
      
      - name: Build iOS App
        run: |
          cd client/ios/App
          xcodebuild archive -workspace App.xcworkspace -scheme App -configuration Release -archivePath build/App.xcarchive
```

## トラブルシューティング

### よくある問題と解決策

1. **デプロイが失敗する場合**:
   - GitHub Actionsのログでエラーメッセージを確認
   - 必要なSecretsが正しく設定されているか確認
   - ローカルでビルドが成功するか確認

2. **環境変数の問題**:
   - `.env.production`ファイルが正しく生成されているか確認
   - シークレットの値が正しいか確認

3. **権限の問題**:
   - Googleサービスアカウントに適切な権限があるか確認
   - Firebaseサービスアカウントに適切な権限があるか確認

4. **ビルドエラー**:
   - 依存関係が最新か確認
   - Node.jsバージョンの互換性を確認

## 手動実行

必要に応じて、GitHub Actionsワークフローを手動で実行することもできます：

1. GitHubリポジトリの「Actions」タブに移動
2. 左側のリストから実行したいワークフローを選択
3. 「Run workflow」ボタンをクリック
4. ブランチを選択して「Run workflow」ボタンをクリック

## カスタマイズ

これらのワークフローは、プロジェクトの要件に合わせてカスタマイズできます。例えば：

- テストを追加
- コードリントを追加
- 異なるデプロイ環境を追加（ステージング、開発など）
- 通知を追加（Slack、Emailなど）

ワークフローファイルを編集して、必要な変更を加えてください。