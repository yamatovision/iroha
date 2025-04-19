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
// lunar-javascriptライブラリの代わりにシンプルな実装を使用
// 実装不足のモジュールを仮実装
// 本来はこのファイルを実装する必要がある
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
 * 韓国式四柱推命計算用の日時処理クラス
 */
var DateTimeProcessor = /** @class */ (function () {
    /**
     * 日時処理クラスを初期化
     * @param options 計算オプション
     */
    function DateTimeProcessor(options) {
        if (options === void 0) { options = {}; }
        // 主要都市の座標データ（経度、緯度）
        this.cityCoordinates = {
            // 日本の主要都市
            "東京": { longitude: 139.6917, latitude: 35.6895 },
            "大阪": { longitude: 135.5023, latitude: 34.6937 },
            "名古屋": { longitude: 136.9066, latitude: 35.1815 },
            "札幌": { longitude: 141.3544, latitude: 43.0618 },
            "福岡": { longitude: 130.4017, latitude: 33.5902 },
            "京都": { longitude: 135.7681, latitude: 35.0116 },
            "神戸": { longitude: 135.1943, latitude: 34.6913 },
            "広島": { longitude: 132.4553, latitude: 34.3853 },
            "仙台": { longitude: 140.8694, latitude: 38.2682 },
            // 韓国の主要都市
            "ソウル": { longitude: 126.9780, latitude: 37.5665 },
            "釜山": { longitude: 129.0756, latitude: 35.1796 },
            "大邱": { longitude: 128.6014, latitude: 35.8714 },
            "仁川": { longitude: 126.7052, latitude: 37.4563 },
            // 中国の主要都市
            "北京": { longitude: 116.4074, latitude: 39.9042 },
            "上海": { longitude: 121.4737, latitude: 31.2304 },
            "広州": { longitude: 113.2644, latitude: 23.1291 },
            // 台湾の主要都市
            "台北": { longitude: 121.5654, latitude: 25.0330 },
            "高雄": { longitude: 120.3010, latitude: 22.6273 },
            // その他アジアの主要都市
            "シンガポール": { longitude: 103.8198, latitude: 1.3521 },
            "香港": { longitude: 114.1694, latitude: 22.3193 },
            "バンコク": { longitude: 100.5018, latitude: 13.7563 },
            // 欧米の主要都市
            "ニューヨーク": { longitude: -74.0060, latitude: 40.7128 },
            "ロサンゼルス": { longitude: -118.2437, latitude: 34.0522 },
            "ロンドン": { longitude: -0.1278, latitude: 51.5074 },
            "パリ": { longitude: 2.3522, latitude: 48.8566 },
            "シドニー": { longitude: 151.2093, latitude: -33.8688 }
        };
        // 地域特有の時差調整値（分単位）
        this.regionalTimeAdjustments = {
            "東京エリア": 18, // 東京・関東エリア: +18分
            "大阪エリア": 0, // 大阪・関西エリア: 0分（標準）
            "ソウルエリア": -32, // ソウルエリア: -32分
            "北京エリア": -33, // 北京エリア: -33分
        };
        this.options = __assign({ useLocalTime: true, useDST: true }, options);
    }
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
        return this.cityCoordinates[cityName];
    };
    /**
     * 都市リストを取得
     * @returns 利用可能な都市名のリスト
     */
    DateTimeProcessor.prototype.getAvailableCities = function () {
        return Object.keys(this.cityCoordinates);
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
     * 日時を処理して四柱推命計算用の情報を取得
     * @param date 日付オブジェクト
     * @param hourWithMinutes 時間（分を含む小数表現も可）
     * @param birthplace 出生地（都市名または座標）
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
        // シンプル日時オブジェクト
        var simpleDate = {
            year: year,
            month: month,
            day: day,
            hour: hour,
            minute: minute
        };
        // 座標情報の取得
        var coordinates;
        if (typeof birthplace === 'string') {
            coordinates = this.getCityCoordinates(birthplace);
        }
        else if (birthplace) {
            coordinates = birthplace;
        }
        // 地方時調整の計算
        var localTimeAdjustment = coordinates ?
            this.getLocalTimeAdjustmentMinutes(coordinates) : 0;
        // 日時調整
        var adjustedDate = this.adjustDateTime(simpleDate, localTimeAdjustment);
        // 旧暦情報と節気情報を取得
        // LunarConverterStubを使って旧暦と節気情報を取得
        var lunarDateObj = new Date(adjustedDate.year, adjustedDate.month - 1, adjustedDate.day);
        var lunarDate = LunarConverterStub.getLunarDate(lunarDateObj);
        var solarTermPeriod = LunarConverterStub.getSolarTermPeriod(lunarDateObj);
        return {
            originalDate: date,
            simpleDate: simpleDate,
            adjustedDate: adjustedDate,
            localTimeAdjustment: localTimeAdjustment,
            coordinates: coordinates,
            lunarDate: lunarDate,
            solarTermPeriod: solarTermPeriod
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
        if (!this.options.useLocalTime || localTimeAdjustmentMinutes === 0) {
            return __assign({}, dateTime);
        }
        // 調整前の時間と分
        var year = dateTime.year, month = dateTime.month, day = dateTime.day, hour = dateTime.hour, minute = dateTime.minute;
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
        return { year: year, month: month, day: day, hour: hour, minute: minute };
    };
    /**
     * 座標情報から地方時調整値（分単位）を取得
     * @param coordinates 座標情報
     * @returns 地方時調整値（分単位）
     */
    DateTimeProcessor.prototype.getLocalTimeAdjustmentMinutes = function (coordinates) {
        var longitude = coordinates.longitude;
        // 地域特有の調整
        if (longitude >= 135 && longitude < 145) {
            // 東京エリア: +18分
            return this.regionalTimeAdjustments["東京エリア"];
        }
        else if (longitude >= 125 && longitude < 135) {
            // ソウルエリア: -32分
            return this.regionalTimeAdjustments["ソウルエリア"];
        }
        else if (longitude >= 115 && longitude < 125) {
            // 北京エリア: -33分
            return this.regionalTimeAdjustments["北京エリア"];
        }
        // 標準経度（日本）からの差に基づく計算
        // 経度1度あたり4分の差
        var standardLongitude = 135; // 日本標準時の経度
        var longitudeDifference = longitude - standardLongitude;
        return Math.round(longitudeDifference * 4);
    };
    /**
     * 節気名を取得（簡易実装）
     * @param month 月
     * @returns 節気名
     */
    DateTimeProcessor.prototype.getSolarTermName = function (month) {
        var solarTerms = [
            '立春', '雨水', '啓蟄', '春分', '清明', '穀雨',
            '立夏', '小満', '芒種', '夏至', '小暑', '大暑',
            '立秋', '処暑', '白露', '秋分', '寒露', '霜降',
            '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
        ];
        // 簡易実装：月に応じた節気を返す
        return solarTerms[((month - 1) * 2 + 1) % 24];
    };
    /**
     * 節気インデックスを取得（簡易実装）
     * @param month 月
     * @returns 節気インデックス
     */
    DateTimeProcessor.prototype.getSolarTermIndex = function (month) {
        // 簡易実装：月に応じたインデックスを返す
        return ((month - 1) * 2 + 1) % 24;
    };
    return DateTimeProcessor;
}());
exports.DateTimeProcessor = DateTimeProcessor;
