# ビルドステージ
FROM node:18-alpine AS build

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm install

# ソースコードのコピー
COPY . .

# アプリケーションのビルド
RUN npm run build

# 実行ステージ
FROM node:18-alpine

WORKDIR /app

# 必要なファイルのみコピー
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/sajuengine_package ./sajuengine_package

# ディレクトリ構造を確認
RUN ls -la && ls -la dist

# ポート公開
EXPOSE 8080

# 起動コマンド
CMD ["node", "dist/src/index.js"]