#!/bin/bash

# リファクタリングされたサービスのテストスクリプト
#
# このスクリプトは、リファクタリングされたAIサービスをテストします。
# デイリーフォーチュンプロジェクトのサーバーディレクトリで実行してください。

# 色付きコンソール出力用の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# タイトル表示
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}    AIサービスリファクタリングテスト    ${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# 現在の日時表示
echo -e "${YELLOW}テスト開始時刻: $(date)${NC}"
echo ""

# サーバーディレクトリに移動
cd "$(dirname "$0")/.."
SERVER_DIR=$(pwd)
echo -e "${YELLOW}サーバーディレクト: $SERVER_DIR${NC}"

# 環境変数の読み込み
if [ -f .env ]; then
  echo -e "${GREEN}環境変数を .env から読み込みました${NC}"
  export $(grep -v '^#' .env | xargs)
else
  echo -e "${YELLOW}警告: .env ファイルが見つかりません。環境変数が設定されていることを確認してください。${NC}"
fi

# Node.jsバージョン確認
echo -e "${YELLOW}Node.js バージョン: $(node -v)${NC}"
echo -e "${YELLOW}npm バージョン: $(npm -v)${NC}"
echo ""

# TypeScriptのコンパイル
echo -e "${BLUE}TypeScriptファイルをコンパイル中...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}コンパイルエラー: TypeScriptのコンパイルに失敗しました${NC}"
  exit 1
fi
echo -e "${GREEN}コンパイル成功${NC}"
echo ""

# Claude API クライアントのテスト
echo -e "${BLUE}Claude API クライアントをテスト中...${NC}"
node scripts/test-claude-api-client.js

if [ $? -ne 0 ]; then
  echo -e "${RED}テスト失敗: Claude API クライアントのテストに失敗しました${NC}"
  exit 1
fi
echo -e "${GREEN}Claude API クライアントのテスト成功${NC}"
echo ""

# リファクタリングされたサービスのテスト
echo -e "${BLUE}リファクタリングされたサービスをテスト中...${NC}"
node scripts/test-refactored-services.js

if [ $? -ne 0 ]; then
  echo -e "${RED}テスト失敗: リファクタリングされたサービスのテストに失敗しました${NC}"
  exit 1
fi
echo -e "${GREEN}リファクタリングされたサービスのテスト成功${NC}"
echo ""

# 成功メッセージ
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}    すべてのテストが成功しました！    ${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${YELLOW}テスト終了時刻: $(date)${NC}"

exit 0