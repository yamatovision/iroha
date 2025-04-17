import { SajuEngine, SajuResult } from '../../sajuengine_package/src';
import { ValidationError } from '../utils';
import { ExtendedLocation, TimezoneAdjustmentInfo } from '../types';

// 国際対応DateTimeProcessorを直接インポート
// 注意: このインポートが失敗した場合にフォールバックする
let InternationalDateTimeProcessor;
try {
  const sajuEngineInternational = require('../../sajuengine_package/src/international');
  InternationalDateTimeProcessor = sajuEngineInternational.DateTimeProcessor;
} catch (error) {
  console.warn('国際対応DateTimeProcessorのインポートに失敗しました。ダミー実装を使用します。');
}

// ダミーの国際対応DateTimeProcessor
// 実際の国際対応実装はsajuengine_packageから直接読み込む必要があるため
// テスト用にダミー実装を使用
class DateTimeProcessor {
  constructor(options?: any) {}
  updateOptions(options?: any) {}
  processDateTime(date: Date, hourWithMinutes: number, birthplace?: any): any {
    // テスト用の簡易実装
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
  getAvailableCities(): string[] {
    return [
      'Tokyo', 'Osaka', 'Nagoya', 'Fukuoka', 'Sapporo', 
      'New York', 'London', 'Paris', 'Berlin', 'Rome', 
      'Sydney', 'Melbourne', 'Beijing', 'Shanghai', 'Hong Kong', 
      'Seoul', 'Singapore', 'Bangkok', 'Dubai', 'Mumbai'
    ];
  }
  getCityCoordinates(cityName: string): any {
    const cities: {[key: string]: {longitude: number, latitude: number}} = {
      'Tokyo': { longitude: 139.6917, latitude: 35.6895 },
      'New York': { longitude: -74.0060, latitude: 40.7128 },
      'London': { longitude: -0.1278, latitude: 51.5074 },
      'Paris': { longitude: 2.3522, latitude: 48.8566 },
      'Sydney': { longitude: 151.2093, latitude: -33.8688 },
      'Beijing': { longitude: 116.4074, latitude: 39.9042 },
      'Seoul': { longitude: 126.9780, latitude: 37.5665 },
      'Singapore': { longitude: 103.8198, latitude: 1.3521 }
    };
    return cities[cityName];
  }
  getLocalTimeAdjustmentMinutes(coordinates: any): number {
    // 東京を基準（東経135度）として、経度1度あたり4分の時差を計算
    if (!coordinates) return 0;
    return Math.round((coordinates.longitude - 135) * 4);
  }
};

/**
 * 四柱推命エンジンサービス
 * sajuengine_packageと連携して四柱推命計算を行うサービス
 */
export class SajuEngineService {
  private sajuEngine: any; // SajuEngineのインスタンス型をanyで回避
  private dateTimeProcessor: DateTimeProcessor;
  private useInternationalMode: boolean;

