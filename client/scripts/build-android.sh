#!/bin/bash

# DailyFortune Android ビルドスクリプト
# 使用法: ./scripts/build-android.sh [debug|release]

# ディレクトリ設定
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
BUILD_TYPE="${1:-debug}"  # デフォルトはdebug

# 色設定
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}====== DailyFortune Android Build ($BUILD_TYPE) ======${NC}"

# 現在の作業ディレクトリをプロジェクトルートに設定
cd "$PROJECT_ROOT"

# フロントエンドのビルド
echo -e "${GREEN}[1/4] フロントエンドのビルド中...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}エラー: フロントエンドのビルドに失敗しました${NC}"
  exit 1
fi

# Capacitor同期
echo -e "${GREEN}[2/4] Capacitorの同期中...${NC}"
npx cap sync android

if [ $? -ne 0 ]; then
  echo -e "${RED}エラー: Capacitor同期に失敗しました${NC}"
  exit 1
fi

# Androidプロジェクトのビルド
echo -e "${GREEN}[3/4] Androidプロジェクトのビルド中 ($BUILD_TYPE)...${NC}"
cd "$ANDROID_DIR"

if [ "$BUILD_TYPE" = "release" ]; then
  # リリースビルド
  ./gradlew assembleRelease

  if [ $? -ne 0 ]; then
    echo -e "${RED}エラー: Androidリリースビルドに失敗しました${NC}"
    exit 1
  fi

  # APKファイルのパス
  APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
else
  # デバッグビルド
  ./gradlew assembleDebug

  if [ $? -ne 0 ]; then
    echo -e "${RED}エラー: Androidデバッグビルドに失敗しました${NC}"
    exit 1
  fi

  # APKファイルのパス
  APK_PATH="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
fi

# 出力ディレクトリの作成
OUTPUT_DIR="$PROJECT_ROOT/dist/android"
mkdir -p "$OUTPUT_DIR"

# APKファイルのコピー
echo -e "${GREEN}[4/4] ビルド成果物をコピー中...${NC}"
cp "$APK_PATH" "$OUTPUT_DIR/"

if [ $? -ne 0 ]; then
  echo -e "${RED}エラー: APKファイルのコピーに失敗しました${NC}"
  exit 1
fi

echo -e "${GREEN}====== ビルド完了 ======${NC}"
echo -e "APKファイル: ${YELLOW}$OUTPUT_DIR/$(basename "$APK_PATH")${NC}"