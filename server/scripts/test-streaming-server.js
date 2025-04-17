/**
 * ストリーミングテスト用の簡易HTTPサーバー
 * 
 * 使い方:
 * node test-streaming-server.js
 * ブラウザで http://localhost:3030 にアクセス
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ポート設定
const PORT = 3030;

// サーバーの作成
const server = http.createServer((req, res) => {
  console.log(`リクエスト: ${req.method} ${req.url}`);
  
  // HTMLファイルを提供
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'stream-test.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error: ${err.message}`);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    return;
  }
  
  // その他のリクエストには404を返す
  res.writeHead(404);
  res.end('Not Found');
});

// サーバーの起動
server.listen(PORT, () => {
  console.log(`ストリーミングテストサーバーが起動しました: http://localhost:${PORT}`);
  console.log(`ブラウザでアクセスしてテストしてください`);
  console.log(`Ctrl+Cで終了`);
});