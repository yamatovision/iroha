import mongoose from 'mongoose';
import { compatibilityService } from '../../services/team/compatibility.service';
import { Compatibility } from '../../models/Compatibility';
import { User } from '../../models/User';
import { Team } from '../../models/Team';
import { config } from 'dotenv';
import path from 'path';

// 環境変数を読み込む
config({ path: path.resolve(__dirname, '../../../.env') });

// データベース接続
beforeAll(async () => {
  // MongoDB接続
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB接続成功 - compatibility.service.test.ts');
  } catch (error) {
    console.error('MongoDB接続エラー:', error);
    throw error;
  }
});

// テスト終了後にデータベース接続を閉じる
afterAll(async () => {
  await mongoose.disconnect();
  console.log('MongoDB接続終了 - compatibility.service.test.ts');
});

describe('CompatibilityService', () => {
  // 各テスト前に実行
  beforeEach(async () => {
    // テスト用のデータをクリア（必要に応じて）
    // 注: 実際のデータベースを使用するため、慎重にテストデータを管理する
    // Compatibilityのテストデータはテスト専用のものだけを削除
    await Compatibility.deleteMany({ 
      user1Id: { $in: [
        new mongoose.Types.ObjectId('65fdc1f9e38f04d2d7636222'),
        new mongoose.Types.ObjectId('65fdc1f9e38f04d2d7636223') 
      ]},
      user2Id: { $in: [
        new mongoose.Types.ObjectId('65fdc1f9e38f04d2d7636222'),
        new mongoose.Types.ObjectId('65fdc1f9e38f04d2d7636223') 
      ]}
    });
  });

  describe('determineRelationship', () => {
    it('should determine mutual_generation relationship when element1 generates element2', () => {
      const result = compatibilityService.determineRelationship('wood', 'fire');
      expect(result).toBe('mutual_generation');
    });

    it('should determine mutual_generation relationship when element2 generates element1', () => {
      const result = compatibilityService.determineRelationship('fire', 'wood');
      expect(result).toBe('mutual_generation');
    });

    it('should determine mutual_restriction relationship when element1 restricts element2', () => {
      const result = compatibilityService.determineRelationship('wood', 'earth');
      expect(result).toBe('mutual_restriction');
    });

    it('should determine mutual_restriction relationship when element2 restricts element1', () => {
      const result = compatibilityService.determineRelationship('earth', 'wood');
      expect(result).toBe('mutual_restriction');
    });

    it('should determine neutral relationship when elements have no direct relationship', () => {
      const result = compatibilityService.determineRelationship('wood', 'metal');
      expect(result).toBe('neutral');
    });
  });

  describe('calculateCompatibilityScore', () => {
    // 乱数を使用しているため、厳密なテストはできないが、値の範囲をチェック
    it('should calculate score in correct range for mutual_generation relationship', () => {
      const result = compatibilityService.calculateCompatibilityScore('mutual_generation');
      expect(result).toBeGreaterThanOrEqual(70);
      expect(result).toBeLessThanOrEqual(90);
    });

    it('should calculate score in correct range for mutual_restriction relationship', () => {
      const result = compatibilityService.calculateCompatibilityScore('mutual_restriction');
      expect(result).toBeGreaterThanOrEqual(30);
      expect(result).toBeLessThanOrEqual(60);
    });

    it('should calculate score in correct range for neutral relationship', () => {
      const result = compatibilityService.calculateCompatibilityScore('neutral');
      expect(result).toBeGreaterThanOrEqual(50);
      expect(result).toBeLessThanOrEqual(75);
    });
  });

  describe('getOrCreateCompatibility', () => {
    // テスト用のユーザーを作成
    let testUser1Id: string;
    let testUser2Id: string;

    beforeEach(async () => {
      // テスト用ユーザーを作成または取得
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
    });

    afterEach(async () => {
      // テスト後に作成したCompatibilityデータを削除
      await Compatibility.deleteMany({
        user1Id: { $in: [
          new mongoose.Types.ObjectId(testUser1Id),
          new mongoose.Types.ObjectId(testUser2Id)
        ]},
        user2Id: { $in: [
          new mongoose.Types.ObjectId(testUser1Id),
          new mongoose.Types.ObjectId(testUser2Id)
        ]}
      });
    });

    it('should create new compatibility when not found', async () => {
      // まず既存のCompatibilityを削除して確認
      await Compatibility.deleteMany({
        user1Id: { $in: [
          new mongoose.Types.ObjectId(testUser1Id),
          new mongoose.Types.ObjectId(testUser2Id)
        ]},
        user2Id: { $in: [
          new mongoose.Types.ObjectId(testUser1Id),
          new mongoose.Types.ObjectId(testUser2Id)
        ]}
      });

      // 相性を取得または作成
      const compatibility = await compatibilityService.getOrCreateCompatibility(testUser1Id, testUser2Id);
      
      // 結果を検証
      expect(compatibility).toBeDefined();
      expect(compatibility.user1Id.toString()).toBe(testUser1Id);
      expect(compatibility.user2Id.toString()).toBe(testUser2Id);
      expect(compatibility.relationship).toBe('mutual_generation');
      expect(compatibility.relationshipType).toBe('相生');
      expect(compatibility.user1Element).toBe('wood');
      expect(compatibility.user2Element).toBe('fire');
      expect(compatibility.detailDescription).toBeTruthy();
      expect(compatibility.teamInsight).toBeTruthy();
      expect(Array.isArray(compatibility.collaborationTips)).toBe(true);
    });

    it('should return existing compatibility when found', async () => {
      // まず相性データを作成
      const initialCompatibility = await compatibilityService.getOrCreateCompatibility(testUser1Id, testUser2Id);
      
      // 同じユーザー間の相性を再度取得
      const retrievedCompatibility = await compatibilityService.getOrCreateCompatibility(testUser1Id, testUser2Id);
      
      // 同一のデータが取得できていることを確認
      expect(retrievedCompatibility._id.toString()).toBe(initialCompatibility._id.toString());
    });
  });

  describe('getTeamMemberCompatibility', () => {
    // テスト用のチームとユーザーを作成
    let testTeamId: string;
    let testUser1Id: string;
    let testUser2Id: string;

    beforeEach(async () => {
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

      // テスト用チームを作成
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
    });

    it('should get compatibility between two team members', async () => {
      // チームメンバー間の相性を取得
      const compatibility = await compatibilityService.getTeamMemberCompatibility(
        testTeamId,
        testUser1Id,
        testUser2Id
      );
      
      // 結果を検証
      expect(compatibility).toBeDefined();
      
      // user1とuser2はどちらが先になるか決まっているため、順序を考慮
      if (compatibility.user1Id.toString() === testUser1Id) {
        expect(compatibility.user2Id.toString()).toBe(testUser2Id);
      } else {
        expect(compatibility.user1Id.toString()).toBe(testUser2Id);
        expect(compatibility.user2Id.toString()).toBe(testUser1Id);
      }
      
      expect(compatibility.relationship).toBe('mutual_generation');
      expect(compatibility.relationshipType).toBe('相生');
    });

    it('should throw error when team is not found', async () => {
      const nonExistentTeamId = new mongoose.Types.ObjectId().toString();
      
      await expect(compatibilityService.getTeamMemberCompatibility(
        nonExistentTeamId,
        testUser1Id,
        testUser2Id
      )).rejects.toThrow('チームが見つかりません');
    });

    it('should throw error when user is not a team member', async () => {
      const nonMemberUserId = new mongoose.Types.ObjectId().toString();
      
      await expect(compatibilityService.getTeamMemberCompatibility(
        testTeamId,
        testUser1Id,
        nonMemberUserId
      )).rejects.toThrow('指定されたユーザーはチームのメンバーではありません');
    });
  });
});