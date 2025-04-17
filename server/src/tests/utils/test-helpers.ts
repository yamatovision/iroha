import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import { User } from '../../models/User';
import { UserRole } from '../../middleware/auth.middleware';

/**
 * テスト用モック型定義
 * Pは元の型、Rはモック返り値の型
 */
export type MockType<T> = T & jest.Mock;

/**
 * テスト用ユーザータイプ
 */
export type MockUserType = 'superadmin' | 'admin' | 'user';

/**
 * Firebase認証のモック用関数
 */
export const mockFirebaseAuth = () => {
  jest.mock('../../config/firebase', () => ({
    auth: {
      verifyIdToken: jest.fn(),
    }
  }));
};

/**
 * テスト用ユーザー作成関数
 */
export const createMockUser = async (
  type: MockUserType = 'user',
  overrides: Partial<any> = {}
) => {
  let role: 'SuperAdmin' | 'Admin' | 'User';
  let plan: 'elite' | 'lite' = 'lite';
  
  switch (type) {
    case 'superadmin':
      role = 'SuperAdmin';
      plan = 'elite';
      break;
    case 'admin':
      role = 'Admin';
      plan = 'elite';
      break;
    default:
      role = 'User';
      break;
  }

  const userId = new mongoose.Types.ObjectId();
  
  // 組織IDとチームIDを生成（必須フィールド）
  const organizationId = new mongoose.Types.ObjectId();
  const teamId = new mongoose.Types.ObjectId();
  
  const userData = {
    _id: userId,
    firebaseUid: `firebase-${userId}`,
    email: `${type}-${userId}@example.com`,
    password: 'Password123!', // 必須フィールド
    displayName: `Test ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    role,
    plan,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    organizationId, // 必須フィールド
    teamId, // 必須フィールド
    ...overrides
  };

  return await User.create(userData);
};

/**
 * Firebase認証トークン検証のモック関数
 */
export const mockVerifyIdToken = (auth: any, user: any) => {
  (auth.verifyIdToken as jest.Mock).mockResolvedValue({
    uid: user.firebaseUid,
    email: user.email
  });
};

/**
 * テスト用のアプリケーションインスタンスを作成
 */
export const createTestApp = () => {
  const app = express();
  app.use(express.json());
  return app;
};

/**
 * テストサーバーのリクエスト生成関数
 */
export const createTestRequest = (app: express.Application) => {
  return request(app);
};

/**
 * テスト用の認証トークンを生成
 */
export const generateTestToken = (userId: string = 'test-user') => {
  return `test-token-${userId}`;
};

/**
 * テストの実行前にデータベースをクリーンアップする関数
 */
export const cleanDatabase = async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
};

/**
 * MongoDB接続を管理するユーティリティクラス
 */
export class MongoDBConnector {
  private static instance: MongoDBConnector;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'disconnecting' = 'disconnected';

  constructor() {
    if (MongoDBConnector.instance) {
      return MongoDBConnector.instance;
    }
    MongoDBConnector.instance = this;
  }

  /**
   * MongoDBに接続する
   * @returns 接続成功時はtrue、失敗時はfalse
   */
  async connect(): Promise<boolean> {
    try {
      if (this.connectionStatus === 'connected') {
        console.log('既にMongoDBに接続済みです');
        return true;
      }

      this.connectionStatus = 'connecting';
      
      // 環境変数からMongoDB URIを取得
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
      
      // Mongooseオプション
      const mongooseOptions: mongoose.ConnectOptions = {
        serverSelectionTimeoutMS: 10000, // サーバー選択のタイムアウト: 10秒
        socketTimeoutMS: 45000, // ソケットタイムアウト: 45秒
      };

      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGODB_URI, mongooseOptions);
      }

      this.connectionStatus = 'connected';
      console.log('MongoDB接続成功');
      return true;
    } catch (error) {
      this.connectionStatus = 'disconnected';
      console.error('MongoDB接続エラー:', error);
      return false;
    }
  }

  /**
   * MongoDBとの接続を切断する
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connectionStatus === 'disconnected') {
        console.log('既にMongoDBから切断済みです');
        return;
      }

      this.connectionStatus = 'disconnecting';
      
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      this.connectionStatus = 'disconnected';
      console.log('MongoDBから切断しました');
    } catch (error) {
      console.error('MongoDB切断エラー:', error);
      throw error;
    }
  }

  /**
   * 接続状態を確認する
   * @returns 接続状態の文字列
   */
  getStatus(): string {
    return this.connectionStatus;
  }

  /**
   * DBコレクションのデータ件数を確認する
   * @param collectionName 確認するコレクション名
   * @returns コレクション内のドキュメント数
   */
  async countDocuments(collectionName: string): Promise<number> {
    try {
      if (this.connectionStatus !== 'connected') {
        await this.connect();
      }
      
      if (!mongoose.connection.db) {
        console.error('データベース接続が確立されていません');
        return -1;
      }
      
      const count = await mongoose.connection.db.collection(collectionName).countDocuments();
      return count;
    } catch (error) {
      console.error(`${collectionName}のドキュメント数取得エラー:`, error);
      return -1;
    }
  }
}