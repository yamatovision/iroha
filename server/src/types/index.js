"use strict";
/**
 * バックエンド用型定義ファイル
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.Gender = exports.DAY_PILLAR = exports.API_BASE_PATH = void 0;
// API基本パス
exports.API_BASE_PATH = '/api/v1';
// DAY_PILLAR API
exports.DAY_PILLAR = {
    GET_TODAY: "".concat(exports.API_BASE_PATH, "/day-pillars/today"),
    GET_BY_DATE: function (date) { return "".concat(exports.API_BASE_PATH, "/day-pillars/").concat(date); },
    GET_RANGE: "".concat(exports.API_BASE_PATH, "/day-pillars"),
    GET_TIMEZONE_INFO: "".concat(exports.API_BASE_PATH, "/day-pillars/timezone-info"),
    GET_AVAILABLE_CITIES: "".concat(exports.API_BASE_PATH, "/day-pillars/available-cities"),
};
// 性別
var Gender;
(function (Gender) {
    Gender["MALE"] = "M";
    Gender["FEMALE"] = "F";
})(Gender || (exports.Gender = Gender = {}));
// 権限レベル
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
