/**
 * 韓国式四柱推命計算用の日時処理クラス
 * 日時処理、地方時調整、経度に基づく時差計算の実装
 */
import { SajuOptions } from './types';
// lunar-javascriptライブラリの代わりにシンプルな実装を使用
// 実装不足のモジュールを仮実装
// 本来はこのファイルを実装する必要がある
class LunarConverterStub {
  static getLunarDate(date: Date): { year: number; month: number; day: number; isLeapMonth: boolean } {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      isLeapMonth: false
    };
  }
  
  static getSolarTermPeriod(date: Date): { name: string; index: number } {
    const month = date.getMonth() + 1;
    const solarTerms = [
      '立春', '雨水', '啓蟄', '春分', '清明', '穀雨',
      '立夏', '小満', '芒種', '夏至', '小暑', '大暑',
      '立秋', '処暑', '白露', '秋分', '寒露', '霜降',
      '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
    ];
    
    return {
      name: solarTerms[((month - 1) * 2 + 1) % 24],
      index: ((month - 1) * 2 + 1) % 24
    };
  }
}

/**
 * 地理座標データ型
 */
interface GeoCoordinates {
  longitude: number; // 経度（東経プラス、西経マイナス）
  latitude: number;  // 緯度（北緯プラス、南緯マイナス）
}

/**
 * 出生地情報データ型
 */
interface BirthLocation {
  name: string;       // 都市・地域名
  coordinates: GeoCoordinates; // 座標情報
  timeZoneOffset?: number; // タイムゾーンオフセット（分）
}

/**
 * シンプルな日時データ構造
 */
interface SimpleDateTime {
  year: number;    // 年（例：1986）
  month: number;   // 月（1-12）
  day: number;     // 日（1-31）
  hour: number;    // 時（0-23）
  minute: number;  // 分（0-59）
}

/**
 * 処理済み日時データ
 */
export interface ProcessedDateTime {
  originalDate: Date;           // 元の日時
  simpleDate: SimpleDateTime;   // シンプル表現
  adjustedDate: SimpleDateTime; // 補正済み日時
  localTimeAdjustment?: number; // 地方時調整（分）
  coordinates?: GeoCoordinates; // 出生地の座標
  lunarDate?: {                 // 旧暦日付（null or undefined）
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  };
  solarTermPeriod?: {          // 節気情報
    name: string;              // 節気名
    index: number;             // 節気インデックス
  };
}

/**
 * 韓国式四柱推命計算用の日時処理クラス
 */
export class DateTimeProcessor {
  private options: SajuOptions;
  
  // 主要都市の座標データ（経度、緯度）
  private cityCoordinates: Record<string, GeoCoordinates> = {
    // 日本の主要都市
    "東京": { longitude: 139.6917, latitude: 35.6895 },
    "大阪": { longitude: 135.5023, latitude: 34.6937 },
    "名古屋": { longitude: 136.9066, latitude: 35.1815 },
    "札幌": { longitude: 141.3544, latitude: 43.0618 },
    "福岡": { longitude: 130.4017, latitude: 33.5902 },
    "京都": { longitude: 135.7681, latitude: 35.0116 },
    "神戸": { longitude: 135.1943, latitude: 34.6913 },
    "広島": { longitude: 132.4553, latitude: 34.3853 },
    "仙台": { longitude: 140.8694, latitude: 38.2682 },
    
    // 韓国の主要都市
    "ソウル": { longitude: 126.9780, latitude: 37.5665 },
    "釜山": { longitude: 129.0756, latitude: 35.1796 },
    "大邱": { longitude: 128.6014, latitude: 35.8714 },
    "仁川": { longitude: 126.7052, latitude: 37.4563 },
    
    // 中国の主要都市
    "北京": { longitude: 116.4074, latitude: 39.9042 },
    "上海": { longitude: 121.4737, latitude: 31.2304 },
    "広州": { longitude: 113.2644, latitude: 23.1291 },
    
    // 台湾の主要都市
    "台北": { longitude: 121.5654, latitude: 25.0330 },
    "高雄": { longitude: 120.3010, latitude: 22.6273 },
    
    // その他アジアの主要都市
    "シンガポール": { longitude: 103.8198, latitude: 1.3521 },
    "香港": { longitude: 114.1694, latitude: 22.3193 },
    "バンコク": { longitude: 100.5018, latitude: 13.7563 },
    
    // 欧米の主要都市
    "ニューヨーク": { longitude: -74.0060, latitude: 40.7128 },
    "ロサンゼルス": { longitude: -118.2437, latitude: 34.0522 },
    "ロンドン": { longitude: -0.1278, latitude: 51.5074 },
    "パリ": { longitude: 2.3522, latitude: 48.8566 },
    "シドニー": { longitude: 151.2093, latitude: -33.8688 }
  };
  
