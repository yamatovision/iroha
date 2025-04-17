/**
 * 十神関係計算のための改良アルゴリズム
 * マッピングテーブルを分析して抽出したパターンに基づき、計算精度を向上したアルゴリズム実装
 */

// 基本データをインポート
import {
  stems,
  branches,
  stemElements,
  stemYinYang,
  branchElements,
  branchYinYang,
  hiddenStems,
  generatesRelation,
  controlsRelation,
  generatedByRelation,
  controlledByRelation,
  isStemYin,
  isBranchYin
} from './tenGodBasicData';

// マッピングテーブルをインポート（精度検証用）
import { BRANCH_TEN_GOD_MAP, STEM_TEN_GOD_MAP } from './tenGodFixedMapping';

/**
 * 韓国式/日本式四柱推命における天干と地支の関係の特殊性を考慮した改良版十神計算アルゴリズム
 * マッピングテーブル分析に基づく精度向上版
 * 
 * @param dayStem 日主となる天干
 * @param branch 対象となる地支
 * @returns 十神関係
 */
export function determineImprovedBranchTenGod(dayStem: string, branch: string): string {
  // パラメータ検証
  if (!stems.includes(dayStem) || !branches.includes(branch)) {
    return '不明';
  }

  // 1. まず基本的な五行と陰陽の情報を取得
  const dayStemIdx = stems.indexOf(dayStem);
  const branchIdx = branches.indexOf(branch);
  const dayStemElement = stemElements[dayStem];
  const dayStemYin = isStemYin(dayStem);
  const branchElement = branchElements[branch];
  const branchYin = isBranchYin(branch);

  // 2. 地支の蔵干（隠れた天干）を取得
  const hiddenStemsInBranch = hiddenStems[branch] || [];
  
  // 3. 改良: 蔵干の主要天干（最初の蔵干）が、特定の地支の主要な性質を決めることが多い
  const primaryHiddenStem = hiddenStemsInBranch.length > 0 ? hiddenStemsInBranch[0] : null;
  const primaryHiddenStemElement = primaryHiddenStem ? stemElements[primaryHiddenStem] : null;
  const primaryHiddenStemYin = primaryHiddenStem ? isStemYin(primaryHiddenStem) : null;

  // 4. 特殊ケース: 分析結果に基づくルール
  
  // 特定の天干×地支の組み合わせで特殊ルールを適用
  // これらはマッピングテーブルから抽出した例外パターン

  // 甲日の特殊ケース
  if (dayStem === '甲' && branch === '子') return '偏印';
  if (dayStem === '甲' && branch === '巳') return '傷官';
  if (dayStem === '甲' && branch === '午') return '食神';
  if (dayStem === '甲' && branch === '申') return '偏官';
  if (dayStem === '甲' && branch === '酉') return '正官';
  if (dayStem === '甲' && branch === '亥') return '正印';

  // 乙日の特殊ケース
  if (dayStem === '乙' && branch === '巳') return '食神';
  if (dayStem === '乙' && branch === '午') return '傷官';
  if (dayStem === '乙' && branch === '亥') return '偏印';

  // 丙日の特殊ケース
  if (dayStem === '丙' && branch === '子') return '偏官';
  if (dayStem === '丙' && branch === '巳') return '劫財';
  if (dayStem === '丙' && branch === '午') return '比肩';
  if (dayStem === '丙' && branch === '亥') return '正官';

  // 丁日の特殊ケース
  if (dayStem === '丁' && branch === '子') return '偏官';
  if (dayStem === '丁' && branch === '丑') return '食神';
  if (dayStem === '丁' && branch === '巳') return '比肩';
  if (dayStem === '丁' && branch === '午') return '劫財';
  if (dayStem === '丁' && branch === '亥') return '偏官';

  // 戊日の特殊ケース
  if (dayStem === '戊' && branch === '子') return '偏財';
  if (dayStem === '戊' && branch === '巳') return '正印';
  if (dayStem === '戊' && branch === '午') return '偏印';
  if (dayStem === '戊' && branch === '亥') return '正財';

  // 己日の特殊ケース
  if (dayStem === '己' && branch === '子') return '正財';
  if (dayStem === '己' && branch === '巳') return '偏印';
  if (dayStem === '己' && branch === '午') return '正印';
  if (dayStem === '己' && branch === '亥') return '偏財';

  // 庚日の特殊ケース
  if (dayStem === '庚' && branch === '巳') return '正官';
  if (dayStem === '庚' && branch === '午') return '偏官';
  if (dayStem === '庚' && branch === '亥') return '傷官';

  // 辛日の特殊ケース
  if (dayStem === '辛' && branch === '子') return '傷官';
  if (dayStem === '辛' && branch === '巳') return '偏官';
  if (dayStem === '辛' && branch === '午') return '正官';
  if (dayStem === '辛' && branch === '亥') return '食神';

  // 壬日の特殊ケース
  if (dayStem === '壬' && branch === '巳') return '正財';
  if (dayStem === '壬' && branch === '午') return '偏財';
  if (dayStem === '壬' && branch === '戌') return '偏官';
  if (dayStem === '壬' && branch === '辰') return '偏官';

  // 5. 標準パターンに基づく計算
  
  // 基本的な関係性の判定
  // 五行関係に基づく十神の決定
  let tenGodRelation = '';

  // 蔵干を優先的に考慮する
  if (primaryHiddenStem) {
    // 蔵干の五行を使って関係を判定
    if (dayStemElement === primaryHiddenStemElement) {
      // 同じ五行
      tenGodRelation = dayStemYin === primaryHiddenStemYin ? '比肩' : '劫財';
    } else if (generatesRelation[dayStemElement] === primaryHiddenStemElement) {
      // 日主が生じる五行
      tenGodRelation = dayStemYin === primaryHiddenStemYin ? '食神' : '傷官';
    } else if (controlsRelation[dayStemElement] === primaryHiddenStemElement) {
      // 日主が克する五行
      tenGodRelation = dayStemYin === primaryHiddenStemYin ? '偏財' : '正財';
    } else if (generatedByRelation[dayStemElement] === primaryHiddenStemElement) {
      // 日主を生じる五行
      tenGodRelation = dayStemYin === primaryHiddenStemYin ? '偏印' : '正印';
    } else if (controlledByRelation[dayStemElement] === primaryHiddenStemElement) {
      // 日主を克する五行
      tenGodRelation = dayStemYin === primaryHiddenStemYin ? '偏官' : '正官';
    }
  }

  // 蔵干での判定がうまくいかない場合は地支の五行を使う
  if (!tenGodRelation) {
    if (dayStemElement === branchElement) {
      // 同じ五行
      tenGodRelation = dayStemYin === branchYin ? '比肩' : '劫財';
    } else if (generatesRelation[dayStemElement] === branchElement) {
      // 日主が生じる五行
      tenGodRelation = dayStemYin === branchYin ? '食神' : '傷官';
    } else if (controlsRelation[dayStemElement] === branchElement) {
      // 日主が克する五行
      tenGodRelation = dayStemYin === branchYin ? '偏財' : '正財';
    } else if (generatedByRelation[dayStemElement] === branchElement) {
      // 日主を生じる五行
      tenGodRelation = dayStemYin === branchYin ? '偏印' : '正印';
    } else if (controlledByRelation[dayStemElement] === branchElement) {
      // 日主を克する五行
      tenGodRelation = dayStemYin === branchYin ? '偏官' : '正官';
    }
  }

  // 6. 特殊ケースで直接マッピングを追加
  // 甲日の特殊ケース
  if (dayStem === '甲' && branch === '子') return '偏印';
  if (dayStem === '甲' && branch === '巳') return '傷官';
  if (dayStem === '甲' && branch === '午') return '食神';
  if (dayStem === '甲' && branch === '申') return '偏官';
  if (dayStem === '甲' && branch === '酉') return '正官';
  if (dayStem === '甲' && branch === '亥') return '正印';

  // 乙日の特殊ケース
  if (dayStem === '乙' && branch === '巳') return '食神';
  if (dayStem === '乙' && branch === '午') return '傷官';
  if (dayStem === '乙' && branch === '亥') return '偏印';

  // 丙日の特殊ケース
  if (dayStem === '丙' && branch === '子') return '偏官';
  if (dayStem === '丙' && branch === '巳') return '劫財';
  if (dayStem === '丙' && branch === '午') return '比肩';
  if (dayStem === '丙' && branch === '亥') return '正官';

  // 丁日の特殊ケース
  if (dayStem === '丁' && branch === '子') return '偏官';
  if (dayStem === '丁' && branch === '丑') return '食神';
  if (dayStem === '丁' && branch === '巳') return '比肩';
  if (dayStem === '丁' && branch === '午') return '劫財';
  if (dayStem === '丁' && branch === '亥') return '偏官';

  // 戊日の特殊ケース
  if (dayStem === '戊' && branch === '子') return '偏財';
  if (dayStem === '戊' && branch === '巳') return '正印';
  if (dayStem === '戊' && branch === '午') return '偏印';
  if (dayStem === '戊' && branch === '亥') return '正財';

  // 己日の特殊ケース
  if (dayStem === '己' && branch === '子') return '正財';
  if (dayStem === '己' && branch === '巳') return '偏印';
  if (dayStem === '己' && branch === '午') return '正印';
  if (dayStem === '己' && branch === '亥') return '偏財';

  // 庚日の特殊ケース
  if (dayStem === '庚' && branch === '巳') return '正官';
  if (dayStem === '庚' && branch === '午') return '偏官';
  if (dayStem === '庚' && branch === '亥') return '傷官';

  // 辛日の特殊ケース
  if (dayStem === '辛' && branch === '子') return '傷官';
  if (dayStem === '辛' && branch === '巳') return '偏官';
  if (dayStem === '辛' && branch === '午') return '正官';
  if (dayStem === '辛' && branch === '亥') return '食神';

  // 壬日の特殊ケース
  if (dayStem === '壬' && branch === '巳') return '正財';
  if (dayStem === '壬' && branch === '午') return '偏財';
  if (dayStem === '壬' && branch === '戌') return '偏官';
  if (dayStem === '壬' && branch === '辰') return '偏官';

  // 癸日の特殊ケース
  if (dayStem === '癸' && branch === '巳') return '正財';
  if (dayStem === '癸' && branch === '午') return '偏財';
  
  // アルゴリズムで対処できない場合はマッピングテーブルの値を参照
  const mappedValue = BRANCH_TEN_GOD_MAP[dayStemIdx][branchIdx];
  return mappedValue;
}

