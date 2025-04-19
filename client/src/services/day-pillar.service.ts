import axios from 'axios';
import { DAY_PILLAR, ExtendedLocation, TimezoneAdjustmentInfo } from '@shared/index';

export interface DayPillar {
  date: string;
  heavenlyStem: string;
  earthlyBranch: string;
  element: string;
  animalSign: string;
}

// 改良された都市リスト取得レスポンス
export interface LocationInfo {
  name: string;
  adjustment: number;
  description: string;
  isOverseas: boolean;
}

export interface LocationCategories {
  prefectures: string[];
  overseas: string[];
}

export interface CitiesResponse {
  count: number;
  cities: string[];
  locations?: LocationInfo[];
  categories?: LocationCategories;
}

class DayPillarService {
  /**
   * 今日の日柱情報を取得する
   */
  async getTodayDayPillar(): Promise<DayPillar> {
    const response = await axios.get(DAY_PILLAR.GET_TODAY);
    return response.data;
  }

  /**
   * 特定日付の日柱情報を取得する
   * @param date 日付（YYYY-MM-DD形式）
   */
  async getDayPillarByDate(date: string): Promise<DayPillar> {
    const response = await axios.get(DAY_PILLAR.GET_BY_DATE(date));
    return response.data;
  }

  /**
   * 日付範囲の日柱情報を一括取得する（管理者用）
   * @param startDate 開始日（YYYY-MM-DD形式）
   * @param endDate 終了日（YYYY-MM-DD形式）
   */
  async getDayPillarRange(startDate: string, endDate: string): Promise<DayPillar[]> {
    const response = await axios.get(
      `${DAY_PILLAR.GET_RANGE}?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data.dayPillars;
  }
  
  /**
   * 利用可能な都市リストを取得する（旧APIとの互換性あり）
   */
  async getAvailableCities(): Promise<string[]> {
    try {
      const response = await axios.get<CitiesResponse>(DAY_PILLAR.GET_AVAILABLE_CITIES);
      return response.data.cities || [];
    } catch (error) {
      console.error('都市リスト取得エラー:', error);
      return [];
    }
  }
  
  /**
   * 拡張された都市・地域情報（都道府県と海外）を取得
   * 新しいAPIレスポンス形式を活用
   */
  async getLocationsWithInfo(): Promise<CitiesResponse> {
    // フォールバックデータの準備
    const getHardcodedData = (): CitiesResponse => {
      console.warn('DayPillarService: ハードコードされたフォールバックデータを返します');
      const hardcodedPrefectures = [
        '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
      ];
      
      const adjustments: Record<string, number> = {
        '北海道': 25, '青森県': 23, '岩手県': 21, '宮城県': 20, '秋田県': 19, '山形県': 19,
        '福島県': 18, '茨城県': 19, '栃木県': 19, '群馬県': 18, '埼玉県': 19, '千葉県': 19,
        '東京都': 19, '神奈川県': 19, '新潟県': 17, '富山県': 15, '石川県': 14, '福井県': 13,
        '山梨県': 17, '長野県': 16, '岐阜県': 12, '静岡県': 15, '愛知県': 8, '三重県': 6,
        '滋賀県': 4, '京都府': 3, '大阪府': 2, '兵庫県': 1, '奈良県': 3, '和歌山県': 0,
        '鳥取県': -3, '島根県': -6, '岡山県': -4, '広島県': -8, '山口県': -12, '徳島県': -1,
        '香川県': -2, '愛媛県': -7, '高知県': -5, '福岡県': -18, '佐賀県': -20, '長崎県': -21,
        '熊本県': -19, '大分県': -16, '宮崎県': -14, '鹿児島県': -19, '沖縄県': -31, '海外': 0
      };
      
      const hardcodedLocations = [...hardcodedPrefectures, '海外'].map(locationName => {
        const adjustment = adjustments[locationName] || 0;
        const isOverseas = locationName === '海外';
        const description = isOverseas 
          ? '海外の場合は現地時間をそのまま入力してください' 
          : `${locationName}: ${adjustment >= 0 ? '+' : ''}${adjustment}分`;
        
        return {
          name: locationName,
          adjustment,
          description,
          isOverseas
        };
      });
      
      return {
        count: hardcodedLocations.length,
        cities: hardcodedLocations.map(loc => loc.name),
        locations: hardcodedLocations,
        categories: {
          prefectures: hardcodedPrefectures,
          overseas: ['海外']
        }
      };
    };
    
    // API接続の問題が解決するまでハードコードされたデータを返す
    return getHardcodedData();
    
    try {
      console.log('DayPillarService: getLocationsWithInfo() - APIリクエスト送信:', DAY_PILLAR.GET_AVAILABLE_CITIES);
      const response = await axios.get<CitiesResponse>(DAY_PILLAR.GET_AVAILABLE_CITIES);
      console.log('DayPillarService: getLocationsWithInfo() - APIレスポンス受信:', response.status);
      console.log('DayPillarService: getLocationsWithInfo() - レスポンスデータ:', response.data);
      
      // 受信データの検証
      if (!response.data) {
        console.warn('DayPillarService: データが空です');
      } else {
        console.log('DayPillarService: レスポンス内容チェック:');
        console.log('- cities配列長:', response.data.cities?.length || 0);
        console.log('- locations配列長:', response.data.locations?.length || 0);
        console.log('- prefectures配列長:', response.data.categories?.prefectures?.length || 0);
        console.log('- overseas配列長:', response.data.categories?.overseas?.length || 0);
      }
      
      return response.data;
    } catch (error) {
      console.error('DayPillarService: 拡張都市情報取得エラー:', error);
      
      // エラー詳細を出力
      if (axios.isAxiosError(error)) {
        console.error('DayPillarService: Axiosエラー詳細:');
        console.error('- ステータスコード:', error.response?.status);
        console.error('- エラーメッセージ:', error.message);
        console.error('- レスポンスデータ:', error.response?.data);
      }
      
      // エラー時の基本的なフォールバック（ハードコードされた時差データ）
      console.warn('DayPillarService: ハードコードされたフォールバックデータを返します');
      const hardcodedPrefectures = [
        '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
      ];
      
      const adjustments: Record<string, number> = {
        '北海道': 25, '青森県': 23, '岩手県': 21, '宮城県': 20, '秋田県': 19, '山形県': 19,
        '福島県': 18, '茨城県': 19, '栃木県': 19, '群馬県': 18, '埼玉県': 19, '千葉県': 19,
        '東京都': 19, '神奈川県': 19, '新潟県': 17, '富山県': 15, '石川県': 14, '福井県': 13,
        '山梨県': 17, '長野県': 16, '岐阜県': 12, '静岡県': 15, '愛知県': 8, '三重県': 6,
        '滋賀県': 4, '京都府': 3, '大阪府': 2, '兵庫県': 1, '奈良県': 3, '和歌山県': 0,
        '鳥取県': -3, '島根県': -6, '岡山県': -4, '広島県': -8, '山口県': -12, '徳島県': -1,
        '香川県': -2, '愛媛県': -7, '高知県': -5, '福岡県': -18, '佐賀県': -20, '長崎県': -21,
        '熊本県': -19, '大分県': -16, '宮崎県': -14, '鹿児島県': -19, '沖縄県': -31, '海外': 0
      };
      
      const hardcodedLocations = [...hardcodedPrefectures, '海外'].map(locationName => {
        const adjustment = adjustments[locationName] || 0;
        const isOverseas = locationName === '海外';
        const description = isOverseas 
          ? '海外の場合は現地時間をそのまま入力してください' 
          : `${locationName}: ${adjustment >= 0 ? '+' : ''}${adjustment}分`;
        
        return {
          name: locationName,
          adjustment,
          description,
          isOverseas
        };
      });
      
      return {
        count: hardcodedLocations.length,
        cities: hardcodedLocations.map(loc => loc.name),
        locations: hardcodedLocations,
        categories: {
          prefectures: hardcodedPrefectures,
          overseas: ['海外']
        }
      };
    }
  }
  
  /**
   * タイムゾーン情報を取得する
   * @param location 場所情報（都市名または拡張ロケーション情報）
   */
  async getTimezoneInfo(location: string | ExtendedLocation): Promise<TimezoneAdjustmentInfo> {
    try {
      let queryParam = '';
      
      if (typeof location === 'string') {
        queryParam = `?location=${encodeURIComponent(location)}`;
      } else {
        // オブジェクトの場合はJSONに変換して送信
        queryParam = `?location=${encodeURIComponent(JSON.stringify(location))}`;
      }
      
      const response = await axios.get(`${DAY_PILLAR.GET_TIMEZONE_INFO}${queryParam}`);
      return response.data;
    } catch (error) {
      console.error('タイムゾーン情報取得エラー:', error);
      return {};
    }
  }

  /**
   * 天干（十干）を日本語に変換する
   * @param stem 天干（ピンイン表記）
   */
  translateHeavenlyStem(stem: string): string {
    const translations: Record<string, string> = {
      jia: '甲',
      yi: '乙',
      bing: '丙',
      ding: '丁',
      wu: '戊',
      ji: '己',
      geng: '庚',
      xin: '辛',
      ren: '壬',
      gui: '癸'
    };
    return translations[stem.toLowerCase()] || stem;
  }

  /**
   * 地支（十二支）を日本語に変換する
   * @param branch 地支（ピンイン表記）
   */
  translateEarthlyBranch(branch: string): string {
    const translations: Record<string, string> = {
      zi: '子',
      chou: '丑',
      yin: '寅',
      mao: '卯',
      chen: '辰',
      si: '巳',
      wu: '午',
      wei: '未',
      shen: '申',
      you: '酉',
      xu: '戌',
      hai: '亥'
    };
    return translations[branch.toLowerCase()] || branch;
  }

  /**
   * 干支の動物を日本語に変換する
   * @param animalSign 干支の動物（英語表記）
   */
  translateAnimalSign(animalSign: string): string {
    const translations: Record<string, string> = {
      Rat: '子（ねずみ）',
      Ox: '丑（うし）',
      Tiger: '寅（とら）',
      Rabbit: '卯（うさぎ）',
      Dragon: '辰（たつ）',
      Snake: '巳（へび）',
      Horse: '午（うま）',
      Goat: '未（ひつじ）',
      Monkey: '申（さる）',
      Rooster: '酉（とり）',
      Dog: '戌（いぬ）',
      Pig: '亥（いのしし）'
    };
    return translations[animalSign] || animalSign;
  }
  
  /**
   * 五行属性を日本語に変換する
   * @param element 五行属性（英語表記）
   */
  translateElement(element: string): string {
    const translations: Record<string, string> = {
      wood: '木',
      fire: '火',
      earth: '土',
      metal: '金',
      water: '水'
    };
    return translations[element.toLowerCase()] || element;
  }

  /**
   * 五行属性に対応する色を取得する
   * @param element 五行属性
   */
  getElementColor(element: string): string {
    const elementColors = {
      wood: 'var(--wood-color, #43a047)',
      fire: 'var(--fire-color, #e53935)',
      earth: 'var(--earth-color, #ff8f00)',
      metal: 'var(--metal-color, #fdd835)',
      water: 'var(--water-color, #1e88e5)',
    };
    return elementColors[element.toLowerCase() as keyof typeof elementColors] || 'var(--primary-color)';
  }
}

export default new DayPillarService();