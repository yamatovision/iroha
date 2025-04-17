#!/bin/bash

# DailyFortune 全プラットフォームビルドスクリプト
# 使用法: ./scripts/build-all.sh [debug|release]

# ディレクトリ設定
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_TYPE="${1:-debug}"  # デフォルトはdebug

# 色設定
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}====== DailyFortune 全プラットフォームビルド ($BUILD_TYPE) ======${NC}"

# 現在の作業ディレクトリをプロジェクトルートに設定
cd "$PROJECT_ROOT"

# ビルド前のクリーンアップ
echo -e "${GREEN}[1/4] ビルド前のクリーンアップ...${NC}"
rm -rf dist
rm -rf www
mkdir -p dist

# 環境変数設定
if [ "$BUILD_TYPE" = "release" ]; then
  # リリース環境変数
  echo -e "${GREEN}リリース用環境変数を設定中...${NC}"
  export NODE_ENV=production
  export VITE_APP_MODE=production
  export VITE_API_URL="https://api.dailyfortune.com"
else
  # 開発環境変数
  echo -e "${GREEN}開発用環境変数を設定中...${NC}"
  export NODE_ENV=development
  export VITE_APP_MODE=development
  export VITE_API_URL="https://dev-api.dailyfortune.com"
fi

# フロントエンドのビルド
echo -e "${GREEN}[2/4] フロントエンドのビルド中...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}エラー: フロントエンドのビルドに失敗しました${NC}"
  exit 1
fi

# Capacitor同期
echo -e "${GREEN}[3/4] Capacitorの同期中...${NC}"
npx cap sync

if [ $? -ne 0 ]; then
  echo -e "${RED}エラー: Capacitor同期に失敗しました${NC}"
  exit 1
fi

# プラットフォーム別ビルド
echo -e "${GREEN}[4/4] プラットフォーム別ビルド...${NC}"

# Androidビルド
echo -e "${BLUE}[4a/4] Androidビルド開始...${NC}"
./scripts/build-android.sh "$BUILD_TYPE"

if [ $? -ne 0 ]; then
  echo -e "${RED}警告: Androidビルドに失敗しました、継続します${NC}"
fi

# iOSビルドは手動プロセスが必要
echo -e "${BLUE}[4b/4] iOSビルド...${NC}"
echo -e "${YELLOW}iOSビルドには手動の操作が必要です:${NC}"
echo -e "1. ./scripts/build-ios.sh を実行してiOSビルドの準備をしてください"
echo -e "2. Xcodeを使用してアプリをアーカイブして配布してください"

echo -e "${GREEN}====== ビルドプロセス完了 ======${NC}"
echo -e "ビルド成果物は ${YELLOW}dist/${NC} ディレクトリ内にあります"