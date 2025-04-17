/**
 * 四柱推命の格局（気質タイプ）を判定するためのモジュール
 * 格局は命式全体から導き出される「気質タイプ」で、日干の強弱（身強・身弱）に基づいて特別格局と普通格局に分類される
 */
import { FourPillars, Pillar, IKakukyoku, TenGodRelation, HiddenStemTenGod } from './types';
import * as tenGodCalculator from './tenGodCalculator';

/**
 * 格局判定の主要関数
 * @param fourPillars 四柱情報
 * @param tenGods 十神関係情報
 * @returns 格局情報
 */
export function determineKakukyoku(
  fourPillars: FourPillars,
  tenGods: Record<string, string>
): IKakukyoku {
  // 1. 身強・身弱の判定（条件A・B・C方式）
  const strengthResult = determineStrength(fourPillars, tenGods);
  const isStrong = strengthResult.isStrong;
  
  // 2. 特別格局か普通格局かの判定
  const isSpecial = isSpecialKakukyoku(fourPillars, tenGods, strengthResult);
  
  // 3. 具体的な格局タイプの判定
  let kakukyokuType = '';
  let description = '';
  let extremeType = '';
  
  if (isSpecial) {
    // 特別格局の判定
    const result = determineSpecialKakukyoku(fourPillars, tenGods, isStrong);
    kakukyokuType = result.type;
    description = result.description;
    // 極身強・極身弱の情報を追加
    extremeType = strengthResult.isExtremeStrong ? '極身強' : strengthResult.isExtremeWeak ? '極身弱' : '';
  } else {
    // 普通格局の判定
    const result = determineNormalKakukyoku(fourPillars, tenGods, isStrong);
    kakukyokuType = result.type;
    description = result.description;
  }
  
  // 詳細な判定結果を返す
  return {
    type: kakukyokuType,
    category: isSpecial ? 'special' : 'normal',
    strength: isStrong ? 'strong' : strengthResult.isNeutral ? 'neutral' : 'weak',
    description: description,
    // 拡張情報
    extremeType: extremeType,
    isExtremeStrong: strengthResult.isExtremeStrong,
    isExtremeWeak: strengthResult.isExtremeWeak,
    score: strengthResult.score,
    details: strengthResult.details
  };
}

/**
 * 身強・身弱を判定する関数
 * @param fourPillars 四柱情報
 * @param tenGods 十神関係情報
 * @returns 身強・身弱の判定結果と詳細情報
 */
