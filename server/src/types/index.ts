/**
 * バックエンド用型定義ファイル
 */
import { Request } from 'express';

// TypeScriptのimport文の整合性のために必要
// auth.d.tsは直接インポートできないため、ここで型を再定義
// export * from './auth';

// 認証リクエスト拡張型の定義
export interface AuthRequest extends Request {
  user?: {
    _id: string;
    id?: string; // MongoDB ObjectIDを文字列化した値（後方互換性のため）
    email: string;
    role: string | UserRole;
    organizationId?: string;
    [key: string]: any; // その他の拡張プロパティ
  };
}

// API基本パス
export const API_BASE_PATH = '/api/v1';

// DAY_PILLAR API
export const DAY_PILLAR = {
  GET_TODAY: `${API_BASE_PATH}/day-pillars/today`,
  GET_BY_DATE: (date: string) => `${API_BASE_PATH}/day-pillars/${date}`,
  GET_RANGE: `${API_BASE_PATH}/day-pillars`,
  GET_TIMEZONE_INFO: `${API_BASE_PATH}/day-pillars/timezone-info`,
  GET_AVAILABLE_CITIES: `${API_BASE_PATH}/day-pillars/available-cities`,
};

// ========== データモデル ==========

// 地理座標インターフェース
export interface IGeoCoordinates {
  longitude: number; // 経度（東経プラス、西経マイナス）
  latitude: number;  // 緯度（北緯プラス、南緯マイナス）
}

// 拡張ロケーション情報
export interface ExtendedLocation {
  name?: string;
  country?: string;
  coordinates: {
    longitude: number;
    latitude: number;
  };
  timeZone?: string;
}

// タイムゾーン調整情報
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
  location?: {
    name?: string;
    coordinates?: {
      longitude: number;
      latitude: number;
    };
    timeZone?: string;
  };
  useInternationalMode?: boolean;
  message?: string;
  error?: string;
}

// 簡略化されたタイムゾーン情報
export interface SimplifiedTimezoneInfo {
  locationName: string;      // 場所名（都道府県名または「海外」）
  adjustment: number;        // 時差調整値（分）
  description: string;       // 説明文（例: "東京都: +19分"）
  isOverseas: boolean;       // 海外フラグ
}

// SajuEngine計算オプション
export interface SajuOptions {
  useLocalTime?: boolean;          // 地方時（経度に基づく時差）を使用するか
  useDST?: boolean;                // 夏時間（サマータイム）を考慮するか
  useHistoricalDST?: boolean;      // 歴史的サマータイム（日本1948-1951年）を考慮するか
  useStandardTimeZone?: boolean;   // 標準タイムゾーンを使用するか（政治的/行政的）
  useInternationalMode?: boolean;  // 国際対応モードを使用するか
  useSecondsPrecision?: boolean;   // 秒単位の精度を使用するか
  gender?: Gender;                 // 性別 (M=男性, F=女性)
  location?: string | {            // 出生地（都市名または座標）
    longitude: number;
    latitude: number;
    timeZone?: string;             // オプションでタイムゾーン指定
  } | ExtendedLocation;            // 拡張ロケーション情報
  referenceStandardMeridian?: number; // 標準経度（デフォルト：東経135度）
}

// 性別
export enum Gender {
  MALE = 'M',
  FEMALE = 'F',
}

// 権限レベル
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

// リクエスト拡張型（認証情報付き）は上部で定義済み

// チャット関連の型と列挙型
export enum ChatMode {
  PERSONAL = 'personal',
  TEAM_MEMBER = 'team_member',
  TEAM_GOAL = 'team_goal',
}

export interface ChatMessageRequest {
  message: string;
  mode: ChatMode;
  relatedUserId?: string;
  contextInfo?: Record<string, any>;
}

export interface ChatModeRequest {
  mode: ChatMode;
  relatedUserId?: string;
  contextInfo?: Record<string, any>;
}

// 運勢スコア計算結果
export interface FortuneScoreResult {
  score: number;
  advice: string;
  luckyItems: {
    color: string;
    item: string;
    drink: string;
  };
  stemElement: string;
  branchElement: string;
  balanceStatus?: {
    wood: string;
    fire: string;
    earth: string;
    metal: string;
    water: string;
  };
  yojinRelation?: string;
  dayIsGeneratingYojin?: boolean;
  dayIsControllingYojin?: boolean;
  useBalancedAlgorithm: boolean;
  useEnhancedAlgorithm: boolean;
  fortuneType?: string;
}

// 認証関連の型定義
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface IUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  teamId?: string;
  jobTitle?: string;
  goal?: string;
  
  // 四柱推命関連フィールド
  birthDate?: Date;
  birthTime?: string;
  birthPlace?: string;
  gender?: Gender;
  birthplaceCoordinates?: IGeoCoordinates;
  localTimeOffset?: number;
  timeZone?: string;
  extendedLocation?: ExtendedLocation;
  elementAttribute?: string;
  dayMaster?: string;
  fourPillars?: {
    year: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
    month: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
    day: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
    hour: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
  };
  elementProfile?: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  kakukyoku?: {
    type: string;
    category: 'special' | 'normal';
    strength: 'strong' | 'weak' | 'neutral';
    description?: string;
  };
  yojin?: {
    tenGod: string;
    element: string;
    description?: string;
    supportElements?: string[];
    kijin?: {
      tenGod: string;
      element: string;
      description?: string;
    };
    kijin2?: {
      tenGod: string;
      element: string;
      description?: string;
    };
    kyujin?: {
      tenGod: string;
      element: string;
      description?: string;
    };
  };
  personalityDescription?: string;
  careerAptitude?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

// チーム関連の定数
export const ADMIN = "admin";

// 目標タイプの列挙型
export enum GoalType {
  CAREER = 'career',
  TEAM = 'team',
  PERSONAL = 'personal',
}

// 五行属性の列挙型
export enum Element {
  WOOD = 'wood',
  FIRE = 'fire',
  EARTH = 'earth',
  METAL = 'metal',
  WATER = 'water',
}

// 五行関係タイプの列挙型
export enum ElementRelation {
  PRODUCING = 'producing', // 相生
  CONTROLLING = 'controlling', // 相克
  NEUTRAL = 'neutral', // 中和
}

// チームモデルインターフェース
export interface ITeam {
  id: string;
  name: string;
  adminId: string;
  organizationId?: string;
  description?: string;
  iconInitial?: string;
  iconColor?: 'primary' | 'water' | 'wood' | 'fire' | 'earth' | 'metal';
  createdAt?: Date;
  updatedAt?: Date;
}

// ユーザー目標インターフェース
export interface IGoal {
  id: string;
  userId: string;
  type: GoalType;
  content: string;
  deadline?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}