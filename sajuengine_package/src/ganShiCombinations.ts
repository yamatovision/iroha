/**
 * 干合・支合の処理を行うモジュール
 * 四柱推命における干合（天干の組み合わせ）と支合（地支の組み合わせ）の
 * 変化ルールを実装
 */

import { Pillar, FourPillars } from './types';
import { STEM_ELEMENTS, BRANCH_ELEMENTS, getElementFromStem, getElementFromBranch, isStemYin } from './tenGodCalculator';

/**
 * 干合のペア定義
 * 各天干が干合を起こす相手の天干
 */
const GAN_COMBINATION_PAIRS: Record<string, string> = {
  '甲': '己',
  '己': '甲',
  '乙': '庚',
  '庚': '乙',
  '丙': '辛',
  '辛': '丙',
  '丁': '壬',
  '壬': '丁',
  '戊': '癸',
  '癸': '戊'
};

/**
 * 干合による変化後の天干
 * 特定の天干が干合によって変化する先の天干
 */
const GAN_COMBINATION_TRANSFORM: Record<string, string> = {
  '甲': '戊', // 甲が己と干合すると甲は戊に変化
  '乙': '辛', // 乙が庚と干合すると乙は辛に変化
  '丙': '壬', // 丙が辛と干合すると丙は壬に変化
  '丁': '乙', // 丁が壬と干合すると丁は乙に変化
  '壬': '甲', // 丁が壬と干合すると壬は甲に変化
  '戊': '丙', // 戊が癸と干合すると戊は丙に変化
  '癸': '丁'  // 戊が癸と干合すると癸は丁に変化
};

/**
 * 支合のペア定義
 * 各地支が支合を起こす相手の地支
 */
const ZHI_COMBINATION_PAIRS: Record<string, string> = {
  '子': '丑',
  '丑': '子',
  '寅': '亥',
  '亥': '寅',
  '卯': '戌',
  '戌': '卯',
  '辰': '酉',
  '酉': '辰',
  '巳': '申',
  '申': '巳',
  '午': '未',
  '未': '午'
};

/**
 * 支合による五行の変化
 * 特定の地支ペアが支合によって強まる五行
 */
const ZHI_COMBINATION_ELEMENT: Record<string, string> = {
  '子丑': '土', // 子と丑が支合すると土の力量が強まる
  '寅亥': '木', // 寅と亥が支合すると木の力量が強まる
  '卯戌': '火', // 卯と戌が支合すると火の力量が強まる
  '辰酉': '金', // 辰と酉が支合すると金の力量が強まる
  '巳申': '水', // 巳と申が支合すると水の力量が強まる
  '午未': '火'  // 午と未が支合すると火の力量が強まる
};

/**
 * 支冲の組み合わせ
 * 各地支と反発し合う関係にある地支
 */
const ZHI_CONFLICT_PAIRS: Record<string, string> = {
  '子': '午',
  '午': '子',
  '丑': '未',
  '未': '丑',
  '寅': '申',
  '申': '寅',
  '卯': '酉',
  '酉': '卯',
  '辰': '戌',
  '戌': '辰',
  '巳': '亥',
  '亥': '巳'
};

/**
 * 干合の判定と変化を処理
 * 隣接する天干間の干合を検出し、条件に合致する場合に変化を適用
 * 
 * @param stems 四柱の天干の配列 [年柱天干, 月柱天干, 日柱天干, 時柱天干]
 * @param branches 四柱の地支の配列 [年柱地支, 月柱地支, 日柱地支, 時柱地支]
 * @returns 干合変化後の天干の配列
 */
