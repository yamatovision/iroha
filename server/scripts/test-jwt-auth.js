/**
 * JWT認証機能のテストスクリプト
 */
const axios = require('axios');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

const API_BASE_URL = 'http://localhost:8080/api/v1'; // APIのベースURL
const JWT_AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/jwt-auth/login`,
  REGISTER: `${API_BASE_URL}/jwt-auth/register`,
  REFRESH_TOKEN: `${API_BASE_URL}/jwt-auth/refresh-token`,
  LOGOUT: `${API_BASE_URL}/jwt-auth/logout`,
  MIGRATE_TO_JWT: `${API_BASE_URL}/jwt-auth/migrate-to-jwt`,
};

// Firebase認証トークン（get-token.jsで取得したもの）
const firebaseToken = process.argv[2];

// テストの状態を追跡する変数
let jwtTokens = {
  accessToken: null,
  refreshToken: null
};

// Firebase認証からJWT認証への移行をテスト
async function testMigrateToJwt() {
  console.log('=== Firebase認証からJWT認証への移行テスト ===');
  
  try {
    console.log('Firebase認証からJWT認証へ移行中...');
    
    const response = await axios.post(JWT_AUTH_ENDPOINTS.MIGRATE_TO_JWT, {
      password: 'newPassword123' // 新しいパスワード
    }, {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`
      }
    });
    
    console.log('移行成功！');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
    
    // JWT認証トークンを保存
    jwtTokens = {
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken
    };
    
    console.log('JWT認証情報:');
    console.log('- アクセストークン:', jwtTokens.accessToken.substring(0, 20) + '...');
    console.log('- リフレッシュトークン:', jwtTokens.refreshToken.substring(0, 20) + '...');
    
    return true;
  } catch (error) {
    console.error('移行エラー:', error.response ? error.response.data : error.message);
    return false;
  }
}

// JWTでログインをテスト
async function testJwtLogin() {
  console.log('\n=== JWT認証でのログインテスト ===');
  
  try {
    const response = await axios.post(JWT_AUTH_ENDPOINTS.LOGIN, {
      email: 'shiraishi.tatsuya@mikoto.co.jp',
      password: 'newPassword123'
    });
    
    console.log('ログイン成功！');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
    
    // JWT認証トークンを更新
    jwtTokens = {
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken
    };
    
    return true;
  } catch (error) {
    console.error('ログインエラー:', error.response ? error.response.data : error.message);
    return false;
  }
}

// リフレッシュトークンのテスト
async function testRefreshToken() {
  console.log('\n=== リフレッシュトークンテスト ===');
  
  try {
    const response = await axios.post(JWT_AUTH_ENDPOINTS.REFRESH_TOKEN, {
      refreshToken: jwtTokens.refreshToken
    });
    
    console.log('トークンリフレッシュ成功！');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
    
    // JWT認証トークンを更新
    jwtTokens = {
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken
    };
    
    return true;
  } catch (error) {
    console.error('リフレッシュエラー:', error.response ? error.response.data : error.message);
    return false;
  }
}

// ログアウトのテスト
async function testLogout() {
  console.log('\n=== ログアウトテスト ===');
  
  try {
    const response = await axios.post(JWT_AUTH_ENDPOINTS.LOGOUT, {
      refreshToken: jwtTokens.refreshToken
    }, {
      headers: {
        'Authorization': `Bearer ${jwtTokens.accessToken}`
      }
    });
    
    console.log('ログアウト成功！');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('ログアウトエラー:', error.response ? error.response.data : error.message);
    return false;
  }
}

// 保護されたエンドポイントへのアクセスをテスト
async function testProtectedEndpoint() {
  console.log('\n=== 保護されたエンドポイントへのアクセステスト ===');
  
  try {
    // 例として、ユーザープロフィールエンドポイントを使用
    const response = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${jwtTokens.accessToken}`
      }
    });
    
    console.log('保護されたエンドポイントへのアクセス成功！');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('アクセスエラー:', error.response ? error.response.data : error.message);
    return false;
  }
}

// ハイブリッド認証ミドルウェアのテスト（Firebaseトークンを使用）
async function testHybridAuthWithFirebase() {
  console.log('\n=== ハイブリッド認証ミドルウェアテスト（Firebaseトークン使用） ===');
  
  try {
    // 例として、ユーザープロフィールエンドポイントを使用
    const response = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`
      }
    });
    
    console.log('Firebase認証で保護されたエンドポイントへのアクセス成功！');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('Firebase認証アクセスエラー:', error.response ? error.response.data : error.message);
    return false;
  }
}

// すべてのテストを実行
async function runAllTests() {
  if (!firebaseToken) {
    console.error('Firebaseトークンが指定されていません。');
    console.error('使用法: node test-jwt-auth.js <Firebase認証トークン>');
    console.error('トークンは`node scripts/get-token.js shiraishi.tatsuya@mikoto.co.jp aikakumei`で取得できます。');
    process.exit(1);
  }
  
  console.log('JWT認証機能テスト開始...');
  
  // Firebase認証でのアクセスをテスト（ハイブリッド認証確認）
  await testHybridAuthWithFirebase();
  
  // JWT認証への移行テスト
  const migrateSuccess = await testMigrateToJwt();
  if (!migrateSuccess) {
    console.log('移行テスト失敗により後続テストをスキップします。');
    return;
  }
  
  // JWT認証でのアクセスをテスト
  await testProtectedEndpoint();
  
  // リフレッシュトークンテスト
  await testRefreshToken();
  
  // 再度保護されたエンドポイントへのアクセスをテスト（リフレッシュ後）
  await testProtectedEndpoint();
  
  // ログアウトテスト
  await testLogout();
  
  // ログアウト後に再ログインをテスト
  await testJwtLogin();
  
  console.log('\nすべてのテスト完了！');
}

// テストを実行
runAllTests().catch(error => {
  console.error('テスト実行中にエラーが発生しました:', error);
});