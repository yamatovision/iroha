/**
 * タイムゾーン処理ユーティリティクラス
 * 国際対応リファクタリングのための実装
 */
import { DateTime } from 'luxon';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * タイムゾーン処理ユーティリティクラス
 */
export class TimeZoneUtils {
  // 世界の主要都市とタイムゾーン（簡易版）
  private static cityTimezones: Record<string, string> = {
    'Tokyo': 'Asia/Tokyo',
    'Osaka': 'Asia/Tokyo',
    'Seoul': 'Asia/Seoul',
    'Beijing': 'Asia/Shanghai',
    'Shanghai': 'Asia/Shanghai',
    'Hong Kong': 'Asia/Hong_Kong',
    'Taipei': 'Asia/Taipei',
    'Singapore': 'Asia/Singapore',
    'Bangkok': 'Asia/Bangkok',
    'Jakarta': 'Asia/Jakarta',
    'New Delhi': 'Asia/Kolkata',
    'Dubai': 'Asia/Dubai',
    'Moscow': 'Europe/Moscow',
    'Istanbul': 'Europe/Istanbul',
    'Berlin': 'Europe/Berlin',
    'Paris': 'Europe/Paris',
    'London': 'Europe/London',
    'New York': 'America/New_York',
    'Los Angeles': 'America/Los_Angeles',
    'Chicago': 'America/Chicago',
    'Toronto': 'America/Toronto',
    'Mexico City': 'America/Mexico_City',
    'São Paulo': 'America/Sao_Paulo',
    'Sydney': 'Australia/Sydney',
    'Melbourne': 'Australia/Melbourne'
  };
  
  /**
   * 都市名からタイムゾーン識別子を取得
   * @param cityName 都市名
   * @returns タイムゾーン識別子（見つからない場合はundefined）
   */
  static getTimezoneForCity(cityName: string): string | undefined {
    // 完全一致
    if (cityName in this.cityTimezones) {
      return this.cityTimezones[cityName];
    }
    
    // 大文字小文字を無視した一致
    const normalizedName = cityName.toLowerCase();
    const keys = Object.keys(this.cityTimezones);
    
    for (const key of keys) {
      if (key.toLowerCase() === normalizedName) {
        return this.cityTimezones[key];
      }
    }
    
    // 部分一致（あいまい検索）
    for (const key of keys) {
      if (key.toLowerCase().includes(normalizedName) || 
          normalizedName.includes(key.toLowerCase())) {
        return this.cityTimezones[key];
      }
    }
    
    return undefined;
  }
  /**
   * 座標からタイムゾーン識別子を推定
   * 注: 実際の実装では、timezone-boundary-builderやgeotzなどのライブラリを使うとより正確
   * このシンプルな実装では大まかな推定のみ行う
   * 
   * @param lat 緯度
   * @param lng 経度
   * @param date 日付 (タイムゾーン変更に対応するため)
   * @returns IANAタイムゾーン識別子
   */
  static getTimezoneIdentifier(lat: number, lng: number, date?: Date): string {
    // 簡易的なタイムゾーン推定
    // 経度に基づいて大まかなタイムゾーンを推定
    
    // 経度からUTCオフセットを概算（経度15度ごとに1時間）
    const utcOffset = Math.round(lng / 15);
    
    // 主要国のタイムゾーンマッピング（簡易版）
    if (lng >= 120 && lng <= 150 && lat >= 30 && lat <= 46) {
      return 'Asia/Tokyo'; // 日本とその周辺
    }
    
    if (lng >= 115 && lng <= 120 && lat >= 30 && lat <= 45) {
      return 'Asia/Shanghai'; // 中国東部
    }
    
    if (lng >= 126 && lng <= 130 && lat >= 33 && lat <= 39) {
      return 'Asia/Seoul'; // 韓国
    }
    
    if (lng >= -125 && lng <= -115 && lat >= 32 && lat <= 42) {
      return 'America/Los_Angeles'; // 米国西海岸
    }
    
    if (lng >= -85 && lng <= -70 && lat >= 38 && lat <= 45) {
      return 'America/New_York'; // 米国東海岸
    }
    
    if (lng >= -10 && lng <= 2 && lat >= 50 && lat <= 60) {
      return 'Europe/London'; // イギリス周辺
    }
    
    if (lng >= 2 && lng <= 10 && lat >= 43 && lat <= 52) {
      return 'Europe/Paris'; // フランス周辺
    }
    
    // その他の場所は単純に経度からUTCオフセットを計算
    if (utcOffset > 0) {
      return `Etc/GMT-${utcOffset}`; // 東側
    } else if (utcOffset < 0) {
      return `Etc/GMT+${Math.abs(utcOffset)}`; // 西側（符号が反転することに注意）
    }
    
    return 'UTC'; // デフォルト
  }
  
  /**
   * 特定日時におけるタイムゾーンオフセットを取得（分単位）
   * @param date 日付
   * @param timeZone タイムゾーン識別子
   * @returns タイムゾーンオフセット（分単位）
   */
  static getTimezoneOffset(date: Date, timeZone: string): number {
    try {
      const dt = DateTime.fromJSDate(date).setZone(timeZone);
      return dt.offset;
    } catch (error) {
      console.error('タイムゾーンオフセット取得エラー:', error);
      return 0; // エラー時は0を返す
    }
  }
  
