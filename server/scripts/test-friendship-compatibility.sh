#!/bin/bash
# 友達相性診断APIのテストスクリプト
# 基本相性診断と拡張相性診断の両方をテストします

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
DEFAULT_USER_ID="65f4fe4bfe04b371f21576f7" # テスト用ユーザーID
DEFAULT_FRIEND_ID="65f4fbbd4da35d0b2e8891ed" # テスト用友達ID

# コマンドライン引数解析
USER_ID=${1:-$DEFAULT_USER_ID}
FRIEND_ID=${2:-$DEFAULT_FRIEND_ID}

echo -e "${YELLOW}テスト設定:${NC}"
echo -e "- APIベースURL: ${API_BASE_URL}"
echo -e "- ユーザーID: ${USER_ID}"
echo -e "- 友達ID: ${FRIEND_ID}"

# JWTトークンを取得
echo -e "\n${YELLOW}認証トークンを取得しています...${NC}"
TOKEN=$(node scripts/get-jwt-token.js 2>/dev/null)

if [[ -z "$TOKEN" ]]; then
  echo -e "${RED}トークン取得に失敗しました。キャッシュからトークンを取得します...${NC}"
  if [[ -f scripts/.jwt_token_cache.json ]]; then
    TOKEN=$(grep -o '"token":"[^"]*"' scripts/.jwt_token_cache.json | cut -d'"' -f4)
    if [[ -z "$TOKEN" ]]; then
      echo -e "${RED}キャッシュからもトークンを取得できませんでした。テストを中止します。${NC}"
      exit 1
    fi
    echo -e "${GREEN}キャッシュからトークンを取得しました${NC}"
  else
    echo -e "${RED}トークンキャッシュが見つかりません。テストを中止します。${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}認証トークンを取得しました${NC}"

# 基本相性診断APIを呼び出し
echo -e "\n${YELLOW}1. 基本相性診断API (GET /api/v1/friends/${FRIEND_ID}/compatibility) を呼び出しています...${NC}"
BASIC_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE_URL}/friends/${FRIEND_ID}/compatibility")

# 結果を整形して表示
echo -e "${GREEN}基本相性診断APIの結果:${NC}"
echo $BASIC_RESULT | jq . 2>/dev/null || echo $BASIC_RESULT

# 拡張相性診断APIを呼び出し
echo -e "\n${YELLOW}2. 拡張相性診断API (GET /api/v1/friends/${FRIEND_ID}/enhanced-compatibility) を呼び出しています...${NC}"
ENHANCED_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE_URL}/friends/${FRIEND_ID}/enhanced-compatibility")

# 結果を整形して表示
echo -e "${GREEN}拡張相性診断APIの結果:${NC}"
echo $ENHANCED_RESULT | jq . 2>/dev/null || echo $ENHANCED_RESULT

# 結果を比較表示
echo -e "\n${YELLOW}---------------------------------------------${NC}"
echo -e "${YELLOW}基本相性診断と拡張相性診断の比較:${NC}"
echo -e "${YELLOW}---------------------------------------------${NC}"

# 基本相性スコア抽出
BASIC_SCORE=$(echo $BASIC_RESULT | jq -r '.data.score' 2>/dev/null)
if [[ -z "$BASIC_SCORE" || "$BASIC_SCORE" == "null" ]]; then
  BASIC_SCORE="取得失敗"
fi

# 拡張相性スコア抽出
ENHANCED_SCORE=$(echo $ENHANCED_RESULT | jq -r '.data.score' 2>/dev/null)
if [[ -z "$ENHANCED_SCORE" || "$ENHANCED_SCORE" == "null" ]]; then
  ENHANCED_SCORE="取得失敗"
fi

# 関係タイプ抽出
BASIC_TYPE=$(echo $BASIC_RESULT | jq -r '.data.relationshipType' 2>/dev/null)
if [[ -z "$BASIC_TYPE" || "$BASIC_TYPE" == "null" ]]; then
  BASIC_TYPE=$(echo $BASIC_RESULT | jq -r '.data.relationship' 2>/dev/null || echo "取得失敗")
fi

ENHANCED_TYPE=$(echo $ENHANCED_RESULT | jq -r '.data.relationshipType' 2>/dev/null)
if [[ -z "$ENHANCED_TYPE" || "$ENHANCED_TYPE" == "null" ]]; then
  ENHANCED_TYPE="取得失敗"
fi

# 出力
echo -e "基本相性スコア: ${GREEN}${BASIC_SCORE}${NC}"
echo -e "拡張相性スコア: ${GREEN}${ENHANCED_SCORE}${NC}"
echo -e "基本関係タイプ: ${GREEN}${BASIC_TYPE}${NC}"
echo -e "拡張関係タイプ: ${GREEN}${ENHANCED_TYPE}${NC}"

# 拡張詳細情報があるかチェック
HAS_ENHANCED_DETAILS=$(echo $ENHANCED_RESULT | jq -r '.data.enhancedDetails' 2>/dev/null)
if [[ "$HAS_ENHANCED_DETAILS" != "null" && -n "$HAS_ENHANCED_DETAILS" ]]; then
  echo -e "\n${YELLOW}拡張アルゴリズムで追加された情報:${NC}"
  echo -e "- 陰陽バランス: ${GREEN}$(echo $ENHANCED_RESULT | jq -r '.data.enhancedDetails.yinYangBalance' 2>/dev/null || echo "N/A")${NC}"
  echo -e "- 身強弱バランス: ${GREEN}$(echo $ENHANCED_RESULT | jq -r '.data.enhancedDetails.strengthBalance' 2>/dev/null || echo "N/A")${NC}"
  echo -e "- 用神・喜神の評価: ${GREEN}$(echo $ENHANCED_RESULT | jq -r '.data.enhancedDetails.usefulGods' 2>/dev/null || echo "N/A")${NC}"
  
  DAY_BRANCH_REL=$(echo $ENHANCED_RESULT | jq -r '.data.enhancedDetails.dayBranchRelationship.relationship' 2>/dev/null)
  DAY_BRANCH_SCORE=$(echo $ENHANCED_RESULT | jq -r '.data.enhancedDetails.dayBranchRelationship.score' 2>/dev/null)
  if [[ -n "$DAY_BRANCH_REL" && "$DAY_BRANCH_REL" != "null" ]]; then
    echo -e "- 日支関係: ${GREEN}${DAY_BRANCH_REL} (${DAY_BRANCH_SCORE}点)${NC}"
  fi
  
  IS_GANGOU=$(echo $ENHANCED_RESULT | jq -r '.data.enhancedDetails.dayGanCombination.isGangou' 2>/dev/null)
  DAY_GAN_SCORE=$(echo $ENHANCED_RESULT | jq -r '.data.enhancedDetails.dayGanCombination.score' 2>/dev/null)
  if [[ -n "$IS_GANGOU" && "$IS_GANGOU" != "null" ]]; then
    GANGOU_TEXT="なし"
    if [[ "$IS_GANGOU" == "true" ]]; then
      GANGOU_TEXT="あり"
    fi
    echo -e "- 日干干合: ${GREEN}${GANGOU_TEXT} (${DAY_GAN_SCORE}点)${NC}"
  fi
else
  echo -e "\n${RED}拡張詳細情報が含まれていません${NC}"
fi

echo -e "\n${GREEN}テスト完了!${NC}"