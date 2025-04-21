#!/bin/bash

# 友達機能APIエンドポイントテスト（JWT認証版）
# 実行方法: ./scripts/test-jwt-friendship.sh

# 現在のディレクトリを取得
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVER_DIR="$( cd "$DIR/.." && pwd )"

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# JWTトークン取得のための認証情報
EMAIL="shiraishi.tatsuya@mikoto.co.jp"
PASSWORD="aikakumei"

echo -e "${YELLOW}🔑 JWTトークンを取得しています...${NC}"

# JWT認証トークンを取得
AUTH_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/jwt-auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# トークン抽出（デバッグ出力を追加）
echo "AUTH_RESPONSE: $AUTH_RESPONSE"
ACCESS_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  # 別の方法でトークンを抽出
  ACCESS_TOKEN=$(echo $AUTH_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('tokens', {}).get('accessToken', ''))" 2>/dev/null)
  
  if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ JWTトークンの取得に失敗しました${NC}"
    echo "$AUTH_RESPONSE"
    exit 1
  fi
fi

echo -e "${GREEN}✅ JWTトークン取得成功${NC}"

# APIエンドポイントのテスト
test_endpoint() {
  local method=$1
  local endpoint=$2
  local description=$3
  local data=$4

  echo -e "\n${YELLOW}=== テスト: $description ===${NC}"
  echo -e "リクエスト: $method http://localhost:8080/api/v1$endpoint"
  
  if [ "$method" == "GET" ]; then
    RESPONSE=$(curl -s -X GET "http://localhost:8080/api/v1$endpoint" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
  elif [ "$method" == "POST" ]; then
    RESPONSE=$(curl -s -X POST "http://localhost:8080/api/v1$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d "$data")
  fi
  
  # ステータスコードをチェック（レスポンスから推測）
  if echo "$RESPONSE" | grep -q "success\":true"; then
    echo -e "${GREEN}✅ 成功: APIエンドポイントが正常に応答しました${NC}"
    echo "$RESPONSE" | python3 -m json.tool
    return 0
  else
    echo -e "${RED}❌ エラー: APIエンドポイントの応答に問題があります${NC}"
    echo "$RESPONSE" | python3 -m json.tool
    return 1
  fi
}

# エンドポイントテスト実行
echo -e "\n${YELLOW}===== 友達機能APIエンドポイントテスト開始 =====${NC}"

# テスト対象のエンドポイント
test_endpoint "GET" "/friends" "友達一覧取得API"
test_endpoint "GET" "/friends/search?query=test" "ユーザー検索API"
test_endpoint "GET" "/friends/requests" "受信した友達リクエスト一覧API"
test_endpoint "GET" "/friends/sent-requests" "送信した友達リクエスト一覧API"

echo -e "\n${GREEN}===== テスト完了 =====${NC}"