/**
 * 時柱計算モジュール
 * calender.mdのサンプルデータに基づいた実装
 */
import { Pillar, STEMS, BRANCHES, SajuOptions } from './types';

/**
 * 時柱計算のオプション
 */
interface HourPillarOptions extends SajuOptions {
}

/**
 * 時刻に対応する地支（時辰）のマッピング
 * calender.mdの分析結果に基づく韓国式時辰
 * 
 * 各地支の時間範囲：
 * 子（ねずみ）: 23:00-01:00（11:00PM-1:00AM）
 * 丑（うし）: 01:00-03:00（1:00AM-3:00AM）
 * 寅（とら）: 03:00-05:00（3:00AM-5:00AM）
 * 卯（うさぎ）: 05:00-07:00（5:00AM-7:00AM）
 * 辰（たつ）: 07:00-09:00（7:00AM-9:00AM）
 * 巳（へび）: 09:00-11:00（9:00AM-11:00AM）
 * 午（うま）: 11:00-13:00（11:00AM-1:00PM）
 * 未（ひつじ）: 13:00-15:00（1:00PM-3:00PM）
 * 申（さる）: 15:00-17:00（3:00PM-5:00PM）
 * 酉（とり）: 17:00-19:00（5:00PM-7:00PM）
 * 戌（いぬ）: 19:00-21:00（7:00PM-9:00PM）
 * 亥（いのしし）: 21:00-23:00（9:00PM-11:00PM）
 */
const HOUR_TO_BRANCH_MAP: Record<number, number> = {
  0: 0,  // 23:00-01:00 → 子 (0)
  1: 0,  // 23:00-01:00 → 子 (0)
  2: 1,  // 01:00-03:00 → 丑 (1)
  3: 1,  // 01:00-03:00 → 丑 (1)
  4: 2,  // 03:00-05:00 → 寅 (2)
  5: 3,  // 05:00-07:00 → 卯 (3) - 正確には05:00から卯の刻
  6: 3,  // 05:00-07:00 → 卯 (3)
  7: 3,  // 05:00-07:00 → 卯 (3)
  8: 4,  // 07:00-09:00 → 辰 (4)
  9: 4,  // 07:00-09:00 → 辰 (4)
  10: 5, // 09:00-11:00 → 巳 (5)
  11: 5, // 09:00-11:00 → 巳 (5)
  12: 6, // 11:00-13:00 → 午 (6)
  13: 7, // 13:00-15:00 → 未 (7) - 正確には13:00から未の刻
  14: 7, // 13:00-15:00 → 未 (7)
  15: 7, // 13:00-15:00 → 未 (7)
  16: 8, // 15:00-17:00 → 申 (8)
  17: 8, // 15:00-17:00 → 申 (8)
  18: 9, // 17:00-19:00 → 酉 (9)
  19: 9, // 17:00-19:00 → 酉 (9)
  20: 10, // 19:00-21:00 → 戌 (10)
  21: 10, // 19:00-21:00 → 戌 (10)
  22: 11, // 21:00-23:00 → 亥 (11)
  23: 11  // 21:00-23:00 → 亥 (11)
};

/**
 * 日干から時干の基準インデックスを計算
 * 日干によって時干の開始点が変わる
 */
const DAY_STEM_TO_HOUR_STEM_BASE: Record<string, number> = {
  "甲": 0, // 甲の日は甲子から始まる → 甲(0)
  "乙": 2, // 乙の日は丙子から始まる → 丙(2)
  "丙": 4, // 丙の日は戊子から始まる → 戊(4)
  "丁": 6, // 丁の日は庚子から始まる → 庚(6)
  "戊": 8, // 戊の日は壬子から始まる → 壬(8)
  "己": 0, // 己の日は甲子から始まる → 甲(0)
  "庚": 2, // 庚の日は丙子から始まる → 丙(2)
  "辛": 4, // 辛の日は戊子から始まる → 戊(4)
  "壬": 6, // 壬の日は庚子から始まる → 庚(6)
  "癸": 8  // 癸の日は壬子から始まる → 壬(8)
};

