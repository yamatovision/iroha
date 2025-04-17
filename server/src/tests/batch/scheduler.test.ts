/**
 * バッチ処理スケジューラーのテスト
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { BatchJobLog } from '../../models/BatchJobLog';
import { startScheduler, stopScheduler } from '../../batch/scheduler';

describe('バッチスケジューラー', () => {
  let mongoServer: MongoMemoryServer;

  // テスト開始前にインメモリMongoDBサーバーを起動
  beforeAll(async () => {
    // 既存の接続を閉じる
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // 新しい接続を作成
    await mongoose.connect(uri, {
      dbName: 'test-db'
    });
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
  it('スケジューラーを開始・停止できること', async () => {
    // 元のログ関数を保存
    const originalLog = console.log;
    const logMessages: string[] = [];
    
    // ログ出力を一時的に記録する関数に置き換え
    console.log = function(...args: any[]) {
      logMessages.push(args.join(' '));
      originalLog.apply(console, args);
    };
    
    try {
      // スケジューラーを起動
      startScheduler();
      
      // スケジューラーが正常に起動したことを確認
      expect(logMessages.some(msg => msg.includes('バッチ処理スケジューラーを開始します'))).toBe(true);
      expect(logMessages.some(msg => msg.includes('バッチ処理スケジューラーの設定が完了しました'))).toBe(true);
      
      // スケジューラーが日柱生成ジョブをロードしたことを確認
      expect(logMessages.some(msg => msg.includes('day-pillar-generator'))).toBe(true);
      
      // スケジューラーを停止
      stopScheduler();
      
      // スケジューラーが正常に停止したことを確認
      expect(logMessages.some(msg => msg.includes('バッチ処理スケジューラーを停止しました'))).toBe(true);
      
    } finally {
      // 元のログ関数を復元
      console.log = originalLog;
    }
  });

  // 実際のスケジューラー状態のテスト
  it('スケジューラーの状態を確認できること', async () => {
    // スケジューラーを起動
    startScheduler();
    
    // スケジューラーのログ出力は検証困難なので、
    // スケジューラーが正常に開始・停止できることだけを確認
    expect(typeof startScheduler).toBe('function');
    expect(typeof stopScheduler).toBe('function');
    
    // 少なくとも1つのジョブがスケジュールされていることを確認
    const cron = require('node-cron');
    const tasks = cron.getTasks();
    expect(tasks.size).toBeGreaterThan(0);
    
    // スケジューラーを停止
    stopScheduler();
    
    // 停止後にはタスクがなくなっていることを確認
    expect(cron.getTasks().size).toBe(0);
  });
});