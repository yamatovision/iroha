const mongoose = require('mongoose');
require('dotenv').config();

// モジュールの動的インポート
async function importModules() {
  try {
    // サービスをインポート
    const balancedServicePath = '../../dist/services/fortune.service.balanced';
    
    try {
      const { calculateBalancedFortuneScore } = require(balancedServicePath);
      return { calculateBalancedFortuneScore };
    } catch (importError) {
      console.log('ビルド済みモジュールの読み込みに失敗、ソースモジュールを試みます');
      const { calculateBalancedFortuneScore } = require('../../src/services/fortune.service.balanced');
      return { calculateBalancedFortuneScore };
    }
  } catch (error) {
    console.error('モジュールのインポートエラー:', error);
    process.exit(1);
  }
}

// テストユーザーデータの作成
function createTestUser(elementAttribute, elementProfile, yojin) {
  return {
    displayName: 'テストユーザー',
    elementAttribute,
    elementProfile,
    yojin,
  };
}

// テスト実行関数
async function runTests() {
  const { calculateBalancedFortuneScore } = await importModules();
  
  // テストケース: 五行が不足しているユーザーに対するテスト（高スコア期待）
  const userWithDeficientWood = createTestUser(
    'wood',
    { wood: 10, fire: 30, earth: 30, metal: 20, water: 10 },
    { element: 'wood', tenGod: '比肩' }
  );
  
  // テストケース: 五行が過剰なユーザーに対するテスト（低スコア期待）
  const userWithExcessiveFire = createTestUser(
    'fire',
    { wood: 10, fire: 50, earth: 20, metal: 10, water: 10 },
    { element: 'fire', tenGod: '比肩' }
  );
  
  // テストケース: 用神との相性テスト（高スコア期待）
  const userWithYojinMatch = createTestUser(
    'water',
    { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 },
    { element: 'wood', tenGod: '食神' }
  );
  
  // テストケース: 忌神との相性テスト（低スコア期待）
  const userWithKijin2Match = createTestUser(
    'metal',
    { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 },
    { 
      element: 'earth', 
      tenGod: '偏印',
      kijin2: { element: 'fire', tenGod: '偏官' }
    }
  );
  
  // テスト天干・地支の組み合わせ
  const testCases = [
    { heavenlyStem: '甲', earthlyBranch: '子', stemElement: 'wood', branchElement: 'water' },
    { heavenlyStem: '丙', earthlyBranch: '午', stemElement: 'fire', branchElement: 'fire' },
    { heavenlyStem: '庚', earthlyBranch: '申', stemElement: 'metal', branchElement: 'metal' },
    { heavenlyStem: '壬', earthlyBranch: '寅', stemElement: 'water', branchElement: 'wood' },
  ];
  
  console.log('五行バランス・用神ベース運勢スコア計算テスト開始\n');
  
  // 全テストケース実行
  for (const tc of testCases) {
    console.log(`===== 天干: ${tc.heavenlyStem}(${tc.stemElement}), 地支: ${tc.earthlyBranch}(${tc.branchElement}) =====`);
    
    // ベーススコア（従来の五行相性計算）
    const baseScore = 3.0;
    
    // 不足五行を持つユーザーテスト
    const deficientScore = calculateBalancedFortuneScore(
      userWithDeficientWood, 
      tc.heavenlyStem, 
      tc.earthlyBranch,
      tc.stemElement,
      tc.branchElement,
      baseScore
    );
    console.log(`不足五行（木）を持つユーザー, 五行: ${userWithDeficientWood.elementAttribute} => スコア: ${deficientScore}`);
    
    // 過剰五行を持つユーザーテスト
    const excessiveScore = calculateBalancedFortuneScore(
      userWithExcessiveFire, 
      tc.heavenlyStem, 
      tc.earthlyBranch,
      tc.stemElement,
      tc.branchElement,
      baseScore
    );
    console.log(`過剰五行（火）を持つユーザー, 五行: ${userWithExcessiveFire.elementAttribute} => スコア: ${excessiveScore}`);
    
    // 用神との相性テスト
    const yojinScore = calculateBalancedFortuneScore(
      userWithYojinMatch, 
      tc.heavenlyStem, 
      tc.earthlyBranch,
      tc.stemElement,
      tc.branchElement,
      baseScore
    );
    console.log(`用神（木）を持つユーザー, 五行: ${userWithYojinMatch.elementAttribute} => スコア: ${yojinScore}`);
    
    // 忌神との相性テスト
    const kijin2Score = calculateBalancedFortuneScore(
      userWithKijin2Match, 
      tc.heavenlyStem, 
      tc.earthlyBranch,
      tc.stemElement,
      tc.branchElement,
      baseScore
    );
    console.log(`忌神（火）を持つユーザー, 五行: ${userWithKijin2Match.elementAttribute} => スコア: ${kijin2Score}`);
    
    console.log('\n');
  }
  
  console.log('テスト完了');
  process.exit(0);
}

// メイン実行
runTests().catch(err => {
  console.error('テスト実行エラー:', err);
  process.exit(1);
});