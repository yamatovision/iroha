/**
 * 友達相性診断APIのユニットテスト
 * 
 * 本テストで検証する機能:
 * 1. 基本相性診断API: /api/v1/friends/:id/compatibility
 * 2. 拡張相性診断API: /api/v1/friends/:id/enhanced-compatibility
 */
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { User, Friendship } from '../../models';
import * as friendshipController from '../../controllers/friendship/friendship.controller';
import { AuthRequest } from '../../types/auth';
import { Response, NextFunction } from 'express';

// モックデータ
const mockUserId1 = new mongoose.Types.ObjectId();
const mockUserId2 = new mongoose.Types.ObjectId();
const mockFriendshipId = new mongoose.Types.ObjectId();

// モックユーザー1
const mockUser1 = {
  _id: mockUserId1,
  displayName: 'テストユーザー1',
  email: 'test1@example.com',
  elementAttribute: 'fire',
  fourPillars: {
    year: { heavenlyStem: '甲', earthlyBranch: '子' },
    month: { heavenlyStem: '丙', earthlyBranch: '寅' },
    day: { heavenlyStem: '戊', earthlyBranch: '辰' },
    hour: { heavenlyStem: '庚', earthlyBranch: '午' }
  },
  kakukyoku: {
    type: '従旺格',
    strength: 'strong',
    category: 'normal',
    description: 'テスト用格局'
  },
  yojin: {
    tenGod: '食神',
    element: 'earth',
    description: 'テスト用用神'
  }
};

// モックユーザー2
const mockUser2 = {
  _id: mockUserId2,
  displayName: 'テストユーザー2',
  email: 'test2@example.com',
  elementAttribute: 'water',
  fourPillars: {
    year: { heavenlyStem: '乙', earthlyBranch: '丑' },
    month: { heavenlyStem: '丁', earthlyBranch: '卯' },
    day: { heavenlyStem: '己', earthlyBranch: '巳' },
    hour: { heavenlyStem: '辛', earthlyBranch: '未' }
  },
  kakukyoku: {
    type: '従旺格',
    strength: 'weak',
    category: 'normal',
    description: 'テスト用格局'
  },
  yojin: {
    tenGod: '劫財',
    element: 'wood',
    description: 'テスト用用神'
  }
};

// モック友達関係
const mockFriendship = {
  _id: mockFriendshipId,
  userId1: mockUserId1,
  userId2: mockUserId2,
  status: 'accepted',
  requesterId: mockUserId1,
  compatibilityScore: 75,
  relationshipType: '相生',
  createdAt: new Date(),
  updatedAt: new Date(),
  acceptedAt: new Date()
};

// モックレスポンス
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

// モックネクスト関数
const mockNext: NextFunction = jest.fn();

// モックサービス
jest.mock('../../services/friendship/friendship.service', () => ({
  getCompatibilityScore: jest.fn().mockImplementation((userId1, userId2, useEnhancedAlgorithm) => {
    if (useEnhancedAlgorithm) {
      return Promise.resolve({
        score: 85,
        relationshipType: '良好な協力関係',
        users: [
          {
            userId: mockUserId1,
            displayName: 'テストユーザー1',
            elementAttribute: 'fire'
          },
          {
            userId: mockUserId2,
            displayName: 'テストユーザー2',
            elementAttribute: 'water'
          }
        ],
        friendship: mockFriendshipId,
        details: {
          detailDescription: '拡張相性の詳細説明',
          teamInsight: 'チーム考察',
          collaborationTips: '協力アドバイス'
        },
        description: '拡張相性の説明',
        enhancedDetails: {
          yinYangBalance: 65,
          strengthBalance: 70,
          dayBranchRelationship: {
            score: 75,
            relationship: '合'
          },
          usefulGods: 80,
          dayGanCombination: {
            score: 90,
            isGangou: true
          },
          relationshipType: '良好な協力関係'
        }
      });
    } else {
      return Promise.resolve({
        score: 75,
        relationshipType: '相生',
        users: [
          {
            userId: mockUserId1,
            displayName: 'テストユーザー1',
            elementAttribute: 'fire'
          },
          {
            userId: mockUserId2,
            displayName: 'テストユーザー2',
            elementAttribute: 'water'
          }
        ],
        friendship: mockFriendshipId,
        details: {
          detailDescription: '基本相性の詳細説明',
          teamInsight: '基本チーム考察',
          collaborationTips: '基本協力アドバイス'
        },
        description: '基本相性の説明'
      });
    }
  })
}));

describe('友達相性診断コントローラーテスト', () => {
  beforeAll(async () => {
    // モックデータをセットアップ（必要に応じて）
    // 実際のデータベースを使用しない場合は不要
  });

  afterAll(async () => {
    // テスト後のクリーンアップ
    jest.clearAllMocks();
  });

  describe('基本相性診断API (getCompatibility)', () => {
    it('認証が必要', async () => {
      // 認証なしのリクエスト
      const req = { params: { id: mockUserId2.toString() } } as unknown as AuthRequest;
      const res = mockResponse();

      await friendshipController.getCompatibility(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: '認証されていません' });
    });

    it('有効な相性情報を返す', async () => {
      // 認証ありのリクエスト
      const req = {
        params: { id: mockUserId2.toString() },
        user: { _id: mockUserId1.toString() }
      } as unknown as AuthRequest;
      const res = mockResponse();

      await friendshipController.getCompatibility(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          score: 75,
          relationshipType: '相生'
        })
      });
    });
  });

  describe('拡張相性診断API (getEnhancedCompatibility)', () => {
    it('認証が必要', async () => {
      // 認証なしのリクエスト
      const req = { params: { id: mockUserId2.toString() } } as unknown as AuthRequest;
      const res = mockResponse();

      await friendshipController.getEnhancedCompatibility(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: '認証されていません' });
    });

    it('拡張相性情報を返す', async () => {
      // 認証ありのリクエスト
      const req = {
        params: { id: mockUserId2.toString() },
        user: { _id: mockUserId1.toString() }
      } as unknown as AuthRequest;
      const res = mockResponse();

      await friendshipController.getEnhancedCompatibility(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          score: 85,
          relationshipType: '良好な協力関係',
          enhancedDetails: expect.objectContaining({
            yinYangBalance: 65,
            strengthBalance: 70
          })
        })
      });
    });
  });

  describe('両APIの動作比較', () => {
    it('拡張相性診断APIは基本相性診断APIとは異なるスコアを返す', async () => {
      // 両方のAPIを呼び出すためのリクエスト
      const req = {
        params: { id: mockUserId2.toString() },
        user: { _id: mockUserId1.toString() }
      } as unknown as AuthRequest;
      const res1 = mockResponse();
      const res2 = mockResponse();

      await friendshipController.getCompatibility(req, res1, mockNext);
      await friendshipController.getEnhancedCompatibility(req, res2, mockNext);

      const basicResult = (res1.json as jest.Mock).mock.calls[0][0].data;
      const enhancedResult = (res2.json as jest.Mock).mock.calls[0][0].data;

      // スコアが異なることを確認
      expect(basicResult.score).not.toEqual(enhancedResult.score);
      
      // 基本相性診断では enhancedDetails が含まれないことを確認
      expect(basicResult.enhancedDetails).toBeUndefined();
      
      // 拡張相性診断では enhancedDetails が含まれることを確認
      expect(enhancedResult.enhancedDetails).toBeDefined();
    });
  });
});