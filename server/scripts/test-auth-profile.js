/**
 * /api/v1/auth/profile エンドポイントのテストスクリプト
 * 
 * 使用方法: 
 *   node test-auth-profile.js [トークン]
 * 
 * 引数なしで実行すると内部で認証トークンを取得して使用します。
 */
require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebaseの設定情報
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// APIのベースURL
const API_BASE_URL = 'http://localhost:8080/api/v1';

async function getToken(email, password) {
  try {
    // Firebaseアプリを初期化
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // ログイン実行
    console.log(`${email} でログイン中...`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // IDトークンを取得
    const token = await user.getIdToken();
    console.log(`認証トークンを取得しました`);
    
    return token;
  } catch (error) {
    console.error('認証エラーが発生しました:', error);
    throw error;
  }
}

async function testAuthProfile(token) {
  try {
    console.log('=== auth/profile エンドポイントテスト開始 ===');
    console.log(`APIエンドポイント: ${API_BASE_URL}/auth/profile`);
    
    // APIリクエスト送信
    console.log('リクエスト送信中...');
    const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // 結果を表示
    console.log('\n=== テスト結果 ===');
    console.log('ステータスコード:', response.status);
    console.log('レスポンスヘッダー:', JSON.stringify(response.headers, null, 2));
    console.log('レスポンスボディ:', JSON.stringify(response.data, null, 2));
    console.log('\n=== テスト成功 ===');
    
    return response.data;
  } catch (error) {
    console.error('\n=== テスト失敗 ===');
    console.error('ステータスコード:', error.response?.status);
    console.error('エラーメッセージ:', error.response?.data || error.message);
    console.error('ヘッダー:', JSON.stringify(error.response?.headers, null, 2));
    console.error('=== エラー詳細 ===');
    console.error(error);
    
    throw error;
  }
}

async function main() {
  let token = process.argv[2];
  
  if (!token) {
    // トークンが指定されていない場合は取得を試みる
    console.log('トークンが指定されていません。認証を実行します...');
    const email = 'shiraishi.tatsuya@mikoto.co.jp';
    const password = 'aikakumei';
    token = await getToken(email, password);
  }
  
  // プロファイルAPIをテスト
  await testAuthProfile(token);
}

main().catch(error => {
  console.error('テスト実行中にエラーが発生しました:', error);
  process.exit(1);
});