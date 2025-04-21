import mongoose from 'mongoose';
import { TeamMembership } from '../models/TeamMembership';
import { Team } from '../models/Team';
import { NotFoundError } from '../utils/error-handler';

/**
 * ユーザーのチーム所属を確認する関数
 * @param teamId チームID
 * @param userId ユーザーID
 * @returns チームに所属しているかどうか
 */
export const isTeamMember = async (
  teamId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<boolean> => {
  const membership = await TeamMembership.findOne({
    teamId,
    userId
  });
  return !!membership;
};

/**
 * ユーザーのデフォルトチームを取得する関数
 * @param userId ユーザーID
 * @returns チームIDまたはnull（所属がない場合）
 */
export const getDefaultTeamId = async (
  userId: string | mongoose.Types.ObjectId
): Promise<string | null> => {
  // 最近参加したチームを優先
  const membership = await TeamMembership.findOne({ userId })
    .sort({ joinedAt: -1 });
  
  return membership?.teamId?.toString() || null;
};

/**
 * ユーザーのチーム内役割を取得する関数
 * @param userId ユーザーID
 * @param teamId チームID
 * @returns チーム内での役割
 */
export const getUserTeamRole = async (
  userId: string | mongoose.Types.ObjectId,
  teamId: string | mongoose.Types.ObjectId
): Promise<string> => {
  const membership = await TeamMembership.findOne({
    userId,
    teamId
  });
  
  return membership?.role || '';
};

/**
 * チーム管理者かどうかを確認する関数
 * @param teamId チームID
 * @param userId ユーザーID
 * @returns 管理者かどうか
 */
export const isTeamAdmin = async (
  teamId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<boolean> => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }
  
  // チーム作成者（主管理者）の確認
  if (team.adminId && team.adminId.toString() === userId.toString()) {
    return true;
  }
  
  // administrators配列での確認
  if (team.administrators && team.administrators.length > 0) {
    const isInAdminArray = team.administrators.some(
      adminId => adminId && adminId.toString() === userId.toString()
    );
    if (isInAdminArray) {
      return true;
    }
  }
  
  // TeamMembershipでの確認
  const membership = await TeamMembership.findOne({
    teamId,
    userId
  });
  
  return membership?.isAdmin || false;
};

/**
 * ユーザーのチームメンバーシップ情報を取得する関数
 * @param userId ユーザーID
 * @param teamId チームID（オプション）
 * @returns チームメンバーシップ情報
 */
export const getUserTeamMembership = async (
  userId: string | mongoose.Types.ObjectId,
  teamId?: string | mongoose.Types.ObjectId
): Promise<any> => {
  const query: any = { userId };
  
  if (teamId) {
    query.teamId = teamId;
  }
  
  const memberships = await TeamMembership.find(query)
    .populate('teamId')
    .sort({ joinedAt: -1 });
  
  return teamId ? memberships[0] : memberships;
};