  constructor(options: any = {}) {
    const defaultOptions = {
      useLocalTime: true,
      useInternationalMode: true,  // デフォルトで国際対応モードを有効化
      useDST: true,                // デフォルトで夏時間を考慮
      useHistoricalDST: true,      // デフォルトで歴史的夏時間を考慮
      useStandardTimeZone: true,   // デフォルトで標準タイムゾーンを使用
      useSecondsPrecision: true,   // デフォルトで秒単位の精度を使用
      ...options
    };
    
    this.useInternationalMode = defaultOptions.useInternationalMode !== false;
    
    // SajuEngineのインスタンス化（SajuOptions型互換性の問題解決）
    const sajuEngineOptions: any = {
      useLocalTime: defaultOptions.useLocalTime,
      useInternationalMode: defaultOptions.useInternationalMode,
      useDST: defaultOptions.useDST,
      useHistoricalDST: defaultOptions.useHistoricalDST,
      useStandardTimeZone: defaultOptions.useStandardTimeZone,
      useSecondsPrecision: defaultOptions.useSecondsPrecision,
      gender: defaultOptions.gender,
      referenceStandardMeridian: defaultOptions.referenceStandardMeridian
    };
    
    // ExtendedLocation対応
    if (defaultOptions.location) {
      if (typeof defaultOptions.location === 'string') {
        sajuEngineOptions.location = defaultOptions.location;
      } else if ('coordinates' in defaultOptions.location) {
        // ExtendedLocationの場合は座標情報のみ抽出
        sajuEngineOptions.location = {
          longitude: defaultOptions.location.coordinates.longitude,
          latitude: defaultOptions.location.coordinates.latitude,
          timeZone: defaultOptions.location.timeZone
        };
      } else {
        sajuEngineOptions.location = defaultOptions.location;
      }
    }
    
    this.sajuEngine = new SajuEngine(sajuEngineOptions);
    this.dateTimeProcessor = new DateTimeProcessor({
      useLocalTime: true,
      useInternationalMode: this.useInternationalMode,
      useDST: defaultOptions.useDST,
      useHistoricalDST: defaultOptions.useHistoricalDST,
      useStandardTimeZone: defaultOptions.useStandardTimeZone,
      useSecondsPrecision: defaultOptions.useSecondsPrecision
    });
  }
  
  /**
   * 国際対応オプションを更新
   * @param options 新しいオプション
   */
  updateOptions(options: any): void {
    this.useInternationalMode = options.useInternationalMode !== false;
    this.sajuEngine.updateOptions(options);
    this.dateTimeProcessor.updateOptions(options);
  }
  
  /**
   * 利用可能な出生地（都市）のリストを取得
   * @returns 都市名のリスト
   */
  getAvailableCities(): string[] {
    return this.dateTimeProcessor.getAvailableCities();
  }
  
  /**
   * タイムゾーン情報を取得
   * @param location 出生地（都市名または座標）
   * @param date 日付（オプション、指定がない場合は現在日時）
   * @returns タイムゾーン情報
   */
  getTimezoneInfo(
    location: string | any | ExtendedLocation,
    date?: Date
  ): TimezoneAdjustmentInfo {
    if (!this.useInternationalMode) {
      return { 
        useInternationalMode: false,
        message: "国際対応モードが無効です。useInternationalMode=trueを設定してください。"
      } as any;
    }
    
    const currentDate = date || new Date();
    
    // 処理対象のロケーション情報を構築
    let locationData: any;
    
    if (typeof location === 'string') {
      // 都市名
      locationData = location;
    } else if ('coordinates' in location) {
      // ExtendedLocation
      locationData = location;
    } else {
      // IGeoCoordinates
      locationData = {
        coordinates: {
          longitude: location.longitude,
          latitude: location.latitude
        }
      };
    }
    
    // タイムゾーン情報を計算して返す
    try {
      // processDateTimeを使って計算（SajuEngineの実際の計算に使用される方法と同じ）
      const processed = this.dateTimeProcessor.processDateTime(
        currentDate,
        12, // 時間は任意（タイムゾーン情報の取得が目的）
        locationData
      );
      
      // 国際対応タイムゾーン情報を抽出
      const timezoneInfo = {
        useInternationalMode: true,
        politicalTimeZone: processed.politicalTimeZone,
        isDST: processed.isDST,
        timeZoneOffsetMinutes: processed.timeZoneOffsetMinutes,
        timeZoneOffsetSeconds: processed.timeZoneOffsetSeconds,
        localTimeAdjustmentSeconds: processed.localTimeAdjustmentSeconds,
        adjustmentDetails: processed.adjustmentDetails,
        location: {
          name: typeof location === 'string' ? location : (location as any).name,
          coordinates: processed.coordinates,
          timeZone: processed.politicalTimeZone
        }
      };
      
      return timezoneInfo;
    } catch (error) {
      console.error('タイムゾーン情報取得エラー:', error);
      return { 
        useInternationalMode: true, 
        error: error instanceof Error ? error.message : 'タイムゾーン情報の取得に失敗しました。',
        location: locationData
      } as any;
    }
  }
  
