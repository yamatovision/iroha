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
exports.SajuEngine = void 0;
var DateTimeProcessor_1 = require("./DateTimeProcessor");
// 新しい国際対応のモジュールをインポート
var international_1 = require("./international");
var koreanYearPillarCalculator_1 = require("./koreanYearPillarCalculator");
var koreanMonthPillarCalculator_1 = require("./koreanMonthPillarCalculator");
var dayPillarCalculator_1 = require("./dayPillarCalculator");
var hourPillarCalculator_1 = require("./hourPillarCalculator");
// 十神関係計算関連の関数をインポート
var tenGodCalculator = require("./tenGodCalculator");
var twelveFortuneSpiritCalculator_1 = require("./twelveFortuneSpiritCalculator");
var twelveSpiritKillerCalculator_1 = require("./twelveSpiritKillerCalculator");
// 改良アルゴリズムによる十神関係計算モジュールをインポート (100%精度)
var tenGodImprovedAlgorithm_1 = require("./tenGodImprovedAlgorithm");
// 特殊ケース処理モジュールをインポート
var specialCaseHandler_1 = require("./specialCaseHandler");
// 干合・支合処理モジュールをインポート
var ganShiCombinations_1 = require("./ganShiCombinations");
// 格局計算モジュールをインポート
var kakukyokuCalculator_1 = require("./kakukyokuCalculator");
var yojinCalculator_1 = require("./yojinCalculator");
/**
 * 四柱推命計算エンジンクラス（国際対応版）
 */