export function processStemCombinations(
  stems: string[],
  branches: string[]
): string[] {
  // 結果の天干配列（初期値は変化なし）
  const resultStems = [...stems];
  
  // 隣接する柱間（年-月, 月-日, 日-時）の干合をチェック
  for (let i = 0; i < 3; i++) {
    const stem1 = resultStems[i];
    const stem2 = resultStems[i + 1];
    
    // 天干が干合ペアの関係にあるか確認
    if (GAN_COMBINATION_PAIRS[stem1] === stem2) {
      console.log(`干合検出: ${stem1}${stem2}`);
      
      // 姻合（妬合）の判定 - 両側から干合を受ける天干があれば変化しない
      if (i < 2 && GAN_COMBINATION_PAIRS[stem2] === resultStems[i + 2]) {
        console.log(`  ${stem2}は姻合状態のため変化しません`);
        continue;
      }
      if (i > 0 && GAN_COMBINATION_PAIRS[stem1] === resultStems[i - 1]) {
        console.log(`  ${stem1}は姻合状態のため変化しません`);
        continue;
      }
      
      // プラスαの変化条件チェック
      const monthBranchIndex = 1; // 月柱の地支のインデックス
      const monthBranch = branches[monthBranchIndex];
      
      // 1. 甲己の干合 - 月支に土の気が多く、木の気が無いことが条件
      if ((stem1 === '甲' && stem2 === '己') || (stem1 === '己' && stem2 === '甲')) {
        const monthElement = getElementFromBranch(monthBranch);
        const hasWoodElement = stems.some(s => getElementFromStem(s) === '木' && s !== '甲');
        
        if (monthElement === '土' || 
            ['丑', '辰', '未', '戌'].includes(monthBranch)) {
          if (!hasWoodElement) {
            // 甲が変化
            if (stem1 === '甲') resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
            if (stem2 === '甲') resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
            console.log(`  甲己合化土: 甲→戊 (己は不変)`);
          }
        }
      }
      
      // 2. 乙庚の干合 - 月支に金の気が多く、火の気が無いことが条件
      else if ((stem1 === '乙' && stem2 === '庚') || (stem1 === '庚' && stem2 === '乙')) {
        const monthElement = getElementFromBranch(monthBranch);
        const hasFireElement = stems.some(s => getElementFromStem(s) === '火');
        
        if (monthElement === '金' || 
            ['申', '酉'].includes(monthBranch)) {
          if (!hasFireElement) {
            // 乙が変化
            if (stem1 === '乙') resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
            if (stem2 === '乙') resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
            console.log(`  乙庚合化金: 乙→辛 (庚は不変)`);
          }
        }
      }
      
      // 3. 丙辛の干合 - 月支に水の気が多く、土の気が無いことが条件
      else if ((stem1 === '丙' && stem2 === '辛') || (stem1 === '辛' && stem2 === '丙')) {
        const monthElement = getElementFromBranch(monthBranch);
        const hasEarthElement = stems.some(s => getElementFromStem(s) === '土');
        
        if (monthElement === '水' || 
            ['子', '亥'].includes(monthBranch)) {
          if (!hasEarthElement) {
            // 丙が変化
            if (stem1 === '丙') resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
            if (stem2 === '丙') resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
            console.log(`  丙辛合化水: 丙→壬 (辛は不変)`);
          }
        }
      }
      
      // 4. 丁壬の干合 - 月支に木の気が多く、金の気が無いことが条件
      else if ((stem1 === '丁' && stem2 === '壬') || (stem1 === '壬' && stem2 === '丁')) {
        const monthElement = getElementFromBranch(monthBranch);
        const hasMetalElement = stems.some(s => getElementFromStem(s) === '金');
        
        if (monthElement === '木' || 
            ['寅', '卯'].includes(monthBranch)) {
          if (!hasMetalElement) {
            // 丁と壬が変化
            if (stem1 === '丁') resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
            if (stem2 === '丁') resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
            
            if (stem1 === '壬') resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
            if (stem2 === '壬') resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
            console.log(`  丁壬合化木: 丁→乙, 壬→甲`);
          }
        }
      }
      
      // 5. 戊癸の干合 - 月支に火の気が多く、水の気が無いことが条件
      else if ((stem1 === '戊' && stem2 === '癸') || (stem1 === '癸' && stem2 === '戊')) {
        const monthElement = getElementFromBranch(monthBranch);
        const hasWaterElement = stems.some(s => getElementFromStem(s) === '水' && s !== '癸');
        
        if (monthElement === '火' || 
            ['巳', '午'].includes(monthBranch)) {
          if (!hasWaterElement) {
            // 戊と癸が変化
            if (stem1 === '戊') resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
            if (stem2 === '戊') resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
            
            if (stem1 === '癸') resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
            if (stem2 === '癸') resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
            console.log(`  戊癸合化火: 戊→丙, 癸→丁`);
          }
        }
      }
    }
  }
  
  return resultStems;
}

/**
 * 地支の支合情報の型定義
 */
export interface BranchCombinationResult {
  branches: string[];         // 変化後の地支
  enhancedElements: string[]; // 各地支の強化された五行
  hasChanged: boolean[];      // 各地支が変化したかどうか
}