export function determineStrength(
  fourPillars: FourPillars,
  tenGods: Record<string, string>
): { isStrong: boolean; isNeutral: boolean; details: string[]; score: number; isExtremeStrong: boolean; isExtremeWeak: boolean; conditionResults: Record<string, boolean> } {
  const { dayPillar } = fourPillars;
  const dayMaster = dayPillar.stem;
  const details: string[] = [];
  const conditionResults: Record<string, boolean> = {
    'A_Strong': false,
    'B_Strong': false,
    'C_Strong': false,
    'A_Weak': false,
    'B_Weak': false,
    'C_Weak': false
  };
  
  let score = 0; // プラスなら身強、マイナスなら身弱、0に近いと中和
  
  // === 極身強の条件チェック ===
  
  // 条件A: 得令（当旺・次旺）にあてはまるか
  const monthBranch = fourPillars.monthPillar.branch;
  const dayMasterElement = tenGodCalculator.getElementFromStem(dayMaster);
  const isGettingStrongerInMonth = isElementGettingStrongerInMonth(dayMasterElement, monthBranch);
  
  if (isGettingStrongerInMonth) {
    details.push(`条件A(極身強): 得令 - ${dayMasterElement}は${monthBranch}月に強まる`);
    conditionResults['A_Strong'] = true;
    score += 2;
  }
  
  // 条件B: 地支に日干を強める十二支が2つ以上あるか
  let supportingBranchCount = 0;
  
  const branches = [
    { pillar: 'year', branch: fourPillars.yearPillar.branch },
    { pillar: 'month', branch: fourPillars.monthPillar.branch },
    { pillar: 'day', branch: fourPillars.dayPillar.branch },
    { pillar: 'hour', branch: fourPillars.hourPillar.branch }
  ];
  
  branches.forEach(({ pillar, branch }) => {
    const isSupportive = isBranchSupportiveToDayMaster(dayMaster, branch);
    if (isSupportive) {
      supportingBranchCount++;
      details.push(`条件B(極身強): ${pillar}支(${branch})が日干を強める`);
      score += 1;
    }
  });
  
  // 地支が2つ以上日干を強めていれば条件Bを満たす
  if (supportingBranchCount >= 2) {
    details.push(`条件B(極身強): 2つ以上の地支が日干を強める（${supportingBranchCount}個）`);
    conditionResults['B_Strong'] = true;
  }
  
  // 条件C: 天干に日干を強める十干が2つ以上あるか
  let supportingStemCount = 0;
  
  const stems = [
    { pillar: 'year', stem: fourPillars.yearPillar.stem },
    { pillar: 'month', stem: fourPillars.monthPillar.stem },
    { pillar: 'hour', stem: fourPillars.hourPillar.stem }
  ];
  
  stems.forEach(({ pillar, stem }) => {
    // 日干と同じ天干または日干を強める関係の天干か
    if (stem === dayMaster) {
      supportingStemCount++;
      details.push(`条件C(極身強): ${pillar}干(${stem})が日干と同じで強める`);
      score += 1;
    } else {
      const relation = tenGods[pillar];
      if (relation === '比肩' || relation === '劫財' || relation === '偏印' || relation === '正印') {
        supportingStemCount++;
        details.push(`条件C(極身強): ${pillar}干(${stem})の十神関係(${relation})が日干を強める`);
        score += 1;
      }
    }
  });
  
  // 天干が2つ以上日干を強めていれば条件Cを満たす
  if (supportingStemCount >= 2) {
    details.push(`条件C(極身強): 2つ以上の天干が日干を強める（${supportingStemCount}個）`);
    conditionResults['C_Strong'] = true;
  }
  
  // === 極身弱の条件チェック ===
  
  // 条件A: 失令（休・囚）にあてはまるか
  const isGettingWeakerInMonth = isElementGettingWeakerInMonth(dayMasterElement, monthBranch);
  
  if (isGettingWeakerInMonth) {
    details.push(`条件A(極身弱): 失令 - ${dayMasterElement}は${monthBranch}月に弱まる`);
    conditionResults['A_Weak'] = true;
    score -= 2;
  }
  
  // 条件B: 日干を弱める地支が3つ以上あるか
  let weakeningBranchCount = 0;
  
  branches.forEach(({ pillar, branch }) => {
    const isWeakening = isBranchWeakeningDayMaster(dayMaster, branch);
    if (isWeakening) {
      weakeningBranchCount++;
      details.push(`条件B(極身弱): ${pillar}支(${branch})が日干を弱める`);
      score -= 1;
    }
  });
  
  // 地支が3つ以上日干を弱めていれば条件B(弱)を満たす
  if (weakeningBranchCount >= 3) {
    details.push(`条件B(極身弱): 3つ以上の地支が日干を弱める（${weakeningBranchCount}個）`);
    conditionResults['B_Weak'] = true;
  }
  
  // 条件C: 天干に日干を弱める十干が2つ以上あるか
  let weakeningStemCount = 0;
  
  stems.forEach(({ pillar, stem }) => {
    const relation = tenGods[pillar];
    if (relation === '偏官' || relation === '正官' || relation === '偏財' || relation === '正財' || relation === '食神' || relation === '傷官') {
      weakeningStemCount++;
      details.push(`条件C(極身弱): ${pillar}干(${stem})の十神関係(${relation})が日干を弱める`);
      score -= 1;
    }
  });
  
  // 天干が2つ以上日干を弱めていれば条件C(弱)を満たす
  if (weakeningStemCount >= 2) {
    details.push(`条件C(極身弱): 2つ以上の天干が日干を弱める（${weakeningStemCount}個）`);
    conditionResults['C_Weak'] = true;
  }
  
  // 極身強・極身弱の判定
  const isExtremeStrong = conditionResults['A_Strong'] && conditionResults['B_Strong'] && conditionResults['C_Strong'];
  const isExtremeWeak = conditionResults['A_Weak'] && conditionResults['B_Weak'] && conditionResults['C_Weak'];
  
  // 最終判定（スコアベースのバックアップ判定も維持）
  const isStrong = isExtremeStrong || score > 1;  // 極身強または+2以上なら身強
  const isWeak = isExtremeWeak || score < -1;     // 極身弱または-2以下なら身弱
  const isNeutral = !isStrong && !isWeak;         // それ以外は中和
  
  // 詳細な判定結果
  details.push(`総合スコア: ${score}`);
  
  if (isExtremeStrong) {
    details.push('最終判定: 極身強（条件A・B・Cすべて満たす）');
  } else if (isExtremeWeak) {
    details.push('最終判定: 極身弱（条件A・B・Cすべて満たす）');
  } else if (isStrong) {
    details.push('最終判定: 身強');
  } else if (isWeak) {
    details.push('最終判定: 身弱');
  } else {
    details.push('最終判定: 中和');
  }
  
  return { 
    isStrong, 
    isNeutral,
    details, 
    score,
    isExtremeStrong,
    isExtremeWeak,
    conditionResults
  };
}

