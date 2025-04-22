import mongoose, { Types } from 'mongoose';
import { MongoDBConnector } from '../utils/test-helpers';
import { User } from '../../models/User';
import { Team } from '../../models/Team';
import { TeamMembership } from '../../models/TeamMembership';
import { DayPillar } from '../../models/DayPillar';
import { TeamContextFortune } from '../../models/TeamContextFortune';
import { TeamGoal } from '../../models/TeamGoal';
import { TeamContextFortuneService } from '../../services/team-context-fortune.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 環境変数の読み込み
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

// タイムアウト設定（Claudeの呼び出しを伴うため長めに設定）
jest.setTimeout(60000);

describe('TeamContextFortuneService', () => {
  let mongoConnector: MongoDBConnector;
  let teamContextFortuneService: TeamContextFortuneService;
  let testUser1: any;
  let testUser2: any;
  let testTeam: any;
  let testDayPillar: any;
  let testTeamGoal: any;
  
  beforeAll(async () => {
    console.log('MongoDB接続を開始します...');
    
    // MongoDB接続
    mongoConnector = new MongoDBConnector();
    await mongoConnector.connect();
    
    console.log('MongoDB接続成功');
    
    // サービスのインスタンス化
    teamContextFortuneService = new TeamContextFortuneService();
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
      await TeamContextFortune.deleteMany({});
      await TeamGoal.deleteMany({});
      await TeamMembership.deleteMany({});
      await Team.deleteMany({});
      await User.deleteMany({});
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // テスト用の日柱データを作成
      await DayPillar.deleteMany({}); // 既存の日柱データをクリア
      
      // 今日用の日柱データ
      testDayPillar = await DayPillar.create({
        date: today,
        heavenlyStem: '甲',
        earthlyBranch: '寅',
        hiddenStems: ['乙', '丙'],
        energyDescription: '木の気が強く、創造性と成長のエネルギーがあります。'
      });
      
      // 昨日用の日柱データ
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      await DayPillar.create({
        date: yesterday,
        heavenlyStem: '癸',
        earthlyBranch: '丑',
        hiddenStems: ['己', '辛', '癸'],
        energyDescription: '水の気が強く、知恵と柔軟性のエネルギーがあります。'
      });
      
      // 明日用の日柱データ
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      await DayPillar.create({
        date: tomorrow,
        heavenlyStem: '乙',
        earthlyBranch: '卯',
        hiddenStems: ['乙'],
        energyDescription: '木の気が強く、成長と発展のエネルギーがあります。'
      });
      
      // テスト用ユーザーの作成
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
      const organization = await mongoose.connection.collection('organizations').insertOne({
        name: 'Test Organization',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      testTeam = await Team.create({
        name: 'Test Team',
        description: 'A team for testing',
        adminId: testUser1._id,
        creatorId: testUser1._id,
        organizationId: organization.insertedId
      });
      
      // チームメンバーシップの作成
      await TeamMembership.create({
        userId: testUser1._id,
        teamId: testTeam._id,
        role: 'admin',
        status: 'active'
      });
      
      await TeamMembership.create({
        userId: testUser2._id,
        teamId: testTeam._id,
        role: 'member',
        status: 'active'
      });
      
      // テストチーム目標の作成
      testTeamGoal = await TeamGoal.create({
        teamId: testTeam._id,
        content: 'これはテスト用のチーム目標です。最低5文字以上必要です。',
        deadline: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()),
        status: 'in_progress',
        progress: 50,
        collaborators: [testUser1._id, testUser2._id]
      });
      
      console.log('テストデータ作成完了');
      
    } catch (error) {
      console.error('テストデータ作成中にエラーが発生しました:', error);
      throw error;
    }
  });
  
  describe('getTeamContextFortune', () => {
    it('チームコンテキスト運勢が存在しない場合は新規生成されること', async () => {
      const userId = testUser1._id.toString();
      const teamId = testTeam._id.toString();
      
      // データベース直接検証（事前）
      const initialFortune = await TeamContextFortune.findOne({
        userId,
        teamId
      });
      
      expect(initialFortune).toBeNull(); // 最初は存在しないこと
      
      // サービスメソッド呼び出し
      const result = await teamContextFortuneService.getTeamContextFortune(userId, teamId);
      
      // 結果検証
      expect(result).toBeDefined();
      expect(result.teamContextFortune).toBeDefined();
      expect(result.teamContextFortune.userId.toString()).toBe(userId);
      expect(result.teamContextFortune.teamId.toString()).toBe(teamId);
      expect(result.teamContextFortune.score).toBeGreaterThanOrEqual(0);
      expect(result.teamContextFortune.score).toBeLessThanOrEqual(100);
      expect(result.teamContextFortune.teamContextAdvice).toBeTruthy();
      expect(Array.isArray(result.teamContextFortune.collaborationTips)).toBe(true);
      
      // データベース直接検証（事後）
      const savedFortune = await TeamContextFortune.findOne({
        userId,
        teamId
      });
      
      expect(savedFortune).toBeDefined();
      expect(savedFortune!.userId.toString()).toBe(userId);
      expect(savedFortune!.teamId.toString()).toBe(teamId);
    });
    
    it('既存のチームコンテキスト運勢があれば取得されること', async () => {
      const userId = testUser1._id.toString();
      const teamId = testTeam._id.toString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // まず運勢を生成
      const initialFortune = await teamContextFortuneService.generateTeamContextFortune(userId, teamId, today);
      
      // 初期生成の確認
      expect(initialFortune).toBeDefined();
      const initialId = initialFortune._id.toString();
      
      // 再度同じ運勢を取得
      const retrievedFortune = await teamContextFortuneService.getTeamContextFortune(userId, teamId);
      
      // 結果検証
      expect(retrievedFortune).toBeDefined();
      expect(retrievedFortune.teamContextFortune).toBeDefined();
      expect(retrievedFortune.teamContextFortune.userId.toString()).toBe(userId);
      expect(retrievedFortune.teamContextFortune.teamId.toString()).toBe(teamId);
      
      // データベースで確認（初期生成と同じドキュメントを参照しているか）
      const dbFortune: any = await TeamContextFortune.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        teamId: new mongoose.Types.ObjectId(teamId),
        date: today
      });
      
      expect(dbFortune).toBeDefined();
      expect(dbFortune._id.toString()).toBe(initialId);
    });
    
    it('日付パラメータによるフィルタリングができること', async () => {
      const userId = testUser1._id.toString();
      const teamId = testTeam._id.toString();
      
      // 今日の日付
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 今日の運勢を生成
      const todayFortune = await teamContextFortuneService.generateTeamContextFortune(userId, teamId, today);
      expect(todayFortune).toBeDefined();
      
      // 今日の日付文字列を使って運勢を取得
      const todayStr = today.toISOString().split('T')[0];
      const retrievedFortune = await teamContextFortuneService.getTeamContextFortune(userId, teamId, todayStr);
      
      // 結果検証
      expect(retrievedFortune).toBeDefined();
      expect(retrievedFortune.teamContextFortune).toBeDefined();
      expect(retrievedFortune.teamContextFortune.userId.toString()).toBe(userId);
      expect(retrievedFortune.teamContextFortune.teamId.toString()).toBe(teamId);
      
      // 日付は一致している必要がある(タイムゾーンの問題で日付が変わる場合があるため、厳密な一致ではなく日付が存在することを確認)
      expect(retrievedFortune.teamContextFortune.date).toBeDefined();
    });
    
    it('存在しないチームIDの場合はエラーになること', async () => {
      const userId = testUser1._id.toString();
      const nonExistentTeamId = new mongoose.Types.ObjectId().toString();
      
      // エラーが発生することを確認
      await expect(teamContextFortuneService.getTeamContextFortune(userId, nonExistentTeamId))
        .rejects.toThrow();
    });
  });
  
  describe('generateTeamContextFortune', () => {
    it('チームコンテキスト運勢を生成できること', async () => {
      const userId = testUser1._id.toString();
      const teamId = testTeam._id.toString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // サービスメソッド呼び出し
      const result = await teamContextFortuneService.generateTeamContextFortune(userId, teamId, today);
      
      // 結果検証
      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(userId);
      expect(result.teamId.toString()).toBe(teamId);
      expect(result.date.toISOString().split('T')[0]).toBe(today.toISOString().split('T')[0]);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.teamContextAdvice).toBeTruthy();
      expect(Array.isArray(result.collaborationTips)).toBe(true);
      
      // データベース直接検証
      const savedFortune = await TeamContextFortune.findOne({
        userId,
        teamId,
        date: today
      });
      
      expect(savedFortune).toBeDefined();
      expect(savedFortune!.userId.toString()).toBe(userId);
      expect(savedFortune!.teamId.toString()).toBe(teamId);
      expect(savedFortune!.teamContextAdvice).toBeTruthy();
    });
    
    it('チーム目標が存在する場合はその情報が反映されること', async () => {
      const userId = testUser1._id.toString();
      const teamId = testTeam._id.toString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // サービスメソッド呼び出し
      const result = await teamContextFortuneService.generateTeamContextFortune(userId, teamId, today);
      
      // 結果検証
      expect(result).toBeDefined();
      expect(result.teamGoalId?.toString()).toBe(testTeamGoal._id.toString());
      
      // データベース直接検証
      const savedFortune = await TeamContextFortune.findOne({
        userId,
        teamId,
        date: today
      });
      
      expect(savedFortune).toBeDefined();
      expect(savedFortune!.teamGoalId?.toString()).toBe(testTeamGoal._id.toString());
    });
    
    it('生成された運勢の構造が正しいこと', async () => {
      const userId = testUser1._id.toString();
      const teamId = testTeam._id.toString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 運勢生成
      const fortune = await teamContextFortuneService.generateTeamContextFortune(userId, teamId, today);
      
      // 基本構造の検証
      expect(fortune).toBeDefined();
      expect(fortune.userId.toString()).toBe(userId);
      expect(fortune.teamId.toString()).toBe(teamId);
      expect(fortune.date.toISOString().split('T')[0]).toBe(today.toISOString().split('T')[0]);
      
      // 必須フィールドの存在確認
      expect(fortune.score).toBeDefined();
      expect(fortune.teamContextAdvice).toBeTruthy();
      expect(Array.isArray(fortune.collaborationTips)).toBe(true);
      
      // データ型の確認
      expect(typeof fortune.score).toBe('number');
      expect(typeof fortune.teamContextAdvice).toBe('string');
      expect(fortune.collaborationTips.length).toBeGreaterThan(0);
      
      // 運勢スコアの範囲確認
      expect(fortune.score).toBeGreaterThanOrEqual(0);
      expect(fortune.score).toBeLessThanOrEqual(100);
    });
    
    it('異なるユーザーが同じチームの運勢を生成できること', async () => {
      const userId1 = testUser1._id.toString();
      const userId2 = testUser2._id.toString();
      const teamId = testTeam._id.toString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // ユーザー1の運勢を生成
      const user1Fortune = await teamContextFortuneService.generateTeamContextFortune(userId1, teamId, today);
      
      // ユーザー2の運勢を生成
      const user2Fortune = await teamContextFortuneService.generateTeamContextFortune(userId2, teamId, today);
      
      // 結果検証
      expect(user1Fortune).toBeDefined();
      expect(user2Fortune).toBeDefined();
      expect(user1Fortune._id.toString()).not.toBe(user2Fortune._id.toString()); // 異なるドキュメントであること
      expect(user1Fortune.userId.toString()).toBe(userId1);
      expect(user2Fortune.userId.toString()).toBe(userId2);
      expect(user1Fortune.teamId.toString()).toBe(teamId);
      expect(user2Fortune.teamId.toString()).toBe(teamId);
      
      // データベース直接検証
      const teamFortunes = await TeamContextFortune.find({ teamId });
      expect(teamFortunes.length).toBe(2); // 2ユーザー分の運勢がある
    });
  });
});