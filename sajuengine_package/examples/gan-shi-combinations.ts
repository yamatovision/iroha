/**
 * 干合・支合ルールの使用例
 * 四柱推命における干合・支合の変化を計算する
 */

import { SajuEngine, processStemCombinations, processBranchCombinations, applyGanShiCombinations } from '../src';

// 1. 干合の例
function stemCombinationExample() {
  console.log('===== 干合の例 =====');
  
  // 例: 甲己の干合 (木の気が無い場合)
  const stems = ['甲', '己', '戊', '辛'];
  const branches = ['寅', '巳', '申', '亥'];
  
  console.log('元の天干:', stems.join(' '));
  const transformedStems = processStemCombinations(stems, branches);
  console.log('変化後の天干:', transformedStems.join(' '));
  console.log(''); // 改行
  
  // 例: 丁壬の干合 (金の気が無い場合)
  const stems2 = ['丙', '丁', '壬', '甲'];
  const branches2 = ['寅', '卯', '辰', '巳'];
  
  console.log('元の天干:', stems2.join(' '));
  const transformedStems2 = processStemCombinations(stems2, branches2);
  console.log('変化後の天干:', transformedStems2.join(' '));
  console.log(''); // 改行
  
  // 例: 姻合（妬合）による変化の打ち消し
  const stems3 = ['己', '甲', '己', '癸'];
  const branches3 = ['丑', '寅', '卯', '辰'];
  
  console.log('元の天干:', stems3.join(' '));
  console.log('（甲は左右の己から干合を受けているため変化しない）');
  const transformedStems3 = processStemCombinations(stems3, branches3);
  console.log('変化後の天干:', transformedStems3.join(' '));
}

// 2. 支合の例
function branchCombinationExample() {
  console.log('\n===== 支合の例 =====');
  
  // 例: 子丑の支合（土の気が多い場合）
  const stems = ['戊', '己', '庚', '辛'];
  const branches = ['子', '丑', '申', '酉'];
  
  console.log('元の地支:', branches.join(' '));
  const result = processBranchCombinations(branches, stems);
  console.log('支合後の地支:', result.branches.join(' '));
  console.log('強化された五行:', result.enhancedElements.join(' '));
  console.log('変化有無:', result.hasChanged.join(' '));
  console.log(''); // 改行
  
  // 例: 巳申の支合（水の気が多い場合）
  const stems2 = ['壬', '癸', '甲', '乙'];
  const branches2 = ['子', '卯', '巳', '申'];
  
  console.log('元の地支:', branches2.join(' '));
  const result2 = processBranchCombinations(branches2, stems2);
  console.log('支合後の地支:', result2.branches.join(' '));
  console.log('強化された五行:', result2.enhancedElements.join(' '));
  console.log('変化有無:', result2.hasChanged.join(' '));
  console.log(''); // 改行
  
  // 例: 支冲による打ち消し
  const stems3 = ['甲', '乙', '丙', '丁'];
  const branches3 = ['子', '丑', '午', '未'];
  
  console.log('元の地支:', branches3.join(' '));
  console.log('（子と午は支冲の関係のため、子丑の支合が打ち消される）');
  const result3 = processBranchCombinations(branches3, stems3);
  console.log('支合後の地支:', result3.branches.join(' '));
  console.log('強化された五行:', result3.enhancedElements.join(' '));
  console.log('変化有無:', result3.hasChanged.join(' '));
}

