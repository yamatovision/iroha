import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// テスト開始前にメモリ内MongoDBサーバーを起動
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);
});

// 各テスト間でコレクションをクリア
beforeEach(async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

// すべてのテスト終了後にメモリ内MongoDBサーバーを停止
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
});