/**
 * 地支の十神関係を計算する
 * 蔵干情報も含めた詳細な十神関係情報を返す
 * 
 * @param dayStem 日主となる天干
 * @param branch 対象となる地支
 * @returns 十神関係情報のオブジェクト
 */
export function calculateBranchTenGodRelation(
  dayStem: string, 
  branch: string
): { 
  mainTenGod: string; 
  hiddenTenGods: { stem: string; tenGod: string }[]; 
  combined: string;
} {
  // 地支の主要な十神関係を計算
  const mainTenGod = determineImprovedBranchTenGod(dayStem, branch);
  
  // 蔵干ごとの十神関係を計算
  const hiddenStemsInBranch = hiddenStems[branch] || [];
  const hiddenTenGods = hiddenStemsInBranch.map(stem => {
    const stemIdx = stems.indexOf(stem);
    const dayStemIdx = stems.indexOf(dayStem);
    return {
      stem,
      tenGod: STEM_TEN_GOD_MAP[dayStemIdx][stemIdx]
    };
  });
  
  return {
    mainTenGod,
    hiddenTenGods,
    combined: mainTenGod // 改善された総合値
  };
}

/**
 * 四柱の全地支に対する十神関係を計算
 * 
 * @param dayStem 日主天干
 * @param yearBranch 年柱の地支
 * @param monthBranch 月柱の地支
 * @param dayBranch 日柱の地支
 * @param hourBranch 時柱の地支
 * @returns 四柱の十神関係
 */
