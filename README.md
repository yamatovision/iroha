# DailyFortune Native - 経営者向け人材管理ツール（モバイルアプリ版）

DailyFortuneは、四柱推命に基づいた日々の運勢とチームメンバーとの相性を可視化する経営者向けの人材管理ツールです。このリポジトリはCapacitorを使用したネイティブモバイルアプリ版の実装を管理しています。

## データモデル管理について

このプロジェクトのデータモデル定義は `/docs/data_models.md` で一元管理されています。

AI開発者の皆さんへ：
- モデルに関する変更が必要な場合は、必ず最初に `data_models.md` を確認・更新してください
- 変更内容と日付を変更履歴セクションに記録してください
- その後、実装（`shared/index.ts` および `server/src/types/index.ts` など）を更新してください

## デプロイURL

- 一般ユーザー向け: [https://dailyfortune.web.app](https://dailyfortune.web.app)
- 管理者向け: [https://dailyfortune-admin.web.app](https://dailyfortune-admin.web.app)

## 機能概要

- ユーザーの四柱推命プロファイル作成
- 日々の運勢と仕事のアドバイス提供
- チームメンバー間の相性分析
- AIチャットによる個人・チーム運勢相談
- 管理者向けダッシュボード

## プロジェクト構成

- **クライアントアプリ**: React.js + TypeScript + Material UI + **Capacitor**
- **管理者用アプリ**: React.js + TypeScript + Material UI
- **バックエンドAPI**: Node.js + Express + TypeScript + MongoDB
- **認証**: JWT認証 (Firebase Authから移行)
- **ネイティブ機能**: Capacitorプラグイン（ストレージ、プッシュ通知、ネットワーク監視など）

## 開発環境のセットアップ

### 前提条件

- Node.js (v18以上)
- MongoDB
- Android Studio (Androidビルド用)
- Xcode (iOSビルド用、Macのみ)
- CocoaPods (iOSビルド用)

### インストール

1. リポジトリをクローン
   ```
   git clone https://github.com/yamatovision/dailyfortune-native.git
   cd dailyfortune-native
   ```

2. 各ディレクトリで依存関係をインストール
   ```
   # クライアントアプリ
   cd client
   npm install

   # バックエンドAPI
   cd ../server
   npm install

   # 管理者用アプリ
   cd ../admin
   npm install
   ```

3. 環境変数の設定

各ディレクトリに`.env`ファイルを作成し、必要な環境変数を設定してください。サンプル設定は`docs/env.md`を参照してください。

### 開発サーバーの起動

```
# クライアントアプリ（Web版として開発）
cd client
npm run dev

# バックエンドAPI
cd server
npm run dev

# 管理者用アプリ
cd admin
npm run dev
```

### ネイティブアプリのビルドと実行

```
# Webアプリケーションをビルド
cd client
npm run build

# Android版の同期とオープン
npx cap sync android
npx cap open android

# iOS版の同期とオープン（Macのみ）
npx cap sync ios
npx cap open ios
```

## ライセンス

本プロジェクトはプライベートソフトウェアであり、許可なく使用、複製、配布することはできません。