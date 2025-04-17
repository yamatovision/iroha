/**
 * 国際対応用モジュールのエントリーポイント
 */

export { TimeZoneUtils } from './TimeZoneUtils';
export { SecondAdjuster } from './SecondAdjuster';
export { TimeZoneDatabase, CityTimeZoneData } from './TimeZoneDatabase';
export { 
  DateTimeProcessor, 
  GeoCoordinates, 
  SimpleDateTime, 
  ProcessedDateTime 
} from './DateTimeProcessor';

// Typesの再エクスポート
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