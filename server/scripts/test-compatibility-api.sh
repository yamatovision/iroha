#!/bin/bash
# 四柱推命相性診断APIテスト用シェルスクリプト

# 色の定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 現在のディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$SERVER_DIR")"

# 引数チェック
API_TYPE=${1:-"both"}  # デフォルトは両方のAPIをテスト

echo -e "${BLUE}サーバーの起動ステータスを確認中...${NC}"
SERVER_RUNNING=false
lsof -i:8080 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}サーバーは起動しています${NC}"
  SERVER_RUNNING=true
else
  echo -e "${YELLOW}サーバーが起動していません。テスト前にサーバーを起動します...${NC}"
  
  # サーバーディレクトリに移動
  cd "$SERVER_DIR"
  
  # TypeScriptエラーチェック
  echo -e "${BLUE}TypeScriptコンパイルチェック中...${NC}"
  npx tsc --noEmit
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}TypeScriptエラーが見つかりました。修正してから再試行してください。${NC}"
    exit 1
  fi
  
  # サーバー起動（バックグラウンド）
  echo -e "${BLUE}サーバーを起動中...${NC}"
  npm run build && node dist/index.js > /dev/null 2>&1 &
  SERVER_PID=$!
  
  # サーバー起動を待機
  echo -e "${YELLOW}サーバーの起動を待機中...${NC}"
  sleep 5
  
  # 起動確認
  lsof -i:8080 > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}サーバーが正常に起動しました${NC}"
    echo $SERVER_PID > "$SERVER_DIR/server.pid"
  else
    echo -e "${RED}サーバーの起動に失敗しました${NC}"
    exit 1
  fi
fi

# JWTトークンを事前に取得
echo -e "${BLUE}JWTトークンを事前取得中...${NC}"
node "$SERVER_DIR/scripts/get-jwt-token.js" shiraishi.tatsuya@mikoto.co.jp aikakumei

# テスト実行
echo

if [ "$API_TYPE" = "both" ] || [ "$API_TYPE" = "standard" ]; then
  echo -e "${BLUE}標準相性診断APIテストを実行中...${NC}"
  node "$SERVER_DIR/scripts/test-compatibility.js" ${2:-} ${3:-} ${4:-}
  echo
fi

if [ "$API_TYPE" = "both" ] || [ "$API_TYPE" = "enhanced" ]; then
  echo -e "${BLUE}拡張相性診断APIテストを実行中...${NC}"
  node "$SERVER_DIR/scripts/test-enhanced-compatibility.js" ${2:-} ${3:-} ${4:-}
  echo
fi

# このスクリプトで起動したサーバーがある場合は停止
if [ "$SERVER_RUNNING" = false ] && [ -f "$SERVER_DIR/server.pid" ]; then
  SERVER_PID=$(cat "$SERVER_DIR/server.pid")
  echo -e "${YELLOW}テスト完了。サーバーを停止中 (PID: $SERVER_PID)...${NC}"
  kill $SERVER_PID
  rm "$SERVER_DIR/server.pid"
  echo -e "${GREEN}サーバーを停止しました${NC}"
fi

echo -e "${GREEN}テスト完了!${NC}"