require('dotenv').config({ path: '../.env' });
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const fs = require('fs');
const path = require('path');

// Firebaseの初期化
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// テスト用トークンを生成する
async function generateTestToken() {
  try {
    console.log('Firebaseクライアント初期化...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    // ユーザー情報
    const email = 'shiraishi.tatsuya@mikoto.co.jp';
    const password = process.argv[2]; // パスワードはコマンドライン引数から
    
    if (!password) {
      console.error('パスワードを指定してください: node generate-auth-token.js PASSWORD');
      process.exit(1);
    }
    
    console.log(`ユーザー ${email} でログイン中...`);
    
    // ログイン実行
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // IDトークンを取得
    const token = await user.getIdToken();
    console.log('認証トークン取得成功!');
    
    // トークンをファイルに保存
    const tokenFile = path.join(__dirname, '../test-token.txt');
    fs.writeFileSync(tokenFile, token);
    console.log(`トークンを ${tokenFile} に保存しました`);
    
    // 有効期限を計算（Firebase IDトークンは通常1時間有効）
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    console.log(`トークンの有効期限: ${expiry.toISOString()}`);
    console.log('トークンの最初の30文字:');
    console.log(token.substring(0, 30) + '...');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    if (error.code === 'auth/invalid-credential') {
      console.error('認証情報（メールアドレスまたはパスワード）が無効です。');
    }
  }
}

// スクリプト実行
generateTestToken();