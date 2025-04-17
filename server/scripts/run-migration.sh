#!/bin/bash
# MongoDB ObjectID標準化と JWT認証への移行を実行するスクリプト

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 現在の時刻を取得
NOW=$(date +"%Y-%m-%d_%H-%M-%S")

# ログ出力先ディレクトリ
LOG_DIR="./scripts/migration-logs"
mkdir -p $LOG_DIR

# ログファイル
LOG_FILE="$LOG_DIR/migration-${NOW}.log"

# ヘッダー表示
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Firebase UID → MongoDB ObjectID 移行実行${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 現在のブランチを取得
CURRENT_BRANCH=$(git branch --show-current)
echo -e "現在のブランチ: ${YELLOW}${CURRENT_BRANCH}${NC}"
echo ""

# 確認
echo -e "${YELLOW}警告:${NC} このスクリプトは Firebase UID から MongoDB ObjectID への移行を実行します。"
echo -e "移行は以下のステップで実行されます:"
echo "1. 現在の状態チェック (--check)"
echo "2. 移行の実行 (--migrate)"
echo "3. 移行の検証 (--verify)"
echo ""
echo -e "${RED}重要:${NC} 移行の前にはデータベースのバックアップを必ず作成してください。"
echo ""
read -p "移行を実行しますか？ (y/N): " confirmation

if [[ ! $confirmation =~ ^[Yy]$ ]]; then
    echo "移行をキャンセルしました。"
    exit 0
fi

# バックアップの確認
read -p "データベースのバックアップを作成しましたか？ (y/N): " backup_confirmation

if [[ ! $backup_confirmation =~ ^[Yy]$ ]]; then
    echo -e "${RED}バックアップが必要です。移行をキャンセルします。${NC}"
    exit 1
fi

# 移行の実行
echo ""
echo -e "${GREEN}***** ステップ1: 現在の状態チェック *****${NC}"
echo "現在の状態をチェックしています..."
npx ts-node server/scripts/firebase-to-objectid-migration.ts --check | tee -a $LOG_FILE

echo ""
echo -e "${GREEN}***** ステップ2: 移行の実行 *****${NC}"
echo "移行を実行します。この処理には時間がかかる場合があります..."
read -p "移行を実行しますか？ (y/N): " migrate_confirmation

if [[ ! $migrate_confirmation =~ ^[Yy]$ ]]; then
    echo "移行をキャンセルしました。"
    exit 0
fi

npx ts-node server/scripts/firebase-to-objectid-migration.ts --migrate | tee -a $LOG_FILE

echo ""
echo -e "${GREEN}***** ステップ3: 移行の検証 *****${NC}"
echo "移行結果を検証しています..."
npx ts-node server/scripts/firebase-to-objectid-migration.ts --verify | tee -a $LOG_FILE

echo ""
echo -e "${GREEN}移行プロセスが完了しました${NC}"
echo -e "ログは ${BLUE}${LOG_FILE}${NC} に保存されています。"
echo ""
echo -e "${YELLOW}注意:${NC} 移行に問題がなかった場合、Firebase UIDの参照（uidとfirebaseUidフィールド）を"
echo "削除できます。これを行うには、以下のコマンドを実行してください:"
echo ""
echo -e "  ${BLUE}npx ts-node server/scripts/firebase-to-objectid-migration.ts --cleanup${NC}"
echo ""
echo -e "${RED}警告:${NC} クリーンアップを実行すると、Firebase UIDへの参照がすべて削除され、"
echo "元に戻すことができなくなります。必ず十分にテストを行ってから実行してください。"