/**
 * 特別格局かどうかを判定する関数
 * @param fourPillars 四柱情報
 * @param tenGods 十神関係情報
 * @param strengthResult 身強・身弱の判定結果
 * @returns 特別格局かどうか
 */
function isSpecialKakukyoku(
  fourPillars: FourPillars,
  tenGods: Record<string, string>,
  strengthResult: { 
    isStrong: boolean; 
    isNeutral: boolean; 
    details: string[]; 
    score: number;
    isExtremeStrong: boolean;
    isExtremeWeak: boolean;
    conditionResults: Record<string, boolean>
  }
): boolean {
  // 中和の場合は特別格局ではない
  if (strengthResult.isNeutral) return false;
  
  // 極身強または極身弱の場合に特別格局の可能性
  if (strengthResult.isExtremeStrong || strengthResult.isExtremeWeak) {
    // 通変星の分布を確認
    const tenGodCounts = countTenGods(fourPillars);
    const total = Object.values(tenGodCounts).reduce((sum, count) => sum + count, 0);
    
    // 極身強の場合の特別格局
    if (strengthResult.isExtremeStrong) {
      // 比肩+劫財または偏印+正印が30%以上あるか
      if ((tenGodCounts['比肩'] + tenGodCounts['劫財']) / total >= 0.3 ||
          (tenGodCounts['偏印'] + tenGodCounts['正印']) / total >= 0.3) {
        return true;
      }
    }
    
    // 極身弱の場合の特別格局
    if (strengthResult.isExtremeWeak) {
      // 食神+傷官、偏財+正財、偏官+正官のいずれかが30%以上あるか
      if ((tenGodCounts['食神'] + tenGodCounts['傷官']) / total >= 0.3 ||
          (tenGodCounts['偏財'] + tenGodCounts['正財']) / total >= 0.3 ||
          (tenGodCounts['偏官'] + tenGodCounts['正官']) / total >= 0.3) {
        return true;
      }
      
      // 従勢格の判定：6種類の通変星が均等に分布しているか
      const sixTypeCount = tenGodCounts['食神'] + tenGodCounts['傷官'] + 
                          tenGodCounts['偏財'] + tenGodCounts['正財'] + 
                          tenGodCounts['偏官'] + tenGodCounts['正官'];
      
      if (sixTypeCount / total >= 0.6 && isEvenlyDistributed(tenGodCounts)) {
        return true;
      }
    }
  }
  
  // バックアップ：従来のスコアベース判定（移行期の互換性確保）
  if (Math.abs(strengthResult.score) >= 4) {
    // 通変星の分布も確認
    const tenGodCounts = countTenGods(fourPillars);
    const total = Object.values(tenGodCounts).reduce((sum, count) => sum + count, 0);
    
    // 特定の通変星ペアが多い場合
    if (
      (tenGodCounts['比肩'] + tenGodCounts['劫財']) / total >= 0.3 ||
      (tenGodCounts['偏印'] + tenGodCounts['正印']) / total >= 0.3 ||
      (tenGodCounts['食神'] + tenGodCounts['傷官']) / total >= 0.3 ||
      (tenGodCounts['偏財'] + tenGodCounts['正財']) / total >= 0.3 ||
      (tenGodCounts['偏官'] + tenGodCounts['正官']) / total >= 0.3
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * 特別格局のタイプを判定する関数
 * @param fourPillars 四柱情報
 * @param tenGods 十神関係情報
 * @param isStrong 身強かどうか
 * @returns 特別格局のタイプと説明
 */
function determineSpecialKakukyoku(
  fourPillars: FourPillars,
  tenGods: Record<string, string>,
  isStrong: boolean
): { type: string; description: string } {
  const tenGodCounts = countTenGods(fourPillars);
  const total = Object.values(tenGodCounts).reduce((sum, count) => sum + count, 0);
  
  if (isStrong) {
    // 極身強の特別格局（2種類）
    
    // 従旺格：比肩と劫財が多い
    if ((tenGodCounts['比肩'] + tenGodCounts['劫財']) / total >= 0.3) {
      return {
        type: '従旺格',
        description: '主体性があり、自分の思った通りに人生を突き進む気質タイプです。自己主張が強く、リーダーシップがある一方、協調性を意識する必要があります。'
      };
    }
    
    // 従強格：偏印と正印が多い
    if ((tenGodCounts['偏印'] + tenGodCounts['正印']) / total >= 0.3) {
      return {
        type: '従強格',
        description: '独自の人生観を持ち、学識の充実した人生を歩む気質タイプです。知性と洞察力に優れ、精神的な豊かさを重視します。'
      };
    }
    
  } else {
    // 極身弱の特別格局（4種類）
    
    // 従児格：食神と傷官が多い
    if ((tenGodCounts['食神'] + tenGodCounts['傷官']) / total >= 0.3) {
      return {
        type: '従児格',
        description: '社交的で頭の回転が速く、鋭い感性と人生観を持つ気質タイプです。創造性に富み、アイデアが豊富ですが、持続性を意識すると良いでしょう。'
      };
    }
    
    // 従財格：偏財と正財が多い
    if ((tenGodCounts['偏財'] + tenGodCounts['正財']) / total >= 0.3) {
      return {
        type: '従財格',
        description: 'とても強い財運を持ち、人間関係にも恵まれる気質タイプです。実利的で物質的な豊かさを得やすい一方、精神的な充実も大切にしましょう。'
      };
    }
    
    // 従殺格：偏官と正官が多い
    if ((tenGodCounts['偏官'] + tenGodCounts['正官']) / total >= 0.3) {
      return {
        type: '従殺格',
        description: '忍耐強く封建的な世界を好み、目上につき従う気質タイプです。規律と秩序を重んじ、責任感が強い特徴があります。'
      };
    }
    
    // 従勢格：食神、傷官、偏財、正財、偏官、正官（6種類）が均等にある
    const sixTypes = ['食神', '傷官', '偏財', '正財', '偏官', '正官'];
    const sixTypeCount = sixTypes.reduce((sum, tenGod) => sum + tenGodCounts[tenGod], 0);
    
    if (sixTypeCount / total >= 0.6 && isEvenlyDistributed(tenGodCounts)) {
      return {
        type: '従勢格',
        description: '円満な性格で、環境や状況に柔軟に対応していく気質タイプです。バランス感覚に優れ、多方面での活躍が期待できます。'
      };
    }
  }
  
  // デフォルト（通常は到達しない）
  return {
    type: isStrong ? '特殊身強格' : '特殊身弱格',
    description: '特別な気質タイプで、通常とは異なる特性を持っています。詳細な鑑定は個別に行うことをお勧めします。'
  };
}

/**
 * 普通格局のタイプを判定する関数
 * @param fourPillars 四柱情報
 * @param tenGods 十神関係情報
 * @param isStrong 身強かどうか
 * @returns 普通格局のタイプと説明
 */
function determineNormalKakukyoku(
  fourPillars: FourPillars,
  tenGods: Record<string, string>,
  isStrong: boolean
): { type: string; description: string } {
  const { dayPillar, monthPillar } = fourPillars;
  const dayMaster = dayPillar.stem;
  const monthBranch = monthPillar.branch;
  
  // 1. 「建禄格」になる日干と月支の組み合わせがあるか
  if (isKenrokuCombination(dayMaster, monthBranch)) {
    return {
      type: '建禄格',
      description: '独立心が強く負けず嫌いな性格で、人生を切り拓く気質タイプです。目標に向かって邁進する力強さがあります。'
    };
  }
  
  // 2. 「月刃格」になる日干と月支の組み合わせがあるか
  if (isGetsujinCombination(dayMaster, monthBranch)) {
    return {
      type: '月刃格',
      description: 'プライドが高く、自分の世界や価値観を重視する気質タイプです。独自の判断基準を持ち、自律性が高い特徴があります。'
    };
  }
  
  // 3. 月支の蔵干と同じ五行の十干が月干にあるか
  const monthStem = monthPillar.stem;
  const monthHiddenStems = monthPillar.hiddenStems || [];
  if (monthHiddenStems.some(stem => tenGodCalculator.getElementFromStem(stem) === tenGodCalculator.getElementFromStem(monthStem))) {
    // 3.1 十神関係に基づいて格局を判定
    const monthTenGod = tenGods.month;
    return determineTenGodBasedKakukyoku(monthTenGod);
  }
  
  // 4. 月支の蔵干と同じ五行の十干が年干か時干に出ているか
  const yearStem = fourPillars.yearPillar.stem;
  const hourStem = fourPillars.hourPillar.stem;
  
  if (monthHiddenStems.some(stem => tenGodCalculator.getElementFromStem(stem) === tenGodCalculator.getElementFromStem(yearStem))) {
    const yearTenGod = tenGods.year;
    return determineTenGodBasedKakukyoku(yearTenGod);
  }
  
  if (monthHiddenStems.some(stem => tenGodCalculator.getElementFromStem(stem) === tenGodCalculator.getElementFromStem(hourStem))) {
    const hourTenGod = tenGods.hour;
    return determineTenGodBasedKakukyoku(hourTenGod);
  }
  
  // 5. 上記の条件に当てはまらない場合、「月支蔵干深浅表」を使って格局を求める
  return determineKakukyokuFromMonthBranchDepth(monthBranch, dayMaster);
}

/**
 * 十神関係に基づいて格局を判定する補助関数
 * @param tenGod 十神関係
 * @returns 格局のタイプと説明
 */
function determineTenGodBasedKakukyoku(tenGod: string): { type: string; description: string } {
  switch (tenGod) {
    case '比肩':
      return {
        type: '比肩格',
        description: '同じ立場の人と協力し合い、対等な関係を構築する気質タイプです。協調性がありながらも自立心があります。'
      };
    case '劫財':
      return {
        type: '劫財格',
        description: '自立心が強く、競争心のある気質タイプです。目標達成のために努力を惜しまず、向上心が旺盛です。'
      };
    case '食神':
      return {
        type: '食神格',
        description: '鋭い感覚を持ち快楽主義者で、のびのびと生きる気質タイプです。芸術や創作活動に才能を発揮することが多いでしょう。'
      };
    case '傷官':
      return {
        type: '傷官格',
        description: '独自の感性の持ち主で、専門技術の習得にも長ける気質タイプです。個性的な発想と表現力に優れています。'
      };
    case '偏財':
      return {
        type: '偏財格',
        description: '社交的で義理人情に厚く、物質生活を重んじる気質タイプです。人付き合いが広く、実利を重視する傾向があります。'
      };
    case '正財':
      return {
        type: '正財格',
        description: '現実的な合理主義者で、堅実な価値判断をする気質タイプです。経済観念に優れ、計画的な行動が得意です。'
      };
    case '偏官':
      return {
        type: '偏官格',
        description: '正義感にあふれ、強い者を抑えて弱い者を助ける気質タイプです。社会的なルールや公正さを重んじます。'
      };
    case '正官':
      return {
        type: '正官格',
        description: 'まじめで大言を表に出さず、家に規律や礼儀を重んじる気質タイプです。責任感が強く、信頼される人格者です。'
      };
    case '偏印':
      return {
        type: '偏印格',
        description: '知的好奇心が旺盛で、内面世界の探求を重視する気質タイプです。学問や思索に深い関心を持ちます。'
      };
    case '正印':
      return {
        type: '印緑格',
        description: '好奇心旺盛で探究心が強く、知識を吸収することに喜びを感じる気質タイプです。教養が豊かで知的な魅力があります。'
      };
    default:
      return {
        type: '普通格',
        description: '調和のとれた一般的な気質タイプです。適応力があり、状況に応じた柔軟な対応ができます。'
      };
  }
}

/**
 * 月支の深浅に基づいて格局を判定する補助関数
 * @param monthBranch 月支
 * @param dayStem 日干
 * @returns 格局のタイプと説明
 */
function determineKakukyokuFromMonthBranchDepth(monthBranch: string, dayStem: string): { type: string; description: string } {
  // 月支の深浅表に基づく判定ロジック（簡略版）
  // 実際の実装では詳細な月支蔵干深浅表データベースが必要
  
  // デフォルト値
  return {
    type: '普通格',
    description: '調和のとれた一般的な気質タイプです。適応力があり、状況に応じた柔軟な対応ができます。'
  };
}

/**
 * 通変星の出現回数を数える補助関数
 * @param fourPillars 四柱情報
 * @returns 各通変星の出現回数
 */
function countTenGods(fourPillars: FourPillars): Record<string, number> {
  const counts: Record<string, number> = {
    '比肩': 0,
    '劫財': 0,
    '食神': 0,
    '傷官': 0,
    '偏財': 0,
    '正財': 0,
    '偏官': 0,
    '正官': 0,
    '偏印': 0,
    '正印': 0
  };
  
  // 天干の十神関係をカウント
  const stemTenGods = [
    { stem: fourPillars.yearPillar.stem, tenGod: fourPillars.yearPillar.branchTenGod },
    { stem: fourPillars.monthPillar.stem, tenGod: fourPillars.monthPillar.branchTenGod },
    { stem: fourPillars.hourPillar.stem, tenGod: fourPillars.hourPillar.branchTenGod }
  ];
  
  stemTenGods.forEach(({ tenGod }) => {
    if (tenGod && tenGod in counts) {
      counts[tenGod]++;
    }
  });
  
  // 地支の十神関係もカウント
  const branchTenGods = [
    fourPillars.yearPillar.branchTenGod,
    fourPillars.monthPillar.branchTenGod,
    fourPillars.dayPillar.branchTenGod,
    fourPillars.hourPillar.branchTenGod
  ];
  
  branchTenGods.forEach(tenGod => {
    if (tenGod && tenGod in counts) {
      counts[tenGod]++;
    }
  });
  
  // 蔵干の十神関係もカウント
  const hiddenStemsTenGods = [
    ...(fourPillars.yearPillar.hiddenStemsTenGods || []),
    ...(fourPillars.monthPillar.hiddenStemsTenGods || []),
    ...(fourPillars.dayPillar.hiddenStemsTenGods || []),
    ...(fourPillars.hourPillar.hiddenStemsTenGods || [])
  ];
  
  hiddenStemsTenGods.forEach(({ tenGod, weight = 1 }) => {
    if (tenGod && tenGod in counts) {
      counts[tenGod] += weight;
    }
  });
  
  return counts;
}

/**
 * 通変星が均等に分布しているかを確認する補助関数
 * @param tenGodCounts 各通変星の出現回数
 * @returns 均等に分布しているかどうか
 */
function isEvenlyDistributed(tenGodCounts: Record<string, number>): boolean {
  // 6種類の通変星（食神、傷官、偏財、正財、偏官、正官）について
  const sixTypes = ['食神', '傷官', '偏財', '正財', '偏官', '正官'];
  const counts = sixTypes.map(type => tenGodCounts[type]);
  
  // 最大値と最小値の差が小さい場合、均等に分布していると判断
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  
  // 最大値が0の場合は均等分布でない
  if (max === 0) return false;
  
  // 最大値に対する最小値の比率が0.5以上なら均等分布と判断
  return min / max >= 0.5;
}

/**
 * 五行が月によって強化されるかを判定する補助関数
 * @param element 五行
 * @param monthBranch 月支
 * @returns 強化されるかどうか
 */
function isElementGettingStrongerInMonth(element: string, monthBranch: string): boolean {
  // 五行が当旺または次旺となる月の対応関係
  const strongMonths: Record<string, string[]> = {
    '木': ['寅', '卯', '辰'], // 木は寅・卯・辰月に強まる
    '火': ['巳', '午', '未'], // 火は巳・午・未月に強まる
    '土': ['辰', '未', '戌', '丑'], // 土は辰・未・戌・丑月に強まる
    '金': ['申', '酉', '戌'], // 金は申・酉・戌月に強まる
    '水': ['亥', '子', '丑']  // 水は亥・子・丑月に強まる
  };
  
  return strongMonths[element]?.includes(monthBranch) || false;
}

/**
 * 五行が月によって弱まるかを判定する補助関数
 * @param element 五行
 * @param monthBranch 月支
 * @returns 弱まるかどうか
 */
function isElementGettingWeakerInMonth(element: string, monthBranch: string): boolean {
  // 五行が休・囚となる月の対応関係
  const weakMonths: Record<string, string[]> = {
    '木': ['申', '酉', '戌'], // 木は申・酉・戌月に弱まる
    '火': ['亥', '子', '丑'], // 火は亥・子・丑月に弱まる
    '土': ['寅', '卯', '申', '酉'], // 土は寅・卯・申・酉月に弱まる
    '金': ['巳', '午', '未'], // 金は巳・午・未月に弱まる
    '水': ['辰', '巳', '午', '未']  // 水は辰・巳・午・未月に弱まる
  };
  
  return weakMonths[element]?.includes(monthBranch) || false;
}

/**
 * 地支が日干を強めるかを判定する補助関数
 * @param dayStem 日干
 * @param branch 地支
 * @returns 強めるかどうか
 */
function isBranchSupportiveToDayMaster(dayStem: string, branch: string): boolean {
  const dayElement = tenGodCalculator.getElementFromStem(dayStem);
  
  // 地支が持つ五行（簡易版）
  const branchElements: Record<string, string[]> = {
    '子': ['水'],
    '丑': ['土', '水', '金'],
    '寅': ['木', '火', '土'],
    '卯': ['木'],
    '辰': ['土', '木', '水'],
    '巳': ['火', '土', '金'],
    '午': ['火', '土'],
    '未': ['土', '火', '木'],
    '申': ['金', '水', '土'],
    '酉': ['金'],
    '戌': ['土', '火', '金'],
    '亥': ['水', '木']
  };
  
  // 日干を強める五行の関係
  const supportiveElements: Record<string, string[]> = {
    '木': ['木', '水'], // 木は同じ木か、水によって強められる
    '火': ['火', '木'], // 火は同じ火か、木によって強められる
    '土': ['土', '火'], // 土は同じ土か、火によって強められる
    '金': ['金', '土'], // 金は同じ金か、土によって強められる
    '水': ['水', '金']  // 水は同じ水か、金によって強められる
  };
  
  // 地支が持つ五行のうち、日干を強める五行があるかをチェック
  return branchElements[branch]?.some(element => 
    supportiveElements[dayElement]?.includes(element)
  ) || false;
}

/**
 * 地支が日干を弱めるかを判定する補助関数
 * @param dayStem 日干
 * @param branch 地支
 * @returns 弱めるかどうか
 */
function isBranchWeakeningDayMaster(dayStem: string, branch: string): boolean {
  const dayElement = tenGodCalculator.getElementFromStem(dayStem);
  
  // 地支が持つ五行（簡易版）
  const branchElements: Record<string, string[]> = {
    '子': ['水'],
    '丑': ['土', '水', '金'],
    '寅': ['木', '火', '土'],
    '卯': ['木'],
    '辰': ['土', '木', '水'],
    '巳': ['火', '土', '金'],
    '午': ['火', '土'],
    '未': ['土', '火', '木'],
    '申': ['金', '水', '土'],
    '酉': ['金'],
    '戌': ['土', '火', '金'],
    '亥': ['水', '木']
  };
  
  // 日干を弱める五行の関係
  const weakeningElements: Record<string, string[]> = {
    '木': ['金', '土'], // 木は金に克され、土を克する
    '火': ['水', '金'], // 火は水に克され、金を克する
    '土': ['木', '水'], // 土は木に克され、水を克する
    '金': ['火', '木'], // 金は火に克され、木を克する
    '水': ['土', '火']  // 水は土に克され、火を克する
  };
  
  // 地支が持つ五行のうち、日干を弱める五行があるかをチェック
  return branchElements[branch]?.some(element => 
    weakeningElements[dayElement]?.includes(element)
  ) || false;
}

/**
 * 三方会局が特定の五行を強めるかを判定する補助関数
 * @param element 五行
 * @param yearBranch 年支
 * @param monthBranch 月支
 * @param dayBranch 日支
 * @param hourBranch 時支
 * @returns 強める会局の名前、または強めない場合はnull
 */
function hasTriangleFormationForElement(
  element: string,
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string
): string | null {
  // 三方会局の定義（簡略版）
  const triangleFormations: Record<string, [string, string, string][]> = {
    '木': [['寅', '卯', '辰']], // 木の三方会局
    '火': [['巳', '午', '未']], // 火の三方会局
    '土': [['辰', '戌', '丑'], ['巳', '酉', '丑']], // 土の三方会局
    '金': [['申', '酉', '戌']], // 金の三方会局
    '水': [['亥', '子', '丑']]  // 水の三方会局
  };
  
  // 命式の地支リスト
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch];
  
  // 五行に対応する三方会局が形成されているか確認
  const formations = triangleFormations[element] || [];
  for (const [b1, b2, b3] of formations) {
    if (branches.includes(b1) && branches.includes(b2) && branches.includes(b3)) {
      return `${b1}${b2}${b3}`;
    }
  }
  
  return null;
}

/**
 * 三合会局が特定の五行を強めるかを判定する補助関数
 * @param element 五行
 * @param yearBranch 年支
 * @param monthBranch 月支
 * @param dayBranch 日支
 * @param hourBranch 時支
 * @returns 強める会局の名前、または強めない場合はnull
 */
function hasUnionFormationForElement(
  element: string,
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string
): string | null {
  // 三合会局の定義（簡略版）
  const unionFormations: Record<string, [string, string, string][]> = {
    '木': [['寅', '午', '戌']], // 木の三合会局
    '火': [['寅', '午', '戌']], // 火の三合会局（寅午戌は木局を生じるので火も強まる）
    '土': [['申', '子', '辰']], // 土の三合会局（申子辰は水局だが、辰がある時は土も強まる）
    '金': [['亥', '卯', '未']], // 金の三合会局（亥卯未は木局で金を克するが、特定の配置では金を強める）
    '水': [['申', '子', '辰']]  // 水の三合会局
  };
  
  // 命式の地支リスト
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch];
  
  // 五行に対応する三合会局が形成されているか確認
  const formations = unionFormations[element] || [];
  for (const [b1, b2, b3] of formations) {
    if (branches.includes(b1) && branches.includes(b2) && branches.includes(b3)) {
      return `${b1}${b2}${b3}`;
    }
  }
  
  return null;
}

/**
 * 四墓土局が形成されているかを判定する補助関数
 * @param yearBranch 年支
 * @param monthBranch 月支
 * @param dayBranch 日支
 * @param hourBranch 時支
 * @returns 四墓土局が形成されているかどうか
 */
function hasFourEarthFormationInBranches(
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string
): boolean {
  // 四墓土局の地支: 辰、戌、丑、未
  const earthFormationBranches = ['辰', '戌', '丑', '未'];
  
  // 命式の地支リスト
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch];
  
  // 四墓土局の地支が2つ以上あるかどうか
  let count = 0;
  for (const branch of earthFormationBranches) {
    if (branches.includes(branch)) {
      count++;
    }
  }
  
  return count >= 2;
}

