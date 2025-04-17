/**
 * 用神計算機能のテストスクリプト
 * このスクリプトは refactoring-plan.md に基づいて修正された yojinCalculator.ts の動作を検証します
 */
import { SajuEngine } from '../src/SajuEngine';
import { determineYojin } from '../src/yojinCalculator';
import { FourPillars, IKakukyoku } from '../src/types';

// テスト用の生年月日時データ
const testCases = [
  {
    name: "テストケース1 (身強・特別格局)",
    birthDate: new Date(1985, 3, 15), // 1985年4月15日
    birthHour: 10,
    expectedKakukyoku: "従旺格", // 特別格局の場合
    expectedYojin: "比肩" // 期待される用神
  },
  {
    name: "テストケース2 (身弱・普通格局)",
    birthDate: new Date(1990, 10, 21), // 1990年11月21日
    birthHour: 15,
    expectedKakukyoku: "偏官格", // 普通格局の場合
    expectedYojin: "偏印" // 期待される用神
  },
  {
    name: "テストケース3 (中和・普通格局)",
    birthDate: new Date(1978, 7, 8), // 1978年8月8日
    birthHour: 22,
    expectedKakukyoku: "食神格", // 普通格局の場合
    expectedYojin: "食神" // 期待される用神
  }
];

/**
 * 用神計算機能の単体テスト
 * 四柱、十神関係、格局情報を直接指定して用神計算をテスト
 */
function testYojinCalculatorDirectly() {
  console.log("===== 用神計算関数の単体テスト =====");
  
  // テスト用のデータを作成
  const testFourPillars: FourPillars = {
    yearPillar: {
      stem: "甲",
      branch: "子",
      fullStemBranch: "甲子",
      branchTenGod: "正財"
    },
    monthPillar: {
      stem: "丙",
      branch: "寅",
      fullStemBranch: "丙寅",
      branchTenGod: "比肩"
    },
    dayPillar: {
      stem: "甲",
      branch: "午",
      fullStemBranch: "甲午",
      branchTenGod: "偏官"
    },
    hourPillar: {
      stem: "丁",
      branch: "未",
      fullStemBranch: "丁未",
      branchTenGod: "正印"
    }
  };
  
  const testTenGods: Record<string, string> = {
    year: "比肩",
    month: "食神",
    day: "比肩",
    hour: "傷官"
  };
  
  const testKakukyoku: IKakukyoku = {
    type: "従旺格",
    category: "special",
    strength: "strong",
    description: "テスト用の従旺格"
  };
  
  // 用神計算を実行
  const yojin = determineYojin(testFourPillars, testTenGods, testKakukyoku);
  
  console.log("テスト用データによる用神計算結果:");
  console.log(`- 用神: ${yojin.tenGod}`);
  console.log(`- 五行: ${yojin.element}`);
  console.log(`- 喜神: ${yojin.kijin?.tenGod} (${yojin.kijin?.element})`);
  console.log(`- 忌神: ${yojin.kijin2?.tenGod} (${yojin.kijin2?.element})`);
  console.log(`- 仇神: ${yojin.kyujin?.tenGod} (${yojin.kyujin?.element})`);
  
  return yojin;
}

/**
 * SajuEngineを使用した用神計算の統合テスト
 */
function testYojinCalculatorWithEngine() {
  console.log("\n===== SajuEngineを使用した用神計算のテスト =====");
  
  // SajuEngineのインスタンスを作成
  const engine = new SajuEngine({
    useInternationalMode: true,
    useLocalTime: true,
    useDST: true
  });
  
  // 各テストケースを実行
  for (const testCase of testCases) {
    console.log(`\n${testCase.name}をテスト中...`);
    console.log(`生年月日時: ${testCase.birthDate.toISOString()}, ${testCase.birthHour}時`);
    
    // 四柱推命計算を実行
    const result = engine.calculate(testCase.birthDate, testCase.birthHour);
    
    console.log("計算結果:");
    console.log(`- 格局: ${result.kakukyoku?.type} (${result.kakukyoku?.strength})`);
    console.log(`- 用神: ${result.yojin?.tenGod} (${result.yojin?.element})`);
    
    // 期待値との比較
    const kakukyokuMatches = result.kakukyoku?.type === testCase.expectedKakukyoku;
    const yojinMatches = result.yojin?.tenGod === testCase.expectedYojin;
    
    console.log(`格局比較: ${kakukyokuMatches ? '✓' : '✗'} (期待値: ${testCase.expectedKakukyoku})`);
    console.log(`用神比較: ${yojinMatches ? '✓' : '✗'} (期待値: ${testCase.expectedYojin})`);
    
    if (result.yojin) {
      console.log("- 用神の説明: " + result.yojin.description);
      console.log("- サポート五行: " + result.yojin.supportElements?.join(", "));
    }
    
    // 十神関係のカウント結果を表示
    if (result.fourPillars) {
      console.log("四柱の詳細:");
      console.log(`- 日主: ${result.fourPillars.dayPillar.stem}${result.fourPillars.dayPillar.branch}`);
      console.log(`- 年柱: ${result.fourPillars.yearPillar.stem}${result.fourPillars.yearPillar.branch}`);
      console.log(`- 月柱: ${result.fourPillars.monthPillar.stem}${result.fourPillars.monthPillar.branch}`);
      console.log(`- 時柱: ${result.fourPillars.hourPillar.stem}${result.fourPillars.hourPillar.branch}`);
    }
  }
}

// テストを実行
try {
  // 単体テスト
  const directTestResult = testYojinCalculatorDirectly();
  
  // SajuEngineを使用した統合テスト
  testYojinCalculatorWithEngine();
  
  console.log("\n===== テスト完了 =====");
} catch (error) {
  console.error("テスト中にエラーが発生しました:", error);
}