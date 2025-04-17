#!/bin/bash

# DailyFortune TestLAB テスト実行スクリプト
# 使用方法: ./run-test.sh [テストファイルのパス]

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$PROJECT_ROOT"
LOGS_DIR="$PROJECT_ROOT/../logs/tests"

# 引数チェック
if [ -z "$1" ]; then
  echo "エラー: テストファイルのパスを指定してください"
  echo "使用方法: ./run-test.sh [テストファイルのパス]"
  echo "例: ./run-test.sh src/tests/models/DailyFortuneUpdateLog.test.ts"
  exit 1
fi

TEST_PATH="$1"
TEST_NAME=$(basename "$TEST_PATH" .test.ts)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOGS_DIR/${TEST_NAME}_${TIMESTAMP}.log"

# ログディレクトリの確認
mkdir -p "$LOGS_DIR"

# 環境チェック
cd "$SERVER_DIR"
if [ ! -f ".env" ]; then
  echo "警告: .envファイルが見つかりません。環境変数が正しく設定されていない可能性があります。"
  if [ -f "$PROJECT_ROOT/../.env" ]; then
    echo "プロジェクトルートの.envファイルをコピーします。"
    cp "$PROJECT_ROOT/../.env" "$SERVER_DIR/.env"
  fi
fi

# ポートチェック (もしテストでサーバーを起動する場合)
PORT=8080
PID=$(lsof -ti :$PORT)
if [ ! -z "$PID" ]; then
  echo "ポート $PORT は PID=$PID で使用中です。"
  read -p "テスト実行前にプロセスを停止しますか？ (y/n): " KILL_PROCESS
  if [ "$KILL_PROCESS" = "y" ]; then
    kill -9 $PID
    echo "ポート $PORT を解放しました"
  fi
fi

# テスト実行
echo "テスト実行: $TEST_PATH"
echo "ログファイル: $LOG_FILE"
echo "テスト開始時間: $(date)"
echo "-----------------------------------------"

# テスト実行とログ記録
{
  echo "=== DailyFortune テスト実行ログ ==="
  echo "テスト: $TEST_PATH"
  echo "実行日時: $(date)"
  echo "環境: $(node -v)"
  echo "-----------------------------------------"
  
  START_TIME=$(date +%s%3N)
  npm test "$TEST_PATH" 2>&1
  TEST_RESULT=$?
  END_TIME=$(date +%s%3N)
  DURATION=$((END_TIME - START_TIME))
  
  echo "-----------------------------------------"
  if [ $TEST_RESULT -eq 0 ]; then
    echo "テスト結果: 成功"
  else
    echo "テスト結果: 失敗 (終了コード: $TEST_RESULT)"
  fi
  echo "実行時間: ${DURATION}ms"
  echo "終了時間: $(date)"
} | tee "$LOG_FILE"

# JSON形式のテスト結果も保存
JSON_LOG_FILE="$LOGS_DIR/${TEST_NAME}_${TIMESTAMP}.json"
{
  echo "{"
  echo "  \"testId\": \"$TEST_NAME-$TIMESTAMP\","
  echo "  \"testName\": \"$TEST_NAME\","
  echo "  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
  echo "  \"executor\": \"TestLAB\","
  echo "  \"status\": \"$([ $TEST_RESULT -eq 0 ] && echo "PASS" || echo "FAIL")\","
  echo "  \"duration\": $DURATION,"
  echo "  \"logFile\": \"$LOG_FILE\""
  echo "}"
} > "$JSON_LOG_FILE"

# 結果表示
echo ""
echo "テスト実行が完了しました。"
echo "詳細ログ: $LOG_FILE"
echo "JSON結果: $JSON_LOG_FILE"
echo ""

# 終了コードを返す
exit $TEST_RESULT