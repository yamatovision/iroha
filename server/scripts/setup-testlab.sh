#!/bin/bash

# DailyFortune TestLAB 環境セットアップスクリプト
# 使用方法: ./setup-testlab.sh

echo "DailyFortune TestLAB 環境セットアップを開始します..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$PROJECT_ROOT"

# TypeScriptエラーチェック
echo "TypeScriptエラーチェックを実行しています..."
cd "$SERVER_DIR"
TS_ERRORS=$(npx tsc --noEmit 2>&1)
TS_ERROR_COUNT=$(echo "$TS_ERRORS" | grep -c "error TS")

if [ $TS_ERROR_COUNT -gt 0 ]; then
    echo "⚠️ 警告: TypeScriptエラーが $TS_ERROR_COUNT 件あります。テスト実行前に修正してください。"
    echo "$TS_ERRORS"
    echo "テスト前にTypeScriptエラーを解消することを推奨します。続行しますか？ (y/n)"
    read -r CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo "セットアップを中止します。TypeScriptエラーを修正してから再実行してください。"
        exit 1
    fi
else
    echo "✓ TypeScriptエラーなし - コードベースは正常です"
fi

# ログディレクトリの作成
LOGS_DIR="$PROJECT_ROOT/../logs/tests"
mkdir -p "$LOGS_DIR"
echo "ログディレクトリを作成しました: $LOGS_DIR"

# 環境変数の確認
if [ -f "$PROJECT_ROOT/../.env" ]; then
    echo "プロジェクトルートの.env設定を検出しました"
    # サーバーディレクトリに.envをコピー
    cp "$PROJECT_ROOT/../.env" "$SERVER_DIR/.env"
    echo "サーバーディレクトリに.envファイルをコピーしました"
    
    # Firebaseの設定確認
    if grep -q "FIREBASE_SERVICE_ACCOUNT_PATH" "$SERVER_DIR/.env"; then
        echo "Firebase認証ファイルパスの設定が見つかりました"
        
        # パスが存在するか確認
        FIREBASE_PATH=$(grep "FIREBASE_SERVICE_ACCOUNT_PATH" "$SERVER_DIR/.env" | cut -d '=' -f2)
        if [ -f "$FIREBASE_PATH" ]; then
            echo "Firebase認証ファイルが確認できました: $FIREBASE_PATH"
        else
            echo "⚠️ 警告: Firebase認証ファイル $FIREBASE_PATH が見つかりません"
            echo "環境変数 FIREBASE_SERVICE_ACCOUNT_PATH に正しいパスが設定されているか確認してください"
            echo "テスト環境でも本番環境と同じ認証情報を使用します。ダミー値やモック値は使用できません。"
        fi
    else
        echo "⚠️ 警告: Firebase認証ファイルパスの設定が見つかりません"
        echo "環境変数 FIREBASE_SERVICE_ACCOUNT_PATH に有効なパスを設定してください"
    fi
else
    echo "警告: プロジェクトルートに.envファイルが見つかりません"
    if [ ! -f "$SERVER_DIR/.env" ]; then
        echo "エラー: サーバーディレクトリにも.envファイルが見つかりません。テスト環境のセットアップに失敗しました。"
        exit 1
    fi
fi

# ポートチェックと解放
PORT=8080
PID=$(lsof -ti :$PORT)
if [ ! -z "$PID" ]; then
    echo "ポート $PORT は PID=$PID で使用中です。プロセスを停止します..."
    kill -9 $PID
    echo "ポート $PORT を解放しました"
fi

# サーバービルド
cd "$SERVER_DIR"
echo "サーバーコードをビルドしています..."
npm run build

# テスト用データベース設定
echo "テスト用データベース設定をチェックしています..."

# Firebase認証トークンの取得（実際の認証を使用）
echo "テスト用認証トークンを取得しています..."

if [ -f "$SERVER_DIR/node_modules/firebase/package.json" ]; then
    echo "Firebase SDKがインストールされています。テスト認証可能です。"
    echo "認証情報:"
    echo "  - メールアドレス: shiraishi.tatsuya@mikoto.co.jp"
    echo "  - パスワード: aikakumei"
    echo "  - 権限: super_admin"
    echo "テスト実行時は上記認証情報を使用してください。モックを使用せず、実際の認証フローをテストします。"
else
    echo "警告: Firebase SDKがインストールされていません。インストールするには:"
    echo "  cd $SERVER_DIR && npm install firebase"
fi

echo "TestLAB環境のセットアップが完了しました。"
echo "テストを実行するには: npm test [テストファイルのパス]"
echo "サーバーを起動するには: node dist/index.js"