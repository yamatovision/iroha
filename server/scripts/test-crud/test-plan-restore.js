/**
 * ユーザープランを元の状態に戻すテスト
 */

const axios = require('axios');

// 設定
const API_BASE_URL = 'http://localhost:8080/api/v1';
const AUTH_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjcxMTE1MjM1YTZjNjE0NTRlZmRlZGM0NWE3N2U0MzUxMzY3ZWViZTAiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiVGF0c3V5YSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9zeXMtNzY2MTQxMTI3NjI0Mzg0ODY0MjAwNDQ1ODQiLCJhdWQiOiJzeXMtNzY2MTQxMTI3NjI0Mzg0ODY0MjAwNDQ1ODQiLCJhdXRoX3RpbWUiOjE3NDQyNDA4NTQsInVzZXJfaWQiOiJCczJNYWNMdEsxWjFmVm5hdTJkWVBwc1dScGEyIiwic3ViIjoiQnMyTWFjTHRLMVoxZlZuYXUyZFlQcHNXUnBhMiIsImlhdCI6MTc0NDI0MDg1NCwiZXhwIjoxNzQ0MjQ0NDU0LCJlbWFpbCI6InNoaXJhaXNoaS50YXRzdXlhQG1pa290by5jby5qcCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJzaGlyYWlzaGkudGF0c3V5YUBtaWtvdG8uY28uanAiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.OtqMq9xI0gLLo_JeJwDX5nVDZIgmE9PeWIiACAgrpKT7ZnteCvjxmrWwRx-s7BhPx0ZwOJLbM5hV__p-KFd94JttLJLqi-KmYxDzWck4E9HrDxwGtq_sRZBsMAKfLrGZ2JmRpHqxFQJcThmNLCUFE8oOyRWZFscMh-ywWJpuH-dmNaDq_qN2WNx7dINKT-uJ-LQglopl3RVJADGOd4V--PXJ1IdTPNIsKJFNArlQU621xG9XH_rMDF2gWmxI_Uz8LuKFvhAr6JflbAcqq6yLv8Hkkt8YsE5RQyXskdmqYXS1SAlBxrrmg_oLcHnwzCeTPZWZc3sixdV-LGHgYp5IvQ';

// ユーザーIDとテスト内容
const TEST_USER_ID = 'jFaU2Jq7pzeskDpyuELmCADjjw43';  // あみさんのID
const ORIGINAL_PLAN = 'lite';  // 元のプラン

// ユーザー情報を取得
async function getUsers() {
  try {
    console.log('ユーザー一覧を取得中...');
    const response = await axios.get(`${API_BASE_URL}/admin/admins`, {
      headers: { 
        Authorization: `Bearer ${AUTH_TOKEN}` 
      }
    });
    
    // テスト対象ユーザーを検索
    const testUser = response.data.users.find(user => 
      user.id === TEST_USER_ID || user._id === TEST_USER_ID
    );
    
    if (testUser) {
      console.log('現在のユーザー情報:');
      console.log({
        id: testUser.id || testUser._id,
        email: testUser.email,
        displayName: testUser.displayName,
        role: testUser.role,
        plan: testUser.plan
      });
    } else {
      console.log(`ユーザーID ${TEST_USER_ID} が見つかりません`);
    }
    
    return response.data.users;
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error.response?.data || error.message);
    throw error;
  }
}

// ユーザープランを更新
async function restoreUserPlan() {
  try {
    console.log(`\nユーザープランを元の状態 ${ORIGINAL_PLAN} に戻します...`);
    const response = await axios.put(
      `${API_BASE_URL}/admin/admins/${TEST_USER_ID}/plan`, 
      { plan: ORIGINAL_PLAN },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    
    console.log('更新結果:', response.data);
    return response.data;
  } catch (error) {
    console.error('プラン更新エラー:', error.response?.data || error.message);
    throw error;
  }
}

// テスト実行
async function runTest() {
  try {
    // 現在のユーザー情報を取得
    await getUsers();
    
    // プランを元に戻す
    await restoreUserPlan();
    
    // 戻した後のユーザー情報を確認
    await getUsers();
    
    console.log('\n✅ ユーザープランを元の状態に戻しました');
  } catch (error) {
    console.error('\n❌ テスト失敗:', error.message);
  }
}

// テスト実行
runTest();