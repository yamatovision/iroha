"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLunarDate = getLunarDate;
exports.getSolarTerm = getSolarTerm;
exports.getSolarTermPeriod = getSolarTermPeriod;
// @ts-ignore
var Lunar = require("lunar-javascript");
// lunar-javascriptを初期化
var Solar = Lunar.Solar, LunarUtil = Lunar.LunarUtil, SolarUtil = Lunar.SolarUtil;
/**
 * 旧暦日付を計算する
 * @param date 新暦日付
 * @returns 旧暦情報
 */
function getLunarDate(date) {
    try {
        // JavaScriptのDateオブジェクトからlunar-javascriptのSolarオブジェクトに変換
        var solar = Solar.fromDate(date);
        // Solarから旧暦オブジェクトに変換
        var lunar = solar.getLunar();
        // 旧暦情報を構築
        return {
            year: lunar.getYear(),
            month: lunar.getMonth(),
            day: lunar.getDay(),
            isLeapMonth: lunar.isLeap()
        };
    }
    catch (error) {
        console.error('旧暦変換エラー:', error);
        return null;
    }
}
/**
 * 節気情報を取得
 * @param date 日付
 * @returns 節気名（該当する場合）またはnull
 */
function getSolarTerm(date) {
    try {
        // JavaScriptのDateオブジェクトからlunar-javascriptのSolarオブジェクトに変換
        var solar = Solar.fromDate(date);
        // その日の節気を取得（anyを使用して型エラーを回避）
        var jq = solar.getJieQi();
        // 節気が存在する場合はその名前を返す、なければnull
        return jq ? jq : null;
    }
    catch (error) {
        console.error('節気取得エラー:', error);
        return null;
    }
}
/**
 * 節気期間情報を取得
 * @param date 日付
 * @returns 節気期間情報
 */
function getSolarTermPeriod(date) {
    try {
        // JavaScriptのDateオブジェクトからlunar-javascriptのSolarオブジェクトに変換
        var solar = Solar.fromDate(date);
        // 最も近い前の節気を取得
        var jieQiList = SolarUtil.getJieQiList(solar.getYear());
        // 日付のms値
        var dateMs = date.getTime();
        // 最も近い前の節気とそのインデックスを探す
        var currentJieQi = null;
        var currentIndex = -1;
        for (var i = 0; i < jieQiList.length; i++) {
            // 型をanyに明示的に変換して処理
            var jieQi = jieQiList[i];
            var jieQiDate = new Date(jieQi.getTime());
            if (jieQiDate.getTime() <= dateMs) {
                currentJieQi = jieQi.getName();
                currentIndex = i;
            }
            else {
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
    }
    catch (error) {
        console.error('節気期間取得エラー:', error);
        // エラー時は簡易計算で代替
        // 24節気のリスト
        var SOLAR_TERMS = [
            '立春', '雨水', '啓蟄', '春分', '清明', '穀雨',
            '立夏', '小満', '芒種', '夏至', '小暑', '大暑',
            '立秋', '処暑', '白露', '秋分', '寒露', '霜降',
            '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
        ];
        // 月に基づいて簡易的に節気期間を決定
        var month = date.getMonth() + 1; // 0から始まるので+1
        var index = ((month - 1) * 2) % 24;
        return {
            name: SOLAR_TERMS[index],
            index: index
        };
    }
}
