/**
 * リファクタリング後のAIサービスをテストするスクリプト
 * 
 * 以下のサービスをテストします：
 * 1. harmonyCompassService - 調和のコンパス生成
 * 2. luckyItemsService - ラッキーアイテム生成
 * 3. memberCardService - チームメンバーカルテ生成
 * 
 * 実行方法：
 * node scripts/test-refactored-services.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Types } = mongoose;

// サービスをインポート (コンパイル済みのJSファイルを使用)
const { harmonyCompassService } = require('../dist/services/harmony-compass.service');
const { luckyItemsService } = require('../dist/services/lucky-items.service');
const { memberCardService } = require('../dist/services/member-card.service');

// MongoDB接続
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MongoDB URI が設定されていません。.envファイルを確認してください。');
    }
    
    await mongoose.connect(mongoURI);
    console.log('MongoDB に接続しました。');
  } catch (error) {
    console.error('MongoDB 接続エラー:', error);
    process.exit(1);
  }
};

// テスト用のダミーユーザーデータ
const createDummyUser = () => {
  return {
    _id: new Types.ObjectId(),
    displayName: 'テストユーザー',
    elementAttribute: 'water',
    dayMaster: '丙',
    fourPillars: {
      year: { heavenlyStem: '庚', earthlyBranch: '子' },
      month: { heavenlyStem: '辛', earthlyBranch: '丑' },
      day: { heavenlyStem: '壬', earthlyBranch: '寅' },
      hour: { heavenlyStem: '癸', earthlyBranch: '卯' }
    },
    kakukyoku: {
      type: '従旺格',
      category: 'normal',
      strength: 'strong',
      description: '日主が強く、月令の気が助ける格局'
    },
    yojin: {
      tenGod: '傷官',
      element: 'metal',
      description: '創造性を高める用神',
      kijin: {
        tenGod: '印綬',
        element: 'water',
        description: '知恵をもたらす喜神'
      },
      kijin2: {
        tenGod: '食神',
        element: 'fire',
        description: '注意すべき忌神'
      },
      kyujin: {
        tenGod: '劫財',
        element: 'wood',
        description: '避けるべき仇神'
      }
    },
    elementProfile: {
      wood: 20,
      fire: 10,
      earth: 25,
      metal: 15,
      water: 30
    }
  };
};

// テスト用のダミーチーム情報
const createDummyTeam = () => {
  return {
    name: 'テストチーム',
    size: 5
  };
};

// テスト用運勢情報
const createDummyFortuneDetails = () => {
  return {
    score: 78,
    fortuneType: 'good',
    balanceStatus: {
      wood: 'balanced',
      fire: 'deficient',
      earth: 'balanced',
      metal: 'deficient',
      water: 'excessive'
    },
    yojinRelation: '正財生身',
    dayIsGeneratingYojin: true,
    dayIsControllingYojin: false
  };
};

// 調和のコンパスをテスト
const testHarmonyCompass = async (user) => {
  console.log('\n🔮 調和のコンパスサービスのテスト開始...');
  try {
    const result = await harmonyCompassService.generateHarmonyCompass(user);
    
    // 結果をチェック
    if (result && result.content && result.content.length > 100) {
      console.log('✅ 調和のコンパス生成成功:');
      console.log('- コンテンツ長: ' + result.content.length + ' 文字');
      console.log('- プレビュー: ' + result.content.substring(0, 100) + '...');
      
      // セクションがある場合は確認
      if (result.sections) {
        console.log('- セクション: ' + Object.keys(result.sections).join(', '));
        const nonEmptySections = Object.values(result.sections).filter(s => s && s.length > 0).length;
        console.log('- 中身のあるセクション数: ' + nonEmptySections);
      }
      return true;
    } else {
      console.log('❌ 調和のコンパス生成結果が不正: ', result);
      return false;
    }
  } catch (error) {
    console.error('❌ 調和のコンパス生成エラー:', error);
    return false;
  }
};

// ラッキーアイテムをテスト
const testLuckyItems = async (user) => {
  console.log('\n🎯 ラッキーアイテムサービスのテスト開始...');
  try {
    const userData = {
      user,
      fortuneDetails: createDummyFortuneDetails()
    };
    
    const result = await luckyItemsService.generateLuckyItems(
      userData,
      '庚', // 天干
      '子'  // 地支
    );
    
    // 結果をチェック
    if (result && result.color && result.item && result.drink) {
      console.log('✅ ラッキーアイテム生成成功:');
      console.log('- ラッキーファッション: ' + result.color);
      console.log('- ラッキーフード: ' + result.item);
      console.log('- ラッキードリンク: ' + result.drink);
      return true;
    } else {
      console.log('❌ ラッキーアイテム生成結果が不正: ', result);
      return false;
    }
  } catch (error) {
    console.error('❌ ラッキーアイテム生成エラー:', error);
    return false;
  }
};

// チームメンバーカルテをテスト
const testMemberCard = async (user, team) => {
  console.log('\n🧩 チームメンバーカルテサービスのテスト開始...');
  try {
    const result = await memberCardService.generateMemberCard(user, team);
    
    // 結果をチェック
    if (result && result.length > 100) {
      console.log('✅ チームメンバーカルテ生成成功:');
      console.log('- コンテンツ長: ' + result.length + ' 文字');
      console.log('- プレビュー: ' + result.substring(0, 100) + '...');
      return true;
    } else {
      console.log('❌ チームメンバーカルテ生成結果が不正: ', result);
      return false;
    }
  } catch (error) {
    console.error('❌ チームメンバーカルテ生成エラー:', error);
    return false;
  }
};

// メインテスト実行関数
const runTests = async () => {
  try {
    await connectDB();
    
    // テストデータ準備
    const dummyUser = createDummyUser();
    const dummyTeam = createDummyTeam();
    
    // テスト実行
    console.log('😀 リファクタリングされたAIサービスのテスト開始');
    
    // 1. 調和のコンパスのテスト
    const harmonyCompassSuccess = await testHarmonyCompass(dummyUser);
    
    // 2. ラッキーアイテムのテスト
    const luckyItemsSuccess = await testLuckyItems(dummyUser);
    
    // 3. チームメンバーカルテのテスト
    const memberCardSuccess = await testMemberCard(dummyUser, dummyTeam);
    
    // 結果サマリー
    console.log('\n📊 テスト結果サマリー');
    console.log(`- 調和のコンパス: ${harmonyCompassSuccess ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`- ラッキーアイテム: ${luckyItemsSuccess ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`- チームメンバーカルテ: ${memberCardSuccess ? '✅ 成功' : '❌ 失敗'}`);
    
    const overallSuccess = harmonyCompassSuccess && luckyItemsSuccess && memberCardSuccess;
    console.log(`\n総合結果: ${overallSuccess ? '✅ すべてのテストが成功しました！' : '❌ 一部のテストが失敗しました'}`);
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  } finally {
    // データベース接続を閉じる
    await mongoose.connection.close();
    console.log('MongoDB 接続を閉じました。');
  }
};

// テスト実行
runTests().then(() => {
  console.log('テスト完了');
  process.exit(0);
}).catch(err => {
  console.error('テスト実行エラー:', err);
  process.exit(1);
});