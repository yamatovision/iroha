# Android ビルドガイド

## Android Studio でのビルド方法

### 前提条件
- Android Studio がインストールされていること
- JDK（Java開発キット）がインストールされていること

### Android Studio の設定

1. プロジェクトを開く
   ```bash
   cd "/Users/tatsuya/Desktop/システム開発/DailyFortuneNative2/client"
   npx cap open android
   ```

2. Java バージョンの設定
   - メニューから「File」→「Project Structure」を選択
   - 左メニューから「SDK Location」を選択
   - 「JDK Location」が Java 17 または Java 11 を指していることを確認
   - 必要に応じて変更し、「OK」をクリック

### デバッグビルドの生成

1. ビルド前の準備
   ```bash
   # 最新のソースコードをビルド
   cd "/Users/tatsuya/Desktop/システム開発/DailyFortuneNative2/client"
   npm run build
   npx cap sync android
   ```

2. Android Studio でビルド実行
   - メニューから「Build」→「Build Bundle(s) / APK(s)」→「Build APK(s)」を選択
   - 「Build Completed」の通知が表示されるまで待機
   - 通知の「locate」をクリックして APK ファイルの場所を確認

### Firebase App Distribution でのテスト配布

1. Firebase CLI をインストール
   ```bash
   npm install -g firebase-tools
   ```

2. Firebase にログイン
   ```bash
   firebase login
   ```

3. APK をテスターに配布
   ```bash
   cd "/Users/tatsuya/Desktop/システム開発/DailyFortuneNative2/client"
   firebase appdistribution:distribute android/app/build/outputs/apk/debug/app-debug.apk \
     --app 1:145847104422:android:4182cab8cb3f9dae701567 \
     --groups "testers" \
     --release-notes "ネイティブHTTPクライアント実装によるAPI接続改善"
   ```

## 手動配布の方法

Firebase App Distribution が利用できない場合や、より簡易的に配布したい場合は、以下の方法を使用できます：

1. **APK ファイルの共有**:
   - Google Drive、Dropbox、または適切なファイル共有サービスに APK をアップロード
   - テスターに共有リンクを送信

2. **インストール手順**:
   - Android デバイスで「提供元不明のアプリ」のインストールを許可する設定を有効にする
   - 共有リンクから APK をダウンロード
   - APK ファイルをタップしてインストール

## テスターへの指示事項

テストに参加するユーザーには以下の指示を提供してください：

1. **基本機能のテスト**:
   - アプリのログイン/ログアウト機能
   - プロフィール情報の表示
   - メインの機能（運勢表示、チャットなど）

2. **ネットワーク動作の確認**:
   - オンライン状態での API 通信
   - オフライン状態での動作（機内モードにして確認）
   - ネットワーク復帰時の動作

3. **UI/UX の確認**:
   - 画面レイアウトの崩れがないか
   - タップ操作の反応性
   - テキスト表示の読みやすさ

4. **フィードバック報告**:
   - 問題が発生した場合はスクリーンショットと共に報告
   - デバイスの種類と Android バージョンも記載
   - 再現手順を詳細に記録