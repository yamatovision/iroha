/**
 * 管理者APIを使用してユーザー管理のCRUD操作をテストするスクリプト
 * 
 * 実行方法:
 * node scripts/test-crud/test-admin-user-crud.js
 */

const axios = require('axios');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

// テスト環境設定
const API_BASE_URL = 'http://localhost:8080/api/v1';
const ADMIN_EMAIL = 'shiraishi.tatsuya@mikoto.co.jp';
const ADMIN_PASSWORD = 'aikakumei';

// テスト用データ
const TEST_USER_EMAIL = `test-user-${Date.now()}@example.com`;
const TEST_USER_PASSWORD = 'testpassword123';
const TEST_USER_NAME = 'テストユーザー';

// 認証トークンとユーザーIDの保存用
let authToken;
let testUserId;
let adminUserId = 'Bs2MacLtK1Z1fVnau2dYPpsWRpa2'; // テスト環境の既存管理者のID (変更する場合はここを更新)

/**
 * Firebase認証でログインしてトークンを取得
 */
async function login() {
  try {
    console.log('=== Firebase認証でログイン ===');
    // Firebase Auth REST APIを使用してログイン
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    authToken = response.data.token;
    console.log('認証成功: トークン取得');
    return authToken;
  } catch (error) {
    console.error('認証エラー:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 全ユーザー一覧を取得
 */
async function getAllUsers() {
  try {
    console.log('\n=== ユーザー一覧を取得 ===');
    const response = await axios.get(`${API_BASE_URL}/admin/admins`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`ユーザー総数: ${response.data.users.length}`);
    return response.data.users;
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 新規テストユーザーを作成
 */
async function createTestUser() {
  try {
    console.log('\n=== テストユーザーを作成 ===');
    const response = await axios.post(`${API_BASE_URL}/admin/admins`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      displayName: TEST_USER_NAME,
      role: 'User'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testUserId = response.data.id;
    console.log(`テストユーザー作成成功: ID=${testUserId}, メール=${TEST_USER_EMAIL}`);
    return response.data;
  } catch (error) {
    console.error('テストユーザー作成エラー:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * ユーザー権限を更新
 */
async function updateUserRole(userId, role) {
  try {
    console.log(`\n=== ユーザー権限を更新: ${role} ===`);
    const response = await axios.put(`${API_BASE_URL}/admin/admins/${userId}/role`, { 
      role 
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`権限更新成功: ID=${userId}, 新しい権限=${role}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('権限更新エラー:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * ユーザープランを更新
 */
async function updateUserPlan(userId, plan) {
  try {
    console.log(`\n=== ユーザープランを更新: ${plan} ===`);
    const response = await axios.put(`${API_BASE_URL}/admin/admins/${userId}/plan`, { 
      plan 
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`プラン更新成功: ID=${userId}, 新しいプラン=${plan}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('プラン更新エラー:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * ユーザーを削除
 */
async function deleteUser(userId) {
  try {
    console.log(`\n=== ユーザーを削除: ID=${userId} ===`);
    const response = await axios.delete(`${API_BASE_URL}/admin/admins/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('ユーザー削除成功:');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('ユーザー削除エラー:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * テストの実行
 */
async function runTest() {
  try {
    // ログイン・認証
    await login();
    
    // 既存ユーザー一覧取得
    const users = await getAllUsers();
    
    // 新規ユーザー作成
    const newUser = await createTestUser();
    
    // 手動で使用したいIDがあれば
    // testUserId = '指定したいID';
    
    // ユーザー権限更新テスト
    const updatedUserRole = await updateUserRole(testUserId, 'Admin');
    
    // ユーザープラン更新テスト
    const updatedUserPlan = await updateUserPlan(testUserId, 'elite');
    
    // 再度ユーザー一覧を取得して変更を確認
    const updatedUsers = await getAllUsers();
    const updatedUserInfo = updatedUsers.find(user => user.id === testUserId || user._id === testUserId);
    console.log('\n=== 更新後のユーザー情報 ===');
    console.log(updatedUserInfo);
    
    // テストユーザー削除
    if (testUserId) {
      await deleteUser(testUserId);
    }
    
    console.log('\n✅ テスト完了: すべてのCRUD操作が成功しました');
  } catch (error) {
    console.error('\n❌ テストが失敗しました:', error.message);
  }
}

// テスト実行
runTest();