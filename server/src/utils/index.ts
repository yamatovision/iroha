import mongoose from 'mongoose';
export * from './error-handler';
export { default as logger } from './logger';
export * from './logger/middleware';
export { default as claudeAI } from './claude-ai';

/**
 * 型安全なstringチェック
 * @param value 検証対象の値
 * @param defaultValue デフォルト値（指定がない場合は空文字）
 * @returns 安全なstring型の値
 */
export const ensureString = (value: string | undefined | null, defaultValue: string = ''): string => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return value;
};

/**
 * 型安全なObjectId変換
 * @param value 変換対象の値
 * @returns 安全なstring型またはObjectId型の値
 */
export const ensureObjectIdOrString = (value: any): string | mongoose.Types.ObjectId => {
  if (!value) {
    throw new Error('ID値が指定されていません');
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }
  
  // toString()が使用可能な場合は文字列化
  if (value && typeof value.toString === 'function') {
    return value.toString();
  }
  
  throw new Error('有効なIDではありません');
};