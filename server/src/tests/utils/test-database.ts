import mongoose from 'mongoose';

/**
 * データベース接続ユーティリティ
 * テスト専用のデータベースに接続します
 */
export const connectToDatabase = async () => {
  try {
    // すでに接続がある場合は何もしない
    if (mongoose.connection.readyState === 1) {
      console.log('Already connected to database');
      return;
    }
    
    // テスト環境のセットアップ - 必ず同じシークレットを使用する
    // 環境変数を強制的に設定してアプリケーション全体で一貫性を保つ
    const TEST_SECRET = 'dailyfortune_test_secret_key';
    process.env.JWT_ACCESS_SECRET = TEST_SECRET;
    process.env.JWT_REFRESH_SECRET = TEST_SECRET;
    process.env.JWT_SECRET = TEST_SECRET;
    console.log('テスト用JWT環境変数を設定しました：', {
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? '設定済み' : '未設定',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? '設定済み' : '未設定',
      JWT_SECRET: process.env.JWT_SECRET ? '設定済み' : '未設定',
    });
    
    // 環境変数からデータベースURIを取得
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyfortune';
    
    console.log('接続先データベース:', dbUri);
    
    await mongoose.connect(dbUri);
    console.log('Connected to test database');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
};

/**
 * データベース切断ユーティリティ
 */
export const disconnectFromDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from test database');
  } catch (error) {
    console.error('Failed to disconnect from test database:', error);
    throw error;
  }
};

/**
 * データベースのコレクションをクリアするユーティリティ
 * 指定されたコレクション名のデータをすべて削除します
 * @param collectionNames クリアするコレクション名の配列
 */
export const clearCollections = async (collectionNames: string[]) => {
  try {
    const db = mongoose.connection.db;
    
    for (const name of collectionNames) {
      if (mongoose.connection.collections[name]) {
        await mongoose.connection.collections[name].deleteMany({});
        console.log(`Cleared collection: ${name}`);
      }
    }
  } catch (error) {
    console.error('Failed to clear collections:', error);
    throw error;
  }
};