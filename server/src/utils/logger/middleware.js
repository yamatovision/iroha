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
exports.errorLogger = exports.requestLogger = exports.requestTracer = void 0;
var index_1 = require("./index");
// リクエストトレースIDを追加するミドルウェア
var requestTracer = function (req, res, next) {
    // トレースIDがなければ生成
    if (!req.headers['x-trace-id']) {
        var traceId = (0, index_1.generateTraceId)();
        req.headers['x-trace-id'] = traceId;
        // レスポンスヘッダーにもトレースIDを追加（フロントエンドでの取得用）
        res.setHeader('X-Trace-ID', traceId);
    }
    next();
};
exports.requestTracer = requestTracer;
// HTTPリクエストをログに記録するミドルウェア
var requestLogger = function (req, res, next) {
    // リクエスト開始時間を記録
    var startTime = Date.now();
    // リクエスト情報を取得
    var requestInfo = (0, index_1.getRequestInfo)(req);
    // リクエスト内容をログに出力
    index_1.default.http("".concat(req.method, " ").concat(req.originalUrl || req.url), { meta: requestInfo });
    // レスポンスが完了したら実行される処理
    res.on('finish', function () {
        // レスポンス時間を計算
        var responseTime = Date.now() - startTime;
        // レスポンス情報を作成
        var responseInfo = __assign(__assign({}, requestInfo), { statusCode: res.statusCode, responseTime: "".concat(responseTime, "ms") });
        // ステータスコードに応じてログレベルを変更
        if (res.statusCode >= 400 && res.statusCode < 500) {
            index_1.default.warn("".concat(req.method, " ").concat(req.originalUrl || req.url, " ").concat(res.statusCode), { meta: responseInfo });
        }
        else if (res.statusCode >= 500) {
            index_1.default.error("".concat(req.method, " ").concat(req.originalUrl || req.url, " ").concat(res.statusCode), { meta: responseInfo });
        }
        else {
            index_1.default.info("".concat(req.method, " ").concat(req.originalUrl || req.url, " ").concat(res.statusCode), { meta: responseInfo });
        }
    });
    next();
};
exports.requestLogger = requestLogger;
// エラーロギングミドルウェア
var errorLogger = function (err, req, res, next) {
    // リクエスト情報を取得
    var requestInfo = (0, index_1.getRequestInfo)(req);
    // エラー情報を作成
    var errorInfo = __assign(__assign({}, requestInfo), { error: {
            message: err.message,
            stack: err.stack,
            name: err.name,
            code: err.code,
        } });
    // エラーをログに出力
    index_1.default.error("\u30A8\u30E9\u30FC\u767A\u751F: ".concat(err.message), { meta: errorInfo });
    // 次のミドルウェアへ
    next(err);
};
exports.errorLogger = errorLogger;