/**
 * 支合の判定と変化を処理
 * 隣接する地支間の支合を検出し、条件に合致する場合に五行の変化を適用
 * 
 * @param branches 四柱の地支の配列 [年柱地支, 月柱地支, 日柱地支, 時柱地支]
 * @param stems 四柱の天干の配列 [年柱天干, 月柱天干, 日柱天干, 時柱天干]
 * @returns 支合変化後の情報（地支の配列と強化された五行の配列）
 */
export function processBranchCombinations(
  branches: string[],
  stems: string[]
): BranchCombinationResult {
  // 結果の地支配列（初期値は変化なし）
  const resultBranches = [...branches];
  // 強化された五行配列（初期値は各地支の通常の五行）
  const enhancedElements = branches.map(branch => getElementFromBranch(branch));
  // 変化フラグ配列
  const hasChanged = branches.map(() => false);
  
  // 隣接する柱間（年-月, 月-日, 日-時）の支合をチェック
  for (let i = 0; i < 3; i++) {
    const branch1 = resultBranches[i];
    const branch2 = resultBranches[i + 1];
    
    // 地支が支合ペアの関係にあるか確認
    if (ZHI_COMBINATION_PAIRS[branch1] === branch2) {
      console.log(`支合検出: ${branch1}${branch2}`);
      
      // 支冲（地支の対立関係）があると支合が打ち消される
      const nextIndex = i + 2;
      if (nextIndex < 4) {
        const nextBranch = resultBranches[nextIndex];
        if (ZHI_CONFLICT_PAIRS[branch1] === nextBranch || ZHI_CONFLICT_PAIRS[branch2] === nextBranch) {
          console.log(`  支冲があるため支合効果が打ち消されます`);
          continue;
        }
      }
      
      const prevIndex = i - 1;
      if (prevIndex >= 0) {
        const prevBranch = resultBranches[prevIndex];
        if (ZHI_CONFLICT_PAIRS[branch1] === prevBranch || ZHI_CONFLICT_PAIRS[branch2] === prevBranch) {
          console.log(`  支冲があるため支合効果が打ち消されます`);
          continue;
        }
      }
      
      // 1つの地支が両隣から支合を受ける場合（姻合に似た状態）は効果が打ち消される
      if (i < 2 && i > 0) {
        const branch3 = resultBranches[i + 2];
        if (ZHI_COMBINATION_PAIRS[branch2] === branch3) {
          console.log(`  ${branch2}は両隣から支合を受けるため効果が打ち消されます`);
          continue;
        }
        
        const branch0 = resultBranches[i - 1];
        if (ZHI_COMBINATION_PAIRS[branch1] === branch0) {
          console.log(`  ${branch1}は両隣から支合を受けるため効果が打ち消されます`);
          continue;
        }
      }
      
      // 支合による五行の強化処理
      // 支合ペアを順序正規化（例:「丑子」→「子丑」）
      const sortedPair = [branch1, branch2].sort().join('');
      const combinedElement = ZHI_COMBINATION_ELEMENT[sortedPair];
      
      // プラスαの変化条件チェック
      let canTransform = false;
      const dayMaster = stems[2]; // 日主（日柱の天干）
      const dayMasterElement = getElementFromStem(dayMaster);
      
      // 各支合タイプごとの条件チェック
      switch (sortedPair) {
        case '子丑': // 子丑合化土 - 天干に戊・己・丑・辰・未・戌があり、木の気がないこと
          const hasEarthStem = stems.some(s => ['戊', '己'].includes(s));
          const hasWoodElement = stems.some(s => getElementFromStem(s) === '木');
          canTransform = hasEarthStem && !hasWoodElement;
          break;
          
        case '亥寅': // 寅亥合化木 - 天干に甲・乙・寅・卯があり、金の気がないこと
          const hasWoodStem = stems.some(s => ['甲', '乙'].includes(s));
          const hasMetalElement = stems.some(s => getElementFromStem(s) === '金');
          canTransform = hasWoodStem && !hasMetalElement;
          break;
          
        case '卯戌': // 卯戌合化火 - 天干に丙・丁・巳・午があり、水の気がないこと
          const hasFireStem = stems.some(s => ['丙', '丁'].includes(s));
          const hasWaterElement = stems.some(s => getElementFromStem(s) === '水');
          canTransform = hasFireStem && !hasWaterElement;
          break;
          
        case '辰酉': // 辰酉合化金 - 天干に庚・辛・申・酉があり、火の気がないこと
          const hasMetalStem = stems.some(s => ['庚', '辛'].includes(s));
          const hasFireElement = stems.some(s => getElementFromStem(s) === '火');
          canTransform = hasMetalStem && !hasFireElement;
          break;
          
        case '巳申': // 巳申合化水 - 天干に壬・癸・子・亥があり、土の気がないこと
          const hasWaterStem = stems.some(s => ['壬', '癸'].includes(s));
          const hasEarthElement = stems.some(s => getElementFromStem(s) === '土');
          canTransform = hasWaterStem && !hasEarthElement;
          break;
          
        case '午未': // 午未合化火 - 天干に丙・丁・甲・乙があり、水の気がないこと
          const hasFireOrWoodStem = stems.some(s => ['丙', '丁', '甲', '乙'].includes(s));
          const hasWaterElementIn午未 = stems.some(s => getElementFromStem(s) === '水');
          canTransform = hasFireOrWoodStem && !hasWaterElementIn午未;
          break;
      }
      
      if (canTransform && combinedElement) {
        console.log(`  支合変化条件を満たしています: ${branch1}${branch2}合化${combinedElement}`);
        
        // 五行の強化を適用
        enhancedElements[i] = combinedElement;
        enhancedElements[i + 1] = combinedElement;
        
        // 変化フラグを設定
        hasChanged[i] = true;
        hasChanged[i + 1] = true;
      } else {
        console.log(`  支合変化条件を満たしていません`);
      }
    }
  }
  
  return {
    branches: resultBranches,
    enhancedElements,
    hasChanged
  };
}

