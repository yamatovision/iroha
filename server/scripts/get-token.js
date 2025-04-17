/**
 * Firebase認証トークン取得スクリプト
 * 
 * Firebaseに対して直接認証を行い、IDトークンを取得するためのスクリプトです。
 * テスト実行時や管理者API呼び出し時の認証トークン取得に使用します。
 * 
 * 使用方法: 
 *   node get-token.js メールアドレス パスワード
 * 
 * 例:
 *   node get-token.js shiraishi.tatsuya@mikoto.co.jp aikakumei
 * 
 * 出力:
 *   認証トークン: xxxxxx.yyyyy.zzzzz
 *   UID: ユーザーUID
 *   メール: ユーザーメールアドレス
 *   表示名: ユーザー表示名
 *   有効期限: トークン有効期限
 * 
 * 環境変数:
 *   VITE_FIREBASE_API_KEY - Firebase APIキー
 *   VITE_FIREBASE_AUTH_DOMAIN - Firebase認証ドメイン
 *   VITE_FIREBASE_PROJECT_ID - Firebaseプロジェクト ID
 * 
 * 認証に失敗した場合はエラーメッセージを表示して終了します。
 */
require('dotenv').config();
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

/**
 * 認証トークンを取得する関数
 * @param {string} email メールアドレス
 * @param {string} password パスワード
 * @returns {Promise<string>} 認証トークン
 */
async function getToken(email, password) {
  // 引数がない場合はコマンドライン引数を使用
  if (!email) email = process.argv[2];
  if (!password) password = process.argv[3];

  if (!email || !password) {
    console.error('使用法: node get-token.js メールアドレス パスワード');
    process.exit(1);
  }

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
    
    // 関数として呼び出された場合はトークンを返す
    if (module.parent) {
      return token;
    }
    
    // スクリプトとして実行された場合は情報を表示
    console.log(`\n認証トークン: ${token}\n`);
    
    // トークンの詳細情報を表示
    console.log('UID:', user.uid);
    console.log('メール:', user.email);
    console.log('表示名:', user.displayName);
    
    // 有効期限を計算（Firebase IDトークンは通常1時間有効）
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    console.log(`有効期限: ${expiry.toISOString()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('エラーが発生しました:', error);
    if (error.code === 'auth/invalid-credential') {
      console.error('認証に失敗しました。メールアドレスとパスワードを確認してください。');
    }
    process.exit(1);
  }
}

// コマンドライン実行時のみ実行
if (require.main === module) {
  getToken();
}

// モジュールとしてgetToken関数をエクスポート
module.exports = { getToken };