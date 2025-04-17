#!/bin/bash

# Firebase App Distribution アップロードスクリプト
# 使用方法: ./firebase-distribution.sh

# 必要なツールのチェック
command -v firebase >/dev/null 2>&1 || { echo "Firebase CLIが必要です。'npm install -g firebase-tools'でインストールしてください。"; exit 1; }

echo "===== Firebase App Distribution アップロード処理開始 ====="

# ディレクトリの確認と移動
PROJECT_ROOT=$(pwd)
ANDROID_DIR="${PROJECT_ROOT}/android"

if [ ! -d "$ANDROID_DIR" ]; then
  echo "Error: Androidディレクトリが見つかりません。クライアントディレクトリから実行してください。"
  exit 1
fi

# google-services.jsonの存在確認
if [ ! -f "${ANDROID_DIR}/app/google-services.json" ]; then
  echo "警告: google-services.jsonが見つかりません。テンプレートからコピーします。"
  echo "本番環境では必ず本物のgoogle-services.jsonを配置してください。"
  
  # テンプレートからコピー
  if [ -f "${ANDROID_DIR}/app/google-services.json.template" ]; then
    cp "${ANDROID_DIR}/app/google-services.json.template" "${ANDROID_DIR}/app/google-services.json"
    echo "テンプレートからgoogle-services.jsonをコピーしました。"
  else
    echo "Error: テンプレートファイルも見つかりません。"
    exit 1
  fi
fi

# ビルドとアップロード
cd "$ANDROID_DIR"
echo "リリースビルドを作成しています..."
./gradlew clean assembleRelease

# APKが正常に生成されたか確認
APK_PATH="${ANDROID_DIR}/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK_PATH" ]; then
  echo "Error: APKの生成に失敗しました。"
  exit 1
fi

echo "Firebase App Distributionにアップロードしています..."
./gradlew appDistributionUploadRelease

echo "===== 処理完了 ====="
echo "APK生成場所: ${APK_PATH}"
echo "Firebase App Distributionへのアップロードが完了しました。"