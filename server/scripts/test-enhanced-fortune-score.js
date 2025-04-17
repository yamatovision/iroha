/**
 * 拡張版運勢スコア計算アルゴリズムのテスト
 * 
 * 実行方法:
 * node scripts/test-enhanced-fortune-score.js
 */

// 環境変数を設定
process.env.USE_ENHANCED_FORTUNE_ALGORITHM = 'true';

// 拡張版アルゴリズムをインポート
const { 
  calculateEnhancedFortuneScore,
  getTenGodCompatibility,
  getModifiedTenGodScore,
  adjustScoreByKakukyoku,
  adjustScoreByYojin,
  getHiddenStems
} = require('../dist/server/src/services/fortune.service.enhanced');

// sajuengine_package/tenGodCalculatorからも必要な関数をインポート
const tenGodCalculator = require('../dist/sajuengine_package/src/tenGodCalculator');

// テストデータ
const testCases = [
  {
    name: '身強ユーザー（十神：食神）',
    user: {
      elementAttribute: 'wood',
      dayMaster: '甲',
      kakukyoku: {
        type: '従旺格',
        category: 'special',
        strength: 'strong'
      },
      yojin: {
        tenGod: '食神',
        element: 'fire'
      }
    },
    dayStem: '丙',  // 火の天干（甲木から見て食神）
    dayBranch: '午', // 火の地支
    expectedScore: 85, // 予想スコア
  },
  {
    name: '身弱ユーザー（十神：偏印）',
    user: {
      elementAttribute: 'fire',
      dayMaster: '丁',
      kakukyoku: {
        type: '従児格',
        category: 'special',
        strength: 'weak'
      },
      yojin: {
        tenGod: '偏印',
        element: 'metal'
      }
    },
    dayStem: '庚',  // 金の天干（丁火から見て偏印）
    dayBranch: '申', // 金の地支
    expectedScore: 75, // 予想スコア
  },
  {
    name: '用神が同じ五行のケース',
    user: {
      elementAttribute: 'water',
      dayMaster: '壬',
      kakukyoku: {
        type: '普通格',
        category: 'normal',
        strength: 'neutral'
      },
      yojin: {
        tenGod: '劫財',
        element: 'water'
      }
    },
    dayStem: '癸',  // 水の天干（壬水から見て劫財）
    dayBranch: '子', // 水の地支
    expectedScore: 90, // 予想スコア
  },
  {
    name: '地支の隠れ干の影響があるケース',
    user: {
      elementAttribute: 'earth',
      dayMaster: '戊',
      kakukyoku: {
        type: '普通格',
        category: 'normal',
        strength: 'neutral'
      },
      yojin: {
        tenGod: '正財',
        element: 'water'
      }
    },
    dayStem: '戊',  // 土の天干（戊土から見て比肩）
    dayBranch: '子', // 水の地支、子中癸（癸水は戊土から見て正財）
    expectedScore: 60, // 予想スコア
  },
  {
    name: '従来データ形式のユーザー（拡張データなし）',
    user: {
      elementAttribute: 'metal'
      // dayMaster, kakukyoku, yojinなし
    },
    dayStem: '辛',  // 金の天干
    dayBranch: '酉', // 金の地支
    expectedScore: 100, // 予想スコア（同じ五行なので高いスコア）
  }
];

// メインの実行関数
async function runTests() {
  console.log('拡張版運勢スコア計算アルゴリズムのテスト開始\n');
  
  // 各テストケースを実行
  for (const testCase of testCases) {
    console.log(`テストケース: ${testCase.name}`);
    
    // 1. 既存の五行相性スコアを計算（比較用）
    const stemElement = getStemElement(testCase.dayStem);
    const branchElement = getBranchElement(testCase.dayBranch);
    const stemCompatibility = calculateElementCompatibility(testCase.user.elementAttribute, stemElement);
    const branchCompatibility = calculateElementCompatibility(testCase.user.elementAttribute, branchElement);
    const elementCompatibilityScore = stemCompatibility * 0.6 + branchCompatibility * 0.4;
    
    // 現行アルゴリズムでのスコア
    const traditionalScore = Math.min(Math.round((elementCompatibilityScore * 20 + 50) * 2 / 3), 100);
    
    // 2. 拡張版アルゴリズムでスコア計算
    const enhancedScore = calculateEnhancedFortuneScore(
      testCase.user,
      testCase.dayStem,
      testCase.dayBranch,
      stemElement,
      branchElement,
      elementCompatibilityScore
    );
    
    // 3. 詳細計算結果の表示
    console.log(`  ユーザー五行: ${testCase.user.elementAttribute}`);
    console.log(`  天干: ${testCase.dayStem} (${stemElement}), 地支: ${testCase.dayBranch} (${branchElement})`);
    
    if (testCase.user.dayMaster) {
      const tenGod = tenGodCalculator.determineTenGodRelation(testCase.user.dayMaster, testCase.dayStem);
      console.log(`  日主: ${testCase.user.dayMaster}`);
      console.log(`  十神関係: ${tenGod}`);
      console.log(`  十神スコア: ${getTenGodCompatibility(testCase.user.dayMaster, testCase.dayStem).toFixed(2)}/5.0`);
      
      // 地支の隠れ干
      const hiddenStems = getHiddenStems(testCase.dayBranch);
      if (hiddenStems.length > 0) {
        console.log(`  地支の隠れ干: ${hiddenStems.join(', ')}`);
        
        for (const hiddenStem of hiddenStems) {
          const hiddenTenGod = determineTenGodRelation(testCase.user.dayMaster, hiddenStem);
          console.log(`    - ${hiddenStem}: ${hiddenTenGod} (スコア: ${getTenGodCompatibility(testCase.user.dayMaster, hiddenStem).toFixed(2)}/5.0)`);
        }
      }
      
      if (testCase.user.kakukyoku) {
        console.log(`  格局: ${testCase.user.kakukyoku.type} (${testCase.user.kakukyoku.strength})`);
      }
      
      if (testCase.user.yojin) {
        console.log(`  用神: ${testCase.user.yojin.tenGod} (${testCase.user.yojin.element})`);
      }
    }
    
    console.log(`  五行相性スコア: ${elementCompatibilityScore.toFixed(2)}/5.0`);
    console.log(`  現行アルゴリズムスコア: ${traditionalScore}/100`);
    console.log(`  拡張版アルゴリズムスコア: ${enhancedScore}/100`);
    console.log(`  予想スコア: ${testCase.expectedScore}/100`);
    console.log(`  結果: ${Math.abs(enhancedScore - testCase.expectedScore) <= 10 ? '✅ 合格' : '❌ 不合格'}`);
    console.log();
  }
  
  console.log('拡張版運勢スコア計算アルゴリズムのテスト完了');
}

