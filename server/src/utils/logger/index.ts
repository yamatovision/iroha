import winston from 'winston';
import { Request } from 'express';

// ログレベル定義
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 現在の環境に基づいてログレベルを決定
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// カスタムカラーの定義
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Winstonに色を登録
winston.addColors(colors);

// コンソール出力のためのカスタムフォーマット
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message} ${info.meta ? JSON.stringify(info.meta, null, 2) : ''}`
  )
);

// トレースIDを生成
export const generateTraceId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// リクエスト情報を取得
export const getRequestInfo = (req: Request): Record<string, any> => {
  return {
    traceId: req.headers['x-trace-id'] || 'no-trace-id',
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
};

// ロガーインスタンスを作成
const logger = winston.createLogger({
  level: level(),
  levels,
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

export default logger;