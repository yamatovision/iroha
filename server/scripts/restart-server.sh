#!/bin/bash

# サーバー再起動スクリプト
# Usage: ./scripts/restart-server.sh

SERVER_DIR=$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")
cd "$SERVER_DIR" || exit 1

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}サーバーを再起動します...${NC}"

# 既存のPIDファイルを確認
if [ -f server.pid ]; then
  PID=$(cat server.pid)
  if ps -p "$PID" > /dev/null; then
    echo -e "${YELLOW}既存のサーバープロセス(PID: $PID)を終了します...${NC}"
    kill "$PID"
    sleep 2
    
    # プロセスが終了したか確認
    if ps -p "$PID" > /dev/null; then
      echo -e "${RED}プロセスが終了しません。強制終了します...${NC}"
      kill -9 "$PID"
      sleep 1
    fi
  else
    echo "PIDファイルは存在しますが、プロセスは既に終了しています"
  fi
  
  # PIDファイルを削除
  rm server.pid
fi

# ソースコードの変更をリビルド
echo -e "${YELLOW}サーバーコードをビルドしています...${NC}"
npm run build

# サーバー起動
echo -e "${YELLOW}サーバーを起動しています...${NC}"
npm start &
NEW_PID=$!
echo $NEW_PID > server.pid

echo -e "${GREEN}サーバーが再起動しました。PID: $NEW_PID${NC}"
echo -e "${YELLOW}ログを確認するには: tail -f server.log${NC}"