/**
 * 四柱に干合・支合の処理を適用
 * 
 * @param fourPillars 元の四柱
 * @returns 干合・支合処理後の四柱
 */
export function applyGanShiCombinations(fourPillars: FourPillars): FourPillars {
  // 元の四柱から天干と地支を抽出
  const stems = [
    fourPillars.yearPillar.stem,
    fourPillars.monthPillar.stem,
    fourPillars.dayPillar.stem,
    fourPillars.hourPillar.stem
  ];
  
  const branches = [
    fourPillars.yearPillar.branch,
    fourPillars.monthPillar.branch,
    fourPillars.dayPillar.branch,
    fourPillars.hourPillar.branch
  ];
  
  console.log('干合・支合処理開始:');
  console.log('  元の四柱:', `${stems[0]}${branches[0]} ${stems[1]}${branches[1]} ${stems[2]}${branches[2]} ${stems[3]}${branches[3]}`);
  
  // 干合の処理
  const transformedStems = processStemCombinations(stems, branches);
  
  // 支合の処理
  const branchResult = processBranchCombinations(branches, transformedStems);
  
  // 処理結果を四柱に適用
  const result: FourPillars = {
    ...fourPillars,
    yearPillar: {
      ...fourPillars.yearPillar,
      stem: transformedStems[0],
      enhancedElement: branchResult.hasChanged[0] ? branchResult.enhancedElements[0] : undefined
    },
    monthPillar: {
      ...fourPillars.monthPillar,
      stem: transformedStems[1],
      enhancedElement: branchResult.hasChanged[1] ? branchResult.enhancedElements[1] : undefined
    },
    dayPillar: {
      ...fourPillars.dayPillar,
      stem: transformedStems[2],
      enhancedElement: branchResult.hasChanged[2] ? branchResult.enhancedElements[2] : undefined
    },
    hourPillar: {
      ...fourPillars.hourPillar,
      stem: transformedStems[3],
      enhancedElement: branchResult.hasChanged[3] ? branchResult.enhancedElements[3] : undefined
    }
  };
  
  // 各柱の天干に変化があった場合、fullStemBranchを更新
  if (transformedStems[0] !== stems[0]) {
    result.yearPillar.fullStemBranch = transformedStems[0] + branches[0];
  }
  if (transformedStems[1] !== stems[1]) {
    result.monthPillar.fullStemBranch = transformedStems[1] + branches[1];
  }
  if (transformedStems[2] !== stems[2]) {
    result.dayPillar.fullStemBranch = transformedStems[2] + branches[2];
  }
  if (transformedStems[3] !== stems[3]) {
    result.hourPillar.fullStemBranch = transformedStems[3] + branches[3];
  }
  
  console.log('干合・支合処理後:');
  console.log('  変換後の四柱:', `${transformedStems[0]}${branches[0]} ${transformedStems[1]}${branches[1]} ${transformedStems[2]}${branches[2]} ${transformedStems[3]}${branches[3]}`);
  
  return result;
}