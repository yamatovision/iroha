"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternationalDateTimeProcessor = exports.TimeZoneDatabase = exports.SecondAdjuster = exports.TimeZoneUtils = exports.determineKakukyoku = exports.calculateBranchTenGodRelation = exports.applyGanShiCombinations = exports.processBranchCombinations = exports.processStemCombinations = exports.calculateKoreanHourPillar = exports.calculateKoreanDayPillar = exports.calculateKoreanMonthPillar = exports.calculateKoreanYearPillar = exports.DateTimeProcessor = exports.SajuEngine = void 0;
// メインエクスポートファイル
var SajuEngine_1 = require("./SajuEngine");
Object.defineProperty(exports, "SajuEngine", { enumerable: true, get: function () { return SajuEngine_1.SajuEngine; } });
var DateTimeProcessor_1 = require("./DateTimeProcessor");
Object.defineProperty(exports, "DateTimeProcessor", { enumerable: true, get: function () { return DateTimeProcessor_1.DateTimeProcessor; } });
// 個別の計算機能も必要に応じてエクスポート
var koreanYearPillarCalculator_1 = require("./koreanYearPillarCalculator");
Object.defineProperty(exports, "calculateKoreanYearPillar", { enumerable: true, get: function () { return koreanYearPillarCalculator_1.calculateKoreanYearPillar; } });
var koreanMonthPillarCalculator_1 = require("./koreanMonthPillarCalculator");
Object.defineProperty(exports, "calculateKoreanMonthPillar", { enumerable: true, get: function () { return koreanMonthPillarCalculator_1.calculateKoreanMonthPillar; } });
var dayPillarCalculator_1 = require("./dayPillarCalculator");
Object.defineProperty(exports, "calculateKoreanDayPillar", { enumerable: true, get: function () { return dayPillarCalculator_1.calculateKoreanDayPillar; } });
var hourPillarCalculator_1 = require("./hourPillarCalculator");
Object.defineProperty(exports, "calculateKoreanHourPillar", { enumerable: true, get: function () { return hourPillarCalculator_1.calculateKoreanHourPillar; } });
// 干合・支合処理をエクスポート
var ganShiCombinations_1 = require("./ganShiCombinations");
Object.defineProperty(exports, "processStemCombinations", { enumerable: true, get: function () { return ganShiCombinations_1.processStemCombinations; } });
Object.defineProperty(exports, "processBranchCombinations", { enumerable: true, get: function () { return ganShiCombinations_1.processBranchCombinations; } });
Object.defineProperty(exports, "applyGanShiCombinations", { enumerable: true, get: function () { return ganShiCombinations_1.applyGanShiCombinations; } });
// 十神関係計算関連をエクスポート
__exportStar(require("./tenGodCalculator"), exports);
var tenGodImprovedAlgorithm_1 = require("./tenGodImprovedAlgorithm");
Object.defineProperty(exports, "calculateBranchTenGodRelation", { enumerable: true, get: function () { return tenGodImprovedAlgorithm_1.calculateBranchTenGodRelation; } });
// 格局計算関連をエクスポート
var kakukyokuCalculator_1 = require("./kakukyokuCalculator");
Object.defineProperty(exports, "determineKakukyoku", { enumerable: true, get: function () { return kakukyokuCalculator_1.determineKakukyoku; } });
// 国際対応モジュールをエクスポート
var international_1 = require("./international");
Object.defineProperty(exports, "TimeZoneUtils", { enumerable: true, get: function () { return international_1.TimeZoneUtils; } });
Object.defineProperty(exports, "SecondAdjuster", { enumerable: true, get: function () { return international_1.SecondAdjuster; } });
Object.defineProperty(exports, "TimeZoneDatabase", { enumerable: true, get: function () { return international_1.TimeZoneDatabase; } });
Object.defineProperty(exports, "InternationalDateTimeProcessor", { enumerable: true, get: function () { return international_1.DateTimeProcessor; } });
