# Androidデバッグビルド問題の解決策

## 特定された問題

### 1. Firebase関連のライブラリエラー
- **問題**: Firebase関連のライブラリが見つからないエラー
- **原因**: FirebaseのBOMバージョンの互換性問題
- **解決策**: FirebaseのBOMバージョンを34.0.0から32.7.4に更新（すでに対応済み）

### 2. SwipeRefreshLayoutエラー
- **問題**: swiperefreshlayoutが見つからないエラー
- **原因**: ライブラリバージョンの非互換性
- **解決策**: バージョンを1.2.0から1.1.0に更新（すでに対応済み）

### 3. Firebase App IDの問題
- **問題**: デバッグビルドのアプリIDがFirebaseに登録されていない
- **原因**: デバッグビルドの接尾辞（.debug）がFirebaseに登録されていないアプリIDを生成
- **説明**: 通常、Android Studioは自動的にデバッグビルドに`.debug`接尾辞を追加し、アプリIDが`jp.dailyfortune.app.debug`となるが、Firebaseには`jp.dailyfortune.app`のみが登録されている
- **解決策**: `build.gradle`ファイルで`applicationIdSuffix ".debug"`行をコメントアウトし、デバッグビルドでも本番と同じアプリID（`jp.dailyfortune.app`）を使用

### 4. Java 21互換性エラー
- **問題**: "Java 21が無効なソースリリース"エラーが発生
- **原因**: capacitor.build.gradleファイルでJava 21を指定しているが、システムにはJava 17がインストールされている
- **解決策**: capacitor.build.gradleファイル内のJavaVersionをVERSION_21からVERSION_17に変更

## ビルド方法

### 方法1: シェルスクリプトによるビルド

```bash
# プロジェクトルートディレクトリで実行
cd /Users/tatsuya/Desktop/システム開発/DailyFortuneNative2/client
./scripts/build-android.sh debug
```

ビルドが成功すると、APKファイルが`dist/android/app-debug.apk`に生成されます。

### 方法2: コマンドライン直接実行

```bash
# フロントエンドビルド
cd /Users/tatsuya/Desktop/システム開発/DailyFortuneNative2/client
npm run build
npx cap sync android

# Androidビルド
cd android
./gradlew assembleDebug
```

APKファイルは`android/app/build/outputs/apk/debug/app-debug.apk`に生成されます。

## Firebase配布方法

```bash
# Firebaseにログイン
firebase login

# APKのアップロード
firebase appdistribution:distribute /Users/tatsuya/Desktop/システム開発/DailyFortuneNative2/client/android/app/build/outputs/apk/debug/app-debug.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups "daily-fortune-testers" \
  --release-notes "DailyFortune v1.0.1-beta - Javaバージョン互換性問題を修正"
```

## 注意事項

1. 日本語パスの問題が発生する場合は、英語パスのプロジェクトコピーを作成して作業することも検討してください：
   ```bash
   mkdir -p ~/Projects
   cp -R ~/Desktop/システム開発/DailyFortuneNative2 ~/Projects/DailyFortuneNative2
   cd ~/Projects/DailyFortuneNative2/client
   ```

2. Capacitorの更新時には再度`capacitor.build.gradle`のJavaバージョンを確認し、必要に応じて修正してください。

3. 将来的にはJava 21へのアップグレードを検討することも視野に入れてください。