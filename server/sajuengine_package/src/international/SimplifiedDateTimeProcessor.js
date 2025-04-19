"use strict";
/**
 * SimplifiedDateTimeProcessor.ts
 * 簡略化された日時処理クラス
 * 都道府県（または「海外」）を選択するだけで時差調整値を適用
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimplifiedDateTimeProcessor = void 0;
const SimplifiedTimeZoneManager_1 = require("./SimplifiedTimeZoneManager");
/**
 * 簡略化された日時処理クラス
 */
class SimplifiedDateTimeProcessor {
    /**
     * コンストラクタ
     * @param timeZoneManager 時差管理クラス
     */
    constructor(timeZoneManager) {
        this.timeZoneManager = timeZoneManager || SimplifiedTimeZoneManager_1.SimplifiedTimeZoneManager.getInstance();
    }
    /**
     * シングルトンインスタンス取得
     * @returns SimplifiedDateTimeProcessorのインスタンス
     */
    static getInstance() {
        if (!SimplifiedDateTimeProcessor.instance) {
            SimplifiedDateTimeProcessor.instance = new SimplifiedDateTimeProcessor();
        }
        return SimplifiedDateTimeProcessor.instance;
    }
    /**
     * 日時を処理して四柱推命計算用の情報を取得（簡略化版）
     * @param date 日付オブジェクト
     * @param hourWithMinutes 時間（分を含む小数表現も可）
     * @param locationName 場所名（都道府県名または「海外」）
     * @returns 処理済み日時情報
     */
    processDateTime(date, hourWithMinutes, locationName) {
        // 基本的な日時情報を取得
        const simpleDate = this.createSimpleDateTime(date, hourWithMinutes);
        // 時差調整値を取得
        const adjustment = this.timeZoneManager.getAdjustmentMinutes(locationName);
        // 日時調整
        const adjustedDate = this.adjustDateTime(simpleDate, adjustment);
        // 結果の返却
        return {
            originalDate: date,
            simpleDate,
            adjustedDate,
            locationName,
            adjustment
        };
    }
    /**
     * Date型とhourWithMinutesからSimpleDateTimeを作成
     */
    createSimpleDateTime(date, hourWithMinutes) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        // 時間と分に変換
        const hour = Math.floor(hourWithMinutes);
        const minute = Math.round((hourWithMinutes - hour) * 60);
        const second = date.getSeconds(); // 元の日付から秒を取得
        return { year, month, day, hour, minute, second };
    }
    /**
     * 日時を調整（地方時調整）
     * @param dateTime シンプル日時
     * @param adjustmentMinutes 地方時調整（分単位）
     * @returns 調整済み日時
     */
    adjustDateTime(dateTime, adjustmentMinutes) {
        if (adjustmentMinutes === 0) {
            return { ...dateTime };
        }
        // 調整前の時間と分
        let { year, month, day, hour, minute, second } = dateTime;
        // 分の調整
        minute += adjustmentMinutes;
        // 時間のオーバーフロー処理
        while (minute >= 60) {
            minute -= 60;
            hour += 1;
        }
        while (minute < 0) {
            minute += 60;
            hour -= 1;
        }
        // 日付のオーバーフロー処理
        while (hour >= 24) {
            hour -= 24;
            day += 1;
        }
        while (hour < 0) {
            hour += 24;
            day -= 1;
        }
        // 月末日の調整（簡易版）
        const daysInMonth = new Date(year, month, 0).getDate();
        while (day > daysInMonth) {
            day -= daysInMonth;
            month += 1;
            if (month > 12) {
                month = 1;
                year += 1;
            }
        }
        while (day < 1) {
            month -= 1;
            if (month < 1) {
                month = 12;
                year -= 1;
            }
            const prevMonthDays = new Date(year, month, 0).getDate();
            day += prevMonthDays;
        }
        return { year, month, day, hour, minute, second };
    }
    /**
     * 全ての場所（都道府県と海外）の一覧を取得
     */
    getAllLocations() {
        return this.timeZoneManager.getAllLocations();
    }
    /**
     * 日本の都道府県のみの一覧を取得
     */
    getJapanesePrefectures() {
        return this.timeZoneManager.getLocationsByRegion('日本');
    }
    /**
     * 場所の説明文を取得（例: "東京都: +19分"）
     */
    getLocationDescription(locationName) {
        return this.timeZoneManager.getLocationDescription(locationName);
    }
}
exports.SimplifiedDateTimeProcessor = SimplifiedDateTimeProcessor;
//# sourceMappingURL=SimplifiedDateTimeProcessor.js.map