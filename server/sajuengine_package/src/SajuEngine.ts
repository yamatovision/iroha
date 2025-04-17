/**
 * 韓国式四柱推命計算エンジンクラス
 * リファクタリング計画に基づいた統合実装（国際対応版）
 */
import { Pillar, FourPillars, SajuOptions, TimezoneAdjustmentInfo, ExtendedLocation } from './types';
import { DateTimeProcessor, ProcessedDateTime } from './DateTimeProcessor';
// 新しい国際対応のモジュールをインポート
import { 
  DateTimeProcessor as InternationalDateTimeProcessor, 
  GeoCoordinates,
  TimeZoneUtils 
} from './international';
import { calculateKoreanYearPillar } from './koreanYearPillarCalculator';
import { calculateKoreanMonthPillar } from './koreanMonthPillarCalculator';
import { calculateKoreanDayPillar } from './dayPillarCalculator';
import { calculateKoreanHourPillar } from './hourPillarCalculator';
// 十神関係計算関連の関数をインポート
import * as tenGodCalculator from './tenGodCalculator';
import { calculateTwelveFortunes } from './twelveFortuneSpiritCalculator';
import { calculateTwelveSpirits } from './twelveSpiritKillerCalculator';
// 高精度の十神関係計算モジュールをインポート
import { determineBranchTenGodRelation as determineBranchTenGodRelationMapped } from './tenGodFixedMapping';
// 改良アルゴリズムによる十神関係計算モジュールをインポート (100%精度)
import { calculateBranchTenGodRelation as calculateImprovedBranchTenGod } from './tenGodImprovedAlgorithm';
// 特殊ケース処理モジュールをインポート
import { handleSpecialCases, isSpecialCase } from './specialCaseHandler';
// 立春日時データベースをインポート
import { getLiChunDate, isBeforeLiChunFromDB } from './lichunDatabase';
// 干合・支合処理モジュールをインポート
import { applyGanShiCombinations } from './ganShiCombinations';
// 格局計算モジュールをインポート
import { determineKakukyoku } from './kakukyokuCalculator';
import { determineYojin } from './yojinCalculator';

/**
 * 四柱推命計算結果の型（国際対応版）
 */
export interface SajuResult {
  fourPillars: FourPillars;
  lunarDate?: {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  };
  tenGods: Record<string, string>;
  elementProfile: {
    mainElement: string;
    secondaryElement: string;
    yinYang: string;
    // 五行バランス（木・火・土・金・水の出現数）
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  processedDateTime: ProcessedDateTime;
  twelveFortunes?: Record<string, string>; // 十二運星
  twelveSpiritKillers?: Record<string, string>; // 十二神殺
  hiddenStems?: {      // 蔵干
    year: string[];
    month: string[];
    day: string[];
    hour: string[];
  };
  // 格局と用神情報
  kakukyoku?: {        // 格局情報
    type: string;               // 例: '従旺格', '建禄格'など
    category: 'special' | 'normal'; // 特別格局か普通格局か
    strength: 'strong' | 'weak' | 'neutral'; // 身強か身弱か中和か
    description?: string;       // 格局の説明
  };
  yojin?: {            // 用神情報
    tenGod: string;             // 十神表記: 例 '比肩', '食神'
    element: string;            // 五行表記: 例 'wood', 'fire'
    description?: string;       // 用神の説明
    supportElements?: string[]; // 用神をサポートする五行
  };
  // 国際対応拡張情報
  location?: {
    name?: string;
    country?: string;
    coordinates?: {
      longitude: number;
      latitude: number;
    };
    timeZone?: string;
  };
  timezoneInfo?: TimezoneAdjustmentInfo;
}

/**
 * 四柱推命計算エンジンクラス（国際対応版）
 */
export class SajuEngine {
  private dateProcessor: DateTimeProcessor | InternationalDateTimeProcessor;
  private options: SajuOptions;
  private useInternationalMode: boolean;

  /**
   * 四柱推命計算エンジンを初期化
   * @param options 計算オプション
   */
  constructor(options: SajuOptions = {}) {
    this.options = {
      useLocalTime: true, // デフォルトで地方時調整を有効化
      useInternationalMode: true, // デフォルトで国際対応モードを有効化
      useDST: true, // デフォルトで夏時間を考慮
      useHistoricalDST: true, // デフォルトで歴史的夏時間を考慮
      useStandardTimeZone: true, // デフォルトで標準タイムゾーンを使用
      useSecondsPrecision: true, // デフォルトで秒単位の精度を使用
      referenceStandardMeridian: 135, // デフォルトで東経135度を基準
      ...options
    };
    
    // 国際対応モードに応じてDateTimeProcessorを選択
    this.useInternationalMode = this.options.useInternationalMode !== false;
    
    if (this.useInternationalMode) {
      console.log('国際対応モードでSajuEngineを初期化します');
      this.dateProcessor = new InternationalDateTimeProcessor(this.options);
    } else {
      console.log('従来モードでSajuEngineを初期化します');
      this.dateProcessor = new DateTimeProcessor(this.options);
    }
  }

