import { Request, Response } from 'express';
import { compatibilityController } from '../../controllers/team/compatibility.controller';
import { Compatibility } from '../../models/Compatibility';
import { User } from '../../models/User';
import { Team } from '../../models/Team';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

// 環境変数を読み込む
config({ path: path.resolve(__dirname, '../../../.env') });

// モック化せずに実際のMongoDB接続を使用
beforeAll(async () => {
  // MongoDB接続
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB接続成功 - team-compatibility.controller.test.ts');
  } catch (error) {
    console.error('MongoDB接続エラー:', error);
    throw error;
  }
});

// テスト終了後にデータベース接続を閉じる
afterAll(async () => {
  await mongoose.disconnect();
  console.log('MongoDB接続終了 - team-compatibility.controller.test.ts');
});

describe('CompatibilityController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let testTeamId: string;
  let testUser1Id: string;
  let testUser2Id: string;
  let testCompatibilityId: string;

  // テスト前のセットアップ
  beforeEach(async () => {
    // レスポンスオブジェクトのモック
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // テスト用ユーザーを準備
    const testUser1 = await User.findOne({ email: 'test.user1@example.com' });
    const testUser2 = await User.findOne({ email: 'test.user2@example.com' });

    if (testUser1 && testUser2) {
      testUser1Id = testUser1._id.toString();
      testUser2Id = testUser2._id.toString();
    } else {
      // テスト用ユーザーを作成
      const newUser1 = await User.create({
        _id: new mongoose.Types.ObjectId('65fdc1f9e38f04d2d7636222'),
        email: 'test.user1@example.com',
        displayName: 'Test User 1',
        elementAttribute: 'wood',
        role: 'User',
        uid: 'test-uid-1'
      });

      const newUser2 = await User.create({
        _id: new mongoose.Types.ObjectId('65fdc1f9e38f04d2d7636223'),
        email: 'test.user2@example.com',
        displayName: 'Test User 2',
        elementAttribute: 'fire',
        role: 'User',
        uid: 'test-uid-2'
      });

      testUser1Id = newUser1._id.toString();
      testUser2Id = newUser2._id.toString();
    }

    // テスト用チームを準備
    const testTeam = await Team.findOne({ name: 'Test Team' });
      
    if (testTeam) {
      testTeamId = testTeam._id.toString();
      
      // メンバーが含まれていることを確認
      const hasUser1 = testTeam.members.some(m => m.userId.toString() === testUser1Id);
      const hasUser2 = testTeam.members.some(m => m.userId.toString() === testUser2Id);
      
      if (!hasUser1) {
        testTeam.members.push({ userId: new mongoose.Types.ObjectId(testUser1Id), role: 'member' });
      }
      
      if (!hasUser2) {
        testTeam.members.push({ userId: new mongoose.Types.ObjectId(testUser2Id), role: 'member' });
      }
      
      if (!hasUser1 || !hasUser2) {
        await testTeam.save();
      }
    } else {
      // テスト用チームを作成
      const newTeam = await Team.create({
        name: 'Test Team',
        description: 'Team for compatibility testing',
        members: [
          { userId: new mongoose.Types.ObjectId(testUser1Id), role: 'admin' },
          { userId: new mongoose.Types.ObjectId(testUser2Id), role: 'member' }
        ]
      });
      
      testTeamId = newTeam._id.toString();
    }

    // 相性データを確認または作成
    const smallerId = testUser1Id < testUser2Id ? testUser1Id : testUser2Id;
    const largerId = testUser1Id < testUser2Id ? testUser2Id : testUser1Id;
    
    let compatibility = await Compatibility.findOne({
      user1Id: new mongoose.Types.ObjectId(smallerId),
      user2Id: new mongoose.Types.ObjectId(largerId)
    });
    
    if (!compatibility) {
      compatibility = await Compatibility.create({
        user1Id: new mongoose.Types.ObjectId(smallerId),
        user2Id: new mongoose.Types.ObjectId(largerId),
        compatibilityScore: 80,
        relationship: 'mutual_generation',
        relationshipType: '相生',
        user1Element: 'wood',
        user2Element: 'fire',
        detailDescription: 'Test compatibility description',
        teamInsight: 'Test team insight',
        collaborationTips: ['Tip 1', 'Tip 2', 'Tip 3']
      });
    }
    
    testCompatibilityId = compatibility._id.toString();
  });

  // テスト後のクリーンアップ
  afterEach(async () => {
    // モックをリセット
    jest.clearAllMocks();
  });

  describe('getTeamCompatibilities', () => {
    beforeEach(() => {
      // リクエストオブジェクトの設定
      req = {
        params: { teamId: testTeamId }
      };
    });

    it('should return formatted team compatibilities', async () => {
      await compatibilityController.getTeamCompatibilities(req as Request, res as Response);

      // レスポンスのステータスコードを確認
      expect(res.status).toHaveBeenCalledWith(200);
      
      // レスポンスのデータ構造を確認
      const jsonResponse = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse.success).toBe(true);
      expect(Array.isArray(jsonResponse.data)).toBe(true);
      
      // 少なくとも1つの相性データが含まれていることを確認
      expect(jsonResponse.data.length).toBeGreaterThan(0);
      
      // データの形式を確認
      const firstItem = jsonResponse.data[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('users');
      expect(Array.isArray(firstItem.users)).toBe(true);
      expect(firstItem.users.length).toBe(2);
      expect(firstItem).toHaveProperty('score');
      expect(firstItem).toHaveProperty('relationship');
      expect(firstItem).toHaveProperty('relationshipType');
      expect(firstItem).toHaveProperty('detailDescription');
    });

    it('should handle error when team is not found', async () => {
      req.params = { teamId: new mongoose.Types.ObjectId().toString() };

      await compatibilityController.getTeamCompatibilities(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        error: expect.stringContaining('チームが見つかりません') 
      }));
    });
  });

  describe('getMemberCompatibility', () => {
    beforeEach(() => {
      // リクエストオブジェクトの設定
      req = {
        params: {
          teamId: testTeamId,
          userId1: testUser1Id,
          userId2: testUser2Id
        }
      };
    });

    it('should return formatted compatibility between two team members', async () => {
      await compatibilityController.getMemberCompatibility(req as Request, res as Response);

      // レスポンスのステータスコードを確認
      expect(res.status).toHaveBeenCalledWith(200);
      
      // レスポンスのデータ構造を確認
      const jsonResponse = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse.success).toBe(true);
      expect(jsonResponse.data).toBeDefined();
      
      // データの形式を確認
      const data = jsonResponse.data;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('users');
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.users.length).toBe(2);
      expect(data).toHaveProperty('score');
      expect(data).toHaveProperty('relationship');
      expect(data).toHaveProperty('relationshipType');
      expect(data).toHaveProperty('detailDescription');
      
      // ユーザーが正しく含まれていることを確認
      const userIds = data.users.map((u: any) => u.id.toString());
      expect(userIds).toContain(testUser1Id);
      expect(userIds).toContain(testUser2Id);
    });

    it('should handle error when team is not found', async () => {
      req.params = {
        teamId: new mongoose.Types.ObjectId().toString(),
        userId1: testUser1Id,
        userId2: testUser2Id
      };

      await compatibilityController.getMemberCompatibility(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        error: expect.stringContaining('チームが見つかりません') 
      }));
    });

    it('should handle error when user is not a team member', async () => {
      const nonMemberUserId = new mongoose.Types.ObjectId().toString();
      req.params = {
        teamId: testTeamId,
        userId1: testUser1Id,
        userId2: nonMemberUserId
      };

      await compatibilityController.getMemberCompatibility(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        error: expect.stringContaining('指定されたユーザーはチームのメンバーではありません') 
      }));
    });
  });
});