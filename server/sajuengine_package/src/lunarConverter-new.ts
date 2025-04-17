/**
 * 旧暦変換モジュール
 * lunar-javascriptライブラリを使用した旧暦変換と節気計算の実装
 */
import { LunarDate, CalendarDay } from './types';
// @ts-ignore
import * as Lunar from 'lunar-javascript';

// lunar-javascriptを初期化
const { Solar, LunarUtil, SolarUtil } = Lunar;

/**
 * 旧暦日付を計算する
 * @param date 新暦日付
 * @returns 旧暦情報
 */
export function getLunarDate(date: Date): LunarDate | null {
  try {
    // JavaScriptのDateオブジェクトからlunar-javascriptのSolarオブジェクトに変換
    const solar = Solar.fromDate(date);
    
    // Solarから旧暦オブジェクトに変換
    const lunar = solar.getLunar();
    
    // 旧暦情報を構築
    return {
      year: lunar.getYear(),
      month: lunar.getMonth(),
      day: lunar.getDay(),
      isLeapMonth: lunar.isLeap()
    };
  } catch (error) {
    console.error('旧暦変換エラー:', error);
    return null;
  }
}

/**
 * 節気情報を取得
 * @param date 日付
 * @returns 節気名（該当する場合）またはnull
 */
export function getSolarTerm(date: Date): string | null {
  try {
    // JavaScriptのDateオブジェクトからlunar-javascriptのSolarオブジェクトに変換
    const solar = Solar.fromDate(date);
    
    // その日の節気を取得（anyを使用して型エラーを回避）
    const jq = (solar as any).getJieQi();
    
    // 節気が存在する場合はその名前を返す、なければnull
    return jq ? jq : null;
  } catch (error) {
    console.error('節気取得エラー:', error);
    return null;
  }
}

/**
 * 節気期間情報を取得
 * @param date 日付
 * @returns 節気期間情報
 */
export function getSolarTermPeriod(date: Date): { name: string, index: number } | null {
  try {
    // JavaScriptのDateオブジェクトからlunar-javascriptのSolarオブジェクトに変換
    const solar = Solar.fromDate(date);
    
    // 最も近い前の節気を取得
    const jieQiList = SolarUtil.getJieQiList(solar.getYear());
    
    // 日付のms値
    const dateMs = date.getTime();
    
    // 最も近い前の節気とそのインデックスを探す
    let currentJieQi = null;
    let currentIndex = -1;
    
    for (let i = 0; i < jieQiList.length; i++) {
      // 型をanyに明示的に変換して処理
      const jieQi = jieQiList[i] as any;
      const jieQiDate = new Date(jieQi.getTime());
      
      if (jieQiDate.getTime() <= dateMs) {
        currentJieQi = jieQi.getName();
        currentIndex = i;
      } else {
        break;
      }
    }
    
    // 節気情報がある場合は返す
    if (currentJieQi) {
      return {
        name: currentJieQi,
        index: currentIndex
      };
    }
    
    return null;
  } catch (error) {
    console.error('節気期間取得エラー:', error);
    
    // エラー時は簡易計算で代替
    // 24節気のリスト
    const SOLAR_TERMS = [
      '立春', '雨水', '啓蟄', '春分', '清明', '穀雨',
      '立夏', '小満', '芒種', '夏至', '小暑', '大暑',
      '立秋', '処暑', '白露', '秋分', '寒露', '霜降',
      '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
    ];
    
    // 月に基づいて簡易的に節気期間を決定
    const month = date.getMonth() + 1; // 0から始まるので+1
    const index = ((month - 1) * 2) % 24;
    
    return {
      name: SOLAR_TERMS[index],
      index: index
    };
  }
}