"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLunarDate = getLunarDate;
exports.getNextNewMoon = getNextNewMoon;
exports.getLunarMonthLength = getLunarMonthLength;
exports.generateLunarCalendar = generateLunarCalendar;
var lunarConverter_new_1 = require("./lunarConverter-new");
/**
 * 旧暦日付を計算する
 * @param date 新暦日付
 * @returns 旧暦情報
 */
function getLunarDate(date) {
    // 旧暦情報を取得
    var lunarDate = (0, lunarConverter_new_1.getLunarDate)(date);
    // nullの場合は空のオブジェクトを返す
    if (!lunarDate) {
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            isLeapMonth: false
        };
    }
    return lunarDate;
}
/**
 * 次の旧暦月の新月日を計算
 * @param date 基準日
 * @returns 次の新月の日付
 */
function getNextNewMoon(date) {
    // 仮の実装（実際には月の位相計算が必要）
    // ここでは単純に30日後を返す
    var result = new Date(date);
    result.setDate(result.getDate() + 30);
    return result;
}
/**
 * 旧暦月の長さを計算
 * @param year 旧暦年
 * @param month 旧暦月
 * @param isLeapMonth 閏月かどうか
 * @returns 月の日数（大の月=30日、小の月=29日）
 */
function getLunarMonthLength(year, month, isLeapMonth) {
    // 仮の実装（実際には天文計算による新月～新月の計算が必要）
    // ここでは単純に奇数月=30日、偶数月=29日とする
    return month % 2 === 1 ? 30 : 29;
}
/**
 * 旧暦カレンダーデータを生成
 * @param year 年
 * @param month 月
 * @returns カレンダーデータ
 */
function generateLunarCalendar(year, month) {
    // 仮の実装（実際にはより複雑な計算が必要）
    var result = [];
    // 月の日数（簡易的に決め打ち）
    var daysInMonth = new Date(year, month, 0).getDate();
    for (var day = 1; day <= daysInMonth; day++) {
        var solarDate = new Date(year, month - 1, day);
        var lunar = getLunarDate(solarDate);
        result.push({
            year: year,
            month: month,
            day: day
        });
    }
    return result;
}
