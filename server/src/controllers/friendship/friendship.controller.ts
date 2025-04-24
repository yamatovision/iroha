import { Response, NextFunction } from 'express';
import * as friendshipService from '../../services/friendship/friendship.service';
import { BadRequestError } from '../../utils/error-handler';
import { AuthRequest } from '../../types/auth';

/**
 * 友達検索API
 * @route GET /api/v1/friends/search?q={searchQuery}
 * @param {string} q - 検索クエリ（名前やメールアドレス）
 */
export const searchUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q: query } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const userId = req.user._id;

    if (!query || typeof query !== 'string') {
      throw new BadRequestError('検索クエリを指定してください');
    }

    const users = await friendshipService.searchUsersByQuery(query, userId);
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 友達一覧取得API
 * @route GET /api/v1/friends
 */
export const getFriends = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const userId = req.user._id;
    
    const friends = await friendshipService.getFriendsList(userId);
    res.status(200).json({
      success: true,
      data: friends
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 受信した友達リクエスト一覧API
 * @route GET /api/v1/friends/requests
 */
export const getFriendRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const userId = req.user._id;
    
    console.log(`[DEBUG] 友達リクエスト取得: ユーザーID=${userId}`);
    const requests = await friendshipService.getFriendRequests(userId);
    console.log(`[DEBUG] 友達リクエスト件数: ${requests.length}`);
    console.log('[DEBUG] 友達リクエスト一覧:', requests);
    
    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('[ERROR] 友達リクエスト取得エラー:', error);
    next(error);
  }
};

/**
 * 送信した友達リクエスト一覧API
 * @route GET /api/v1/friends/sent-requests
 */
export const getSentRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const userId = req.user._id;
    
    const requests = await friendshipService.getSentRequests(userId);
    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 友達リクエスト送信API
 * @route POST /api/v1/friends/request
 * @param {string} userId - 送信先ユーザーID（リクエストBody内）
 */
export const sendFriendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 両方のパラメータ形式に対応
    const { targetUserId = req.body.userId } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const userId = req.user._id;

    if (!targetUserId) {
      throw new BadRequestError('送信先ユーザーIDを指定してください');
    }

    const friendship = await friendshipService.sendFriendRequest(userId, targetUserId);
    res.status(201).json({
      success: true,
      data: friendship,
      message: '友達リクエストを送信しました'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 友達リクエスト承認API
 * @route POST /api/v1/friends/requests/:id/accept
 */
export const acceptFriendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const userId = req.user._id;

    const friendship = await friendshipService.acceptFriendRequest(id, userId);
    res.status(200).json({
      success: true,
      data: friendship,
      message: '友達リクエストを承認しました'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 友達リクエスト拒否API
 * @route POST /api/v1/friends/requests/:id/reject
 */
export const rejectFriendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const userId = req.user._id;

    const friendship = await friendshipService.rejectFriendRequest(id, userId);
    res.status(200).json({
      success: true,
      data: friendship,
      message: '友達リクエストを拒否しました'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 友達削除API
 * @route DELETE /api/v1/friends/:id
 */
export const removeFriend = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const userId = req.user._id;

    const result = await friendshipService.removeFriend(id, userId);
    res.status(200).json({
      success: true,
      data: result,
      message: '友達を削除しました'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 友達相性診断API - 基本バージョン
 * @route GET /api/v1/friends/:id/compatibility
 */
export const getCompatibility = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const userId = req.user._id;

    const compatibilityData = await friendshipService.getCompatibilityScore(userId, id, false);
    res.status(200).json({
      success: true,
      compatibility: compatibilityData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 友達拡張相性診断API - 高度なアルゴリズムを利用
 * @route GET /api/v1/friends/:id/enhanced-compatibility
 */
export const getEnhancedCompatibility = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const userId = req.user._id;

    // 拡張アルゴリズムを使用して相性情報を取得
    const compatibilityData = await friendshipService.getCompatibilityScore(userId, id, true);
    
    // チーム機能と同様のシンプルな形式でレスポンスを返す
    res.status(200).json({
      success: true,
      compatibility: compatibilityData
    });
  } catch (error) {
    console.error('拡張相性診断API呼び出しエラー:', error);
    next(error);
  }
};

/**
 * 友達プロフィール取得API
 * @route GET /api/v1/friends/:id/profile
 */
export const getFriendProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const userId = req.user._id;

    const profileData = await friendshipService.getFriendProfile(userId, id);
    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error) {
    next(error);
  }
};