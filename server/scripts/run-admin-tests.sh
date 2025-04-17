#!/bin/bash

# 管理者APIテスト実行スクリプト
# 使用方法: ./run-admin-tests.sh

# 現在のディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$SERVER_DIR")"

# カラー設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}     管理者API テスト実行スクリプト              ${NC}"
echo -e "${BLUE}===================================================${NC}"

# Firebase認証情報の確認
if [ -z "$FIREBASE_SERVICE_ACCOUNT_PATH" ]; then
  echo -e "${YELLOW}環境変数 FIREBASE_SERVICE_ACCOUNT_PATH が設定されていません。${NC}"
  echo -e "${YELLOW}認証情報を検索します...${NC}"
  
  # 認証情報の自動検索
  FIREBASE_KEYS=$(find "$PROJECT_ROOT" -name "*firebase-adminsdk*.json" | head -n 1)
  
  if [ -n "$FIREBASE_KEYS" ]; then
    echo -e "${GREEN}Firebase認証キーファイルを発見しました: ${FIREBASE_KEYS}${NC}"
    export FIREBASE_SERVICE_ACCOUNT_PATH="$FIREBASE_KEYS"
  else
    echo -e "${RED}Firebase認証キーファイルが見つかりません。テストは失敗する可能性があります。${NC}"
  fi
else
  echo -e "${GREEN}Firebase認証情報が設定されています: ${FIREBASE_SERVICE_ACCOUNT_PATH}${NC}"
fi

# データベース接続情報の確認
if [ -z "$MONGODB_URI" ]; then
  echo -e "${YELLOW}環境変数 MONGODB_URI が設定されていません。デフォルト値を使用します。${NC}"
  export MONGODB_URI="mongodb://localhost:27017/daily-fortune-test"
else
  echo -e "${GREEN}MongoDB接続情報が設定されています${NC}"
fi

# 認証情報の表示
echo -e "${BLUE}テスト認証情報:${NC}"
echo -e "${GREEN}  - メールアドレス: shiraishi.tatsuya@mikoto.co.jp${NC}"
echo -e "${GREEN}  - パスワード: aikakumei${NC}"
echo -e "${GREEN}  - 権限: super_admin${NC}"

# トークン取得スクリプトの実行
echo -e "${BLUE}\n認証トークンを取得します...${NC}"
if [ -f "$SCRIPT_DIR/get-token.js" ]; then
  TOKEN=$(node "$SCRIPT_DIR/get-token.js" shiraishi.tatsuya@mikoto.co.jp aikakumei)
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}認証トークンの取得に成功しました${NC}"
  else
    echo -e "${RED}認証トークンの取得に失敗しました。テストは実行されますが失敗する可能性があります。${NC}"
  fi
else
  echo -e "${YELLOW}get-token.js スクリプトが見つかりません。トークン取得をスキップします。${NC}"
fi

# テストの実行
echo -e "${BLUE}\nテストを実行します...${NC}"
cd "$SERVER_DIR"

# 基本的なモックテストの実行
echo -e "${BLUE}管理者APIの基本テストを実行します...${NC}"
npm test -- --testPathPattern=src/tests/admin/simple-admin.test.ts

# 実際の認証を使用したテスト
echo -e "${BLUE}実認証を使用した管理者API基本テストを実行します...${NC}"
npm test -- --testPathPattern=src/tests/admin/real-auth-users.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-users-actions.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-fortune-update.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-fortune-logs.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-fortune-run.test.ts

# 特定のテストファイルを指定して実行（廃止）
# モックテストは実認証テストに置き換えられました

echo -e "${BLUE}管理者APIの全テストを実行します...${NC}"
npm test -- --testPathPattern=src/tests/admin/

echo -e "${BLUE}\nテスト実行が完了しました${NC}"
echo -e "${BLUE}===================================================${NC}"