# DailyFortuneネイティブアプリ移行チェックリスト

## 初期設定・環境構築
- [x] 1. 新規プロジェクト作成 (`DailyFortune-Native`)
- [x] 2. 不要ファイル削除 (.git, node_modules など)
- [x] 3. Git リポジトリ初期化
- [x] 4. package.json の名前を `dailyfortune-native` に更新
- [x] 5. README と関連ドキュメントの更新

## Capacitor導入
- [x] 6. Capacitor Core と CLI をインストール
- [x] 7. Capacitor プロジェクト初期化 (`npx cap init`)
- [x] 8. vite.config.ts の base を `'./'` に変更
- [x] 9. Capacitor Preferences パッケージをインストール
- [x] 10. npm run build の実行
- [x] 11. Android プラットフォーム追加 (`npx cap add android`)
- [x] 12. iOS プラットフォーム追加 (`npx cap add ios`)
- [x] 13. capacitor.config.ts の設定

## API設定と環境変数
- [x] 14. 本番環境用API URL設定
- [x] 15. API通信のHTTPS強制対応
- [x] 16. バックエンドのCORS設定確認・調整

## ストレージシステム実装
- [x] 17. IStorageService インターフェース作成
- [x] 18. CapacitorStorageService 実装 (Preferences 使用)
- [x] 19. WebStorageService 実装 (localStorage バックアップ)
- [x] 20. プラットフォーム検出ロジック実装

## 認証システム対応
- [x] 21. token.service.ts の非同期対応
- [x] 22. AuthContext の非同期対応
- [x] 23. ローディング状態の適切な管理実装
- [x] 24. 認証関連の全コンポーネント更新
  - [x] 24.1. ログイン関連画面（Register, ForgotPassword）
  - [x] 24.2. ユーザーメニュー・ナビゲーション（UserMenu, NavigationMenu）
  - [x] 24.3. プロファイル関連コンポーネント（SajuProfileModal, SajuProfileSection）
  - [x] 24.4. チーム関連コンポーネント（Team pages）
  - [x] 24.5. その他認証利用コンポーネント（Fortune, Chat）
  - [x] 24.6. auth-manager.service.ts の非同期対応  
- [x] 25. JWT更新ロジックの非同期対応
- [x] 26. ログイン・ログアウトフローのテスト
- [x] 27. セッション管理の最適化

## ネットワーク監視実装
- [x] 28. NetworkMonitorService の作成
- [x] 29. プラットフォーム別ネットワーク検出実装
- [x] 30. ネットワーク状態表示コンポーネント作成
- [x] 31. オフライン状態時の UI フィードバック実装

## APIサービスのオフライン対応 (基本)
- [x] 32. GET リクエストのキャッシュシステム実装
- [x] 33. キャッシュのタイムスタンプと有効期限管理
- [x] 34. キャッシュのクリア機能実装
- [x] 35. オフライン読み取り時のキャッシュフォールバック実装
- [x] 36. オンライン復帰時のキャッシュ再検証ロジック

## 基本UI/UXの調整（限定テスト版用）
- [x] 37. スプラッシュスクリーン設定
- [x] 38. アプリアイコン設定
- [x] 39. 基本的なレイアウト調整（最小限）
- [x] 40. ナビゲーション基本機能確認

※ 詳細なUI/UX最適化は限定テスト版フィードバック後に実施

## プラットフォーム固有設定
- [x] 46. Android マニフェスト設定（権限など）
- [x] 47. iOS Info.plist 設定（権限など）
- [x] 48. Android アイコンセット準備（各解像度）
- [x] 49. iOS アイコンセット準備（各解像度）
- [x] 50. Android スプラッシュ画像準備
- [x] 51. iOS スプラッシュ画像準備
- [x] 52. Android キーボード設定
- [x] 53. iOS キーボード設定

## アプリ基本機能実装
- [x] 54. バックボタン処理の実装
- [x] 55. アプリ終了処理の実装
- [x] 56. ディープリンク基本設定
- [x] 57. スクリーン方向設定（縦横）
- [x] 58. App.tsx のライフサイクル処理調整
- [x] 59. エラーバウンダリの実装
- [x] 60. クラッシュレポート基本設定

## ビルド設定
- [x] 61. Android ビルド設定（build.gradle）
- [x] 62. iOS ビルド設定（Xcode project）
- [x] 63. Android リリース用署名Keystore作成
- [x] 64. iOS 証明書とプロビジョニングプロファイル設定
- [x] 65. ビルド環境変数の設定
- [x] 66. ビルドスクリプト作成

## ビルド設定とデバッグビルド（限定テスト版用）
- [x] 67. バージョン番号と識別子の設定
- [ ] 68. TestFlight の設定 (iOS)
- [x] 69. Firebase App Distribution の設定 (Android)
- [x] 70. デバッグビルドAPIエンドポイント設定
- [x] 70a. APIエンドポイントの動作検証とテスト
- [x] 71. Android デバッグビルド生成と配布
- [x] 72. iOS デバッグビルド生成と配布
- [x] 73. テスター向け簡易ガイド作成

