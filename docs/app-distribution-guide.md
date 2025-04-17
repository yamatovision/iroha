# DailyFortune テスト配布ガイド

## Firebase App Distribution セットアップ手順

### 必要な環境

1. Firebaseプロジェクト
2. Firebase CLIのインストール
   ```bash
   npm install -g firebase-tools
   ```
3. Firebaseにログイン
   ```bash
   firebase login
   ```

### プロジェクト設定

1. Firebaseコンソール(https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」または既存のプロジェクトを選択
3. Android アプリを追加:
   - パッケージ名: `jp.dailyfortune.app` を入力
   - アプリニックネーム: `DailyFortune` を入力
   - SHA-1証明書フィンガープリントは省略可能（App Distributionのみであれば）
4. 設定ファイル(`google-services.json`)をダウンロード
5. ファイルをプロジェクトの `android/app/` ディレクトリに配置

### App Distribution設定

1. Firebaseコンソールから「App Distribution」を選択
2. テスターとテストグループの設定:
   - 「テスターグループを作成」をクリック
   - グループ名を `daily-fortune-testers` に設定
   - テスターのメールアドレスを追加
3. テスターへの招待メールを送信

### アプリのビルドとアップロード

1. プロジェクトルートディレクトリで以下のコマンドを実行:
   ```bash
   cd client
   # 最新ビルドを生成
   npm run build
   # ネイティブプロジェクトを同期
   npx cap sync
   # Firebaseディストリビューション実行
   ./scripts/firebase-distribution.sh
   ```

2. アップロード完了後、テスターに通知が送信される

## TestFlight セットアップ手順 (iOS)

TestFlightの設定には、Apple Developer Programのアカウントが必要です。

### 必要な環境

1. Apple Developer Programのメンバーシップ
2. XcodeとApple IDによるログイン
3. 証明書とプロビジョニングプロファイルの設定

### 証明書とプロジェクト設定

1. Apple Developer PortalでApp ID登録:
   - `jp.dailyfortune.app` のBundle IDを登録

2. 配布証明書の作成:
   - 既に作成済みのCSRファイル(`CertificateSigningRequest.certSigningRequest`)を使用
   - Apple Developer Portalで「Certificates」→「+」→「iOS Distribution」を選択
   - CSRファイルをアップロード
   - 生成された証明書をダウンロードしてインストール

3. プロビジョニングプロファイルの作成:
   - Apple Developer Portalで「Profiles」→「+」を選択
   - 「App Store」を選択
   - 登録したApp IDを選択
   - 配布証明書を選択
   - プロファイル名を入力（例: `DailyFortune Distribution`）
   - プロファイルをダウンロードしてXcodeにインストール

### App Store Connectの設定

1. App Store Connect(https://appstoreconnect.apple.com/)にアクセス
2. 「マイアプリ」→「+」→「新規アプリ」を選択
3. 必要情報を入力:
   - プラットフォーム: iOS
   - アプリ名: DailyFortune
   - バンドルID: jp.dailyfortune.app
   - SKU: dailyfortune（任意の識別子）
4. プライバシーポリシーURLを設定
5. 年齢制限を設定

### TestFlightアップロード

1. Xcodeでプロジェクトを開く:
   ```bash
   cd client
   npx cap open ios
   ```

2. 「Signing & Capabilities」設定:
   - 「Automatically manage signing」のチェックを外す
   - 「Distribution」のProvisioning Profileを選択

3. ビルド設定:
   - プロダクト→スキーム→編集→「Archive」が選択可能か確認
   - デバイスを「Any iOS Device」に設定

4. アーカイブを作成:
   - プロダクト→「Archive」を選択
   - ビルドが完了するまで待機

5. Organizerからアップロード:
   - 「Distribute App」を選択
   - 「App Store Connect」を選択
   - 指示に従って設定を進める
   - 「Upload」をクリック

6. TestFlight準備:
   - App Store Connectで「TestFlight」タブに移動
   - ビルドの処理が完了するまで待機
   - 「テスターと情報」を設定
   - 内部テスターを追加

## テスターへの案内

### テスターの追加方法

#### Firebase App Distribution (Android)
1. メールアドレスでテスターを招待
2. テスターはメールのリンクからアプリをインストール可能

#### TestFlight (iOS)
1. Apple IDメールアドレスでテスターを招待
2. テスターはTestFlightアプリから参加可能

### テスターへの案内文例

```
DailyFortuneアプリのテスターにご参加いただき、ありがとうございます。

【Android版】
1. 招待メールに記載されたリンクをタップしてください
2. Firebase App Testerアプリのインストールを求められた場合は、インストールしてください
3. 指示に従ってDailyFortuneアプリをインストールしてください

【iOS版】
1. TestFlightアプリをApp Storeからインストールしてください（まだの場合）
2. 招待メールに記載されたリンクをタップするか、招待コードを入力してください
3. DailyFortuneアプリをインストールしてください

【フィードバック方法】
アプリ内の問題や改善点は以下のいずれかの方法でお知らせください:
- アプリ内のフィードバックフォーム
- メール: support@dailyfortune.app
- 招待メール返信

テスト期間: 2025/4/20 - 2025/5/10
```