  // 地域特有の時差調整値（分単位）
  private regionalTimeAdjustments: Record<string, number> = {
    "東京エリア": 18,      // 東京・関東エリア: +18分
    "大阪エリア": 0,       // 大阪・関西エリア: 0分（標準）
    "ソウルエリア": -32,   // ソウルエリア: -32分
    "北京エリア": -33,     // 北京エリア: -33分
  };
  
  /**
   * 日時処理クラスを初期化
   * @param options 計算オプション
   */
  constructor(options: SajuOptions = {}) {
    this.options = {
      useLocalTime: true,  // デフォルトで地方時調整を有効化
      useDST: true,        // デフォルトで夏時間を考慮
      ...options
    };
  }
  
  /**
   * オプションを更新する
   * @param newOptions 新しいオプション
   */
  updateOptions(newOptions: Partial<SajuOptions>) {
    this.options = {
      ...this.options,
      ...newOptions
    };
  }
  
  /**
   * 都市名から座標情報を取得
   * @param cityName 都市名
   * @returns 座標情報（見つからない場合はundefined）
   */
  getCityCoordinates(cityName: string): GeoCoordinates | undefined {
    return this.cityCoordinates[cityName];
  }
  
  /**
   * 都市リストを取得
   * @returns 利用可能な都市名のリスト
   */
  getAvailableCities(): string[] {
    return Object.keys(this.cityCoordinates);
  }
  
  /**
   * 都市の座標を追加または更新
   * @param cityName 都市名
   * @param coordinates 座標情報
   */
  addCityCoordinates(cityName: string, coordinates: GeoCoordinates): void {
    this.cityCoordinates[cityName] = coordinates;
  }
  
  /**
   * 日時を処理して四柱推命計算用の情報を取得
   * @param date 日付オブジェクト
   * @param hourWithMinutes 時間（分を含む小数表現も可）
   * @param birthplace 出生地（都市名または座標）
   * @returns 処理済み日時情報
   */
  processDateTime(date: Date, hourWithMinutes: number, birthplace?: string | GeoCoordinates): ProcessedDateTime {
    // 基本的な日時情報を取得
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScriptのDateは0始まりの月
    const day = date.getDate();
    
    // 時間と分に変換
    const hour = Math.floor(hourWithMinutes);
    const minute = Math.round((hourWithMinutes - hour) * 60);
    
    // シンプル日時オブジェクト
    const simpleDate: SimpleDateTime = {
      year, month, day, hour, minute
    };
    
    // 座標情報の取得
    let coordinates: GeoCoordinates | undefined;
    if (typeof birthplace === 'string') {
      coordinates = this.getCityCoordinates(birthplace);
    } else if (birthplace) {
      coordinates = birthplace;
    }
    
    // 地方時調整の計算
    const localTimeAdjustment = coordinates ? 
      this.getLocalTimeAdjustmentMinutes(coordinates) : 0;
    
    // 日時調整
    const adjustedDate = this.adjustDateTime(simpleDate, localTimeAdjustment);
    
    // 旧暦情報と節気情報を取得
    // LunarConverterStubを使って旧暦と節気情報を取得
    const lunarDateObj = new Date(adjustedDate.year, adjustedDate.month - 1, adjustedDate.day);
    const lunarDate = LunarConverterStub.getLunarDate(lunarDateObj);
    const solarTermPeriod = LunarConverterStub.getSolarTermPeriod(lunarDateObj);
    
    return {
      originalDate: date,
      simpleDate,
      adjustedDate,
      localTimeAdjustment,
      coordinates,
      lunarDate,
      solarTermPeriod
    };
  }
  
