import express from 'express';
import * as friendshipController from '../controllers/friendship/friendship.controller';
import * as invitationController from '../controllers/friendship/invitation.controller';
import { hybridAuthenticate as authenticate } from '../middleware/hybrid-auth.middleware';

const router = express.Router();

/**
 * 友達機能API ルート
 * ベースパス: /api/v1/friends
 */

// 友達検索API
router.get('/search', authenticate, friendshipController.searchUsers);

// 友達一覧取得API
router.get('/', authenticate, friendshipController.getFriends);

// 受信した友達リクエスト一覧API
router.get('/requests', authenticate, friendshipController.getFriendRequests);

// 送信した友達リクエスト一覧API
router.get('/sent-requests', authenticate, friendshipController.getSentRequests);

// 友達リクエスト送信API
router.post('/request', authenticate, friendshipController.sendFriendRequest);

// 友達リクエスト承認API
router.post('/requests/:id/accept', authenticate, friendshipController.acceptFriendRequest);

// 友達リクエスト拒否API
router.post('/requests/:id/reject', authenticate, friendshipController.rejectFriendRequest);

// 友達削除API
router.delete('/:id', authenticate, friendshipController.removeFriend);

// 友達相性診断API - 基本診断
router.get('/:id/compatibility', authenticate, friendshipController.getCompatibility);

// 友達相性診断API - 拡張診断（aisyouyouken.mdの詳細アルゴリズムを使用）
router.get('/:id/enhanced-compatibility', authenticate, friendshipController.getEnhancedCompatibility);

// 友達プロフィール取得API
router.get('/:id/profile', authenticate, friendshipController.getFriendProfile);

export default router;