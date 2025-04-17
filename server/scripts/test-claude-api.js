/**
 * Claude API 接続テストスクリプト
 * 
 * 使用方法:
 * node scripts/test-claude-api.js
 * 
 * このスクリプトは単独で実行され、Claude API への接続をテストします。
 * 成功すると、APIからのレスポンステキストを表示します。
 * 失敗すると、エラーメッセージを表示します。
 */

// dotenvを使用して環境変数を読み込む
require('dotenv').config();

// Anthropic SDKをインポート
const { Anthropic } = require('@anthropic-ai/sdk');

async function testClaudeAPI() {
  console.log('Claude API 接続テストを開始します...');
  
  try {
    // APIキーを環境変数から取得
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('環境変数 ANTHROPIC_API_KEY が設定されていません');
    }
    
    // Anthropicクライアントのインスタンスを作成
    const anthropic = new Anthropic({
      apiKey: apiKey
    });
    
    console.log('Anthropicクライアントを初期化しました');
    
    // テスト用のシンプルなプロンプト
    const prompt = '今日の日本の天気を一言で教えてください。';
    
    console.log('APIリクエストを送信中...');
    
    // Claude 3.7 Sonnetモデルを使用
    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    // レスポンス内容の表示
    console.log('\n===== API接続成功 =====');
    console.log('レスポンスID:', message.id);
    console.log('使用モデル:', message.model);
    console.log('トークン使用量:');
    console.log('  入力:', message.usage.input_tokens);
    console.log('  出力:', message.usage.output_tokens);
    console.log('\nレスポンス内容:');
    console.log(message.content[0].text);
    console.log('========================\n');
    
    return true;
    
  } catch (error) {
    console.error('\n===== APIエラー =====');
    console.error('エラー種別:', error.name);
    console.error('エラーメッセージ:', error.message);
    
    // より詳細なエラー情報が存在する場合は表示
    if (error.response) {
      console.error('ステータスコード:', error.response.status);
      console.error('レスポンスデータ:', error.response.data);
    }
    
    console.error('======================\n');
    return false;
  }
}

// スクリプトが直接実行された場合のみテストを実行
if (require.main === module) {
  testClaudeAPI()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('予期しないエラーが発生しました:', error);
      process.exit(1);
    });
}

module.exports = { testClaudeAPI };