  /**
   * 日時を調整（地方時調整）
   * @param dateTime シンプル日時
   * @param localTimeAdjustmentMinutes 地方時調整（分単位）
   * @returns 調整済み日時
   */
  private adjustDateTime(dateTime: SimpleDateTime, localTimeAdjustmentMinutes: number = 0): SimpleDateTime {
    if (!this.options.useLocalTime || localTimeAdjustmentMinutes === 0) {
      return { ...dateTime };
    }
    
    // 調整前の時間と分
    let { year, month, day, hour, minute } = dateTime;
    
    // 分の調整
    minute += localTimeAdjustmentMinutes;
    
    // 時間のオーバーフロー処理
    while (minute >= 60) {
      minute -= 60;
      hour += 1;
    }
    
    while (minute < 0) {
      minute += 60;
      hour -= 1;
    }
    
    // 日付のオーバーフロー処理
    while (hour >= 24) {
      hour -= 24;
      day += 1;
    }
    
    while (hour < 0) {
      hour += 24;
      day -= 1;
    }
    
    // 月末日の調整（簡易版）
    const daysInMonth = new Date(year, month, 0).getDate();
    while (day > daysInMonth) {
      day -= daysInMonth;
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    
    while (day < 1) {
      month -= 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
      const prevMonthDays = new Date(year, month, 0).getDate();
      day += prevMonthDays;
    }
    
    return { year, month, day, hour, minute };
  }
  
  /**
   * 座標情報から地方時調整値（分単位）を取得
   * @param coordinates 座標情報
   * @returns 地方時調整値（分単位）
   */
  getLocalTimeAdjustmentMinutes(coordinates: GeoCoordinates): number {
    const { longitude } = coordinates;
    
    // 地域特有の調整
    if (longitude >= 135 && longitude < 145) {
      // 東京エリア: +18分
      return this.regionalTimeAdjustments["東京エリア"];
    } else if (longitude >= 125 && longitude < 135) {
      // ソウルエリア: -32分
      return this.regionalTimeAdjustments["ソウルエリア"];
    } else if (longitude >= 115 && longitude < 125) {
      // 北京エリア: -33分
      return this.regionalTimeAdjustments["北京エリア"];
    }
    
    // 標準経度（日本）からの差に基づく計算
    // 経度1度あたり4分の差
    const standardLongitude = 135; // 日本標準時の経度
    const longitudeDifference = longitude - standardLongitude;
    return Math.round(longitudeDifference * 4);
  }
  
  /**
   * 節気名を取得（簡易実装）
   * @param month 月
   * @returns 節気名
   */
  private getSolarTermName(month: number): string {
    const solarTerms = [
      '立春', '雨水', '啓蟄', '春分', '清明', '穀雨',
      '立夏', '小満', '芒種', '夏至', '小暑', '大暑',
      '立秋', '処暑', '白露', '秋分', '寒露', '霜降',
      '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
    ];
    
    // 簡易実装：月に応じた節気を返す
    return solarTerms[((month - 1) * 2 + 1) % 24];
  }
  
  /**
   * 節気インデックスを取得（簡易実装）
   * @param month 月
   * @returns 節気インデックス
   */
  private getSolarTermIndex(month: number): number {
    // 簡易実装：月に応じたインデックスを返す
    return ((month - 1) * 2 + 1) % 24;
  }
}