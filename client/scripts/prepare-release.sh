#!/bin/bash

# リリース準備スクリプト
# 使用方法: ./prepare-release.sh [バージョン番号]

# バージョン番号チェック
if [ -z "$1" ]; then
  echo "バージョン番号を指定してください（例: ./prepare-release.sh 1.0.1-beta）"
  exit 1
fi

VERSION="$1"
VERSION_CODE=$(echo "$VERSION" | sed 's/[^0-9]//g' | sed 's/^0*//')
if [ ${#VERSION_CODE} -lt 4 ]; then
  # バージョンコードが4桁未満の場合は前に0を追加して4桁にする
  VERSION_CODE=$(printf "%04d" "$VERSION_CODE")
fi

echo "===== リリース準備処理開始 ($VERSION) ====="
echo "バージョン番号: $VERSION"
echo "バージョンコード: $VERSION_CODE"

# ディレクトリの確認
PROJECT_ROOT=$(pwd)
echo "プロジェクトルート: $PROJECT_ROOT"

# package.jsonの更新
echo "package.jsonを更新しています..."
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" package.json

# capacitor.config.tsの更新
echo "capacitor.config.tsを更新しています..."
sed -i '' "s/appVersion: '[^']*'/appVersion: '$VERSION'/" capacitor.config.ts
sed -i '' "s/appBuildNumber: '[^']*'/appBuildNumber: '$VERSION_CODE'/" capacitor.config.ts

# Androidビルド設定の更新
echo "Android build.gradleを更新しています..."
sed -i '' "s/versionCode [0-9]*/versionCode $VERSION_CODE/" android/app/build.gradle
sed -i '' "s/versionName \"[^\"]*\"/versionName \"$VERSION\"/" android/app/build.gradle

# iOS設定の更新
echo "iOS project.pbxprojを更新しています..."
sed -i '' "s/MARKETING_VERSION = [^;]*/MARKETING_VERSION = $VERSION/" ios/App/App.xcodeproj/project.pbxproj
sed -i '' "s/CURRENT_PROJECT_VERSION = [^;]*/CURRENT_PROJECT_VERSION = $VERSION_CODE/" ios/App/App.xcodeproj/project.pbxproj

echo "===== リリース準備処理完了 ====="
echo "次に実行すべきこと:"
echo "1. 'npm run build' を実行して最新ビルドを生成する"
echo "2. 'npx cap sync' を実行してネイティブプロジェクトを同期する"
echo "3. Android Studio/Xcodeでプロジェクトを開いて最終確認を行う"
echo "4. ビルド・配布スクリプトを実行してテスト配布を行う"