// 以下、計算に必要な補助関数
// 実際のプロダクションコードでは、これらの関数は別のモジュールからインポートすることになります

// 天干の五行属性を取得
function getStemElement(heavenlyStem) {
  const stemElements = {
    '甲': 'wood', '乙': 'wood',
    '丙': 'fire', '丁': 'fire',
    '戊': 'earth', '己': 'earth',
    '庚': 'metal', '辛': 'metal',
    '壬': 'water', '癸': 'water'
  };
  return stemElements[heavenlyStem] || 'earth';
}

// 地支の五行属性を取得
function getBranchElement(earthlyBranch) {
  const branchElements = {
    '子': 'water', '丑': 'earth',
    '寅': 'wood', '卯': 'wood',
    '辰': 'earth', '巳': 'fire',
    '午': 'fire', '未': 'earth',
    '申': 'metal', '酉': 'metal',
    '戌': 'earth', '亥': 'water'
  };
  return branchElements[earthlyBranch] || 'earth';
}

// 五行属性間の相性を計算
function calculateElementCompatibility(element1, element2) {
  if (element1 === element2) {
    // 同じ属性同士は相性が良い
    return 5;
  }

  // 相生関係（生じさせる関係）
  const generatingRelations = [
    ['water', 'wood'],  // 水は木を育てる
    ['wood', 'fire'],   // 木は火を燃やす
    ['fire', 'earth'],  // 火は土を作る
    ['earth', 'metal'], // 土は金を生み出す
    ['metal', 'water']  // 金は水を浄化する
  ];

  // 相克関係（抑制する関係）
  const restrictingRelations = [
    ['wood', 'earth'],  // 木は土から養分を奪う
    ['earth', 'water'], // 土は水を堰き止める
    ['water', 'fire'],  // 水は火を消す
    ['fire', 'metal'],  // 火は金を溶かす
    ['metal', 'wood']   // 金は木を切る
  ];

  // 相生関係チェック
  for (const [gen, rec] of generatingRelations) {
    if ((element1 === gen && element2 === rec) || (element2 === gen && element1 === rec)) {
      return 4; // 相生関係は良い相性
    }
  }

  // 相克関係チェック
  for (const [res, sub] of restrictingRelations) {
    if (element1 === res && element2 === sub) {
      return 2; // element1がelement2を抑制する場合は中程度の相性
    }
    if (element2 === res && element1 === sub) {
      return 1; // element2がelement1を抑制する場合は低い相性
    }
  }

  // その他の関係（間接的な関係）
  return 3; // 中立的な相性
}

// 天干間の十神関係を判定
function determineTenGodRelation(dayStem, targetStem) {
  // 天干の五行属性
  const stemElements = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
  };
  
  // 五行相生関係（生む）
  const elementGenerates = {
    '木': '火',
    '火': '土',
    '土': '金',
    '金': '水',
    '水': '木'
  };
  
  // 五行相剋関係（克す）
  const elementControls = {
    '木': '土',
    '土': '水',
    '水': '火',
    '火': '金',
    '金': '木'
  };

  // 日主と対象の陰陽
  const dayYin = ['乙', '丁', '己', '辛', '癸'].includes(dayStem);
  const targetYin = ['乙', '丁', '己', '辛', '癸'].includes(targetStem);
  const sameSex = dayYin === targetYin;
  
  // 日主と対象の五行
  const dayElement = stemElements[dayStem];
  const targetElement = stemElements[targetStem];
  
  // 1. 同じ五行の場合
  if (dayElement === targetElement) {
    return sameSex ? '比肩' : '劫財';
  }
  
  // 2. 対象が日主を生む関係
  if (elementGenerates[targetElement] === dayElement) {
    return sameSex ? '偏印' : '正印';
  }
  
  // 3. 対象が日主を克する関係
  if (elementControls[targetElement] === dayElement) {
    return sameSex ? '偏官' : '正官';
  }
  
  // 4. 日主が対象を生む関係
  if (elementGenerates[dayElement] === targetElement) {
    return sameSex ? '食神' : '傷官';
  }
  
  // 5. 日主が対象を克する関係
  if (elementControls[dayElement] === targetElement) {
    return sameSex ? '偏財' : '正財';
  }
  
  return '不明';
}

// 実行
runTests();