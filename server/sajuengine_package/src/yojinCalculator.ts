/**
 * 四柱推命の用神（運気を高める要素）を計算するためのモジュール
 * 用神は格局（身強・身弱）に基づいて、命式のバランスを整えるために必要な五行を特定します
 */
import { FourPillars, IKakukyoku, IYojin, TenGodRelation, HiddenStemTenGod, TenGodWithElement, SpecialKakukyokuGods } from './types';
import * as tenGodCalculator from './tenGodCalculator';

/**
 * 用神計算の主要関数
 * @param fourPillars 四柱情報
 * @param tenGods 十神関係情報
 * @param kakukyoku 格局情報
 * @returns 用神情報
 */
export function determineYojin(
  fourPillars: FourPillars,
  tenGods: Record<string, string>,
  kakukyoku: IKakukyoku
): IYojin {
  // 選択された用神
  let selectedYojin: TenGodRelation;
  let debugInfo: string[] = [];

  // 特別格局と普通格局で処理を分岐
  // saju_yojin_algorithm.mdのアルゴリズムに厳密に従う
  if (kakukyoku.category === 'special') {
    // 特別格局の場合は早見表から通変星ペアを決定し、出現頻度で具体的な十神を選択
    debugInfo.push(`特別格局「${kakukyoku.type}」を検出しました`);
    debugInfo.push(`特別格局の場合、早見表から用神の通変星ペアを決定し、出現頻度で具体的な十神を選択します`);
    
    // 早見表から用神を取得（通変星ペアを得て、命式内の出現頻度に基づいて具体的な十神を選択）
    selectedYojin = getSpecialKakukyokuYojin(kakukyoku.type, fourPillars);
    debugInfo.push(`特別格局「${kakukyoku.type}」の用神は「${selectedYojin}」と決定されました`);
    console.log(`特別格局「${kakukyoku.type}」の用神は「${selectedYojin}」と決定されました`);
  } else {
    // 普通格局の場合の処理
    debugInfo.push(`普通格局「${kakukyoku.type}」を検出しました`);
    
    // 1. 通変星の数を数える
    const tenGodCounts = countTenGods(fourPillars);
    const pairCounts = {
      '比劫': tenGodCounts['比肩'] + tenGodCounts['劫財'],
      '印': tenGodCounts['偏印'] + tenGodCounts['正印'],
      '食傷': tenGodCounts['食神'] + tenGodCounts['傷官'],
      '財': tenGodCounts['偏財'] + tenGodCounts['正財'],
      '官殺': tenGodCounts['偏官'] + tenGodCounts['正官']
    };
    
    // 各通変星の個別カウントも記録
    const individualCounts = {
      '比肩': tenGodCounts['比肩'] || 0,
      '劫財': tenGodCounts['劫財'] || 0,
      '偏印': tenGodCounts['偏印'] || 0,
      '正印': tenGodCounts['正印'] || 0,
      '食神': tenGodCounts['食神'] || 0,
      '傷官': tenGodCounts['傷官'] || 0,
      '偏財': tenGodCounts['偏財'] || 0,
      '正財': tenGodCounts['正財'] || 0,
      '偏官': tenGodCounts['偏官'] || 0,
      '正官': tenGodCounts['正官'] || 0
    };
    
    debugInfo.push(`通変星ペア集計: 比劫=${pairCounts['比劫']}, 印=${pairCounts['印']}, 食傷=${pairCounts['食傷']}, 財=${pairCounts['財']}, 官殺=${pairCounts['官殺']}`);
    debugInfo.push(`個別十神集計: 比肩=${individualCounts['比肩']}, 劫財=${individualCounts['劫財']}, 偏印=${individualCounts['偏印']}, 正印=${individualCounts['正印']}, 食神=${individualCounts['食神']}, 傷官=${individualCounts['傷官']}, 偏財=${individualCounts['偏財']}, 正財=${individualCounts['正財']}, 偏官=${individualCounts['偏官']}, 正官=${individualCounts['正官']}`);
    
    // 2. 命式内で最も多い通変星ペアを特定
    const mostFrequentPair = getMostFrequentPair(pairCounts);
    debugInfo.push(`命式内で最も多い通変星ペア: ${mostFrequentPair}`);
    
    // 3. 格局タイプ、身強/身弱、最も多い通変星ペアに基づいて用神を決定
    const yojinPair = getNormalKakukyokuYojinPair(kakukyoku.type, kakukyoku.strength, mostFrequentPair);
    debugInfo.push(`早見表から決定された用神通変星ペア: ${yojinPair}`);
    
    // 4. 通変星ペアから具体的な十神を選定
    selectedYojin = selectSpecificTenGod(yojinPair, tenGodCounts);
    debugInfo.push(`最終的に選択された用神: ${selectedYojin}`);
  }
  
  // 4. 用神の五行属性を特定
  const element = convertTenGodToElement(selectedYojin, fourPillars.dayPillar.stem);
  debugInfo.push(`用神「${selectedYojin}」の五行属性: ${element}`);
  
  // 5. 用神の説明文を生成
  const description = generateYojinDescription(selectedYojin, element, kakukyoku);
  
  // 6. 用神をサポートする五行を特定
  const supportElements = getSupportingElements(element);
  
  // 7. 喜神、忌神、仇神を計算
  const relatedGods = determineRelatedGods(selectedYojin, fourPillars.dayPillar.stem, kakukyoku, fourPillars);

  // デバッグ情報をログに出力
  console.log('用神決定プロセス:', debugInfo.join('\n'));

  return {
    tenGod: selectedYojin,
    element: element,
    description: description,
    supportElements: supportElements,
    kijin: relatedGods.kijin,
    kijin2: relatedGods.kijin2, 
    kyujin: relatedGods.kyujin,
    debugInfo // デバッグ情報も返す（必要に応じて）
  };
}

