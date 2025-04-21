import { Request } from 'express';

/**
 * 認証済みリクエスト用の統一インターフェース
 * 全ての認証ミドルウェアでこの型を使用します
 */
export interface AuthRequest extends Request {
  user?: {
    _id: string;
    id?: string; // MongoDB ObjectIDを文字列化した値（後方互換性のため）
    email: string;
    role: string;
    organizationId?: string;
    [key: string]: any; // その他の拡張プロパティ
  };
}