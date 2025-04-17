/**
 * 韓国式四柱推命 - 年柱計算モジュール (一般アルゴリズム)
 * calender.mdのサンプルデータを分析して抽出したアルゴリズム
 */
import { Pillar, STEMS, BRANCHES, SajuOptions } from './types';

/**
 * 年干支計算のオプション
 */
interface YearPillarOptions extends SajuOptions {
}

/**
 * 年干（天干）を計算する - 韓国式
 * @param year 西暦年
 * @return 天干のインデックス (0-9)
 */
export function calculateKoreanYearStemIndex(year: number): number {
  // calender.mdの分析結果に基づく韓国式計算
  // 1984年は甲子年（甲=0）という参照点から調整
  return (year - 4) % 10;
}

/**
 * 年支（地支）を計算する - 韓国式
 * @param year 西暦年
 * @return 地支のインデックス (0-11)
 */
export function calculateKoreanYearBranchIndex(year: number): number {
  // calender.mdの分析結果に基づく韓国式計算
  // 1986年は丙寅年（寅=2）という参照点から調整
  return (year - 4) % 12;
}

/**
 * 韓国式年柱計算 - サンプルデータから抽出した一般アルゴリズム
 * @param year 西暦年
 * @returns 年柱情報
 */
export function calculateKoreanYearPillar(year: number): Pillar {
  // 天干インデックス: (年 + 6) % 10
  const stemIndex = calculateKoreanYearStemIndex(year);
  
  // 地支インデックス: 年 % 12
  const branchIndex = calculateKoreanYearBranchIndex(year);
  
  const stem = STEMS[stemIndex];
  const branch = BRANCHES[branchIndex];
  
  return {
    stem,
    branch,
    fullStemBranch: `${stem}${branch}`
  };
}

/**
 * 地支から蔵干（隠れた天干）を取得
 * @param branch 地支
 * @returns 蔵干の配列
 */
export function getHiddenStems(branch: string): string[] {
  // 各地支に対応する蔵干のマッピング
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
 * サンプルデータを使って年柱計算を検証
 * @returns 検証結果
 */
export function verifyKoreanYearPillarCalculation(): { success: boolean, results: any[] } {
  // サンプルデータ - calender.mdから抽出
  const samples = [
    { year: 1970, expected: "己酉", description: "白い鶏 (흰 닭)" },
    { year: 1985, expected: "乙丑", description: "木の牛 (나무 소)" },
    { year: 1995, expected: "乙亥", description: "木の猪 (나무 돼지)" },
    { year: 2005, expected: "乙酉", description: "木の鶏 (나무 닭)" },
    { year: 2015, expected: "乙未", description: "木の羊 (나무 양)" }
  ];
  
  // 追加の検証ケース
  const additionalSamples = [
    { year: 1986, expected: "丙寅", description: "火の虎 (붉은 호랑이)" },
    { year: 2023, expected: "癸卯", description: "水の兎 (검은 토끼)" },
    { year: 2024, expected: "甲辰", description: "木の龍 (푸른 용)" }
  ];
  
  const results: any[] = [];
  let allCorrect = true;
  
  // サンプルデータの検証
  console.log('===== 韓国式年柱計算検証 - 基本サンプル =====');
  samples.forEach(sample => {
    const calculated = calculateKoreanYearPillar(sample.year);
    const isCorrect = calculated.fullStemBranch === sample.expected;
    
    if (!isCorrect) allCorrect = false;
    
    results.push({
      year: sample.year,
      expected: sample.expected,
      calculated: calculated.fullStemBranch,
      correct: isCorrect
    });
    
    console.log(`${sample.year}年: 期待値[${sample.expected} - ${sample.description}] 計算値[${calculated.fullStemBranch}] - ${isCorrect ? '✓' : '✗'}`);
  });
  
  // 追加サンプルの検証
  console.log('\n===== 韓国式年柱計算検証 - 追加サンプル =====');
  additionalSamples.forEach(sample => {
    const calculated = calculateKoreanYearPillar(sample.year);
    const isCorrect = calculated.fullStemBranch === sample.expected;
    
    if (!isCorrect) allCorrect = false;
    
    results.push({
      year: sample.year,
      expected: sample.expected,
      calculated: calculated.fullStemBranch,
      correct: isCorrect
    });
    
    console.log(`${sample.year}年: 期待値[${sample.expected} - ${sample.description}] 計算値[${calculated.fullStemBranch}] - ${isCorrect ? '✓' : '✗'}`);
  });
  
  // アルゴリズム説明
  console.log('\n===== 韓国式年柱計算アルゴリズム =====');
  console.log('抽出したアルゴリズム:');
  console.log('1. 年干(天干): (年 + 6) % 10のインデックスで求める');
  console.log('2. 年支(地支): (年 % 12)のインデックスで求める');
  console.log(`3. 天干の配列: [${STEMS.join(', ')}]`);
  console.log(`4. 地支の配列: [${BRANCHES.join(', ')}]`);
  
  return {
    success: allCorrect,
    results
  };
}

/**
 * 韓国式年柱計算のテスト実行
 */
export function runKoreanYearPillarTest(): void {
  const verification = verifyKoreanYearPillarCalculation();
  
  console.log(`\n検証結果: ${verification.success ? '成功' : '失敗'}`);
  
  if (!verification.success) {
    console.log('\n失敗したケース:');
    verification.results
      .filter(result => !result.correct)
      .forEach(result => {
        console.log(`- ${result.year}年: 期待値[${result.expected}] 計算値[${result.calculated}]`);
      });
  }
  
  // 過去60年間の年柱パターンを表示
  console.log('\n===== 過去60年間の韓国式年柱パターン =====');
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 60; i++) {
    const year = currentYear - 59 + i;
    const pillar = calculateKoreanYearPillar(year);
    console.log(`${year}年: ${pillar.fullStemBranch}`);
  }
}

// このファイルを直接実行した場合のみテストを実行
if (require.main === module) {
  runKoreanYearPillarTest();
}