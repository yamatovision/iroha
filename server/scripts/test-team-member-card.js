/**
 * チームメンバーカードAPIの動作確認用スクリプト
 * 実際のAPIを直接呼び出してテストします
 */
const axios = require('axios');
const { execSync } = require('child_process');

// Firebase認証トークン取得コマンドを実行する関数
const getAuthToken = async () => {
  try {
    const tokenOutput = execSync('node scripts/get-token.js shiraishi.tatsuya@mikoto.co.jp aikakumei').toString();
    
    // 認証トークン行を探す
    const tokenLine = tokenOutput.split('\n').find(line => line.includes('認証トークン:'));
    if (!tokenLine) {
      throw new Error('認証トークンが見つかりません');
    }
    
    // トークンを抽出
    const token = tokenLine.split(':')[1].trim();
    return token;
  } catch (error) {
    console.error('認証トークン取得エラー:', error);
    throw error;
  }
};

// APIリクエストを行う関数
const callAPI = async (endpoint, token, method = 'GET', body = null) => {
  try {
    const baseUrl = 'http://localhost:8080';
    const url = `${baseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.data = JSON.stringify(body);
    }
    
    console.log(`${method} ${url}`);
    const response = await axios(url, options);
    
    return { 
      status: response.status,
      data: response.data
    };
  } catch (error) {
    if (error.response) {
      // エラーレスポンスがある場合は内容を返す
      return {
        status: error.response.status,
        data: error.response.data
      };
    }
    console.error('APIリクエスト中にエラーが発生しました:', error);
    throw error;
  }
};

// 手動でコンソールに入力するためのユーティリティ
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (question) => new Promise((resolve) => {
  readline.question(question, resolve);
});

// メインテスト実行関数
const runTests = async () => {
  console.log('=== チームメンバーカードAPIテスト開始 ===');
  
  try {
    // 認証トークンの取得
    const token = await getAuthToken();
    console.log('認証トークン取得完了');
    
    // チームとユーザーの情報を指定
    const teamId = '67f4fe4bfe04b371f21576f7'; // 'チームバイアウト'
    const userId = 'Bs2MacLtK1Z1fVnau2dYPpsWRpa2'; // 管理者UID
    
    // テスト1: カード取得のテスト
    console.log('\nテスト1: カード取得');
    const response1 = await callAPI(`/api/v1/teams/${teamId}/members/${userId}/card`, token);
    
    console.log(`ステータスコード: ${response1.status}`);
    if (response1.status === 200) {
      console.log('✅ 成功: カードが取得されました');
      console.log(`ユーザーID: ${response1.data.userInfo.userId}`);
      console.log(`表示名: ${response1.data.userInfo.displayName}`);
      console.log(`カード内容の一部: ${response1.data.cardContent.substring(0, 100)}...`);
      if (response1.data.teamGoal) {
        console.log(`チーム目標: ${response1.data.teamGoal.content}`);
      } else {
        console.log('チーム目標は設定されていません');
      }
    } else {
      console.log('❌ 失敗: カード取得に失敗しました');
      console.log(JSON.stringify(response1.data, null, 2));
    }
    
    // テスト2: 存在しないチームIDの場合
    console.log('\nテスト2: 存在しないチームID');
    const fakeTeamId = '65b0b1e9c9a6a6b1b1b1b1b1'; // 適当なObjectId形式の文字列
    const response2 = await callAPI(`/api/v1/teams/${fakeTeamId}/members/${userId}/card`, token);
    
    console.log(`ステータスコード: ${response2.status}`);
    if (response2.status === 404) {
      console.log('✅ 成功: 404エラーが返されました');
    } else {
      console.log('❌ 失敗: 404エラーが返されませんでした');
      console.log(JSON.stringify(response2.data, null, 2));
    }
    
    // テスト3: 存在しないユーザーIDの場合
    console.log('\nテスト3: 存在しないユーザーID');
    const fakeUserId = '65b0b1e9c9a6a6b1b1b1b1b2'; // 適当なObjectId形式の文字列
    const response3 = await callAPI(`/api/v1/teams/${teamId}/members/${fakeUserId}/card`, token);
    
    console.log(`ステータスコード: ${response3.status}`);
    if (response3.status === 404) {
      console.log('✅ 成功: 404エラーが返されました');
    } else {
      console.log('❌ 失敗: 404エラーが返されませんでした');
      console.log(JSON.stringify(response3.data, null, 2));
    }
    
    console.log('\n=== テスト完了 ===');
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  } finally {
    readline.close();
  }
};

// テスト実行
runTests();