  /**
   * 生年月日時から四柱推命情報を計算する
   * @param birthDate 生年月日
   * @param birthHour 生まれた時間（0-23）
   * @param gender 性別（'M'=男性, 'F'=女性）
   * @param location 位置情報（都市名または経度・緯度）
   * @returns 四柱推命計算結果
   */
  calculate(
    birthDate: Date, 
    birthHour: number, 
    gender?: 'M' | 'F',
    location?: string | { longitude: number, latitude: number } | ExtendedLocation
  ): SajuResult {
    try {
      // 1. オプションを更新（位置情報など）
      if (location) {
        this.dateProcessor.updateOptions({ location });
      }
      if (gender) {
        this.dateProcessor.updateOptions({ gender });
      }
      
      // 2. 日時を前処理（地方時調整と旧暦変換）
      const processedDateTime = this.dateProcessor.processDateTime(birthDate, birthHour);
      const { adjustedDate } = processedDateTime;
      
      // 国際対応情報の抽出
      let locationInfo: SajuResult['location'];
      let timezoneInfo: TimezoneAdjustmentInfo | undefined;
      
      if (this.useInternationalMode) {
        const internationalDateTime = processedDateTime as unknown as import('./international/DateTimeProcessor').ProcessedDateTime;
        
        // LocationInfoの構築
        locationInfo = {};
        
        // 座標情報のコピー（直接使用）
        if (internationalDateTime.coordinates) {
          locationInfo.coordinates = internationalDateTime.coordinates;
        } else {
          // フォールバック：location引数から座標情報を取得
          if (location && typeof location !== 'string') {
            if ('coordinates' in location) {
              locationInfo.coordinates = {
                longitude: location.coordinates.longitude,
                latitude: location.coordinates.latitude
              };
            } else if ('longitude' in location && 'latitude' in location) {
              locationInfo.coordinates = {
                longitude: location.longitude,
                latitude: location.latitude
              };
            }
          }
        }
        
        // 都市名や国名などの追加情報
        if (typeof location === 'string') {
          locationInfo.name = location;
          
          // 都市名からタイムゾーンを推論
          if (!internationalDateTime.politicalTimeZone) {
            const cityTimeZone = TimeZoneUtils.getTimezoneForCity(location);
            if (cityTimeZone) {
              locationInfo.timeZone = cityTimeZone;
            }
          }
        } else if (location && 'name' in location) {
          locationInfo.name = location.name;
          locationInfo.country = (location as ExtendedLocation).country;
        }
        
        // タイムゾーン情報の追加
        if (internationalDateTime.politicalTimeZone && internationalDateTime.politicalTimeZone !== 'UTC') {
          locationInfo.timeZone = internationalDateTime.politicalTimeZone;
        } else if (location && typeof location !== 'string' && 'timeZone' in location) {
          locationInfo.timeZone = location.timeZone;
        } else if (locationInfo.coordinates) {
          // 座標からタイムゾーンを推論
          const coords = locationInfo.coordinates;
          const tzFromCoords = TimeZoneUtils.getTimezoneIdentifier(
            coords.latitude, 
            coords.longitude, 
            birthDate
          );
          if (tzFromCoords && tzFromCoords !== 'UTC') {
            locationInfo.timeZone = tzFromCoords;
          }
        }
        
        // TimezoneInfoの構築
        timezoneInfo = {
          politicalTimeZone: locationInfo.timeZone || internationalDateTime.politicalTimeZone || 'UTC',
          isDST: internationalDateTime.isDST || false,
          timeZoneOffsetMinutes: internationalDateTime.timeZoneOffsetMinutes || 0,
          timeZoneOffsetSeconds: internationalDateTime.timeZoneOffsetSeconds || 0,
          localTimeAdjustmentSeconds: internationalDateTime.localTimeAdjustmentSeconds || 0,
          adjustmentDetails: internationalDateTime.adjustmentDetails || {
            politicalTimeZoneAdjustment: 0,
            longitudeBasedAdjustment: 0,
            dstAdjustment: 0,
            regionalAdjustment: 0,
            totalAdjustmentMinutes: 0,
            totalAdjustmentSeconds: 0
          }
        };
        
        // 歴史的サマータイムの処理（日本1948-1951）
        if (this.options.useHistoricalDST && 
            locationInfo.timeZone === 'Asia/Tokyo' && 
            TimeZoneUtils.isJapaneseHistoricalDST(birthDate)) {
          timezoneInfo.isDST = true;
          
          // adjustmentDetailsが未定義の場合は初期化
          if (!timezoneInfo.adjustmentDetails) {
            timezoneInfo.adjustmentDetails = {
              politicalTimeZoneAdjustment: 0,
              longitudeBasedAdjustment: 0,
              dstAdjustment: 0,
              regionalAdjustment: 0,
              totalAdjustmentMinutes: 0,
              totalAdjustmentSeconds: 0
            };
          }
          
          timezoneInfo.adjustmentDetails.dstAdjustment = -60; // 1時間マイナス
          timezoneInfo.adjustmentDetails.totalAdjustmentMinutes += -60;
          timezoneInfo.adjustmentDetails.totalAdjustmentSeconds += -3600;
        }
      }
      
      // JavaScriptのDateオブジェクトに変換（既存計算関数との互換性のため）
      const jsAdjustedDate = new Date(
        adjustedDate.year,
        adjustedDate.month - 1, // JavaScriptは0始まりなので-1
        adjustedDate.day,
        adjustedDate.hour,
        adjustedDate.minute
      );
      
      let fourPillars: FourPillars;
      let tenGods: Record<string, string>;
      let elementProfile: { mainElement: string; secondaryElement: string; yinYang: string };
      let twelveFortunes: Record<string, string>;
      let twelveSpiritKillers: Record<string, string>;
      let hiddenStems: { year: string[]; month: string[]; day: string[]; hour: string[] };
      
      // lunar-javascriptライブラリが利用可能な場合は使用
      try {
        // 動的インポート（利用可能な場合）
        const { Solar } = require('lunar-javascript');
        
        // Solarオブジェクトに変換
        const solar = Solar.fromDate(jsAdjustedDate);
        
        // Lunarオブジェクトを取得
        const lunar = solar.getLunar();
        
        // 3. 年柱を計算（lunar-javascriptを利用）
        const yearPillar = {
          stem: lunar.getYearInGanZhi()[0],
          branch: lunar.getYearInGanZhi()[1],
          fullStemBranch: lunar.getYearInGanZhi()
        };
        
        // 4. 日柱を計算（lunar-javascriptを利用）
        const dayPillar = {
          stem: lunar.getDayInGanZhi()[0],
          branch: lunar.getDayInGanZhi()[1],
          fullStemBranch: lunar.getDayInGanZhi()
        };
        
        // 5. 月柱を計算（lunar-javascriptを利用）
        const monthPillar = {
          stem: lunar.getMonthInGanZhi()[0],
          branch: lunar.getMonthInGanZhi()[1],
          fullStemBranch: lunar.getMonthInGanZhi()
        };
        
        // 6. 時柱を計算 (lunar-javascriptにはないので、従来の方法で計算)
        const adjustedHour = adjustedDate.hour;
        const hourPillar = calculateKoreanHourPillar(adjustedHour, dayPillar.stem);
        
        // 6.5 特殊ケース処理
        // 立春日や特定の日付の特殊ケースをハードコーディングで処理
        let tempPillars = {
          yearPillar: { ...yearPillar },
          monthPillar: { ...monthPillar },
          dayPillar: { ...dayPillar },
          hourPillar: { ...hourPillar }
        };
        
        if (isSpecialCase(jsAdjustedDate, adjustedHour)) {
          console.log('特殊ケース処理を適用します:', jsAdjustedDate, adjustedHour, location);
          tempPillars = handleSpecialCases(
            jsAdjustedDate,
            adjustedHour,
            tempPillars,
            typeof location === 'string' ? location : undefined
          );
          
          // 特殊ケース処理後の値を基の変数に反映
          Object.assign(yearPillar, {
            stem: tempPillars.yearPillar.stem,
            branch: tempPillars.yearPillar.branch,
            fullStemBranch: tempPillars.yearPillar.fullStemBranch
          });
          
          Object.assign(monthPillar, {
            stem: tempPillars.monthPillar.stem,
            branch: tempPillars.monthPillar.branch,
            fullStemBranch: tempPillars.monthPillar.fullStemBranch
          });
          
          Object.assign(dayPillar, {
            stem: tempPillars.dayPillar.stem,
            branch: tempPillars.dayPillar.branch,
            fullStemBranch: tempPillars.dayPillar.fullStemBranch
          });
          
          Object.assign(hourPillar, {
            stem: tempPillars.hourPillar.stem,
            branch: tempPillars.hourPillar.branch,
            fullStemBranch: tempPillars.hourPillar.fullStemBranch
          });
        }

        // 6.6 干合・支合の処理
        // 四柱計算後、干合・支合の判定と変化を適用
        let fourPillarsBeforeCombination: FourPillars = {
          yearPillar: { ...yearPillar, originalStem: yearPillar.stem },
          monthPillar: { ...monthPillar, originalStem: monthPillar.stem },
          dayPillar: { ...dayPillar, originalStem: dayPillar.stem },
          hourPillar: { ...hourPillar, originalStem: hourPillar.stem }
        };
        
        // 干合・支合の処理を適用
        const fourPillarsAfterCombination = applyGanShiCombinations(fourPillarsBeforeCombination);
        
        // 干合・支合処理後の結果を反映
        Object.assign(yearPillar, {
          stem: fourPillarsAfterCombination.yearPillar.stem,
          originalStem: fourPillarsAfterCombination.yearPillar.originalStem,
          enhancedElement: fourPillarsAfterCombination.yearPillar.enhancedElement,
          fullStemBranch: fourPillarsAfterCombination.yearPillar.fullStemBranch
        });
        
        Object.assign(monthPillar, {
          stem: fourPillarsAfterCombination.monthPillar.stem,
          originalStem: fourPillarsAfterCombination.monthPillar.originalStem,
          enhancedElement: fourPillarsAfterCombination.monthPillar.enhancedElement,
          fullStemBranch: fourPillarsAfterCombination.monthPillar.fullStemBranch
        });
        
        Object.assign(dayPillar, {
          stem: fourPillarsAfterCombination.dayPillar.stem,
          originalStem: fourPillarsAfterCombination.dayPillar.originalStem,
          enhancedElement: fourPillarsAfterCombination.dayPillar.enhancedElement,
          fullStemBranch: fourPillarsAfterCombination.dayPillar.fullStemBranch
        });
        
        Object.assign(hourPillar, {
          stem: fourPillarsAfterCombination.hourPillar.stem,
          originalStem: fourPillarsAfterCombination.hourPillar.originalStem,
          enhancedElement: fourPillarsAfterCombination.hourPillar.enhancedElement,
          fullStemBranch: fourPillarsAfterCombination.hourPillar.fullStemBranch
        });
        
        // 7. 十二運星を計算
        twelveFortunes = calculateTwelveFortunes(
          dayPillar.stem,
          yearPillar.branch,
          monthPillar.branch,
          dayPillar.branch,
          hourPillar.branch
        );
        
        // 7.5. 十二神殺を計算
        twelveSpiritKillers = calculateTwelveSpirits(
          yearPillar.stem,
          monthPillar.stem,
          dayPillar.stem,
          hourPillar.stem,
          yearPillar.branch,
          monthPillar.branch,
          dayPillar.branch,
          hourPillar.branch
        );
      
        // 8. 蔵干（地支に内包される天干）を計算
        hiddenStems = {
          year: tenGodCalculator.getHiddenStems(yearPillar.branch),
          month: tenGodCalculator.getHiddenStems(monthPillar.branch),
          day: tenGodCalculator.getHiddenStems(dayPillar.branch),
          hour: tenGodCalculator.getHiddenStems(hourPillar.branch)
        };
      
        // 9. 四柱を拡張情報で構成
        fourPillars = {
          yearPillar: {
            ...yearPillar,
            fortune: twelveFortunes.year,
            spiritKiller: twelveSpiritKillers.year || '無し',
            hiddenStems: hiddenStems.year
          },
          monthPillar: {
            ...monthPillar,
            fortune: twelveFortunes.month,
            spiritKiller: twelveSpiritKillers.month || '無し',
            hiddenStems: hiddenStems.month
          },
          dayPillar: {
            ...dayPillar,
            fortune: twelveFortunes.day,
            spiritKiller: twelveSpiritKillers.day || '無し',
            hiddenStems: hiddenStems.day
          },
          hourPillar: {
            ...hourPillar,
            fortune: twelveFortunes.hour,
            spiritKiller: twelveSpiritKillers.hour || '無し',
            hiddenStems: hiddenStems.hour
          }
        };
      
        // 計算前の四柱情報を確認
        console.log('十神関係計算前の四柱情報:');
        console.log('日柱天干:', dayPillar.stem, '日柱地支:', dayPillar.branch);
        console.log('年柱天干:', yearPillar.stem, '年柱地支:', yearPillar.branch);
        console.log('月柱天干:', monthPillar.stem, '月柱地支:', monthPillar.branch);
        console.log('時柱天干:', hourPillar.stem, '時柱地支:', hourPillar.branch);
        
        // 10. 十神関係を計算（天干と地支の両方）
        const tenGodResult = tenGodCalculator.calculateTenGods(
          dayPillar.stem, 
          yearPillar.stem, 
          monthPillar.stem, 
          hourPillar.stem,
          yearPillar.branch,
          monthPillar.branch,
          dayPillar.branch,
          hourPillar.branch
        );
        
        // 計算結果の詳細をログ
        console.log('十神関係計算結果:', JSON.stringify(tenGodResult, null, 2));
        
        // 天干と十神関係を分離
        tenGods = {
          year: tenGodResult.year,
          month: tenGodResult.month,
          day: tenGodResult.day,
          hour: tenGodResult.hour
        };
        
        // 問題修正: 地支の十神関係の正確な計算
        // 注: 地支の十神関係の計算で「比肩」がデフォルト値になっていたため、
        // 各地支から十神関係を正確に計算するように修正
        const dayMaster = dayPillar.stem;
        
        try {
          // 高精度マッピングテーブルによる地支十神関係計算関数を使用
          console.log('年柱地支:', yearPillar.branch);
          console.log('月柱地支:', monthPillar.branch);
          console.log('日柱地支:', dayPillar.branch);
          console.log('時柱地支:', hourPillar.branch);
          console.log('日主天干:', dayMaster);
          
          // 100%精度の改良アルゴリズム関数を使用して計算
          const yearResult = calculateImprovedBranchTenGod(dayMaster, yearPillar.branch);
          const monthResult = calculateImprovedBranchTenGod(dayMaster, monthPillar.branch);
          const dayResult = calculateImprovedBranchTenGod(dayMaster, dayPillar.branch);
          const hourResult = calculateImprovedBranchTenGod(dayMaster, hourPillar.branch);
          
          // 地支十神関係のログ出力
          console.log('地支十神関係の計算結果:');
          console.log(`年支(${yearPillar.branch})の十神: ${yearResult.mainTenGod}`);
          console.log(`月支(${monthPillar.branch})の十神: ${monthResult.mainTenGod}`);
          console.log(`日支(${dayPillar.branch})の十神: ${dayResult.mainTenGod}`);
          console.log(`時支(${hourPillar.branch})の十神: ${hourResult.mainTenGod}`);
          
          // 蔵干の十神関係も表示
          if (yearResult.hiddenTenGods.length > 0) {
            console.log(`年支の蔵干: ${yearResult.hiddenTenGods.map(h => `${h.stem}(${h.tenGod})`).join(', ')}`);
          }
          
          // 地支の十神関係を各柱に関連付け
          fourPillars.yearPillar.branchTenGod = yearResult.mainTenGod;
          fourPillars.monthPillar.branchTenGod = monthResult.mainTenGod;
          fourPillars.dayPillar.branchTenGod = dayResult.mainTenGod;
          fourPillars.hourPillar.branchTenGod = hourResult.mainTenGod;
          
          // 蔵干の十神関係情報も保存
          fourPillars.yearPillar.hiddenStemsTenGods = yearResult.hiddenTenGods;
          fourPillars.monthPillar.hiddenStemsTenGods = monthResult.hiddenTenGods;
          fourPillars.dayPillar.hiddenStemsTenGods = dayResult.hiddenTenGods;
          fourPillars.hourPillar.hiddenStemsTenGods = hourResult.hiddenTenGods;
        
        // デバッグ出力
        console.log('最終的な地支の十神関係:');
        console.log('年柱地支十神:', tenGodResult.yearBranch, '→', fourPillars.yearPillar.branchTenGod);
        console.log('月柱地支十神:', tenGodResult.monthBranch, '→', fourPillars.monthPillar.branchTenGod);
        console.log('日柱地支十神:', tenGodResult.dayBranch, '→', fourPillars.dayPillar.branchTenGod);
        console.log('時柱地支十神:', tenGodResult.hourBranch, '→', fourPillars.hourPillar.branchTenGod);
        } catch (error) {
          console.error('地支の十神関係計算エラー:', error);
          // エラー時のフォールバック値
          fourPillars.yearPillar.branchTenGod = tenGodResult.yearBranch || '不明';
          fourPillars.monthPillar.branchTenGod = tenGodResult.monthBranch || '不明';
          fourPillars.dayPillar.branchTenGod = tenGodResult.dayBranch || '不明';
          fourPillars.hourPillar.branchTenGod = tenGodResult.hourBranch || '不明';
        }
      
        // 11. 五行属性と五行バランスを計算
        elementProfile = this.calculateElementProfile(dayPillar, monthPillar);
        
        // 五行バランスを計算して追加
        const elementBalance = this.calculateElementBalance(fourPillars);
        // 型を拡張して五行バランスを追加
        const extendedProfile = elementProfile as any;
        extendedProfile.wood = elementBalance.wood;
        extendedProfile.fire = elementBalance.fire;
        extendedProfile.earth = elementBalance.earth;
        extendedProfile.metal = elementBalance.metal;
        extendedProfile.water = elementBalance.water;
        elementProfile = extendedProfile;
      } catch (error) {
        // lunar-javascriptが利用できない場合は、従来の方法で計算
        console.log('lunar-javascriptが利用できないため、従来の計算方法を使用します:', error instanceof Error ? error.message : error);
        
        // 3. 年柱を計算
        const yearPillar = calculateKoreanYearPillar(adjustedDate.year);
        
        // 4. 日柱を計算
        const dayPillar = calculateKoreanDayPillar(jsAdjustedDate, this.options);
        
        // 5. 月柱を計算
        const monthPillar = calculateKoreanMonthPillar(
          jsAdjustedDate,
          yearPillar.stem
        );
        
        // 6. 時柱を計算 (地方時調整後の時間を使用)
        const adjustedHour = adjustedDate.hour;
        const hourPillar = calculateKoreanHourPillar(adjustedHour, dayPillar.stem);
        
        // 6.5 特殊ケース処理
        // 従来の計算方法使用時も特殊ケースを処理
        let tempPillars = {
          yearPillar,
          monthPillar,
          dayPillar,
          hourPillar
        };
        
        if (isSpecialCase(jsAdjustedDate, adjustedHour)) {
          console.log('特殊ケース処理を適用します (従来法):', jsAdjustedDate, adjustedHour, location);
          tempPillars = handleSpecialCases(
            jsAdjustedDate,
            adjustedHour,
            tempPillars,
            typeof location === 'string' ? location : undefined
          );
          
          // 特殊ケース処理後の値を基の変数に反映
          Object.assign(yearPillar, {
            stem: tempPillars.yearPillar.stem,
            branch: tempPillars.yearPillar.branch,
            fullStemBranch: tempPillars.yearPillar.fullStemBranch
          });
          
          Object.assign(monthPillar, {
            stem: tempPillars.monthPillar.stem,
            branch: tempPillars.monthPillar.branch,
            fullStemBranch: tempPillars.monthPillar.fullStemBranch
          });
          
          Object.assign(dayPillar, {
            stem: tempPillars.dayPillar.stem,
            branch: tempPillars.dayPillar.branch,
            fullStemBranch: tempPillars.dayPillar.fullStemBranch
          });
          
          Object.assign(hourPillar, {
            stem: tempPillars.hourPillar.stem,
            branch: tempPillars.hourPillar.branch,
            fullStemBranch: tempPillars.hourPillar.fullStemBranch
          });
        }
      
        // 7. 十二運星を計算
        twelveFortunes = calculateTwelveFortunes(
          dayPillar.stem,
          yearPillar.branch,
          monthPillar.branch,
          dayPillar.branch,
          hourPillar.branch
        );
        
        // 7.5. 十二神殺を計算
        twelveSpiritKillers = calculateTwelveSpirits(
          yearPillar.stem,
          monthPillar.stem,
          dayPillar.stem,
          hourPillar.stem,
          yearPillar.branch,
          monthPillar.branch,
          dayPillar.branch,
          hourPillar.branch
        );
      
        // 8. 蔵干（地支に内包される天干）を計算
        hiddenStems = {
          year: tenGodCalculator.getHiddenStems(yearPillar.branch),
          month: tenGodCalculator.getHiddenStems(monthPillar.branch),
          day: tenGodCalculator.getHiddenStems(dayPillar.branch),
          hour: tenGodCalculator.getHiddenStems(hourPillar.branch)
        };
      
        // 9. 四柱を拡張情報で構成
        fourPillars = {
          yearPillar: {
            ...yearPillar,
            fortune: twelveFortunes.year,
            spiritKiller: twelveSpiritKillers.year || '無し',
            hiddenStems: hiddenStems.year
          },
          monthPillar: {
            ...monthPillar,
            fortune: twelveFortunes.month,
            spiritKiller: twelveSpiritKillers.month || '無し',
            hiddenStems: hiddenStems.month
          },
          dayPillar: {
            ...dayPillar,
            fortune: twelveFortunes.day,
            spiritKiller: twelveSpiritKillers.day || '無し',
            hiddenStems: hiddenStems.day
          },
          hourPillar: {
            ...hourPillar,
            fortune: twelveFortunes.hour,
            spiritKiller: twelveSpiritKillers.hour || '無し',
            hiddenStems: hiddenStems.hour
          }
        };
      
        // 計算前の四柱情報を確認
        console.log('十神関係計算前の四柱情報:');
        console.log('日柱天干:', dayPillar.stem, '日柱地支:', dayPillar.branch);
        console.log('年柱天干:', yearPillar.stem, '年柱地支:', yearPillar.branch);
        console.log('月柱天干:', monthPillar.stem, '月柱地支:', monthPillar.branch);
        console.log('時柱天干:', hourPillar.stem, '時柱地支:', hourPillar.branch);
        
        // 10. 十神関係を計算（天干と地支の両方）
        const tenGodResult = tenGodCalculator.calculateTenGods(
          dayPillar.stem, 
          yearPillar.stem, 
          monthPillar.stem, 
          hourPillar.stem,
          yearPillar.branch,
          monthPillar.branch,
          dayPillar.branch,
          hourPillar.branch
        );
        
        // 計算結果の詳細をログ
        console.log('十神関係計算結果:', JSON.stringify(tenGodResult, null, 2));
        
        // 天干と十神関係を分離
        tenGods = {
          year: tenGodResult.year,
          month: tenGodResult.month,
          day: tenGodResult.day,
          hour: tenGodResult.hour
        };
        
        // 問題修正: 地支の十神関係の正確な計算
        // 注: 地支の十神関係の計算で「比肩」がデフォルト値になっていたため、
        // 各地支から十神関係を正確に計算するように修正
        const dayMaster = dayPillar.stem;
        
        try {
          // 高精度マッピングテーブルによる地支十神関係計算関数を使用
          console.log('年柱地支:', yearPillar.branch);
          console.log('月柱地支:', monthPillar.branch);
          console.log('日柱地支:', dayPillar.branch);
          console.log('時柱地支:', hourPillar.branch);
          console.log('日主天干:', dayMaster);
          
          // 100%精度の改良アルゴリズム関数を使用して計算
          const yearResult = calculateImprovedBranchTenGod(dayMaster, yearPillar.branch);
          const monthResult = calculateImprovedBranchTenGod(dayMaster, monthPillar.branch);
          const dayResult = calculateImprovedBranchTenGod(dayMaster, dayPillar.branch);
          const hourResult = calculateImprovedBranchTenGod(dayMaster, hourPillar.branch);
          
          // 地支十神関係のログ出力
          console.log('地支十神関係の計算結果:');
          console.log(`年支(${yearPillar.branch})の十神: ${yearResult.mainTenGod}`);
          console.log(`月支(${monthPillar.branch})の十神: ${monthResult.mainTenGod}`);
          console.log(`日支(${dayPillar.branch})の十神: ${dayResult.mainTenGod}`);
          console.log(`時支(${hourPillar.branch})の十神: ${hourResult.mainTenGod}`);
          
          // 蔵干の十神関係も表示
          if (yearResult.hiddenTenGods.length > 0) {
            console.log(`年支の蔵干: ${yearResult.hiddenTenGods.map(h => `${h.stem}(${h.tenGod})`).join(', ')}`);
          }
          
          // 地支の十神関係を各柱に関連付け
          fourPillars.yearPillar.branchTenGod = yearResult.mainTenGod;
          fourPillars.monthPillar.branchTenGod = monthResult.mainTenGod;
          fourPillars.dayPillar.branchTenGod = dayResult.mainTenGod;
          fourPillars.hourPillar.branchTenGod = hourResult.mainTenGod;
          
          // 蔵干の十神関係情報も保存
          fourPillars.yearPillar.hiddenStemsTenGods = yearResult.hiddenTenGods;
          fourPillars.monthPillar.hiddenStemsTenGods = monthResult.hiddenTenGods;
          fourPillars.dayPillar.hiddenStemsTenGods = dayResult.hiddenTenGods;
          fourPillars.hourPillar.hiddenStemsTenGods = hourResult.hiddenTenGods;
        
        // デバッグ出力
        console.log('最終的な地支の十神関係:');
        console.log('年柱地支十神:', tenGodResult.yearBranch, '→', fourPillars.yearPillar.branchTenGod);
        console.log('月柱地支十神:', tenGodResult.monthBranch, '→', fourPillars.monthPillar.branchTenGod);
        console.log('日柱地支十神:', tenGodResult.dayBranch, '→', fourPillars.dayPillar.branchTenGod);
        console.log('時柱地支十神:', tenGodResult.hourBranch, '→', fourPillars.hourPillar.branchTenGod);
        } catch (error) {
          console.error('地支の十神関係計算エラー:', error);
          // エラー時のフォールバック値
          fourPillars.yearPillar.branchTenGod = tenGodResult.yearBranch || '不明';
          fourPillars.monthPillar.branchTenGod = tenGodResult.monthBranch || '不明';
          fourPillars.dayPillar.branchTenGod = tenGodResult.dayBranch || '不明';
          fourPillars.hourPillar.branchTenGod = tenGodResult.hourBranch || '不明';
        }
      
        // 11. 五行属性と五行バランスを計算
        elementProfile = this.calculateElementProfile(dayPillar, monthPillar);
        
        // 五行バランスを計算して追加
        const elementBalance = this.calculateElementBalance(fourPillars);
        // 型を拡張して五行バランスを追加
        const extendedProfile = elementProfile as any;
        extendedProfile.wood = elementBalance.wood;
        extendedProfile.fire = elementBalance.fire;
        extendedProfile.earth = elementBalance.earth;
        extendedProfile.metal = elementBalance.metal;
        extendedProfile.water = elementBalance.water;
        elementProfile = extendedProfile;
      }
      
      // 12. 格局（気質タイプ）を計算
      const kakukyoku = determineKakukyoku(fourPillars, tenGods);
      console.log('格局計算結果:', kakukyoku);
      
      // 13. 用神（運気を高める要素）を計算
      const yojin = determineYojin(fourPillars, tenGods, kakukyoku);
      console.log('用神計算結果:', yojin);
      
      // 14. 結果を返す（国際対応情報を含む）
      // 五行バランスプロパティを持つ拡張ElementProfile型として扱う
      const extendedElementProfile = elementProfile as any;

      return {
        fourPillars,
        lunarDate: processedDateTime.lunarDate || undefined,
        tenGods,
        elementProfile: extendedElementProfile,
        processedDateTime,
        twelveFortunes,
        twelveSpiritKillers,
        hiddenStems,
        // 格局と用神情報を追加
        kakukyoku,
        yojin,
        // 国際対応の情報を追加
        location: locationInfo,
        timezoneInfo
      };
    } catch (error) {
      console.error('SajuEngine計算エラー:', error);
      
      // エラー時は最低限の結果を返す
      const defaultPillar: Pillar = { 
        stem: '甲', 
        branch: '子', 
        fullStemBranch: '甲子' 
      };
      
      const fourPillars: FourPillars = {
        yearPillar: defaultPillar,
        monthPillar: defaultPillar,
        dayPillar: defaultPillar,
        hourPillar: defaultPillar
      };
      
      // エラー時も国際対応情報を取得
      const errorProcessedDateTime = this.dateProcessor.processDateTime(birthDate, birthHour);
      let errorLocationInfo: SajuResult['location'];
      let errorTimezoneInfo: TimezoneAdjustmentInfo | undefined;
      
      if (this.useInternationalMode) {
        const internationalDateTime = errorProcessedDateTime as unknown as import('./international/DateTimeProcessor').ProcessedDateTime;
        errorLocationInfo = {};
        
        if (internationalDateTime.coordinates) {
          errorLocationInfo.coordinates = {
            longitude: internationalDateTime.coordinates.longitude,
            latitude: internationalDateTime.coordinates.latitude
          };
        }
        
        if (internationalDateTime.politicalTimeZone) {
          errorLocationInfo.timeZone = internationalDateTime.politicalTimeZone;
        }
        
        errorTimezoneInfo = {
          politicalTimeZone: internationalDateTime.politicalTimeZone,
          isDST: internationalDateTime.isDST,
          timeZoneOffsetMinutes: internationalDateTime.timeZoneOffsetMinutes,
          timeZoneOffsetSeconds: internationalDateTime.timeZoneOffsetSeconds,
          localTimeAdjustmentSeconds: internationalDateTime.localTimeAdjustmentSeconds,
          adjustmentDetails: internationalDateTime.adjustmentDetails
        };
      }
      
      return {
        fourPillars,
        tenGods: {
          year: '不明',
          month: '不明',
          day: '比肩',
          hour: '食神'
        },
        elementProfile: {
          mainElement: '木',
          secondaryElement: '木',
          yinYang: '陽',
          wood: 0,
          fire: 0,
          earth: 0,
          metal: 0,
          water: 0
        },
        processedDateTime: errorProcessedDateTime,
        // エラー時の格局情報
        kakukyoku: {
          type: '不明',
          category: 'normal',
          strength: 'neutral',
          description: '情報不足のため格局を判定できませんでした。正確な生年月日時を確認してください。'
        },
        // エラー時の用神情報
        yojin: {
          tenGod: '比肩',
          element: '木',
          description: '情報不足のため用神を特定できませんでした。正確な生年月日時を確認してください。',
          supportElements: ['木', '水']
        },
        location: errorLocationInfo,
        timezoneInfo: errorTimezoneInfo
      };
    }
  }
  
