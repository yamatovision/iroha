/**
 * Claude AI APIのストリーミングをサーバーサイドでテストするスクリプト
 */

// dotenvを読み込んで環境変数を設定
require('dotenv').config({ path: '../.env' });

// Claude APIのキーを環境変数から取得
const apiKey = process.env.CLAUDE_API_KEY || '[REDACTED]';
const MODEL = process.env.CLAUDE_MODEL || 'claude-3-7-sonnet-20250219';

if (!apiKey) {
  console.error('ERROR: CLAUDE_API_KEY環境変数が設定されていません');
  process.exit(1);
}

console.log('Claude API ストリーミングテストを開始します...');
console.log(`APIキー: ${apiKey.substring(0, 10)}...`);
console.log(`モデル: ${MODEL}`);

/**
 * Claude APIに直接アクセスしてストリーミングリクエストを行う
 */
async function testClaudeStreaming() {
  try {
    const { default: fetch } = await import('node-fetch');
    
    console.log('1. Claudeにストリーミングリクエストを送信しています...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: '四柱推命に基づいて、今日の運勢を100文字程度で教えてください' }
        ],
        max_tokens: 1000,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`API エラー: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('レスポンスボディがありません');
    }

    console.log('2. ストリーミングレスポンスを受信しています...');
    console.log('--- ストリーミングデータ開始 ---');

    // Node.js用のストリーム処理
    const reader = response.body;
    let buffer = '';
    let completeResponse = '';

    // データチャンクイベントの処理
    for await (const chunk of reader) {
      // バッファにチャンクを追加
      buffer += chunk.toString();
      
      // バッファを行単位で処理
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 最後の不完全な行をバッファに戻す
      
      for (const line of lines) {
        // 空行をスキップ
        if (!line.trim()) continue;
        
        // "data: "で始まる行を処理
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          
          // "[DONE]"はストリームの終了を意味する
          if (data === '[DONE]') {
            console.log('\n--- ストリーミング完了 ---');
            continue;
          }
          
          try {
            // JSONデータをパース
            const parsedData = JSON.parse(data);
            
            // イベントタイプに基づいて処理
            if (parsedData.type === 'content_block_delta' && 
                parsedData.delta && 
                parsedData.delta.type === 'text_delta') {
              
              const text = parsedData.delta.text;
              completeResponse += text;
              process.stdout.write(text); // ストリーミングテキストを出力
            }
          } catch (e) {
            console.error(`JSONパースエラー: ${e.message}`, line);
          }
        }
      }
    }

    console.log('\n\n完全なレスポンス:');
    console.log(completeResponse);
    
    console.log('3. テスト完了！');
    return true;
  } catch (error) {
    console.error('エラー:', error);
    return false;
  }
}

// テスト実行
testClaudeStreaming().then(success => {
  if (success) {
    console.log('ストリーミングテスト成功！');
  } else {
    console.error('ストリーミングテスト失敗');
    process.exit(1);
  }
});