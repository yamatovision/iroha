const axios = require('axios');

// サーバーのベースURL（サーバーログからポート8080を確認）
const baseURL = 'http://localhost:8080/api/v1';

// ログイン情報
const loginData = {
  email: 'shiraishi.tatsuya@mikoto.co.jp',
  password: 'aikakumei'
};

// デバッグフラグ
const DEBUG = true;

// JWTログインを試行
async function testJwtLogin() {
  try {
    console.log('=== JWTログインテスト ===');
    console.log(`ログイン試行: ${loginData.email}`);

    // リクエストを実行
    const response = await axios.post(`${baseURL}/jwt-auth/login`, loginData);
    
    console.log('✅ ログイン成功');
    console.log('ステータスコード:', response.status);
    
    if (DEBUG) {
      console.log('レスポンスデータ:', JSON.stringify(response.data, null, 2));
    } else {
      // 簡易表示
      console.log('ユーザー情報:', response.data.user);
      console.log('トークン:', response.data.tokens?.accessToken?.substring(0, 20) + '...');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ ログイン失敗');
    
    if (error.response) {
      // サーバーからのレスポンスがある場合
      console.error('ステータスコード:', error.response.status);
      console.error('エラーデータ:', error.response.data);
      
      // 詳細なデバッグ（必要に応じて）
      if (DEBUG) {
        console.error('ヘッダー:', error.response.headers);
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない場合
      console.error('リクエストは送信されましたが、レスポンスがありません');
      console.error('リクエスト:', error.request);
    } else {
      // リクエスト作成中にエラーが発生した場合
      console.error('リクエスト作成中にエラーが発生しました:', error.message);
    }
    
    if (DEBUG && error.config) {
      console.error('リクエスト設定:', {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
        data: error.config.data
      });
    }
    
    throw error;
  }
}

// メイン実行関数
async function main() {
  try {
    await testJwtLogin();
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました');
  }
}

// スクリプト実行
main();