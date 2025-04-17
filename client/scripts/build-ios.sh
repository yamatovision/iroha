#!/bin/bash

# DailyFortune iOS ビルドスクリプト
# 使用法: ./scripts/build-ios.sh [debug|release]

# ディレクトリ設定
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$PROJECT_ROOT/ios"
BUILD_TYPE="${1:-debug}"  # デフォルトはdebug

# 色設定
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}====== DailyFortune iOS Build ($BUILD_TYPE) ======${NC}"

# 現在の作業ディレクトリをプロジェクトルートに設定
cd "$PROJECT_ROOT"

# フロントエンドのビルド
echo -e "${GREEN}[1/3] フロントエンドのビルド中...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}エラー: フロントエンドのビルドに失敗しました${NC}"
  exit 1
fi

# Capacitor同期
echo -e "${GREEN}[2/3] Capacitorの同期中...${NC}"
npx cap sync ios

if [ $? -ne 0 ]; then
  echo -e "${RED}エラー: Capacitor同期に失敗しました${NC}"
  exit 1
fi

# Xcodeを開く
echo -e "${GREEN}[3/3] Xcodeを開いています...${NC}"
npx cap open ios

if [ $? -ne 0 ]; then
  echo -e "${RED}エラー: Xcodeを開くことができませんでした${NC}"
  exit 1
fi

echo -e "${GREEN}====== ビルド準備完了 ======${NC}"
echo -e "${YELLOW}Xcodeでデバイスを選択し、ビルドボタンを押してください。${NC}"
echo -e "${YELLOW}証明書とプロビジョニングプロファイルを設定するには、「Signing & Capabilities」タブを使用してください。${NC}"
echo -e "${YELLOW}詳細な手順は ios-build-guide.md を参照してください。${NC}"

# 必要なツールやコマンドの説明
echo -e "\n${GREEN}==== 関連コマンド =====${NC}"
echo -e "${YELLOW}・Xcodeを開く: ${NC}npx cap open ios"
echo -e "${YELLOW}・Capacitor更新: ${NC}npx cap update ios"
echo -e "${YELLOW}・ポッドの更新: ${NC}cd ios/App && pod update"