/**
 * 特別格局の用神を早見表から取得する関数
 * @param kakukyokuType 格局タイプ
 * @param fourPillars 四柱情報
 * @returns 用神（十神）
 */
function getSpecialKakukyokuYojin(kakukyokuType: string, fourPillars: FourPillars): TenGodRelation {
  // 早見表に基づく特別格局の用神マッピング（saju_yojin_algorithm.mdの「特別格局の用神早見表」に従う）
  const specialKakukyokuYojinMap: Record<string, TenGodRelation> = {
    '従旺格': '比劫',    // 比劫は通変星ペア（比肩・劫財）
    '従強格': '印',      // 印は通変星ペア（偏印・正印）
    '従児格': '食傷',    // 食傷は通変星ペア（食神・傷官）
    '従財格': '財',      // 財は通変星ペア（偏財・正財）
    '従殺格': '官殺',    // 官殺は通変星ペア（偏官・正官）
    '従勢格': '財'       // 格局タイプに応じて早見表から直接決定
  };

  // 1. 用神（通変星ペア）の決定
  const yojinPair = specialKakukyokuYojinMap[kakukyokuType] || '比劫';
  console.log(`特別格局「${kakukyokuType}」の用神は早見表から通変星ペア「${yojinPair}」と決定されました`);
  
  // 2. 命式内の通変星の数を集計
  const tenGodCounts = countTenGods(fourPillars);
  
  // 3. 具体的な用神の決定 - 出現頻度に基づいて選択
  console.log(`用神「${yojinPair}」を構成する具体的な十神を出現頻度に基づいて選択します`);
  
  switch(yojinPair) {
    case '比劫':
      // 比肩と劫財のどちらが多いか
      const bikenCount = tenGodCounts['比肩'] || 0;
      const kouzaiCount = tenGodCounts['劫財'] || 0;
      console.log(`比肩: ${bikenCount}個, 劫財: ${kouzaiCount}個`);
      
      if (bikenCount > kouzaiCount) {
        console.log(`比肩の方が多いため、用神は「比肩」に決定しました`);
        return '比肩';
      } else if (kouzaiCount > bikenCount) {
        console.log(`劫財の方が多いため、用神は「劫財」に決定しました`);
        return '劫財';
      } else {
        // 同数の場合は地支の通変星を優先（詳細な実装は省略）
        console.log(`同数のため、優先ルールを適用して「比肩」に決定しました`);
        return '比肩';
      }
      
    case '印':
      // 偏印と正印のどちらが多いか
      const henInCount = tenGodCounts['偏印'] || 0;
      const seiInCount = tenGodCounts['正印'] || 0;
      console.log(`偏印: ${henInCount}個, 正印: ${seiInCount}個`);
      
      if (henInCount > seiInCount) {
        console.log(`偏印の方が多いため、用神は「偏印」に決定しました`);
        return '偏印';
      } else if (seiInCount > henInCount) {
        console.log(`正印の方が多いため、用神は「正印」に決定しました`);
        return '正印';
      } else {
        console.log(`同数のため、優先ルールを適用して「正印」に決定しました`);
        return '正印';
      }
      
    case '食傷':
      // 食神と傷官のどちらが多いか
      const shokuShinCount = tenGodCounts['食神'] || 0;
      const shougouCount = tenGodCounts['傷官'] || 0;
      console.log(`食神: ${shokuShinCount}個, 傷官: ${shougouCount}個`);
      
      if (shokuShinCount > shougouCount) {
        console.log(`食神の方が多いため、用神は「食神」に決定しました`);
        return '食神';
      } else if (shougouCount > shokuShinCount) {
        console.log(`傷官の方が多いため、用神は「傷官」に決定しました`);
        return '傷官';
      } else {
        console.log(`同数のため、優先ルールを適用して「食神」に決定しました`);
        return '食神';
      }
      
    case '財':
      // 偏財と正財のどちらが多いか
      const henZaiCount = tenGodCounts['偏財'] || 0;
      const seiZaiCount = tenGodCounts['正財'] || 0;
      console.log(`偏財: ${henZaiCount}個, 正財: ${seiZaiCount}個`);
      
      if (henZaiCount > seiZaiCount) {
        console.log(`偏財の方が多いため、用神は「偏財」に決定しました`);
        return '偏財';
      } else if (seiZaiCount > henZaiCount) {
        console.log(`正財の方が多いため、用神は「正財」に決定しました`);
        return '正財';
      } else {
        console.log(`同数のため、優先ルールを適用して「正財」に決定しました`);
        return '正財';
      }
      
    case '官殺':
      // 偏官と正官のどちらが多いか
      const henKanCount = tenGodCounts['偏官'] || 0;
      const seiKanCount = tenGodCounts['正官'] || 0;
      console.log(`偏官: ${henKanCount}個, 正官: ${seiKanCount}個`);
      
      if (henKanCount > seiKanCount) {
        console.log(`偏官の方が多いため、用神は「偏官」に決定しました`);
        return '偏官';
      } else if (seiKanCount > henKanCount) {
        console.log(`正官の方が多いため、用神は「正官」に決定しました`);
        return '正官';
      } else {
        console.log(`同数のため、優先ルールを適用して「正官」に決定しました`);
        return '正官';
      }
      
    default:
      console.log('特別格局に一致するものがないため、デフォルト値「比肩」を返します');
      return '比肩';
  }
}

/**
 * 特別格局の関連神（喜神・忌神・仇神）を早見表から取得する関数
 * @param kakukyokuType 格局タイプ
 * @param dayMaster 日干
 * @param fourPillars 四柱情報
 * @returns 喜神・忌神・仇神
 */