  /**
   * サマータイムの適用判定
   * @param date 日付
   * @param timeZone タイムゾーン識別子
   * @returns サマータイム適用中かどうか
   */
  static isDST(date: Date, timeZone: string): boolean {
    try {
      const dt = DateTime.fromJSDate(date).setZone(timeZone);
      return dt.isInDST;
    } catch (error) {
      console.error('サマータイム判定エラー:', error);
      return false; // エラー時はfalseを返す
    }
  }
  
  /**
   * 日本の歴史的サマータイム判定（1948-1951年）
   * @param date 日付
   * @returns 日本の歴史的サマータイム期間内かどうか
   */
  static isJapaneseHistoricalDST(date: Date): boolean {
    const year = date.getFullYear();
    const month = date.getMonth(); // JavaScriptのDateは0始まり（0=1月）
    const day = date.getDate();
    const hour = date.getHours();
    
    // 1948年5月2日1時〜9月12日1時
    if (year === 1948) {
      // 5月2日1時から開始（month=4は5月）
      if (month === 4 && day === 2 && hour >= 1) return true;
      // 5月3日〜9月11日の全日
      if ((month === 4 && day > 2) || (month > 4 && month < 8) || (month === 8 && day < 12)) return true;
      // 9月12日の0時まで（month=8は9月）
      if (month === 8 && day === 12 && hour < 1) return true;
      return false;
    }
    
    // 1949年4月3日1時〜9月11日1時
    if (year === 1949) {
      // 4月3日1時から開始（month=3は4月）
      if (month === 3 && day === 3 && hour >= 1) return true;
      // 4月4日〜9月10日の全日
      if ((month === 3 && day > 3) || (month > 3 && month < 8) || (month === 8 && day < 11)) return true;
      // 9月11日の0時まで
      if (month === 8 && day === 11 && hour < 1) return true;
      return false;
    }
    
    // 1950年5月7日1時〜9月10日1時
    if (year === 1950) {
      // 5月7日1時から開始
      if (month === 4 && day === 7 && hour >= 1) return true;
      // 5月8日〜9月9日の全日
      if ((month === 4 && day > 7) || (month > 4 && month < 8) || (month === 8 && day < 10)) return true;
      // 9月10日の0時まで
      if (month === 8 && day === 10 && hour < 1) return true;
      return false;
    }
    
    // 1951年5月6日1時〜9月9日1時
    if (year === 1951) {
      // 5月6日1時から開始
      if (month === 4 && day === 6 && hour >= 1) return true;
      // 5月7日〜9月8日の全日
      if ((month === 4 && day > 6) || (month > 4 && month < 8) || (month === 8 && day < 9)) return true;
      // 9月9日の0時まで
      if (month === 8 && day === 9 && hour < 1) return true;
      return false;
    }
    
    return false;
  }
  
  /**
   * 経度に基づく地方時調整（分単位）
   * @param longitude 経度
   * @param referenceStandardMeridian 標準経度（デフォルト: 東経135度）
   * @returns 調整分数
   */
  static getLongitudeBasedTimeAdjustment(
    longitude: number, 
    referenceStandardMeridian: number = 135
  ): number {
    // 経度1度につき4分の時差
    return Math.round((longitude - referenceStandardMeridian) * 4);
  }
  
  /**
   * 都市別の微調整値を取得（分単位）
   * @param cityName 都市名
   * @param longitude 経度
   * @returns 調整分数
   */
  static getRegionalTimeAdjustment(cityName: string, longitude: number): number {
    // 都市名または経度範囲に基づく調整
    const adjustments: Record<string, number> = {
      "東京": 18,
      "ソウル": -32,
      "北京": -33,
    };
    
    // 都市名で直接一致する場合
    if (cityName in adjustments) {
      return adjustments[cityName];
    }
    
    // 経度範囲に基づく調整
    if (longitude >= 135 && longitude < 145) return 18; // 東京エリア
    if (longitude >= 125 && longitude < 135) return -32; // ソウルエリア
    if (longitude >= 115 && longitude < 125) return -33; // 北京エリア
    
    // デフォルトは経度に基づく標準計算
    return TimeZoneUtils.getLongitudeBasedTimeAdjustment(longitude);
  }
  
  /**
   * 特定のタイムゾーンの日時から別のタイムゾーンの日時に変換
   * @param date 元の日付
   * @param fromTimeZone 元のタイムゾーン
   * @param toTimeZone 変換先のタイムゾーン
   * @returns 変換後の日付
   */
  static convertTimeZone(date: Date, fromTimeZone: string, toTimeZone: string): Date {
    try {
      const utcDate = fromZonedTime(date, fromTimeZone);
      return toZonedTime(utcDate, toTimeZone);
    } catch (error) {
      console.error('タイムゾーン変換エラー:', error);
      return new Date(date); // エラー時は元の日付を返す
    }
  }
  
  /**
   * 特定のタイムゾーンでフォーマットされた日時文字列を取得
   * @param date 日付
   * @param timeZone タイムゾーン
   * @param format フォーマット文字列
   * @returns フォーマット済み文字列
   */
  static formatInTimeZone(date: Date, timeZone: string, format: string = 'yyyy-MM-dd HH:mm:ss'): string {
    try {
      return formatInTimeZone(date, timeZone, format);
    } catch (error) {
      console.error('日時フォーマットエラー:', error);
      return date.toISOString(); // エラー時はISO形式を返す
    }
  }
}