/**
 * 最小限のコンテキストでチャットメッセージのテストを行うスクリプト
 * 
 * シンプルな設定で、基本的な機能だけをテストして原因を切り分ける
 */
require('dotenv').config();
const axios = require('axios');
const { generateToken } = require('./get-token');

// テスト設定
const SERVER_URL = process.env.SERVER_BASE_URL || 'http://localhost:8080';
const API_PATH = '/api/v1';
const CHAT_API = `${API_PATH}/chat`;
const TEST_USER_ID = '67f87e86a7d83fb995de0ee6';
const TEST_USER_ROLE = 'super_admin';

// JWT認証トークンを取得
async function getToken() {
  try {
    console.log(`トークンを生成しています (${TEST_USER_ID})...`);
    const token = await generateToken(TEST_USER_ID, TEST_USER_ROLE);
    console.log('トークン生成に成功しました');
    return token;
  } catch (error) {
    console.error('トークン生成エラー:', error);
    throw error;
  }
}

// 利用可能なコンテキスト情報を取得するテスト
async function testAvailableContexts(token) {
  console.log('\n1. 利用可能なコンテキスト情報を取得します...');
  
  try {
    const response = await axios.get(`${SERVER_URL}${CHAT_API}/contexts/available`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('ステータス:', response.status);
    console.log('成功:', response.data.success);
    
    if (response.data.success) {
      const availableContexts = response.data.availableContexts;
      console.log('\n利用可能なコンテキスト情報:');
      
      if (availableContexts.self) {
        console.log('- SELFコンテキスト:', availableContexts.self.name);
      }
      
      return availableContexts;
    } else {
      console.error('エラー:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('利用可能なコンテキスト情報の取得に失敗:', error.message);
    if (error.response) {
      console.error('レスポンスデータ:', error.response.data);
    }
    return null;
  }
}

// 最小限のコンテキストでメッセージ送信テスト
async function testMinimalMessage(token, selfId = 'current_user') {
  console.log('\n2. 最小限のコンテキストでメッセージを送信します...');
  
  try {
    // 最もシンプルなケース - selfコンテキストのみ使用（IDを明示的に指定）
    const payload = {
      message: 'こんにちは、私の今日の運勢を教えてください。',
      contextItems: [
        { type: 'self', id: selfId }
      ]
    };
    
    console.log('リクエストペイロード:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${SERVER_URL}${CHAT_API}/message`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('ステータス:', response.status);
    console.log('成功:', response.data.success);
    
    if (response.data.success) {
      console.log('\nAIレスポンス:');
      console.log(response.data.response.message.substring(0, 200) + '...');
      
      return response.data;
    } else {
      console.error('エラー:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('メッセージ送信に失敗:', error.message);
    if (error.response) {
      console.error('レスポンスデータ:', error.response.data);
      console.error('ステータス:', error.response.status);
    }
    if (error.request) {
      console.error('リクエストが送信されましたが、レスポンスがありませんでした');
    }
    return null;
  }
}

// モードベースのメッセージングテスト（比較用）
async function testModeBasedMessage(token) {
  console.log('\n3. 従来のモードベースでメッセージを送信します (比較用)...');
  
  try {
    // 旧システムのモードベースメッセージング
    const payload = {
      message: 'こんにちは、私の今日の運勢を教えてください。',
      mode: 'personal'
    };
    
    console.log('リクエストペイロード:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${SERVER_URL}${CHAT_API}/message`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('ステータス:', response.status);
    console.log('成功:', response.data.success);
    
    if (response.data.success) {
      console.log('\nAIレスポンス:');
      console.log(response.data.response.message.substring(0, 200) + '...');
      
      return response.data;
    } else {
      console.error('エラー:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('メッセージ送信に失敗:', error.message);
    if (error.response) {
      console.error('レスポンスデータ:', error.response.data);
    }
    return null;
  }
}

// メイン関数
async function main() {
  try {
    console.log('最小限のコンテキストでのチャットAPIテストを開始します...');
    
    // トークンを取得
    const token = await getToken();
    
    // 利用可能なコンテキスト情報を取得
    const availableContexts = await testAvailableContexts(token);
    
    // 利用可能なコンテキスト情報から自分のコンテキストIDを取得
    let selfContextId = 'current_user';
    if (availableContexts && availableContexts.self) {
      selfContextId = availableContexts.self.id || 'current_user';
      console.log(`\n自分のコンテキストID: ${selfContextId}`);
    }
    
    // 最小限のコンテキストでメッセージ送信 (明示的にIDを指定する)
    const minimalMessageResult = await testMinimalMessage(token, selfContextId);
    
    // 従来のモードベースでメッセージ送信（比較用）
    const modeBasedMessageResult = await testModeBasedMessage(token);
    
    // 結果のサマリー
    console.log('\n===== テスト結果サマリー =====');
    console.log('1. 利用可能なコンテキスト情報取得:', availableContexts ? '成功 ✅' : '失敗 ❌');
    console.log('2. 最小限コンテキストでのメッセージ送信:', minimalMessageResult ? '成功 ✅' : '失敗 ❌');
    console.log('3. モードベースのメッセージ送信 (比較用):', modeBasedMessageResult ? '成功 ✅' : '失敗 ❌');
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  }
}

// スクリプト実行
main();