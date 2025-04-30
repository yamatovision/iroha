/**
 * OpenAI API連携テスト
 * 
 * 環境変数からOpenAI APIキーを取得して、基本的なAPIリクエストをテストします。
 * 実行方法: node test-openai-api.js
 */

require('dotenv').config({ path: '../.env' });
const fetch = require('node-fetch');

// OpenAIのAPIキーを環境変数から取得
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const OPENAI_TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE || '0.6');

// APIキーチェック
if (!OPENAI_API_KEY) {
  console.error('❌ OpenAI APIキーが設定されていません。.envファイルにOPENAI_API_KEYを設定してください。');
  process.exit(1);
}

console.log('=== OpenAI API連携テスト開始 ===');
console.log(`📋 設定情報:`);
console.log(`🔑 API Key: ${OPENAI_API_KEY.substring(0, 10)}...（マスク済み）`);
console.log(`🤖 モデル: ${OPENAI_MODEL}`);
console.log(`🌡️ 温度: ${OPENAI_TEMPERATURE}`);

/**
 * OpenAI APIにリクエストを送信
 */
async function callOpenAI(messages) {
  try {
    console.log('📤 OpenAI APIにリクエスト送信中...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: messages,
        temperature: OPENAI_TEMPERATURE,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`APIエラー (${response.status}): ${errorData}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ API呼び出しエラー:', error);
    throw error;
  }
}

/**
 * シンプルなテストケース
 */
async function runSimpleTest() {
  console.log('\n🧪 シンプルなテストケース実行中...');
  
  const messages = [
    { role: 'system', content: 'あなたは四柱推命の専門家です。簡潔に回答してください。' },
    { role: 'user', content: '今日はいい日ですか？' }
  ];
  
  try {
    const startTime = Date.now();
    const result = await callOpenAI(messages);
    const duration = Date.now() - startTime;
    
    console.log(`✅ テスト成功! (所要時間: ${duration}ms)`);
    console.log(`📝 応答内容:`);
    console.log(result.choices[0].message.content);
    
    return result;
  } catch (error) {
    console.error('❌ シンプルテスト失敗:', error);
    return null;
  }
}

/**
 * 四柱推命に関連するテストケース
 */
async function runFortuneTest() {
  console.log('\n🧪 四柱推命関連テストケース実行中...');
  
  const messages = [
    { role: 'system', content: '四柱推命の専門家として、命式に基づいた的確な解釈と実践的なアドバイスを提供してください。' },
    { 
      role: 'user', 
      content: `
【ユーザー情報】
命式: 甲子年 丙午月 庚午日 壬子時
格局: 従旺格
用神: 偏財（水）
五行バランス: 木20% 火40% 土10% 金10% 水20%

今日の日柱は辛巳です。今日の運勢と適切な過ごし方を教えてください。
`
    }
  ];
  
  try {
    const startTime = Date.now();
    const result = await callOpenAI(messages);
    const duration = Date.now() - startTime;
    
    console.log(`✅ テスト成功! (所要時間: ${duration}ms)`);
    console.log(`📝 応答内容:`);
    console.log(result.choices[0].message.content);
    
    return result;
  } catch (error) {
    console.error('❌ 四柱推命テスト失敗:', error);
    return null;
  }
}

/**
 * ラッキーアイテム生成テスト
 */
async function runLuckyItemsTest() {
  console.log('\n🧪 ラッキーアイテム生成テスト実行中...');
  
  const messages = [
    { 
      role: 'system', 
      content: `
あなたは四柱推命の専門家として、ユーザーの四柱命式、格局、用神、および五行バランスを総合的に考慮した今日のラッキーアイテムを提案します。
必ず以下の3行のフォーマットで回答してください。各行は必ず「ラッキーファッション: 」「ラッキーフード: 」「ラッキードリンク: 」から始めてください。
`
    },
    { 
      role: 'user', 
      content: `
【ユーザー情報】
性別: 男性

【命式情報】
年柱: 壬寅
月柱: 壬辰
日柱: 甲子
時柱: 丙午

格局: 偏印格（弱）
用神: 傷官（火）
忌神: 印綬（水）

【五行バランス】
木: 20%
火: 15%
土: 15%
金: 20%
水: 30%

【今日の情報】
今日の日柱: 辛巳

今日のあなたのラッキーアイテムを提案します。
`
    }
  ];
  
  try {
    const startTime = Date.now();
    const result = await callOpenAI(messages);
    const duration = Date.now() - startTime;
    
    console.log(`✅ テスト成功! (所要時間: ${duration}ms)`);
    console.log(`📝 応答内容:`);
    console.log(result.choices[0].message.content);
    
    // レスポンスが正しいフォーマットかチェック
    const response = result.choices[0].message.content;
    const hasCorrectFormat = 
      response.includes('ラッキーファッション:') && 
      response.includes('ラッキーフード:') && 
      response.includes('ラッキードリンク:');
    
    if (hasCorrectFormat) {
      console.log('✅ 正しいフォーマットでの応答を確認');
    } else {
      console.warn('⚠️ 応答フォーマットが期待通りではありません');
    }
    
    return result;
  } catch (error) {
    console.error('❌ ラッキーアイテムテスト失敗:', error);
    return null;
  }
}

/**
 * メインテスト実行関数
 */
async function runAllTests() {
  console.log('\n🚀 すべてのテストを実行します...');
  
  let success = true;
  
  try {
    // シンプルテスト
    const simpleResult = await runSimpleTest();
    if (!simpleResult) success = false;
    
    // 四柱推命テスト
    const fortuneResult = await runFortuneTest();
    if (!fortuneResult) success = false;
    
    // ラッキーアイテムテスト
    const luckyItemsResult = await runLuckyItemsTest();
    if (!luckyItemsResult) success = false;
    
    console.log('\n=== テスト結果サマリー ===');
    if (success) {
      console.log('✅ すべてのテストが成功しました！');
      console.log('🎉 OpenAI APIとの連携は正常に動作しています');
    } else {
      console.log('⚠️ 一部のテストが失敗しました');
      console.log('🔍 エラーメッセージを確認し、問題を解決してください');
    }
  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error);
  }
}

// テストを実行
runAllTests().catch(console.error);