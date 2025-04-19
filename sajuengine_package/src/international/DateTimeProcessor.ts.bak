/**
 * 国際対応版DateTimeProcessor
 * 既存のDateTimeProcessorを拡張し、国際タイムゾーン対応を追加
 */
import { SajuOptions, TimezoneAdjustmentInfo, ExtendedLocation } from '../types';
import { TimeZoneUtils } from './TimeZoneUtils';
import { SecondAdjuster } from './SecondAdjuster';
import { TimeZoneDatabase, CityTimeZoneData } from './TimeZoneDatabase';

/**
 * 地理座標データ型
 */
export interface GeoCoordinates {
  longitude: number; // 経度（東経プラス、西経マイナス）
  latitude: number;  // 緯度（北緯プラス、南緯マイナス）
}

/**
 * シンプルな日時データ構造
 */
export interface SimpleDateTime {
  year: number;    // 年（例：1986）
  month: number;   // 月（1-12）
  day: number;     // 日（1-31）
  hour: number;    // 時（0-23）
  minute: number;  // 分（0-59）
  second?: number; // 秒（0-59）オプション
}

/**
 * 処理済み日時データ（国際対応版）
 */
export interface ProcessedDateTime {
  originalDate: Date;           // 元の日時
  simpleDate: SimpleDateTime;   // シンプル表現
  adjustedDate: SimpleDateTime; // 補正済み日時
  localTimeAdjustment?: number; // 地方時調整（分）
  coordinates?: GeoCoordinates; // 出生地の座標
  
  // 旧暦情報
  lunarDate?: {                 
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  };
  
  // 節気情報
  solarTermPeriod?: {          
    name: string;              // 節気名
    index: number;             // 節気インデックス
  };
  
  // 国際対応拡張情報
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

// 旧暦変換のシンプル実装（本来はlunar-javascriptライブラリを使用）
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
 * 国際対応版日時処理クラス
 */
export class DateTimeProcessor {
  private options: SajuOptions;
  private timeZoneDatabase: TimeZoneDatabase;
  
  // 主要都市の座標データ（既存データベースとの互換性維持）
  private cityCoordinates: Record<string, GeoCoordinates> = {};
  
  // 地域特有の時差調整値（分単位）（既存との互換性維持）
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
      useHistoricalDST: true, // 歴史的サマータイム対応
      useStandardTimeZone: true, // 政治的タイムゾーン使用
      useSecondsPrecision: true, // 秒単位の精度
      referenceStandardMeridian: 135, // 標準経度（東経135度）
      ...options
    };
    
    // タイムゾーンデータベースの初期化
    this.timeZoneDatabase = new TimeZoneDatabase();
    
