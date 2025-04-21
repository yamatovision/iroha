/**
 * 友達機能APIエンドポイントテスト（簡易バージョン）
 * このスクリプトは友達機能関連のエンドポイントの存在確認とレスポンス検証を行います
 */

const axios = require('axios');
require('dotenv').config();

// 設定
const API_URL = process.env.API_URL || 'http://localhost:8080';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const API_ENDPOINTS = [
  { path: '/api/v1/friends', method: 'GET', description: '友達一覧取得API' },
  { path: '/api/v1/friends/search?query=test', method: 'GET', description: 'ユーザー検索API' },
  { path: '/api/v1/friends/requests', method: 'GET', description: '受信した友達リクエスト一覧API' },
  { path: '/api/v1/friends/sent-requests', method: 'GET', description: '送信した友達リクエスト一覧API' }
];

// HTTPクライアント
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` },
  validateStatus: () => true // すべてのステータスコードを許可
});

// エンドポイントテスト
async function testEndpoint({ path, method, description }) {
  console.log(`\n=== テスト: ${description} ===`);
  console.log(`リクエスト: ${method} ${path}`);
  
  try {
    let response;
    if (method === 'GET') {
      response = await api.get(path);
    } else if (method === 'POST') {
      response = await api.post(path, {});
    }
    
    console.log(`ステータスコード: ${response.status}`);
    console.log(`レスポンスヘッダー: ${JSON.stringify(response.headers, null, 2)}`);
    
    if (response.data) {
      console.log(`レスポンスデータ: ${JSON.stringify(response.data, null, 2)}`);
    }
    
    // ステータス評価
    if (response.status === 200 || response.status === 201) {
      console.log('✅ 成功: APIエンドポイントが正常に応答しました');
      return true;
    } else if (response.status === 401) {
      console.log('⚠️ 認証エラー: 有効なトークンが必要です');
    } else if (response.status === 404) {
      console.log('❌ Not Found: このエンドポイントは実装されていない可能性があります');
    } else {
      console.log(`❌ エラー: ステータスコード ${response.status}`);
    }
    
    return false;
  } catch (error) {
    console.error('⚠️ リクエストエラー:', error.message);
    return false;
  }
}

// メイン実行関数
async function runTests() {
  if (!AUTH_TOKEN) {
    console.error('⚠️ 警告: AUTH_TOKEN環境変数が設定されていません。認証が必要なAPIは失敗します。');
  }
  
  console.log('===== 友達機能APIエンドポイントテスト開始 =====');
  console.log(`API URL: ${API_URL}`);
  
  let successCount = 0;
  
  // 各エンドポイントをテスト
  for (const endpoint of API_ENDPOINTS) {
    const success = await testEndpoint(endpoint);
    if (success) successCount++;
  }
  
  console.log('\n===== テスト完了 =====');
  console.log(`結果: ${successCount}/${API_ENDPOINTS.length} のエンドポイントが正常に応答`);
  
  if (successCount === 0) {
    console.log('❌ すべてのエンドポイントが失敗しました');
    console.log('考えられる原因:');
    console.log('1. サーバーが起動していない');
    console.log('2. APIアドレスが間違っている');
    console.log('3. 認証トークンが無効');
    console.log('4. APIエンドポイントが実装されていない');
  } else if (successCount < API_ENDPOINTS.length) {
    console.log('⚠️ 一部のエンドポイントが失敗しました');
    console.log('未実装の可能性のあるエンドポイントを確認してください');
  } else {
    console.log('✅ すべてのAPIエンドポイントが正常に動作しています');
  }
}

// スクリプト実行
runTests();