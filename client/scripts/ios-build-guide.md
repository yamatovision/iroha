# iOS デバッグビルド生成ガイド

このガイドでは、DailyFortuneアプリのiOSデバッグビルドを生成し、TestFlightを通じてテスト配布する手順を説明します。

## 準備

1. 必要なツール:
   - Xcode 15以降
   - Apple Developerアカウント
   - Apple Developer Program登録（TestFlight配布の場合）

2. 環境設定:
   - 証明書とプロビジョニングプロファイルの取得
   - チーム設定（複数開発者の場合）

## ビルド手順

### 1. プロジェクト準備

```bash
# ビルド前に最新のソースコードを取得
git pull

# 必要なパッケージをインストール
npm install

# Webアプリのビルド
npm run build

# Capacitorプロジェクトの同期
npx cap sync ios
```

### 2. Xcodeでビルド

```bash
# Xcodeを開く
npx cap open ios
```

Xcodeが開いたら:

1. プロジェクト設定を確認:
   - 「Signing & Capabilities」タブを開く
   - 「Team」を正しく選択
   - 「Bundle Identifier」が「jp.dailyfortune.app」であることを確認

2. デバイス選択:
   - 実機またはシミュレータを選択

3. ビルドと実行:
   - 「Product」 > 「Run」を選択、または⌘+Rを押す

### 3. 証明書とプロビジョニングプロファイルの設定

アプリ配布にはアプリ表示証明書とプロビジョニングプロファイルが必要です。

#### マニュアル設定の手順

1. Apple Developerポータルでの設定:
   - [developer.apple.com](https://developer.apple.com)にログイン
   - 「Certificates, Identifiers & Profiles」を選択
   - 「Identifiers」で新しいApp IDを登録する（まだない場合）
   - 「Profiles」で新しいプロビジョニングプロファイルを作成

2. Xcodeでの設定:
   - Xcodeの「Preferences」 > 「Accounts」でApple IDを追加
   - チームを選択し、「Manage Certificates」をクリック
   - "+"ボタンをクリックして「Apple Development」証明書を作成

#### 自動設定の手順

より簡単な方法として、Xcodeの自動設定機能を利用できます。

1. プロジェクト設定を開く
2. 「Signing & Capabilities」タブを選択
3. 「Automatically manage signing」をチェック
4. 「Team」で適切な開発チームを選択

### 4. TestFlightへのビルドアップロード

1. アーカイブを作成:
   - Xcodeで「Product」 > 「Archive」を選択
   - アーカイブが完了したら、Xcode Organizerが開きます

2. App Store Connectへのアップロード:
   - アーカイブを選択し、「Distribute App」をクリック
   - 「App Store Connect」を選択
   - 指示に従って設定を行い、「Upload」をクリック

3. TestFlightでのテスト配布:
   - [appstoreconnect.apple.com](https://appstoreconnect.apple.com)にログイン
   - 「My Apps」からアプリを選択
   - 「TestFlight」タブを選択
   - 社内テスターまたは外部テスターを追加

## ビルド時の注意点

### Info.plistの設定確認

以下の項目が適切に設定されているか確認します：

- `NSAppTransportSecurity`: HTTPSの強制設定
- `NSCameraUsageDescription`: カメラ権限が必要な場合
- `NSPhotoLibraryAddUsageDescription`: 写真ライブラリへの書き込み権限
- `NSPhotoLibraryUsageDescription`: 写真ライブラリの読み込み権限

### スプラッシュスクリーン確認

- `Assets.xcassets` に適切なスプラッシュ画像が設定されているか確認
- `LaunchScreen.storyboard` の設定確認

## トラブルシューティング

### 証明書関連の問題

「証明書が見つかりません」または「プロビジョニングプロファイルが無効です」などのエラーが表示された場合の対応策：

1. Xcodeの「Preferences」 > 「Accounts」でApple IDの設定を確認
2. プロジェクト設定の「Signing & Capabilities」で設定を確認
3. 必要に応じて「Automatically manage signing」のチェックを外し、手動でプロファイルを選択

### ビルドエラー

ビルド時にエラーが発生した場合の対応策：

1. Cleanビルドを実行: 「Product」 > 「Clean Build Folder」
2. フルビルドを実行: シフトキーを押しながら「Product」 > 「Build」を選択
3. Xcodeキャッシュのクリア: ターミナルで「xcodebuild -clearDerivedData」を実行

## テスター向けの指示

テスターには以下の指示を提供します：

1. TestFlightアプリのインストール方法
2. テスト版アプリのインストール手順
3. テスト要点とフィードバックの提供方法
4. 複数デバイスやiOSバージョンでのテスト方法（必要に応じて）

## 注意事項

- TestFlightテスト版は最大90日間有効です
- App Storeへのリリース前に必要なレビュー照会を経る必要があります
- デバッグ用のツールやテストフラグをリリース向けビルドから除去する必要があります