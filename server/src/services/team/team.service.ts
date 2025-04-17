import mongoose from 'mongoose';
import { Team, ITeamDocument } from '../../models/Team';
import { User } from '../../models/User';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../../utils/error-handler';
import { addMemberById } from './team-member.service';

export const createTeam = async (
  name: string,
  adminId: string | mongoose.Types.ObjectId,
  organizationId: mongoose.Types.ObjectId,
  description?: string,
  iconColor?: 'primary' | 'water' | 'wood' | 'fire' | 'earth' | 'metal'
): Promise<ITeamDocument> => {
  try {
    // 管理者ユーザーの存在確認
    const admin = await User.findById(adminId);
    if (!admin) {
      throw new NotFoundError('指定された管理者ユーザーが見つかりません');
    }

    const adminIdStr = adminId.toString();

    // チーム作成
    const team = await Team.create({
      name,
      adminId: adminId, // 直接adminIdを使用（すでにString | ObjectIDの型を受け入れるように変更済み）
      organizationId,
      description,
      iconColor: iconColor || 'primary',
      iconInitial: name.charAt(0)
    });

    // チーム作成者（管理者）を自動的にチームメンバーとして追加
    try {
      // team._idはObjectIDなので型エラーを解消するために明示的に変換
      const teamId = team._id as mongoose.Types.ObjectId;
      await addMemberById(
        teamId.toString(), // チームID（明示的に文字列に変換）
        adminId,             // 管理者ID
        'チーム管理者',      // チーム内の役割
        true                // 管理者チェックをスキップ（作成したばかりのチームなので）
      );
    } catch (memberError: any) {
      console.error('チーム作成者をメンバーとして追加できませんでした:', memberError);
      // チーム作成自体は成功しているため、メンバー追加のエラーはスローせずに処理を続行
    }

    return team;
  } catch (error: any) {
    if (error.code === 11000) { // MongoDB 重複キーエラー
      throw new BadRequestError('同じ名前のチームが既に存在します');
    }
    throw error;
  }
};

export const getTeams = async (userId: string | mongoose.Types.ObjectId): Promise<ITeamDocument[]> => {
  // Userコレクションからチームメンバー情報を取得
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  const userIdStr = userId.toString();

  // 管理者として管理しているチームと所属しているチームを取得
  const teams = await Team.find({
    $or: [
      { adminId: userId }, // 直接userId（Firebase UID）を使用
      { _id: user.teamId }
    ]
  });

  return teams;
};

export const getTeamById = async (
  teamId: string | mongoose.Types.ObjectId, 
  userId: string | mongoose.Types.ObjectId
): Promise<ITeamDocument> => {
  // チーム存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // ユーザーがチームメンバーまたは管理者であるか確認
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  const userIdStr = userId.toString();
  
  // 標準化された関数を使用してメンバーシップを確認
  const isMember = await isTeamMember(teamId, userId);
  
  // adminIdがnullまたはundefinedの場合の対応
  const adminIdStr = team.adminId ? team.adminId.toString() : '';
  const isAdmin = adminIdStr === userIdStr;

  if (!isMember && !isAdmin) {
    throw new UnauthorizedError('このチームにアクセスする権限がありません');
  }

  return team;
};

export const updateTeam = async (
  teamId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId,
  updateData: {
    name?: string;
    description?: string;
    iconColor?: 'primary' | 'water' | 'wood' | 'fire' | 'earth' | 'metal';
    iconInitial?: string;
  }
): Promise<ITeamDocument> => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // 管理者権限チェック - 常にObjectIDを文字列化して比較
  const userIdStr = userId.toString();
  // adminIdがnullまたはundefinedの場合の対応
  const adminIdStr = team.adminId ? team.adminId.toString() : '';
  const isAdmin = adminIdStr === userIdStr;
  
  if (!isAdmin) {
    throw new UnauthorizedError('チーム情報の更新は管理者のみ可能です');
  }

  // 更新データに名前が含まれる場合はiconInitialも更新
  const updatedData: any = { ...updateData };
  if (updateData.name) {
    updatedData.iconInitial = updateData.name.charAt(0);
  }

  // チーム情報更新
  const updatedTeam = await Team.findByIdAndUpdate(
    teamId,
    { $set: updatedData },
    { new: true, runValidators: true }
  );

  if (!updatedTeam) {
    throw new NotFoundError('チームの更新に失敗しました');
  }

  return updatedTeam;
};

export const deleteTeam = async (teamId: string | mongoose.Types.ObjectId, userId: string | mongoose.Types.ObjectId): Promise<void> => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // 管理者権限チェック - 常にObjectIDを文字列化して比較
  const userIdStr = userId.toString();
  // adminIdがnullまたはundefinedの場合の対応
  const adminIdStr = team.adminId ? team.adminId.toString() : '';
  const isAdmin = adminIdStr === userIdStr;
  
  if (!isAdmin) {
    throw new UnauthorizedError('チームの削除は管理者のみ可能です');
  }

  // チームのメンバーのteamId参照を削除
  await User.updateMany(
    { teamId: teamId },
    { $unset: { teamId: 1, teamRole: 1 } }
  );

  // チーム削除
  await Team.findByIdAndDelete(teamId);
};

export const isTeamAdmin = async (teamId: string | mongoose.Types.ObjectId, userId: string | mongoose.Types.ObjectId): Promise<boolean> => {
  const team = await Team.findById(teamId);
  if (!team) {
    return false;
  }
  
  // ユーザー情報を取得してSuperAdmin権限も確認
  const user = await User.findById(userId);
  if (!user) {
    return false;
  }
  
  // SuperAdminロールの場合、常に管理者権限があると見なす
  if (user.role === 'SuperAdmin') {
    return true;
  }
  
  // 通常のチーム管理者確認 - 常に文字列化して比較
  const userIdStr = userId.toString();
  // adminIdがnullまたはundefinedの場合の対応
  const adminIdStr = team.adminId ? team.adminId.toString() : '';
  return adminIdStr === userIdStr;
};

/**
 * ユーザーが指定されたチームのメンバーかどうかを確認する
 * チームメンバーシップの標準化された確認方法
 * 
 * @param teamId チームID
 * @param userId ユーザーID
 * @returns メンバーの場合はtrue、そうでない場合はfalse
 */
export const isTeamMember = async (teamId: string | mongoose.Types.ObjectId, userId: string | mongoose.Types.ObjectId): Promise<boolean> => {
  const teamIdStr = teamId.toString();
  const user = await User.findById(userId);

  if (!user || !user.teamId) {
    return false;
  }

  return user.teamId.toString() === teamIdStr;
};
