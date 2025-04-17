/**
 * チャットストリーミング機能をテストするスクリプト
 * 
 * 使い方:
 * 1. サーバーを起動しておく: cd server && npm run dev
 * 2. 別のターミナルでこのスクリプトを実行: node scripts/test-chat-streaming.js
 */

const fetch = require('node-fetch');
const { spawn } = require('child_process');
const readline = require('readline');

// 設定
const SERVER_URL = 'http://localhost:8080';
const API_PATH = '/api/v1/chat/message';
const USER_EMAIL = 'shiraishi.tatsuya@mikoto.co.jp';
const USER_PASSWORD = 'aikakumei';

// ログイン情報を取得する関数
async function getAuthToken() {
  console.log('認証トークンを取得中...');
  
  return new Promise((resolve, reject) => {
    const tokenProcess = spawn('node', ['scripts/get-token.js', USER_EMAIL, USER_PASSWORD]);
    
    let token = '';
    
    tokenProcess.stdout.on('data', (data) => {
      const output = data.toString();
      // トークンを抽出
      const tokenMatch = output.match(/Token: ([^\n]+)/);
      if (tokenMatch && tokenMatch[1]) {
        token = tokenMatch[1].trim();
      }
    });
    
    tokenProcess.stderr.on('data', (data) => {
      console.error(`エラー: ${data}`);
    });
    
    tokenProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`トークン取得プロセスがコード ${code} で終了しました`));
        return;
      }
      
      if (!token) {
        reject(new Error('トークンを取得できませんでした'));
        return;
      }
      
      console.log(`トークンを取得しました: ${token.substring(0, 10)}...`);
      resolve(token);
    });
  });
}