// 3. SajuEngineを使用した干合・支合の実例
function sajuEngineExample() {
  console.log('\n===== SajuEngineでの干合・支合処理の例 =====');
  
  // SajuEngineのインスタンスを作成
  const engine = new SajuEngine();
  
  // 干合のある日時
  // 例1: 甲己の干合がある日時
  const birthDate1 = new Date(2021, 1, 3, 12, 0, 0); // 2021年2月3日12時
  const result1 = engine.calculate(birthDate1, 12);
  
  console.log('例1: 四柱 -', 
    `${result1.fourPillars.yearPillar.stem}${result1.fourPillars.yearPillar.branch}`,
    `${result1.fourPillars.monthPillar.stem}${result1.fourPillars.monthPillar.branch}`,
    `${result1.fourPillars.dayPillar.stem}${result1.fourPillars.dayPillar.branch}`,
    `${result1.fourPillars.hourPillar.stem}${result1.fourPillars.hourPillar.branch}`
  );
  
  // 変化があった天干がある場合に表示
  if (result1.fourPillars.yearPillar.originalStem && 
      result1.fourPillars.yearPillar.originalStem !== result1.fourPillars.yearPillar.stem) {
    console.log(`  年柱変化: ${result1.fourPillars.yearPillar.originalStem} → ${result1.fourPillars.yearPillar.stem}`);
  }
  if (result1.fourPillars.monthPillar.originalStem && 
      result1.fourPillars.monthPillar.originalStem !== result1.fourPillars.monthPillar.stem) {
    console.log(`  月柱変化: ${result1.fourPillars.monthPillar.originalStem} → ${result1.fourPillars.monthPillar.stem}`);
  }
  if (result1.fourPillars.dayPillar.originalStem && 
      result1.fourPillars.dayPillar.originalStem !== result1.fourPillars.dayPillar.stem) {
    console.log(`  日柱変化: ${result1.fourPillars.dayPillar.originalStem} → ${result1.fourPillars.dayPillar.stem}`);
  }
  if (result1.fourPillars.hourPillar.originalStem && 
      result1.fourPillars.hourPillar.originalStem !== result1.fourPillars.hourPillar.stem) {
    console.log(`  時柱変化: ${result1.fourPillars.hourPillar.originalStem} → ${result1.fourPillars.hourPillar.stem}`);
  }
  
  // 支合による五行の強化があった場合に表示
  if (result1.fourPillars.yearPillar.enhancedElement) {
    console.log(`  年支五行強化: ${result1.fourPillars.yearPillar.enhancedElement}`);
  }
  if (result1.fourPillars.monthPillar.enhancedElement) {
    console.log(`  月支五行強化: ${result1.fourPillars.monthPillar.enhancedElement}`);
  }
  if (result1.fourPillars.dayPillar.enhancedElement) {
    console.log(`  日支五行強化: ${result1.fourPillars.dayPillar.enhancedElement}`);
  }
  if (result1.fourPillars.hourPillar.enhancedElement) {
    console.log(`  時支五行強化: ${result1.fourPillars.hourPillar.enhancedElement}`);
  }
  
  console.log(''); // 改行
  
  // 例2: 丁壬の干合がある日時
  const birthDate2 = new Date(1989, 7, 8, 14, 0, 0); // 1989年8月8日14時
  const result2 = engine.calculate(birthDate2, 14);
  
  console.log('例2: 四柱 -', 
    `${result2.fourPillars.yearPillar.stem}${result2.fourPillars.yearPillar.branch}`,
    `${result2.fourPillars.monthPillar.stem}${result2.fourPillars.monthPillar.branch}`,
    `${result2.fourPillars.dayPillar.stem}${result2.fourPillars.dayPillar.branch}`,
    `${result2.fourPillars.hourPillar.stem}${result2.fourPillars.hourPillar.branch}`
  );
  
  // 変化があった天干がある場合に表示
  if (result2.fourPillars.yearPillar.originalStem && 
      result2.fourPillars.yearPillar.originalStem !== result2.fourPillars.yearPillar.stem) {
    console.log(`  年柱変化: ${result2.fourPillars.yearPillar.originalStem} → ${result2.fourPillars.yearPillar.stem}`);
  }
  if (result2.fourPillars.monthPillar.originalStem && 
      result2.fourPillars.monthPillar.originalStem !== result2.fourPillars.monthPillar.stem) {
    console.log(`  月柱変化: ${result2.fourPillars.monthPillar.originalStem} → ${result2.fourPillars.monthPillar.stem}`);
  }
  if (result2.fourPillars.dayPillar.originalStem && 
      result2.fourPillars.dayPillar.originalStem !== result2.fourPillars.dayPillar.stem) {
    console.log(`  日柱変化: ${result2.fourPillars.dayPillar.originalStem} → ${result2.fourPillars.dayPillar.stem}`);
  }
  if (result2.fourPillars.hourPillar.originalStem && 
      result2.fourPillars.hourPillar.originalStem !== result2.fourPillars.hourPillar.stem) {
    console.log(`  時柱変化: ${result2.fourPillars.hourPillar.originalStem} → ${result2.fourPillars.hourPillar.stem}`);
  }
  
  // 支合による五行の強化があった場合に表示
  if (result2.fourPillars.yearPillar.enhancedElement) {
    console.log(`  年支五行強化: ${result2.fourPillars.yearPillar.enhancedElement}`);
  }
  if (result2.fourPillars.monthPillar.enhancedElement) {
    console.log(`  月支五行強化: ${result2.fourPillars.monthPillar.enhancedElement}`);
  }
  if (result2.fourPillars.dayPillar.enhancedElement) {
    console.log(`  日支五行強化: ${result2.fourPillars.dayPillar.enhancedElement}`);
  }
  if (result2.fourPillars.hourPillar.enhancedElement) {
    console.log(`  時支五行強化: ${result2.fourPillars.hourPillar.enhancedElement}`);
  }
}

// すべての例を実行
function runAllExamples() {
  stemCombinationExample();
  branchCombinationExample();
  sajuEngineExample();
}

// 例を実行
runAllExamples();