/**
 * チャットコンテキストAPIの簡易テストスクリプト
 * 
 * 使い方:
 *   node test-chat-contexts-simple.js [available|detail|message|history] [トークン]
 * 
 * オプション:
 *   available - 利用可能なコンテキスト情報を取得
 *   detail - コンテキスト詳細情報を取得
 *   message - コンテキストベースのメッセージを送信
 *   history - チャット履歴を取得
 */

require('dotenv').config();
const axios = require('axios');
const { generateToken } = require('./get-token');

// API設定
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:8080';
const API_PATH = '/api/v1';
const CHAT_API = `${API_PATH}/chat`;

// テストユーザー情報
const TEST_USER_ID = '67f87e86a7d83fb995de0ee6';
const TEST_USER_ROLE = 'super_admin';

// コマンドライン引数の解析
const args = process.argv.slice(2);
const selectedTest = args[0] || 'all';
const providedToken = args[1];

// ContextType定数（文字列として直接使用）
const CONTEXT_TYPE = {
  SELF: 'self',
  FRIEND: 'friend',
  FORTUNE: 'fortune',
  TEAM: 'team',
  TEAM_GOAL: 'team_goal'
};

/**
 * トークンを取得する関数
 */
async function getToken() {
  if (providedToken) {
    return providedToken;
  }
  
  try {
    console.log(`トークンを生成しています (${TEST_USER_ID})...`);
    const token = await generateToken(TEST_USER_ID, TEST_USER_ROLE);
    console.log('トークン生成成功');
    return token;
  } catch (error) {
    console.error('トークン生成エラー:', error);
    throw error;
  }
}

/**
 * 利用可能なコンテキスト情報を取得するテスト
 */
async function testAvailableContexts() {
  try {
    console.log('\n利用可能なコンテキスト情報を取得中...');
    const token = await getToken();
    
    const response = await axios.get(`${SERVER_BASE_URL}${CHAT_API}/contexts/available`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('結果:', response.status, response.data.success ? '成功' : '失敗');
    
    if (response.data.success) {
      const { self, fortune, friends, teams } = response.data.availableContexts;
      
      console.log('\n利用可能なコンテキスト:');
      console.log('- セルフ:', self ? '有り' : '無し');
      console.log('- 運勢:', fortune ? fortune.length + '件' : '無し');
      console.log('- 友達:', friends ? friends.length + '件' : '無し');
      console.log('- チーム:', teams ? teams.length + '件' : '無し');
    }
    
    return response.data;
  } catch (error) {
    console.error('エラー:', error.message);
    if (error.response) {
      console.error('レスポンス:', error.response.data);
    }
    return null;
  }
}

/**
 * コンテキスト詳細情報を取得するテスト
 */
async function testContextDetail() {
  try {
    console.log('\nコンテキスト詳細情報を取得中...');
    const token = await getToken();
    
    const response = await axios.get(`${SERVER_BASE_URL}${CHAT_API}/contexts/detail`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        type: CONTEXT_TYPE.SELF
      }
    });
    
    console.log('結果:', response.status, response.data.success ? '成功' : '失敗');
    
    if (response.data.success && response.data.context) {
      console.log('コンテキスト名:', response.data.context.name);
      console.log('タイプ:', response.data.context.type);
    }
    
    return response.data;
  } catch (error) {
    console.error('エラー:', error.message);
    if (error.response) {
      console.error('レスポンス:', error.response.data);
    }
    return null;
  }
}

/**
 * メッセージを送信するテスト
 */
async function testSendMessage() {
  try {
    console.log('\nコンテキストベースのメッセージを送信中...');
    const token = await getToken();
    
    const response = await axios.post(`${SERVER_BASE_URL}${CHAT_API}/message`, {
      message: 'こんにちは、今日の運勢はどうですか？',
      contextItems: [
        { type: CONTEXT_TYPE.SELF },
        { type: CONTEXT_TYPE.FORTUNE, id: 'today' }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('結果:', response.status, response.data.success ? '成功' : '失敗');
    
    if (response.data.success) {
      console.log('AIレスポンス (最初の100文字):');
      console.log(response.data.response.message.substring(0, 100) + '...');
    }
    
    return response.data;
  } catch (error) {
    console.error('エラー:', error.message);
    if (error.response) {
      console.error('レスポンス:', error.response.data);
    }
    return null;
  }
}

/**
 * チャット履歴を取得するテスト
 */
async function testChatHistory() {
  try {
    console.log('\nチャット履歴を取得中...');
    const token = await getToken();
    
    const response = await axios.get(`${SERVER_BASE_URL}${CHAT_API}/history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('結果:', response.status, response.data.success ? '成功' : '失敗');
    
    if (response.data.success) {
      const { chatHistories, pagination } = response.data;
      console.log('チャット履歴:', chatHistories.length + '件');
      console.log('全件数:', pagination.total);
    }
    
    return response.data;
  } catch (error) {
    console.error('エラー:', error.message);
    if (error.response) {
      console.error('レスポンス:', error.response.data);
    }
    return null;
  }
}

/**
 * 全てのテストを実行
 */
async function runAllTests() {
  const results = {
    availableContexts: await testAvailableContexts(),
    contextDetail: await testContextDetail(),
    sendMessage: await testSendMessage(),
    chatHistory: await testChatHistory()
  };
  
  console.log('\n===== テスト結果サマリー =====');
  console.log('利用可能なコンテキスト取得:', results.availableContexts ? '成功' : '失敗');
  console.log('コンテキスト詳細取得:', results.contextDetail ? '成功' : '失敗');
  console.log('メッセージ送信:', results.sendMessage ? '成功' : '失敗');
  console.log('チャット履歴取得:', results.chatHistory ? '成功' : '失敗');
}

/**
 * テスト実行
 */
async function run() {
  try {
    switch (selectedTest) {
      case 'available':
        await testAvailableContexts();
        break;
      case 'detail':
        await testContextDetail();
        break;
      case 'message':
        await testSendMessage();
        break;
      case 'history':
        await testChatHistory();
        break;
      case 'all':
      default:
        await runAllTests();
        break;
    }
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// テスト実行
run();