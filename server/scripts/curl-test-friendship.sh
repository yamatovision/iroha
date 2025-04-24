#!/bin/bash
# 友達相性診断APIのテストスクリプト
# cURLを使用して直接APIをテスト

# 色の定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}友達相性診断APIのテストを開始します...${NC}"
echo -e "${BLUE}===================================${NC}"

# デフォルト設定
API_BASE_URL="http://localhost:8080/api/v1"
DEFAULT_FRIEND_ID="67f87e86a7d83fb995de0ee7" # あみユーザーのID

# コマンドライン引数解析
FRIEND_ID=${1:-$DEFAULT_FRIEND_ID}
AUTH_TOKEN=${2}

# AUTH_TOKENが指定されていない場合は入力を求める
if [[ -z "$AUTH_TOKEN" ]]; then
  echo -e "${YELLOW}認証トークンを入力してください:${NC} "
  read AUTH_TOKEN
  
  if [[ -z "$AUTH_TOKEN" ]]; then
    echo -e "${RED}認証トークンが指定されていません。テストを中止します。${NC}"
    exit 1
  fi
fi

echo -e "${YELLOW}テスト設定:${NC}"
echo -e "- APIベースURL: ${API_BASE_URL}"
echo -e "- 友達ID: ${FRIEND_ID}"
echo -e "- 認証トークン: ${AUTH_TOKEN:0:10}..."

# 1. 基本相性診断APIをテスト
echo -e "\n${YELLOW}1. 基本相性診断API (GET /api/v1/friends/${FRIEND_ID}/compatibility) を呼び出しています...${NC}"
BASIC_RESULT=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "${API_BASE_URL}/friends/${FRIEND_ID}/compatibility")

# 結果を出力
echo -e "${GREEN}基本相性診断APIの応答:${NC}"
echo $BASIC_RESULT | jq . 2>/dev/null || echo $BASIC_RESULT

# 成功したかどうかを確認
SUCCESS=$(echo $BASIC_RESULT | jq -r '.success' 2>/dev/null)
if [[ "$SUCCESS" == "true" ]]; then
  echo -e "${GREEN}基本相性診断APIのテストに成功しました!${NC}"
else
  echo -e "${RED}基本相性診断APIのテストに失敗しました!${NC}"
fi

# 2. 拡張相性診断APIをテスト
echo -e "\n${YELLOW}2. 拡張相性診断API (GET /api/v1/friends/${FRIEND_ID}/enhanced-compatibility) を呼び出しています...${NC}"
ENHANCED_RESULT=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "${API_BASE_URL}/friends/${FRIEND_ID}/enhanced-compatibility")

# 結果を出力
echo -e "${GREEN}拡張相性診断APIの応答:${NC}"
echo $ENHANCED_RESULT | jq . 2>/dev/null || echo $ENHANCED_RESULT

# 成功したかどうかを確認
SUCCESS=$(echo $ENHANCED_RESULT | jq -r '.success' 2>/dev/null)
if [[ "$SUCCESS" == "true" ]]; then
  echo -e "${GREEN}拡張相性診断APIのテストに成功しました!${NC}"
else
  echo -e "${RED}拡張相性診断APIのテストに失敗しました!${NC}"
fi

echo -e "\n${GREEN}テスト完了!${NC}"