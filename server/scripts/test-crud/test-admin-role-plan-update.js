/**
 * ユーザー権限とプラン更新のみのテストスクリプト
 * 既存のユーザーを使って更新操作のみをテスト
 * 
 * 実行方法:
 * node scripts/test-crud/test-admin-role-plan-update.js
 */

const axios = require('axios');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

// テスト環境設定
const API_BASE_URL = 'http://localhost:8080/api/v1';
const ADMIN_EMAIL = 'shiraishi.tatsuya@mikoto.co.jp';
const ADMIN_PASSWORD = 'aikakumei';

// テスト対象ユーザーID
const TEST_USER_ID = 'jFaU2Jq7pzeskDpyuELmCADjjw43'; // あみさんのユーザーID

// 認証トークンの保存用
let authToken;

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
 * 特定ユーザーの情報を取得
 */
async function getUserInfo(userId) {
  try {
    console.log(`\n=== ユーザー情報を取得: ID=${userId} ===`);
    
    // ユーザー一覧から特定ユーザーを探す
    const response = await axios.get(`${API_BASE_URL}/admin/admins`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const userInfo = response.data.users.find(user => user.id === userId || user._id === userId);
    if (userInfo) {
      console.log('ユーザー情報:');
      console.log({
        id: userInfo.id || userInfo._id,
        email: userInfo.email,
        displayName: userInfo.displayName,
        role: userInfo.role,
        plan: userInfo.plan
      });
      return userInfo;
    } else {
      console.log(`ユーザーID ${userId} が見つかりません`);
      return null;
    }
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error.response?.data || error.message);
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
 * 更新テストシナリオを実行
 */
async function runTest() {
  try {
    // 元の状態を記録
    console.log('=== 更新テスト開始 ===');
    
    // ログイン・認証
    await login();
    
    // 更新前のユーザー情報を確認
    const beforeUser = await getUserInfo(TEST_USER_ID);
    if (!beforeUser) {
      throw new Error(`テスト対象ユーザー (ID=${TEST_USER_ID}) が見つかりません`);
    }
    
    // 元の値を保存
    const originalRole = beforeUser.role;
    const originalPlan = beforeUser.plan;
    
    // 一連の更新テスト
    console.log('\n=== 一連の更新テスト ===');
    
    // 1. Adminに変更
    if (originalRole !== 'Admin') {
      await updateUserRole(TEST_USER_ID, 'Admin');
    } else {
      console.log('ユーザーはすでにAdmin権限を持っています、Userに変更します');
      await updateUserRole(TEST_USER_ID, 'User');
      // 一度確認して再度Adminに戻す
      await getUserInfo(TEST_USER_ID);
      await updateUserRole(TEST_USER_ID, 'Admin');
    }
    
    // 2. eliteプランに変更
    if (originalPlan !== 'elite') {
      await updateUserPlan(TEST_USER_ID, 'elite');
    } else {
      console.log('ユーザーはすでにeliteプランです、liteに変更します');
      await updateUserPlan(TEST_USER_ID, 'lite');
      // 一度確認して再度eliteに戻す
      await getUserInfo(TEST_USER_ID);
      await updateUserPlan(TEST_USER_ID, 'elite');
    }
    
    // 3. 更新後の状態を確認
    const afterUser = await getUserInfo(TEST_USER_ID);
    
    // 4. 元の状態に戻す
    console.log('\n=== 元の状態に戻す ===');
    await updateUserRole(TEST_USER_ID, originalRole);
    await updateUserPlan(TEST_USER_ID, originalPlan);
    
    // 5. 最終状態の確認
    const finalUser = await getUserInfo(TEST_USER_ID);
    
    console.log('\n=== テスト結果 ===');
    console.log('更新前:', { role: beforeUser.role, plan: beforeUser.plan });
    console.log('更新後:', { role: afterUser.role, plan: afterUser.plan });
    console.log('復元後:', { role: finalUser.role, plan: finalUser.plan });
    console.log('\n✅ 権限・プラン更新テスト完了');
    
  } catch (error) {
    console.error('\n❌ テストが失敗しました:', error.message);
  }
}

// テスト実行
runTest();