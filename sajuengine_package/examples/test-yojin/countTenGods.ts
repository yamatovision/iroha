import { FourPillars, TenGodRelation, HiddenStemTenGod } from '../../src/types';

/**
 * 通変星の出現回数を数える関数
 * @param fourPillars 四柱情報
 * @returns 各通変星の出現回数
 */
export function countTenGods(fourPillars: FourPillars): Record<TenGodRelation, number> {
  const counts: Record<TenGodRelation, number> = {
    // 個別十神
    '比肩': 0,
    '劫財': 0,
    '食神': 0,
    '傷官': 0,
    '偏財': 0,
    '正財': 0,
    '偏官': 0,
    '正官': 0,
    '偏印': 0,
    '正印': 0,
    // 通変星グループ
    '比劫': 0,
    '印': 0,
    '食傷': 0,
    '財': 0,
    '官殺': 0,
    // フォールバック
    '不明': 0,
    'なし': 0
  };
  
  // 天干の十神関係をカウント（3つの柱から）
  const stemTenGods = [
    fourPillars.yearPillar.stem,
    fourPillars.monthPillar.stem,
    fourPillars.hourPillar.stem
  ];
  
  // 地支の十神関係をカウント（4つの柱から）
  const branchTenGods = [
    fourPillars.yearPillar.branchTenGod,
    fourPillars.monthPillar.branchTenGod,
    fourPillars.dayPillar.branchTenGod,
    fourPillars.hourPillar.branchTenGod
  ];
  
  branchTenGods.forEach(tenGod => {
    if (tenGod && tenGod in counts) {
      counts[tenGod as TenGodRelation]++;
    }
  });
  
  // 蔵干の十神関係もカウント（重み付き）
  const hiddenStemsTenGods = [
    ...(fourPillars.yearPillar.hiddenStemsTenGods || []),
    ...(fourPillars.monthPillar.hiddenStemsTenGods || []),
    ...(fourPillars.dayPillar.hiddenStemsTenGods || []),
    ...(fourPillars.hourPillar.hiddenStemsTenGods || [])
  ];
  
  hiddenStemsTenGods.forEach(({ tenGod, weight = 1 }) => {
    if (tenGod && tenGod in counts) {
      counts[tenGod as TenGodRelation] += weight;
    }
  });
  
  // 通変星ペアの集計を追加
  counts['比劫'] = counts['比肩'] + counts['劫財'];
  counts['印'] = counts['偏印'] + counts['正印'];
  counts['食傷'] = counts['食神'] + counts['傷官'];
  counts['財'] = counts['偏財'] + counts['正財'];
  counts['官殺'] = counts['偏官'] + counts['正官'];
  
  return counts;
}