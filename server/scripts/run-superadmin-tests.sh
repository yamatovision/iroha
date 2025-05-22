#!/bin/bash

# スーパー管理者APIのテストを実行するスクリプト
echo "Running SuperAdmin API tests..."

# テスト環境のセットアップ
export NODE_ENV=test

# 一貫したテスト用シークレットキーの設定
export JWT_ACCESS_SECRET=dailyfortune_test_secret_key
export JWT_REFRESH_SECRET=dailyfortune_test_secret_key
export JWT_SECRET=dailyfortune_test_secret_key

# 明示的にMongoDB URIを設定（テストデータ作成時と同じURIを使用）
export MONGODB_URI="mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune?retryWrites=true&w=majority&appName=MotherPrompt-Cluster"

# 環境変数の確認（デバッグ用）
echo "環境設定:"
echo "- NODE_ENV=${NODE_ENV}"
echo "- JWT_SECRET=${JWT_SECRET:0:5}..."
echo "- MONGODB_URI=mongodb+srv://****:****@***.mongodb.net/dailyfortune"

# 現在のディレクトリをサーバーディレクトリに変更
cd "$(dirname "$0")/.."

# テスト実行
npx jest --verbose --detectOpenHandles --forceExit --testPathPattern=tests/superadmin

# テスト結果を表示
if [ $? -eq 0 ]; then
  echo "SuperAdmin API tests completed successfully!"
else
  echo "SuperAdmin API tests failed."
  exit 1
fi