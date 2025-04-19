/**
 * 国際対応用モジュールのエントリーポイント
 * シンプル版の時差計算機能への移行完了
 */

// 新しいシンプル版タイムゾーン機能
export { SimplifiedTimeZoneManager, LocationData } from './SimplifiedTimeZoneManager';
export { 
  SimplifiedDateTimeProcessor, 
  type SimpleDateTime,
  type SimplifiedProcessedDateTime 
} from './SimplifiedDateTimeProcessor';
export { DateTimeProcessorWrapper } from './DateTimeProcessorWrapper';

// 互換性のために必要な型定義
export interface GeoCoordinates {
  longitude: number; // 経度（東経プラス、西経マイナス）
  latitude: number;  // 緯度（北緯プラス、南緯マイナス）
}

// ProcessedDateTime型の定義
export interface ProcessedDateTime {
  originalDate: Date;
  simpleDate: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second?: number;
  };
  adjustedDate: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second?: number;
  };
  localTimeAdjustment?: number;
  coordinates?: GeoCoordinates;
  
  // 旧暦情報
  lunarDate?: {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  };
  
  // 節気情報
  solarTermPeriod?: {
    name: string;
    index: number;
  };
  
  politicalTimeZone?: string;
  isDST?: boolean;
  timeZoneOffsetMinutes?: number;
  timeZoneOffsetSeconds?: number;
  localTimeAdjustmentSeconds?: number;
  adjustmentDetails?: {
    politicalTimeZoneAdjustment: number;
    longitudeBasedAdjustment: number;
    dstAdjustment: number;
    regionalAdjustment: number;
    totalAdjustmentMinutes: number;
    totalAdjustmentSeconds: number;
  };
}

// 旧バージョンとの互換性のために必要な型定義
export interface TimezoneAdjustmentInfo {
  politicalTimeZone: string;        // 政治的タイムゾーン (e.g. "Asia/Tokyo")
  isDST: boolean;                   // サマータイム適用状態
  timeZoneOffsetMinutes: number;    // タイムゾーンオフセット（分）
  timeZoneOffsetSeconds: number;    // タイムゾーンオフセット（秒）
  localTimeAdjustmentSeconds: number; // 秒単位の地方時調整
  adjustmentDetails: {              // 調整詳細
    politicalTimeZoneAdjustment: number; // 政治的タイムゾーンによる調整（分）
    longitudeBasedAdjustment: number;    // 経度ベースの調整（分）
    dstAdjustment: number;               // サマータイム調整（分）
    regionalAdjustment: number;          // 地域特有の調整（分）
    totalAdjustmentMinutes: number;      // 合計調整（分）
    totalAdjustmentSeconds: number;      // 合計調整（秒）
  };
}

export interface ExtendedLocation {
  name?: string;
  country?: string;
  coordinates: {
    longitude: number;
    latitude: number;
  };
  timeZone?: string;
}

// ラッパーとして提供
export { DateTimeProcessorWrapper as DateTimeProcessor } from './DateTimeProcessorWrapper';

// CityTimeZoneData インターフェース
export interface CityTimeZoneData {
  name: string;
  nameAlternatives: string[];
  country: string;
  timezone: string;
  coordinates: {
    longitude: number;
    latitude: number;
  };
  adjustmentMinutes?: number;
}