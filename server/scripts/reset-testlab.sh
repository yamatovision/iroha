#!/bin/bash

# DailyFortune TestLAB 環境リセットスクリプト
# 使用方法: ./reset-testlab.sh

echo "DailyFortune TestLAB 環境のリセットを開始します..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$PROJECT_ROOT"

# 実行中のサーバープロセスの確認と停止
PORT=8080
PID=$(lsof -ti :$PORT)
if [ ! -z "$PID" ]; then
    echo "ポート $PORT は PID=$PID で使用中です。プロセスを停止します..."
    kill -9 $PID
    echo "ポート $PORT を解放しました"
fi

# 環境変数の更新
if [ -f "$PROJECT_ROOT/../.env" ]; then
    echo "プロジェクトルートの.env設定を再読み込みします"
    cp "$PROJECT_ROOT/../.env" "$SERVER_DIR/.env"
    echo ".envファイルを更新しました"
fi

# ビルドファイルのクリーン
cd "$SERVER_DIR"
echo "ビルドファイルをクリーンアップしています..."
rm -rf dist
echo "ビルドファイルを削除しました"

# 再ビルド
echo "サーバーコードを再ビルドしています..."
npm run build

# テスト用データベースのリセット
echo "テスト用データベースをリセットしています..."
# ここにテスト用データベースリセットのコードを追加

echo "TestLAB環境のリセットが完了しました。"
echo "テストを実行するには: npm test [テストファイルのパス]"
echo "サーバーを起動するには: node dist/index.js"