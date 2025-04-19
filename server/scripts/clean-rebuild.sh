#!/bin/bash
# clean-rebuild.sh
# サーバーとsajuengine_packageを完全にクリーンビルドするスクリプト

set -e  # エラーが発生したら停止

echo "=== サーバーとsajuengine_packageの完全クリーンビルドを開始します ==="

# 現在のディレクトリを保存
CURRENT_DIR=$(pwd)

# パッケージのディレクトリ
SERVER_DIR="/Users/tatsuya/Desktop/システム開発/DailyFortuneNative2/server"
SAJU_DIR="/Users/tatsuya/Desktop/システム開発/DailyFortuneNative2/sajuengine_package"

# サーバープロセスを終了
echo "1. 実行中のサーバープロセスを停止します..."
pkill -f "node.*DailyFortuneNative2/server" || echo "実行中のサーバープロセスはありませんでした"

# sajuengine_packageのクリーンビルド
echo "2. sajuengine_packageのクリーンビルドを実行します..."
cd "$SAJU_DIR"
echo "2.1. キャッシュとビルド成果物を削除中..."
rm -rf node_modules/.cache dist
echo "2.2. 新規ビルド実行中..."
npm run build

# サーバーのクリーンビルド
echo "3. サーバーのクリーンビルドを実行します..."
cd "$SERVER_DIR"
echo "3.1. キャッシュとビルド成果物を削除中..."
rm -rf node_modules/.cache dist
echo "3.2. 新規ビルド実行中..."
npm run build

# サーバーの起動
echo "4. サーバーを起動します..."
cd "$SERVER_DIR"
node --max-old-space-size=4096 --experimental-modules dist/src/index.js &
SERVER_PID=$!
echo "サーバーが起動しました (PID: $SERVER_PID)"

# APIテスト実行
echo "5. APIテストを実行します..."
echo "サーバーが完全に起動するまで5秒待機..."
sleep 5
cd "$SERVER_DIR"
node scripts/test-available-cities.js

# 元のディレクトリに戻る
cd "$CURRENT_DIR"

echo "=== 完全クリーンビルドとテストが完了しました ==="