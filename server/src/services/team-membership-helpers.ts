import mongoose from 'mongoose';
import { TeamMembership, TeamMemberRole } from '../models/TeamMembership';
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
 * チーム作成者かどうかを確認する関数
 * @param teamId チームID
 * @param userId ユーザーID
 * @returns 作成者かどうか
 */
export const isTeamCreator = async (
  teamId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<boolean> => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    return false;
  }
  
  // チーム作成者（主管理者）の確認
  if (team.adminId && team.adminId.toString() === userId.toString()) {
    return true;
  }
  
  // メンバーシップでmemberRole=creatorを確認
  const membership = await TeamMembership.findOne({
    teamId,
    userId,
    memberRole: TeamMemberRole.CREATOR
  });
  
  return !!membership;
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
  
  // 作成者は常に管理者権限を持つ
  const isCreator = await isTeamCreator(teamId, userId);
  if (isCreator) {
    return true;
  }

  // メンバーシップでmemberRoleを確認
  const membership = await TeamMembership.findOne({
    teamId,
    userId
  });

  if (!membership) {
    return false;
  }

  // memberRoleが設定されている場合はそれを優先
  if (membership.memberRole) {
    return membership.memberRole === TeamMemberRole.ADMIN || 
           membership.memberRole === TeamMemberRole.CREATOR;
  }
  
  // 後方互換性のためisAdminもチェック
  return membership.isAdmin || false;
};

/**
 * チーム権限チェック関数 - 特定の操作に対する権限を確認
 * @param userId ユーザーID
 * @param teamId チームID
 * @param action 権限チェック対象の操作('view_data', 'manage_members', 'delete_team'など)
 * @returns 権限があればtrue、なければfalse
 */
export const checkTeamPermission = async (
  userId: string | mongoose.Types.ObjectId,
  teamId: string | mongoose.Types.ObjectId,
  action: string
): Promise<boolean> => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    return false;
  }

  // creatorはすべての権限を持つ
  const isCreator = await isTeamCreator(teamId, userId);
  if (isCreator) {
    return true;
  }

  // memberRoleに基づく権限チェック
  const membership = await TeamMembership.findOne({
    teamId,
    userId
  });

  if (!membership) {
    return false;
  }

  // memberRoleの取得（設定されていない場合はisAdminから推測）
  const role = membership.memberRole ||
    (membership.isAdmin ? TeamMemberRole.ADMIN : TeamMemberRole.MEMBER);

  // アクションに基づいた権限マトリックス
  switch(action) {
    case 'view_data':
      // すべてのメンバーにデータ閲覧権限を許可
      return true;
    case 'manage_members':
      // メンバー管理はADMIN以上
      return role === TeamMemberRole.ADMIN || role === TeamMemberRole.CREATOR;
    case 'update_team':
      // チーム情報更新はADMIN以上
      return role === TeamMemberRole.ADMIN || role === TeamMemberRole.CREATOR;
    case 'delete_team':
      // チーム削除はCREATORのみ
      return role === TeamMemberRole.CREATOR;
    case 'manage_team_goal':
      // チーム目標管理はADMIN以上
      return role === TeamMemberRole.ADMIN || role === TeamMemberRole.CREATOR;
    default:
      // デフォルトはMEMBERには権限なし、ADMIN以上に権限あり
      return role === TeamMemberRole.ADMIN || role === TeamMemberRole.CREATOR;
  }
};

/**
 * ユーザーのチームメンバーロールを取得する関数
 * @param userId ユーザーID
 * @param teamId チームID
 * @returns チーム内でのメンバーロール
 */
export const getUserTeamMemberRole = async (
  userId: string | mongoose.Types.ObjectId,
  teamId: string | mongoose.Types.ObjectId
): Promise<TeamMemberRole> => {
  // 作成者チェック
  const isCreator = await isTeamCreator(teamId, userId);
  if (isCreator) {
    return TeamMemberRole.CREATOR;
  }

  const membership = await TeamMembership.findOne({
    teamId,
    userId
  });
  
  if (!membership) {
    // メンバーシップが見つからない場合はデフォルト値
    return TeamMemberRole.MEMBER;
  }

  // memberRoleが明示的に設定されている場合はそれを返す
  if (membership.memberRole) {
    return membership.memberRole;
  }
  
  // 後方互換性：isAdminからroleを推測
  return membership.isAdmin ? TeamMemberRole.ADMIN : TeamMemberRole.MEMBER;
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