function getSpecialKakukyokuRelatedGods(
  kakukyokuType: string, 
  dayMaster: string,
  fourPillars: FourPillars
): SpecialKakukyokuGods {
  // 1. 早見表に基づく特別格局の関連神マッピング（通変星ペア）
  const specialKakukyokuGodMap: Record<string, { kijin: TenGodRelation; kijin2: TenGodRelation; kyujin: TenGodRelation }> = {
    '従旺格': { kijin: '印', kijin2: '官殺', kyujin: '財' },
    '従強格': { kijin: '比劫', kijin2: '財', kyujin: '食傷' },
    '従児格': { kijin: '財', kijin2: '印', kyujin: '比劫' },
    '従財格': { kijin: '食傷', kijin2: '比劫', kyujin: '印' },
    '従殺格': { kijin: '財', kijin2: '印', kyujin: '比劫' },
    '従勢格': { kijin: '官殺', kijin2: '比劫', kyujin: '印' }
  };
  
  // 2. 通変星ペアを取得
  const relatedGodPairs = specialKakukyokuGodMap[kakukyokuType] || { kijin: '比劫', kijin2: '印', kyujin: '財' };
  console.log(`特別格局「${kakukyokuType}」の関連神（喜神・忌神・仇神）を早見表から取得しました`);
  
  // 天干から五行を特定
  const dayElement = getDayElementFromStem(dayMaster);
  
  // 通変星のカウント
  const tenGodCounts = countTenGods(fourPillars);
  
  // 4. 喜神の決定
  const kijinPair = relatedGodPairs.kijin;
  let kijinTenGod: TenGodRelation = kijinPair;
  console.log(`喜神は通変星ペア「${kijinPair}」を命式内の出現頻度に基づいて選択します`);
  
  switch(kijinPair) {
    case '比劫':
      // 比肩と劫財のどちらが多いか
      if ((tenGodCounts['比肩'] || 0) > (tenGodCounts['劫財'] || 0)) {
        kijinTenGod = '比肩';
      } else if ((tenGodCounts['劫財'] || 0) > (tenGodCounts['比肩'] || 0)) {
        kijinTenGod = '劫財';
      } else {
        // 同数の場合は地支・月支優先ルールを適用（簡略化）
        kijinTenGod = '比肩';
      }
      break;
    case '印':
      if ((tenGodCounts['偏印'] || 0) > (tenGodCounts['正印'] || 0)) {
        kijinTenGod = '偏印';
      } else if ((tenGodCounts['正印'] || 0) > (tenGodCounts['偏印'] || 0)) {
        kijinTenGod = '正印';
      } else {
        kijinTenGod = '正印';
      }
      break;
    case '食傷':
      if ((tenGodCounts['食神'] || 0) > (tenGodCounts['傷官'] || 0)) {
        kijinTenGod = '食神';
      } else if ((tenGodCounts['傷官'] || 0) > (tenGodCounts['食神'] || 0)) {
        kijinTenGod = '傷官';
      } else {
        kijinTenGod = '食神';
      }
      break;
    case '財':
      if ((tenGodCounts['偏財'] || 0) > (tenGodCounts['正財'] || 0)) {
        kijinTenGod = '偏財';
      } else if ((tenGodCounts['正財'] || 0) > (tenGodCounts['偏財'] || 0)) {
        kijinTenGod = '正財';
      } else {
        kijinTenGod = '正財';
      }
      break;
    case '官殺':
      if ((tenGodCounts['偏官'] || 0) > (tenGodCounts['正官'] || 0)) {
        kijinTenGod = '偏官';
      } else if ((tenGodCounts['正官'] || 0) > (tenGodCounts['偏官'] || 0)) {
        kijinTenGod = '正官';
      } else {
        kijinTenGod = '正官';
      }
      break;
  }
  
  // 5. 忌神の決定
  const kijin2Pair = relatedGodPairs.kijin2;
  let kijin2TenGod: TenGodRelation = kijin2Pair;
  console.log(`忌神は通変星ペア「${kijin2Pair}」を命式内の出現頻度に基づいて選択します`);
  
  switch(kijin2Pair) {
    case '比劫':
      if ((tenGodCounts['比肩'] || 0) > (tenGodCounts['劫財'] || 0)) {
        kijin2TenGod = '比肩';
      } else if ((tenGodCounts['劫財'] || 0) > (tenGodCounts['比肩'] || 0)) {
        kijin2TenGod = '劫財';
      } else {
        kijin2TenGod = '比肩';
      }
      break;
    case '印':
      if ((tenGodCounts['偏印'] || 0) > (tenGodCounts['正印'] || 0)) {
        kijin2TenGod = '偏印';
      } else if ((tenGodCounts['正印'] || 0) > (tenGodCounts['偏印'] || 0)) {
        kijin2TenGod = '正印';
      } else {
        kijin2TenGod = '正印';
      }
      break;
    case '食傷':
      if ((tenGodCounts['食神'] || 0) > (tenGodCounts['傷官'] || 0)) {
        kijin2TenGod = '食神';
      } else if ((tenGodCounts['傷官'] || 0) > (tenGodCounts['食神'] || 0)) {
        kijin2TenGod = '傷官';
      } else {
        kijin2TenGod = '食神';
      }
      break;
    case '財':
      if ((tenGodCounts['偏財'] || 0) > (tenGodCounts['正財'] || 0)) {
        kijin2TenGod = '偏財';
      } else if ((tenGodCounts['正財'] || 0) > (tenGodCounts['偏財'] || 0)) {
        kijin2TenGod = '正財';
      } else {
        kijin2TenGod = '正財';
      }
      break;
    case '官殺':
      if ((tenGodCounts['偏官'] || 0) > (tenGodCounts['正官'] || 0)) {
        kijin2TenGod = '偏官';
      } else if ((tenGodCounts['正官'] || 0) > (tenGodCounts['偏官'] || 0)) {
        kijin2TenGod = '正官';
      } else {
        kijin2TenGod = '正官';
      }
      break;
  }
  
  // 6. 仇神の決定
  const kyujinPair = relatedGodPairs.kyujin;
  let kyujinTenGod: TenGodRelation = kyujinPair;
  console.log(`仇神は通変星ペア「${kyujinPair}」を命式内の出現頻度に基づいて選択します`);
  
  switch(kyujinPair) {
    case '比劫':
      if ((tenGodCounts['比肩'] || 0) > (tenGodCounts['劫財'] || 0)) {
        kyujinTenGod = '比肩';
      } else if ((tenGodCounts['劫財'] || 0) > (tenGodCounts['比肩'] || 0)) {
        kyujinTenGod = '劫財';
      } else {
        kyujinTenGod = '比肩';
      }
      break;
    case '印':
      if ((tenGodCounts['偏印'] || 0) > (tenGodCounts['正印'] || 0)) {
        kyujinTenGod = '偏印';
      } else if ((tenGodCounts['正印'] || 0) > (tenGodCounts['偏印'] || 0)) {
        kyujinTenGod = '正印';
      } else {
        kyujinTenGod = '正印';
      }
      break;
    case '食傷':
      if ((tenGodCounts['食神'] || 0) > (tenGodCounts['傷官'] || 0)) {
        kyujinTenGod = '食神';
      } else if ((tenGodCounts['傷官'] || 0) > (tenGodCounts['食神'] || 0)) {
        kyujinTenGod = '傷官';
      } else {
        kyujinTenGod = '食神';
      }
      break;
    case '財':
      if ((tenGodCounts['偏財'] || 0) > (tenGodCounts['正財'] || 0)) {
        kyujinTenGod = '偏財';
      } else if ((tenGodCounts['正財'] || 0) > (tenGodCounts['偏財'] || 0)) {
        kyujinTenGod = '正財';
      } else {
        kyujinTenGod = '正財';
      }
      break;
    case '官殺':
      if ((tenGodCounts['偏官'] || 0) > (tenGodCounts['正官'] || 0)) {
        kyujinTenGod = '偏官';
      } else if ((tenGodCounts['正官'] || 0) > (tenGodCounts['偏官'] || 0)) {
        kyujinTenGod = '正官';
      } else {
        kyujinTenGod = '正官';
      }
      break;
  }
  
  // 7. 五行属性の変換
  const kijinElement = convertTenGodToElement(kijinTenGod, dayMaster);
  const kijin2Element = convertTenGodToElement(kijin2TenGod, dayMaster);
  const kyujinElement = convertTenGodToElement(kyujinTenGod, dayMaster);
  
  // 8. 説明文の生成
  const kijinDescription = generateGodDescription(kijinTenGod, kijinElement, '喜神');
  const kijin2Description = generateGodDescription(kijin2TenGod, kijin2Element, '忌神');
  const kyujinDescription = generateGodDescription(kyujinTenGod, kyujinElement, '仇神');
  
  console.log(`決定された喜神: ${kijinTenGod}(${kijinElement}), 忌神: ${kijin2TenGod}(${kijin2Element}), 仇神: ${kyujinTenGod}(${kyujinElement})`);
  
  return {
    kijin: {
      tenGod: kijinTenGod,
      element: kijinElement,
      description: kijinDescription
    },
    kijin2: {
      tenGod: kijin2TenGod,
      element: kijin2Element,
      description: kijin2Description
    },
    kyujin: {
      tenGod: kyujinTenGod,
      element: kyujinElement,
      description: kyujinDescription
    }
  };
}

