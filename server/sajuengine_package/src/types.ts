/**
 * 韓国式四柱推命計算用の型定義
 */

// 天干（10種類）
export type StemName = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸" | string;

// 地支（12種類）
export type BranchName = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥" | string;

// 干支（60種類）
export type StemBranchName = `${StemName}${BranchName}` | string;

// 後方互換性のための定義
export type STEM_BRANCHES = StemBranchName;

// 旧型定義の互換性維持
export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
}

export interface CalendarDay {
  year: number;
  month: number;
  day: number;
}

// 十神関係
export type TenGodRelation = 
  // 個別十神
  "比肩" | "劫財" | "偏印" | "正印" | "偏官" | "正官" | "偏財" | "正財" | "食神" | "傷官" |
  // 通変星グループ（ペア）
  "比劫" | "印" | "食傷" | "財" | "官殺" |
  // エラー時のフォールバック値
  "なし" | "不明";

/**
 * 蔵干の十神関係
 */
export interface HiddenStemTenGod {
  stem: StemName;  // 蔵干
  tenGod: TenGodRelation | string; // 十神関係
  weight?: number; // 重み（影響度）
}

/**
 * 四柱の柱情報
 */
export interface Pillar {
  stem: StemName;          // 天干
  branch: BranchName;      // 地支
  fullStemBranch: string;  // 天干地支の組み合わせ
  hiddenStems?: string[];  // 蔵干（地支に内包される天干）
  fortune?: string;        // 十二運星
  spiritKiller?: string;   // 十二神殺
  branchTenGod?: string;   // 地支の十神関係
  hiddenStemsTenGods?: HiddenStemTenGod[]; // 蔵干の十神関係情報
  enhancedElement?: string; // 干合・支合による強化された五行
  originalStem?: StemName; // 干合変化前の元の天干
}

/**
 * 四柱（年月日時の4つの柱）
 */
export interface FourPillars {
  yearPillar: Pillar;   // 年柱
  monthPillar: Pillar;  // 月柱
  dayPillar: Pillar;    // 日柱
  hourPillar: Pillar;   // 時柱
}

/**
 * 計算オプション
 */
export interface SajuOptions {
  useLocalTime?: boolean;   // 地方時（経度に基づく時差）を使用するか
  useDST?: boolean;         // 夏時間（サマータイム）を考慮するか
  useHistoricalDST?: boolean; // 歴史的サマータイム（日本1948-1951年）を考慮するか
  useStandardTimeZone?: boolean; // 標準タイムゾーンを使用するか（政治的/行政的）
  useInternationalMode?: boolean; // 国際対応モードを使用するか
  gender?: 'M' | 'F';       // 性別 (M=男性, F=女性)
  location?: string | {     // 出生地（都市名または座標）
    longitude: number;
    latitude: number;
    timeZone?: string;      // オプションでタイムゾーン指定
  } | ExtendedLocation;     // 拡張ロケーション情報
  referenceStandardMeridian?: number; // 標準経度（デフォルト：東経135度）
  adjustmentVersion?: number; // 調整バージョン（互換性確保用）
  useSecondsPrecision?: boolean; // 秒単位の精度を使用するか
}

// 天干の順番（甲から始まる）
export const STEMS: StemName[] = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

// 地支の順番（子から始まる）
export const BRANCHES: BranchName[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/**
 * 国際対応拡張：タイムゾーン調整情報
 */
export interface TimezoneAdjustmentInfo {
  politicalTimeZone?: string;        // 政治的タイムゾーン (e.g. "Asia/Tokyo")
  isDST?: boolean;                   // サマータイム適用状態
  timeZoneOffsetMinutes?: number;    // タイムゾーンオフセット（分）
  timeZoneOffsetSeconds?: number;    // タイムゾーンオフセット（秒）
  localTimeAdjustmentSeconds?: number; // 秒単位の地方時調整
  adjustmentDetails?: {              // 調整詳細
    politicalTimeZoneAdjustment: number; // 政治的タイムゾーンによる調整（分）
    longitudeBasedAdjustment: number;    // 経度ベースの調整（分）
    dstAdjustment: number;               // サマータイム調整（分）
    regionalAdjustment: number;          // 地域特有の調整（分）
    totalAdjustmentMinutes: number;      // 合計調整（分）
    totalAdjustmentSeconds: number;      // 合計調整（秒）
  };
}

/**
 * 国際対応拡張：拡張ロケーション情報
 */
export interface ExtendedLocation {
  name?: string;
  country?: string;
  coordinates: {
    longitude: number;
    latitude: number;
  };
  timeZone?: string;
}

/**
 * 格局（気質タイプ）情報
 */
export interface IKakukyoku {
  type: string;               // 例: '従旺格', '建禄格'など
  category: 'special' | 'normal'; // 特別格局か普通格局か
  strength: 'strong' | 'weak' | 'neutral'; // 身強か身弱か中和か
  description?: string;       // 格局の説明
  extremeType?: string;       // 極身強・極身弱のタイプ
  isExtremeStrong?: boolean;  // 極身強かどうか
  isExtremeWeak?: boolean;    // 極身弱かどうか
  score?: number;             // 身強弱スコア（旧計算方式との互換性用）
  details?: string[];         // 詳細な判定理由
}

/**
 * 十神と五行情報
 */
export interface TenGodWithElement {
  tenGod: TenGodRelation;     // 十神表記
  element: string;            // 五行表記
  description?: string;       // 説明
}

/**
 * 特殊格局の関連神情報
 */
export interface SpecialKakukyokuGods {
  kijin: TenGodWithElement;   // 喜神情報
  kijin2: TenGodWithElement;  // 忌神情報
  kyujin: TenGodWithElement;  // 仇神情報
}

/**
 * 用神情報
 */
export interface IYojin {
  tenGod: TenGodRelation;     // 十神表記: 例 '比肩', '食神'
  element: string;            // 五行表記: 例 'wood', 'fire'
  description?: string;       // 用神の説明
  supportElements?: string[]; // 用神をサポートする五行
  kijin?: TenGodWithElement;  // 喜神情報（用神を助ける要素）
  kijin2?: TenGodWithElement; // 忌神情報（避けるべき要素）
  kyujin?: TenGodWithElement; // 仇神情報（強く避けるべき要素）
  debugInfo?: string[];       // デバッグ用情報（用神決定プロセスの説明）
}

/**
 * 五行プロファイル情報
 */
export interface ElementProfile {
  mainElement: string;      // 主要五行: wood, fire, earth, metal, water
  secondaryElement: string; // 二次的五行
  yinYang: string;          // 陰陽: '陽' または '陰'
  wood: number;             // 木の強さ
  fire: number;             // 火の強さ
  earth: number;            // 土の強さ
  metal: number;            // 金の強さ
  water: number;            // 水の強さ
}