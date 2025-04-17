/**
 * バッチ処理スケジューラーのテスト
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { BatchJobLog } from '../models/BatchJobLog';
import { startScheduler, stopScheduler } from './scheduler';

describe('バッチスケジューラー', () => {
  let mongoServer: MongoMemoryServer;

  // テスト開始前にインメモリMongoDBサーバーを起動
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  // 各テスト前にデータベースをクリーンアップ
  beforeEach(async () => {
    await BatchJobLog.deleteMany({});
  });

  // テスト後にスケジューラーを停止
  afterEach(() => {
    stopScheduler();
  });

  // テスト終了後にサーバーとコネクションを閉じる
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // スケジューラーの基本動作テスト
  it('スケジューラーを開始できること', async () => {
    // モック関数を作成
    const mockConsoleLog = jest.spyOn(console, 'log');
    
    // スケジューラーを起動
    startScheduler();
    
    // ログメッセージを確認
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('バッチ処理スケジューラーを開始します'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('バッチ処理スケジューラーの設定が完了しました'));
    
    // ジョブがスケジュールされているか確認
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('day-pillar-generator'));
    
    // スケジューラーを停止
    stopScheduler();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('バッチ処理スケジューラーを停止しました'));
    
    // モックをリセット
    mockConsoleLog.mockRestore();
  });

  // 無効化されたジョブのテスト
  it('無効化されたジョブはスケジュールされないこと', async () => {
    // モック関数を作成
    const mockConsoleLog = jest.spyOn(console, 'log');
    
    // スケジューラー内部のjobEnabledプロパティを一時的に上書き
    const originalModule = jest.requireActual('./scheduler');
    jest.mock('./scheduler', () => ({
      ...originalModule,
      schedules: [{
        expression: '0 0 * * *',
        jobName: 'test-disabled-job',
        enabled: false,
        job: jest.fn(),
        retryCount: 0,
        retryDelay: 0
      }]
    }));
    
    // スケジューラーを起動
    startScheduler();
    
    // 無効化されたジョブに関するログメッセージを確認
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('は無効化されています'));
    
    // スケジューラーを停止
    stopScheduler();
    
    // モックをリセット
    mockConsoleLog.mockRestore();
    jest.resetModules();
  });
});