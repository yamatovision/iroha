import mongoose, { Types } from 'mongoose';
import { MongoDBConnector } from '../utils/test-helpers';
import { User } from '../../models/User';
import { Team } from '../../models/Team';
import { TeamMembership } from '../../models/TeamMembership';
import { DayPillar } from '../../models/DayPillar';
import { TeamContextFortune } from '../../models/TeamContextFortune';
import { TeamContextFortuneService } from '../../services/team-context-fortune.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 環境変数の読み込み
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

// タイムアウト設定（AIの呼び出しを伴うため長めに設定）
jest.setTimeout(120000);

describe('Team Context Fortune Batch Tests', () => {
  let mongoConnector: MongoDBConnector;
  let teamContextFortuneService: TeamContextFortuneService;
  let users: any[] = [];
  let teams: any[] = [];
  let testDayPillar: any;
  
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
      console.log('テストデータの準備を開始します...');
      
      // 既存データの削除
      await TeamContextFortune.deleteMany({});
      await TeamMembership.deleteMany({});
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
      
      // 複数のテストユーザーとチームを作成
      users = [];
      teams = [];
      
      // 2つのチームを作成
      for (let i = 0; i < 2; i++) {
        // 管理者ユーザーを作成
        const adminUser = await User.create({
          _id: new Types.ObjectId(),
          uid: `admin-uid-${i}`,
          email: `admin${i}@example.com`,
          password: 'Password123!',
          displayName: `Admin User ${i}`,
          role: 'User',
          plan: 'lite',
          isActive: true,
          elementAttribute: ['wood', 'fire', 'earth', 'metal', 'water'][i % 5],
          jobTitle: `管理者${i}`
        });
        
        users.push(adminUser);
        
        // 組織を作成
        const organization = await mongoose.connection.collection('organizations').insertOne({
          name: `Test Organization ${i}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // チームを作成
        const team = await Team.create({
          name: `Test Team ${i}`,
          description: `A team for testing ${i}`,
          adminId: adminUser._id,
          creatorId: adminUser._id,
          organizationId: organization.insertedId
        });
        
        teams.push(team);
        
        // 管理者をチームに所属させる
        await TeamMembership.create({
          userId: adminUser._id,
          teamId: team._id,
          role: 'admin',
          status: 'active'
        });
        
        // 各チームに2人のメンバーを追加
        for (let j = 0; j < 2; j++) {
          const memberUser = await User.create({
            _id: new Types.ObjectId(),
            uid: `member-uid-${i}-${j}`,
            email: `member${i}${j}@example.com`,
            password: 'Password123!',
            displayName: `Member User ${i}-${j}`,
            role: 'User',
            plan: 'lite',
            isActive: true,
            elementAttribute: ['wood', 'fire', 'earth', 'metal', 'water'][(i + j) % 5],
            jobTitle: `メンバー${j}`
          });
          
          users.push(memberUser);
          
          // メンバーをチームに所属させる
          await TeamMembership.create({
            userId: memberUser._id,
            teamId: team._id,
            role: 'member',
            status: 'active'
          });
        }
      }
      
      console.log(`テストデータ作成完了：${users.length}人のユーザーと${teams.length}個のチーム`);
      
    } catch (error) {
      console.error('テストデータ作成中にエラーが発生しました:', error);
      throw error;
    }
  });
  
  describe('チームコンテキスト運勢一括生成', () => {
    it('すべてのチームメンバーの運勢を一括生成できること', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 生成前のデータベース状態確認
      const initialFortuneCount = await TeamContextFortune.countDocuments();
      expect(initialFortuneCount).toBe(0);
      
      console.log('チームメンバーシップの取得...');
      // すべてのチームメンバーシップを取得
      const memberships = await TeamMembership.find().populate('userId teamId');
      expect(memberships.length).toBeGreaterThan(0);
      
      console.log(`${memberships.length}件のチームメンバーシップを処理します...`);
      
      // 各メンバーシップに対して運勢生成を実行
      for (const membership of memberships) {
        const userId = membership.userId._id.toString();
        const teamId = membership.teamId._id.toString();
        
        console.log(`ユーザーID: ${userId}、チームID: ${teamId}の運勢を生成中...`);
        
        // 運勢生成
        const fortune = await teamContextFortuneService.generateTeamContextFortune(
          userId,
          teamId,
          today
        );
        
        // 結果確認
        expect(fortune).toBeDefined();
        expect(fortune.userId.toString()).toBe(userId);
        expect(fortune.teamId.toString()).toBe(teamId);
        expect(fortune.teamContextAdvice).toBeTruthy();
      }
      
      // 生成後のデータベース状態確認
      const finalFortuneCount = await TeamContextFortune.countDocuments();
      
      // 期待される運勢数はメンバーシップの数と一致
      expect(finalFortuneCount).toBe(memberships.length);
      
      console.log(`${finalFortuneCount}件のチームコンテキスト運勢を生成しました`);
    });
    
    it('特定チーム内の全メンバーの運勢をまとめて生成できること', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const testTeam = teams[0]; // 1つ目のチームを使用
      
      // 当該チームのメンバーシップ取得
      const teamMemberships = await TeamMembership.find({ teamId: testTeam._id });
      const memberCount = teamMemberships.length;
      
      console.log(`チームID: ${testTeam._id}の${memberCount}人のメンバー運勢を生成します...`);
      
      // 各メンバーに対して運勢生成を実行
      for (const membership of teamMemberships) {
        const userId = membership.userId.toString();
        const teamId = testTeam._id.toString();
        
        // 運勢生成
        const fortune = await teamContextFortuneService.generateTeamContextFortune(
          userId,
          teamId,
          today
        );
        
        // 結果確認
        expect(fortune).toBeDefined();
        expect(fortune.userId.toString()).toBe(userId);
        expect(fortune.teamId.toString()).toBe(teamId);
      }
      
      // データベース直接検証
      const teamFortunes = await TeamContextFortune.find({ teamId: testTeam._id });
      expect(teamFortunes.length).toBe(memberCount);
      
      console.log(`${teamFortunes.length}件のチームコンテキスト運勢を生成しました`);
      
      // 各メンバーの運勢が存在することを確認
      for (const membership of teamMemberships) {
        const userId = membership.userId.toString();
        const userFortune = teamFortunes.find(f => f.userId.toString() === userId);
        expect(userFortune).toBeDefined();
      }
    });
    
    it('日付指定で過去と未来の運勢を生成できること', async () => {
      // 特定のユーザーとチームを選択
      const testUser = users[0];
      const testTeam = teams[0];
      
      // 日付設定
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      console.log('過去と未来の運勢を生成します...');
      
      // 過去の運勢生成
      const yesterdayFortune = await teamContextFortuneService.generateTeamContextFortune(
        testUser._id.toString(),
        testTeam._id.toString(),
        yesterday
      );
      
      // 未来の運勢生成
      const tomorrowFortune = await teamContextFortuneService.generateTeamContextFortune(
        testUser._id.toString(),
        testTeam._id.toString(),
        tomorrow
      );
      
      // 結果確認
      expect(yesterdayFortune).toBeDefined();
      expect(tomorrowFortune).toBeDefined();
      
      // 日付が正しく設定されていることを確認
      expect(new Date(yesterdayFortune.date).toISOString().split('T')[0])
        .toBe(yesterday.toISOString().split('T')[0]);
      
      expect(new Date(tomorrowFortune.date).toISOString().split('T')[0])
        .toBe(tomorrow.toISOString().split('T')[0]);
      
      // データベース直接検証
      const savedYesterdayFortune = await TeamContextFortune.findOne({
        userId: testUser._id,
        teamId: testTeam._id,
        date: {
          $gte: yesterday,
          $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      const savedTomorrowFortune = await TeamContextFortune.findOne({
        userId: testUser._id,
        teamId: testTeam._id,
        date: {
          $gte: tomorrow,
          $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      expect(savedYesterdayFortune).toBeDefined();
      expect(savedTomorrowFortune).toBeDefined();
    });
  });
});