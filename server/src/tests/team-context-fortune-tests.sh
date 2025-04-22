#!/bin/bash

# Team Context Fortune テストスクリプト
# チームコンテキスト運勢の実装に対するテストを実行します

# 色の設定
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}チームコンテキスト運勢テストを開始します${NC}"

# TypeScriptエラーチェック（最優先）
echo -e "\n${YELLOW}TypeScriptエラーチェックを実行中...${NC}"
npx tsc --noEmit

if [ $? -ne 0 ]; then
  echo -e "${RED}TypeScriptエラーがあります。テストを実行する前に修正してください。${NC}"
  exit 1
fi

echo -e "${GREEN}TypeScriptエラーなし - テストを続行します${NC}"

# サービステスト
echo -e "\n${YELLOW}チームコンテキスト運勢サービステストを実行中...${NC}"
npx jest src/tests/services/team-context-fortune.service.test.ts --verbose

# コントローラーテスト
echo -e "\n${YELLOW}チームコンテキスト運勢コントローラーテストを実行中...${NC}"
npx jest src/tests/controllers/team-context-fortune.controller.test.ts --verbose

# バッチテスト（長時間かかる可能性があるため条件付き実行）
echo -e "\n${YELLOW}バッチ処理テストを実行しますか？（y/n）${NC}"
read -r run_batch_test

if [ "$run_batch_test" = "y" ]; then
  echo -e "\n${YELLOW}チームコンテキスト運勢バッチテストを実行中...${NC}"
  npx jest src/tests/batch/team-context-fortune-batch.test.ts --verbose
else
  echo -e "\n${YELLOW}バッチ処理テストをスキップします${NC}"
fi

echo -e "\n${GREEN}すべてのテストが完了しました${NC}"