/**
 * チャットコンテキスト管理システムのAPIエンドポイントをテストするスクリプト
 * 
 * 使い方:
 * 1. サーバーを起動しておく: cd server && npm run dev
 * 2. 別のターミナルでこのスクリプトを実行: node scripts/test-chat-contexts.js
 */

const fetch = require('node-fetch');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 設定
const SERVER_URL = 'http://localhost:8080';
const USER_EMAIL = 'shiraishi.tatsuya@mikoto.co.jp';
const USER_PASSWORD = 'aikakumei';

// API エンドポイント
const API_AVAILABLE_CONTEXTS = '/api/v1/chat/contexts/available';
const API_CONTEXT_DETAIL = '/api/v1/chat/contexts/detail';
const API_CHAT_MESSAGE = '/api/v1/chat/message';

// JWT トークンをキャッシュから取得する関数
async function getTokenFromCache() {
  try {
    const tokenCachePath = path.join(__dirname, '.jwt_token_cache.json');
    if (fs.existsSync(tokenCachePath)) {
      const cache = JSON.parse(fs.readFileSync(tokenCachePath, 'utf8'));
      if (cache.token && cache.expires && new Date(cache.expires) > new Date()) {
        console.log(`キャッシュからトークンを取得しました: ${cache.token.substring(0, 10)}...`);
        return cache.token;
      }
    }
    
    // キャッシュになければ新規取得
    return await getAuthToken();
  } catch (error) {
    console.error('キャッシュからのトークン取得エラー:', error.message);
    return await getAuthToken();
  }
}

