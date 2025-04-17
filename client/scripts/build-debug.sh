#!/bin/bash

# デバッグビルド用スクリプト
# 使用方法: ./scripts/build-debug.sh [platform]
# platform: ios または android（省略時は両方）

# エラーが発生したら停止
set -e

# 現在のディレクトリを保存
CURRENT_DIR=$(pwd)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR/.."

# カレントディレクトリがプロジェクトルートでない場合は移動
if [ "$CURRENT_DIR" != "$PROJECT_DIR" ]; then
  echo "プロジェクトルートディレクトリに移動します: $PROJECT_DIR"
  cd "$PROJECT_DIR"
fi

# プラットフォーム引数の処理
PLATFORM=$1
if [ -z "$PLATFORM" ]; then
  PLATFORM="all"
fi

# デバッグ環境変数ファイルが存在するか確認
if [ ! -f ".env.debug" ]; then
  echo "エラー: .env.debugファイルが見つかりません。"
  exit 1
fi

# デバッグビルドの実行
echo "========================================"
echo "DailyFortune デバッグビルドを開始します"
echo "プラットフォーム: $PLATFORM"
echo "環境変数: .env.debug"
echo "========================================"

# デバッグビルド用のcapacitor.config.tsを修正
echo "Capacitor設定を更新しています..."
sed -i '' 's/appVersion: .*/appVersion: '\''1.0.1-debug'\'',/' capacitor.config.ts
sed -i '' 's/appBuildNumber: .*/appBuildNumber: '\''1001'\'',/' capacitor.config.ts

# 環境変数設定
echo "デバッグ用環境変数を使用してビルドします"
cp .env.debug .env.production

# ビルド実行
echo "Webアプリをビルドしています..."
npm run build

# Capacitorの同期
echo "Capacitorプロジェクトを同期しています..."
npx cap sync

# プラットフォーム別ビルド
if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "all" ]; then
  echo "iOSプロジェクトを開きます..."
  npx cap open ios
fi

if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "all" ]; then
  echo "Androidプロジェクトを開きます..."
  npx cap open android
fi

echo "========================================"
echo "デバッグビルドの準備が完了しました"
echo "以下の変更が適用されています："
echo "- デバッグ用APIエンドポイント設定"
echo "- アプリバージョン: 1.0.1-debug"
echo "- ビルド番号: 1001"
echo "- デバッグモード有効化"
echo "========================================"