import mongoose from 'mongoose';
import { DailyFortuneUpdateLog, IDailyFortuneUpdateLogDocument } from '../../models/DailyFortuneUpdateLog';

describe('DailyFortuneUpdateLog Model', () => {
  // グローバルなsetup.tsがMongoose接続を担当するため、接続処理は不要

  beforeEach(async () => {
    // テスト実行前にコレクションをクリア
    await DailyFortuneUpdateLog.deleteMany({});
  });

  /**
   * 有効なデータで更新ログを作成するヘルパー関数
   */
  const createValidUpdateLog = () => {
    const creatorId = new mongoose.Types.ObjectId();
    
    return {
      date: new Date(),
      status: 'running',
      startTime: new Date(),
      totalUsers: 100,
      successCount: 0,
      failedCount: 0,
      isAutomaticRetry: false,
      createdBy: creatorId
    };
  };

  /**
   * 更新ログを保存するヘルパー関数
   */
  const saveUpdateLog = async (data: any): Promise<IDailyFortuneUpdateLogDocument> => {
    const updateLog = new DailyFortuneUpdateLog(data);
    return await updateLog.save();
  };

  it('必須フィールドを指定して有効な運勢更新ログを保存できること', async () => {
    const validData = createValidUpdateLog();
    const savedLog = await saveUpdateLog(validData);

    // データが正しく保存されたか検証
    expect(savedLog._id).toBeDefined();
    expect(savedLog.date).toEqual(validData.date);
    expect(savedLog.status).toEqual(validData.status);
    expect(savedLog.startTime).toEqual(validData.startTime);
    expect(savedLog.totalUsers).toEqual(validData.totalUsers);
    expect(savedLog.createdBy).toEqual(validData.createdBy);
    expect(savedLog.createdAt).toBeDefined();
    expect(savedLog.updatedAt).toBeDefined();
  });

  it('必須フィールドが欠けていると保存に失敗すること', async () => {
    // dateフィールドを省略
    const invalidData = { ...createValidUpdateLog() } as any;
    invalidData.date = undefined;

    await expect(saveUpdateLog(invalidData)).rejects.toThrow();

    // statusフィールドを省略
    const invalidData2 = { ...createValidUpdateLog() } as any;
    invalidData2.status = undefined;

    await expect(saveUpdateLog(invalidData2)).rejects.toThrow();

    // startTimeフィールドを省略
    const invalidData3 = { ...createValidUpdateLog() } as any;
    invalidData3.startTime = undefined;

    await expect(saveUpdateLog(invalidData3)).rejects.toThrow();

    // totalUsersフィールドを省略
    const invalidData4 = { ...createValidUpdateLog() } as any;
    invalidData4.totalUsers = undefined;

    await expect(saveUpdateLog(invalidData4)).rejects.toThrow();

    // createdByフィールドを省略
    const invalidData5 = { ...createValidUpdateLog() } as any;
    invalidData5.createdBy = undefined;

    await expect(saveUpdateLog(invalidData5)).rejects.toThrow();
  });

  it('不正な値のフィールドがあると保存に失敗すること', async () => {
    // 不正なステータス
    const invalidData = createValidUpdateLog() as any;
    invalidData.status = 'invalid_status';

    await expect(saveUpdateLog(invalidData)).rejects.toThrow();

    // 負の totalUsers
    const invalidData2 = createValidUpdateLog();
    invalidData2.totalUsers = -1;

    await expect(saveUpdateLog(invalidData2)).rejects.toThrow();

    // 負の successCount
    const invalidData3 = createValidUpdateLog();
    invalidData3.successCount = -1;

    await expect(saveUpdateLog(invalidData3)).rejects.toThrow();

    // 負の failedCount
    const invalidData4 = createValidUpdateLog();
    invalidData4.failedCount = -1;

    await expect(saveUpdateLog(invalidData4)).rejects.toThrow();

    // 負の retryCount
    const invalidData5 = createValidUpdateLog() as any;
    invalidData5.retryCount = -1;

    await expect(saveUpdateLog(invalidData5)).rejects.toThrow();
  });

  it('エラー情報を含むログを保存できること', async () => {
    const validData = createValidUpdateLog() as any;
    validData.status = 'failed';
    validData.updateErrors = [
      {
        userId: new mongoose.Types.ObjectId(),
        message: 'テストエラーメッセージ',
        stack: 'テストスタックトレース'
      },
      {
        message: 'ユーザーIDなしのエラーメッセージ'
      }
    ];

    const savedLog = await saveUpdateLog(validData);

    // エラー情報が正しく保存されたか検証
    expect(savedLog.updateErrors).toHaveLength(2);
    expect(savedLog.updateErrors![0].message).toEqual('テストエラーメッセージ');
    expect(savedLog.updateErrors![0].stack).toEqual('テストスタックトレース');
    expect(savedLog.updateErrors![1].message).toEqual('ユーザーIDなしのエラーメッセージ');
    expect(savedLog.updateErrors![1].userId).toBeUndefined();
  });

  it('仮想フィールドが正しく計算されること', async () => {
    // 完了したログの仮想フィールドをテスト
    const completedLog = createValidUpdateLog() as any;
    completedLog.status = 'completed';
    completedLog.startTime = new Date('2025-04-07T03:00:00Z');
    completedLog.endTime = new Date('2025-04-07T03:05:30Z'); // 5分30秒 = 330000ms
    completedLog.totalUsers = 100;
    completedLog.successCount = 95;
    completedLog.failedCount = 5;

    const savedCompletedLog = await saveUpdateLog(completedLog);

    expect(savedCompletedLog.processingTimeMs).toEqual(330000); // 5分30秒のミリ秒
    expect(savedCompletedLog.successRate).toEqual(95); // 95%の成功率
  });

  it('ヘルパーメソッドが正しく動作すること', async () => {
    // 実行中ステータスのテスト
    const runningLog = await saveUpdateLog(createValidUpdateLog());
    expect(runningLog.isRunning()).toBe(true);

    const scheduledLog = await saveUpdateLog({
      ...createValidUpdateLog(),
      status: 'scheduled'
    });
    expect(scheduledLog.isRunning()).toBe(true);

    const completedLog = await saveUpdateLog({
      ...createValidUpdateLog(),
      status: 'completed'
    });
    expect(completedLog.isRunning()).toBe(false);

    // 失敗ステータスのテスト
    const failedLog = await saveUpdateLog({
      ...createValidUpdateLog(),
      status: 'failed'
    });
    expect(failedLog.hasFailed()).toBe(true);

    const partialFailureLog = await saveUpdateLog({
      ...createValidUpdateLog(),
      status: 'completed',
      totalUsers: 100,
      successCount: 90,
      failedCount: 10
    });
    expect(partialFailureLog.hasFailed()).toBe(true);

    const successLog = await saveUpdateLog({
      ...createValidUpdateLog(),
      status: 'completed',
      totalUsers: 100,
      successCount: 100,
      failedCount: 0
    });
    expect(successLog.hasFailed()).toBe(false);
  });
});