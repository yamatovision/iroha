/**
 * 干合・支合動作確認のための特別テスト
 */
import { SajuEngine } from '../src';

// テスト用の日時リスト（特定の干合・支合が発生する日付を選択）
const testDates = [
  // 甲己の干合が発生しやすい日付
  { date: new Date(2014, 3, 5, 9, 0), hour: 9, desc: "甲己干合テスト 1" },
  { date: new Date(2015, 5, 6, 12, 0), hour: 12, desc: "甲己干合テスト 2" },
  
  // 丁壬の干合が発生しやすい日付
  { date: new Date(1977, 7, 22, 14, 0), hour: 14, desc: "丁壬干合テスト 1" },
  { date: new Date(1982, 3, 12, 15, 0), hour: 15, desc: "丁壬干合テスト 2" },
  
  // 支合が発生しやすい日付
  { date: new Date(1986, 1, 9, 10, 0), hour: 10, desc: "巳申支合テスト" },
  { date: new Date(1990, 4, 25, 11, 0), hour: 11, desc: "子丑支合テスト" },
  
  // 現代の日付数例
  { date: new Date(2020, 0, 25, 13, 0), hour: 13, desc: "2020年1月25日" },
  { date: new Date(2022, 5, 15, 17, 0), hour: 17, desc: "2022年6月15日" },
  { date: new Date(2023, 10, 8, 8, 0), hour: 8, desc: "2023年11月8日" },
  { date: new Date(2024, 2, 20, 10, 0), hour: 10, desc: "2024年3月20日" },
];

// SajuEngineを初期化
const engine = new SajuEngine();

// 各テスト日時について処理
testDates.forEach(testCase => {
  console.log(`\n=== ${testCase.desc} ===`);
  console.log(`日付: ${testCase.date.toLocaleString()}`);
  
  // 四柱を計算
  const result = engine.calculate(testCase.date, testCase.hour);
  
  // 計算結果を表示
  console.log('四柱: ', 
    `${result.fourPillars.yearPillar.stem}${result.fourPillars.yearPillar.branch} `,
    `${result.fourPillars.monthPillar.stem}${result.fourPillars.monthPillar.branch} `,
    `${result.fourPillars.dayPillar.stem}${result.fourPillars.dayPillar.branch} `,
    `${result.fourPillars.hourPillar.stem}${result.fourPillars.hourPillar.branch}`
  );
  
  // 干合による変化の確認
  checkStemChanges(result);
  
  // 支合による五行強化の確認
  checkEnhancedElements(result);
  
  // 十神関係の表示
  console.log('十神関係:');
  console.log(`  年柱: ${result.tenGods.year}`);
  console.log(`  月柱: ${result.tenGods.month}`);
  console.log(`  日柱: ${result.tenGods.day}`);
  console.log(`  時柱: ${result.tenGods.hour}`);
});

// 干合による変化をチェックして表示する関数
function checkStemChanges(result) {
  const { yearPillar, monthPillar, dayPillar, hourPillar } = result.fourPillars;
  let hasChanges = false;
  
  if (yearPillar.originalStem && yearPillar.originalStem !== yearPillar.stem) {
    console.log(`干合変化: 年柱天干 ${yearPillar.originalStem} → ${yearPillar.stem}`);
    hasChanges = true;
  }
  
  if (monthPillar.originalStem && monthPillar.originalStem !== monthPillar.stem) {
    console.log(`干合変化: 月柱天干 ${monthPillar.originalStem} → ${monthPillar.stem}`);
    hasChanges = true;
  }
  
  if (dayPillar.originalStem && dayPillar.originalStem !== dayPillar.stem) {
    console.log(`干合変化: 日柱天干 ${dayPillar.originalStem} → ${dayPillar.stem}`);
    hasChanges = true;
  }
  
  if (hourPillar.originalStem && hourPillar.originalStem !== hourPillar.stem) {
    console.log(`干合変化: 時柱天干 ${hourPillar.originalStem} → ${hourPillar.stem}`);
    hasChanges = true;
  }
  
  if (!hasChanges) {
    console.log('干合変化: なし');
  }
}

// 支合による五行強化をチェックして表示する関数
function checkEnhancedElements(result) {
  const { yearPillar, monthPillar, dayPillar, hourPillar } = result.fourPillars;
  let hasEnhancements = false;
  
  if (yearPillar.enhancedElement) {
    console.log(`支合強化: 年柱地支(${yearPillar.branch})の五行が「${yearPillar.enhancedElement}」に強化`);
    hasEnhancements = true;
  }
  
  if (monthPillar.enhancedElement) {
    console.log(`支合強化: 月柱地支(${monthPillar.branch})の五行が「${monthPillar.enhancedElement}」に強化`);
    hasEnhancements = true;
  }
  
  if (dayPillar.enhancedElement) {
    console.log(`支合強化: 日柱地支(${dayPillar.branch})の五行が「${dayPillar.enhancedElement}」に強化`);
    hasEnhancements = true;
  }
  
  if (hourPillar.enhancedElement) {
    console.log(`支合強化: 時柱地支(${hourPillar.branch})の五行が「${hourPillar.enhancedElement}」に強化`);
    hasEnhancements = true;
  }
  
  if (!hasEnhancements) {
    console.log('支合強化: なし');
  }
}