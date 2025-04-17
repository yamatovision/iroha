# チャットストリーミングテスト方法

## 1. プロジェクトのセットアップ

このプロジェクトでは、サーバーが起動していることを前提としています。まだ起動していない場合は以下のコマンドで起動してください：

```bash
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
npm run dev
```

## 2. テスト方法

### 2.1 ブラウザでのテスト（推奨）

1. 以下のHTMLファイルをブラウザで開きます：
   ```
   /Users/tatsuya/Desktop/システム開発/DailyFortune/server/scripts/stream-test.html
   ```

2. テスト用トークンが既に入力されています。必要に応じて「トークン取得」ボタンで新しいトークンを取得することもできます。

3. 「テスト実行」ボタンをクリックして、各種テストを実行します：
   - 通常のチャットリクエスト
   - ストリーミングチャットリクエスト
   - EventSourceストリーミングテスト
   - クエリパラメータ認証テスト

### 2.2 Node.jsスクリプトでのテスト

1. 必要なパッケージをインストールします：
   ```bash
   cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
   bash scripts/setup-chat-test.sh
   ```

2. トークンを取得します：
   ```bash
   node scripts/get-token.js shiraishi.tatsuya@mikoto.co.jp aikakumei
   ```

3. 取得したトークンを使ってテストを実行します：
   ```bash
   node scripts/test-chat-streaming-direct.js "<トークン文字列>"
   ```

## 3. トラブルシューティング

### 3.1 認証エラー（401 Unauthorized）

- トークンが有効か確認してください
- トークンが正しく設定されているか確認してください
- トークンが期限切れの場合は新しいトークンを取得してください

### 3.2 ストリーミングエラー

- CORS設定が正しいか確認してください
- サーバーログでエラーを確認してください
- サーバーが起動しているか確認してください
- EventSourceのURL形式が正しいか確認してください

### 3.3 パスの重複エラー（404 Not Found）

- `/api/v1/api/v1/` のようなパスの重複がある場合は、`client/src/services/chat.service.ts` の修正が必要です。