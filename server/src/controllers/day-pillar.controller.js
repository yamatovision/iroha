"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableCities = exports.getTimezoneInfo = exports.getDayPillarRange = exports.getDayPillarByDate = exports.getTodayDayPillar = void 0;
var auth_middleware_1 = require("../middleware/auth.middleware");
var saju_engine_service_1 = require("../services/saju-engine.service");
var utils_1 = require("../utils");
/**
 * 現在の日柱情報を取得するコントローラー
 */
var getTodayDayPillar = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sajuEngineService, dayPillar;
    return __generator(this, function (_a) {
        try {
            sajuEngineService = new saju_engine_service_1.SajuEngineService();
            dayPillar = sajuEngineService.getCurrentDayPillar();
            return [2 /*return*/, res.status(200).json(dayPillar)];
        }
        catch (error) {
            return [2 /*return*/, (0, utils_1.handleError)(error, res)];
        }
        return [2 /*return*/];
    });
}); };
exports.getTodayDayPillar = getTodayDayPillar;
/**
 * 特定の日付の日柱情報を取得するコントローラー
 */
var getDayPillarByDate = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var date, parsedDate, sajuEngineService, dayPillar;
    return __generator(this, function (_a) {
        try {
            date = req.params.date;
            if (!date) {
                throw new utils_1.ValidationError('日付は必須です');
            }
            parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                throw new utils_1.ValidationError('無効な日付フォーマットです');
            }
            sajuEngineService = new saju_engine_service_1.SajuEngineService();
            dayPillar = sajuEngineService.getDayPillarByDate(parsedDate);
            return [2 /*return*/, res.status(200).json(dayPillar)];
        }
        catch (error) {
            return [2 /*return*/, (0, utils_1.handleError)(error, res)];
        }
        return [2 /*return*/];
    });
}); };
exports.getDayPillarByDate = getDayPillarByDate;
/**
 * 日付範囲の日柱情報を取得するコントローラー
 * 管理者用機能
 */
var getDayPillarRange = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, startDate, endDate, parsedStartDate, parsedEndDate, dayDifference, sajuEngineService, dayPillars, currentDate;
    return __generator(this, function (_b) {
        try {
            if (!req.user) {
                throw new utils_1.AuthenticationError('認証されていません');
            }
            // 管理者権限チェック
            if (req.user.role !== auth_middleware_1.UserRole.ADMIN && req.user.role !== auth_middleware_1.UserRole.SUPER_ADMIN) {
                throw new utils_1.ValidationError('管理者権限が必要です');
            }
            _a = req.query, startDate = _a.startDate, endDate = _a.endDate;
            if (!startDate || !endDate) {
                throw new utils_1.ValidationError('開始日と終了日は必須です');
            }
            parsedStartDate = new Date(startDate);
            parsedEndDate = new Date(endDate);
            if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
                throw new utils_1.ValidationError('無効な日付フォーマットです');
            }
            // 日付範囲のチェック
            if (parsedEndDate < parsedStartDate) {
                throw new utils_1.ValidationError('終了日は開始日より後である必要があります');
            }
            dayDifference = Math.ceil((parsedEndDate.getTime() - parsedStartDate.getTime()) / (1000 * 60 * 60 * 24));
            if (dayDifference > 30) {
                throw new utils_1.ValidationError('日付範囲は最大30日までです');
            }
            sajuEngineService = new saju_engine_service_1.SajuEngineService();
            dayPillars = [];
            currentDate = new Date(parsedStartDate);
            while (currentDate <= parsedEndDate) {
                dayPillars.push(sajuEngineService.getDayPillarByDate(new Date(currentDate)));
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return [2 /*return*/, res.status(200).json({
                    count: dayPillars.length,
                    dayPillars: dayPillars
                })];
        }
        catch (error) {
            return [2 /*return*/, (0, utils_1.handleError)(error, res)];
        }
        return [2 /*return*/];
    });
}); };
exports.getDayPillarRange = getDayPillarRange;
/**
 * タイムゾーン情報を取得するコントローラー（簡略版）
 */
var getTimezoneInfo = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var location_1, locationName, sajuEngineService, result;
    return __generator(this, function (_a) {
        try {
            location_1 = req.query.location;
            if (!location_1) {
                throw new utils_1.ValidationError('位置情報（都道府県名または「海外」）は必須です');
            }
            locationName = Array.isArray(location_1) ? location_1[0] : String(location_1);
            sajuEngineService = new saju_engine_service_1.SajuEngineService({
                useInternationalMode: true
            });
            result = sajuEngineService.getTimezoneInfo(locationName);
            return [2 /*return*/, res.status(200).json(result)];
        }
        catch (error) {
            return [2 /*return*/, (0, utils_1.handleError)(error, res)];
        }
        return [2 /*return*/];
    });
}); };
exports.getTimezoneInfo = getTimezoneInfo;
/**
 * 利用可能な都市リストを取得するコントローラー
 */
var getAvailableCities = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sajuEngineService, cities;
    return __generator(this, function (_a) {
        try {
            sajuEngineService = new saju_engine_service_1.SajuEngineService({
                useInternationalMode: true
            });
            cities = sajuEngineService.getAvailableCities();
            return [2 /*return*/, res.status(200).json({
                    count: cities.length,
                    cities: cities
                })];
        }
        catch (error) {
            return [2 /*return*/, (0, utils_1.handleError)(error, res)];
        }
        return [2 /*return*/];
    });
}); };
exports.getAvailableCities = getAvailableCities;
