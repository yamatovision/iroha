/**
 * 十神計算の基本データ
 * 十神関係の計算に使用する基本データと定数を定義
 */
import { STEMS, BRANCHES } from './types';

/**
 * 天干の配列
 */
export const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

/**
 * 地支の配列
 */
export const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/**
 * 天干の五行属性
 */
export const STEM_ELEMENTS: { [key: string]: string } = {
  '甲': '木',
  '乙': '木',
  '丙': '火',
  '丁': '火',
  '戊': '土',
  '己': '土',
  '庚': '金',
  '辛': '金',
  '壬': '水',
  '癸': '水'
};

/**
 * 天干の五行属性（別名）
 */
export const stemElements = STEM_ELEMENTS;

/**
 * 地支の五行属性
 */
export const BRANCH_ELEMENTS: { [key: string]: string } = {
  '子': '水',
  '丑': '土',
  '寅': '木',
  '卯': '木',
  '辰': '土',
  '巳': '火',
  '午': '火',
  '未': '土',
  '申': '金',
  '酉': '金',
  '戌': '土',
  '亥': '水'
};

/**
 * 地支の五行属性（別名）
 */
export const branchElements = BRANCH_ELEMENTS;

/**
 * 天干の陰陽
 */
export const stemYinYang: { [key: string]: boolean } = {
  '甲': false, // 陽
  '乙': true,  // 陰
  '丙': false, // 陽
  '丁': true,  // 陰
  '戊': false, // 陽
  '己': true,  // 陰
  '庚': false, // 陽
  '辛': true,  // 陰
  '壬': false, // 陽
  '癸': true   // 陰
};

/**
 * 地支の陰陽
 */
export const branchYinYang: { [key: string]: boolean } = {
  '子': false, // 陽
  '丑': true,  // 陰
  '寅': false, // 陽
  '卯': true,  // 陰
  '辰': false, // 陽
  '巳': true,  // 陰
  '午': false, // 陽
  '未': true,  // 陰
  '申': false, // 陽
  '酉': true,  // 陰
  '戌': false, // 陽
  '亥': true   // 陰
};

/**
 * 地支の蔵干（隠れた天干）
 */
export const hiddenStems: { [key: string]: string[] } = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲']
};

/**
 * 五行の相生関係（生む）
 * キー: 生む側の五行, 値: 生まれる側の五行
 */
export const ELEMENT_GENERATES: { [key: string]: string } = {
  '木': '火',
  '火': '土',
  '土': '金',
  '金': '水',
  '水': '木'
};

/**
 * 生成関係（別名）
 */
export const generatesRelation = ELEMENT_GENERATES;

/**
 * 五行の相克関係（克す）
 * キー: 克す側の五行, 値: 克される側の五行
 */
export const ELEMENT_CONTROLS: { [key: string]: string } = {
  '木': '土',
  '土': '水',
  '水': '火',
  '火': '金',
  '金': '木'
};

/**
 * 克制関係（別名）
 */
export const controlsRelation = ELEMENT_CONTROLS;

/**
 * 生成される関係
 * キー: 生成される五行, 値: 生成する五行
 */
export const generatedByRelation: { [key: string]: string } = {
  '火': '木',
  '土': '火',
  '金': '土',
  '水': '金',
  '木': '水'
};

/**
 * 克制される関係
 * キー: 克制される五行, 値: 克制する五行
 */
export const controlledByRelation: { [key: string]: string } = {
  '土': '木',
  '水': '土',
  '火': '水',
  '金': '火',
  '木': '金'
};

/**
 * 天干のインデックスから陰陽を判定
 * @param stem 天干
 * @returns 陰陽（true=陰、false=陽）
 */
export function isStemYin(stem: string): boolean {
  return stemYinYang[stem] === true;
}

/**
 * 地支のインデックスから陰陽を判定
 * @param branch 地支
 * @returns 陰陽（true=陰、false=陽）
 */
export function isBranchYin(branch: string): boolean {
  return branchYinYang[branch] === true;
}

/**
 * 天干と地支の五行が一致するか確認
 * @param stem 天干
 * @param branch 地支
 * @returns 一致するかどうか
 */
export function isSameElement(stem: string, branch: string): boolean {
  const stemElement = STEM_ELEMENTS[stem];
  const branchElement = BRANCH_ELEMENTS[branch];
  return stemElement === branchElement;
}

/**
 * 十神の名称を定義
 */
export const TEN_GOD_NAMES = {
  // 同じ五行の場合
  SAME_YIN: '比肩',    // 同じ五行で同じ陰陽
  SAME_YANG: '劫財',   // 同じ五行で異なる陰陽
  
  // 生まれる関係の場合
  GENERATED_YIN: '偏印',  // 自分を生む五行で同じ陰陽
  GENERATED_YANG: '正印',  // 自分を生む五行で異なる陰陽
  
  // 克される関係の場合
  CONTROLLED_YIN: '偏官',  // 自分を克す五行で同じ陰陽
  CONTROLLED_YANG: '正官',  // 自分を克す五行で異なる陰陽
  
  // 生む関係の場合
  GENERATING_YIN: '食神',  // 自分が生む五行で同じ陰陽
  GENERATING_YANG: '傷官',  // 自分が生む五行で異なる陰陽
  
  // 克す関係の場合
  CONTROLLING_YIN: '偏財',  // 自分が克す五行で同じ陰陽
  CONTROLLING_YANG: '正財'   // 自分が克す五行で異なる陰陽
};