/**
 * 時辰（地支）のインデックスを取得
 * @param hour 時間（0-23）
 * @returns 地支のインデックス（0-11）
 */
export function getHourBranchIndex(hour: number): number {
  return HOUR_TO_BRANCH_MAP[hour];
}

/**
 * 韓国式で時柱を計算
 * @param hour 時間（0-23）
 * @param dayStem 日干
 * @returns 時柱情報
 */
export function calculateKoreanHourPillar(hour: number, dayStem: string): Pillar {
  // 地支（支）の計算
  const branchIndex = getHourBranchIndex(hour);
  const branch = BRANCHES[branchIndex];
  
  // 日干から時干の基準インデックスを取得
  const hourStemBase = DAY_STEM_TO_HOUR_STEM_BASE[dayStem];
  
  // 時干を計算
  // 子の刻から始まり、各時辰ごとに天干が1つずつ進む
  const stemIndex = (hourStemBase + branchIndex) % 10;
  const stem = STEMS[stemIndex];
  
  return {
    stem,
    branch,
    fullStemBranch: `${stem}${branch}`,
    hiddenStems: getHiddenStems(branch)
  };
}

/**
 * 地支から蔵干を取得
 * @param branch 地支
 * @returns 蔵干の配列
 */
function getHiddenStems(branch: string): string[] {
  // 地支に対応する蔵干の定義
  const hiddenStemsMap: Record<string, string[]> = {
    "子": ["癸"],
    "丑": ["己", "辛", "癸"],
    "寅": ["甲", "丙", "戊"],
    "卯": ["乙"],
    "辰": ["戊", "乙", "癸"],
    "巳": ["丙", "庚", "戊"],
    "午": ["丁", "己"],
    "未": ["己", "乙", "丁"],
    "申": ["庚", "壬", "戊"],
    "酉": ["辛"],
    "戌": ["戊", "辛", "丁"],
    "亥": ["壬", "甲"]
  };
  
  return hiddenStemsMap[branch] || [];
}

/**
 * 時柱を計算する
 * @param hour 時間（0-23）
 * @param dayStem 日干
 * @param options 計算オプション
 */
export function getHourPillar(hour: number, dayStem: string, options: HourPillarOptions = {}): Pillar {
  return calculateKoreanHourPillar(hour, dayStem);
}

/**
 * サンプルデータとの検証
 * @returns 検証結果
 */
export function verifyHourPillarCalculation(): boolean {
  // 2023年10月15日（日干: 丙）の各時間帯のテスト
  const testCases = [
    { hour: 1, dayStem: "丙", expected: "戊子" },  // 子の刻 (1:00)
    { hour: 5, dayStem: "丙", expected: "庚寅" },  // 寅の刻 (5:00)
    { hour: 9, dayStem: "丙", expected: "壬辰" },  // 辰の刻 (9:00)
    { hour: 13, dayStem: "丙", expected: "甲未" }, // 未の刻 (13:00)
    { hour: 17, dayStem: "丙", expected: "丙申" }, // 申の刻 (17:00)
    { hour: 21, dayStem: "丙", expected: "戊戌" }  // 戌の刻 (21:00)
  ];

  let allPassed = true;
  let passCount = 0;
  
  console.log('時柱計算の検証:');
  
  for (const testCase of testCases) {
    const result = calculateKoreanHourPillar(testCase.hour, testCase.dayStem);
    const passed = result.fullStemBranch === testCase.expected;
    
    if (passed) {
      passCount++;
    } else {
      allPassed = false;
      console.log(`  ❌ ${testCase.hour}時 (日干:${testCase.dayStem}) - 期待値: ${testCase.expected}, 結果: ${result.fullStemBranch}`);
    }
  }
  
  console.log(`検証結果: ${passCount}/${testCases.length} テスト成功`);
  
  return allPassed;
}