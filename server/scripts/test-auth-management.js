/**
 * 認証管理機能テストスクリプト
 * 
 * 実行方法:
 * node scripts/test-auth-management.js <Firebase認証トークン>
 */
const axios = require('axios');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

const API_BASE_URL = 'http://127.0.0.1:8080/api/v1'; // APIのベースURL (localhostではなく127.0.0.1を使用)
const ADMIN_AUTH_ENDPOINTS = {
  GET_AUTH_STATS: `${API_BASE_URL}/admin/settings/auth/stats`,
  GET_USER_AUTH_STATE: (userId) => `${API_BASE_URL}/admin/settings/auth/users/${userId}`,
  INVALIDATE_USER_TOKENS: (userId) => `${API_BASE_URL}/admin/settings/auth/users/${userId}/invalidate`,
  GET_MIGRATION_STATS: `${API_BASE_URL}/admin/settings/auth/migration`,
  RUN_TOKEN_CLEANUP: `${API_BASE_URL}/admin/settings/auth/cleanup`,
};

// Firebase認証トークン（get-token.jsで取得したもの）
const firebaseToken = process.argv[2];

/**
 * 認証統計情報を取得
 */
async function testGetAuthStats() {
  console.log('=== 認証統計情報取得テスト ===');
  
  try {
    const response = await axios.get(ADMIN_AUTH_ENDPOINTS.GET_AUTH_STATS, {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`
      }
    });
    
    console.log('認証統計情報取得成功！');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('取得エラー:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * ユーザー認証状態を取得
 */
async function testGetUserAuthState(userId) {
  console.log(`\n=== ユーザー(${userId})認証状態取得テスト ===`);
  
  try {
    const response = await axios.get(ADMIN_AUTH_ENDPOINTS.GET_USER_AUTH_STATE(userId), {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`
      }
    });
    
    console.log('ユーザー認証状態取得成功！');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('取得エラー:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * ユーザートークン無効化テスト
 */
async function testInvalidateUserTokens(userId) {
  console.log(`\n=== ユーザー(${userId})トークン無効化テスト ===`);
  
  try {
    const response = await axios.post(ADMIN_AUTH_ENDPOINTS.INVALIDATE_USER_TOKENS(userId), {}, {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`
      }
    });
    
    console.log('トークン無効化成功！');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('無効化エラー:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * 移行統計取得テスト
 */
async function testGetMigrationStats() {
  console.log('\n=== 移行統計取得テスト ===');
  
  try {
    const response = await axios.get(ADMIN_AUTH_ENDPOINTS.GET_MIGRATION_STATS, {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`
      }
    });
    
    console.log('移行統計取得成功！');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('取得エラー:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * トークンクリーンアップテスト
 */
async function testRunTokenCleanup() {
  console.log('\n=== トークンクリーンアップテスト ===');
  
  try {
    const response = await axios.post(ADMIN_AUTH_ENDPOINTS.RUN_TOKEN_CLEANUP, {}, {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`
      }
    });
    
    console.log('トークンクリーンアップ成功！');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('クリーンアップエラー:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * 全テストを実行
 */
async function runAllTests() {
  if (!firebaseToken) {
    console.error('Firebaseトークンが指定されていません。');
    console.error('使用法: node test-auth-management.js <Firebase認証トークン>');
    console.error('トークンは`node scripts/get-token.js shiraishi.tatsuya@mikoto.co.jp aikakumei`で取得できます。');
    process.exit(1);
  }
  
  console.log('認証管理機能テスト開始...');
  
  // 1. 認証統計情報取得
  const authStats = await testGetAuthStats();
  
  let testUserId;
  
  // サンプルユーザーの取得
  if (authStats && authStats.totalUsers > 0) {
    // 管理ユーザー自身のIDを使用（Firebase認証済みのはず）
    testUserId = 'Bs2MacLtK1Z1fVnau2dYPpsWRpa2'; // スーパー管理者のID
    
    // 2. ユーザー認証状態取得
    await testGetUserAuthState(testUserId);
    
    // 3. ユーザートークン無効化
    await testInvalidateUserTokens(testUserId);
    
    // 4. 無効化後の状態を確認
    await testGetUserAuthState(testUserId);
  } else {
    console.log('テスト用ユーザーが見つからないため、ユーザー固有のテストをスキップします。');
  }
  
  // 5. 移行統計取得
  await testGetMigrationStats();
  
  // 6. トークンクリーンアップ
  await testRunTokenCleanup();
  
  console.log('\nすべてのテスト完了！');
}

// テストを実行
runAllTests().catch(error => {
  console.error('テスト実行中にエラーが発生しました:', error);
});