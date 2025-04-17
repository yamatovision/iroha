/**
 * SecondAdjuster テスト
 */
import { SecondAdjuster } from '../SecondAdjuster';

describe('SecondAdjuster', () => {
  // 秒単位での調整
  test('秒単位での調整', () => {
    const date = new Date(2000, 0, 1, 12, 30, 0);
    
    // 90秒追加（1分30秒）
    const added = SecondAdjuster.adjustBySeconds(date, 90);
    expect(added.getMinutes()).toBe(31);
    expect(added.getSeconds()).toBe(30);
    
    // 90秒減算
    const subtracted = SecondAdjuster.adjustBySeconds(date, -90);
    expect(subtracted.getMinutes()).toBe(28);
    expect(subtracted.getSeconds()).toBe(30);
    
    // 0秒の調整は変化なし
    const unchanged = SecondAdjuster.adjustBySeconds(date, 0);
    expect(unchanged.getTime()).toBe(date.getTime());
    
    // 大きな値での調整（1時間 = 3600秒）
    const largeAdjustment = SecondAdjuster.adjustBySeconds(date, 3600);
    expect(largeAdjustment.getHours()).toBe(13);
    expect(largeAdjustment.getMinutes()).toBe(30);
    
    // 日付を跨ぐ調整
    const crossDay = SecondAdjuster.adjustBySeconds(new Date(2000, 0, 1, 23, 59, 0), 120);
    expect(crossDay.getDate()).toBe(2);
    expect(crossDay.getHours()).toBe(0);
    expect(crossDay.getMinutes()).toBe(1);
  });
  
  // 秒の四捨五入
  test('秒の四捨五入', () => {
    // 30秒未満は切り捨て
    const date1 = new Date(2000, 0, 1, 12, 30, 29);
    const rounded1 = SecondAdjuster.roundSeconds(date1);
    expect(rounded1.getSeconds()).toBe(0);
    expect(rounded1.getMinutes()).toBe(30);
    
    // 30秒以上は切り上げ
    const date2 = new Date(2000, 0, 1, 12, 30, 30);
    const rounded2 = SecondAdjuster.roundSeconds(date2);
    expect(rounded2.getSeconds()).toBe(0);
    expect(rounded2.getMinutes()).toBe(31);
    
    // 59秒も切り上げ
    const date3 = new Date(2000, 0, 1, 12, 30, 59);
    const rounded3 = SecondAdjuster.roundSeconds(date3);
    expect(rounded3.getSeconds()).toBe(0);
    expect(rounded3.getMinutes()).toBe(31);
    
    // 分のオーバーフロー
    const date4 = new Date(2000, 0, 1, 12, 59, 30);
    const rounded4 = SecondAdjuster.roundSeconds(date4);
    expect(rounded4.getSeconds()).toBe(0);
    expect(rounded4.getMinutes()).toBe(0);
    expect(rounded4.getHours()).toBe(13);
    
    // 時のオーバーフロー
    const date5 = new Date(2000, 0, 1, 23, 59, 30);
    const rounded5 = SecondAdjuster.roundSeconds(date5);
    expect(rounded5.getSeconds()).toBe(0);
    expect(rounded5.getMinutes()).toBe(0);
    expect(rounded5.getHours()).toBe(0);
    expect(rounded5.getDate()).toBe(2);
  });
  
  // 時間コンポーネントの調整
  test('時間コンポーネントの調整', () => {
    // 基本的な調整
    expect(SecondAdjuster.adjustTimeComponents(12, 30, 0, 90)).toEqual([12, 31, 30]);
    expect(SecondAdjuster.adjustTimeComponents(12, 30, 0, -90)).toEqual([12, 28, 30]);
    
    // 時間を跨ぐ調整
    expect(SecondAdjuster.adjustTimeComponents(12, 0, 0, -60)).toEqual([11, 59, 0]);
    expect(SecondAdjuster.adjustTimeComponents(12, 59, 0, 60)).toEqual([13, 0, 0]);
    
    // 日付を跨ぐ調整（深夜）
    expect(SecondAdjuster.adjustTimeComponents(23, 59, 0, 120)).toEqual([0, 1, 0]);
    
    // 日付を跨ぐ調整（早朝）
    expect(SecondAdjuster.adjustTimeComponents(0, 0, 30, -60)).toEqual([23, 59, 30]);
    
    // 大きな値での調整
    expect(SecondAdjuster.adjustTimeComponents(12, 0, 0, 3600)).toEqual([13, 0, 0]);
    expect(SecondAdjuster.adjustTimeComponents(12, 0, 0, -3600)).toEqual([11, 0, 0]);
    
    // 二重オーバーフロー
    expect(SecondAdjuster.adjustTimeComponents(23, 59, 30, 90)).toEqual([0, 1, 0]);
  });
  
  // 日付変更の判定
  test('日付変更の判定', () => {
    // 同日内の調整
    expect(SecondAdjuster.doesDateChange(12, 0, 0, 3600)).toBe(0); // 1時間進めても同日
    expect(SecondAdjuster.doesDateChange(0, 30, 0, -1000)).toBe(0); // 遡っても同日
    
    // 翌日への調整
    expect(SecondAdjuster.doesDateChange(23, 0, 0, 3600)).toBe(1); // 日付が変わる
    expect(SecondAdjuster.doesDateChange(23, 59, 59, 1)).toBe(1);  // 1秒で日付が変わる
    
    // 前日への調整
    expect(SecondAdjuster.doesDateChange(0, 0, 0, -1)).toBe(-1);  // 1秒戻すと前日
    expect(SecondAdjuster.doesDateChange(0, 10, 0, -1000)).toBe(-1); // 前日に戻る
  });
  
  // 秒のフォーマット
  test('秒のフォーマット', () => {
    // 基本的なフォーマット
    expect(SecondAdjuster.formatSecondsToTime(3661)).toBe('01:01:01'); // 1時間1分1秒
    expect(SecondAdjuster.formatSecondsToTime(43200)).toBe('12:00:00'); // 12時間
    
    // 0と負の値
    expect(SecondAdjuster.formatSecondsToTime(0)).toBe('00:00:00');
    expect(SecondAdjuster.formatSecondsToTime(-3600)).toBe('23:00:00'); // -1時間 → 前日の23時
    
    // 1日を超える値（24時間 = 86400秒）
    expect(SecondAdjuster.formatSecondsToTime(90000)).toBe('01:00:00'); // 25時間 → 翌日の1時
    
    // 24時間ちょうど（00:00:00として表示）
    expect(SecondAdjuster.formatSecondsToTime(86400)).toBe('00:00:00');
  });
});