// ログイン情報を取得する関数
async function getAuthToken() {
  console.log('JWT認証トークンを取得中...');
  
  return new Promise((resolve, reject) => {
    const tokenProcess = spawn('node', ['scripts/get-jwt-token.js', USER_EMAIL, USER_PASSWORD]);
    
    let token = '';
    
    tokenProcess.stdout.on('data', (data) => {
      const output = data.toString();
      // トークンを抽出
      const tokenMatch = output.match(/JWT認証トークン: ([^\n]+)/);
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

// 利用可能なコンテキストを取得するテスト
async function testGetAvailableContexts(token) {
  console.log('\n1. 利用可能なコンテキストを取得中...');
  
  try {
    const response = await fetch(`${SERVER_URL}${API_AVAILABLE_CONTEXTS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API エラー (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('利用可能なコンテキスト取得成功 ✅');
    
    // 重要な情報だけをログに出力（デバッグしやすくするため）
    const summary = {
      success: data.success,
      self: data.availableContexts?.self ? {
        id: data.availableContexts.self.id,
        name: data.availableContexts.self.name,
        type: data.availableContexts.self.type
      } : null,
      fortune: data.availableContexts?.fortune ? data.availableContexts.fortune.length : 0,
      friends: data.availableContexts?.friends ? data.availableContexts.friends.length : 0,
      teams: data.availableContexts?.teams ? data.availableContexts.teams.length : 0
    };
    
    console.log('利用可能なコンテキスト概要:', JSON.stringify(summary, null, 2));
    
    // 詳細はデバッグがしやすいようにログファイルに出力
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilePath = path.join(logDir, `available-contexts-${timestamp}.json`);
    fs.writeFileSync(logFilePath, JSON.stringify(data, null, 2));
    console.log(`詳細データをログファイルに保存しました: ${logFilePath}`);
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('利用可能なコンテキスト取得失敗 ❌:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// コンテキスト詳細を取得するテスト
async function testGetContextDetail(token, contextType, contextId) {
  console.log(`\n2. コンテキスト詳細を取得中... (type: ${contextType}, id: ${contextId || 'なし'})`);
  
  try {
    let url = `${SERVER_URL}${API_CONTEXT_DETAIL}?type=${contextType}`;
    if (contextId) {
      url += `&id=${contextId}`;
    }
    
    console.log(`リクエストURL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const responseText = await response.text();
    console.log(`レスポンス: ${responseText.substring(0, 100)}...`);
    
    if (!response.ok) {
      throw new Error(`API エラー (${response.status}): ${responseText}`);
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`JSONパースエラー: ${e.message}, レスポンス: ${responseText}`);
    }
    
    console.log(`コンテキスト詳細取得成功 ✅ (${contextType})`);
    
    // 概要情報を出力
    const summary = {
      success: data.success,
      contextType: contextType,
      contextId: contextId,
      hasContextData: !!data.context
    };
    
    if (data.context) {
      summary.contextName = data.context.name;
      summary.contextDetailsKeys = data.context.details ? Object.keys(data.context.details) : [];
    }
    
    console.log('コンテキスト詳細概要:', JSON.stringify(summary, null, 2));
    
    // 詳細はログファイルに出力
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilePath = path.join(logDir, `context-detail-${contextType}-${contextId || 'noId'}-${timestamp}.json`);
    fs.writeFileSync(logFilePath, JSON.stringify(data, null, 2));
    console.log(`詳細データをログファイルに保存しました: ${logFilePath}`);
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error(`コンテキスト詳細取得失敗 ❌ (${contextType}):`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// コンテキストベースのチャットメッセージを送信するテスト
async function testSendMessageWithContexts(token, contextItems) {
  console.log('\n3. コンテキストベースのチャットメッセージを送信中...');
  console.log('使用するコンテキスト:', JSON.stringify(contextItems, null, 2));
  
  try {
    const response = await fetch(`${SERVER_URL}${API_CHAT_MESSAGE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: 'これらのコンテキストに基づいて、簡単なアドバイスをください。',
        contextItems: contextItems
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API エラー (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('コンテキストベースメッセージ送信成功 ✅');
    
    // AIレスポンスの最初の100文字を表示
    const aiResponse = data.response.message;
    console.log(`AIレスポンス: ${aiResponse.substring(0, 100)}...`);
    
    // レスポンスをログファイルに保存
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const contextTypes = contextItems.map(item => item.type).join('-');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilePath = path.join(logDir, `message-response-${contextTypes}-${timestamp}.json`);
    
    const logData = {
      request: {
        message: 'これらのコンテキストに基づいて、簡単なアドバイスをください。',
        contextItems: contextItems
      },
      response: {
        success: data.success,
        message: data.response.message,
        timestamp: data.response.timestamp
      }
    };
    
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
    console.log(`レスポンスをログファイルに保存しました: ${logFilePath}`);
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('コンテキストベースメッセージ送信失敗 ❌:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 従来のモードベースのメッセージ送信テスト（下位互換性確認）
async function testSendMessageWithMode(token, mode) {
  console.log(`\n4. 従来のモードベースメッセージを送信中... (mode: ${mode})`);
  
  try {
    const response = await fetch(`${SERVER_URL}${API_CHAT_MESSAGE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: 'モードベースのメッセージテストです。簡単なアドバイスをください。',
        mode: mode
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API エラー (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`モードベースメッセージ送信成功 ✅ (${mode})`);
    
    // AIレスポンスの最初の100文字を表示
    const aiResponse = data.response.message;
    console.log(`AIレスポンス: ${aiResponse.substring(0, 100)}...`);
    
    // レスポンスをログファイルに保存
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilePath = path.join(logDir, `mode-response-${mode}-${timestamp}.json`);
    
    const logData = {
      request: {
        message: 'モードベースのメッセージテストです。簡単なアドバイスをください。',
        mode: mode
      },
      response: {
        success: data.success,
        message: data.response.message,
        timestamp: data.response.timestamp
      }
    };
    
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
    console.log(`レスポンスをログファイルに保存しました: ${logFilePath}`);
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error(`モードベースメッセージ送信失敗 ❌ (${mode}):`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 複数コンテキストの組み合わせテスト
async function testMultipleContexts(token, contexts) {
  console.log('\n5. 複数コンテキストの組み合わせテスト...');
  console.log('組み合わせるコンテキスト:', JSON.stringify(contexts, null, 2));
  
  try {
    const response = await fetch(`${SERVER_URL}${API_CHAT_MESSAGE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: '複数のコンテキストに基づいて、総合的なアドバイスをください。',
        contextItems: contexts
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API エラー (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('複数コンテキスト組み合わせテスト成功 ✅');
    
    // AIレスポンスの最初の100文字を表示
    const aiResponse = data.response.message;
    console.log(`AIレスポンス: ${aiResponse.substring(0, 100)}...`);
    
    // レスポンスをログファイルに保存
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const contextTypes = contexts.map(item => item.type).join('-');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilePath = path.join(logDir, `multi-context-response-${contextTypes}-${timestamp}.json`);
    
    const logData = {
      request: {
        message: '複数のコンテキストに基づいて、総合的なアドバイスをください。',
        contextItems: contexts
      },
      response: {
        success: data.success,
        message: data.response.message,
        timestamp: data.response.timestamp
      }
    };
    
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
    console.log(`レスポンスをログファイルに保存しました: ${logFilePath}`);
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('複数コンテキスト組み合わせテスト失敗 ❌:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ストリーミングテスト
async function testStreamingWithContexts(token, contextItems) {
  console.log('\n6. ストリーミングAPIテスト (コンテキストベース)...');
  console.log('使用するコンテキスト:', JSON.stringify(contextItems, null, 2));
  
  try {
    // ストリーミングリクエスト
    const response = await fetch(`${SERVER_URL}${API_CHAT_MESSAGE}?stream=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: 'これらのコンテキストに基づいて、詳細なアドバイスをください。',
        contextItems: contextItems,
        stream: true
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API エラー (${response.status}): ${errorText}`);
    }
    
    // ストリーミングレスポンスの処理
    console.log('ストリーミングレスポンス受信開始...');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let completeMessage = '';
    let chunkCount = 0;
    
    try {
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          console.log('ストリーミング完了 (done)');
          break;
        }
        
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(line => line.trim().startsWith('data: '));
        
        for (const line of lines) {
          try {
            const jsonStr = line.replace('data: ', '');
            const data = JSON.parse(jsonStr);
            
            if (data.event === 'start') {
              console.log(`ストリーミングセッション開始: ${data.sessionId}`);
            }
            else if (data.event === 'chunk') {
              chunkCount++;
              // 最初の3チャンクのみ表示し、残りは"..."で省略
              if (chunkCount <= 3) {
                console.log(`Chunk ${chunkCount}: ${data.text}`);
              } else if (chunkCount === 4) {
                console.log('...');
              }
              completeMessage += data.text;
            }
            else if (data.event === 'end') {
              console.log(`ストリーミングセッション終了: ${data.sessionId}`);
            }
            else if (data.event === 'error') {
              console.error(`ストリーミングエラー: ${data.message}`);
            }
          } catch (e) {
            console.error(`SSEデータパースエラー: ${e.message}, ライン: ${line}`);
          }
        }
      }
      
      console.log(`ストリーミングテスト成功 ✅ (合計 ${chunkCount} チャンク受信)`);
      
      // メッセージの最初の100文字を表示
      console.log(`最終メッセージ (最初の100文字): ${completeMessage.substring(0, 100)}...`);
      
      // レスポンスをログファイルに保存
      const logDir = path.join(__dirname, 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const contextTypes = contextItems.map(item => item.type).join('-');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFilePath = path.join(logDir, `streaming-response-${contextTypes}-${timestamp}.txt`);
      
      fs.writeFileSync(logFilePath, completeMessage);
      console.log(`ストリーミングレスポンスをログファイルに保存しました: ${logFilePath}`);
      
      return {
        success: true,
        chunkCount,
        messageLength: completeMessage.length
      };
    } catch (error) {
      console.error('ストリーミングデータ処理エラー:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  } catch (error) {
    console.error('ストリーミングリクエスト失敗 ❌:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// メイン関数
async function main() {
  console.log('チャットコンテキスト管理システムのAPIテストを開始します...');
  
  // 全体の結果を保持する変数
  const results = {
    availableContexts: { success: false },
    contextDetail: { success: false },
    contextMessage: { success: false },
    modeMessage: { success: false },
    multiContext: { success: false },
    streaming: { success: false }
  };
  
  try {
    // 認証トークンを取得
    const token = await getTokenFromCache();
    
    // 1. 利用可能なコンテキストを取得
    const availableContextsResult = await testGetAvailableContexts(token);
    results.availableContexts = availableContextsResult;
    
    // 利用可能なコンテキストからテスト用のIDを取得
    let selfContext = { type: 'self' };
    let fortuneContext = { type: 'fortune', id: 'today' };
    let friendContext = null;
    let teamContext = null;
    
    if (availableContextsResult.success) {
      const contexts = availableContextsResult.data.availableContexts;
      
      // Self コンテキスト
      if (contexts.self) {
        selfContext.id = contexts.self.id;
      }
      
      // Friend コンテキスト
      if (contexts.friends && contexts.friends.length > 0) {
        friendContext = {
          type: 'friend',
          id: contexts.friends[0].id
        };
      }
      
      // Team コンテキスト
      if (contexts.teams && contexts.teams.length > 0) {
        // チームとチーム目標を区別
        const teamItems = contexts.teams.filter(item => item.type === 'team');
        if (teamItems.length > 0) {
          teamContext = {
            type: 'team',
            id: teamItems[0].id
          };
        }
      }
    }
    
    // 2. 各コンテキストタイプの詳細を取得
    const contextDetailResults = {};
    
    // Self コンテキスト詳細
    contextDetailResults.self = await testGetContextDetail(token, 'self', selfContext.id);
    
    // Fortune コンテキスト詳細
    contextDetailResults.fortune = await testGetContextDetail(token, 'fortune', 'today');
    
    // Friend コンテキスト詳細（もし存在すれば）
    if (friendContext) {
      contextDetailResults.friend = await testGetContextDetail(token, 'friend', friendContext.id);
    }
    
    // Team コンテキスト詳細（もし存在すれば）
    if (teamContext) {
      contextDetailResults.team = await testGetContextDetail(token, 'team', teamContext.id);
    }
    
    // コンテキスト詳細テストの結果を集計
    results.contextDetail.success = Object.values(contextDetailResults).every(r => r.success);
    results.contextDetail.results = contextDetailResults;
    
    // 3. コンテキストベースのメッセージ送信テスト
    const sendMessageResults = {};
    
    // Self コンテキストでメッセージ送信
    sendMessageResults.self = await testSendMessageWithContexts(token, [selfContext]);
    
    // Fortune コンテキストでメッセージ送信
    sendMessageResults.fortune = await testSendMessageWithContexts(token, [fortuneContext]);
    
    // Friend コンテキストでメッセージ送信（もし存在すれば）
    if (friendContext) {
      sendMessageResults.friend = await testSendMessageWithContexts(token, [friendContext]);
    }
    
    // Team コンテキストでメッセージ送信（もし存在すれば）
    if (teamContext) {
      sendMessageResults.team = await testSendMessageWithContexts(token, [teamContext]);
    }
    
    // メッセージ送信テストの結果を集計
    results.contextMessage.success = Object.values(sendMessageResults).every(r => r.success);
    results.contextMessage.results = sendMessageResults;
    
    // 4. 従来のモードベースのメッセージ送信テスト
    const modeMessageResults = {};
    
    // Personal モード
    modeMessageResults.personal = await testSendMessageWithMode(token, 'personal');
    
    // Friend モード (friendId を指定して)
    if (friendContext) {
      modeMessageResults.friend = await testSendMessageWithMode(token, 'friend');
    }
    
    // Team モード (teamId を指定して)
    if (teamContext) {
      modeMessageResults.team = await testSendMessageWithMode(token, 'team');
    }
    
    // モードメッセージテストの結果を集計
    results.modeMessage.success = Object.values(modeMessageResults).every(r => r.success);
    results.modeMessage.results = modeMessageResults;
    
    // 5. 複数コンテキストの組み合わせテスト
    const multipleContextsResults = {};
    
    // Self + Fortune
    multipleContextsResults.selfFortune = await testMultipleContexts(token, [
      selfContext,
      fortuneContext
    ]);
    
    // Self + Friend (友達がいる場合)
    if (friendContext) {
      multipleContextsResults.selfFriend = await testMultipleContexts(token, [
        selfContext,
        friendContext
      ]);
    }
    
    // Self + Team (チームがある場合)
    if (teamContext) {
      multipleContextsResults.selfTeam = await testMultipleContexts(token, [
        selfContext,
        teamContext
      ]);
    }
    
    // 複数コンテキストテストの結果を集計
    results.multiContext.success = Object.values(multipleContextsResults).every(r => r.success);
    results.multiContext.results = multipleContextsResults;
    
    // 6. ストリーミングAPIテスト
    const streamingResults = {};
    
    // Self コンテキストでストリーミング
    streamingResults.self = await testStreamingWithContexts(token, [selfContext]);
    
    // Self + Fortune でストリーミング
    streamingResults.selfFortune = await testStreamingWithContexts(token, [
      selfContext,
      fortuneContext
    ]);
    
    // ストリーミングテストの結果を集計
    results.streaming.success = Object.values(streamingResults).every(r => r.success);
    results.streaming.results = streamingResults;
    
    // 結果をまとめて表示
    console.log('\n========== テスト結果 ==========');
    
    // 1. 利用可能なコンテキスト取得テスト
    console.log(`1. 利用可能なコンテキスト取得: ${results.availableContexts.success ? '成功 ✅' : '失敗 ❌'}`);
    
    // 2. コンテキスト詳細取得テスト
    console.log('\n2. コンテキスト詳細取得:');
    for (const [type, result] of Object.entries(contextDetailResults)) {
      console.log(`  - ${type}: ${result.success ? '成功 ✅' : '失敗 ❌'}`);
    }
    
    // 3. コンテキストベースのメッセージ送信テスト
    console.log('\n3. コンテキストベースのメッセージ送信:');
    for (const [type, result] of Object.entries(sendMessageResults)) {
      console.log(`  - ${type}: ${result.success ? '成功 ✅' : '失敗 ❌'}`);
    }
    
    // 4. モードベースのメッセージ送信テスト
    console.log('\n4. モードベースのメッセージ送信 (下位互換性):');
    for (const [mode, result] of Object.entries(modeMessageResults)) {
      console.log(`  - ${mode}: ${result.success ? '成功 ✅' : '失敗 ❌'}`);
    }
    
    // 5. 複数コンテキスト組み合わせテスト
    console.log('\n5. 複数コンテキスト組み合わせ:');
    for (const [combo, result] of Object.entries(multipleContextsResults)) {
      console.log(`  - ${combo}: ${result.success ? '成功 ✅' : '失敗 ❌'}`);
    }
    
    // 6. ストリーミングAPIテスト
    console.log('\n6. ストリーミングAPIテスト:');
    for (const [context, result] of Object.entries(streamingResults)) {
      console.log(`  - ${context}: ${result.success ? '成功 ✅' : '失敗 ❌'}`);
    }
    
    // 全体の結果判定
    const allResults = [
      results.availableContexts.success,
      results.contextDetail.success,
      results.contextMessage.success,
      results.modeMessage.success,
      results.multiContext.success,
      results.streaming.success
    ];
    
    const overallSuccess = allResults.every(Boolean);
    console.log(`\n全体結果: ${overallSuccess ? '全テスト成功 ✅' : '一部テスト失敗 ❌'}`);
    
    // 完了したテストの数を表示
    const successCount = allResults.filter(Boolean).length;
    console.log(`成功したテストカテゴリ: ${successCount}/${allResults.length}`);
    
    // テスト結果をログファイルに保存
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilePath = path.join(logDir, `test-summary-${timestamp}.json`);
    
    // 集計結果のみを保存
    const summaryResults = {
      timestamp: new Date().toISOString(),
      overallSuccess,
      successCount,
      totalTests: allResults.length,
      testCategories: {
        availableContexts: results.availableContexts.success,
        contextDetail: {
          success: results.contextDetail.success,
          tests: Object.fromEntries(
            Object.entries(contextDetailResults).map(([k, v]) => [k, v.success])
          )
        },
        contextMessage: {
          success: results.contextMessage.success,
          tests: Object.fromEntries(
            Object.entries(sendMessageResults).map(([k, v]) => [k, v.success])
          )
        },
        modeMessage: {
          success: results.modeMessage.success,
          tests: Object.fromEntries(
            Object.entries(modeMessageResults).map(([k, v]) => [k, v.success])
          )
        },
        multiContext: {
          success: results.multiContext.success,
          tests: Object.fromEntries(
            Object.entries(multipleContextsResults).map(([k, v]) => [k, v.success])
          )
        },
        streaming: {
          success: results.streaming.success,
          tests: Object.fromEntries(
            Object.entries(streamingResults).map(([k, v]) => [k, v.success])
          )
        }
      }
    };
    
    fs.writeFileSync(logFilePath, JSON.stringify(summaryResults, null, 2));
    console.log(`\nテスト結果サマリーをログファイルに保存しました: ${logFilePath}`);
    
    process.exit(overallSuccess ? 0 : 1);
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// プログラム開始
main();