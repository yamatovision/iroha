# Android デバッグビルド生成ガイド

このガイドでは、DailyFortuneアプリのAndroidデバッグビルドを生成し、Firebase App Distributionを通じてテスト配布する手順を説明します。

## 準備

1. 必要なツール:
   - Android Studio
   - Firebase CLI (`npm install -g firebase-tools`)

2. 環境設定:
   - Android SDKのインストール
   - JDK 17のインストールと設定 (Java 21ではなくJava 17を使用)

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
npx cap sync android
```

### 2. Android Studioでビルド

```bash
# Android Studioを開く
npx cap open android
```

Android Studioが開いたら:

1. プロジェクトが読み込まれるまで待機
2. ビルドが完了するまで待機（初回は時間がかかる場合があります）
3. メニューから `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)` を選択
4. 「Build Completed」の通知が表示されたら「locate」をクリックしてAPKファイルの場所を確認

APKは通常 `android/app/build/outputs/apk/debug/app-debug.apk` に生成されます。

### 3. Firebase App Distributionへの配布

Google Services設定:

```bash
# google-services.jsonが存在しない場合はテンプレートからコピー
if [ ! -f "android/app/google-services.json" ]; then
  cp android/app/google-services.json.template android/app/google-services.json
fi
```

Firebase CLIを使用して配布:

```bash
# Firebaseにログイン
firebase login

# プロジェクトの設定
firebase use YOUR_PROJECT_ID

# アプリの配布
firebase appdistribution:distribute android/app/build/outputs/apk/debug/app-debug.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups "testers" \
  --release-notes "デバッグビルド - テスト用"
```

## テスター向け指示

1. テスターには Firebase App Tester アプリをインストールするよう依頼
2. 招待メールを送信し、テスターにアプリへのアクセス権を付与
3. テスト内容と報告方法について明確に伝える

## トラブルシューティング

### Android SDK場所の指定

Android SDKの場所を明示的に指定する必要がある場合:

```bash
# local.propertiesファイルを編集
echo "sdk.dir=/path/to/your/android/sdk" > android/local.properties
```

### Javaバージョンの問題

Javaバージョンに関連するエラーが発生した場合:

```bash
# Java 17がインストールされているか確認
java -version

# インストールされていない場合はHomebrewでインストール
brew install openjdk@17

# Capacitorの自動生成ファイルを修正
# client/android/app/capacitor.build.gradle のJava設定を修正
# VERSION_21からVERSION_17に変更
```

### Gradleビルド失敗

Gradleビルドが失敗する場合:

```bash
# プロジェクトのクリーン
cd android && ./gradlew clean

# キャッシュをクリア
cd android && ./gradlew cleanBuildCache
```

## 注意事項

- デバッグビルドはテスト専用です。本番リリースには適切に署名されたリリースビルドを使用してください。
- Firebase App Distributionを使用する場合、適切なFirebaseプロジェクト設定が必要です。
- テスターには明確なフィードバック収集方法を提供してください。