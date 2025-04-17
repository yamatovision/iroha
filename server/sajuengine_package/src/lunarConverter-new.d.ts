// Type definitions for lunar-javascript
declare module 'lunar-javascript' {
    export class Solar {
        static fromDate(date: Date): Solar;
        static fromYmd(year: number, month: number, day: number): Solar;
        getLunar(): Lunar;
        getYear(): number;
        getMonth(): number;
        getDay(): number;
    }

    export class Lunar {
        getYear(): number;
        getMonth(): number;
        getDay(): number;
        isLeap(): boolean;
        getYearInGanZhi(): string;
        getMonthInGanZhi(): string;
        getDayInGanZhi(): string;
        getTimeInGanZhi(hour: number): string;
    }
}