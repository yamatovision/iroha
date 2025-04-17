import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import { DailyFortuneUpdateLog } from '../../models/DailyFortuneUpdateLog';
import { User } from '../../models/User';

// Firebase認証のモック
jest.mock('../../config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-super-admin-id',
      email: 'superadmin@example.com',
      role: 'SuperAdmin'
    })
  }
}));

// テスト用アプリケーション
const app = express();
app.use(express.json());

describe('管理者API単体テスト', () => {
  // テスト前のリセット
  beforeEach(async () => {
    // コレクションのクリア
    if (mongoose.connection.readyState === 1) {
      for (const collection of Object.values(mongoose.connection.collections)) {
        await collection.deleteMany({});
      }
    }
  });

  describe('ユーザー管理テスト', () => {
    it('ユーザーオブジェクトが正しく作成できること', async () => {
      // テスト用ユーザーを作成
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'Test User',
        role: 'User' as const,
        plan: 'lite' as const,
        organizationId: new mongoose.Types.ObjectId(),
        teamId: new mongoose.Types.ObjectId(),
        isActive: true
      };

      const user = new User(userData);
      await user.save();

      // データベースから取得して検証
      const savedUser = await User.findOne({ email: 'test@example.com' });
      expect(savedUser).not.toBeNull();
      expect(savedUser?.email).toBe(userData.email);
      expect(savedUser?.displayName).toBe(userData.displayName);
      expect(savedUser?.role).toBe(userData.role);
      expect(savedUser?.plan).toBe(userData.plan);
      expect(savedUser?.organizationId).toEqual(userData.organizationId);
      expect(savedUser?.teamId).toEqual(userData.teamId);
    });

    it('不正なロールを持つユーザーオブジェクトは保存に失敗すること', async () => {
      // 不正な値を持つユーザーを作成
      const userData = {
        email: 'invalid@example.com',
        password: 'Password123!',
        displayName: 'Invalid User',
        role: 'InvalidRole', // 不正な値
        plan: 'lite' as const,
        organizationId: new mongoose.Types.ObjectId(),
        teamId: new mongoose.Types.ObjectId(),
        isActive: true
      };

      const user = new User(userData);
      
      // バリデーションエラーが発生することを期待
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('運勢更新ログテスト', () => {
    it('運勢更新ログが正しく作成できること', async () => {
      // 運勢更新ログを作成
      const logData = {
        date: new Date(),
        status: 'completed' as const,
        startTime: new Date(),
        endTime: new Date(Date.now() + 5 * 60 * 1000), // 5分後
        totalUsers: 100,
        successCount: 95,
        failedCount: 5,
        isAutomaticRetry: false,
        createdBy: new mongoose.Types.ObjectId()
      };

      const log = new DailyFortuneUpdateLog(logData);
      await log.save();

      // データベースから取得して検証
      const savedLog = await DailyFortuneUpdateLog.findOne({ status: 'completed' });
      expect(savedLog).not.toBeNull();
      expect(savedLog?.totalUsers).toBe(logData.totalUsers);
      expect(savedLog?.successCount).toBe(logData.successCount);
      expect(savedLog?.failedCount).toBe(logData.failedCount);
      
      // 仮想フィールドのテスト
      expect(savedLog?.successRate).toBe(95); // 95%の成功率
      
      // メソッドのテスト
      expect(savedLog?.isRunning()).toBe(false);
      expect(savedLog?.hasFailed()).toBe(true); // 失敗があるのでtrue
    });

    it('不正なステータスの運勢更新ログは保存に失敗すること', async () => {
      // 不正な値を持つログを作成
      const logData = {
        date: new Date(),
        status: 'invalid_status' as any, // 不正な値
        startTime: new Date(),
        totalUsers: 100,
        successCount: 0,
        failedCount: 0,
        isAutomaticRetry: false,
        createdBy: new mongoose.Types.ObjectId()
      };

      const log = new DailyFortuneUpdateLog(logData);
      
      // バリデーションエラーが発生することを期待
      await expect(log.save()).rejects.toThrow();
    });
  });
});