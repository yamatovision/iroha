"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestInfo = exports.generateTraceId = void 0;
var winston = require("winston");
// ログレベル定義
var levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// 現在の環境に基づいてログレベルを決定
var level = function () {
    var env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'info';
};
// カスタムカラーの定義
var colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};
// Winston 3.xでは直接addColorsを利用するのではなく、
// winston.format.colorize で処理される
// winston.addColors(colors);
// コンソール出力のためのカスタムフォーマット
var consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), 
  winston.format.colorize({ all: true }), 
  winston.format.printf(function (info) { 
    return "[".concat(info.timestamp, "] ").concat(info.level, ": ").concat(info.message, " ").concat(info.meta ? JSON.stringify(info.meta, null, 2) : ''); 
  })
);
// トレースIDを生成
var generateTraceId = function () {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
exports.generateTraceId = generateTraceId;
// リクエスト情報を取得
var getRequestInfo = function (req) {
    return {
        traceId: req.headers['x-trace-id'] || 'no-trace-id',
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
    };
};
exports.getRequestInfo = getRequestInfo;
// ロガーインスタンスを作成
var logger = winston.createLogger({
    level: level(),
    levels: levels,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), 
      winston.format.errors({ stack: true }), 
      winston.format.splat(), 
      winston.format.json()
    ),
    defaultMeta: { service: 'dailyfortune-api' },
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
        }),
        // 必要に応じてファイル出力も追加可能
        // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});
exports.default = logger;
