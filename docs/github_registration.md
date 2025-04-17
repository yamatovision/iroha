# GitHubリポジトリ登録手順

このドキュメントでは、DailyFortuneアプリケーションをGitHubリポジトリに登録する手順を説明します。

## 前提条件

1. [GitHub](https://github.com/)アカウントを持っていること
2. ローカル環境にGitがインストールされていること
3. GitHubユーザー名とメールアドレスの設定が完了していること

## 手順

### 1. GitHubでの新規リポジトリ作成

1. [GitHub](https://github.com/)にログイン
2. 画面右上の「+」アイコンをクリックし、「New repository」を選択
3. リポジトリ作成画面で以下の情報を入力：
   - Repository name: `daily-fortune`
   - Description: `DailyFortune - 四柱推命に基づく運勢管理・チーム相性分析アプリケーション`
   - Visibility: Private（プライベートリポジトリ）
   - README fileの初期化: チェックを外す
   - .gitignoreの追加: Node を選択
   - ライセンスの追加: なし
4. 「Create repository」ボタンをクリック

### 2. ローカルプロジェクトをGitリポジトリとして初期化

```bash
# プロジェクトのルートディレクトリに移動
cd /Users/tatsuya/Desktop/システム開発/DailyFortune

# Gitリポジトリとして初期化
git init

# .gitignoreファイルの作成（GitHub側で作成した場合は不要）
cat > .gitignore << 'EOF'
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Dependency directories
node_modules/
jspm_packages/

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# Build directories
dist/
build/
out/

# Firebase
.firebase/
.firebaserc
firebase-debug.log

# Coverage directory
coverage/

# Mac OS
.DS_Store

# IDE
.idea/
.vscode/
*.sublime-*
*.swp
*.swo

# Temp files
.tmp/
tmp/
temp/
EOF

# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "初期コミット：DailyFortuneアプリケーション"
```

### 3. GitHubリポジトリをリモートとして追加

```bash
# GitHubリポジトリをリモートとして追加（YOUR_USERNAME をあなたのGitHubユーザー名に置き換える）
git remote add origin https://github.com/YOUR_USERNAME/daily-fortune.git

# デフォルトブランチ名を main に設定
git branch -M main

# GitHubにプッシュ
git push -u origin main
```

### 4. チーム開発のためのブランチ戦略設定

```bash
# 開発用ブランチを作成
git checkout -b develop
git push -u origin develop

# 初期機能ブランチ（認証機能）を作成
git checkout -b feature/auth
git push -u origin feature/auth
```

### 5. GitHubリポジトリの設定

GitHubリポジトリのウェブインターフェースで以下の設定を行います：

1. **ブランチ保護ルールの設定**:
   - リポジトリの「Settings」→「Branches」→「Branch protection rules」→「Add rule」
   - Branch name pattern: `main`
   - 「Require pull request reviews before merging」にチェック
   - 「Require status checks to pass before merging」にチェック

2. **コラボレーターの追加**:
   - リポジトリの「Settings」→「Collaborators」→「Add people」
   - チームメンバーのGitHubユーザー名またはメールアドレスを入力して招待

3. **プロジェクトボードの設定**:
   - リポジトリの「Projects」→「New project」
   - テンプレート: 「Basic kanban」を選択
   - 以下のカラムを設定：「To do」、「In progress」、「Review」、「Done」

### 6. CIワークフローの設定（オプション）

GitHub Actionsを使用した基本的なCIワークフローを設定します：

```bash
# .github/workflowsディレクトリを作成
mkdir -p .github/workflows

# CI設定ファイルを作成
cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  server-test:
    runs-on: ubuntu-latest
    
    defaults:
      run:
        working-directory: ./server
        
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16.x'
    - name: Install dependencies
      run: npm ci
    - name: Run linting
      run: npm run lint
    - name: Run type checking
      run: npm run typecheck
    - name: Run tests
      run: npm test

  client-test:
    runs-on: ubuntu-latest
    
    defaults:
      run:
        working-directory: ./client
        
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16.x'
    - name: Install dependencies
      run: npm ci
    - name: Run linting
      run: npm run lint
    - name: Run type checking
      run: npm run typecheck
    - name: Run tests
      run: npm test
EOF

# CIワークフロー設定をコミット
git add .github/workflows/ci.yml
git commit -m "GitHub Actions CI ワークフローを追加"
git push
```

### 7. PRテンプレートの設定（オプション）

```bash
# .github/PULL_REQUEST_TEMPLATEディレクトリを作成
mkdir -p .github/PULL_REQUEST_TEMPLATE

# PRテンプレートファイルを作成
cat > .github/PULL_REQUEST_TEMPLATE/default.md << 'EOF'
## 変更内容

<!-- 変更内容を簡潔に記述してください -->

## 関連するIssue

<!-- 関連するIssue番号を記載してください -->
<!-- 例: Closes #123 -->

## テスト内容

<!-- どのようにテストしたか記述してください -->
- [ ] 単体テスト
- [ ] 統合テスト
- [ ] 手動テスト

## スクリーンショット（必要な場合）

<!-- 変更の視覚的な証拠が必要な場合、スクリーンショットを追加してください -->

## チェックリスト
- [ ] コード品質（リーダブルで保守しやすいコード）
- [ ] テストの網羅性
- [ ] ドキュメントの更新
- [ ] モバイル対応
- [ ] ブラウザの互換性
- [ ] アクセシビリティ
EOF

# PRテンプレートをコミット
git add .github/PULL_REQUEST_TEMPLATE/default.md
git commit -m "PRテンプレートを追加"
git push
```

## 注意事項

1. **機密情報の管理**:
   - `.env`ファイルは`.gitignore`に含めてリポジトリに保存しないでください
   - Firebase設定情報やAPIキーなどの機密情報はGitHubのSecretsとして保存してください

2. **ブランチ運用**:
   - `main`: 本番環境用の安定ブランチ
   - `develop`: 開発環境用の統合ブランチ
   - `feature/*`: 個別機能の開発ブランチ
   - `hotfix/*`: 緊急バグ修正用ブランチ

3. **バージョン管理**:
   - セマンティックバージョニング（SemVer）を採用することを推奨
   - 重要なリリースにはタグをつける: `git tag -a v1.0.0 -m "バージョン1.0.0リリース"`

4. **コミットメッセージ**:
   - 日本語または英語で一貫性のあるコミットメッセージを書く
   - 接頭辞を使用してコミットタイプを示す（例: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`）

## 参考リンク

- [GitHub公式ドキュメント](https://docs.github.com/ja)
- [プロフェッショナルGit](https://git-scm.com/book/ja/v2)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [セマンティックバージョニング](https://semver.org/lang/ja/)