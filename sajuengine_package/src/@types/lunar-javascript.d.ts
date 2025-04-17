/**
 * lunar-javascript モジュールの型定義ファイル
 */
declare module 'lunar-javascript' {
  export type JieQi = {
    getName(): string;
    getTime(): any;
    // 他のプロパティやメソッド
  };

  export class Solar {
    static fromDate(date: any): Solar;
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
    getJieQi(): string | null;
    getJieQiTable(): Record<string, any>;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    // 他のメソッドも必要に応じて追加
  }

  export class Lunar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    isLeap(): boolean;
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getTimeInGanZhi(): string;
    // 他のメソッドも必要に応じて追加
  }
  
  export namespace LunarUtil {
    function getJie(): Record<string, string>;
    function getQi(): Record<string, string>;
    // 他の必要なユーティリティ関数
  }
  
  export namespace SolarUtil {
    function isLeapYear(year: number): boolean;
    function getJieQiList(year?: number): any[];
    // 他の必要なユーティリティ関数
  }
}