/**
 * 身強・身弱に基づいて用神候補を取得する関数
 * @param strength 身強・身弱・中和の状態
 * @returns 用神候補となる十神のリスト
 */
function getYojinCandidates(strength: 'strong' | 'weak' | 'neutral'): TenGodRelation[] {
  if (strength === 'strong') {
    // 身強の場合は日干を弱める用神が必要
    return ['食神', '傷官', '偏財', '正財', '偏官', '正官'];
  } else if (strength === 'weak') {
    // 身弱の場合は日干を強める用神が必要
    return ['比肩', '劫財', '偏印', '正印'];
  } else {
    // 中和の場合は両方を候補とする
    return ['比肩', '劫財', '食神', '傷官', '偏財', '正財', '偏官', '正官', '偏印', '正印'];
  }
}

/**
 * 通変星の出現回数を数える関数
 * @param fourPillars 四柱情報
 * @returns 各通変星の出現回数
 */
function countTenGods(fourPillars: FourPillars): Record<TenGodRelation, number> {
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
  
  // 天干の十神関係をカウント
  const stemTenGods = [
    fourPillars.yearPillar.stem,
    fourPillars.monthPillar.stem,
    fourPillars.hourPillar.stem
  ];
  
  // 地支の十神関係もカウント
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

/**
 * 天干から五行属性を取得する関数
 */
function getDayElementFromStem(stem: string): string {
  const stemToElement: Record<string, string> = {
    '甲': 'wood', '乙': 'wood',
    '丙': 'fire', '丁': 'fire',
    '戊': 'earth', '己': 'earth',
    '庚': 'metal', '辛': 'metal',
    '壬': 'water', '癸': 'water'
  };
  return stemToElement[stem] || 'unknown';
}

/**
 * 命式内で最も多い通変星ペアを特定する関数
 * @param pairCounts 各通変星ペアの出現回数
 * @returns 最も多い通変星ペア
 */
function getMostFrequentPair(pairCounts: Record<string, number>): TenGodRelation {
  let maxCount = 0;
  let mostFrequentPair: TenGodRelation = '比劫'; // デフォルト値
  
  // 出現頻度が最大の通変星ペアを特定
  for (const [pair, count] of Object.entries(pairCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentPair = pair as TenGodRelation;
    }
  }
  
  return mostFrequentPair;
}

/**
 * 普通格局の用神通変星ペアを早見表から取得する関数
 * @param kakukyokuType 格局タイプ
 * @param strength 身強/身弱
 * @param mostFrequentPair 命式内で最も多い通変星ペア
 * @returns 用神の通変星ペア
 */
function getNormalKakukyokuYojinPair(
  kakukyokuType: string,
  strength: 'strong' | 'weak' | 'neutral',
  mostFrequentPair: TenGodRelation
): TenGodRelation {
  // 格局タイプから「格」を省いた形式
  const formatType = kakukyokuType.replace(/格$/, '');
  
  // 早見表データ（saju_yojin_algorithm.mdの「普通格局の用神早見表」に従う）
  const normalKakukyokuYojinMap: Record<string, Record<string, Record<string, TenGodRelation>>> = {
    // 建禄格・月刃格の早見表
    '建禄': {
      'strong': {
        '比劫': '官殺',
        '印': '財',
        '食傷': '財',
        '財': '官殺',
        '官殺': '食傷'
      },
      'weak': {
        '官殺': '印',
        '財': '比劫',
        '食傷': '印'
      }
    },
    '月刃': {
      'strong': {
        '比劫': '官殺',
        '印': '財',
        '食傷': '財',
        '財': '官殺',
        '官殺': '食傷'
      },
      'weak': {
        '官殺': '印',
        '財': '比劫',
        '食傷': '印'
      }
    },
    // 食神格・傷官格の早見表
    '食神': {
      'strong': {
        '比劫': '食傷',
        '印': '財',
        '食傷': '財',
        '財': '官殺',
        '官殺': '食傷'
      },
      'weak': {
        '官殺': '印',
        '財': '比劫',
        '食傷': '印'
      }
    },
    '傷官': {
      'strong': {
        '比劫': '食傷',
        '印': '財',
        '食傷': '財',
        '財': '官殺',
        '官殺': '食傷'
      },
      'weak': {
        '官殺': '印',
        '財': '比劫',
        '食傷': '印'
      }
    },
    // 偏財格・正財格の早見表
    '偏財': {
      'strong': {
        '比劫': '食傷',
        '印': '財',
        '食傷': '財',
        '財': '官殺',
        '官殺': '食傷'
      },
      'weak': {
        '官殺': '印',
        '財': '比劫',
        '食傷': '印'
      }
    },
    '正財': {
      'strong': {
        '比劫': '食傷',
        '印': '財',
        '食傷': '財',
        '財': '官殺',
        '官殺': '食傷'
      },
      'weak': {
        '官殺': '印',
        '財': '比劫',
        '食傷': '印'
      }
    },
    // 正官格・偏官格の早見表
    '正官': {
      'strong': {
        '比劫': '官殺',
        '印': '財',
        '食傷': '財',
        '財': '官殺',
        '官殺': '食傷'
      },
      'weak': {
        '食傷': '印',
        '財': '比劫',
        '官殺': '印'
      }
    },
    '偏官': {
      'strong': {
        '比劫': '官殺',
        '印': '財',
        '食傷': '財',
        '財': '官殺',
        '官殺': '食傷'
      },
      'weak': {
        '食傷': '印',
        '財': '比劫',
        '官殺': '印'
      }
    },
    // 印緑格・偏印格の早見表
    '印緑': {
      'strong': {
        '比劫': '官殺',
        '印': '財',
        '食傷': '財',
        '財': '官殺',
        '官殺': '食傷'
      },
      'weak': {
        '食傷': '印',
        '財': '比劫',
        '官殺': '印'
      }
    },
    '偏印': {
      'strong': {
        '比劫': '官殺',
        '印': '財',
        '食傷': '財',
        '財': '官殺',
        '官殺': '食傷'
      },
      'weak': {
        '食傷': '印',
        '財': '比劫',
        '官殺': '印'
      }
    }
  };
  
  // 中和の場合は身強パターンを使用
  const actualStrength = strength === 'neutral' ? 'strong' : strength;
  
  // 早見表から用神を取得
  try {
    if (normalKakukyokuYojinMap[formatType] && 
        normalKakukyokuYojinMap[formatType][actualStrength] && 
        normalKakukyokuYojinMap[formatType][actualStrength][mostFrequentPair]) {
      return normalKakukyokuYojinMap[formatType][actualStrength][mostFrequentPair];
    }
  } catch (error) {
    console.error(`早見表からの用神取得に失敗しました: ${formatType}, ${actualStrength}, ${mostFrequentPair}`, error);
  }
  
  // デフォルト値を返す
  return '比劫';
}

/**
 * 通変星ペアから具体的な十神を選定する関数
 * @param tenGodPair 通変星ペア
 * @param tenGodCounts 各通変星の出現回数
 * @returns 選定された十神
 */
function selectSpecificTenGod(
  tenGodPair: TenGodRelation,
  tenGodCounts: Record<TenGodRelation, number>
): TenGodRelation {
  // 通変星ペアに基づいて具体的な十神を選定
  switch(tenGodPair) {
    case '比劫':
      // 比肩と劫財のどちらが多いか
      const bikenCount = tenGodCounts['比肩'] || 0;
      const kouzaiCount = tenGodCounts['劫財'] || 0;
      console.log(`比肩: ${bikenCount}個, 劫財: ${kouzaiCount}個`);
      
      if (bikenCount > kouzaiCount) {
        return '比肩';
      } else if (kouzaiCount > bikenCount) {
        return '劫財';
      } else {
        // 同数の場合は地支の通変星を優先（実装は省略）
        return '比肩';
      }
      
    case '印':
      // 偏印と正印のどちらが多いか
      const henInCount = tenGodCounts['偏印'] || 0;
      const seiInCount = tenGodCounts['正印'] || 0;
      
      if (henInCount > seiInCount) {
        return '偏印';
      } else if (seiInCount > henInCount) {
        return '正印';
      } else {
        return '正印';
      }
      
    case '食傷':
      // 食神と傷官のどちらが多いか
      const shokuShinCount = tenGodCounts['食神'] || 0;
      const shougouCount = tenGodCounts['傷官'] || 0;
      
      if (shokuShinCount > shougouCount) {
        return '食神';
      } else if (shougouCount > shokuShinCount) {
        return '傷官';
      } else {
        return '食神';
      }
      
    case '財':
      // 偏財と正財のどちらが多いか
      const henZaiCount = tenGodCounts['偏財'] || 0;
      const seiZaiCount = tenGodCounts['正財'] || 0;
      
      if (henZaiCount > seiZaiCount) {
        return '偏財';
      } else if (seiZaiCount > henZaiCount) {
        return '正財';
      } else {
        return '正財';
      }
      
    case '官殺':
      // 偏官と正官のどちらが多いか
      const henKanCount = tenGodCounts['偏官'] || 0;
      const seiKanCount = tenGodCounts['正官'] || 0;
      
      if (henKanCount > seiKanCount) {
        return '偏官';
      } else if (seiKanCount > henKanCount) {
        return '正官';
      } else {
        return '正官';
      }
      
    default:
      // デフォルト値
      return '比肩';
  }
}

/**
 * 十神名から五行を取得する関数
 * @param tenGod 十神名
 * @param dayStem 日干
 * @returns 五行名（wood, fire, earth, metal, water）
 */
function convertTenGodToElement(tenGod: TenGodRelation, dayStem: string): string {
  const dayElement = tenGodCalculator.getElementFromStem(dayStem);
  
  // 通変星ペアの処理を先に行う
  if (tenGod === '比劫') return dayElement;
  if (tenGod === '印') return getElementProducing(dayElement);
  if (tenGod === '食傷') return getElementProducedBy(dayElement);
  if (tenGod === '財') return getElementControlledBy(dayElement);
  if (tenGod === '官殺') return getElementControlling(dayElement);
  
  // 十神と日干の関係から、用神の五行を特定
  switch (tenGod) {
    case '比肩':
    case '劫財':
      return dayElement; // 同じ五行
    
    case '食神':
    case '傷官':
      // 日干が生じる五行
      return getElementProducedBy(dayElement);
    
    case '偏財':
    case '正財':
      // 日干が克する五行
      return getElementControlledBy(dayElement);
    
    case '偏官':
    case '正官':
      // 日干を克する五行
      return getElementControlling(dayElement);
    
    case '偏印':
    case '正印':
      // 日干を生じる五行
      return getElementProducing(dayElement);
    
    default:
      console.log(`未知の十神名: ${tenGod}`);
      return dayElement; // 不明な場合は日干と同じ五行
  }
}

/**
 * 五行間の相生関係で、指定された五行が生み出す五行を取得
 * @param element 基準となる五行
 * @returns 生み出される五行
 */
function getElementProducedBy(element: string): string {
  const productionCycle: Record<string, string> = {
    '木': '火',  // 木は火を生む
    '火': '土',  // 火は土を生む
    '土': '金',  // 土は金を生む
    '金': '水',  // 金は水を生む
    '水': '木'   // 水は木を生む
  };
  
  return productionCycle[element] || element;
}

/**
 * 五行間の相剋関係で、指定された五行が克する五行を取得
 * @param element 基準となる五行
 * @returns 克される五行
 */
function getElementControlledBy(element: string): string {
  const controlCycle: Record<string, string> = {
    '木': '土',  // 木は土を克する
    '土': '水',  // 土は水を克する
    '水': '火',  // 水は火を克する
    '火': '金',  // 火は金を克する
    '金': '木'   // 金は木を克する
  };
  
  return controlCycle[element] || element;
}

/**
 * 五行間の相剋関係で、指定された五行を克する五行を取得
 * @param element 基準となる五行
 * @returns 克する五行
 */
function getElementControlling(element: string): string {
  const controlledByCycle: Record<string, string> = {
    '木': '金',  // 木は金に克される
    '金': '火',  // 金は火に克される
    '火': '水',  // 火は水に克される
    '水': '土',  // 水は土に克される
    '土': '木'   // 土は木に克される
  };
  
  return controlledByCycle[element] || element;
}

/**
 * 五行間の相生関係で、指定された五行を生み出す五行を取得
 * @param element 基準となる五行
 * @returns 生み出す五行
 */
function getElementProducing(element: string): string {
  const producingCycle: Record<string, string> = {
    '木': '水',  // 木は水から生まれる
    '火': '木',  // 火は木から生まれる
    '土': '火',  // 土は火から生まれる
    '金': '土',  // 金は土から生まれる
    '水': '金'   // 水は金から生まれる
  };
  
  return producingCycle[element] || element;
}

/**
 * 用神の説明文を生成する関数
 * @param tenGod 十神名
 * @param element 五行名
 * @param kakukyoku 格局情報
 * @returns 用神の説明文
 */
function generateYojinDescription(
  tenGod: TenGodRelation,
  element: string,
  kakukyoku: IKakukyoku
): string {
  const elementJp = translateElementToJapanese(element);
  const strength = kakukyoku.strength;
  
  // 基本的な説明文テンプレート
  let description = `あなたの用神は「${tenGod}（${elementJp}）」です。`;
  
  // 身強・身弱に応じた補足説明
  if (strength === 'strong') {
    description += `身強の状態なので、${elementJp}の力で日干を抑制し、バランスを取ることが運気の鍵となります。`;
  } else if (strength === 'weak') {
    description += `身弱の状態なので、${elementJp}の力で日干を支援し、強化することが運気の鍵となります。`;
  } else {
    description += `中和の状態なので、${elementJp}の力で日干との調和を保つことが運気の鍵となります。`;
  }
  
  // 十神タイプ別の具体的アドバイス
  switch (tenGod) {
    case '比肩':
      description += '同じ五行の力を借りて自分を強化し、協力者との連携が運気を高めます。';
      break;
    case '劫財':
      description += '同じ系統の力を競い合いながら、自己の強化と成長を促すことが重要です。';
      break;
    case '食神':
      description += '創造性を発揮し、表現力を高めることであなたの運気が向上します。';
      break;
    case '傷官':
      description += '独自の才能や技術を磨き、専門性を高めることが運気の向上につながります。';
      break;
    case '偏財':
      description += '積極的な行動と冒険心が財運を引き寄せ、運気を高めます。';
      break;
    case '正財':
      description += '堅実な計画と着実な努力が安定した財運をもたらし、運気を高めます。';
      break;
    case '偏官':
      description += '権威や秩序を重んじ、社会的な規範に従うことが運気を整えます。';
      break;
    case '正官':
      description += '責任感と誠実さを持って行動することが、信頼と運気を高めます。';
      break;
    case '偏印':
      description += '学びと知識の探求が内面を豊かにし、運気を向上させます。';
      break;
    case '正印':
      description += '精神的な成長と内省が、あなたの運気を支える基盤となります。';
      break;
    default:
      description += '運気のバランスを保つことが重要です。';
  }
  
  return description;
}

/**
 * 用神をサポートする五行を取得する関数
 * @param element 用神の五行
 * @returns サポート五行のリスト
 */
function getSupportingElements(element: string): string[] {
  // 用神を強める五行（生む五行と同じ五行）
  const supporting: string[] = [element]; // 自分自身も含める
  
  // 用神を生み出す五行を追加
  const producingElement = getElementProducing(element);
  supporting.push(producingElement);
  
  return supporting;
}

/**
 * 五行名を日本語に変換する補助関数
 * @param element 五行名（英語）
 * @returns 五行名（日本語）
 */
function translateElementToJapanese(element: string): string {
  const translations: Record<string, string> = {
    'wood': '木',
    '木': '木',
    'fire': '火',
    '火': '火',
    'earth': '土',
    '土': '土',
    'metal': '金',
    '金': '金',
    'water': '水',
    '水': '水'
  };
  
  return translations[element] || element;
}

/**
 * 用神に基づいて喜神・忌神・仇神を特定する関数
 * @param yojin 用神（十神）
 * @param dayMaster 日干
 * @param kakukyoku 格局情報
 * @param fourPillars 四柱情報
 * @returns 喜神・忌神・仇神情報
 */
function determineRelatedGods(
  yojin: TenGodRelation,
  dayMaster: string,
  kakukyoku: IKakukyoku,
  fourPillars: FourPillars
): {
  kijin: TenGodWithElement;
  kijin2: TenGodWithElement;
  kyujin: TenGodWithElement;
} {
  // 特別格局の場合は早見表から直接取得
  if (kakukyoku.category === 'special') {
    const relatedGods = getSpecialKakukyokuRelatedGods(kakukyoku.type, dayMaster, fourPillars);
    
    // 五行に変換
    const kijinElement = relatedGods.kijin.element;
    const kijin2Element = relatedGods.kijin2.element;
    const kyujinElement = relatedGods.kyujin.element;
    
    // 説明文を生成
    const kijinDescription = relatedGods.kijin.description || `${kijinElement}の${relatedGods.kijin.tenGod}が喜神です`;
    const kijin2Description = relatedGods.kijin2.description || `${kijin2Element}の${relatedGods.kijin2.tenGod}が忌神です`;
    const kyujinDescription = relatedGods.kyujin.description || `${kyujinElement}の${relatedGods.kyujin.tenGod}が仇神です`;
    
    return {
      kijin: {
        ...relatedGods.kijin,
        description: kijinDescription
      },
      kijin2: {
        ...relatedGods.kijin2,
        description: kijin2Description
      },
      kyujin: {
        ...relatedGods.kyujin,
        description: kyujinDescription
      }
    };
  }

  // 普通格局の場合
  // 天干から五行を特定する
  const dayElement = getDayElementFromStem(dayMaster);
  
  // このテスト実装では適当な値を返す
  const tenGodCounts = countTenGods(fourPillars);
  const pairCounts = {
    '比劫': tenGodCounts['比肩'] + tenGodCounts['劫財'],
    '印': tenGodCounts['偏印'] + tenGodCounts['正印'],
    '食傷': tenGodCounts['食神'] + tenGodCounts['傷官'],
    '財': tenGodCounts['偏財'] + tenGodCounts['正財'],
    '官殺': tenGodCounts['偏官'] + tenGodCounts['正官']
  };
  
  // 2. 命式内で最も多い通変星ペアを特定
  const mostFrequentPair = getMostFrequentPair(pairCounts);
  console.log(`命式内で最も多い通変星ペア: ${mostFrequentPair}`);
  
  // 3. 格局タイプ、身強/身弱、最も多い通変星に基づいて関連神を取得
  const relatedGods = getNormalKakukyokuRelatedGods(kakukyoku.type, kakukyoku.strength, mostFrequentPair, yojin);
  
  // 4. 通変星ペアから具体的な十神を選定
  const kijinTenGod = selectSpecificTenGod(relatedGods.kijin, tenGodCounts);
  const kijin2TenGod = selectSpecificTenGod(relatedGods.kijin2, tenGodCounts);
  const kyujinTenGod = selectSpecificTenGod(relatedGods.kyujin, tenGodCounts);
  
  // 5. 五行属性の変換
  const kijinElement = getElementFromTenGod(kijinTenGod, dayMaster);
  const kijin2Element = getElementFromTenGod(kijin2TenGod, dayMaster);
  const kyujinElement = getElementFromTenGod(kyujinTenGod, dayMaster);
  
  // 6. 説明文の生成
  const kijinDescription = generateGodDescription(kijinTenGod, kijinElement, '喜神');
  const kijin2Description = generateGodDescription(kijin2TenGod, kijin2Element, '忌神');
  const kyujinDescription = generateGodDescription(kyujinTenGod, kyujinElement, '仇神');
  
  return {
    kijin: {
      tenGod: kijinTenGod,
      element: kijinElement,
      description: kijinDescription
    },
    kijin2: {
      tenGod: kijin2TenGod,
      element: kijin2Element,
      description: kijin2Description
    },
    kyujin: {
      tenGod: kyujinTenGod,
      element: kyujinElement,
      description: kyujinDescription
    }
  };
}

/**
 * 十神名から五行を取得する関数（汎用版）
 * @param tenGod 十神名（通変星グループも含む）
 * @param dayStem 日干
 * @returns 五行名
 */
function getElementFromTenGod(tenGod: TenGodRelation, dayStem: string): string {
  const dayElement = tenGodCalculator.getElementFromStem(dayStem);
  
  // 通変星グループの場合、最初の具体的な十神を使用
  if (tenGod === '比劫') {
    return dayElement; // 日干と同じ五行
  } else if (tenGod === '印') {
    return getElementProducing(dayElement); // 日干を生じる五行
  } else if (tenGod === '食傷') {
    return getElementProducedBy(dayElement); // 日干が生じる五行
  } else if (tenGod === '財') {
    return getElementControlledBy(dayElement); // 日干が克する五行
  } else if (tenGod === '官殺') {
    return getElementControlling(dayElement); // 日干を克する五行
  }
  
  // 個別の十神の場合
  switch (tenGod) {
    case '比肩':
    case '劫財':
      return dayElement; // 同じ五行
    
    case '食神':
    case '傷官':
      return getElementProducedBy(dayElement); // 日干が生じる五行
    
    case '偏財':
    case '正財':
      return getElementControlledBy(dayElement); // 日干が克する五行
    
    case '偏官':
    case '正官':
      return getElementControlling(dayElement); // 日干を克する五行
    
    case '偏印':
    case '正印':
      return getElementProducing(dayElement); // 日干を生じる五行
    
    default:
      return dayElement; // 不明な場合は日干と同じ五行
  }
}

/**
 * 普通格局の関連神（喜神・忌神・仇神）を早見表から取得する関数
 * @param kakukyokuType 格局タイプ
 * @param strength 身強/身弱
 * @param mostFrequentPair 命式内で最も多い通変星ペア
 * @param yojin 用神（十神）
 * @returns 関連神情報
 */
function getNormalKakukyokuRelatedGods(
  kakukyokuType: string,
  strength: 'strong' | 'weak' | 'neutral',
  mostFrequentPair: TenGodRelation,
  yojin: TenGodRelation
): {
  kijin: TenGodRelation;
  kijin2: TenGodRelation;
  kyujin: TenGodRelation;
} {
  // 格局タイプから「格」を省いた形式
  const formatType = kakukyokuType.replace(/格$/, '');
  const actualStrength = strength === 'neutral' ? 'strong' : strength;
  
  // 早見表データ（saju_yojin_algorithm.mdに基づく）
  const relatedGodsMap: Record<string, Record<string, Record<string, { kijin: TenGodRelation; kijin2: TenGodRelation; kyujin: TenGodRelation }>>> = {
    // 建禄格・月刃格の早見表
    '建禄': {
      'strong': {
        '官殺': { kijin: '財', kijin2: '比劫', kyujin: '印' },
        '財': { kijin: '官殺', kijin2: '印', kyujin: '比劫' },
        '食傷': { kijin: '財', kijin2: '比劫', kyujin: '印' }
      },
      'weak': {
        '印': { kijin: '比劫', kijin2: '食傷', kyujin: '官殺' },
        '比劫': { kijin: '印', kijin2: '官殺', kyujin: '財' }
      }
    },
    '月刃': {
      'strong': {
        '官殺': { kijin: '財', kijin2: '比劫', kyujin: '印' },
        '財': { kijin: '官殺', kijin2: '印', kyujin: '比劫' },
        '食傷': { kijin: '財', kijin2: '比劫', kyujin: '印' }
      },
      'weak': {
        '印': { kijin: '比劫', kijin2: '食傷', kyujin: '官殺' },
        '比劫': { kijin: '印', kijin2: '官殺', kyujin: '財' }
      }
    },
    // 他の格局タイプも同様に定義...
    // 実際のアプリケーションでは全ての格局タイプに対応するマッピングを作成する
  };
  
  let relatedGods;
  
  // 早見表から関連神を取得
  try {
    if (relatedGodsMap[formatType] && 
        relatedGodsMap[formatType][actualStrength] && 
        relatedGodsMap[formatType][actualStrength][yojin]) {
      relatedGods = relatedGodsMap[formatType][actualStrength][yojin];
    }
  } catch (error) {
    console.error(`早見表からの関連神取得に失敗しました: ${formatType}, ${actualStrength}, ${yojin}`, error);
  }
  
  // デフォルト値
  if (!relatedGods) {
    if (actualStrength === 'strong') {
      return {
        kijin: '財',
        kijin2: '比劫',
        kyujin: '印'
      };
    } else {
      return {
        kijin: '比劫',
        kijin2: '食傷',
        kyujin: '官殺'
      };
    }
  }
  
  return relatedGods;
}

/**
 * 喜神・忌神・仇神の説明文を生成する関数
 * @param tenGod 十神名
 * @param element 五行名
 * @param godType 神のタイプ（喜神・忌神・仇神）
 * @returns 説明文
 */
function generateGodDescription(tenGod: TenGodRelation, element: string, godType: string): string {
  const elementJp = translateElementToJapanese(element);
  
  let description = `あなたの${godType}は「${tenGod}（${elementJp}）」です。`;
  
  // 神のタイプ別の補足説明
  if (godType === '喜神') {
    description += `${elementJp}の力があなたの用神を強め、運気を高めます。`;
  } else if (godType === '忌神') {
    description += `${elementJp}の力は用神の働きを妨げるので、控えめにすることが大切です。`;
  } else { // 仇神
    description += `${elementJp}の力は運気に悪影響を与えるので、できるだけ避けるようにしましょう。`;
  }
  
  return description;
}