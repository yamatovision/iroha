import mongoose, { Types } from 'mongoose';
import request from 'supertest';
import express, { Express } from 'express';
import { API_BASE_PATH } from '../../types';
import { DayPillar } from '../../models/DayPillar';
import { User } from '../../models/User';
import { Team } from '../../models/Team';
import { TeamMembership } from '../../models/TeamMembership';
import { TeamContextFortune } from '../../models/TeamContextFortune';
import { TeamGoal } from '../../models/TeamGoal';
import { MongoDBConnector, getTestAuthHeaders } from '../utils/test-helpers';
import { JwtService } from '../../services/jwt.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 環境変数の読み込み
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

// タイムアウト設定（APIとClaudeの呼び出しがあるため長めに設定）
jest.setTimeout(60000);

describe('Team Context Fortune Controller', () => {
  let app: Express;
  let mongoConnector: MongoDBConnector;
  let testUser: any;
  let testTeam: any;
  let testDayPillar: any;
  let authToken: string;
  
  beforeAll(async () => {
    console.log('MongoDB接続を開始します...');
    
    // MongoDB接続
    mongoConnector = new MongoDBConnector();
    await mongoConnector.connect();
    
    console.log('MongoDB接続成功');
    
    // テスト用のExpressアプリケーションを作成
    app = express();
    app.use(express.json());
    
    // fortuneRouterを使用
    const fortuneRouter = require('../../routes/fortune.routes').default;
    app.use(`${API_BASE_PATH}`, fortuneRouter);
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
      
      // テスト用ユーザーの作成
      testUser = await User.create({
        _id: new Types.ObjectId(),
        uid: 'test-uid-1',
        email: 'test1@example.com',
        password: 'Password123!',
        displayName: 'Test User 1',
        role: 'User',
        plan: 'lite',
        isActive: true,
        elementAttribute: 'wood',
        jobTitle: 'エンジニア',
        fourPillars: {
          year: { heavenlyStem: '甲', earthlyBranch: '寅' },
          month: { heavenlyStem: '乙', earthlyBranch: '卯' },
          day: { heavenlyStem: '丙', earthlyBranch: '辰' },
          hour: { heavenlyStem: '丁', earthlyBranch: '巳' }
        },
        dayMaster: '丙'
      });
      
      // JWTトークンを生成
      authToken = JwtService.generateAccessToken({
        _id: testUser._id,
        email: testUser.email,
        role: testUser.role
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
        adminId: testUser._id,
        creatorId: testUser._id,
        organizationId: organization.insertedId
      });
      
      // チームメンバーシップの作成
      await TeamMembership.create({
        userId: testUser._id,
        teamId: testTeam._id,
        role: 'admin',
        status: 'active'
      });
      
      console.log('テストデータ作成完了');
      
    } catch (error) {
      console.error('テストデータ作成中にエラーが発生しました:', error);
      throw error;
    }
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
  
  describe('チームコンテキスト運勢API', () => {
    it('JWTトークンでチームコンテキスト運勢を取得できること', async () => {
      // リクエスト実行
      const teamId = testTeam._id.toString();
      
      // データベース直接検証（事前）
      const initialFortune = await TeamContextFortune.findOne({
        userId: testUser._id,
        teamId: testTeam._id
      });
      
      expect(initialFortune).toBeNull(); // 最初は存在しないこと
      
      // リクエスト実行（JWTトークンを使用）
      const response = await request(app)
        .get(`${API_BASE_PATH}/team/${teamId}/context`)
        .set('Authorization', `Bearer ${authToken}`);
      
      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.teamContextFortune).toBeDefined();
      
      // データベース直接検証（事後）
      const savedFortune = await TeamContextFortune.findOne({
        userId: testUser._id,
        teamId: testTeam._id
      });
      
      expect(savedFortune).toBeDefined();
      expect(savedFortune!.userId.toString()).toBe(testUser._id.toString());
      expect(savedFortune!.teamId.toString()).toBe(testTeam._id.toString());
    });
    
    it('認証なしの場合は401エラーが返ること', async () => {
      // リクエスト実行（認証なし）
      const teamId = testTeam._id.toString();
      const response = await request(app)
        .get(`${API_BASE_PATH}/team/${teamId}/context`);
      
      // レスポンス検証
      expect(response.status).toBe(401);
    });
  });
});