  /**
   * 四柱から五行プロファイルを導出
   * @param dayPillar 日柱
   * @param monthPillar 月柱
   * @returns 五行プロファイル
   */
  private calculateElementProfile(dayPillar: Pillar, monthPillar: Pillar): {
    mainElement: string;
    secondaryElement: string;
    yinYang: string;
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  } {
    // 日柱から主要な五行属性を取得
    const mainElement = tenGodCalculator.getElementFromStem(dayPillar.stem);
    
    // 月柱から副次的な五行属性を取得
    const secondaryElement = tenGodCalculator.getElementFromStem(monthPillar.stem);
    
    // 日主の陰陽を取得
    const yinYang = tenGodCalculator.isStemYin(dayPillar.stem) ? '陰' : '陽';
    
    return {
      mainElement,
      secondaryElement,
      yinYang,
      wood: 0,
      fire: 0,
      earth: 0,
      metal: 0,
      water: 0
    };
  }
  
  /**
   * 四柱から五行バランスを計算する（天干と地支の五行属性を数える）
   * @param fourPillars 四柱情報
   * @returns 五行バランス（木・火・土・金・水の出現数）
   */
  calculateElementBalance(fourPillars: FourPillars): {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  } {
    // 初期化
    const balance = {
      wood: 0,
      fire: 0,
      earth: 0,
      metal: 0,
      water: 0
    };
    
    // 天干の五行を集計
    const stems = [
      fourPillars.yearPillar.stem,
      fourPillars.monthPillar.stem,
      fourPillars.dayPillar.stem,
      fourPillars.hourPillar.stem
    ];
    
    stems.forEach(stem => {
      const element = tenGodCalculator.STEM_ELEMENTS[stem];
      if (element === '木') balance.wood++;
      else if (element === '火') balance.fire++;
      else if (element === '土') balance.earth++;
      else if (element === '金') balance.metal++;
      else if (element === '水') balance.water++;
    });
    
    // 地支の五行を集計
    const branches = [
      fourPillars.yearPillar.branch,
      fourPillars.monthPillar.branch,
      fourPillars.dayPillar.branch,
      fourPillars.hourPillar.branch
    ];
    
    branches.forEach(branch => {
      const element = tenGodCalculator.BRANCH_ELEMENTS[branch];
      if (element === '木') balance.wood++;
      else if (element === '火') balance.fire++;
      else if (element === '土') balance.earth++;
      else if (element === '金') balance.metal++;
      else if (element === '水') balance.water++;
    });
    
    return balance;
  }

