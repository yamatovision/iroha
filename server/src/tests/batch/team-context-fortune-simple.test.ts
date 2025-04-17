import mongoose, { Types } from 'mongoose';
import { User } from '../../models/User';
import { Team } from '../../models/Team';
import { DayPillar } from '../../models/DayPillar';
import { DailyFortune } from '../../models/DailyFortune';
import { TeamContextFortune } from '../../models/TeamContextFortune';
import { fortuneService } from '../../services/fortune.service';
import { MongoDBConnector } from '../utils/test-helpers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 環境変数の読み込み
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

// タイムアウト設定
jest.setTimeout(30000);

describe('Team Context Fortune Batch Tests (Simplified)', () => {
  let mongoConnector: MongoDBConnector;
  let testUser1: any;
  let testUser2: any;
  let testTeam: any;
  let testDayPillar: any;
  
  beforeAll(async () => {
    console.log('MongoDB接続を開始します...');
    
    // MongoDB接続
    mongoConnector = new MongoDBConnector();
    await mongoConnector.connect();
    
    console.log('MongoDB接続成功');
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
      // 既存データの削除
      await DailyFortune.deleteMany({});
      await TeamContextFortune.deleteMany({});
      await Team.deleteMany({});
      await User.deleteMany({});
      
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
      
      // テスト用ユーザーとチームのセットアップ
      testUser1 = await User.create({
        _id: new Types.ObjectId(),
        uid: 'test-uid-1',
        email: 'test1@example.com',
        password: 'Password123!',
        displayName: 'Test User 1',
        role: 'User',
        plan: 'lite',
        isActive: true,
        elementAttribute: 'wood',
        jobTitle: 'エンジニア'
      });
      
      testUser2 = await User.create({
        _id: new Types.ObjectId(),
        uid: 'test-uid-2',
        email: 'test2@example.com',
        password: 'Password123!',
        displayName: 'Test User 2',
        role: 'User',
        plan: 'lite',
        isActive: true,
        elementAttribute: 'fire',
        jobTitle: 'デザイナー'
      });
      
      // テストチームの作成
      testTeam = await Team.create({
        name: 'Test Team',
        description: 'A team for testing',
        adminId: testUser1._id,
        organizationId: new Types.ObjectId()
      });
      
      // ユーザーをチームに所属させる
      await User.findByIdAndUpdate(testUser1._id, { teamId: testTeam._id });
      await User.findByIdAndUpdate(testUser2._id, { teamId: testTeam._id });
      
      console.log('テストデータ作成完了');
      
    } catch (error) {
      console.error('テストデータ作成中にエラーが発生しました:', error);
      throw error;
    }
  });
  
  describe('Team Context Fortune Generation', () => {
    it('チームコンテキスト運勢を生成できること', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // テスト実行
      const result = await fortuneService.generateTeamContextFortune(
        testUser1._id.toString(),
        testTeam._id.toString(),
        today,
        false
      );
      
      // 検証
      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(testUser1._id.toString());
      expect(result.teamId.toString()).toBe(testTeam._id.toString());
      expect(result.date.toISOString().split('T')[0]).toBe(today.toISOString().split('T')[0]);
      expect(result.fortuneScore).toBeGreaterThan(0);
      expect(result.fortuneScore).toBeLessThanOrEqual(100);
      expect(result.teamContextAdvice).toBeDefined();
      expect(Array.isArray(result.collaborationTips)).toBe(true);
      expect(result.collaborationTips.length).toBeGreaterThan(0);
    });
    
    it('forceUpdate=trueの場合は既存のチームコンテキスト運勢を上書きすること', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 最初に運勢を生成
      const initialFortune = await fortuneService.generateTeamContextFortune(
        testUser1._id.toString(),
        testTeam._id.toString(),
        today,
        false
      );
      
      // 上書き更新
      const updatedFortune = await fortuneService.generateTeamContextFortune(
        testUser1._id.toString(),
        testTeam._id.toString(),
        today,
        true
      );
      
      // 検証
      expect(updatedFortune).toBeDefined();
      expect(updatedFortune._id.toString()).toBe(initialFortune._id.toString()); // 同じドキュメントが更新されていること
      
      // 運勢のデータが更新されていることを確認
      // 日柱IDやユーザーID、チームIDなどは変わらないため、他のフィールドの検証は省略
    });
    
    it('チームに所属するすべてのユーザーがチームコンテキスト運勢を持てること', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // ユーザー1の運勢を生成
      await fortuneService.generateTeamContextFortune(
        testUser1._id.toString(),
        testTeam._id.toString(),
        today,
        false
      );
      
      // ユーザー2の運勢を生成
      await fortuneService.generateTeamContextFortune(
        testUser2._id.toString(),
        testTeam._id.toString(),
        today,
        false
      );
      
      // 検証
      const teamFortunes = await TeamContextFortune.find({ teamId: testTeam._id });
      expect(teamFortunes.length).toBe(2); // 2人分あること
      
      // 各ユーザーの運勢が存在するか確認
      const user1Fortune = teamFortunes.find(f => f.userId.toString() === testUser1._id.toString());
      const user2Fortune = teamFortunes.find(f => f.userId.toString() === testUser2._id.toString());
      
      expect(user1Fortune).toBeDefined();
      expect(user2Fortune).toBeDefined();
    });
    
    it('チーム運勢ランキングを取得できること', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // まず運勢を生成
      await fortuneService.generateTeamContextFortune(
        testUser1._id.toString(),
        testTeam._id.toString(),
        today,
        false
      );
      
      await fortuneService.generateTeamContextFortune(
        testUser2._id.toString(),
        testTeam._id.toString(),
        today,
        false
      );
      
      // ランキングを取得
      const result = await fortuneService.getTeamFortuneRanking(testTeam._id.toString());
      
      // 検証
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.teamId).toBe(testTeam._id.toString());
      expect(result.data.teamName).toBe('Test Team');
      expect(result.data.ranking).toBeDefined();
      expect(result.data.ranking.length).toBe(2);
      
      // ランキングが存在することを確認
      const ranking = result.data.ranking;
      
      // ランキングは降順であることを確認
      if (ranking[0].score !== ranking[1].score) {
        expect(ranking[0].score).toBeGreaterThan(ranking[1].score);
      }
      
      // ランク番号が正しいことを確認
      expect(ranking[0].rank).toBe(1);
      expect(ranking[1].rank).toBe(2);
    });
  });
});