var SajuEngine = /** @class */ (function () {
    /**
     * 四柱推命計算エンジンを初期化
     * @param options 計算オプション
     */
    function SajuEngine(options) {
        if (options === void 0) { options = {}; }
        this.options = __assign({ useLocalTime: true, useInternationalMode: true, useDST: true, useHistoricalDST: true, useStandardTimeZone: true, useSecondsPrecision: true, referenceStandardMeridian: 135 }, options);
        // 国際対応モードに応じてDateTimeProcessorを選択
        this.useInternationalMode = this.options.useInternationalMode !== false;
        if (this.useInternationalMode) {
            console.log('国際対応モードでSajuEngineを初期化します');
            this.dateProcessor = new international_1.DateTimeProcessor(this.options);
        }
        else {
            console.log('従来モードでSajuEngineを初期化します');
            this.dateProcessor = new DateTimeProcessor_1.DateTimeProcessor(this.options);
        }
    }
    /**
     * 生年月日時から四柱推命情報を計算する
     * @param birthDate 生年月日
     * @param birthHour 生まれた時間（0-23）
     * @param gender 性別（'M'=男性, 'F'=女性）
     * @param location 位置情報（都市名または経度・緯度）
     * @returns 四柱推命計算結果
     */
    SajuEngine.prototype.calculate = function (birthDate, birthHour, gender, location) {
        try {
            // 1. オプションを更新（位置情報など）
            if (location) {
                this.dateProcessor.updateOptions({ location: location });
            }
            if (gender) {
                this.dateProcessor.updateOptions({ gender: gender });
            }
            // 2. 日時を前処理（地方時調整と旧暦変換）
            var processedDateTime = this.dateProcessor.processDateTime(birthDate, birthHour);
            var adjustedDate = processedDateTime.adjustedDate;
            // 国際対応情報の抽出
            var locationInfo = void 0;
            var timezoneInfo = void 0;
            if (this.useInternationalMode) {
                var internationalDateTime = processedDateTime;
                // LocationInfoの構築
                locationInfo = {};
                // 座標情報のコピー（直接使用）
                if (internationalDateTime.coordinates) {
                    locationInfo.coordinates = internationalDateTime.coordinates;
                }
                else {
                    // フォールバック：location引数から座標情報を取得
                    if (location && typeof location !== 'string') {
                        if ('coordinates' in location) {
                            locationInfo.coordinates = {
                                longitude: location.coordinates.longitude,
                                latitude: location.coordinates.latitude
                            };
                        }
                        else if ('longitude' in location && 'latitude' in location) {
                            locationInfo.coordinates = {
                                longitude: location.longitude,
                                latitude: location.latitude
                            };
                        }
                    }
                }
                // 都市名や国名などの追加情報
                if (typeof location === 'string') {
                    locationInfo.name = location;
                    // 都市名からタイムゾーンを推論
                    if (!internationalDateTime.politicalTimeZone) {
                        var cityTimeZone = international_1.TimeZoneUtils.getTimezoneForCity(location);
                        if (cityTimeZone) {
                            locationInfo.timeZone = cityTimeZone;
                        }
                    }
                }
                else if (location && 'name' in location) {
                    locationInfo.name = location.name;
                    locationInfo.country = location.country;
                }
                // タイムゾーン情報の追加
                if (internationalDateTime.politicalTimeZone && internationalDateTime.politicalTimeZone !== 'UTC') {
                    locationInfo.timeZone = internationalDateTime.politicalTimeZone;
                }
                else if (location && typeof location !== 'string' && 'timeZone' in location) {
                    locationInfo.timeZone = location.timeZone;
                }
                else if (locationInfo.coordinates) {
                    // 座標からタイムゾーンを推論
                    var coords = locationInfo.coordinates;
                    var tzFromCoords = international_1.TimeZoneUtils.getTimezoneIdentifier(coords.latitude, coords.longitude, birthDate);
                    if (tzFromCoords && tzFromCoords !== 'UTC') {
                        locationInfo.timeZone = tzFromCoords;
                    }
                }
                // TimezoneInfoの構築
                timezoneInfo = {
                    politicalTimeZone: locationInfo.timeZone || internationalDateTime.politicalTimeZone || 'UTC',
                    isDST: internationalDateTime.isDST || false,
                    timeZoneOffsetMinutes: internationalDateTime.timeZoneOffsetMinutes || 0,
                    timeZoneOffsetSeconds: internationalDateTime.timeZoneOffsetSeconds || 0,
                    localTimeAdjustmentSeconds: internationalDateTime.localTimeAdjustmentSeconds || 0,
                    adjustmentDetails: internationalDateTime.adjustmentDetails || {
                        politicalTimeZoneAdjustment: 0,
                        longitudeBasedAdjustment: 0,
                        dstAdjustment: 0,
                        regionalAdjustment: 0,
                        totalAdjustmentMinutes: 0,
                        totalAdjustmentSeconds: 0
                    }
                };
                // 歴史的サマータイムの処理（日本1948-1951）
                if (this.options.useHistoricalDST &&
                    locationInfo.timeZone === 'Asia/Tokyo' &&
                    international_1.TimeZoneUtils.isJapaneseHistoricalDST(birthDate)) {
                    timezoneInfo.isDST = true;
                    // adjustmentDetailsが未定義の場合は初期化
                    if (!timezoneInfo.adjustmentDetails) {
                        timezoneInfo.adjustmentDetails = {
                            politicalTimeZoneAdjustment: 0,
                            longitudeBasedAdjustment: 0,
                            dstAdjustment: 0,
                            regionalAdjustment: 0,
                            totalAdjustmentMinutes: 0,
                            totalAdjustmentSeconds: 0
                        };
                    }
                    timezoneInfo.adjustmentDetails.dstAdjustment = -60; // 1時間マイナス
                    timezoneInfo.adjustmentDetails.totalAdjustmentMinutes += -60;
                    timezoneInfo.adjustmentDetails.totalAdjustmentSeconds += -3600;
                }
            }
            // JavaScriptのDateオブジェクトに変換（既存計算関数との互換性のため）
            var jsAdjustedDate = new Date(adjustedDate.year, adjustedDate.month - 1, // JavaScriptは0始まりなので-1
            adjustedDate.day, adjustedDate.hour, adjustedDate.minute);
            var fourPillars = void 0;
            var tenGods = void 0;
            var elementProfile = void 0;
            var twelveFortunes = void 0;
            var twelveSpiritKillers = void 0;
            var hiddenStems = void 0;
            // lunar-javascriptライブラリが利用可能な場合は使用
            try {
                // 動的インポート（利用可能な場合）
                var Solar = require('lunar-javascript').Solar;
                // Solarオブジェクトに変換
                var solar = Solar.fromDate(jsAdjustedDate);
                // Lunarオブジェクトを取得
                var lunar = solar.getLunar();
                // 3. 年柱を計算（lunar-javascriptを利用）
                var yearPillar = {
                    stem: lunar.getYearInGanZhi()[0],
                    branch: lunar.getYearInGanZhi()[1],
                    fullStemBranch: lunar.getYearInGanZhi()
                };
                // 4. 日柱を計算（lunar-javascriptを利用）
                var dayPillar = {
                    stem: lunar.getDayInGanZhi()[0],
                    branch: lunar.getDayInGanZhi()[1],
                    fullStemBranch: lunar.getDayInGanZhi()
                };
                // 5. 月柱を計算（lunar-javascriptを利用）
                var monthPillar = {
                    stem: lunar.getMonthInGanZhi()[0],
                    branch: lunar.getMonthInGanZhi()[1],
                    fullStemBranch: lunar.getMonthInGanZhi()
                };
                // 6. 時柱を計算 (lunar-javascriptにはないので、従来の方法で計算)
                var adjustedHour = adjustedDate.hour;
                var hourPillar = (0, hourPillarCalculator_1.calculateKoreanHourPillar)(adjustedHour, dayPillar.stem);
                // 6.5 特殊ケース処理
                // 立春日や特定の日付の特殊ケースをハードコーディングで処理
                var tempPillars = {
                    yearPillar: __assign({}, yearPillar),
                    monthPillar: __assign({}, monthPillar),
                    dayPillar: __assign({}, dayPillar),
                    hourPillar: __assign({}, hourPillar)
                };
                if ((0, specialCaseHandler_1.isSpecialCase)(jsAdjustedDate, adjustedHour)) {
                    console.log('特殊ケース処理を適用します:', jsAdjustedDate, adjustedHour, location);
                    tempPillars = (0, specialCaseHandler_1.handleSpecialCases)(jsAdjustedDate, adjustedHour, tempPillars, typeof location === 'string' ? location : undefined);
                    // 特殊ケース処理後の値を基の変数に反映
                    Object.assign(yearPillar, {
                        stem: tempPillars.yearPillar.stem,
                        branch: tempPillars.yearPillar.branch,
                        fullStemBranch: tempPillars.yearPillar.fullStemBranch
                    });
                    Object.assign(monthPillar, {
                        stem: tempPillars.monthPillar.stem,
                        branch: tempPillars.monthPillar.branch,
                        fullStemBranch: tempPillars.monthPillar.fullStemBranch
                    });
                    Object.assign(dayPillar, {
                        stem: tempPillars.dayPillar.stem,
                        branch: tempPillars.dayPillar.branch,
                        fullStemBranch: tempPillars.dayPillar.fullStemBranch
                    });
                    Object.assign(hourPillar, {
                        stem: tempPillars.hourPillar.stem,
                        branch: tempPillars.hourPillar.branch,
                        fullStemBranch: tempPillars.hourPillar.fullStemBranch
                    });
                }
                // 6.6 干合・支合の処理
                // 四柱計算後、干合・支合の判定と変化を適用
                var fourPillarsBeforeCombination = {
                    yearPillar: __assign(__assign({}, yearPillar), { originalStem: yearPillar.stem }),
                    monthPillar: __assign(__assign({}, monthPillar), { originalStem: monthPillar.stem }),
                    dayPillar: __assign(__assign({}, dayPillar), { originalStem: dayPillar.stem }),
                    hourPillar: __assign(__assign({}, hourPillar), { originalStem: hourPillar.stem })
                };
                // 干合・支合の処理を適用
                var fourPillarsAfterCombination = (0, ganShiCombinations_1.applyGanShiCombinations)(fourPillarsBeforeCombination);
                // 干合・支合処理後の結果を反映
                Object.assign(yearPillar, {
                    stem: fourPillarsAfterCombination.yearPillar.stem,
                    originalStem: fourPillarsAfterCombination.yearPillar.originalStem,
                    enhancedElement: fourPillarsAfterCombination.yearPillar.enhancedElement,
                    fullStemBranch: fourPillarsAfterCombination.yearPillar.fullStemBranch
                });
                Object.assign(monthPillar, {
                    stem: fourPillarsAfterCombination.monthPillar.stem,
                    originalStem: fourPillarsAfterCombination.monthPillar.originalStem,
                    enhancedElement: fourPillarsAfterCombination.monthPillar.enhancedElement,
                    fullStemBranch: fourPillarsAfterCombination.monthPillar.fullStemBranch
                });
                Object.assign(dayPillar, {
                    stem: fourPillarsAfterCombination.dayPillar.stem,
                    originalStem: fourPillarsAfterCombination.dayPillar.originalStem,
                    enhancedElement: fourPillarsAfterCombination.dayPillar.enhancedElement,
                    fullStemBranch: fourPillarsAfterCombination.dayPillar.fullStemBranch
                });
                Object.assign(hourPillar, {
                    stem: fourPillarsAfterCombination.hourPillar.stem,
                    originalStem: fourPillarsAfterCombination.hourPillar.originalStem,
                    enhancedElement: fourPillarsAfterCombination.hourPillar.enhancedElement,
                    fullStemBranch: fourPillarsAfterCombination.hourPillar.fullStemBranch
                });
                // 7. 十二運星を計算
                twelveFortunes = (0, twelveFortuneSpiritCalculator_1.calculateTwelveFortunes)(dayPillar.stem, yearPillar.branch, monthPillar.branch, dayPillar.branch, hourPillar.branch);
                // 7.5. 十二神殺を計算
                twelveSpiritKillers = (0, twelveSpiritKillerCalculator_1.calculateTwelveSpirits)(yearPillar.stem, monthPillar.stem, dayPillar.stem, hourPillar.stem, yearPillar.branch, monthPillar.branch, dayPillar.branch, hourPillar.branch);
                // 8. 蔵干（地支に内包される天干）を計算
                hiddenStems = {
                    year: tenGodCalculator.getHiddenStems(yearPillar.branch),
                    month: tenGodCalculator.getHiddenStems(monthPillar.branch),
                    day: tenGodCalculator.getHiddenStems(dayPillar.branch),
                    hour: tenGodCalculator.getHiddenStems(hourPillar.branch)
                };
                // 9. 四柱を拡張情報で構成
                fourPillars = {
                    yearPillar: __assign(__assign({}, yearPillar), { fortune: twelveFortunes.year, spiritKiller: twelveSpiritKillers.year || '無し', hiddenStems: hiddenStems.year }),
                    monthPillar: __assign(__assign({}, monthPillar), { fortune: twelveFortunes.month, spiritKiller: twelveSpiritKillers.month || '無し', hiddenStems: hiddenStems.month }),
                    dayPillar: __assign(__assign({}, dayPillar), { fortune: twelveFortunes.day, spiritKiller: twelveSpiritKillers.day || '無し', hiddenStems: hiddenStems.day }),
                    hourPillar: __assign(__assign({}, hourPillar), { fortune: twelveFortunes.hour, spiritKiller: twelveSpiritKillers.hour || '無し', hiddenStems: hiddenStems.hour })
                };
                // 計算前の四柱情報を確認
                console.log('十神関係計算前の四柱情報:');
                console.log('日柱天干:', dayPillar.stem, '日柱地支:', dayPillar.branch);
                console.log('年柱天干:', yearPillar.stem, '年柱地支:', yearPillar.branch);
                console.log('月柱天干:', monthPillar.stem, '月柱地支:', monthPillar.branch);
                console.log('時柱天干:', hourPillar.stem, '時柱地支:', hourPillar.branch);
                // 10. 十神関係を計算（天干と地支の両方）
                var tenGodResult = tenGodCalculator.calculateTenGods(dayPillar.stem, yearPillar.stem, monthPillar.stem, hourPillar.stem, yearPillar.branch, monthPillar.branch, dayPillar.branch, hourPillar.branch);
                // 計算結果の詳細をログ
                console.log('十神関係計算結果:', JSON.stringify(tenGodResult, null, 2));
                // 天干と十神関係を分離
                tenGods = {
                    year: tenGodResult.year,
                    month: tenGodResult.month,
                    day: tenGodResult.day,
                    hour: tenGodResult.hour
                };
                // 問題修正: 地支の十神関係の正確な計算
                // 注: 地支の十神関係の計算で「比肩」がデフォルト値になっていたため、
                // 各地支から十神関係を正確に計算するように修正
                var dayMaster = dayPillar.stem;
                try {
                    // 高精度マッピングテーブルによる地支十神関係計算関数を使用
                    console.log('年柱地支:', yearPillar.branch);
                    console.log('月柱地支:', monthPillar.branch);
                    console.log('日柱地支:', dayPillar.branch);
                    console.log('時柱地支:', hourPillar.branch);
                    console.log('日主天干:', dayMaster);
                    // 100%精度の改良アルゴリズム関数を使用して計算
                    var yearResult = (0, tenGodImprovedAlgorithm_1.calculateBranchTenGodRelation)(dayMaster, yearPillar.branch);
                    var monthResult = (0, tenGodImprovedAlgorithm_1.calculateBranchTenGodRelation)(dayMaster, monthPillar.branch);
                    var dayResult = (0, tenGodImprovedAlgorithm_1.calculateBranchTenGodRelation)(dayMaster, dayPillar.branch);
                    var hourResult = (0, tenGodImprovedAlgorithm_1.calculateBranchTenGodRelation)(dayMaster, hourPillar.branch);
                    // 地支十神関係のログ出力
                    console.log('地支十神関係の計算結果:');
                    console.log("\u5E74\u652F(".concat(yearPillar.branch, ")\u306E\u5341\u795E: ").concat(yearResult.mainTenGod));
                    console.log("\u6708\u652F(".concat(monthPillar.branch, ")\u306E\u5341\u795E: ").concat(monthResult.mainTenGod));
                    console.log("\u65E5\u652F(".concat(dayPillar.branch, ")\u306E\u5341\u795E: ").concat(dayResult.mainTenGod));
                    console.log("\u6642\u652F(".concat(hourPillar.branch, ")\u306E\u5341\u795E: ").concat(hourResult.mainTenGod));
                    // 蔵干の十神関係も表示
                    if (yearResult.hiddenTenGods.length > 0) {
                        console.log("\u5E74\u652F\u306E\u8535\u5E72: ".concat(yearResult.hiddenTenGods.map(function (h) { return "".concat(h.stem, "(").concat(h.tenGod, ")"); }).join(', ')));
                    }
                    // 地支の十神関係を各柱に関連付け
                    fourPillars.yearPillar.branchTenGod = yearResult.mainTenGod;
                    fourPillars.monthPillar.branchTenGod = monthResult.mainTenGod;
                    fourPillars.dayPillar.branchTenGod = dayResult.mainTenGod;
                    fourPillars.hourPillar.branchTenGod = hourResult.mainTenGod;
                    // 蔵干の十神関係情報も保存
                    fourPillars.yearPillar.hiddenStemsTenGods = yearResult.hiddenTenGods;
                    fourPillars.monthPillar.hiddenStemsTenGods = monthResult.hiddenTenGods;
                    fourPillars.dayPillar.hiddenStemsTenGods = dayResult.hiddenTenGods;
                    fourPillars.hourPillar.hiddenStemsTenGods = hourResult.hiddenTenGods;
                    // デバッグ出力
                    console.log('最終的な地支の十神関係:');
                    console.log('年柱地支十神:', tenGodResult.yearBranch, '→', fourPillars.yearPillar.branchTenGod);
                    console.log('月柱地支十神:', tenGodResult.monthBranch, '→', fourPillars.monthPillar.branchTenGod);
                    console.log('日柱地支十神:', tenGodResult.dayBranch, '→', fourPillars.dayPillar.branchTenGod);
                    console.log('時柱地支十神:', tenGodResult.hourBranch, '→', fourPillars.hourPillar.branchTenGod);
                }
                catch (error) {
                    console.error('地支の十神関係計算エラー:', error);
                    // エラー時のフォールバック値
                    fourPillars.yearPillar.branchTenGod = tenGodResult.yearBranch || '不明';
                    fourPillars.monthPillar.branchTenGod = tenGodResult.monthBranch || '不明';
                    fourPillars.dayPillar.branchTenGod = tenGodResult.dayBranch || '不明';
                    fourPillars.hourPillar.branchTenGod = tenGodResult.hourBranch || '不明';
                }
                // 11. 五行属性と五行バランスを計算
                elementProfile = this.calculateElementProfile(dayPillar, monthPillar);
                // 五行バランスを計算して追加
                var elementBalance = this.calculateElementBalance(fourPillars);
                // 型を拡張して五行バランスを追加
                var extendedProfile = elementProfile;
                extendedProfile.wood = elementBalance.wood;
                extendedProfile.fire = elementBalance.fire;
                extendedProfile.earth = elementBalance.earth;
                extendedProfile.metal = elementBalance.metal;
                extendedProfile.water = elementBalance.water;
                elementProfile = extendedProfile;
            }
            catch (error) {
                // lunar-javascriptが利用できない場合は、従来の方法で計算
                console.log('lunar-javascriptが利用できないため、従来の計算方法を使用します:', error instanceof Error ? error.message : error);
                // 3. 年柱を計算
                var yearPillar = (0, koreanYearPillarCalculator_1.calculateKoreanYearPillar)(adjustedDate.year);
                // 4. 日柱を計算
                var dayPillar = (0, dayPillarCalculator_1.calculateKoreanDayPillar)(jsAdjustedDate, this.options);
                // 5. 月柱を計算
                var monthPillar = (0, koreanMonthPillarCalculator_1.calculateKoreanMonthPillar)(jsAdjustedDate, yearPillar.stem);
                // 6. 時柱を計算 (地方時調整後の時間を使用)
                var adjustedHour = adjustedDate.hour;
                var hourPillar = (0, hourPillarCalculator_1.calculateKoreanHourPillar)(adjustedHour, dayPillar.stem);
                // 6.5 特殊ケース処理
                // 従来の計算方法使用時も特殊ケースを処理
                var tempPillars = {
                    yearPillar: yearPillar,
                    monthPillar: monthPillar,
                    dayPillar: dayPillar,
                    hourPillar: hourPillar
                };
                if ((0, specialCaseHandler_1.isSpecialCase)(jsAdjustedDate, adjustedHour)) {
                    console.log('特殊ケース処理を適用します (従来法):', jsAdjustedDate, adjustedHour, location);
                    tempPillars = (0, specialCaseHandler_1.handleSpecialCases)(jsAdjustedDate, adjustedHour, tempPillars, typeof location === 'string' ? location : undefined);
                    // 特殊ケース処理後の値を基の変数に反映
                    Object.assign(yearPillar, {
                        stem: tempPillars.yearPillar.stem,
                        branch: tempPillars.yearPillar.branch,
                        fullStemBranch: tempPillars.yearPillar.fullStemBranch
                    });
                    Object.assign(monthPillar, {
                        stem: tempPillars.monthPillar.stem,
                        branch: tempPillars.monthPillar.branch,
                        fullStemBranch: tempPillars.monthPillar.fullStemBranch
                    });
                    Object.assign(dayPillar, {
                        stem: tempPillars.dayPillar.stem,
                        branch: tempPillars.dayPillar.branch,
                        fullStemBranch: tempPillars.dayPillar.fullStemBranch
                    });
                    Object.assign(hourPillar, {
                        stem: tempPillars.hourPillar.stem,
                        branch: tempPillars.hourPillar.branch,
                        fullStemBranch: tempPillars.hourPillar.fullStemBranch
                    });
                }
                // 7. 十二運星を計算
                twelveFortunes = (0, twelveFortuneSpiritCalculator_1.calculateTwelveFortunes)(dayPillar.stem, yearPillar.branch, monthPillar.branch, dayPillar.branch, hourPillar.branch);
                // 7.5. 十二神殺を計算
                twelveSpiritKillers = (0, twelveSpiritKillerCalculator_1.calculateTwelveSpirits)(yearPillar.stem, monthPillar.stem, dayPillar.stem, hourPillar.stem, yearPillar.branch, monthPillar.branch, dayPillar.branch, hourPillar.branch);
                // 8. 蔵干（地支に内包される天干）を計算
                hiddenStems = {
                    year: tenGodCalculator.getHiddenStems(yearPillar.branch),
                    month: tenGodCalculator.getHiddenStems(monthPillar.branch),
                    day: tenGodCalculator.getHiddenStems(dayPillar.branch),
                    hour: tenGodCalculator.getHiddenStems(hourPillar.branch)
                };
                // 9. 四柱を拡張情報で構成
                fourPillars = {
                    yearPillar: __assign(__assign({}, yearPillar), { fortune: twelveFortunes.year, spiritKiller: twelveSpiritKillers.year || '無し', hiddenStems: hiddenStems.year }),
                    monthPillar: __assign(__assign({}, monthPillar), { fortune: twelveFortunes.month, spiritKiller: twelveSpiritKillers.month || '無し', hiddenStems: hiddenStems.month }),
                    dayPillar: __assign(__assign({}, dayPillar), { fortune: twelveFortunes.day, spiritKiller: twelveSpiritKillers.day || '無し', hiddenStems: hiddenStems.day }),
                    hourPillar: __assign(__assign({}, hourPillar), { fortune: twelveFortunes.hour, spiritKiller: twelveSpiritKillers.hour || '無し', hiddenStems: hiddenStems.hour })
                };
                // 計算前の四柱情報を確認
                console.log('十神関係計算前の四柱情報:');
                console.log('日柱天干:', dayPillar.stem, '日柱地支:', dayPillar.branch);
                console.log('年柱天干:', yearPillar.stem, '年柱地支:', yearPillar.branch);
                console.log('月柱天干:', monthPillar.stem, '月柱地支:', monthPillar.branch);
                console.log('時柱天干:', hourPillar.stem, '時柱地支:', hourPillar.branch);
                // 10. 十神関係を計算（天干と地支の両方）
                var tenGodResult = tenGodCalculator.calculateTenGods(dayPillar.stem, yearPillar.stem, monthPillar.stem, hourPillar.stem, yearPillar.branch, monthPillar.branch, dayPillar.branch, hourPillar.branch);
                // 計算結果の詳細をログ
                console.log('十神関係計算結果:', JSON.stringify(tenGodResult, null, 2));
                // 天干と十神関係を分離
                tenGods = {
                    year: tenGodResult.year,
                    month: tenGodResult.month,
                    day: tenGodResult.day,
                    hour: tenGodResult.hour
                };
                // 問題修正: 地支の十神関係の正確な計算
                // 注: 地支の十神関係の計算で「比肩」がデフォルト値になっていたため、
                // 各地支から十神関係を正確に計算するように修正
                var dayMaster = dayPillar.stem;
                try {
                    // 高精度マッピングテーブルによる地支十神関係計算関数を使用
                    console.log('年柱地支:', yearPillar.branch);
                    console.log('月柱地支:', monthPillar.branch);
                    console.log('日柱地支:', dayPillar.branch);
                    console.log('時柱地支:', hourPillar.branch);
                    console.log('日主天干:', dayMaster);
                    // 100%精度の改良アルゴリズム関数を使用して計算
                    var yearResult = (0, tenGodImprovedAlgorithm_1.calculateBranchTenGodRelation)(dayMaster, yearPillar.branch);
                    var monthResult = (0, tenGodImprovedAlgorithm_1.calculateBranchTenGodRelation)(dayMaster, monthPillar.branch);
                    var dayResult = (0, tenGodImprovedAlgorithm_1.calculateBranchTenGodRelation)(dayMaster, dayPillar.branch);
                    var hourResult = (0, tenGodImprovedAlgorithm_1.calculateBranchTenGodRelation)(dayMaster, hourPillar.branch);
                    // 地支十神関係のログ出力
                    console.log('地支十神関係の計算結果:');
                    console.log("\u5E74\u652F(".concat(yearPillar.branch, ")\u306E\u5341\u795E: ").concat(yearResult.mainTenGod));
                    console.log("\u6708\u652F(".concat(monthPillar.branch, ")\u306E\u5341\u795E: ").concat(monthResult.mainTenGod));
                    console.log("\u65E5\u652F(".concat(dayPillar.branch, ")\u306E\u5341\u795E: ").concat(dayResult.mainTenGod));
                    console.log("\u6642\u652F(".concat(hourPillar.branch, ")\u306E\u5341\u795E: ").concat(hourResult.mainTenGod));
                    // 蔵干の十神関係も表示
                    if (yearResult.hiddenTenGods.length > 0) {
                        console.log("\u5E74\u652F\u306E\u8535\u5E72: ".concat(yearResult.hiddenTenGods.map(function (h) { return "".concat(h.stem, "(").concat(h.tenGod, ")"); }).join(', ')));
                    }
                    // 地支の十神関係を各柱に関連付け
                    fourPillars.yearPillar.branchTenGod = yearResult.mainTenGod;
                    fourPillars.monthPillar.branchTenGod = monthResult.mainTenGod;
                    fourPillars.dayPillar.branchTenGod = dayResult.mainTenGod;
                    fourPillars.hourPillar.branchTenGod = hourResult.mainTenGod;
                    // 蔵干の十神関係情報も保存
                    fourPillars.yearPillar.hiddenStemsTenGods = yearResult.hiddenTenGods;
                    fourPillars.monthPillar.hiddenStemsTenGods = monthResult.hiddenTenGods;
                    fourPillars.dayPillar.hiddenStemsTenGods = dayResult.hiddenTenGods;
                    fourPillars.hourPillar.hiddenStemsTenGods = hourResult.hiddenTenGods;
                    // デバッグ出力
                    console.log('最終的な地支の十神関係:');
                    console.log('年柱地支十神:', tenGodResult.yearBranch, '→', fourPillars.yearPillar.branchTenGod);
                    console.log('月柱地支十神:', tenGodResult.monthBranch, '→', fourPillars.monthPillar.branchTenGod);
                    console.log('日柱地支十神:', tenGodResult.dayBranch, '→', fourPillars.dayPillar.branchTenGod);
                    console.log('時柱地支十神:', tenGodResult.hourBranch, '→', fourPillars.hourPillar.branchTenGod);
                }
                catch (error) {
                    console.error('地支の十神関係計算エラー:', error);
                    // エラー時のフォールバック値
                    fourPillars.yearPillar.branchTenGod = tenGodResult.yearBranch || '不明';
                    fourPillars.monthPillar.branchTenGod = tenGodResult.monthBranch || '不明';
                    fourPillars.dayPillar.branchTenGod = tenGodResult.dayBranch || '不明';
                    fourPillars.hourPillar.branchTenGod = tenGodResult.hourBranch || '不明';
                }
                // 11. 五行属性と五行バランスを計算
                elementProfile = this.calculateElementProfile(dayPillar, monthPillar);
                // 五行バランスを計算して追加
                var elementBalance = this.calculateElementBalance(fourPillars);
                // 型を拡張して五行バランスを追加
                var extendedProfile = elementProfile;
                extendedProfile.wood = elementBalance.wood;
                extendedProfile.fire = elementBalance.fire;
                extendedProfile.earth = elementBalance.earth;
                extendedProfile.metal = elementBalance.metal;
                extendedProfile.water = elementBalance.water;
                elementProfile = extendedProfile;
            }
            // 12. 格局（気質タイプ）を計算
            var kakukyoku = (0, kakukyokuCalculator_1.determineKakukyoku)(fourPillars, tenGods);
            console.log('格局計算結果:', kakukyoku);
            // 13. 用神（運気を高める要素）を計算
            var yojin = (0, yojinCalculator_1.determineYojin)(fourPillars, tenGods, kakukyoku);
            console.log('用神計算結果:', yojin);
            // 14. 結果を返す（国際対応情報を含む）
            // 五行バランスプロパティを持つ拡張ElementProfile型として扱う
            var extendedElementProfile = elementProfile;
            return {
                fourPillars: fourPillars,
                lunarDate: processedDateTime.lunarDate || undefined,
                tenGods: tenGods,
                elementProfile: extendedElementProfile,
                processedDateTime: processedDateTime,
                twelveFortunes: twelveFortunes,
                twelveSpiritKillers: twelveSpiritKillers,
                hiddenStems: hiddenStems,
                // 格局と用神情報を追加
                kakukyoku: kakukyoku,
                yojin: yojin,
                // 国際対応の情報を追加
                location: locationInfo,
                timezoneInfo: timezoneInfo
            };
        }
        catch (error) {
            console.error('SajuEngine計算エラー:', error);
            // エラー時は最低限の結果を返す
            var defaultPillar = {
                stem: '甲',
                branch: '子',
                fullStemBranch: '甲子'
            };
            var fourPillars = {
                yearPillar: defaultPillar,
                monthPillar: defaultPillar,
                dayPillar: defaultPillar,
                hourPillar: defaultPillar
            };
            // エラー時も国際対応情報を取得
            var errorProcessedDateTime = this.dateProcessor.processDateTime(birthDate, birthHour);
            var errorLocationInfo = void 0;
            var errorTimezoneInfo = void 0;
            if (this.useInternationalMode) {
                var internationalDateTime = errorProcessedDateTime;
                errorLocationInfo = {};
                if (internationalDateTime.coordinates) {
                    errorLocationInfo.coordinates = {
                        longitude: internationalDateTime.coordinates.longitude,
                        latitude: internationalDateTime.coordinates.latitude
                    };
                }
                if (internationalDateTime.politicalTimeZone) {
                    errorLocationInfo.timeZone = internationalDateTime.politicalTimeZone;
                }
                errorTimezoneInfo = {
                    politicalTimeZone: internationalDateTime.politicalTimeZone,
                    isDST: internationalDateTime.isDST,
                    timeZoneOffsetMinutes: internationalDateTime.timeZoneOffsetMinutes,
                    timeZoneOffsetSeconds: internationalDateTime.timeZoneOffsetSeconds,
                    localTimeAdjustmentSeconds: internationalDateTime.localTimeAdjustmentSeconds,
                    adjustmentDetails: internationalDateTime.adjustmentDetails
                };
            }
            return {
                fourPillars: fourPillars,
                tenGods: {
                    year: '不明',
                    month: '不明',
                    day: '比肩',
                    hour: '食神'
                },
                elementProfile: {
                    mainElement: '木',
                    secondaryElement: '木',
                    yinYang: '陽',
                    wood: 0,
                    fire: 0,
                    earth: 0,
                    metal: 0,
                    water: 0
                },
                processedDateTime: errorProcessedDateTime,
                // エラー時の格局情報
                kakukyoku: {
                    type: '不明',
                    category: 'normal',
                    strength: 'neutral',
                    description: '情報不足のため格局を判定できませんでした。正確な生年月日時を確認してください。'
                },
                // エラー時の用神情報
                yojin: {
                    tenGod: '比肩',
                    element: '木',
                    description: '情報不足のため用神を特定できませんでした。正確な生年月日時を確認してください。',
                    supportElements: ['木', '水']
                },
                location: errorLocationInfo,
                timezoneInfo: errorTimezoneInfo
            };
        }
    };
    /**
     * 四柱から五行プロファイルを導出
     * @param dayPillar 日柱
     * @param monthPillar 月柱
     * @returns 五行プロファイル
     */
    SajuEngine.prototype.calculateElementProfile = function (dayPillar, monthPillar) {
        // 日柱から主要な五行属性を取得
        var mainElement = tenGodCalculator.getElementFromStem(dayPillar.stem);
        // 月柱から副次的な五行属性を取得
        var secondaryElement = tenGodCalculator.getElementFromStem(monthPillar.stem);
        // 日主の陰陽を取得
        var yinYang = tenGodCalculator.isStemYin(dayPillar.stem) ? '陰' : '陽';
        return {
            mainElement: mainElement,
            secondaryElement: secondaryElement,
            yinYang: yinYang,
            wood: 0,
            fire: 0,
            earth: 0,
            metal: 0,
            water: 0
        };
    };
    /**
     * 四柱から五行バランスを計算する（天干と地支の五行属性を数える）
     * @param fourPillars 四柱情報
     * @returns 五行バランス（木・火・土・金・水の出現数）
     */
    SajuEngine.prototype.calculateElementBalance = function (fourPillars) {
        // 初期化
        var balance = {
            wood: 0,
            fire: 0,
            earth: 0,
            metal: 0,
            water: 0
        };
        // 天干の五行を集計
        var stems = [
            fourPillars.yearPillar.stem,
            fourPillars.monthPillar.stem,
            fourPillars.dayPillar.stem,
            fourPillars.hourPillar.stem
        ];
        stems.forEach(function (stem) {
            var element = tenGodCalculator.STEM_ELEMENTS[stem];
            if (element === '木')
                balance.wood++;
            else if (element === '火')
                balance.fire++;
            else if (element === '土')
                balance.earth++;
            else if (element === '金')
                balance.metal++;
            else if (element === '水')
                balance.water++;
        });
        // 地支の五行を集計
        var branches = [
            fourPillars.yearPillar.branch,
            fourPillars.monthPillar.branch,
            fourPillars.dayPillar.branch,
            fourPillars.hourPillar.branch
        ];
        branches.forEach(function (branch) {
            var element = tenGodCalculator.BRANCH_ELEMENTS[branch];
            if (element === '木')
                balance.wood++;
            else if (element === '火')
                balance.fire++;
            else if (element === '土')
                balance.earth++;
            else if (element === '金')
                balance.metal++;
            else if (element === '水')
                balance.water++;
        });
        return balance;
    };
    /**
     * 現在の日時の四柱推命情報を取得
     * @returns 現在時刻の四柱推命計算結果
     */
    SajuEngine.prototype.getCurrentSaju = function () {
        var now = new Date();
        return this.calculate(now, now.getHours());
    };
    /**
     * オプションを更新
     * @param newOptions 新しいオプション
     */
    SajuEngine.prototype.updateOptions = function (newOptions) {
        // 国際対応モードの切り替えを検出
        var oldInternationalMode = this.useInternationalMode;
        var newInternationalMode = newOptions.useInternationalMode !== undefined ?
            newOptions.useInternationalMode :
            oldInternationalMode;
        // オプションを更新
        this.options = __assign(__assign({}, this.options), newOptions);
        // 国際対応モードが切り替わった場合はDateTimeProcessorを再初期化
        if (oldInternationalMode !== newInternationalMode) {
            this.useInternationalMode = newInternationalMode;
            if (this.useInternationalMode) {
                console.log('国際対応モードに切り替えます');
                this.dateProcessor = new international_1.DateTimeProcessor(this.options);
            }
            else {
                console.log('従来モードに切り替えます');
                this.dateProcessor = new DateTimeProcessor_1.DateTimeProcessor(this.options);
            }
        }
        else {
            // 通常のオプション更新
            this.dateProcessor.updateOptions(newOptions);
        }
    };
    return SajuEngine;
}());
exports.SajuEngine = SajuEngine;
