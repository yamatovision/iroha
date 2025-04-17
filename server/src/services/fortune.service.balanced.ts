/**
 * 五行バランス・用神ベースの運勢スコア計算アルゴリズム
 * ユーザーの五行バランスと用神情報に基づいて運勢スコアを計算
 */

/**
 * 五行バランス状態を分析
 * @param elementProfile ユーザーの五行プロファイル
 * @returns 各五行の状態(不足/均衡/過剰)
 */
export function analyzeElementBalance(
  elementProfile: { wood: number; fire: number; earth: number; metal: number; water: number; }
): Record<string, 'deficient' | 'balanced' | 'excessive'> {
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

/**
 * 五行の割合から状態を判定
 */
function getBalanceStatus(value: number, total: number): 'deficient' | 'balanced' | 'excessive' {
  const percentage = (value / total) * 100;
  if (percentage < 15) {
    return 'deficient';
  } else if (percentage > 25) {
    return 'excessive';
  } else {
    return 'balanced';
  }
}

/**
 * 五行バランスに基づくスコアを計算
 * @param elementProfile ユーザーの五行プロファイル
 * @param dayElement 日柱の五行
 * @returns 0-5スケールのスコア
 */
export function calculateElementBalanceScore(
  elementProfile: { wood: number; fire: number; earth: number; metal: number; water: number; },
  dayElement: string
): number {
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

/**
 * 用神情報に基づくスコアを計算
 * @param user ユーザー情報（用神、喜神、忌神、仇神情報を含む）
 * @param dayElement 日柱の五行
 * @returns 0-5スケールのスコア
 */
export function calculateYojinScore(
  user: any,
  dayElement: string
): number {
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

/**
 * 相生関係（生み出す関係）をチェック
 */
export function isGeneratingRelation(from: string, to: string): boolean {
  const generatingPairs = [
    ['water', 'wood'], 
    ['wood', 'fire'], 
    ['fire', 'earth'], 
    ['earth', 'metal'], 
    ['metal', 'water']
  ];
  
  return generatingPairs.some(([f, t]) => f === from && t === to);
}

/**
 * 相剋関係（抑制する関係）をチェック
 */
export function isControllingRelation(from: string, to: string): boolean {
  const controllingPairs = [
    ['wood', 'earth'], 
    ['earth', 'water'], 
    ['water', 'fire'], 
    ['fire', 'metal'], 
    ['metal', 'wood']
  ];
  
  return controllingPairs.some(([f, t]) => f === from && t === to);
}

/**
 * 五行バランス・用神ベースの運勢スコアを計算
 * @param user ユーザー情報
 * @param heavenlyStem 天干
 * @param earthlyBranch 地支
 * @param stemElement 天干の五行
 * @param branchElement 地支の五行
 * @param elementCompatibilityScore 従来の五行相性スコア
 * @returns 0-100スケールの運勢スコア
 */
export function calculateBalancedFortuneScore(
  user: any,
  heavenlyStem: string,
  earthlyBranch: string,
  stemElement: string,
  branchElement: string,
  elementCompatibilityScore: number
): number {
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