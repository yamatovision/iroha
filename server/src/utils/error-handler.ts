import { Response } from 'express';

// アプリケーション共通のエラークラス
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // 操作的なエラー（予期されたエラー）

    Error.captureStackTrace(this, this.constructor);
  }
}

// 認証エラー
export class AuthenticationError extends AppError {
  constructor(message = '認証に失敗しました') {
    super(message, 401);
  }
}

// 権限エラー
export class AuthorizationError extends AppError {
  constructor(message = '権限がありません') {
    super(message, 403);
  }
}

// 入力検証エラー
export class ValidationError extends AppError {
  constructor(message = '入力が無効です') {
    super(message, 400);
  }
}

// リソース未検出エラー
export class NotFoundError extends AppError {
  constructor(message = 'リソースが見つかりません') {
    super(message, 404);
  }
}

// リクエスト不正エラー
export class BadRequestError extends AppError {
  constructor(message = 'リクエストが無効です') {
    super(message, 400);
  }
}

// 認可エラー
export class UnauthorizedError extends AppError {
  constructor(message = '権限がありません') {
    super(message, 403);
  }
}

// エラーハンドリング関数
export const handleError = (err: any, res: Response): Response => {
  // AppErrorの場合は操作的エラーとして処理
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // 予期しないエラーの場合
  console.error('予期しないエラー:', err);

  return res.status(500).json({
    status: 'error',
    message: '内部サーバーエラーが発生しました'
  });
};