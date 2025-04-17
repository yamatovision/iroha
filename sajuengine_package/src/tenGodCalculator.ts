/**
 * 十神関係（通変星）計算モジュール
 */
import { STEMS } from './types';

/**
 * 天干の五行属性
 */
export const STEM_ELEMENTS: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

/**
 * 地支の五行属性
 */
export const BRANCH_ELEMENTS: Record<string, string> = {
  '子': '水', '丑': '土',
  '寅': '木', '卯': '木',
  '辰': '土', '巳': '火',
  '午': '火', '未': '土',
  '申': '金', '酉': '金',
  '戌': '土', '亥': '水'
};

/**
 * 五行相生関係（生む）
 */
export const ELEMENT_GENERATES: Record<string, string> = {
  '木': '火',
  '火': '土',
  '土': '金',
  '金': '水',
  '水': '木'
};

/**
 * 五行相剋関係（克す）
 */
export const ELEMENT_CONTROLS: Record<string, string> = {
  '木': '土',
  '土': '水',
  '水': '火',
  '火': '金',
  '金': '木'
};

/**
 * 天干から五行を取得
 * @param stem 天干
 * @returns 五行
 */
export function getElementFromStem(stem: string): string {
  return STEM_ELEMENTS[stem] || '不明';
}

/**
 * 地支から五行を取得
 * @param branch 地支
 * @returns 五行
 */
export function getElementFromBranch(branch: string): string {
  return BRANCH_ELEMENTS[branch] || '不明';
}

/**
 * 天干が陰性かどうか
 * @param stem 天干
 * @returns 陰性ならtrue
 */
export function isStemYin(stem: string): boolean {
  return ['乙', '丁', '己', '辛', '癸'].includes(stem);
}

/**
 * 通変星関係（十神関係）を判定する
 * @param dayStem 日主（日柱の天干）
 * @param targetStem 比較対象の天干
 * @returns 十神関係
 */
export function determineTenGodRelation(dayStem: string, targetStem: string): string {
  // 日主と対象の陰陽
  const dayYin = isStemYin(dayStem);
  const targetYin = isStemYin(targetStem);
  const sameSex = dayYin === targetYin;
  
  // 日主と対象の五行
  const dayElement = STEM_ELEMENTS[dayStem];
  const targetElement = STEM_ELEMENTS[targetStem];
  
  // 1. 同じ五行の場合
  if (dayElement === targetElement) {
    return sameSex ? '比肩' : '劫財';
  }
  
  // 2. 対象が日主を生む関係
  if (ELEMENT_GENERATES[targetElement] === dayElement) {
    return sameSex ? '偏印' : '正印';
  }
  
  // 3. 対象が日主を克する関係
  if (ELEMENT_CONTROLS[targetElement] === dayElement) {
    return sameSex ? '偏官' : '正官';
  }
  
  // 4. 日主が対象を生む関係
  if (ELEMENT_GENERATES[dayElement] === targetElement) {
    return sameSex ? '食神' : '傷官';
  }
  
  // 5. 日主が対象を克する関係
  if (ELEMENT_CONTROLS[dayElement] === targetElement) {
    return sameSex ? '偏財' : '正財';
  }
  
  return '不明';
}

/**
 * 天干に対する十神の韓国語名
 */
export const TEN_GOD_KR: Record<string, string> = {
  '比肩': '비견',
  '劫財': '겁재',
  '食神': '식신',
  '傷官': '상관',
  '偏財': '편재',
  '正財': '정재',
  '偏官': '편관',
  '正官': '정관',
  '偏印': '편인',
  '正印': '정인'
};

/**
 * 地支の十神関係を判定する
 * @param dayStem 日主（日柱の天干）
 * @param branch 地支
 * @returns 十神関係
 */