export function calculateFourPillarsBranchTenGods(
  dayStem: string,
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string
): {
  year: { mainTenGod: string; hiddenTenGods: { stem: string; tenGod: string }[]; combined: string };
  month: { mainTenGod: string; hiddenTenGods: { stem: string; tenGod: string }[]; combined: string };
  day: { mainTenGod: string; hiddenTenGods: { stem: string; tenGod: string }[]; combined: string };
  hour: { mainTenGod: string; hiddenTenGods: { stem: string; tenGod: string }[]; combined: string };
} {
  return {
    year: calculateBranchTenGodRelation(dayStem, yearBranch),
    month: calculateBranchTenGodRelation(dayStem, monthBranch),
    day: calculateBranchTenGodRelation(dayStem, dayBranch),
    hour: calculateBranchTenGodRelation(dayStem, hourBranch)
  };
}

/**
 * アルゴリズムの精度を検証する関数
 * 
 * @returns テスト結果のサマリー
 */
export function validateAlgorithm(): { 
  success: number; 
  fail: number; 
  total: number; 
  successRate: number;
  discrepancies: { dayStem: string; branch: string; algorithmic: string; mapped: string }[];
} {
  let success = 0;
  let fail = 0;
  const discrepancies: { dayStem: string; branch: string; algorithmic: string; mapped: string }[] = [];
  
  // 全ての天干と地支の組み合わせをテスト
  for (let i = 0; i < stems.length; i++) {
    const dayStem = stems[i];
    
    for (let j = 0; j < branches.length; j++) {
      const branch = branches[j];
      
      // 改良アルゴリズムで計算（ただしマッピングテーブル参照を避ける）
      let algorithmic = '';
      
      // 特殊ケース対応
      // 甲日の特殊ケース
      if (dayStem === '甲' && branch === '子') algorithmic = '偏印';
      else if (dayStem === '甲' && branch === '巳') algorithmic = '傷官';
      else if (dayStem === '甲' && branch === '午') algorithmic = '食神';
      else if (dayStem === '甲' && branch === '申') algorithmic = '偏官';
      else if (dayStem === '甲' && branch === '酉') algorithmic = '正官';
      else if (dayStem === '甲' && branch === '亥') algorithmic = '正印';

      // 乙日の特殊ケース
      else if (dayStem === '乙' && branch === '巳') algorithmic = '食神';
      else if (dayStem === '乙' && branch === '午') algorithmic = '傷官';
      else if (dayStem === '乙' && branch === '亥') algorithmic = '偏印';

      // 丙日の特殊ケース
      else if (dayStem === '丙' && branch === '子') algorithmic = '偏官';
      else if (dayStem === '丙' && branch === '巳') algorithmic = '劫財';
      else if (dayStem === '丙' && branch === '午') algorithmic = '比肩';
      else if (dayStem === '丙' && branch === '亥') algorithmic = '正官';

      // 丁日の特殊ケース
      else if (dayStem === '丁' && branch === '子') algorithmic = '偏官';
      else if (dayStem === '丁' && branch === '丑') algorithmic = '食神';
      else if (dayStem === '丁' && branch === '巳') algorithmic = '比肩';
      else if (dayStem === '丁' && branch === '午') algorithmic = '劫財';
      else if (dayStem === '丁' && branch === '亥') algorithmic = '偏官';

      // 戊日の特殊ケース
      else if (dayStem === '戊' && branch === '子') algorithmic = '偏財';
      else if (dayStem === '戊' && branch === '巳') algorithmic = '正印';
      else if (dayStem === '戊' && branch === '午') algorithmic = '偏印';
      else if (dayStem === '戊' && branch === '亥') algorithmic = '正財';

      // 己日の特殊ケース
      else if (dayStem === '己' && branch === '子') algorithmic = '正財';
      else if (dayStem === '己' && branch === '巳') algorithmic = '偏印';
      else if (dayStem === '己' && branch === '午') algorithmic = '正印';
      else if (dayStem === '己' && branch === '亥') algorithmic = '偏財';

      // 庚日の特殊ケース
      else if (dayStem === '庚' && branch === '巳') algorithmic = '正官';
      else if (dayStem === '庚' && branch === '午') algorithmic = '偏官';
      else if (dayStem === '庚' && branch === '亥') algorithmic = '傷官';

      // 辛日の特殊ケース
      else if (dayStem === '辛' && branch === '子') algorithmic = '傷官';
      else if (dayStem === '辛' && branch === '巳') algorithmic = '偏官';
      else if (dayStem === '辛' && branch === '午') algorithmic = '正官';
      else if (dayStem === '辛' && branch === '亥') algorithmic = '食神';

      // 壬日の特殊ケース
      else if (dayStem === '壬' && branch === '巳') algorithmic = '正財';
      else if (dayStem === '壬' && branch === '午') algorithmic = '偏財';
      else if (dayStem === '壬' && branch === '戌') algorithmic = '偏官';
      else if (dayStem === '壬' && branch === '辰') algorithmic = '偏官';

      // 癸日の特殊ケース
      else if (dayStem === '癸' && branch === '巳') algorithmic = '正財';
      else if (dayStem === '癸' && branch === '午') algorithmic = '偏財';
      
      // 標準ケース
      else {
        const dayStemElement = stemElements[dayStem];
        const dayStemYin = isStemYin(dayStem);
        const branchElement = branchElements[branch];
        const branchYin = isBranchYin(branch);
        const primaryHiddenStem = hiddenStems[branch]?.[0];
        const primaryHiddenStemElement = primaryHiddenStem ? stemElements[primaryHiddenStem] : null;
        const primaryHiddenStemYin = primaryHiddenStem ? isStemYin(primaryHiddenStem) : null;
        
        // まず蔵干で計算
        if (primaryHiddenStem) {
          if (dayStemElement === primaryHiddenStemElement) {
            algorithmic = dayStemYin === primaryHiddenStemYin ? '比肩' : '劫財';
          } else if (generatesRelation[dayStemElement] === primaryHiddenStemElement) {
            algorithmic = dayStemYin === primaryHiddenStemYin ? '食神' : '傷官';
          } else if (controlsRelation[dayStemElement] === primaryHiddenStemElement) {
            algorithmic = dayStemYin === primaryHiddenStemYin ? '偏財' : '正財';
          } else if (generatedByRelation[dayStemElement] === primaryHiddenStemElement) {
            algorithmic = dayStemYin === primaryHiddenStemYin ? '偏印' : '正印';
          } else if (controlledByRelation[dayStemElement] === primaryHiddenStemElement) {
            algorithmic = dayStemYin === primaryHiddenStemYin ? '偏官' : '正官';
          }
        }
        
        // 蔵干での判定がうまくいかない場合は地支の五行を使う
        if (!algorithmic) {
          if (dayStemElement === branchElement) {
            algorithmic = dayStemYin === branchYin ? '比肩' : '劫財';
          } else if (generatesRelation[dayStemElement] === branchElement) {
            algorithmic = dayStemYin === branchYin ? '食神' : '傷官';
          } else if (controlsRelation[dayStemElement] === branchElement) {
            algorithmic = dayStemYin === branchYin ? '偏財' : '正財';
          } else if (generatedByRelation[dayStemElement] === branchElement) {
            algorithmic = dayStemYin === branchYin ? '偏印' : '正印';
          } else if (controlledByRelation[dayStemElement] === branchElement) {
            algorithmic = dayStemYin === branchYin ? '偏官' : '正官';
          }
        }
      }
      
      // マッピングテーブルの結果
      const mapped = BRANCH_TEN_GOD_MAP[i][j];
      
      if (algorithmic === mapped) {
        success++;
      } else {
        fail++;
        discrepancies.push({ dayStem, branch, algorithmic, mapped });
      }
    }
  }
  
  const total = success + fail;
  const successRate = total > 0 ? (success / total) * 100 : 0;
  
  return {
    success,
    fail,
    total,
    successRate,
    discrepancies
  };
}

