/**
 * AIアダプターテスト
 * 
 * AIプロバイダーアダプターを使用して、実際のサービス層の動作をテストします。
 * 実行方法: node test-ai-adapter.js
 */

// 環境変数の読み込み
require('dotenv').config({ path: '../../.env' });

// モジュールのインポート
const path = require('path');
const mongoose = require('mongoose');

// パスを修正して正しくインポートできるようにする
require('module-alias/register');
process.env.BASE_PATH = path.resolve(__dirname, '..');

// AIアダプターのインポート
const { generateChatResponse, generateHarmonyCompass, generateLuckyItems } = require('../dist/services/ai-provider-adapter');

// テスト用のダミーユーザーデータ
const dummyUser = {
  displayName: 'テストユーザー',
  elementAttribute: '水',
  dayMaster: '甲',
  gender: 'M',
  fourPillars: {
    year: { heavenlyStem: '壬', earthlyBranch: '寅' },
    month: { heavenlyStem: '壬', earthlyBranch: '辰' },
    day: { heavenlyStem: '甲', earthlyBranch: '子' },
    hour: { heavenlyStem: '丙', earthlyBranch: '午' }
  },
  kakukyoku: {
    type: '偏印格',
    strength: '弱',
    category: '身弱'
  },
  yojin: {
    element: '火',
    tenGod: '傷官',
    kijin: { tenGod: '劫財', element: '木' },
    kijin2: { tenGod: '印綬', element: '水' },
    kyujin: { tenGod: '食神', element: '土' }
  },
  elementProfile: {
    wood: 20,
    fire: 15,
    earth: 15,
    metal: 20,
    water: 30
  }
};

// テスト用のコンテキスト情報
const testContext = {
  user: dummyUser,
  dailyFortune: {
    date: new Date().toISOString().split('T')[0],
    score: 65,
    luckyItems: {
      color: '赤色',
      item: 'りんご',
      drink: '緑茶'
    }
  },
  dayPillar: {
    heavenlyStem: '辛',
    earthlyBranch: '巳'
  },
  fortuneScore: 65
};

// テスト用のチャットメッセージ
const testMessages = [
  { role: 'user', content: 'こんにちは、今日の運勢について教えてください' },
];

/**
 * チャットレスポンス生成テスト
 */
async function testChatResponse() {
  console.log('\n🧪 チャットレスポンス生成テスト実行中...');
  
  try {
    const startTime = Date.now();
    const response = await generateChatResponse(testMessages, testContext);
    const duration = Date.now() - startTime;
    
    console.log(`✅ テスト成功! (所要時間: ${duration}ms)`);
    console.log(`📝 応答内容 (抜粋):`);
    console.log(response.substring(0, 200) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ チャットレスポンステスト失敗:', error);
    return false;
  }
}

/**
 * 調和のコンパス生成テスト
 */
async function testHarmonyCompass() {
  console.log('\n🧪 調和のコンパス生成テスト実行中...');
  
  try {
    const startTime = Date.now();
    const response = await generateHarmonyCompass({ user: dummyUser });
    const duration = Date.now() - startTime;
    
    console.log(`✅ テスト成功! (所要時間: ${duration}ms)`);
    console.log(`📝 応答内容 (抜粋):`);
    console.log(response.content.substring(0, 200) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ 調和のコンパス生成テスト失敗:', error);
    return false;
  }
}

/**
 * ラッキーアイテム生成テスト
 */
async function testLuckyItems() {
  console.log('\n🧪 ラッキーアイテム生成テスト実行中...');
  
  try {
    const startTime = Date.now();
    const userData = {
      user: dummyUser,
      fortuneDetails: {
        score: 65,
        fortuneType: '普通',
        balanceStatus: {
          wood: 'balanced',
          fire: 'deficient',
          earth: 'balanced',
          metal: 'balanced',
          water: 'excessive'
        }
      }
    };
    
    const response = await generateLuckyItems(userData, '辛', '巳');
    const duration = Date.now() - startTime;
    
    console.log(`✅ テスト成功! (所要時間: ${duration}ms)`);
    console.log(`📝 応答内容:`);
    console.log(JSON.stringify(response, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ ラッキーアイテム生成テスト失敗:', error);
    return false;
  }
}

/**
 * 全テスト実行
 */
async function runAllTests() {
  console.log('=== AIアダプターテスト開始 ===');
  console.log(`🔧 使用中のAIプロバイダー: ${process.env.USE_OPENAI_API === 'true' ? 'OpenAI' : 'Claude'}`);
  console.log(`🤖 モデル: ${process.env.USE_OPENAI_API === 'true' ? process.env.OPENAI_MODEL : process.env.CLAUDE_API_MODEL}`);
  
  let success = true;
  
  // チャットレスポンス生成テスト
  const chatSuccess = await testChatResponse();
  if (!chatSuccess) success = false;
  
  // 調和のコンパス生成テスト
  const compassSuccess = await testHarmonyCompass();
  if (!compassSuccess) success = false;
  
  // ラッキーアイテム生成テスト
  const luckyItemsSuccess = await testLuckyItems();
  if (!luckyItemsSuccess) success = false;
  
  console.log('\n=== テスト結果サマリー ===');
  if (success) {
    console.log('✅ すべてのテストが成功しました！');
    console.log('🎉 AIアダプターは正常に動作しています');
  } else {
    console.log('⚠️ 一部のテストが失敗しました');
    console.log('🔍 エラーメッセージを確認し、問題を解決してください');
  }
  
  process.exit(success ? 0 : 1);
}

// テストを実行
console.log('AIアダプターのテストを実行します...');
runAllTests().catch(error => {
  console.error('予期せぬエラーが発生しました:', error);
  process.exit(1);
});