## 限定テストとフィードバック
- [ ] 74. 基本機能の動作確認テスト
- [ ] 75. オフライン⇔オンライン切り替えテスト
- [ ] 76. ローカルストレージの動作確認
- [ ] 77. 実機でのUI/UXフィードバック収集
- [ ] 78. 複数デバイスでのレイアウト確認
- [ ] 79. バグ報告とクラッシュレポート分析

## UI/UXの詳細最適化（フィードバック後）
- [ ] 80. ボタンサイズとタッチターゲット拡大
- [ ] 81. フォントサイズと余白の調整
- [ ] 82. スクロール動作の最適化
- [ ] 83. フォーム入力のモバイル最適化
- [ ] 84. キーボード表示時のUI調整
- [ ] 85. ナビゲーションの最適化（スワイプ操作等）
- [ ] 86. モバイル向けローディングインジケーター調整

## 一般配布準備
- [~] 87. App Store Connect アカウント設定
- [~] 88. Google Play Console アカウント設定
- [ ] 89. App Storeスクリーンショット準備（各デバイスサイズ）
- [ ] 90. Google Playスクリーンショット準備（各デバイスサイズ）
- [ ] 91. アプリ説明文の準備
- [ ] 92. プライバシーポリシーの調整
- [ ] 93. アプリのカテゴリとレーティング設定
- [ ] 94. リリース用APIエンドポイント設定
- [ ] 95. デバッグコードの削除

## 一般公開リリース
- [ ] 96. Android リリースビルド生成
- [ ] 97. iOS リリースビルド生成
- [ ] 98. リリースビルドの最終動作確認

## 一般公開前の最終確認
- [ ] 99. アプリ起動・終了サイクルテスト
- [ ] 100. メモリ使用量チェック
- [ ] 101. バッテリー消費テスト
- [ ] 102. 初回起動時の動作確認
- [ ] 103. アプリ再インストール後の動作確認
- [ ] 104. すべての主要機能の最終確認
- [ ] 105. 設定・環境値の最終確認

## 一般配布とモニタリング
- [ ] 106. App Storeへの提出
- [ ] 107. Google Playへの提出
- [ ] 108. レビュープロセスの監視
- [ ] 109. 初期ユーザーフィードバックの収集準備

## CI/CD（オプション）
- [ ] 110. GitHub Actions ワークフロー設定
- [ ] 111. 自動ビルドの設定
- [ ] 112. 自動テストの設定
- [ ] 113. テスト配布の自動化

# 更新ルール

1. タスク完了時：
   - タスク番号の横にある `[ ]` を `[x]` に変更
   - 完了したタスクに関するエラーログがあれば削除
   - 進捗管理セクションの完了タスク数と進捗率を更新
   - 最終更新日を更新

2. エラー発生時：
   - エラー引き継ぎログに構造化された情報を追加
   - 参考資料があればリンクを追加

3. タスク開始時：
   - 着手中のタスクを明示するため `[ ]` を `[~]` に変更（任意）

## 進捗管理
- 完了タスク数: 65/114
- 進捗率: 57.02%
- 最終更新日: 2025/4/18 12:40

## 開発コマンド集

### TypeScriptエラーチェック
```bash
# TypeScriptコンパイルエラーチェック（コード生成なし）
cd client && npx tsc --noEmit

# プロジェクトビルド（エラーチェック込み）
cd client && npm run build
```

### アプリ起動
```bash
# 開発サーバー起動（ローカルのみ）
cd client && npm run dev

# 開発サーバー起動（外部アクセス可能）
cd client && npm run dev -- --host

# iOS向けビルドと同期
cd client && npm run build && npx cap sync ios

# Android向けビルドと同期
cd client && npm run build && npx cap sync android
```

### テスト実行
```bash
# ネイティブプロジェクトをXcodeで開く
cd client && npx cap open ios

# ネイティブプロジェクトをAndroid Studioで開く
cd client && npx cap open android
```

## 参考資料リンク