    // 都市データベースから座標データをインポート（互換性維持）
    this.importCityCoordinates();
  }
  
  /**
   * 都市データベースから座標データをインポート
   */
  private importCityCoordinates() {
    const allCities = this.timeZoneDatabase.getAllCities();
    
    allCities.forEach(city => {
      this.cityCoordinates[city.name] = {
        longitude: city.coordinates.longitude,
        latitude: city.coordinates.latitude
      };
      
      // 代替名も登録
      city.nameAlternatives.forEach(altName => {
        if (!this.cityCoordinates[altName]) {
          this.cityCoordinates[altName] = {
            longitude: city.coordinates.longitude,
            latitude: city.coordinates.latitude
          };
        }
      });
    });
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
    // まず新しいデータベースで検索
    const cityData = this.timeZoneDatabase.findCity(cityName);
    if (cityData) {
      return {
        longitude: cityData.coordinates.longitude,
        latitude: cityData.coordinates.latitude
      };
    }
    
    // 後方互換性のために既存のデータも検索
    return this.cityCoordinates[cityName];
  }
  
  /**
   * 都市リストを取得
   * @returns 利用可能な都市名のリスト
   */
  getAvailableCities(): string[] {
    return this.timeZoneDatabase.getAllCities().map(city => city.name);
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
   * 日時を処理して四柱推命計算用の情報を取得（国際対応版）
   * @param date 日付オブジェクト
   * @param hourWithMinutes 時間（分を含む小数表現も可）
   * @param birthplace 出生地（都市名または座標またはExtendedLocation）
   * @returns 処理済み日時情報
   */
  processDateTime(
    date: Date, 
    hourWithMinutes: number, 
    birthplace?: string | GeoCoordinates | ExtendedLocation
  ): ProcessedDateTime {
    // 基本的な日時情報を取得
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScriptのDateは0始まりの月
    const day = date.getDate();
    
    // 時間と分に変換
    const hour = Math.floor(hourWithMinutes);
    const minute = Math.round((hourWithMinutes - hour) * 60);
    const second = date.getSeconds(); // 元の日付から秒を取得
    
    // シンプル日時オブジェクト
    const simpleDate: SimpleDateTime = {
      year, month, day, hour, minute, second
    };
    
    // === 座標情報と都市情報の取得 ===
    let coordinates: GeoCoordinates | undefined;
    let cityData: CityTimeZoneData | undefined;
    let cityName: string | undefined;
    let timeZone: string | undefined;
    
    if (typeof birthplace === 'string') {
      // 文字列の場合は都市名として検索
      cityName = birthplace;
      cityData = this.timeZoneDatabase.findCity(birthplace);
      
      // 都市データが見つかれば座標とタイムゾーンを取得
      if (cityData) {
        coordinates = {
          longitude: cityData.coordinates.longitude,
          latitude: cityData.coordinates.latitude
        };
        timeZone = cityData.timezone;
      } else {
        // 従来の方法でフォールバック
        coordinates = this.getCityCoordinates(birthplace);
      }
    } else if (birthplace) {
      if ('timeZone' in birthplace) {
        // ExtendedLocationの場合
        const extendedLoc = birthplace as ExtendedLocation;
        coordinates = extendedLoc.coordinates;
        timeZone = extendedLoc.timeZone;
        cityName = extendedLoc.name;
      } else {
        // 単純な座標の場合
        coordinates = birthplace as GeoCoordinates;
      }
      
      // タイムゾーンが未指定で座標がある場合、最寄りの都市を検索
      if (!timeZone && coordinates) {
        cityData = this.timeZoneDatabase.findNearestCity(
          coordinates.longitude, 
          coordinates.latitude
        );
        
        if (cityData) {
          timeZone = cityData.timezone;
          if (!cityName) cityName = cityData.name;
        }
      }
    }

    // === タイムゾーン計算 ===
    let politicalTimeZone = "UTC";
    let isDST = false;
    let timeZoneOffsetMinutes = 0;
    let dstAdjustment = 0;
    let regionalAdjustment = 0;
    
    // 1. 政治的タイムゾーン処理（useStandardTimeZoneが有効な場合）
    if (this.options.useStandardTimeZone && coordinates) {
      // タイムゾーンが明示的に指定されているか確認
      if (timeZone) {
        politicalTimeZone = timeZone;
      } else {
        // 座標からタイムゾーン識別子を取得
        politicalTimeZone = TimeZoneUtils.getTimezoneIdentifier(
          coordinates.latitude, 
          coordinates.longitude, 
          date
        );
      }
      
      // 標準的なタイムゾーンオフセットを取得
      timeZoneOffsetMinutes = TimeZoneUtils.getTimezoneOffset(date, politicalTimeZone);
    }
    
    // 2. サマータイム（DST）処理
    if (this.options.useDST) {
      // 近代的なDST
      if (politicalTimeZone !== "UTC") {
        isDST = TimeZoneUtils.isDST(date, politicalTimeZone);
        
        // 特定のタイムゾーンに応じたDST調整は通常不要
        // オフセットはすでにTimeZoneOffsetに反映されている
      }
      
      // 日本の歴史的サマータイム (1948-1951)
      if (this.options.useHistoricalDST && 
          politicalTimeZone === 'Asia/Tokyo' && 
          TimeZoneUtils.isJapaneseHistoricalDST(date)) {
        isDST = true;
        dstAdjustment = -60; // 1時間マイナス
      }
    }
    
    // 3. 地域特有の調整（経度ベースの地方時調整）
    if (this.options.useLocalTime && coordinates) {
      // 都市データから取得または経度に基づく計算
      if (cityData && cityData.adjustmentMinutes !== undefined) {
        regionalAdjustment = cityData.adjustmentMinutes;
      } else if (cityName) {
        // 都市名での直接照合
        const regionName = 
          cityName.includes('東京') ? "東京エリア" :
          cityName.includes('大阪') ? "大阪エリア" :
          cityName.includes('ソウル') ? "ソウルエリア" :
          cityName.includes('北京') ? "北京エリア" : undefined;
          
        if (regionName && regionName in this.regionalTimeAdjustments) {
          regionalAdjustment = this.regionalTimeAdjustments[regionName];
        } else {
          // 経度から標準計算
          regionalAdjustment = TimeZoneUtils.getRegionalTimeAdjustment(
            cityName || '', 
            coordinates.longitude
          );
        }
      } else {
        // 経度ベースの標準計算
        regionalAdjustment = TimeZoneUtils.getLongitudeBasedTimeAdjustment(
          coordinates.longitude,
          this.options.referenceStandardMeridian || 135
        );
      }
    }
    
    // 4. 調整の合計計算
    // 地方時調整の合計を計算（標準タイムゾーンを使用しない場合、0になる）
    const standardTimeZoneAdjustment = this.options.useStandardTimeZone ? timeZoneOffsetMinutes : 0;
    
    // 地方時調整（合計）
    const localTimeAdjustment = this.options.useLocalTime ? 
      regionalAdjustment + dstAdjustment : 0;
    
    // 調整詳細
    const adjustmentDetails = {
      politicalTimeZoneAdjustment: standardTimeZoneAdjustment,
      longitudeBasedAdjustment: this.options.useLocalTime ? 
        TimeZoneUtils.getLongitudeBasedTimeAdjustment(
          coordinates?.longitude || 135, 
          this.options.referenceStandardMeridian || 135
        ) : 0,
      dstAdjustment,
      regionalAdjustment,
      totalAdjustmentMinutes: localTimeAdjustment,
      totalAdjustmentSeconds: localTimeAdjustment * 60
    };
    
    // 5. 日時調整
    // 既存の分単位調整
    const adjustedDate = this.adjustDateTime(simpleDate, localTimeAdjustment);
    
    // 6. 秒単位の調整（新機能）
    let adjustedDateWithSeconds = adjustedDate;
    if (this.options.useSecondsPrecision) {
      // 標準的な日時オブジェクトの生成
      const preciseDate = new Date(
        adjustedDate.year, 
        adjustedDate.month - 1, 
        adjustedDate.day,
        adjustedDate.hour,
        adjustedDate.minute,
        adjustedDate.second || 0
      );
      
      // 秒の四捨五入
      const roundedDate = SecondAdjuster.roundSeconds(preciseDate);
      
      // SimpleDateTime形式に戻す
      adjustedDateWithSeconds = {
        year: roundedDate.getFullYear(),
        month: roundedDate.getMonth() + 1,
        day: roundedDate.getDate(),
        hour: roundedDate.getHours(),
        minute: roundedDate.getMinutes(),
        second: roundedDate.getSeconds()
      };
    }
    
    // 7. 旧暦と節気情報を取得
    const lunarDateObj = new Date(
      adjustedDateWithSeconds.year, 
      adjustedDateWithSeconds.month - 1, 
      adjustedDateWithSeconds.day,
      adjustedDateWithSeconds.hour,
      adjustedDateWithSeconds.minute,
      adjustedDateWithSeconds.second || 0
    );
    
    const lunarDate = LunarConverterStub.getLunarDate(lunarDateObj);
    const solarTermPeriod = LunarConverterStub.getSolarTermPeriod(lunarDateObj);
    
    // 8. 結果の返却
    return {
      originalDate: date,
      simpleDate,
      adjustedDate: adjustedDateWithSeconds,
      localTimeAdjustment,
      coordinates,
      lunarDate,
      solarTermPeriod,
      // 国際対応の新しいプロパティ
      politicalTimeZone,
      isDST,
      timeZoneOffsetMinutes,
      timeZoneOffsetSeconds: timeZoneOffsetMinutes * 60,
      localTimeAdjustmentSeconds: localTimeAdjustment * 60,
      adjustmentDetails
    };
  }
  
  /**
   * 日時を調整（地方時調整）
   * @param dateTime シンプル日時
   * @param localTimeAdjustmentMinutes 地方時調整（分単位）
   * @returns 調整済み日時
   */
  private adjustDateTime(dateTime: SimpleDateTime, localTimeAdjustmentMinutes: number = 0): SimpleDateTime {
    if (localTimeAdjustmentMinutes === 0) {
      return { ...dateTime };
    }
    
    // 調整前の時間と分
    let { year, month, day, hour, minute, second } = dateTime;
    
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
    
    return { year, month, day, hour, minute, second };
  }
  
  /**
   * 座標情報から地方時調整値（分単位）を取得
   * 既存メソッドの互換性を維持
   * 
   * @param coordinates 座標情報
   * @returns 地方時調整値（分単位）
   */
  getLocalTimeAdjustmentMinutes(coordinates: GeoCoordinates): number {
    return TimeZoneUtils.getRegionalTimeAdjustment('', coordinates.longitude);
  }
}