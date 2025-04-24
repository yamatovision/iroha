/**
 * テスト用のJWTトークンを取得するスクリプト
 * 
 * 使用方法:
 *   node get-jwt-for-test.js
 * 
 * 環境変数:
 *   - TEST_USER_EMAIL: テスト用ユーザーのメールアドレス (デフォルト: shiraishi.tatsuya@mikoto.co.jp)
 *   - TEST_USER_PASSWORD: テスト用ユーザーのパスワード (デフォルト: test12345)
 *   - JWT_LOGIN_ENDPOINT: ログインエンドポイント (デフォルト: http://localhost:8080/api/v1/auth/jwt-login)
 */

// 必要なモジュールをインポート
const axios = require('axios');
const dotenv = require('dotenv');

// .envファイルを読み込む
dotenv.config();

// 設定
const CONFIG = {
  email: process.env.TEST_USER_EMAIL || 'shiraishi.tatsuya@mikoto.co.jp',
  password: process.env.TEST_USER_PASSWORD || 'test12345',
  endpoint: process.env.JWT_LOGIN_ENDPOINT || 'http://localhost:8080/api/v1/auth/login'
};

/**
 * JWTトークンを取得する
 */
async function getJwtToken() {
  try {
    console.log(`JWTトークンを取得します (${CONFIG.email})...`);
    
    // ログインリクエストを送信
    const response = await axios.post(CONFIG.endpoint, {
      email: CONFIG.email,
      password: CONFIG.password
    });
    
    // レスポンスからトークンを取得
    const token = response.data.token;
    
    if (!token) {
      console.error('トークンの取得に失敗しました。レスポンス:', response.data);
      process.exit(1);
    }
    
    // 成功メッセージとトークンを表示
    console.log('\n===== JWTトークン 取得成功 =====');
    console.log(`\nToken: ${token}\n`);
    console.log('テスト環境で以下のヘッダーを使用してください:');
    console.log(`Authorization: Bearer ${token}`);
    console.log('\n=============================');
    
    // トークンの基本情報を表示（期限など）
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('\nトークン情報:');
        console.log('- ユーザーID:', payload.id);
        console.log('- メール:', payload.email);
        console.log('- 権限:', payload.role);
        console.log('- 発行日時:', new Date(payload.iat * 1000).toISOString());
        console.log('- 有効期限:', new Date(payload.exp * 1000).toISOString());
        
        // 有効期限の確認
        const now = Math.floor(Date.now() / 1000);
        const remainingTime = payload.exp - now;
        const remainingDays = Math.floor(remainingTime / (60 * 60 * 24));
        
        if (remainingTime <= 0) {
          console.log('⚠️ トークンは既に有効期限切れです');
        } else {
          console.log(`✅ トークンは有効です (残り約${remainingDays}日)`);
        }
      } catch (error) {
        console.error('トークン情報の解析に失敗しました:', error.message);
      }
    }
  } catch (error) {
    console.error('エラー:', error.message);
    if (error.response) {
      console.error('レスポンス:', error.response.data);
      console.error('ステータス:', error.response.status);
    }
    process.exit(1);
  }
}

// メイン処理
getJwtToken();