import mongoose from 'mongoose';

/**
 * 文字列またはObjectIdを安全にObjectIdに変換する
 * @param id 変換する文字列またはObjectId
 * @returns ObjectId
 */
export const toObjectId = (id: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId => {
  // nullチェックを追加
  if (!id) {
    throw new Error('IDがnullまたはundefinedです');
  }
  
  // 既にObjectIdの場合はそのまま返す
  if (id instanceof mongoose.Types.ObjectId) {
    return id;
  }
  
  // 文字列のケース
  if (typeof id === 'string') {
    // 有効なObjectId形式かチェック
    if (mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else {
      throw new Error(`不正なObjectId形式: ${id}`);
    }
  }
  
  // それ以外の型の場合
  throw new Error(`不正なID型: ${typeof id}`);
};

/**
 * IDを安全に文字列に変換する
 * @param id 変換するObjectIdまたは文字列
 * @returns 文字列化されたID
 */
export const toIdString = (id: mongoose.Types.ObjectId | string): string => {
  // nullチェックを追加
  if (!id) {
    throw new Error('IDがnullまたはundefinedです');
  }
  
  // ObjectIdの場合は文字列に変換
  if (id instanceof mongoose.Types.ObjectId) {
    return id.toString();
  }
  
  // 既に文字列の場合はそのまま返す
  if (typeof id === 'string') {
    return id;
  }
  
  // それ以外の型の場合
  throw new Error(`不正なID型: ${typeof id}`);
};