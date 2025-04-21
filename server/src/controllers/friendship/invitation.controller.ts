import { Response, NextFunction } from 'express';
import { invitationService } from '../../services/friendship';
import { AuthRequest } from '../../types/auth';

/**
 * 友達招待リンクの作成
 * @route POST /api/v1/invitations/friend
 * @access Private
 */
export const createFriendInvitation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const userId = req.user?._id;

    // 必須パラメータのチェック
    if (!email) {
      return res.status(400).json({ success: false, message: 'メールアドレスは必須です' });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: '認証が必要です' });
    }

    const result = await invitationService.createFriendInvitation(userId, email);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * チーム招待リンクの作成
 * @route POST /api/v1/invitations/team
 * @access Private
 */
export const createTeamInvitation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId, email, role } = req.body;
    const userId = req.user?._id;

    // 必須パラメータのチェック
    if (!teamId || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'チームIDとメールアドレスは必須です' 
      });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: '認証が必要です' });
    }

    const result = await invitationService.createTeamInvitation(teamId, userId, email, role);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 招待情報の取得
 * @route GET /api/v1/invitations/:code
 * @access Public (認証済みユーザー向けの追加情報あり)
 */
export const getInvitationInfo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    
    // 招待情報の取得
    const invitation = await invitationService.getInvitationInfo(code);
    
    // ログインユーザーがいる場合は追加情報を含める
    if (req.user) {
      invitation.isLoggedIn = true;
      invitation.currentUser = {
        id: req.user._id,
        email: req.user.email
      };
      
      // 招待先メールアドレスとログインユーザーのメールアドレスの一致確認
      if (req.user.email && invitation.email) {
        invitation.isInvitedUser = req.user.email.toLowerCase() === invitation.email.toLowerCase();
      } else {
        invitation.isInvitedUser = false;
      }
    } else {
      invitation.isLoggedIn = false;
    }
    
    res.status(200).json({
      success: true,
      data: invitation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 招待の承認
 * @route POST /api/v1/invitations/:code/accept
 * @access Private
 */
export const acceptInvitation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: '認証が必要です' });
    }
    
    const result = await invitationService.processInvitation(code, userId, 'accept');
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 招待の拒否
 * @route POST /api/v1/invitations/:code/reject
 * @access Private
 */
export const rejectInvitation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: '認証が必要です' });
    }
    
    const result = await invitationService.processInvitation(code, userId, 'reject');
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 招待の取り消し
 * @route DELETE /api/v1/invitations/:id
 * @access Private
 */
export const cancelInvitation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: '認証が必要です' });
    }
    
    const result = await invitationService.cancelInvitation(id, userId);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ユーザーの招待一覧を取得
 * @route GET /api/v1/invitations
 * @access Private
 */
export const getUserInvitations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { status = 'pending' } = req.query;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: '認証が必要です' });
    }
    
    const invitations = await invitationService.getUserInvitations(
      userId, 
      (status as 'pending' | 'accepted' | 'expired' | 'all')
    );
    
    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    next(error);
  }
};