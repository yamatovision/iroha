const axios = require('axios');
require('dotenv').config();

// ログイン情報
const email = 'shiraishi.tatsuya@mikoto.co.jp';  // テスト用メールアドレス
const password = 'aikakumei';  // 本番環境ではセキュリティのため環境変数から取得することを推奨

// APIエンドポイント
const API_URL = 'http://localhost:3000'; // ローカル開発環境のURL

async function getJwtToken() {
  try {
    console.log(`ログイン試行: ${email}`);
    
    const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
      email,
      password
    });
    
    if (response.data && response.data.tokens && response.data.tokens.accessToken) {
      console.log('JWTトークンの取得に成功しました:');
      console.log(response.data.tokens.accessToken);
      console.log('\nこのトークンをtest-enhanced-compatibility-fix.jsのJWT_TOKEN変数に設定してください');
      return response.data.tokens.accessToken;
    } else {
      console.error('トークンが見つかりません。レスポンスデータ:');
      console.error(response.data);
    }
  } catch (error) {
    console.error('エラー:', error.message);
    
    if (error.response) {
      console.error('レスポンス:', error.response.data);
      console.error('ステータス:', error.response.status);
    }
  }
}

// トークン取得を実行
getJwtToken();