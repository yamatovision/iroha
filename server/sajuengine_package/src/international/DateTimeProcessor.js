"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateTimeProcessor = void 0;
var TimeZoneUtils_1 = require("./TimeZoneUtils");
var SecondAdjuster_1 = require("./SecondAdjuster");
var TimeZoneDatabase_1 = require("./TimeZoneDatabase");
// 旧暦変換のシンプル実装（本来はlunar-javascriptライブラリを使用）
var LunarConverterStub = /** @class */ (function () {
    function LunarConverterStub() {
    }
    LunarConverterStub.getLunarDate = function (date) {
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            isLeapMonth: false
        };
    };
    LunarConverterStub.getSolarTermPeriod = function (date) {
        var month = date.getMonth() + 1;
        var solarTerms = [
            '立春', '雨水', '啓蟄', '春分', '清明', '穀雨',
            '立夏', '小満', '芒種', '夏至', '小暑', '大暑',
            '立秋', '処暑', '白露', '秋分', '寒露', '霜降',
            '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
        ];
        return {
            name: solarTerms[((month - 1) * 2 + 1) % 24],
            index: ((month - 1) * 2 + 1) % 24
        };
    };
    return LunarConverterStub;
}());
/**
 * 国際対応版日時処理クラス
 */
var DateTimeProcessor = /** @class */ (function () {
    /**
     * 日時処理クラスを初期化
     * @param options 計算オプション
     */
    function DateTimeProcessor(options) {
        if (options === void 0) { options = {}; }
        // 主要都市の座標データ（既存データベースとの互換性維持）
        this.cityCoordinates = {};
        // 地域特有の時差調整値（分単位）（既存との互換性維持）
        this.regionalTimeAdjustments = {
            "東京エリア": 18, // 東京・関東エリア: +18分
            "大阪エリア": 0, // 大阪・関西エリア: 0分（標準）
            "ソウルエリア": -32, // ソウルエリア: -32分
            "北京エリア": -33, // 北京エリア: -33分
        };
        this.options = __assign({ useLocalTime: true, useDST: true, useHistoricalDST: true, useStandardTimeZone: true, useSecondsPrecision: true, referenceStandardMeridian: 135 }, options);
        // タイムゾーンデータベースの初期化
        this.timeZoneDatabase = new TimeZoneDatabase_1.TimeZoneDatabase();
        // 都市データベースから座標データをインポート（互換性維持）
        this.importCityCoordinates();
    }
    /**
     * 都市データベースから座標データをインポート
     */
    DateTimeProcessor.prototype.importCityCoordinates = function () {
        var _this = this;
        var allCities = this.timeZoneDatabase.getAllCities();
        allCities.forEach(function (city) {
            _this.cityCoordinates[city.name] = {
                longitude: city.coordinates.longitude,
                latitude: city.coordinates.latitude
            };
            // 代替名も登録
            city.nameAlternatives.forEach(function (altName) {
                if (!_this.cityCoordinates[altName]) {
                    _this.cityCoordinates[altName] = {
                        longitude: city.coordinates.longitude,
                        latitude: city.coordinates.latitude
                    };
                }
            });
        });
    };
    /**
     * オプションを更新する
     * @param newOptions 新しいオプション
     */
    DateTimeProcessor.prototype.updateOptions = function (newOptions) {
        this.options = __assign(__assign({}, this.options), newOptions);
    };
    /**
     * 都市名から座標情報を取得
     * @param cityName 都市名
     * @returns 座標情報（見つからない場合はundefined）
     */
    DateTimeProcessor.prototype.getCityCoordinates = function (cityName) {
        // まず新しいデータベースで検索
        var cityData = this.timeZoneDatabase.findCity(cityName);
        if (cityData) {
            return {
                longitude: cityData.coordinates.longitude,
                latitude: cityData.coordinates.latitude
            };
        }
        // 後方互換性のために既存のデータも検索
        return this.cityCoordinates[cityName];
    };
    /**
     * 都市リストを取得
     * @returns 利用可能な都市名のリスト
     */
    DateTimeProcessor.prototype.getAvailableCities = function () {
        return this.timeZoneDatabase.getAllCities().map(function (city) { return city.name; });
    };
    /**
     * 都市の座標を追加または更新
     * @param cityName 都市名
     * @param coordinates 座標情報
     */
    DateTimeProcessor.prototype.addCityCoordinates = function (cityName, coordinates) {
        this.cityCoordinates[cityName] = coordinates;
    };
    /**
     * 日時を処理して四柱推命計算用の情報を取得（国際対応版）
     * @param date 日付オブジェクト
     * @param hourWithMinutes 時間（分を含む小数表現も可）
     * @param birthplace 出生地（都市名または座標またはExtendedLocation）
     * @returns 処理済み日時情報
     */
    DateTimeProcessor.prototype.processDateTime = function (date, hourWithMinutes, birthplace) {
        // 基本的な日時情報を取得
        var year = date.getFullYear();
        var month = date.getMonth() + 1; // JavaScriptのDateは0始まりの月
        var day = date.getDate();
        // 時間と分に変換
        var hour = Math.floor(hourWithMinutes);
        var minute = Math.round((hourWithMinutes - hour) * 60);
        var second = date.getSeconds(); // 元の日付から秒を取得
        // シンプル日時オブジェクト
        var simpleDate = {
            year: year,
            month: month,
            day: day,
            hour: hour,
            minute: minute,
            second: second
        };
        // === 座標情報と都市情報の取得 ===
        var coordinates;
        var cityData;
        var cityName;
        var timeZone;
        if (typeof birthplace === 'string') {
            // 文字列の場合は都市名として検索
            cityName = birthplace;
            cityData = this.timeZoneDatabase.findCity(birthplace);
            // 都市データが見つかれば座標とタイムゾーンを取得
            if (cityData) {
                coordinates = {
                    longitude: cityData.coordinates.longitude,
                    latitude: cityData.coordinates.latitude
                };
                timeZone = cityData.timezone;
            }
            else {
                // 従来の方法でフォールバック
                coordinates = this.getCityCoordinates(birthplace);
            }
        }
        else if (birthplace) {
            if ('timeZone' in birthplace) {
                // ExtendedLocationの場合
                var extendedLoc = birthplace;
                coordinates = extendedLoc.coordinates;
                timeZone = extendedLoc.timeZone;
                cityName = extendedLoc.name;
            }
            else {
                // 単純な座標の場合
                coordinates = birthplace;
            }
            // タイムゾーンが未指定で座標がある場合、最寄りの都市を検索
            if (!timeZone && coordinates) {
                cityData = this.timeZoneDatabase.findNearestCity(coordinates.longitude, coordinates.latitude);
                if (cityData) {
                    timeZone = cityData.timezone;
                    if (!cityName)
                        cityName = cityData.name;
                }
            }
        }
        // === タイムゾーン計算 ===
        var politicalTimeZone = "UTC";
        var isDST = false;
        var timeZoneOffsetMinutes = 0;
        var dstAdjustment = 0;
        var regionalAdjustment = 0;
        // 1. 政治的タイムゾーン処理（useStandardTimeZoneが有効な場合）
        if (this.options.useStandardTimeZone && coordinates) {
            // タイムゾーンが明示的に指定されているか確認
            if (timeZone) {
                politicalTimeZone = timeZone;
            }
            else {
                // 座標からタイムゾーン識別子を取得
                politicalTimeZone = TimeZoneUtils_1.TimeZoneUtils.getTimezoneIdentifier(coordinates.latitude, coordinates.longitude, date);
            }
            // 標準的なタイムゾーンオフセットを取得
            timeZoneOffsetMinutes = TimeZoneUtils_1.TimeZoneUtils.getTimezoneOffset(date, politicalTimeZone);
        }
        // 2. サマータイム（DST）処理
        if (this.options.useDST) {
            // 近代的なDST
            if (politicalTimeZone !== "UTC") {
                isDST = TimeZoneUtils_1.TimeZoneUtils.isDST(date, politicalTimeZone);
                // 特定のタイムゾーンに応じたDST調整は通常不要
                // オフセットはすでにTimeZoneOffsetに反映されている
            }
            // 日本の歴史的サマータイム (1948-1951)
            if (this.options.useHistoricalDST &&
                politicalTimeZone === 'Asia/Tokyo' &&
                TimeZoneUtils_1.TimeZoneUtils.isJapaneseHistoricalDST(date)) {
                isDST = true;
                dstAdjustment = -60; // 1時間マイナス
            }
        }
        // 3. 地域特有の調整（経度ベースの地方時調整）
        if (this.options.useLocalTime && coordinates) {
            // 都市データから取得または経度に基づく計算
            if (cityData && cityData.adjustmentMinutes !== undefined) {
                regionalAdjustment = cityData.adjustmentMinutes;
            }
            else if (cityName) {
                // 都市名での直接照合
                var regionName = cityName.includes('東京') ? "東京エリア" :
                    cityName.includes('大阪') ? "大阪エリア" :
                        cityName.includes('ソウル') ? "ソウルエリア" :
                            cityName.includes('北京') ? "北京エリア" : undefined;
                if (regionName && regionName in this.regionalTimeAdjustments) {
                    regionalAdjustment = this.regionalTimeAdjustments[regionName];
                }
                else {
                    // 経度から標準計算
                    regionalAdjustment = TimeZoneUtils_1.TimeZoneUtils.getRegionalTimeAdjustment(cityName || '', coordinates.longitude);
                }
            }
            else {
                // 経度ベースの標準計算
                regionalAdjustment = TimeZoneUtils_1.TimeZoneUtils.getLongitudeBasedTimeAdjustment(coordinates.longitude, this.options.referenceStandardMeridian || 135);
            }
        }
        // 4. 調整の合計計算
        // 地方時調整の合計を計算（標準タイムゾーンを使用しない場合、0になる）
        var standardTimeZoneAdjustment = this.options.useStandardTimeZone ? timeZoneOffsetMinutes : 0;
        // 地方時調整（合計）
        var localTimeAdjustment = this.options.useLocalTime ?
            regionalAdjustment + dstAdjustment : 0;
        // 調整詳細
        var adjustmentDetails = {
            politicalTimeZoneAdjustment: standardTimeZoneAdjustment,
            longitudeBasedAdjustment: this.options.useLocalTime ?
                TimeZoneUtils_1.TimeZoneUtils.getLongitudeBasedTimeAdjustment((coordinates === null || coordinates === void 0 ? void 0 : coordinates.longitude) || 135, this.options.referenceStandardMeridian || 135) : 0,
            dstAdjustment: dstAdjustment,
            regionalAdjustment: regionalAdjustment,
            totalAdjustmentMinutes: localTimeAdjustment,
            totalAdjustmentSeconds: localTimeAdjustment * 60
        };
        // 5. 日時調整
        // 既存の分単位調整
        var adjustedDate = this.adjustDateTime(simpleDate, localTimeAdjustment);
        // 6. 秒単位の調整（新機能）
        var adjustedDateWithSeconds = adjustedDate;
        if (this.options.useSecondsPrecision) {
            // 標準的な日時オブジェクトの生成
            var preciseDate = new Date(adjustedDate.year, adjustedDate.month - 1, adjustedDate.day, adjustedDate.hour, adjustedDate.minute, adjustedDate.second || 0);
            // 秒の四捨五入
            var roundedDate = SecondAdjuster_1.SecondAdjuster.roundSeconds(preciseDate);
            // SimpleDateTime形式に戻す
            adjustedDateWithSeconds = {
                year: roundedDate.getFullYear(),
                month: roundedDate.getMonth() + 1,
                day: roundedDate.getDate(),
                hour: roundedDate.getHours(),
                minute: roundedDate.getMinutes(),
                second: roundedDate.getSeconds()
            };
        }
        // 7. 旧暦と節気情報を取得
        var lunarDateObj = new Date(adjustedDateWithSeconds.year, adjustedDateWithSeconds.month - 1, adjustedDateWithSeconds.day, adjustedDateWithSeconds.hour, adjustedDateWithSeconds.minute, adjustedDateWithSeconds.second || 0);
        var lunarDate = LunarConverterStub.getLunarDate(lunarDateObj);
        var solarTermPeriod = LunarConverterStub.getSolarTermPeriod(lunarDateObj);
        // 8. 結果の返却
        return {
            originalDate: date,
            simpleDate: simpleDate,
            adjustedDate: adjustedDateWithSeconds,
            localTimeAdjustment: localTimeAdjustment,
            coordinates: coordinates,
            lunarDate: lunarDate,
            solarTermPeriod: solarTermPeriod,
            // 国際対応の新しいプロパティ
            politicalTimeZone: politicalTimeZone,
            isDST: isDST,
            timeZoneOffsetMinutes: timeZoneOffsetMinutes,
            timeZoneOffsetSeconds: timeZoneOffsetMinutes * 60,
            localTimeAdjustmentSeconds: localTimeAdjustment * 60,
            adjustmentDetails: adjustmentDetails
        };
    };
    /**
     * 日時を調整（地方時調整）
     * @param dateTime シンプル日時
     * @param localTimeAdjustmentMinutes 地方時調整（分単位）
     * @returns 調整済み日時
     */
    DateTimeProcessor.prototype.adjustDateTime = function (dateTime, localTimeAdjustmentMinutes) {
        if (localTimeAdjustmentMinutes === void 0) { localTimeAdjustmentMinutes = 0; }
        if (localTimeAdjustmentMinutes === 0) {
            return __assign({}, dateTime);
        }
        // 調整前の時間と分
        var year = dateTime.year, month = dateTime.month, day = dateTime.day, hour = dateTime.hour, minute = dateTime.minute, second = dateTime.second;
        // 分の調整
        minute += localTimeAdjustmentMinutes;
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
        var daysInMonth = new Date(year, month, 0).getDate();
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
            var prevMonthDays = new Date(year, month, 0).getDate();
            day += prevMonthDays;
        }
        return { year: year, month: month, day: day, hour: hour, minute: minute, second: second };
    };
    /**
     * 座標情報から地方時調整値（分単位）を取得
     * 既存メソッドの互換性を維持
     *
     * @param coordinates 座標情報
     * @returns 地方時調整値（分単位）
     */
    DateTimeProcessor.prototype.getLocalTimeAdjustmentMinutes = function (coordinates) {
        return TimeZoneUtils_1.TimeZoneUtils.getRegionalTimeAdjustment('', coordinates.longitude);
    };
    return DateTimeProcessor;
}());
exports.DateTimeProcessor = DateTimeProcessor;