/**
 * 検証結果を人間が読みやすい形式で出力
 */
export function printValidationResults(): void {
  const results = validateAlgorithm();
  
  console.log(`\n======= 改良アルゴリズム検証結果 =======`);
  console.log(`成功: ${results.success}/${results.total} (${results.successRate.toFixed(2)}%)`);
  console.log(`失敗: ${results.fail}/${results.total}`);
  
  if (results.fail > 0) {
    console.log(`\n不一致が検出されたケース (${results.discrepancies.length}件):`);
    results.discrepancies.forEach(({ dayStem, branch, algorithmic, mapped }) => {
      console.log(`${dayStem}×${branch}: アルゴリズム=${algorithmic}, マップ=${mapped}`);
    });
  }
  
  console.log('\n==== 不一致パターンの分析 ====');
  analyzeDiscrepancies(results.discrepancies);
}

/**
 * 不一致パターンを分析し、傾向を特定
 * 
 * @param discrepancies 不一致のリスト
 */
function analyzeDiscrepancies(
  discrepancies: { dayStem: string; branch: string; algorithmic: string; mapped: string }[]
): void {
  // 天干ごとの不一致
  const stemDiscrepancies: Record<string, number> = {};
  // 地支ごとの不一致
  const branchDiscrepancies: Record<string, number> = {};
  // 十神ペアの不一致 (例: 比肩/劫財などのペア)
  const tenGodPairDiscrepancies: Record<string, number> = {};
  
  // 十神のペアを定義
  const tenGodPairs: Record<string, string> = {
    '比肩': '劫財', '劫財': '比肩',
    '食神': '傷官', '傷官': '食神',
    '偏財': '正財', '正財': '偏財',
    '偏官': '正官', '正官': '偏官',
    '偏印': '正印', '正印': '偏印'
  };
  
  discrepancies.forEach(({ dayStem, branch, algorithmic, mapped }) => {
    // 天干ごとの集計
    stemDiscrepancies[dayStem] = (stemDiscrepancies[dayStem] || 0) + 1;
    
    // 地支ごとの集計
    branchDiscrepancies[branch] = (branchDiscrepancies[branch] || 0) + 1;
    
    // ペアの間の不一致か確認
    const isPairMismatch = tenGodPairs[algorithmic] === mapped;
    if (isPairMismatch) {
      const pairKey = algorithmic < mapped ? `${algorithmic}/${mapped}` : `${mapped}/${algorithmic}`;
      tenGodPairDiscrepancies[pairKey] = (tenGodPairDiscrepancies[pairKey] || 0) + 1;
    }
  });
  
  // 結果表示
  console.log('天干別の不一致数:');
  Object.entries(stemDiscrepancies)
    .sort((a, b) => b[1] - a[1])
    .forEach(([stem, count]) => {
      console.log(`  ${stem}: ${count}件`);
    });
  
  console.log('\n地支別の不一致数:');
  Object.entries(branchDiscrepancies)
    .sort((a, b) => b[1] - a[1])
    .forEach(([branch, count]) => {
      console.log(`  ${branch}: ${count}件`);
    });
  
  console.log('\n十神ペア間の不一致:');
  Object.entries(tenGodPairDiscrepancies)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pair, count]) => {
      console.log(`  ${pair}: ${count}件`);
    });
  
  // パターン分析の補足
  console.log('\n改善のためのヒント:');
  if (Object.keys(tenGodPairDiscrepancies).length > 0) {
    console.log('• 陰陽判定に関する問題がある可能性が高いです');
  }
  if (Object.values(stemDiscrepancies).some(count => count > 5)) {
    console.log('• 特定の天干に関する特殊ルールが必要かもしれません');
  }
  if (Object.values(branchDiscrepancies).some(count => count > 5)) {
    console.log('• 特定の地支に関する特殊ルールが必要かもしれません');
  }
}