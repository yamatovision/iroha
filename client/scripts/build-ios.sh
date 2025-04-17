#!/bin/bash

# DailyFortune iOS ビルドスクリプト
# 使用法: ./scripts/build-ios.sh [development|adhoc|appstore]

# ディレクトリ設定
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$PROJECT_ROOT/ios"
EXPORT_METHOD="${1:-development}"  # デフォルトはdevelopment

# 色設定
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}====== DailyFortune iOS Build ($EXPORT_METHOD) ======${NC}"

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

# アーカイブとエクスポートはXcodeまたはfastlaneを使用して行う必要があります
echo -e "${GREEN}[3/3] iOSビルドの準備完了${NC}"
echo -e "${YELLOW}次のステップ:${NC}"
echo -e "1. Xcodeでプロジェクトを開く: npx cap open ios"
echo -e "2. Xcodeで適切な証明書とプロビジョニングプロファイルを選択"
echo -e "3. Product > Archive でアーカイブを作成"
echo -e "4. Distributeボタンでアプリを配布"

# プロジェクトをXcodeで開く（オプション）
echo -e "${YELLOW}Xcodeを開きますか？ (y/N)${NC}"
read -r OPEN_XCODE

if [[ "$OPEN_XCODE" =~ ^[Yy]$ ]]; then
  npx cap open ios
fi

echo -e "${GREEN}====== ビルド準備完了 ======${NC}"