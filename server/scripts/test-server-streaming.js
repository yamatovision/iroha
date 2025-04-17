/**
 * サーバーアプリケーションのストリーミングサービスをテストするスクリプト
 */

// 環境変数の読み込み
require('dotenv').config({ path: '../.env' });

// サーバーサイドのストリーミングサービスをインポート
const { streamClaudeAPI } = require('../src/services/claude-ai');

// テスト関数
async function testServerStreaming() {
  console.log('サーバーのClaudeストリーミング機能をテストしています...');
  
  try {
    // テストプロンプト
    const prompt = '四柱推命に基づいて、明日の運勢を教えてください。特に仕事運と恋愛運について100文字程度ずつ説明してください。';
    const systemPrompt = `
あなたは四柱推命の専門家です。ユーザーの質問に対して、四柱推命の観点から運勢やアドバイスを提供してください。
回答は簡潔かつ具体的にし、余計な説明は避けてください。
`;
    const maxTokens = 2000;
    
    console.log('プロンプト:', prompt);
    console.log('システムプロンプト:', systemPrompt);
    console.log('\n--- ストリーミング開始 ---');
    
    // ストリーミングジェネレータを呼び出し
    let completeResponse = '';
    const streamGenerator = await streamClaudeAPI(prompt, systemPrompt, maxTokens);
    
    // ストリーミングチャンクを処理
    for await (const chunk of streamGenerator) {
      process.stdout.write(chunk);
      completeResponse += chunk;
    }
    
    console.log('\n\n--- ストリーミング完了 ---');
    console.log('\n完全なレスポンス:');
    console.log(completeResponse);
    
    return true;
  } catch (error) {
    console.error('ストリーミングエラー:', error);
    return false;
  }
}

// テスト実行
testServerStreaming().then(success => {
  if (success) {
    console.log('\nサーバーストリーミングテスト成功！');
  } else {
    console.error('\nサーバーストリーミングテスト失敗');
    process.exit(1);
  }
});