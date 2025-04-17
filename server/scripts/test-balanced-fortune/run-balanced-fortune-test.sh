#!/bin/bash

# 現在のディレクトリを保存
CURRENT_DIR=$(pwd)

# サーバーディレクトリに移動
cd "$(dirname "$0")/../.."

# 環境変数を設定
export USE_BALANCED_FORTUNE_ALGORITHM=true

# テストスクリプトを実行
echo "五行バランス・用神ベース運勢スコア計算テストを実行中..."
node ./scripts/test-balanced-fortune/test-balanced-fortune-algorithm.js

# 終了コードを取得
EXIT_CODE=$?

# 元のディレクトリに戻る
cd "$CURRENT_DIR"

# テスト結果に応じたメッセージを表示
if [ $EXIT_CODE -eq 0 ]; then
  echo "テストが正常に完了しました。"
else
  echo "テストに失敗しました。"
fi

exit $EXIT_CODE