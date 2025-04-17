import axios from 'axios';
import { DAY_PILLAR, ExtendedLocation, TimezoneAdjustmentInfo } from '@shared/index';

export interface DayPillar {
  date: string;
  heavenlyStem: string;
  earthlyBranch: string;
  element: string;
  animalSign: string;
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
   * 利用可能な都市リストを取得する
   */
  async getAvailableCities(): Promise<string[]> {
    try {
      const response = await axios.get(DAY_PILLAR.GET_AVAILABLE_CITIES);
      return response.data.cities || [];
    } catch (error) {
      console.error('都市リスト取得エラー:', error);
      return [];
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