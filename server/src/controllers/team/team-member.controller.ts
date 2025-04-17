import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { teamMemberService } from '../../services/team';
import { BadRequestError } from '../../utils/error-handler';

/**
 * チームメンバー一覧を取得
 */
export const getTeamMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const userId = req.user!.id;
    
    const members = await teamMemberService.getTeamMembers(teamId, userId);
    
    // 型安全なマッピング関数
    function safeMap(member: any) {
      if (!member) return {};
      
      // toObjectメソッドがある場合は使用
      const doc = typeof member.toObject === 'function' ? member.toObject() : member;
      
      return {
        userId: doc._id,
        displayName: doc.displayName || '',
        email: doc.email || '',
        role: doc.teamRole || '',
        elementAttribute: doc.elementAttribute || '',
        motivation: typeof doc.motivation === 'number' ? doc.motivation : 0,
        leaveRisk: doc.leaveRisk || 'none'
      };
    }

    res.status(200).json({
      success: true,
      members: members.map(safeMap)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * チームにメンバーを追加
 */
export const addMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const { email, role, password, displayName } = req.body;
    const adminId = req.user!.id;
    
    // 必須パラメータのチェック
    if (!email) {
      throw new BadRequestError('メールアドレスは必須です');
    }
    
    const updatedUser = await teamMemberService.addMember(teamId, adminId, email, role, password, displayName);
    
    if (updatedUser) {
      res.status(200).json({
        success: true,
        message: 'メンバーが正常に追加されました',
        member: {
          userId: updatedUser._id,
          displayName: updatedUser.displayName,
          email: updatedUser.email,
          role: updatedUser.teamRole,
          elementAttribute: updatedUser.elementAttribute,
          isNewUser: (updatedUser as any).isNewUser
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりませんでした'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * メンバーの役割を更新
 */
export const updateMemberRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId, userId: targetUserId } = req.params;
    const { role } = req.body;
    const adminId = req.user!.id;
    
    // 必須パラメータのチェック
    if (!role) {
      throw new BadRequestError('役割は必須です');
    }
    
    const updatedUser = await teamMemberService.updateMemberRole(teamId, adminId, targetUserId, role);
    
    if (updatedUser) {
      res.status(200).json({
        success: true,
        message: 'メンバーの役割が正常に更新されました',
        member: {
          userId: updatedUser._id,
          displayName: updatedUser.displayName,
          email: updatedUser.email,
          role: updatedUser.teamRole
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりませんでした'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * チームからメンバーを削除
 */
export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId, userId: targetUserId } = req.params;
    const adminId = req.user!.id;
    
    const updatedUser = await teamMemberService.removeMember(teamId, adminId, targetUserId);
    
    if (updatedUser) {
      res.status(200).json({
        success: true,
        message: 'メンバーがチームから正常に削除されました',
        userId: updatedUser._id
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'メンバーが見つかりませんでした'
      });
    }
  } catch (error) {
    next(error);
  }
};