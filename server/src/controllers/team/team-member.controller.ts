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

    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    
    // idが存在する場合はidを、なければ_idを使用
    const userId = req.user.id || req.user._id;
    
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
        role: doc.role || '',
        memberRole: doc.memberRole || 'member',
        isAdmin: doc.isAdmin || false,
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
    
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const adminId = req.user.id || req.user._id;
    
    // 必須パラメータのチェック
    if (!email) {
      throw new BadRequestError('メールアドレスは必須です');
    }
    
    const updatedUser = await teamMemberService.addMember(teamId, adminId, email, role, password, displayName);
    
    if (updatedUser) {
      // TeamMembershipのroleフィールドを使用
      const memberRole = updatedUser.role || '';
      
      // TeamMembershipを取得
      const userId = updatedUser && updatedUser._id ? 
        (typeof updatedUser._id === 'string' ? updatedUser._id : updatedUser._id.toString()) : 
        '';
      const membership = userId ? await teamMemberService.getTeamMembership(teamId, userId) : null;
      
      res.status(200).json({
        success: true,
        message: 'メンバーが正常に追加されました',
        member: {
          userId: updatedUser._id,
          displayName: updatedUser.displayName,
          email: updatedUser.email,
          role: memberRole,
          elementAttribute: updatedUser.elementAttribute,
          memberRole: membership?.memberRole || 'member',
          isAdmin: membership?.isAdmin || false,
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
    
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const adminId = req.user.id || req.user._id;
    
    // 必須パラメータのチェック
    if (!role) {
      throw new BadRequestError('役割は必須です');
    }
    
    const result = await teamMemberService.updateMemberRole(teamId, adminId, targetUserId, role);
    
    if (result && result.user) {
      // TeamMembershipのroleフィールドを使用
      const memberRole = result.membership.role || '';
      
      res.status(200).json({
        success: true,
        message: 'メンバーの役割が正常に更新されました',
        member: {
          userId: result.user._id,
          displayName: result.user.displayName,
          email: result.user.email,
          role: memberRole,
          memberRole: result.membership.memberRole || 'member',
          isAdmin: result.membership.isAdmin || false
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
    
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const adminId = req.user.id || req.user._id;
    
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

/**
 * 友達をチームメンバーとして追加
 */
export const addFriendAsMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const { friendId, role } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const adminId = req.user.id || req.user._id;
    
    // 必須パラメータのチェック
    if (!friendId) {
      throw new BadRequestError('友達IDは必須です');
    }
    
    const membership = await teamMemberService.addFriendAsMember(teamId, adminId, friendId, role);
    
    res.status(200).json({
      success: true,
      message: '友達がチームメンバーとして追加されました',
      data: membership
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * チームから脱退する（自分自身が実行）
 */
export const leaveTeam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const userId = req.user.id || req.user._id;

    // チームから脱退するサービス関数を呼び出し
    const result = await teamMemberService.leaveTeam(teamId, userId);

    res.status(200).json({
      success: true,
      message: 'チームから脱退しました',
      data: result
    });
  } catch (error) {
    next(error);
  }
};