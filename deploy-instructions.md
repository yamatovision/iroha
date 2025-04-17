# デプロイ手順 2025-04-17

Cloud Runへのデプロイを行います。

## デプロイ準備

1. 環境変数
   - USE_CLAUDE_API=false に設定する（APIキーが設定されていない場合）
   - または、正しいAPIキーを設定

## デプロイコマンド

```bash
# ビルド
cd server && npm run build

# Google Cloudにビルド & デプロイ
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/dailyfortune-api

gcloud run deploy dailyfortune-api \n  --image gcr.io/YOUR_PROJECT_ID/dailyfortune-api \n  --platform managed \n  --region asia-northeast1 \n  --allow-unauthenticated \n  --set-env-vars="USE_CLAUDE_API=false,NODE_ENV=production,その他の必要な環境変数"
```

## 変更内容

- Claude APIのエラーハンドリングを改善
- USE_CLAUDE_API=false の場合はAPIキーなしでもサーバーが起動するよう修正
- TypeScriptの型エラーを修正

# アプリIDの管理について

## Firebaseに登録されているアプリID

現在、Firebaseには以下のアプリIDが登録されています：

```
jp.dailyfortune.app
```

## デバッグビルドのアプリID管理

### 問題点

通常、Androidビルドシステムはデバッグビルドに自動的に `.debug` 接尾辞を追加します。これにより、デバッグビルドのアプリIDは `jp.dailyfortune.app.debug` になります。

しかし、Firebaseには `jp.dailyfortune.app` のみが登録されているため、デバッグビルドがFirebaseサービス（プッシュ通知や分析など）を使用できない問題が発生します。

### 対応策

現在の対応策として、以下のいずれかを選択できます：

1. **デバッグビルドの接尾辞を無効化する（現在の対応）**
   - `android/app/build.gradle` ファイルで `applicationIdSuffix ".debug"` をコメントアウト
   - デバッグビルドとリリースビルドのアプリIDが同じになる、デバイスインストール時に競合する可能性あり

2. **Firebaseにデバッグビルド用のアプリIDを登録する（長期的解決策）**
   - Firebaseコンソールで `jp.dailyfortune.app.debug` を新しいアプリとして追加
   - `google-services.json` ファイルを更新し、両方のアプリIDを含める
   - この場合、`applicationIdSuffix ".debug"` を元に戻す必要あり

## 今後のアプリID管理計画

本番リリース前に、以下の対応を検討します：

1. Firebaseにデバッグ用アプリIDを正式登録
2. 自動ビルドスクリプトで適切なビルド環境に応じて`google-services.json`ファイルを切り替える仕組みを実装
