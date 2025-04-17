#!/bin/bash

# チャットストリーミングテストに必要なパッケージをインストール
echo "チャットストリーミングテストに必要なパッケージをインストールします..."

# node-fetchのインストール（HTTP通信用）
npm install --save-dev node-fetch@2

# eventsourceのインストール（SSE用）
npm install --save-dev eventsource

echo "セットアップ完了！"
echo "テストを実行するには以下のコマンドを使用してください："
echo "node scripts/test-chat-streaming.js"