/**
 * 日柱生成バッチ処理のテスト
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { generateDayPillars } from './day-pillar-generator';
import { DayPillar } from '../models/DayPillar';
import { BatchJobLog } from '../models/BatchJobLog';

describe('DayPillar生成バッチ処理', () => {
  let mongoServer: MongoMemoryServer;

  // テスト開始前にインメモリMongoDBサーバーを起動
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  // 各テスト前にデータベースをクリーンアップ
  beforeEach(async () => {
    await DayPillar.deleteMany({});
    await BatchJobLog.deleteMany({});
  });

  // テスト終了後にサーバーとコネクションを閉じる
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // 基本機能のテスト
  it('指定された日数分の日柱情報を生成できること', async () => {
    // 短い期間で実施（テスト実行時間短縮のため）
    const days = 3;
    const result = await generateDayPillars(days);

    // 成功フラグをチェック
    expect(result.success).toBe(true);
    
    // 正しい数の日柱が生成されたことを確認
    expect(result.created).toBe(days);
    expect(result.skipped).toBe(0);
    
    // データベースに保存されたことを確認
    const savedDayPillars = await DayPillar.find({}).sort({ date: 1 });
    expect(savedDayPillars.length).toBe(days);
    
    // バッチジョブログが作成されたことを確認
    const jobLogs = await BatchJobLog.find({});
    expect(jobLogs.length).toBe(1);
    expect(jobLogs[0].jobType).toBe('day-pillar-generator');
    expect(jobLogs[0].status).toBe('completed');
  });

  // 重複実行時のテスト
  it('既存のレコードがある場合はスキップすること', async () => {
    // 最初の実行
    await generateDayPillars(3);
    
    // 2回目の実行
    const result = await generateDayPillars(5);
    
    // 既存の3日分はスキップされ、新しい2日分だけ生成されるはず
    expect(result.created).toBe(2);
    expect(result.skipped).toBe(3);
    
    // 合計5日分のデータが存在するはず
    const savedDayPillars = await DayPillar.find({});
    expect(savedDayPillars.length).toBe(5);
    
    // 2つのバッチジョブログが作成されたことを確認
    const jobLogs = await BatchJobLog.find({});
    expect(jobLogs.length).toBe(2);
  });

  // エラーケースのテスト（サービス呼び出しでのエラー）
  it('サービスエラー時に適切なエラーハンドリングを行うこと', async () => {
    // DayPillarのsaveメソッドをモック化して強制的にエラーを発生させる
    jest.spyOn(mongoose.Model.prototype, 'save').mockImplementationOnce(() => {
      throw new Error('テスト用のエラー');
    });
    
    const result = await generateDayPillars(5);
    
    // 1つ目でエラーが発生するためその後は処理されない
    expect(result.success).toBe(false);
    expect(result.errors).toBeGreaterThan(0);
    
    // ジョブログにエラー状態が記録されていることを確認
    const jobLogs = await BatchJobLog.find({});
    expect(jobLogs.length).toBe(1);
    expect(jobLogs[0].status).toBe('failed');
  });
});