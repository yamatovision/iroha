// Type definitions for lunar-javascript
declare module 'lunar-javascript' {
    export class Solar {
        static fromDate(date: Date): Solar;
        static fromYmd(year: number, month: number, day: number): Solar;
        
        getLunar(): Lunar;
        getYear(): number;
        getMonth(): number;
        getDay(): number;
        getHour(): number;
        getMinute(): number;
        getSecond(): number;
        
        toFullString(): string;
    }

    export class Lunar {
        getYear(): number;
        getMonth(): number;
        getDay(): number;
        getHour(): number;
        getMinute(): number;
        getSecond(): number;
        
        isLeap(): boolean;
        getYearInGanZhi(): string;
        getMonthInGanZhi(): string;
        getDayInGanZhi(): string;
        getTimeInGanZhi(hour: number): string;
        
        toFullString(): string;
    }
    
    export const LunarUtil: {
        [key: string]: any;
    };
    
    export const SolarUtil: {
        [key: string]: any;
    };
    
    export const HolidayUtil: {
        [key: string]: any;
    };
}