export function determineBranchTenGodRelation(dayStem: string, branch: string): string {
  if (!dayStem || !branch) {
    console.error(`determineBranchTenGodRelation: 無効なパラメータ - dayStem: ${dayStem}, branch: ${branch}`);
    return '不明';
  }

  // デバッグログ
  console.log(`地支の十神関係計算: 日主=${dayStem}, 地支=${branch}`);
  
  // 地支の五行を取得
  const branchElement = getElementFromBranch(branch);
  // 日主の五行
  const dayElement = getElementFromStem(dayStem);
  
  console.log(`  五行: 日主=${dayElement}, 地支=${branchElement}`);
  
  // 日主が陰性かどうか
  const dayYin = isStemYin(dayStem);
  // 地支が陰性かどうか (子・寅・辰・午・申・戌は陽、丑・卯・巳・未・酉・亥は陰)
  const branchYin = ['丑', '卯', '巳', '未', '酉', '亥'].includes(branch);
  const sameSex = dayYin === branchYin;
  
  console.log(`  陰陽: 日主=${dayYin ? '陰' : '陽'}, 地支=${branchYin ? '陰' : '陽'}, 同性=${sameSex}`);
  
  let result = '不明';
  
  // 1. 同じ五行の場合
  if (dayElement === branchElement) {
    result = sameSex ? '比肩' : '劫財';
  }
  // 2. 対象が日主を生む関係
  else if (ELEMENT_GENERATES[branchElement] === dayElement) {
    result = sameSex ? '偏印' : '正印';
  }
  // 3. 対象が日主を克する関係
  else if (ELEMENT_CONTROLS[branchElement] === dayElement) {
    result = sameSex ? '偏官' : '正官';
  }
  // 4. 日主が対象を生む関係
  else if (ELEMENT_GENERATES[dayElement] === branchElement) {
    result = sameSex ? '食神' : '傷官';
  }
  // 5. 日主が対象を克する関係
  else if (ELEMENT_CONTROLS[dayElement] === branchElement) {
    result = sameSex ? '偏財' : '正財';
  }
  
  console.log(`  結果: ${result}`);
  return result;
}

/**
 * 蔵干（地支に内包される天干）を取得
 * @param branch 地支
 * @returns 蔵干の配列
 */
export function getHiddenStems(branch: string): string[] {
  const hiddenStemsMap: Record<string, string[]> = {
    '子': ['癸'],
    '丑': ['己', '癸', '辛'],
    '寅': ['甲', '丙', '戊'],
    '卯': ['乙'],
    '辰': ['戊', '乙', '癸'],
    '巳': ['丙', '庚', '戊'],
    '午': ['丁', '己'],
    '未': ['己', '丁', '乙'],
    '申': ['庚', '壬', '戊'],
    '酉': ['辛'],
    '戌': ['戊', '辛', '丁'],
    '亥': ['壬', '甲']
  };
  
  return hiddenStemsMap[branch] || [];
}

/**
 * 特定の天干と地支の組み合わせに対する十神関係を計算
 * @param dayStem 日主（日柱の天干）
 * @param yearStem 年干
 * @param monthStem 月干
 * @param hourStem 時干
 * @param yearBranch 年支
 * @param monthBranch 月支
 * @param dayBranch 日支
 * @param hourBranch 時支
 * @returns 十神関係のマップ
 */
export function calculateTenGods(
  dayStem: string,
  yearStem: string,
  monthStem: string,
  hourStem: string,
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string
): Record<string, string> {
  // 天干の十神関係
  const stemTenGods = {
    year: determineTenGodRelation(dayStem, yearStem),
    month: determineTenGodRelation(dayStem, monthStem),
    day: '比肩', // 日柱自身は常に比肩
    hour: determineTenGodRelation(dayStem, hourStem)
  };
  
  // 地支の十神関係
  const branchTenGods = {
    yearBranch: determineBranchTenGodRelation(dayStem, yearBranch),
    monthBranch: determineBranchTenGodRelation(dayStem, monthBranch),
    dayBranch: determineBranchTenGodRelation(dayStem, dayBranch),
    hourBranch: determineBranchTenGodRelation(dayStem, hourBranch)
  };
  
  // 明確な名前で返す（統合しない）
  return {
    // 天干の十神関係
    year: stemTenGods.year,
    month: stemTenGods.month,
    day: stemTenGods.day,
    hour: stemTenGods.hour,
    
    // 地支の十神関係 - 明確な名前で
    yearBranch: branchTenGods.yearBranch,
    monthBranch: branchTenGods.monthBranch,
    dayBranch: branchTenGods.dayBranch,
    hourBranch: branchTenGods.hourBranch
  };
}

/**
 * 十神関係計算のテスト用関数
 */
export function testTenGods(): void {
  // テスト用の干支組み合わせ
  const testCases = [
    {
      description: "1986年5月26日5時（庚午日）",
      dayStem: "庚", yearStem: "丙", monthStem: "癸", hourStem: "己"
    },
    {
      description: "2023年10月15日12時（丙午日）",
      dayStem: "丙", yearStem: "癸", monthStem: "壬", hourStem: "甲"
    }
  ];
  
  for (const { description, dayStem, yearStem, monthStem, hourStem } of testCases) {
    console.log(`${description}の十神関係:`);
    // ダミー実装
    const tenGods = { year: '比肩', month: '比肩', day: '比肩', hour: '比肩' };
    
    Object.entries(tenGods).forEach(([pillar, god]) => {
      console.log(`${pillar}柱: ${god} (${TEN_GOD_KR[god] || '不明'})`);
    });
    console.log('---');
  }
}