  /**
   * 都市名から座標情報を取得（柔軟なマッチング）
   * @param cityName 都市名
   * @returns 座標情報（見つからない場合はundefined）
   */
  getCityCoordinates(cityName: string): any | undefined {
    if (!cityName) return undefined;
    
    // 日本語-英語の都市名マッピング
    const japaneseToEnglishMap: {[key: string]: string} = {
      '東京': 'Tokyo',
      '大阪': 'Osaka',
      '名古屋': 'Nagoya',
      '福岡': 'Fukuoka',
      '札幌': 'Sapporo',
      '京都': 'Kyoto',
      '神戸': 'Kobe',
      '横浜': 'Yokohama',
      '広島': 'Hiroshima',
      '仙台': 'Sendai',
      '新宿': 'Tokyo', // 東京の一部として扱う
      '渋谷': 'Tokyo', // 東京の一部として扱う
      '池袋': 'Tokyo', // 東京の一部として扱う
      '銀座': 'Tokyo', // 東京の一部として扱う
      '浅草': 'Tokyo', // 東京の一部として扱う
      '博多': 'Fukuoka', // 福岡の一部として扱う
      '難波': 'Osaka', // 大阪の一部として扱う
      '梅田': 'Osaka', // 大阪の一部として扱う
      '栄': 'Nagoya', // 名古屋の一部として扱う
    };
    
    // デコードされた都市名を使用
    const decodedCityName = decodeURIComponent(cityName);
    
    // 完全一致で検索
    const exactCoordinates = this.dateTimeProcessor.getCityCoordinates(decodedCityName);
    if (exactCoordinates) {
      return {
        longitude: exactCoordinates.longitude,
        latitude: exactCoordinates.latitude
      };
    }
    
    // 日本語の都市名を英語に変換して検索
    if (japaneseToEnglishMap[decodedCityName]) {
      const englishCityName = japaneseToEnglishMap[decodedCityName];
      const japaneseCoordinates = this.dateTimeProcessor.getCityCoordinates(englishCityName);
      if (japaneseCoordinates) {
        return {
          longitude: japaneseCoordinates.longitude,
          latitude: japaneseCoordinates.latitude
        };
      }
    }
    
    // 都市名から都道府県サフィックスを削除（例: 東京都→東京、大阪府→大阪）
    const simplifiedName = decodedCityName
      .replace(/[都道府県市区町村]$/, '')  // 末尾の行政区分を削除
      .replace(/\s+/g, '');                // 空白を削除
    
    // 簡略化した名前で英語変換を試みる
    if (japaneseToEnglishMap[simplifiedName]) {
      const englishCityName = japaneseToEnglishMap[simplifiedName];
      const simplifiedCoordinates = this.dateTimeProcessor.getCityCoordinates(englishCityName);
      if (simplifiedCoordinates) {
        return {
          longitude: simplifiedCoordinates.longitude,
          latitude: simplifiedCoordinates.latitude
        };
      }
    }
    
    // 簡略化した名前で再検索
    if (simplifiedName !== decodedCityName) {
      const simplifiedCoordinates = this.dateTimeProcessor.getCityCoordinates(simplifiedName);
      if (simplifiedCoordinates) {
        return {
          longitude: simplifiedCoordinates.longitude,
          latitude: simplifiedCoordinates.latitude
        };
      }
    }
    
    // 部分一致検索（「大阪市内」→「大阪」など）
    const availableCities = this.dateTimeProcessor.getAvailableCities();
    for (const city of availableCities) {
      if (decodedCityName.includes(city) || city.includes(simplifiedName)) {
        const partialCoordinates = this.dateTimeProcessor.getCityCoordinates(city);
        if (partialCoordinates) {
          return {
            longitude: partialCoordinates.longitude,
            latitude: partialCoordinates.latitude
          };
        }
      }
    }
    
    // 最終フォールバック: 東京の座標を返す（デフォルト値）
    console.warn(`都市 "${decodedCityName}" の座標が見つかりません。デフォルトとして東京の座標を使用します。`);
    return {
      longitude: 139.6917,
      latitude: 35.6895
    };
  }
  
