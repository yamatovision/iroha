import express from 'express';
import * as invitationController from '../controllers/friendship/invitation.controller';
import { hybridAuthenticate as authenticate } from '../middleware/hybrid-auth.middleware';

const router = express.Router();

/**
 * 招待機能API ルート
 * ベースパス: /api/v1/invitations
 */

// 自身の招待一覧取得API
router.get('/', authenticate, invitationController.getUserInvitations);

// 友達招待作成API
router.post('/friend', authenticate, invitationController.createFriendInvitation);

// チーム招待作成API
router.post('/team', authenticate, invitationController.createTeamInvitation);

// 招待情報取得API (非認証でアクセス可能だが、認証済みの場合は追加情報を含む)
router.get('/:code', invitationController.getInvitationInfo);

// 招待承認API
router.post('/:code/accept', authenticate, invitationController.acceptInvitation);

// 招待拒否API
router.post('/:code/reject', authenticate, invitationController.rejectInvitation);

// 招待取り消しAPI
router.delete('/:id', authenticate, invitationController.cancelInvitation);

export default router;