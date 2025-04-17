// @ts-nocheck - Test file with test doubles
import mongoose, { Types } from 'mongoose';
import { MongoDBConnector } from '../utils/test-helpers';
import { DailyFortune } from '../../models/DailyFortune';
import { User } from '../../models/User';
import { DayPillar } from '../../models/DayPillar';
import { FortuneService } from '../../services/fortune.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 環境変数の読み込み
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

// タイムアウト設定
jest.setTimeout(60000); // 60秒

describe('FortuneService Daily Flow Tests', () => {
  let mongoConnector: MongoDBConnector;
  let fortuneService: FortuneService;
  let testUser: any;
  let testDayPillar: any;
  
  beforeAll(async () => {
    console.log('MongoDB接続を開始します...');
    
    // MongoDB接続
    mongoConnector = new MongoDBConnector();
    await mongoConnector.connect();
    
    console.log('MongoDB接続成功');
    
    // サービスのインスタンス化
    fortuneService = new FortuneService();
  });
  
  afterAll(async () => {
    try {
      // MongoDB接続を閉じる
      await mongoConnector.disconnect();
      console.log('MongoDBとの接続を閉じました');
    } catch (error) {
      console.error('クリーンアップ中にエラーが発生しました:', error);
    }
  });
  
  beforeEach(async () => {
    // テストの前にテストデータを作成
    try {
      console.log('テストデータ作成中...');
      
      // 既存データの削除
      await DailyFortune.deleteMany({});
      
      // 今日の日付を取得
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // テスト用の日柱データを取得または作成
      testDayPillar = await DayPillar.findOne({ date: today });
      if (!testDayPillar) {
        testDayPillar = await DayPillar.create({
          date: today,
          heavenlyStem: '甲',
          earthlyBranch: '寅',
          hiddenStems: ['乙', '丙'],
          energyDescription: '木の気が強く、創造性と成長のエネルギーがあります。'
        });
      }
      
      // テストユーザーを取得または作成
      testUser = await User.findOne({ email: 'test-fortune-flow@example.com' });
      if (!testUser) {
        testUser = await User.create({
          _id: new Types.ObjectId(),
          uid: 'test-fortune-flow-uid',
          email: 'test-fortune-flow@example.com',
          password: 'password12345',
          displayName: 'Fortune Flow Test User',
          role: 'User',
          plan: 'lite',
          isActive: true,
          organizationId: new Types.ObjectId(),
          elementAttribute: 'water',
          fourPillars: {
            year: { heavenlyStem: '庚', earthlyBranch: '子' },
            month: { heavenlyStem: '辛', earthlyBranch: '丑' },
            day: { heavenlyStem: '壬', earthlyBranch: '寅' },
            hour: { heavenlyStem: '癸', earthlyBranch: '卯' }
          },
          elementProfile: {
            wood: 20,
            fire: 15,
            earth: 25,
            metal: 20,
            water: 20
          }
        });
      }
      
      console.log('テストデータ作成完了');
      console.log('テストユーザーID:', testUser._id.toString());
    } catch (error) {
      console.error('テストデータ作成中にエラーが発生しました:', error);
      throw error;
    }
  });
  
  describe('ユーザー運勢生成フロー', () => {
    it('getUserFortune - 運勢データが存在しない場合は生成して返すこと', async () => {
      // 既存データが削除されていることを確認
      const existingFortune = await DailyFortune.findOne({
        userId: testUser._id
      });
      expect(existingFortune).toBeNull();
      
      try {
        // getUserFortuneメソッドを実行（存在しない場合は生成）
        const result = await fortuneService.getUserFortune(testUser._id.toString());
        
        // 結果の検証
        expect(result).toBeDefined();
        expect(result.userId.toString()).toBe(testUser._id.toString());
        expect(result.fortuneScore).toBeDefined();
        expect(result.fortuneScore).toBeGreaterThanOrEqual(0);
        expect(result.fortuneScore).toBeLessThanOrEqual(100);
        expect(result.advice).toBeDefined();
        expect(result.advice.length).toBeGreaterThan(0);
        expect(result.luckyItems).toBeDefined();
        expect(result.luckyItems.color).toBeDefined();
        expect(result.luckyItems.item).toBeDefined();
        expect(result.luckyItems.drink).toBeDefined();
        
        // 保存されたデータの検証
        const savedFortune = await DailyFortune.findOne({
          userId: testUser._id
        });
        expect(savedFortune).toBeDefined();
        expect(savedFortune.fortuneScore).toBe(result.fortuneScore);
      } catch (error) {
        console.error('テスト実行エラー:', error);
        throw error;
      }
    });
    
    it('getUserFortune - 既存の運勢データがある場合はそれを返すこと', async () => {
      try {
        // 1回目の呼び出しで運勢を生成
        const firstResult = await fortuneService.getUserFortune(testUser._id.toString());
        expect(firstResult).toBeDefined();
        
        // 保存時刻を記録
        const firstCreatedAt = firstResult.createdAt;
        
        // 少し待機
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 2回目の呼び出し
        const secondResult = await fortuneService.getUserFortune(testUser._id.toString());
        
        // 同じデータが返されることを検証
        expect(secondResult).toBeDefined();
        expect(secondResult.userId.toString()).toBe(testUser._id.toString());
        expect(secondResult.fortuneScore).toBe(firstResult.fortuneScore);
        expect(secondResult.advice).toBe(firstResult.advice);
        expect(secondResult.createdAt).toEqual(firstCreatedAt);
      } catch (error) {
        console.error('テスト実行エラー:', error);
        throw error;
      }
    });
    
    it('generateFortune - 運勢を手動更新できること', async () => {
      try {
        // まず既存の運勢を取得
        const initialFortune = await fortuneService.getUserFortune(testUser._id.toString());
        expect(initialFortune).toBeDefined();
        
        // 少し待機
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 運勢を更新（強制的に上書き）
        const updatedFortune = await fortuneService.generateFortune(testUser._id.toString(), new Date(), true);
        
        // 結果の検証
        expect(updatedFortune).toBeDefined();
        expect(updatedFortune.userId.toString()).toBe(testUser._id.toString());
        expect(updatedFortune.updatedAt).not.toEqual(initialFortune.updatedAt);
        
        // fortuneScoreが数値であることを確認
        expect(typeof updatedFortune.fortuneScore).toBe('number');
      } catch (error) {
        console.error('テスト実行エラー:', error);
        throw error;
      }
    });
    
    it('FortuneScoreResult型で拡張情報を返すこと', async () => {
      try {
        // 運勢を更新（強制的に上書き）
        const updatedFortune = await fortuneService.generateFortune(testUser._id.toString(), new Date(), true);
        expect(updatedFortune).toBeDefined();
        
        // データベースから運勢を取得して検証
        const dbFortune = await DailyFortune.findOne({ userId: testUser._id });
        expect(dbFortune).toBeDefined();
        expect(typeof dbFortune.fortuneScore).toBe('number');
        expect(dbFortune.fortuneScore).toBeGreaterThanOrEqual(0);
        expect(dbFortune.fortuneScore).toBeLessThanOrEqual(100);
      } catch (error) {
        console.error('テスト実行エラー:', error);
        throw error;
      }
    });
    
    it('ラッキーアイテムを生成すること', async () => {
      try {
        // 運勢を更新（強制的に上書き）
        const updatedFortune = await fortuneService.generateFortune(testUser._id.toString(), new Date(), true);
        expect(updatedFortune).toBeDefined();
        
        // ラッキーアイテムの検証
        expect(updatedFortune.luckyItems).toBeDefined();
        expect(updatedFortune.luckyItems.color).toBeDefined();
        expect(updatedFortune.luckyItems.color.length).toBeGreaterThan(0);
        expect(updatedFortune.luckyItems.item).toBeDefined();
        expect(updatedFortune.luckyItems.item.length).toBeGreaterThan(0);
        expect(updatedFortune.luckyItems.drink).toBeDefined();
        expect(updatedFortune.luckyItems.drink.length).toBeGreaterThan(0);
      } catch (error) {
        console.error('テスト実行エラー:', error);
        throw error;
      }
    });
  });
});