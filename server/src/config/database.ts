import mongoose from 'mongoose';

/**
 * MongoDBデータベースへの接続を確立する関数
 */
export const connectToDatabase = async (): Promise<void> => {
  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME || 'dailyfortune';

  if (!MONGODB_URI) {
    console.error('MONGODB_URI環境変数が設定されていません');
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  // 既に接続されている場合はスキップ
  if (mongoose.connection.readyState === 1) {
    console.log('データベースに既に接続済みです');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};
