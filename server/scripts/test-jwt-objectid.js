const axios = require('axios');

const baseUrl = 'http://localhost:8080/api/v1';
let accessToken = null;

// ユーザーログインのテスト
async function testLogin() {
  try {
    console.log('=== JWT認証テスト（ObjectID移行後） ===');
    console.log('1. ログインテスト');
    
    const response = await axios.post(`${baseUrl}/jwt-auth/login`, {
      email: 'shiraishi.tatsuya@mikoto.co.jp',
      password: 'aikakumei'
    });
    
    console.log('✓ ログイン成功');
    console.log(`✓ ユーザーID: ${response.data.user._id}`);
    console.log(`✓ ユーザーメール: ${response.data.user.email}`);
    console.log(`✓ ユーザー権限: ${response.data.user.role}`);
    
    if (response.data.tokens && response.data.tokens.accessToken) {
      accessToken = response.data.tokens.accessToken;
      console.log(`✓ アクセストークン取得: ${accessToken.substring(0, 20)}...`);
    } else {
      console.error('× アクセストークンが返されませんでした');
    }
    
    return response.data;
  } catch (error) {
    console.error('× ログイン失敗:', error.response?.data || error.message);
    throw error;
  }
}

// ユーザープロフィール取得のテスト
async function testGetProfile() {
  if (!accessToken) {
    console.error('× アクセストークンがありません。ログインしてください。');
    return;
  }
  
  try {
    console.log('\n2. ユーザープロフィール取得テスト');
    
    const response = await axios.get(`${baseUrl}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✓ プロフィール取得成功');
    console.log(`✓ ユーザーID: ${response.data._id}`);
    console.log(`✓ ユーザーメール: ${response.data.email}`);
    console.log(`✓ ユーザー名: ${response.data.displayName}`);
    
    return response.data;
  } catch (error) {
    console.error('× プロフィール取得失敗:', error.response?.data || error.message);
    throw error;
  }
}

// チーム情報取得のテスト
async function testGetTeamInfo() {
  if (!accessToken) {
    console.error('× アクセストークンがありません。ログインしてください。');
    return;
  }
  
  try {
    console.log('\n3. チーム情報取得テスト');
    
    const response = await axios.get(`${baseUrl}/teams/my-team`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✓ チーム情報取得成功');
    console.log(`✓ チームID: ${response.data._id}`);
    console.log(`✓ チーム名: ${response.data.name}`);
    console.log(`✓ チームメンバー数: ${response.data.members.length}`);
    
    // メンバーIDを確認
    if (response.data.members && response.data.members.length > 0) {
      console.log('✓ チームメンバーID (ObjectID形式):');
      response.data.members.forEach((memberId, index) => {
        console.log(`   メンバー ${index+1}: ${memberId}`);
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('× チーム情報取得失敗:', error.response?.data || error.message);
    throw error;
  }
}

// チャット履歴取得のテスト
async function testGetChatHistory() {
  if (!accessToken) {
    console.error('× アクセストークンがありません。ログインしてください。');
    return;
  }
  
  try {
    console.log('\n4. チャット履歴取得テスト');
    
    const response = await axios.get(`${baseUrl}/chat/history/personal`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✓ チャット履歴取得成功');
    console.log(`✓ チャット履歴数: ${response.data.length}`);
    
    if (response.data.length > 0) {
      console.log(`✓ チャット履歴ID: ${response.data[0]._id}`);
      console.log(`✓ ユーザーID (ObjectID形式): ${response.data[0].userId}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('× チャット履歴取得失敗:', error.response?.data || error.message);
    throw error;
  }
}

// すべてのテストを実行
async function runAllTests() {
  try {
    await testLogin();
    await testGetProfile();
    await testGetTeamInfo();
    await testGetChatHistory();
    
    console.log('\n=== すべてのテストが成功しました ===');
  } catch (error) {
    console.error('\n=== テスト中にエラーが発生しました ===');
  }
}

// テスト実行
runAllTests();