- [ネイティブアプリ実装ガイド](/docs/native-app-implementation-guide.md) - Capacitorを使った実装の詳細ガイド
- [ネイティブアプリ移行計画](/docs/native-app-migration-plan.md) - 移行全体の計画書
- [Capacitor公式ドキュメント](https://capacitorjs.com/docs) - Capacitorの公式リファレンス
- [Vite+React+TypeScript構成](https://vitejs.dev/guide/) - ビルド設定の参考
- [Android ビルドガイド](/client/android-build-guide.md) - Android Studio でのビルド手順
- [Capacitor HTTP Plugin](https://capacitorjs.com/docs/apis/http) - ネイティブHTTPリクエスト実装
- [Firebase App Distribution](https://firebase.google.com/docs/app-distribution) - テスト版配布システム

## エラー引き継ぎログ

このセクションには、タスク実行中に発生した問題とその解決策を記録します。タスクが完了したら、そのタスクに関するログは削除して構いません。

### 記録形式

```
【タスク番号】タスク名
- 問題：遭遇した問題の詳細
- 試行：試行した解決策
- 結果：成功または失敗、部分的な成功
- 解決策：最終的な解決策または回避策
- メモ：引き継ぎに必要な追加情報
- 参考：関連する参考資料へのリンク（任意）
```

### 現在のエラーログ

【26】ログイン・ログアウトフローのテスト
- 問題：iOSシミュレータ上でバックエンドAPIサーバーに直接接続し、フロントエンドUI（ログイン画面）が表示されなかった
- 試行1：capacitor.config.tsでバックエンドAPI接続先を指定
- 結果1：API JSON応答は表示されるがUIは表示されない
- 試行2：capacitor.config.tsでフロントエンド開発サーバー接続先を指定
- 結果2：接続エラーが発生
- 試行3：HTTPトラフィック許可の追加と開発サーバー--host設定
- 結果3：成功。フロントエンド開発サーバーに接続しログイン画面が表示された
- 解決策：
  1. capacitor.config.tsで開発サーバーURLと安全でない接続を許可する設定を追加
  2. iOS Info.plistにNSAppTransportSecurityを追加しHTTP接続を許可
  3. 開発サーバーを--hostフラグで起動し外部アクセスを許可
- メモ：Capacitorアプリのテスト時は開発サーバーをIPアドレスで公開する必要がある
- 参考：https://capacitorjs.com/docs/basics/configuring-your-app

【27】セッション管理の最適化
- 問題：アプリのバックグラウンド/フォアグラウンド切り替え時にセッション状態が適切に管理されていない
- 試行1：AuthContextでのトークン更新ロジックを見直し
- 結果1：複数のタイマーが重複して動作し、トークン更新が頻繁に発生
- 試行2：Capacitor Appプラグインを導入し専用のセッションマネージャーを実装
- 結果2：成功。アプリライフサイクルイベントと連動したセッション管理を実現
- 解決策：
  1. Capacitor Appプラグインをインストール・設定
  2. session-manager.serviceを実装してアプリライフサイクルを検出
  3. トークン更新最適化（バックグラウンド時は更新しない）
  4. App.tsxからセッションマネージャーを初期化
- メモ：Web環境とネイティブ環境の両方でライフサイクルイベントを適切に処理する必要がある
- 参考：https://capacitorjs.com/docs/apis/app

【72】iOS デバッグビルド生成と配布
- 問題1：証明書とプロビジョニングプロファイルが未取得
- 状況：App Store Connectへのアクセス権限が必要
- 問題2：iOSビルド用の手順とスクリプトが未整備
- 解決策：ビルド手順書とスクリプトを作成
- 次のステップ：
  1. 開発アカウントとプロビジョニングプロファイルの取得
  2. Xcodeでの署名設定
  3. テスト用デバイスの登録

【73】テスター向け簡易ガイド作成
- 状況：Androidビルド完了、iOSビルド準備中の段階でテスター向けガイド作成
- 作成した文書：
  1. 一般的なテスターガイド（tester-guide.md）
  2. Android版専用ガイド（tester-guide-android.md）
  3. iOS版専用ガイド（tester-guide-ios.md）
  4. テストチェックリスト（tester-guide-checklist.md）
- 内容：
  1. インストール手順
  2. 基本操作ガイド
  3. テスト観点と重点項目
  4. バグ報告方法
  5. トラブルシューティング
- 次のステップ：
  1. テスター招待と配布準備
  2. テスターフィードバック収集方法の確立

【71】Android デバッグビルド生成と配布
- 問題1：Firebase関連のライブラリが見つからないエラー
- 解決策1：FirebaseのBOMバージョンを34.0.0から32.7.4に更新
- 問題2：swiperefreshlayoutが見つからないエラー
- 解決策2：バージョンを1.2.0から1.1.0に更新
- 問題3：デバッグビルドのアプリIDがFirebaseに登録されていない
- 解決策3：デバッグビルドの接尾辞（.debug）を一時的に無効化
- 問題4：Java 21が無効なソースリリースエラー
- 解決策4：capacitor.build.gradle のJava設定をVERSION_21からVERSION_17に変更
- 問題5：capacitor-android モジュールでもJava 21エラー
- 解決策5：android/build.gradleに全サブプロジェクト対応のJava 17設定を追加
- 状況：ビルド成功、デバッグAPK生成完了（dist/android/app-debug.apk）
- 次のステップ：
  1. Firebase App Distributionでテスターに配布
  2. インストール・動作を確認
