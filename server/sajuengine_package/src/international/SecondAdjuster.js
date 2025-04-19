"use strict";
/**
 * 秒単位の時間調整ユーティリティクラス
 * 国際対応リファクタリングのための実装
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecondAdjuster = void 0;
/**
 * 秒単位の時間調整ユーティリティクラス
 */
var SecondAdjuster = /** @class */ (function () {
    function SecondAdjuster() {
    }
    /**
     * 秒単位での地方時調整
     * @param dateTime 調整する日時
     * @param offsetSeconds 調整秒数（プラスまたはマイナス）
     * @returns 調整後の日付
     */
    SecondAdjuster.adjustBySeconds = function (dateTime, offsetSeconds) {
        if (offsetSeconds === 0)
            return new Date(dateTime);
        // ミリ秒単位での調整
        var adjustedTime = new Date(dateTime.getTime() + (offsetSeconds * 1000));
        return adjustedTime;
    };
    /**
     * 八季節文書の記載に基づく秒の四捨五入
     * @param date 日付
     * @returns 秒を四捨五入した日付
     */
    SecondAdjuster.roundSeconds = function (date) {
        var roundedDate = new Date(date);
        var seconds = date.getSeconds();
        // 30秒以上なら切り上げ、30秒未満なら切り捨て
        if (seconds >= 30) {
            roundedDate.setSeconds(0);
            roundedDate.setMinutes(date.getMinutes() + 1);
        }
        else {
            roundedDate.setSeconds(0);
        }
        return roundedDate;
    };
    /**
     * 時間と分を秒単位で調整
     * @param hour 時
     * @param minute 分
     * @param second 秒
     * @param offsetSeconds 調整秒数
     * @returns 調整後の[時, 分, 秒]の配列
     */
    SecondAdjuster.adjustTimeComponents = function (hour, minute, second, offsetSeconds) {
        // 秒に変換
        var totalSeconds = hour * 3600 + minute * 60 + second + offsetSeconds;
        // 負の値になった場合の処理
        while (totalSeconds < 0) {
            totalSeconds += 86400; // 1日分の秒数を加算
        }
        // 1日を超えた場合の処理
        totalSeconds = totalSeconds % 86400;
        // 時分秒に変換
        var adjustedHour = Math.floor(totalSeconds / 3600);
        var adjustedMinute = Math.floor((totalSeconds % 3600) / 60);
        var adjustedSecond = totalSeconds % 60;
        return [adjustedHour, adjustedMinute, adjustedSecond];
    };
    /**
     * 特定の時間に秒を加えた結果の日付が変わるかどうかを判定
     * @param hour 時
     * @param minute 分
     * @param second 秒
     * @param offsetSeconds 調整秒数
     * @returns 日付が変わるかどうか（true=翌日、false=当日、-1=前日）
     */
    SecondAdjuster.doesDateChange = function (hour, minute, second, offsetSeconds) {
        // 秒に変換
        var totalSeconds = hour * 3600 + minute * 60 + second + offsetSeconds;
        if (totalSeconds >= 86400) {
            return 1; // 翌日
        }
        else if (totalSeconds < 0) {
            return -1; // 前日
        }
        else {
            return 0; // 当日
        }
    };
    /**
     * 特定の秒数から時:分:秒形式の文字列を生成
     * @param totalSeconds 合計秒数
     * @returns 時:分:秒形式の文字列
     */
    SecondAdjuster.formatSecondsToTime = function (totalSeconds) {
        var normalizedSeconds = ((totalSeconds % 86400) + 86400) % 86400; // 0-86399の範囲に正規化
        var hours = Math.floor(normalizedSeconds / 3600);
        var minutes = Math.floor((normalizedSeconds % 3600) / 60);
        var seconds = normalizedSeconds % 60;
        // 2桁でゼロパディング
        var paddedHours = hours.toString().padStart(2, '0');
        var paddedMinutes = minutes.toString().padStart(2, '0');
        var paddedSeconds = seconds.toString().padStart(2, '0');
        return "".concat(paddedHours, ":").concat(paddedMinutes, ":").concat(paddedSeconds);
    };
    return SecondAdjuster;
}());
exports.SecondAdjuster = SecondAdjuster;