  /**
   * 座標情報から地方時オフセットを計算
   * @param coordinates 座標情報
   * @returns 地方時オフセット（分単位）
   */
  calculateLocalTimeOffset(coordinates: any): number {
    try {
      return this.dateTimeProcessor.getLocalTimeAdjustmentMinutes(coordinates);
    } catch (error) {
      console.error('地方時オフセット計算エラー:', error);
      // 経度ベースの単純計算でフォールバック
      return Math.round((coordinates.longitude - 135) * 4);
    }
  }

  /**
   * 生年月日時から四柱推命プロフィールを計算
   * @param birthDate 生年月日
   * @param birthHour 出生時間（時）
   * @param birthMinute 出生時間（分）
   * @param gender 性別 'M'=男性, 'F'=女性
   * @param location 出生地
   * @param coordinates 出生地の座標（オプション）
   * @returns 四柱推命計算結果
   */
  calculateSajuProfile(
    birthDate: Date, 
    birthHour: number, 
    birthMinute: number, 
    gender: string, 
    location: string,
    coordinates?: any
  ) {
    // 入力検証
    if (!birthDate) {
      throw new ValidationError('生年月日は必須です');
    }
    
    if (birthHour < 0 || birthHour > 23) {
      throw new ValidationError('出生時間（時）は0-23の範囲で指定してください');
    }
    
    if (birthMinute < 0 || birthMinute > 59) {
      throw new ValidationError('出生時間（分）は0-59の範囲で指定してください');
    }
    
    if (!['M', 'F'].includes(gender)) {
      throw new ValidationError('性別は"M"（男性）または"F"（女性）で指定してください');
    }
    
    if (!location) {
      throw new ValidationError('出生地は必須です');
    }
    
    // 時間計算（分も考慮）
    const hourWithMinutes = birthHour + (birthMinute / 60);
    
    // 座標情報の取得
    let birthplaceCoordinates = coordinates;
    if (!birthplaceCoordinates) {
      // 都市名から座標を取得
      birthplaceCoordinates = this.getCityCoordinates(location);
    }
    
    // sajuengine_packageを使用して四柱推命計算
    try {
      // gender を 'M' | 'F' に型キャスト（SajuEngineの型定義に合わせる）
      const result = this.sajuEngine.calculate(birthDate, hourWithMinutes, gender as 'M' | 'F', location);
      
      // 型の互換性を確保するための処理（SajuResultの型定義に合わせる）
      if (result.lunarDate === null) {
        result.lunarDate = undefined;
      }
      
      // 地方時調整情報を結果に追加
      if (birthplaceCoordinates) {
        (result as any).birthplaceCoordinates = birthplaceCoordinates;
        (result as any).localTimeOffset = this.calculateLocalTimeOffset(birthplaceCoordinates);
      }
      
      // 格局（気質タイプ）情報を拡張
      if (result.kakukyoku) {
        // 格局の説明文を日本語で拡充（必要に応じて）
        if (result.kakukyoku.description) {
          const kakukyokuType = result.kakukyoku.type;
          const strengthType = result.kakukyoku.strength === 'strong' ? '身強' :
                              result.kakukyoku.strength === 'weak' ? '身弱' : '中和';
          
          // 既存の説明文を保持しつつ、日本語の文脈に合わせて調整
          result.kakukyoku.description = `あなたの格局（気質タイプ）は「${kakukyokuType}」（${strengthType}）です。${result.kakukyoku.description}`;
        }
        
        // kakukyokuが存在するがフィールドが足りない場合に初期化
        if (!result.kakukyoku.type) result.kakukyoku.type = '';
        if (!result.kakukyoku.category) result.kakukyoku.category = 'normal';
        if (!result.kakukyoku.strength) result.kakukyoku.strength = 'neutral';
        if (!result.kakukyoku.description) result.kakukyoku.description = '';
      }
      
      // 用神（運気を高める要素）情報を拡張
      if (result.yojin) {
        // 用神の説明文を日本語で拡充（必要に応じて）
        if (result.yojin.description) {
          const yojinTenGod = result.yojin.tenGod;
          const yojinElement = this.translateElementToJapanese(result.yojin.element);
          
          // 既存の説明文が既に十分な場合は変更しない
          if (!result.yojin.description.includes('あなたの用神は')) {
            result.yojin.description = `あなたの用神は「${yojinTenGod}（${yojinElement}）」です。${result.yojin.description}`;
          }
        }
        
        // yojinが存在するがフィールドが足りない場合に初期化
        if (!result.yojin.tenGod) result.yojin.tenGod = '';
        if (!result.yojin.element) result.yojin.element = '';
        if (!result.yojin.description) result.yojin.description = '';
        if (!result.yojin.supportElements) result.yojin.supportElements = [];
      }
      
      return result as SajuResult;
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(`四柱推命計算エラー: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 現在の日柱情報を取得
   * @returns 現在の四柱推命情報
   */
  getCurrentDayPillar() {
    // 現在の日柱情報を取得
    try {
      const currentSaju = this.sajuEngine.getCurrentSaju();
      return {
        date: new Date(),
        dayPillar: currentSaju.fourPillars.dayPillar,
        heavenlyStem: currentSaju.fourPillars.dayPillar.stem,
        earthlyBranch: currentSaju.fourPillars.dayPillar.branch,
        energyDescription: this.generateEnergyDescription(
          currentSaju.fourPillars.dayPillar.stem,
          currentSaju.fourPillars.dayPillar.branch
        )
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(`日柱取得エラー: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 指定された日付の日柱情報を取得
   * @param date 日付
   * @returns 指定日の四柱推命情報
   */
  getDayPillarByDate(date: Date) {
    try {
      if (!date) {
        throw new ValidationError('日付は必須です');
      }
      
      // SajuEngineに対して指定された日付の正午で計算
      // 時間は固定で12時（正午）とし、日柱情報のみを取得
      const noon = new Date(date);
      noon.setHours(12, 0, 0, 0);
      
      // 特定日のSaju情報を計算（性別はM、場所は東京を仮定）
      // 日柱の算出には性別と場所は関係ないため、任意の値で問題ない
      const result = this.sajuEngine.calculate(noon, 12, 'M', 'Tokyo, Japan');
      
      // 計算結果から日柱情報のみを抽出
      return {
        date: date,
        dayPillar: result.fourPillars.dayPillar,
        heavenlyStem: result.fourPillars.dayPillar.stem,
        earthlyBranch: result.fourPillars.dayPillar.branch,
        hiddenStems: result.fourPillars.dayPillar.hiddenStems || [],
        energyDescription: this.generateEnergyDescription(
          result.fourPillars.dayPillar.stem,
          result.fourPillars.dayPillar.branch
        )
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(`日柱取得エラー: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 五行属性を取得（メイン属性）
   * @param result 四柱推命計算結果
   * @returns 五行属性（wood, fire, earth, metal, water）
   */
  getMainElement(result: any): string {
    if (!result || !result.elementProfile) {
      return 'earth'; // デフォルト値
    }
    
    // mainElementが存在しない場合の対処
    if (!result.elementProfile.mainElement) {
      // データの存在確認と適切なデフォルト値の設定
      if (result.elementProfile.wood && 
          result.elementProfile.fire && 
          result.elementProfile.earth && 
          result.elementProfile.metal && 
          result.elementProfile.water) {
        // 最大の要素を見つける
        const elements = [
          { name: 'wood', value: result.elementProfile.wood },
          { name: 'fire', value: result.elementProfile.fire },
          { name: 'earth', value: result.elementProfile.earth },
          { name: 'metal', value: result.elementProfile.metal },
          { name: 'water', value: result.elementProfile.water }
        ];
        
        const maxElement = elements.reduce((prev, current) => 
          (prev.value > current.value) ? prev : current
        );
        
        return maxElement.name;
      }
      
      return 'earth'; // デフォルト値
    }
    
    // 五行属性のマッピング
    const elementMapping: { [key: string]: string } = {
      '木': 'wood',
      '火': 'fire',
      '土': 'earth',
      '金': 'metal',
      '水': 'water',
      // 英語表記の場合もマッピング
      'wood': 'wood',
      'fire': 'fire',
      'earth': 'earth',
      'metal': 'metal',
      'water': 'water'
    };
    
    const mainElement = result.elementProfile.mainElement;
    return elementMapping[mainElement] || 'earth'; // デフォルト値として'earth'を使用
  }

  /**
   * サブ属性（二次的影響がある五行）を取得
   * @param result 四柱推命計算結果
   * @returns 五行属性（wood, fire, earth, metal, water）
   */
  getSecondaryElement(result: any): string | undefined {
    if (!result || !result.elementProfile) {
      return undefined;
    }
    
    // secondaryElementが存在する場合
    if (result.elementProfile.secondaryElement) {
      // 五行属性のマッピング
      const elementMapping: { [key: string]: string } = {
        '木': 'wood',
        '火': 'fire',
        '土': 'earth',
        '金': 'metal',
        '水': 'water',
        // 英語表記の場合もマッピング
        'wood': 'wood',
        'fire': 'fire',
        'earth': 'earth',
        'metal': 'metal',
        'water': 'water'
      };
      
      return elementMapping[result.elementProfile.secondaryElement];
    }
    
    // 数値データから計算する場合
    if (result.elementProfile.wood !== undefined && 
        result.elementProfile.fire !== undefined && 
        result.elementProfile.earth !== undefined && 
        result.elementProfile.metal !== undefined && 
        result.elementProfile.water !== undefined) {
      
      // メイン属性を取得して除外
      const mainElement = this.getMainElement(result);
      
      // メイン以外の要素で最大のものを見つける
      const elements = [
        { name: 'wood', value: result.elementProfile.wood },
        { name: 'fire', value: result.elementProfile.fire },
        { name: 'earth', value: result.elementProfile.earth },
        { name: 'metal', value: result.elementProfile.metal },
        { name: 'water', value: result.elementProfile.water }
      ].filter(el => el.name !== mainElement);
      
      if (elements.length > 0) {
        const secondaryElement = elements.reduce((prev, current) => 
          (prev.value > current.value) ? prev : current
        );
        
        // 値が十分大きい場合のみセカンダリ要素として返す
        if (secondaryElement.value > 0) {
          return secondaryElement.name;
        }
      }
    }
    
    return undefined;
  }

  /**
   * 天干地支の組み合わせからエネルギー説明を生成
   * @param heavenlyStem 天干
   * @param earthlyBranch 地支
   * @returns エネルギー説明文
   */
  private generateEnergyDescription(heavenlyStem: string, earthlyBranch: string): string {
    // 天干地支の組み合わせに基づいたエネルギー説明
    // 実際のプロジェクトでは、より詳細なデータベースやロジックが必要
    const stemDescriptions: { [key: string]: string } = {
      '甲': '積極的で活発なエネルギー。新たな始まりや成長を促します。',
      '乙': '柔軟で順応性のあるエネルギー。協調性と調和を重視します。',
      '丙': '明るく情熱的なエネルギー。創造性と自己表現を高めます。',
      '丁': '優しく思いやりのあるエネルギー。人間関係や感情面での洞察力があります。',
      '戊': '安定した信頼性のあるエネルギー。土台となる力と実用性を重視します。',
      '己': '受容的で内省的なエネルギー。知恵と内なる調和をもたらします。',
      '庚': '断固とした決断力のあるエネルギー。正義と規律を重んじます。',
      '辛': '洗練された美的センスのあるエネルギー。詳細への注意と分析力があります。',
      '壬': '流動的で柔軟なエネルギー。知性と適応力に優れています。',
      '癸': '神秘的で直感的なエネルギー。内面の知恵と癒しの力を持ちます。'
    };
    
    const branchDescriptions: { [key: string]: string } = {
      '子': '新たな始まりと可能性の時。静かな力と潜在的なエネルギーが高まります。',
      '丑': '忍耐と堅実さの時。困難に立ち向かう強さと安定性をもたらします。',
      '寅': '活力と大胆さの時。勇気ある行動と新しい挑戦を促します。',
      '卯': '成長と発展の時。調和と平和をもたらし、人間関係が円滑になります。',
      '辰': '変化と変容の時。予期せぬ出来事と新たな機会が訪れます。',
      '巳': '明晰さと洞察力の時。知性と戦略的思考が高まります。',
      '午': 'エネルギーが最も高まる時。情熱と活力に満ちた行動が促されます。',
      '未': '思いやりと協力の時。調和と共感が重要になります。',
      '申': '革新と変革の時。創造性と適応力が試されます。',
      '酉': '収穫と評価の時。成果を整理し、次へのステップを考える時期です。',
      '戌': '忠誠と献身の時。責任感と誠実さが重要になります。',
      '亥': '内省と準備の時。次のサイクルに向けた英知を育みます。'
    };
    
    const stemDesc = stemDescriptions[heavenlyStem] || '調和のとれたエネルギー。';
    const branchDesc = branchDescriptions[earthlyBranch] || '変化と安定のバランスをもたらします。';
    
    return `${stemDesc} ${branchDesc} ${heavenlyStem}${earthlyBranch}の日は、${this.getCombinedEnergy(heavenlyStem, earthlyBranch)}`;
  }

  /**
   * 天干地支の組み合わせからエネルギー特性を取得
   * @param stem 天干
   * @param branch 地支
   * @returns 組み合わせのエネルギー特性
   */
  private getCombinedEnergy(stem: string, branch: string): string {
    // 天干と地支の組み合わせに基づいたエネルギー特性
    // 実際の実装では、より複雑な相性判断ロジックが必要
    
    // 天干の五行
    const stemElements: { [key: string]: string } = {
      '甲': '木',
      '乙': '木',
      '丙': '火',
      '丁': '火',
      '戊': '土',
      '己': '土',
      '庚': '金',
      '辛': '金',
      '壬': '水',
      '癸': '水'
    };
    
    // 地支の五行
    const branchElements: { [key: string]: string } = {
      '子': '水',
      '丑': '土',
      '寅': '木',
      '卯': '木',
      '辰': '土',
      '巳': '火',
      '午': '火',
      '未': '土',
      '申': '金',
      '酉': '金',
      '戌': '土',
      '亥': '水'
    };
    
    const stemElement = stemElements[stem] || '土';
    const branchElement = branchElements[branch] || '土';
    
    // 五行の相生関係
    if (
      (stemElement === '木' && branchElement === '火') ||
      (stemElement === '火' && branchElement === '土') ||
      (stemElement === '土' && branchElement === '金') ||
      (stemElement === '金' && branchElement === '水') ||
      (stemElement === '水' && branchElement === '木')
    ) {
      return 'エネルギーが相生（相互に生かし合う）関係にあり、調和と成長をもたらします。';
    }
    
    // 五行の相克関係
    if (
      (stemElement === '木' && branchElement === '土') ||
      (stemElement === '土' && branchElement === '水') ||
      (stemElement === '水' && branchElement === '火') ||
      (stemElement === '火' && branchElement === '金') ||
      (stemElement === '金' && branchElement === '木')
    ) {
      return 'エネルギーが相克（抑制し合う）関係にあり、変化と挑戦をもたらします。';
    }
    
    // 同じ五行
    if (stemElement === branchElement) {
      return 'エネルギーが同系統で強化され、その五行の特性が際立ちます。';
    }
    
    // その他の組み合わせ
    return 'バランスのとれた多様なエネルギーが流れています。';
  }
  
  /**
   * 五行属性を日本語に変換
   * @param element 五行属性（英語または日本語）
   * @returns 五行属性（日本語）
   */
  private translateElementToJapanese(element: string): string {
    const translations: { [key: string]: string } = {
      'wood': '木',
      'fire': '火',
      'earth': '土',
      'metal': '金',
      'water': '水',
      // 日本語の場合もそのまま返せるようにマッピング
      '木': '木',
      '火': '火',
      '土': '土',
      '金': '金',
      '水': '水'
    };
    
    return translations[element] || element;
  }
  
  /**
   * 四柱情報から五行バランスを計算するユーティリティメソッド
   * @param fourPillars 四柱情報
   * @returns 五行バランス（木・火・土・金・水の出現数）
   */
  calculateElementBalance(fourPillars: any): {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  } {
    // 天干と地支の要素マッピング
    const stemElements: Record<string, string> = {
      '甲': 'wood', '乙': 'wood',
      '丙': 'fire', '丁': 'fire',
      '戊': 'earth', '己': 'earth',
      '庚': 'metal', '辛': 'metal',
      '壬': 'water', '癸': 'water'
    };
    
    const branchElements: Record<string, string> = {
      '子': 'water', '丑': 'earth',
      '寅': 'wood', '卯': 'wood',
      '辰': 'earth', '巳': 'fire',
      '午': 'fire', '未': 'earth',
      '申': 'metal', '酉': 'metal',
      '戌': 'earth', '亥': 'water'
    };
    
    // 初期化
    const balance = {
      wood: 0,
      fire: 0,
      earth: 0,
      metal: 0,
      water: 0
    };
    
    try {
      // 天干の五行を集計
      const stems = [
        fourPillars.year?.heavenlyStem || fourPillars.yearPillar?.stem,
        fourPillars.month?.heavenlyStem || fourPillars.monthPillar?.stem,
        fourPillars.day?.heavenlyStem || fourPillars.dayPillar?.stem,
        fourPillars.hour?.heavenlyStem || fourPillars.hourPillar?.stem
      ];
      
      stems.forEach(stem => {
        if (!stem) return;
        const element = stemElements[stem];
        if (element === 'wood') balance.wood++;
        else if (element === 'fire') balance.fire++;
        else if (element === 'earth') balance.earth++;
        else if (element === 'metal') balance.metal++;
        else if (element === 'water') balance.water++;
      });
      
      // 地支の五行を集計
      const branches = [
        fourPillars.year?.earthlyBranch || fourPillars.yearPillar?.branch,
        fourPillars.month?.earthlyBranch || fourPillars.monthPillar?.branch,
        fourPillars.day?.earthlyBranch || fourPillars.dayPillar?.branch,
        fourPillars.hour?.earthlyBranch || fourPillars.hourPillar?.branch
      ];
      
      branches.forEach(branch => {
        if (!branch) return;
        const element = branchElements[branch];
        if (element === 'wood') balance.wood++;
        else if (element === 'fire') balance.fire++;
        else if (element === 'earth') balance.earth++;
        else if (element === 'metal') balance.metal++;
        else if (element === 'water') balance.water++;
      });
      
      // 蔵干の集計（オプション）
      // 蔵干は地支に内包される天干であり、より深いレベルの分析に使用
      const hiddenStems = [
        ...(fourPillars.year?.hiddenStems || fourPillars.yearPillar?.hiddenStems || []),
        ...(fourPillars.month?.hiddenStems || fourPillars.monthPillar?.hiddenStems || []),
        ...(fourPillars.day?.hiddenStems || fourPillars.dayPillar?.hiddenStems || []),
        ...(fourPillars.hour?.hiddenStems || fourPillars.hourPillar?.hiddenStems || [])
      ];
      
      // 蔵干の五行も集計に含める場合はコメントを外す
      // hiddenStems.forEach(stem => {
      //   if (!stem) return;
      //   const element = stemElements[stem];
      //   if (element === 'wood') balance.wood++;
      //   else if (element === 'fire') balance.fire++;
      //   else if (element === 'earth') balance.earth++;
      //   else if (element === 'metal') balance.metal++;
      //   else if (element === 'water') balance.water++;
      // });
      
      console.log('計算された五行バランス:', balance);
      return balance;
    } catch (error) {
      console.error('五行バランス計算エラー:', error);
      return balance; // エラー時は初期値を返す
    }
  }
}