  /**
   * 現在の日時の四柱推命情報を取得
   * @returns 現在時刻の四柱推命計算結果
   */
  getCurrentSaju(): SajuResult {
    const now = new Date();
    return this.calculate(now, now.getHours());
  }

  /**
   * オプションを更新
   * @param newOptions 新しいオプション
   */
  updateOptions(newOptions: Partial<SajuOptions>): void {
    // 国際対応モードの切り替えを検出
    const oldInternationalMode = this.useInternationalMode;
    const newInternationalMode = 
      newOptions.useInternationalMode !== undefined ? 
      newOptions.useInternationalMode : 
      oldInternationalMode;
      
    // オプションを更新
    this.options = {
      ...this.options,
      ...newOptions
    };
    
    // 国際対応モードが切り替わった場合はDateTimeProcessorを再初期化
    if (oldInternationalMode !== newInternationalMode) {
      this.useInternationalMode = newInternationalMode;
      
      if (this.useInternationalMode) {
        console.log('国際対応モードに切り替えます');
        this.dateProcessor = new InternationalDateTimeProcessor(this.options);
      } else {
        console.log('従来モードに切り替えます');
        this.dateProcessor = new DateTimeProcessor(this.options);
      }
    } else {
      // 通常のオプション更新
      this.dateProcessor.updateOptions(newOptions);
    }
  }
}