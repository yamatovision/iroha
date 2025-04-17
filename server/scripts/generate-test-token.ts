import * as firebase from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import * as fs from 'fs';
import * as path from 'path';

// Firebaseの初期化
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// テスト用トークンを生成する
async function generateTestToken() {
  try {
    // Firebaseアプリを初期化
    const app = firebase.initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    // テスト用のユーザー情報（環境変数から読み込むかハードコード）
    const email = process.env.TEST_SUPERADMIN_EMAIL || 'superadmin@example.com';
    const password = process.env.TEST_SUPERADMIN_PASSWORD || 'Password123!';
    
    console.log(`${email}でログインを試みます...`);
    
    // ログイン実行
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // IDトークンを取得
    const token = await user.getIdToken();
    console.log('トークンの取得に成功しました');
    
    // トークンをファイルに保存
    const tokenFile = path.join(__dirname, 'test-token.txt');
    fs.writeFileSync(tokenFile, token);
    console.log(`トークンを ${tokenFile} に保存しました`);
    
    // 有効期限を計算（Firebase IDトークンは通常1時間有効）
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    console.log(`トークンの有効期限: ${expiry.toISOString()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('トークン生成中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
generateTestToken();