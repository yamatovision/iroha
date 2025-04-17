/**
 * Claude API クライアントのテストスクリプト
 * 
 * このスクリプトは claude-api-client.ts のテストを行います。
 * データベース接続は不要で、環境変数だけあれば実行できます。
 * 
 * 実行方法：
 * node scripts/test-claude-api-client.js
 */

require('dotenv').config();

// claude-api-client は TypeScriptなので、ts-node を使うか、
// コンパイル済みのJSファイルを使う必要があります
// ここでは簡易的に実装
const { claudeApiClient } = require('../dist/services/claude-api-client');

// テストプロンプト
const TEST_PROMPT = `
以下の質問に簡潔に回答してください。
1. あなたの名前は？
2. 今日の日付は？
3. 四柱推命とは何ですか？
`;

// テストシステムプロンプト
const TEST_SYSTEM_PROMPT = `
あなたは四柱推命の専門家です。簡潔かつ専門的に回答してください。
今日の日付は2025年4月13日と想定してください。
`;

// 標準呼び出しをテスト
const testStandardCall = async () => {
  console.log('\n🧪 標準呼び出しテスト開始');
  try {
    const response = await claudeApiClient.simpleCall(
      TEST_PROMPT,
      TEST_SYSTEM_PROMPT,
      1000
    );
    
    console.log('✅ 標準呼び出し成功:');
    console.log(response);
    return true;
  } catch (error) {
    console.error('❌ 標準呼び出しエラー:', error);
    return false;
  }
};

// ストリーミング呼び出しをテスト
const testStreamingCall = async () => {
  console.log('\n🧪 ストリーミング呼び出しテスト開始');
  try {
    console.log('ストリーミングレスポンス:');
    let completeResponse = '';
    
    // ストリーミングジェネレータを作成
    const streamGenerator = claudeApiClient.simpleStream(
      TEST_PROMPT,
      TEST_SYSTEM_PROMPT,
      1000
    );
    
    // 各チャンクを処理
    for await (const chunk of streamGenerator) {
      process.stdout.write(chunk); // リアルタイム出力
      completeResponse += chunk;
    }
    
    console.log('\n\n✅ ストリーミング呼び出し成功 - 合計長: ' + completeResponse.length + ' 文字');
    return true;
  } catch (error) {
    console.error('❌ ストリーミング呼び出しエラー:', error);
    return false;
  }
};

// メインテスト実行関数
const runTests = async () => {
  try {
    console.log('🚀 Claude API クライアントテスト開始');
    
    // テスト環境チェック
    if (!process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_API_KEY) {
      console.error('❌ API キーが設定されていません。.env ファイルに ANTHROPIC_API_KEY または CLAUDE_API_KEY を設定してください。');
      return false;
    }
    
    // テスト実行
    const standardCallSuccess = await testStandardCall();
    const streamingCallSuccess = await testStreamingCall();
    
    // テスト結果サマリー
    console.log('\n📊 テスト結果サマリー');
    console.log(`- 標準呼び出し: ${standardCallSuccess ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`- ストリーミング呼び出し: ${streamingCallSuccess ? '✅ 成功' : '❌ 失敗'}`);
    
    const overallSuccess = standardCallSuccess && streamingCallSuccess;
    console.log(`\n総合結果: ${overallSuccess ? '✅ すべてのテストが成功しました！' : '❌ 一部のテストが失敗しました'}`);
    
    return overallSuccess;
  } catch (error) {
    console.error('テスト実行中に予期しないエラーが発生しました:', error);
    return false;
  }
};

// テスト実行
runTests().then(success => {
  console.log('テスト完了');
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('テスト実行エラー:', err);
  process.exit(1);
});