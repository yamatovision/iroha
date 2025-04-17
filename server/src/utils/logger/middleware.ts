import { Request, Response, NextFunction } from 'express';
import logger, { generateTraceId, getRequestInfo } from './index';

// リクエストトレースIDを追加するミドルウェア
export const requestTracer = (req: Request, res: Response, next: NextFunction) => {
  // トレースIDがなければ生成
  if (!req.headers['x-trace-id']) {
    const traceId = generateTraceId();
    req.headers['x-trace-id'] = traceId;
    
    // レスポンスヘッダーにもトレースIDを追加（フロントエンドでの取得用）
    res.setHeader('X-Trace-ID', traceId);
  }
  
  next();
};

// HTTPリクエストをログに記録するミドルウェア
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // リクエスト開始時間を記録
  const startTime = Date.now();
  
  // リクエスト情報を取得
  const requestInfo = getRequestInfo(req);
  
  // リクエスト内容をログに出力
  logger.http(`${req.method} ${req.originalUrl || req.url}`, { meta: requestInfo });
  
  // レスポンスが完了したら実行される処理
  res.on('finish', () => {
    // レスポンス時間を計算
    const responseTime = Date.now() - startTime;
    
    // レスポンス情報を作成
    const responseInfo = {
      ...requestInfo,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    };
    
    // ステータスコードに応じてログレベルを変更
    if (res.statusCode >= 400 && res.statusCode < 500) {
      logger.warn(`${req.method} ${req.originalUrl || req.url} ${res.statusCode}`, { meta: responseInfo });
    } else if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl || req.url} ${res.statusCode}`, { meta: responseInfo });
    } else {
      logger.info(`${req.method} ${req.originalUrl || req.url} ${res.statusCode}`, { meta: responseInfo });
    }
  });
  
  next();
};

// エラーロギングミドルウェア
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  // リクエスト情報を取得
  const requestInfo = getRequestInfo(req);
  
  // エラー情報を作成
  const errorInfo = {
    ...requestInfo,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
    },
  };
  
  // エラーをログに出力
  logger.error(`エラー発生: ${err.message}`, { meta: errorInfo });
  
  // 次のミドルウェアへ
  next(err);
};