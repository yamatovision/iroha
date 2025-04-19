/**
 * DateTimeProcessorWrapper.ts
 * 既存コードとの互換性を保つためのラッパークラス
 */

import { SajuOptions, ExtendedLocation } from '../types';
import { GeoCoordinates, ProcessedDateTime } from './index';
import { SimplifiedDateTimeProcessor, SimpleDateTime } from './SimplifiedDateTimeProcessor';
import { SimplifiedTimeZoneManager } from './SimplifiedTimeZoneManager';

/**
 * 互換性維持のための旧インターフェースを保持したクラス
 */
export class DateTimeProcessorWrapper {
  private simplifiedProcessor: SimplifiedDateTimeProcessor;
  private options: SajuOptions;
  
  /**
   * コンストラクタ
   * @param options オプション（互換性のため維持）
   */
  constructor(options: SajuOptions = {}) {
    this.options = {
      useLocalTime: true,
      useDST: true,
      useHistoricalDST: true,
      useStandardTimeZone: true,
      useSecondsPrecision: true,
      referenceStandardMeridian: 135,
      ...options
    };
    
    this.simplifiedProcessor = new SimplifiedDateTimeProcessor();
  }
  
  /**
   * 既存シグネチャを維持した処理メソッド
   */
  processDateTime(
    date: Date, 
    hourWithMinutes: number, 
    birthplace?: string | GeoCoordinates | ExtendedLocation
  ): ProcessedDateTime {
    // 入力をシンプルな都道府県または「海外」に変換
    const locationName = this.convertToLocationName(birthplace);
    
    // 新しいプロセッサで処理
    const simplifiedResult = this.simplifiedProcessor.processDateTime(
      date, hourWithMinutes, locationName
    );
    
    // 結果を互換性のある形式に変換して返却
    return this.convertToCompatibleResult(simplifiedResult, birthplace);
  }
  
  /**
   * オプションを更新する（互換性のため維持）
   */
  updateOptions(newOptions: Partial<SajuOptions>) {
    this.options = {
      ...this.options,
      ...newOptions
    };
  }
  
  /**
   * 都市名から座標情報を取得（互換性のため維持）
   */
  getCityCoordinates(cityName: string): GeoCoordinates | undefined {
    // 簡易実装（都道府県は座標がわからないため、undefined返却）
    return undefined;
  }
  
  /**
   * 都市リストを取得（互換性のため維持）
   */
  getAvailableCities(): string[] {
    return this.simplifiedProcessor.getAllLocations();
  }
  
  /**
   * 入力をSimplifiedDateTimeProcessorが扱える形式に変換
   */
  private convertToLocationName(birthplace?: string | GeoCoordinates | ExtendedLocation): string {
    // 未指定の場合は「海外」として扱う
    if (!birthplace) return '海外';
    
    // 文字列の場合（都市名または都道府県名）
    if (typeof birthplace === 'string') {
      // 都道府県のリストを取得
      const prefectures = this.simplifiedProcessor.getJapanesePrefectures();
      
      // 完全一致する都道府県名がある場合はそれを返す
      if (prefectures.includes(birthplace)) {
        return birthplace;
      }
      
      // 部分一致する都道府県名を探す
      for (const prefecture of prefectures) {
        if (birthplace.includes(prefecture)) {
          return prefecture;
        }
      }
      
      // 一致する都道府県が見つからない場合は「海外」として扱う
      return '海外';
    }
    
    // 座標やExtendedLocationの場合は「海外」として扱う
    return '海外';
  }
  
  /**
   * 結果を既存インターフェースと互換性のある形式に変換
   */
  private convertToCompatibleResult(
    simplified: any, 
    birthplace?: string | GeoCoordinates | ExtendedLocation
  ): ProcessedDateTime {
    // 座標情報を取得（あれば）
    const coordinates = typeof birthplace === 'string' 
      ? undefined 
      : ('coordinates' in birthplace ? (birthplace as any).coordinates : birthplace);
    
    // 以下は互換性のためのダミーデータ
    const dummyAdjustmentDetails = {
      politicalTimeZoneAdjustment: 0,
      longitudeBasedAdjustment: simplified.adjustment,
      dstAdjustment: 0,
      regionalAdjustment: 0,
      totalAdjustmentMinutes: simplified.adjustment,
      totalAdjustmentSeconds: simplified.adjustment * 60
    };
    
    // ProcessedDateTime形式で返却
    return {
      originalDate: simplified.originalDate,
      simpleDate: simplified.simpleDate,
      adjustedDate: simplified.adjustedDate,
      localTimeAdjustment: simplified.adjustment,
      coordinates,
      
      // 以下はダミーデータ（互換性のため）
      lunarDate: {
        year: simplified.adjustedDate.year,
        month: simplified.adjustedDate.month,
        day: simplified.adjustedDate.day,
        isLeapMonth: false
      },
      solarTermPeriod: {
        name: '',
        index: 0
      },
      politicalTimeZone: 'UTC',
      isDST: false,
      timeZoneOffsetMinutes: 0,
      timeZoneOffsetSeconds: 0,
      localTimeAdjustmentSeconds: simplified.adjustment * 60,
      adjustmentDetails: dummyAdjustmentDetails
    };
  }
}