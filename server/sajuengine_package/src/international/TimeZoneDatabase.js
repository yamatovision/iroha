"use strict";
/**
 * タイムゾーンデータベース
 * 国際対応リファクタリングのための実装
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeZoneDatabase = void 0;
/**
 * タイムゾーンデータベースクラス
 */
var TimeZoneDatabase = /** @class */ (function () {
    /**
     * コンストラクタ
     */
    function TimeZoneDatabase() {
        this.cities = [];
        this.initializeDatabase();
    }
    /**
     * データベースの初期化
     */
    TimeZoneDatabase.prototype.initializeDatabase = function () {
        // 主要都市のデータベースを構築
        this.cities = [
            // 日本の都市
            {
                name: "東京",
                nameAlternatives: ["Tokyo", "とうきょう", "東京都"],
                country: "日本",
                timezone: "Asia/Tokyo",
                coordinates: { longitude: 139.6917, latitude: 35.6895 },
                adjustmentMinutes: 18
            },
            {
                name: "大阪",
                nameAlternatives: ["Osaka", "おおさか", "大阪市", "大阪府"],
                country: "日本",
                timezone: "Asia/Tokyo",
                coordinates: { longitude: 135.5023, latitude: 34.6937 },
                adjustmentMinutes: 0
            },
            {
                name: "名古屋",
                nameAlternatives: ["Nagoya", "なごや", "名古屋市"],
                country: "日本",
                timezone: "Asia/Tokyo",
                coordinates: { longitude: 136.9066, latitude: 35.1815 },
                adjustmentMinutes: 8
            },
            {
                name: "札幌",
                nameAlternatives: ["Sapporo", "さっぽろ", "札幌市"],
                country: "日本",
                timezone: "Asia/Tokyo",
                coordinates: { longitude: 141.3544, latitude: 43.0618 },
                adjustmentMinutes: 26
            },
            {
                name: "福岡",
                nameAlternatives: ["Fukuoka", "ふくおか", "福岡市"],
                country: "日本",
                timezone: "Asia/Tokyo",
                coordinates: { longitude: 130.4017, latitude: 33.5902 },
                adjustmentMinutes: -18
            },
            // 韓国の都市
            {
                name: "ソウル",
                nameAlternatives: ["Seoul", "서울", "ソウル特別市"],
                country: "韓国",
                timezone: "Asia/Seoul",
                coordinates: { longitude: 126.9780, latitude: 37.5665 },
                adjustmentMinutes: -32
            },
            {
                name: "釜山",
                nameAlternatives: ["Busan", "부산", "プサン"],
                country: "韓国",
                timezone: "Asia/Seoul",
                coordinates: { longitude: 129.0756, latitude: 35.1796 },
                adjustmentMinutes: -24
            },
            // 中国の都市
            {
                name: "北京",
                nameAlternatives: ["Beijing", "北京市", "ペキン"],
                country: "中国",
                timezone: "Asia/Shanghai",
                coordinates: { longitude: 116.4074, latitude: 39.9042 },
                adjustmentMinutes: -33
            },
            {
                name: "上海",
                nameAlternatives: ["Shanghai", "上海市", "シャンハイ"],
                country: "中国",
                timezone: "Asia/Shanghai",
                coordinates: { longitude: 121.4737, latitude: 31.2304 },
                adjustmentMinutes: -54
            },
            // 北米の都市
            {
                name: "ニューヨーク",
                nameAlternatives: ["New York", "NYC", "ニューヨーク市"],
                country: "アメリカ合衆国",
                timezone: "America/New_York",
                coordinates: { longitude: -74.0060, latitude: 40.7128 }
            },
            {
                name: "ロサンゼルス",
                nameAlternatives: ["Los Angeles", "LA", "ロス"],
                country: "アメリカ合衆国",
                timezone: "America/Los_Angeles",
                coordinates: { longitude: -118.2437, latitude: 34.0522 }
            },
            {
                name: "シカゴ",
                nameAlternatives: ["Chicago", "シカゴ市"],
                country: "アメリカ合衆国",
                timezone: "America/Chicago",
                coordinates: { longitude: -87.6298, latitude: 41.8781 }
            },
            {
                name: "トロント",
                nameAlternatives: ["Toronto", "トロント市"],
                country: "カナダ",
                timezone: "America/Toronto",
                coordinates: { longitude: -79.3832, latitude: 43.6532 }
            },
            {
                name: "バンクーバー",
                nameAlternatives: ["Vancouver", "バンクーバー市"],
                country: "カナダ",
                timezone: "America/Vancouver",
                coordinates: { longitude: -123.1207, latitude: 49.2827 }
            },
            // ヨーロッパの都市
            {
                name: "ロンドン",
                nameAlternatives: ["London", "ロンドン市"],
                country: "イギリス",
                timezone: "Europe/London",
                coordinates: { longitude: -0.1278, latitude: 51.5074 }
            },
            {
                name: "パリ",
                nameAlternatives: ["Paris", "パリ市"],
                country: "フランス",
                timezone: "Europe/Paris",
                coordinates: { longitude: 2.3522, latitude: 48.8566 }
            },
            {
                name: "ベルリン",
                nameAlternatives: ["Berlin", "ベルリン市"],
                country: "ドイツ",
                timezone: "Europe/Berlin",
                coordinates: { longitude: 13.4050, latitude: 52.5200 }
            },
            {
                name: "ローマ",
                nameAlternatives: ["Rome", "Roma", "ローマ市"],
                country: "イタリア",
                timezone: "Europe/Rome",
                coordinates: { longitude: 12.4964, latitude: 41.9028 }
            },
            // オセアニアの都市
            {
                name: "シドニー",
                nameAlternatives: ["Sydney", "シドニー市"],
                country: "オーストラリア",
                timezone: "Australia/Sydney",
                coordinates: { longitude: 151.2093, latitude: -33.8688 }
            },
            {
                name: "メルボルン",
                nameAlternatives: ["Melbourne", "メルボルン市"],
                country: "オーストラリア",
                timezone: "Australia/Melbourne",
                coordinates: { longitude: 144.9631, latitude: -37.8136 }
            },
            {
                name: "オークランド",
                nameAlternatives: ["Auckland", "オークランド市"],
                country: "ニュージーランド",
                timezone: "Pacific/Auckland",
                coordinates: { longitude: 174.7633, latitude: -36.8485 }
            },
            // その他アジアの都市
            {
                name: "シンガポール",
                nameAlternatives: ["Singapore", "シンガポール市"],
                country: "シンガポール",
                timezone: "Asia/Singapore",
                coordinates: { longitude: 103.8198, latitude: 1.3521 }
            },
            {
                name: "バンコク",
                nameAlternatives: ["Bangkok", "バンコク市"],
                country: "タイ",
                timezone: "Asia/Bangkok",
                coordinates: { longitude: 100.5018, latitude: 13.7563 }
            },
            {
                name: "台北",
                nameAlternatives: ["Taipei", "台北市", "タイペイ"],
                country: "台湾",
                timezone: "Asia/Taipei",
                coordinates: { longitude: 121.5654, latitude: 25.0330 }
            },
            {
                name: "香港",
                nameAlternatives: ["Hong Kong", "ホンコン"],
                country: "中国",
                timezone: "Asia/Hong_Kong",
                coordinates: { longitude: 114.1694, latitude: 22.3193 }
            }
        ];
    };
    /**
     * 都市名で検索（部分一致や代替名も考慮）
     * @param cityName 都市名
     * @returns 都市タイムゾーンデータ（見つからない場合はundefined）
     */
    TimeZoneDatabase.prototype.findCity = function (cityName) {
        if (!cityName)
            return undefined;
        // 完全一致
        var exactMatch = this.cities.find(function (city) {
            return city.name === cityName ||
                city.nameAlternatives.includes(cityName);
        });
        if (exactMatch)
            return exactMatch;
        // 部分一致
        var lowerName = cityName.toLowerCase();
        return this.cities.find(function (city) {
            var cityLower = city.name.toLowerCase();
            var altNamesLower = city.nameAlternatives.map(function (n) { return n.toLowerCase(); });
            return cityLower.includes(lowerName) ||
                lowerName.includes(cityLower) ||
                altNamesLower.some(function (alt) { return alt.includes(lowerName) || lowerName.includes(alt); });
        });
    };
    /**
     * 座標で最も近い都市を検索
     * @param longitude 経度
     * @param latitude 緯度
     * @returns 最も近い都市のタイムゾーンデータ（見つからない場合はundefined）
     */
    TimeZoneDatabase.prototype.findNearestCity = function (longitude, latitude) {
        if (this.cities.length === 0)
            return undefined;
        var nearest = this.cities[0];
        var minDistance = this.calculateDistance(longitude, latitude, nearest.coordinates.longitude, nearest.coordinates.latitude);
        for (var i = 1; i < this.cities.length; i++) {
            var city = this.cities[i];
            var distance = this.calculateDistance(longitude, latitude, city.coordinates.longitude, city.coordinates.latitude);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = city;
            }
        }
        return nearest;
    };
    /**
     * ヒューリスティックに基づいた都市検索
     * @param input ユーザー入力（都市名、国名など）
     * @returns マッチした都市のリスト
     */
    TimeZoneDatabase.prototype.smartSearch = function (input) {
        if (!input || input.trim().length === 0)
            return [];
        // キーワード分割（"東京 日本" → "東京", "日本"）
        var keywords = input.split(/[\s,]+/).filter(function (k) { return k.length > 0; });
        if (keywords.length === 0)
            return [];
        // 各都市に対してスコアを計算
        var cityScores = this.cities.map(function (city) {
            var score = 0;
            for (var _i = 0, keywords_1 = keywords; _i < keywords_1.length; _i++) {
                var keyword = keywords_1[_i];
                var lowerKeyword = keyword.toLowerCase();
                // 都市名と一致
                if (city.name.toLowerCase().includes(lowerKeyword) ||
                    lowerKeyword.includes(city.name.toLowerCase())) {
                    score += 3;
                }
                // 代替名と一致
                for (var _a = 0, _b = city.nameAlternatives; _a < _b.length; _a++) {
                    var alt = _b[_a];
                    if (alt.toLowerCase().includes(lowerKeyword) ||
                        lowerKeyword.includes(alt.toLowerCase())) {
                        score += 2;
                        break;
                    }
                }
                // 国名と一致
                if (city.country.toLowerCase().includes(lowerKeyword) ||
                    lowerKeyword.includes(city.country.toLowerCase())) {
                    score += 1;
                }
            }
            return { city: city, score: score };
        });
        // スコアでソートし、上位の結果を返す
        return cityScores
            .filter(function (item) { return item.score > 0; })
            .sort(function (a, b) { return b.score - a.score; })
            .map(function (item) { return item.city; })
            .slice(0, 5); // 上位5件
    };
    /**
     * 利用可能な都市一覧を取得
     * @returns 都市リスト
     */
    TimeZoneDatabase.prototype.getAllCities = function () {
        return __spreadArray([], this.cities, true);
    };
    /**
     * 国ごとの都市リストを取得
     * @param country 国名
     * @returns 指定した国の都市リスト
     */
    TimeZoneDatabase.prototype.getCitiesByCountry = function (country) {
        return this.cities.filter(function (city) {
            return city.country === country ||
                city.country.toLowerCase().includes(country.toLowerCase()) ||
                country.toLowerCase().includes(city.country.toLowerCase());
        });
    };
    /**
     * タイムゾーンごとの都市リストを取得
     * @param timezone タイムゾーン識別子
     * @returns 指定したタイムゾーンの都市リスト
     */
    TimeZoneDatabase.prototype.getCitiesByTimezone = function (timezone) {
        return this.cities.filter(function (city) { return city.timezone === timezone; });
    };
    /**
     * 二点間の距離を計算（ヒューリスティック）
     * @param lon1 経度1
     * @param lat1 緯度1
     * @param lon2 経度2
     * @param lat2 緯度2
     * @returns 距離（近似値）
     */
    TimeZoneDatabase.prototype.calculateDistance = function (lon1, lat1, lon2, lat2) {
        // 簡易的な距離計算（ユークリッド距離）
        // 実際のアプリケーションではハーバーサイン公式などを使うとより正確
        var x = lon1 - lon2;
        var y = lat1 - lat2;
        return Math.sqrt(x * x + y * y);
    };
    return TimeZoneDatabase;
}());
exports.TimeZoneDatabase = TimeZoneDatabase;