/**
 * 建禄格の組み合わせかどうかを判定する補助関数
 * @param dayStem 日干
 * @param monthBranch 月支
 * @returns 建禄格の組み合わせかどうか
 */
function isKenrokuCombination(dayStem: string, monthBranch: string): boolean {
  // 建禄格の日干と月支の組み合わせ
  const kenrokuCombinations: Record<string, string> = {
    '甲': '寅', // 甲日干は寅月に建禄格
    '乙': '卯', // 乙日干は卯月に建禄格
    '丙': '巳', // 丙日干は巳月に建禄格
    '丁': '午', // 丁日干は午月に建禄格
    '戊': '辰', // 戊日干は辰月に建禄格
    '己': '未', // 己日干は未月に建禄格
    '庚': '申', // 庚日干は申月に建禄格
    '辛': '酉', // 辛日干は酉月に建禄格
    '壬': '亥', // 壬日干は亥月に建禄格
    '癸': '子'  // 癸日干は子月に建禄格
  };
  
  return kenrokuCombinations[dayStem] === monthBranch;
}

/**
 * 月刃格の組み合わせかどうかを判定する補助関数
 * @param dayStem 日干
 * @param monthBranch 月支
 * @returns 月刃格の組み合わせかどうか
 */
function isGetsujinCombination(dayStem: string, monthBranch: string): boolean {
  // 月刃格の日干と月支の組み合わせ
  const getsujinCombinations: Record<string, string> = {
    '甲': '卯', // 甲日干は卯月に月刃格
    '乙': '寅', // 乙日干は寅月に月刃格
    '丙': '午', // 丙日干は午月に月刃格
    '丁': '巳', // 丁日干は巳月に月刃格
    '戊': '未', // 戊日干は未月に月刃格
    '己': '辰', // 己日干は辰月に月刃格
    '庚': '酉', // 庚日干は酉月に月刃格
    '辛': '申', // 辛日干は申月に月刃格
    '壬': '子', // 壬日干は子月に月刃格
    '癸': '亥'  // 癸日干は亥月に月刃格
  };
  
  return getsujinCombinations[dayStem] === monthBranch;
}