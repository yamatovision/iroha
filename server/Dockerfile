# ビルドステージ
FROM node:18-alpine AS build

WORKDIR /app

# package.jsonをコピーして依存関係をインストール
COPY package*.json ./
RUN npm install

# ソースコードのコピー
COPY . .

# sajuengineパッケージをシンボリックリンクとして設定
RUN mkdir -p node_modules/saju-engine
RUN cp -r sajuengine_package/src/* node_modules/saju-engine/

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

# ディレクトリ構造を確認と起動確認
RUN ls -la && ls -la dist && find dist -name "index.js"

# ポート公開
EXPOSE 8080

# 起動コマンド
CMD ["node", "dist/index.js"]