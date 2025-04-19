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

// SimplifiedTimeZoneManagerとSimplifiedDateTimeProcessorの簡易実装
export class SimplifiedTimeZoneManager {
  private static instance: SimplifiedTimeZoneManager;
  
  private constructor() {}
  
  public static getInstance(): SimplifiedTimeZoneManager {
    if (!SimplifiedTimeZoneManager.instance) {
      SimplifiedTimeZoneManager.instance = new SimplifiedTimeZoneManager();
    }
    return SimplifiedTimeZoneManager.instance;
  }
  
  public getAllLocations(): string[] {
    return [
      '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
      '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
      '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
      '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
      '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
      '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
      '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県', '海外'
    ];
  }
  
  public getAdjustmentMinutes(location: string): number {
    const defaultAdjustments: Record<string, number> = {
      '北海道': 25, '青森県': 23, '岩手県': 21, '宮城県': 20, '秋田県': 19, '山形県': 19,
      '福島県': 18, '茨城県': 19, '栃木県': 19, '群馬県': 18, '埼玉県': 19, '千葉県': 19,
      '東京都': 19, '神奈川県': 19, '新潟県': 17, '富山県': 15, '石川県': 14, '福井県': 13,
      '山梨県': 17, '長野県': 16, '岐阜県': 12, '静岡県': 15, '愛知県': 8, '三重県': 6,
      '滋賀県': 4, '京都府': 3, '大阪府': 2, '兵庫県': 1, '奈良県': 3, '和歌山県': 0,
      '鳥取県': -3, '島根県': -6, '岡山県': -4, '広島県': -8, '山口県': -12, '徳島県': -1,
      '香川県': -2, '愛媛県': -7, '高知県': -5, '福岡県': -18, '佐賀県': -20, '長崎県': -21,
      '熊本県': -19, '大分県': -16, '宮崎県': -14, '鹿児島県': -19, '沖縄県': -31, '海外': 0
    };
    return defaultAdjustments[location] || 0;
  }
  
  public getLocationDescription(location: string): string {
    const isOverseas = location === '海外';
    const adjustment = this.getAdjustmentMinutes(location);
    return isOverseas 
      ? "海外の場合は現地時間をそのまま入力してください" 
      : `${location}: ${adjustment >= 0 ? '+' : ''}${adjustment}分`;
  }
  
  public getAllLocationsWithInfo(): Array<{
    name: string;
    adjustment: number;
    description: string;
    isOverseas: boolean;
  }> {
    return this.getAllLocations().map(name => {
      const adjustment = this.getAdjustmentMinutes(name);
      const isOverseas = name === '海外';
      const description = this.getLocationDescription(name);
      return { name, adjustment, description, isOverseas };
    });
  }
  
  public getLocationCategories(): {
    prefectures: string[];
    overseas: string[];
  } {
    const locations = this.getAllLocations();
    return {
      prefectures: locations.filter(loc => loc !== '海外'),
      overseas: ['海外']
    };
  }
}

export class SimplifiedDateTimeProcessor {
  public processDateTime(date: Date, hourWithMinutes: number, birthplace?: any): any {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: Math.floor(hourWithMinutes),
      minute: Math.round((hourWithMinutes - Math.floor(hourWithMinutes)) * 60),
      second: 0,
      politicalTimeZone: 'Asia/Tokyo',
      isDST: false,
      timeZoneOffsetMinutes: 540, // デフォルトで東京（+9時間=540分）
      timeZoneOffsetSeconds: 540 * 60,
      localTimeAdjustmentSeconds: 0,
      coordinates: { longitude: 139.6917, latitude: 35.6895 },
      adjustmentDetails: {
        politicalTimeZoneAdjustment: 540,  // 政治的タイムゾーンによる調整
        longitudeBasedAdjustment: 0,       // 経度ベースの調整
        dstAdjustment: 0,                  // サマータイム調整
        regionalAdjustment: 0,             // 地域特有の調整
        totalAdjustmentMinutes: 540,       // 合計調整（分）
        totalAdjustmentSeconds: 540 * 60   // 合計調整（秒）
      }
    };
  }
}

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