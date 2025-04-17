/**
 * 五行バランス・用神ベースの運勢スコア計算アルゴリズム
 * スタンドアロンテスト版
 */

// 五行バランス状態を分析
function analyzeElementBalance(elementProfile) {
  // 五行の合計値
  const total = elementProfile.wood + elementProfile.fire + elementProfile.earth + 
                elementProfile.metal + elementProfile.water;
  
  // 各五行の状態を判定
  // 15%未満: 不足、15%~25%: 均衡、25%超: 過剰
  return {
    wood: getBalanceStatus(elementProfile.wood, total),
    fire: getBalanceStatus(elementProfile.fire, total),
    earth: getBalanceStatus(elementProfile.earth, total),
    metal: getBalanceStatus(elementProfile.metal, total),
    water: getBalanceStatus(elementProfile.water, total)
  };
}

// 五行の割合から状態を判定
function getBalanceStatus(value, total) {
  const percentage = (value / total) * 100;
  if (percentage < 15) {
    return 'deficient';
  } else if (percentage > 25) {
    return 'excessive';
  } else {
    return 'balanced';
  }
}

// 五行バランスに基づくスコアを計算
function calculateElementBalanceScore(elementProfile, dayElement) {
  if (!elementProfile) {
    return 3.0; // データがない場合はデフォルト値
  }
  
  // 五行バランスの分析
  const balanceStatus = analyzeElementBalance(elementProfile);
  
  // 不足している五行が補われる場合（高評価）
  if (balanceStatus[dayElement] === 'deficient') {
    return 5.0;
  }
  
  // 過剰な五行がさらに強化される場合（低評価）
  if (balanceStatus[dayElement] === 'excessive') {
    return 1.5;
  }
  
  // バランスの取れた五行の場合
  return 4.0;
}

// 用神情報に基づくスコアを計算
function calculateYojinScore(user, dayElement) {
  if (!user.yojin) {
    return 3.0; // 用神情報がない場合
  }
  
  // 用神との関係
  if (user.yojin.element === dayElement) {
    return 5.0; // 用神と一致（最高評価）
  }
  
  // 喜神との関係
  if (user.yojin.kijin && user.yojin.kijin.element === dayElement) {
    return 4.5; // 喜神と一致（高評価）
  }
  
  // 忌神との関係
  if (user.yojin.kijin2 && user.yojin.kijin2.element === dayElement) {
    return 2.0; // 忌神と一致（低評価）
  }
  
  // 仇神との関係
  if (user.yojin.kyujin && user.yojin.kyujin.element === dayElement) {
    return 1.0; // 仇神と一致（最低評価）
  }
  
  // 相生・相剋関係の確認
  const isGenerating = isGeneratingRelation(dayElement, user.yojin.element);
  const isControlling = isControllingRelation(dayElement, user.yojin.element);
  
  if (isGenerating) {
    return 4.0; // 日柱が用神を生み出す関係
  } else if (isControlling) {
    return 2.5; // 日柱が用神を抑制する関係
  }
  
  return 3.0; // その他の関係
}

// 相生関係（生み出す関係）をチェック
function isGeneratingRelation(from, to) {
  const generatingPairs = [
    ['water', 'wood'], 
    ['wood', 'fire'], 
    ['fire', 'earth'], 
    ['earth', 'metal'], 
    ['metal', 'water']
  ];
  
  return generatingPairs.some(([f, t]) => f === from && t === to);
}

// 相剋関係（抑制する関係）をチェック
function isControllingRelation(from, to) {
  const controllingPairs = [
    ['wood', 'earth'], 
    ['earth', 'water'], 
    ['water', 'fire'], 
    ['fire', 'metal'], 
    ['metal', 'wood']
  ];
  
  return controllingPairs.some(([f, t]) => f === from && t === to);
}

// 五行バランス・用神ベースの運勢スコアを計算
function calculateBalancedFortuneScore(user, heavenlyStem, earthlyBranch, stemElement, branchElement, elementCompatibilityScore) {
  try {
    // 五行バランスベースのスコア計算
    let balanceScore = 3.0; // デフォルト値
    if (user.elementProfile) {
      balanceScore = calculateElementBalanceScore(
        user.elementProfile,
        stemElement // 天干の五行を優先
      );
    }
    
    // 用神ベースのスコア計算
    let yojinScore = 3.0; // デフォルト値
    if (user.yojin) {
      yojinScore = calculateYojinScore(user, stemElement);
    }
    
    // 複合スコア計算（重み付け）
    // 五行バランス: 40%
    // 用神関係: 40%
    // 従来の五行相性: 20%
    const combinedScore = (
      balanceScore * 0.4 +
      yojinScore * 0.4 +
      elementCompatibilityScore * 0.2
    );
    
    // 0-100スケールに変換
    const rawScore = Math.round(combinedScore * 20);
    return Math.max(0, Math.min(rawScore, 100));
  } catch (error) {
    console.error('五行バランス・用神ベースの運勢スコア計算エラー:', error);
    // エラーの場合は従来のスコアを返す
    const preliminaryScore = Math.round(elementCompatibilityScore * 20 + 50);
    return Math.min(Math.round(preliminaryScore * 2 / 3), 100);
  }
}

// 天干から五行を取得する関数
function getStemElement(heavenlyStem) {
  const stemMap = {
    '甲': 'wood', '乙': 'wood',
    '丙': 'fire', '丁': 'fire',
    '戊': 'earth', '己': 'earth',
    '庚': 'metal', '辛': 'metal',
    '壬': 'water', '癸': 'water'
  };
  return stemMap[heavenlyStem] || 'unknown';
}

// 地支から五行を取得する関数
function getBranchElement(earthlyBranch) {
  const branchMap = {
    '子': 'water', '丑': 'earth',
    '寅': 'wood', '卯': 'wood',
    '辰': 'earth', '巳': 'fire',
    '午': 'fire', '未': 'earth',
    '申': 'metal', '酉': 'metal',
    '戌': 'earth', '亥': 'water'
  };
  return branchMap[earthlyBranch] || 'unknown';
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

// テスト実行
function runTests() {
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
}

// メイン実行
runTests();