// 通常のリクエストでチャットテスト
async function testNormalChatRequest(token) {
  console.log('\n1. 通常のチャットリクエストをテスト中...');
  
  try {
    const response = await fetch(`${SERVER_URL}${API_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: 'こんにちは、今日の運勢を教えてください',
        mode: 'personal'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API エラー (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('通常リクエスト成功 ✅');
    console.log(`AIレスポンス: ${data.response.message.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.error('通常リクエスト失敗 ❌:', error.message);
    return false;
  }
}

// ストリーミングリクエストでチャットテスト（fetch APIのストリーミング）
async function testStreamingChatRequest(token) {
  console.log('\n2. ストリーミングチャットリクエストをテスト中（fetch API使用）...');
  
  try {
    const response = await fetch(`${SERVER_URL}${API_PATH}?stream=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: '四柱推命に基づいて明日の運勢を教えてください',
        mode: 'personal',
        stream: true
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API エラー (${response.status}): ${errorText}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let completeMessage = '';
    
    console.log('ストリーミングレスポース:');
    
    while (true) {
      const { value, done } = await reader.read();
      
      if (done) {
        break;
      }
      
      const text = decoder.decode(value);
      const lines = text.split('\n').filter(line => line.trim().startsWith('data: '));
      
      for (const line of lines) {
        try {
          const jsonStr = line.replace('data: ', '');
          const data = JSON.parse(jsonStr);
          
          if (data.event === 'chunk') {
            process.stdout.write(data.text);
            completeMessage += data.text;
          } else if (data.event === 'end') {
            console.log('\nストリーミング完了');
          } else if (data.event === 'error') {
            console.error(`\nストリーミングエラー: ${data.message}`);
          }
        } catch (e) {
          console.error(`\n解析エラー: ${e.message}, ライン: ${line}`);
        }
      }
    }
    
    console.log('\nstretch APIストリーミングリクエスト成功 ✅');
    return true;
  } catch (error) {
    console.error('ストリーミングリクエスト失敗 ❌:', error.message);
    return false;
  }
}

// EventSourceを使用したストリーミングテスト（ブラウザと同様の動作）
function testEventSource(token) {
  console.log('\n3. EventSourceを使用したストリーミングテスト...');
  
  // Node.jsでEventSourceを使用するためのパッケージをrequire
  const EventSource = require('eventsource');
  
  return new Promise((resolve, reject) => {
    // EventSourceはクエリパラメータ経由で認証する必要がある
    const eventSource = new EventSource(`${SERVER_URL}${API_PATH}?stream=true&token=${encodeURIComponent(token)}`, {
      https: { rejectUnauthorized: false }
    });
    
    let completeMessage = '';
    let receivedChunks = 0;
    let timeout = setTimeout(() => {
      eventSource.close();
      console.error('EventSourceテスト: タイムアウト');
      resolve(false);
    }, 30000); // 30秒のタイムアウト
    
    // POSTリクエストを送信（EventSourceはGETリクエストのみサポート）
    const postData = async () => {
      try {
        const response = await fetch(`${SERVER_URL}${API_PATH}?stream=true`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: '今週のラッキーカラーは何ですか？',
            mode: 'personal',
            stream: true
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`POST リクエストエラー (${response.status}): ${errorText}`);
        }
        
        console.log('POSTリクエスト送信成功');
      } catch (error) {
        console.error('POSTリクエスト送信失敗:', error.message);
        eventSource.close();
        clearTimeout(timeout);
        resolve(false);
      }
    };
    
    eventSource.onopen = () => {
      console.log('EventSource接続確立');
      // 接続確立後にPOSTリクエストを送信
      postData();
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.event === 'chunk') {
          receivedChunks++;
          process.stdout.write(data.text);
          completeMessage += data.text;
        } else if (data.event === 'end') {
          console.log('\nEventSource ストリーミング完了');
          eventSource.close();
          clearTimeout(timeout);
          resolve(true);
        } else if (data.event === 'error') {
          console.error(`\nEventSource ストリーミングエラー: ${data.message}`);
          eventSource.close();
          clearTimeout(timeout);
          resolve(false);
        }
      } catch (e) {
        console.error(`\nEventSource データ解析エラー: ${e.message}`);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('\nEventSource エラー:', error);
      eventSource.close();
      clearTimeout(timeout);
      resolve(false);
    };
  });
}

// クエリパラメータからの認証テスト
async function testQueryParamAuth(token) {
  console.log('\n4. クエリパラメータからの認証テスト...');
  
  try {
    // クエリパラメータからの認証
    const response = await fetch(`${SERVER_URL}${API_PATH}?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'クエリパラメータ認証のテストです',
        mode: 'personal'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API エラー (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('クエリパラメータ認証テスト成功 ✅');
    console.log(`AIレスポンス: ${data.response.message.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.error('クエリパラメータ認証テスト失敗 ❌:', error.message);
    return false;
  }
}

// メイン関数
async function main() {
  console.log('チャットストリーミングテストを開始します...');
  
  try {
    // 認証トークンを取得
    const token = await getAuthToken();
    
    // 各テストを実行
    let results = {
      normalRequest: await testNormalChatRequest(token),
      streamingRequest: await testStreamingChatRequest(token),
      eventSourceTest: await testEventSource(token),
      queryParamAuth: await testQueryParamAuth(token)
    };
    
    // 結果をまとめて表示
    console.log('\n========== テスト結果 ==========');
    console.log(`1. 通常のチャットリクエスト: ${results.normalRequest ? '成功 ✅' : '失敗 ❌'}`);
    console.log(`2. Fetch APIストリーミング: ${results.streamingRequest ? '成功 ✅' : '失敗 ❌'}`);
    console.log(`3. EventSourceストリーミング: ${results.eventSourceTest ? '成功 ✅' : '失敗 ❌'}`);
    console.log(`4. クエリパラメータ認証: ${results.queryParamAuth ? '成功 ✅' : '失敗 ❌'}`);
    
    const overallResult = Object.values(results).every(Boolean);
    console.log(`\n全体結果: ${overallResult ? '全テスト成功 ✅' : '一部テスト失敗 ❌'}`);
    
    process.exit(overallResult ? 0 : 1);
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// プログラム開始
main();