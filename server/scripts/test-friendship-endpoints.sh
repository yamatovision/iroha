#!/bin/bash

# 友達機能・チームメンバーシップAPIテスト実行用シェルスクリプト
# このスクリプトは友達機能とチームメンバーシップの連携をテストするためのものです。

# 色の設定
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 現在のディレクトリを取得
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVER_DIR="$( cd "$DIR/.." && pwd )"

echo -e "${YELLOW}==== 友達機能・チームメンバーシップ API テスト ====${NC}"
echo "開始時刻: $(date)"
echo ""

# 環境変数設定 - 実システムのテストユーザー
export TEST_USER_EMAIL="shiraishi.tatsuya@mikoto.co.jp"
export TEST_USER_PASSWORD="aikakumei"
export TEST_INVITE_EMAIL="test-invite@example.com"  # テスト用招待先メール

# テスト用のアカウント情報を設定
# テスト用アカウント1 (チーム管理者)
export TEST_ADMIN_EMAIL="admin@example.com"
export TEST_ADMIN_PASSWORD="password123"

# テスト用アカウント2 (チームメンバー1)
export TEST_USER1_EMAIL="user1@example.com"
export TEST_USER1_PASSWORD="password123"

# テスト用アカウント3 (チームメンバー2)
export TEST_USER2_EMAIL="user2@example.com"
export TEST_USER2_PASSWORD="password123"

# API URLの設定
if [ -z "$API_URL" ]; then
  export API_URL="http://localhost:8080"
  echo -e "${YELLOW}API_URL環境変数が設定されていません。デフォルト値 $API_URL を使用します${NC}"
fi

echo ""
echo -e "${GREEN}テスト設定:${NC}"
echo "API URL: $API_URL"
echo "テストユーザー: $TEST_USER_EMAIL"
echo ""

# テスト1: 友達機能APIエンドポイントの基本テスト
echo -e "${GREEN}テスト1: 友達機能APIエンドポイントの基本テスト${NC}"
node "$SERVER_DIR/scripts/test-friendship-endpoints.js"

# 実行結果の確認
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ 基本テストが完了しました${NC}"
else
  echo -e "${RED}❌ 基本テスト中にエラーが発生しました${NC}"
  TEST1_FAILED=1
fi

echo ""
echo -e "${GREEN}テスト2: チームメンバーシップと友達機能連携テスト${NC}"
node "$SERVER_DIR/scripts/test-team-friendship-integration.js"

# 実行結果の確認
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ 連携テストが完了しました${NC}"
else
  echo -e "${RED}❌ 連携テスト中にエラーが発生しました${NC}"
  TEST2_FAILED=1
fi

echo ""
echo "終了時刻: $(date)"
echo -e "${YELLOW}===============================${NC}"

# 結果サマリー
echo -e "${YELLOW}テスト結果サマリー:${NC}"
if [ -z "$TEST1_FAILED" ]; then
  echo -e "${GREEN}✅ 基本テスト: 成功${NC}"
else
  echo -e "${RED}❌ 基本テスト: 失敗${NC}"
fi

if [ -z "$TEST2_FAILED" ]; then
  echo -e "${GREEN}✅ 連携テスト: 成功${NC}"
else
  echo -e "${RED}❌ 連携テスト: 失敗${NC}"
fi

# 終了コード
if [ -n "$TEST1_FAILED" ] || [ -n "$TEST2_FAILED" ]; then
  exit 1
else
  exit 0
fi