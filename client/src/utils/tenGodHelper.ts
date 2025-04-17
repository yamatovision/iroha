/**
 * 四柱推命の十神関係を扱うユーティリティ関数
 */

// 天干の五行属性
export const STEM_ELEMENTS: Record<string, string> = {
  '甲': 'wood', '乙': 'wood',
  '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth',
  '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water'
};

// 地支の五行属性
export const BRANCH_ELEMENTS: Record<string, string> = {
  '子': 'water', '丑': 'earth',
  '寅': 'wood', '卯': 'wood',
  '辰': 'earth', '巳': 'fire',
  '午': 'fire', '未': 'earth',
  '申': 'metal', '酉': 'metal',
  '戌': 'earth', '亥': 'water'
};

// 天干から五行属性を取得
export function getElementFromStem(stem: string): string {
  return STEM_ELEMENTS[stem] || 'earth';
}

// 地支から五行属性を取得
export function getElementFromBranch(branch: string): string {
  return BRANCH_ELEMENTS[branch] || 'earth';
}

// 十神関係の日本語名を取得
export function translateTenGodToJapanese(tenGod: string): string {
  const translations: Record<string, string> = {
    '比肩': '比肩',
    '劫財': '劫財',
    '食神': '食神',
    '傷官': '傷官',
    '偏財': '偏財',
    '正財': '正財',
    '偏官': '偏官',
    '正官': '正官',
    '偏印': '偏印',
    '正印': '正印',
    '比劫': '比劫',
    '印': '印',
    '食傷': '食傷',
    '財': '財',
    '官殺': '官殺'
  };
  
  return translations[tenGod] || tenGod;
}

// 十神関係の説明を取得
export function getTenGodDescription(tenGod: string): string {
  const descriptions: Record<string, string> = {
    '比肩': '同じ立場の協力者',
    '劫財': '競争する仲間',
    '食神': '創造性と表現力',
    '傷官': '才能と技術',
    '偏財': '臨時収入',
    '正財': '安定した収入',
    '偏官': '権威と規律',
    '正官': '責任と秩序',
    '偏印': '知識と学び',
    '正印': '知恵と教養',
    // 以下は通変星ペア
    '比劫': '協力と競争',
    '印': '知識と教養',
    '食傷': '創造と才能',
    '財': '財運と収入',
    '官殺': '権威と責任'
  };
  
  return descriptions[tenGod] || '未定義の十神関係';
}