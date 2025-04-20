#!/bin/bash

# GitHub Secretsセットアップスクリプト
# 使用方法: ./setup-github-secrets.sh

# 環境設定
REPO="yamatovision/DailyfortuneNativeAPp"
FIREBASE_CONFIG_FILE="./firebase-config.json" # Firebaseの設定JSONファイル
GCP_SA_KEY_FILE="./gcp-service-account.json" # GCPサービスアカウントのJSONキーファイル

# 色の設定
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}DailyFortune GitHub Secrets 設定ユーティリティ${NC}"
echo "このスクリプトは、CI/CDパイプラインに必要なGitHub Secretsを設定します。"
echo

# GitHub CLIが利用可能か確認
if ! command -v gh &> /dev/null; then
    echo -e "${RED}エラー: GitHub CLI (gh) がインストールされていません。${NC}"
    echo "インストール方法: https://cli.github.com/manual/installation"
    exit 1
fi

# GitHub認証確認
echo "GitHub認証状態を確認中..."
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}GitHub認証が必要です。${NC}"
    gh auth login
fi

# リポジトリ確認
echo "リポジトリ ${REPO} へのアクセスを確認中..."
if ! gh repo view $REPO &> /dev/null; then
    echo -e "${RED}エラー: リポジトリ ${REPO} にアクセスできません。${NC}"
    echo "リポジトリが存在するか、アクセス権があるか確認してください。"
    exit 1
fi

echo -e "${GREEN}✓ GitHub認証とリポジトリアクセスを確認しました${NC}"
echo

# 既存のSecretsを確認
echo "既存のSecretsを確認中..."
EXISTING_SECRETS=$(gh secret list -R $REPO --json name --jq '.[].name')
echo -e "${GREEN}✓ 既存のSecrets確認完了${NC}"
echo

# Secret設定関数
set_secret() {
    local name=$1
    local value=$2
    local from_file=$3
    
    if [[ $EXISTING_SECRETS == *"$name"* ]]; then
        echo "Secret '$name' を更新します..."
    else
        echo "Secret '$name' を新規作成します..."
    fi
    
    if [ "$from_file" = true ]; then
        if [ ! -f "$value" ]; then
            echo -e "${RED}エラー: ファイル $value が見つかりません。${NC}"
            return 1
        fi
        gh secret set $name -R $REPO < "$value"
    else
        gh secret set $name -b "$value" -R $REPO
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Secret '$name' を設定しました${NC}"
    else
        echo -e "${RED}× Secret '$name' の設定に失敗しました${NC}"
        return 1
    fi
}

# Google Cloud関連Secrets
echo -e "${YELLOW}Google Cloud関連のSecrets設定${NC}"

# GCP_PROJECT_ID
read -p "Google CloudプロジェクトID: " GCP_PROJECT_ID
set_secret "GCP_PROJECT_ID" "$GCP_PROJECT_ID" false

# GCP_SA_KEY
read -p "GCPサービスアカウントキーのJSONファイルのパス [$GCP_SA_KEY_FILE]: " input
GCP_SA_KEY_FILE=${input:-$GCP_SA_KEY_FILE}
set_secret "GCP_SA_KEY" "$GCP_SA_KEY_FILE" true

# MONGODB_URI
read -p "MongoDB接続URI: " MONGODB_URI
set_secret "MONGODB_URI" "$MONGODB_URI" false

echo

# Firebase関連Secrets
echo -e "${YELLOW}Firebase関連のSecrets設定${NC}"

# Firebase設定ファイルの読み込み（オプション）
read -p "Firebase設定JSONファイルから自動設定しますか？(y/n): " AUTO_FIREBASE
if [[ $AUTO_FIREBASE == "y" || $AUTO_FIREBASE == "Y" ]]; then
    read -p "Firebaseの設定JSONファイルのパス [$FIREBASE_CONFIG_FILE]: " input
    FIREBASE_CONFIG_FILE=${input:-$FIREBASE_CONFIG_FILE}
    
    if [ ! -f "$FIREBASE_CONFIG_FILE" ]; then
        echo -e "${RED}エラー: ファイル $FIREBASE_CONFIG_FILE が見つかりません。${NC}"
    else
        echo "Firebase設定ファイルから値を抽出中..."
        FIREBASE_API_KEY=$(cat "$FIREBASE_CONFIG_FILE" | jq -r '.apiKey')
        FIREBASE_AUTH_DOMAIN=$(cat "$FIREBASE_CONFIG_FILE" | jq -r '.authDomain')
        FIREBASE_PROJECT_ID=$(cat "$FIREBASE_CONFIG_FILE" | jq -r '.projectId')
        FIREBASE_STORAGE_BUCKET=$(cat "$FIREBASE_CONFIG_FILE" | jq -r '.storageBucket')
        FIREBASE_MESSAGING_SENDER_ID=$(cat "$FIREBASE_CONFIG_FILE" | jq -r '.messagingSenderId')
        FIREBASE_APP_ID=$(cat "$FIREBASE_CONFIG_FILE" | jq -r '.appId')
        
        set_secret "FIREBASE_API_KEY" "$FIREBASE_API_KEY" false
        set_secret "FIREBASE_AUTH_DOMAIN" "$FIREBASE_AUTH_DOMAIN" false
        set_secret "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID" false
        set_secret "FIREBASE_STORAGE_BUCKET" "$FIREBASE_STORAGE_BUCKET" false
        set_secret "FIREBASE_MESSAGING_SENDER_ID" "$FIREBASE_MESSAGING_SENDER_ID" false
        set_secret "FIREBASE_APP_ID" "$FIREBASE_APP_ID" false
    fi
else
    # 手動入力
    read -p "Firebase API Key: " FIREBASE_API_KEY
    set_secret "FIREBASE_API_KEY" "$FIREBASE_API_KEY" false
    
    read -p "Firebase Auth Domain: " FIREBASE_AUTH_DOMAIN
    set_secret "FIREBASE_AUTH_DOMAIN" "$FIREBASE_AUTH_DOMAIN" false
    
    read -p "Firebase Project ID: " FIREBASE_PROJECT_ID
    set_secret "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID" false
    
    read -p "Firebase Storage Bucket: " FIREBASE_STORAGE_BUCKET
    set_secret "FIREBASE_STORAGE_BUCKET" "$FIREBASE_STORAGE_BUCKET" false
    
    read -p "Firebase Messaging Sender ID: " FIREBASE_MESSAGING_SENDER_ID
    set_secret "FIREBASE_MESSAGING_SENDER_ID" "$FIREBASE_MESSAGING_SENDER_ID" false
    
    read -p "Firebase App ID: " FIREBASE_APP_ID
    set_secret "FIREBASE_APP_ID" "$FIREBASE_APP_ID" false
fi

# Firebase Service Account
read -p "Firebaseサービスアカウントのファイルパス: " FIREBASE_SA_FILE
if [ -n "$FIREBASE_SA_FILE" ]; then
    set_secret "FIREBASE_SERVICE_ACCOUNT" "$FIREBASE_SA_FILE" true
fi

echo
echo -e "${GREEN}GitHub Secrets設定が完了しました！${NC}"
echo "設定されたSecretsは以下のように確認できます："
echo "  gh secret list -R $REPO"
echo
echo "CI/CDパイプラインが正常に動作するようになりました。"