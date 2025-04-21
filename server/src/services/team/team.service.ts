import mongoose from 'mongoose';
import { Team, ITeamDocument } from '../../models/Team';
import { User } from '../../models/User';
import { TeamMembership } from '../../models/TeamMembership';
import { Friendship } from '../../models/Friendship';
import { InvitationLink } from '../../models/InvitationLink';
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
      creatorId: adminId, // 作成者も同じユーザー
      organizationId,
      description,
      iconColor: iconColor || 'primary',
      iconInitial: name.charAt(0),
      administrators: [adminId] // 管理者配列に追加
    });

    // チーム作成者（管理者）を自動的にチームメンバーとして追加
    try {
      // team._idはObjectIDなので型エラーを解消するために明示的に変換
      const teamId = team._id as mongoose.Types.ObjectId;
      
      // TeamMembership経由でメンバー追加
      await TeamMembership.create({
        teamId: teamId,
        userId: adminId,
        role: 'チーム管理者',
        isAdmin: true,
        joinedAt: new Date()
      });
      
      // 後方互換性のために、Userモデルにもチーム情報を追加
      await User.findByIdAndUpdate(
        adminId,
        {
          teamId: teamId,
          teamRole: 'チーム管理者'
        }
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
  // ユーザーのチームメンバーシップを取得
  const memberships = await TeamMembership.find({ userId });
  if (!memberships || memberships.length === 0) {
    // 後方互換性のためにUserモデルのteamIdもチェック
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('ユーザーが見つかりません');
    }
    
    if (user.teamId) {
      // 古いデータ形式で保存されている場合は、そのチームを返す
      const team = await Team.findById(user.teamId);
      return team ? [team] : [];
    }
    
    // それ以外は管理者チームのみをチェック
    return await Team.find({ adminId: userId });
  }
  
  // チームIDのリストを抽出
  const teamIds = memberships.map(membership => membership.teamId);
  
  // 管理者として管理しているチームも含める
  const adminTeams = await Team.find({ adminId: userId });
  
  // 管理者チームのIDを取得
  const adminTeamIds = adminTeams.map(team => team._id.toString());
  
  // 重複を除去したチームIDリスト（メンバーシップと管理者の両方を含む）
  const uniqueTeamIds = [...new Set([
    ...teamIds.map(id => id.toString()),
    ...adminTeamIds
  ])];
  
  // チーム情報を取得して返す
  const teams = await Team.find({
    _id: { $in: uniqueTeamIds.map(id => new mongoose.Types.ObjectId(id)) }
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
  const isMember = await isTeamMember(teamId, userId);
  const isAdmin = await isTeamAdmin(teamId, userId);

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

  // 管理者権限チェック
  const isAdmin = await isTeamAdmin(teamId, userId);
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

  // 管理者権限チェック
  const isAdmin = await isTeamAdmin(teamId, userId);
  if (!isAdmin) {
    throw new UnauthorizedError('チームの削除は管理者のみ可能です');
  }

  // チームのメンバーシップを削除
  await TeamMembership.deleteMany({ teamId });
  
  // 後方互換性のため、Userモデルのチーム参照も更新
  await User.updateMany(
    { teamId: teamId },
    { $unset: { teamId: 1, teamRole: 1 } }
  );

  // チームの招待を取り消し
  await InvitationLink.updateMany(
    { teamId, status: 'pending' },
    { status: 'expired' }
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
  
  // チームの管理者一覧をチェック
  if (team.administrators && team.administrators.length > 0) {
    const isInAdminList = team.administrators.some(adminId => 
      adminId && adminId.toString() === userIdStr
    );
    if (isInAdminList) return true;
  }
  
  // 従来のadminIdもチェック
  const adminIdStr = team.adminId ? team.adminId.toString() : '';
  if (adminIdStr === userIdStr) return true;
  
  // TeamMembershipでisAdmin=trueも確認
  const membership = await TeamMembership.findOne({
    teamId,
    userId,
    isAdmin: true
  });
  return !!membership;
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
  // まずTeamMembershipを確認
  const membership = await TeamMembership.findOne({
    teamId,
    userId
  });
  
  if (membership) return true;
  
  // 後方互換性のため、UserモデルのteamIdも確認
  const teamIdStr = teamId.toString();
  const user = await User.findById(userId);

  if (!user || !user.teamId) {
    return false;
  }

  return user.teamId.toString() === teamIdStr;
};

/**
 * 友達からチームメンバーを追加する
 * 
 * @param teamId チームID
 * @param friendId 友達のユーザーID
 * @param role チーム内の役割
 * @param isAdmin 管理者権限を付与するかどうか
 * @returns 作成されたメンバーシップ
 */
export const addFriendToTeam = async (
  teamId: string | mongoose.Types.ObjectId,
  currentUserId: string | mongoose.Types.ObjectId,
  friendId: string | mongoose.Types.ObjectId,
  role: string,
  isAdmin: boolean = false
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // 自分がチーム管理者かどうか確認
  const isUserAdmin = await isTeamAdmin(teamId, currentUserId);
  if (!isUserAdmin) {
    throw new UnauthorizedError('チームメンバーの追加は管理者のみ可能です');
  }

  // 友達の存在確認
  const friend = await User.findById(friendId);
  if (!friend) {
    throw new NotFoundError('指定されたユーザーが見つかりません');
  }

  // 友達関係を確認
  const friendship = await Friendship.findOne({
    $or: [
      { userId1: currentUserId, userId2: friendId, status: 'accepted' },
      { userId1: friendId, userId2: currentUserId, status: 'accepted' }
    ]
  });

  if (!friendship) {
    throw new BadRequestError('友達関係が確認できませんでした');
  }

  // 既にメンバーかどうか確認
  const existingMembership = await TeamMembership.findOne({
    teamId,
    userId: friendId
  });

  if (existingMembership) {
    // 既にメンバーの場合は役割だけ更新
    existingMembership.role = role || existingMembership.role;
    existingMembership.isAdmin = isAdmin;
    await existingMembership.save();
    
    // 後方互換性のため、Userモデルも更新
    await User.findByIdAndUpdate(
      friendId,
      {
        teamId: teamId,
        teamRole: role || ''
      }
    );
    
    return existingMembership;
  }

  // 新規メンバーシップ作成
  const membership = await TeamMembership.create({
    teamId,
    userId: friendId,
    role: role || '',
    isAdmin,
    joinedAt: new Date()
  });
  
  // 後方互換性のため、Userモデルも更新
  await User.findByIdAndUpdate(
    friendId,
    {
      teamId: teamId,
      teamRole: role || ''
    }
  );

  // 新メンバーと既存メンバー間の友達関係確立
  await establishTeamFriendships(teamId, friendId);

  return membership;
};

/**
 * メールアドレスでチームに招待する
 * 
 * @param teamId チームID
 * @param email 招待先メールアドレス
 * @param role チーム内の役割
 * @param inviterId 招待者ID
 * @returns 招待情報
 */
export const inviteUserByEmail = async (
  teamId: string | mongoose.Types.ObjectId,
  email: string,
  role: string,
  inviterId: string | mongoose.Types.ObjectId
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // 招待者の存在確認とチーム管理者権限チェック
  const isAdmin = await isTeamAdmin(teamId, inviterId);
  if (!isAdmin) {
    throw new UnauthorizedError('チームへの招待は管理者のみ可能です');
  }

  // 既存ユーザーか確認
  const existingUser = await User.findOne({ email });

  // 既に招待済みかチェック
  const existingInvitation = await InvitationLink.findOne({
    teamId,
    email,
    type: 'team',
    status: 'pending'
  });

  if (existingInvitation) {
    // 既存の招待があれば、それを有効期限を更新して返す
    existingInvitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7日間
    existingInvitation.role = role;
    await existingInvitation.save();
    
    return {
      invitationCode: existingInvitation.code,
      existingUser: !!existingUser
    };
  }

  // 招待リンク作成
  const invitation = await InvitationLink.create({
    teamId,
    inviterId,
    email,
    type: 'team',
    role,
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7日間
  });

  // メール送信ロジックはここでは実装せず、アプリケーション層で実装

  return {
    invitationCode: invitation.code,
    existingUser: !!existingUser
  };
};

/**
 * チームメンバー間の友達関係を確立する
 * 新しいメンバーがチームに加入したときに呼び出される
 * 
 * @param teamId チームID
 * @param newMemberId 新メンバーID
 */
export const establishTeamFriendships = async (
  teamId: string | mongoose.Types.ObjectId,
  newMemberId: string | mongoose.Types.ObjectId
) => {
  // チームの全メンバーを取得（新メンバーを除く）
  const memberships = await TeamMembership.find({
    teamId,
    userId: { $ne: newMemberId }
  });

  if (!memberships || memberships.length === 0) {
    return { success: true, friendshipsCreated: 0 };
  }

  const memberIds = memberships.map(m => m.userId);

  // 各メンバーと新メンバー間の友達関係を処理
  const friendshipPromises = memberIds.map(async (memberId) => {
    // 既存の友達関係をチェック
    const existingFriendship = await Friendship.findOne({
      $or: [
        { userId1: memberId, userId2: newMemberId },
        { userId1: newMemberId, userId2: memberId }
      ]
    });

    // 既存の友達関係がなければ作成
    if (!existingFriendship) {
      return Friendship.create({
        userId1: memberId,
        userId2: newMemberId,
        status: 'accepted', // 自動承認
        requesterId: memberId, // チームメンバーをリクエスターとする
        acceptedAt: new Date()
      });
    }

    // 既存の友達関係がpendingなら承認
    if (existingFriendship.status === 'pending') {
      existingFriendship.status = 'accepted';
      existingFriendship.acceptedAt = new Date();
      return existingFriendship.save();
    }

    return existingFriendship;
  });

  await Promise.all(friendshipPromises);
  return { success: true, friendshipsCreated: friendshipPromises.length };
};

/**
 * 招待コードからチームに参加する
 * 
 * @param invitationCode 招待コード
 * @param userId ユーザーID
 * @returns 参加結果
 */
export const joinTeamByInvitation = async (
  invitationCode: string,
  userId: string | mongoose.Types.ObjectId
) => {
  // 招待の存在と有効性を確認
  const invitation = await InvitationLink.findOne({
    code: invitationCode,
    type: 'team',
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });

  if (!invitation) {
    throw new NotFoundError('有効な招待が見つかりません');
  }

  // ユーザーの存在確認
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  // メールアドレスの確認（セキュリティ対策）
  if (user.email !== invitation.email) {
    throw new UnauthorizedError('この招待はあなた宛てではありません');
  }

  // チームの存在確認
  const team = await Team.findById(invitation.teamId);
  if (!team) {
    throw new NotFoundError('招待先のチームが見つかりません');
  }

  // チームへのメンバーシップ作成
  const membership = await TeamMembership.findOneAndUpdate(
    { userId, teamId: invitation.teamId },
    {
      userId,
      teamId: invitation.teamId,
      role: invitation.role || '',
      isAdmin: false,
      joinedAt: new Date()
    },
    { upsert: true, new: true }
  );

  // 後方互換性のため、Userモデルも更新
  await User.findByIdAndUpdate(
    userId,
    {
      teamId: invitation.teamId,
      teamRole: invitation.role || ''
    }
  );

  // チームメンバー間の友達関係を確立
  if (invitation.teamId) {
    await establishTeamFriendships(invitation.teamId.toString(), userId);
  }

  // 招待ステータスを更新
  invitation.status = 'accepted';
  await invitation.save();

  return {
    success: true,
    team,
    membership
  };
};

/**
 * ユーザーの所属チーム一覧（メンバーシップ情報含む）を取得
 * 
 * @param userId ユーザーID 
 * @returns チームとメンバーシップ情報
 */
export const getUserTeamsWithMemberships = async (userId: string | mongoose.Types.ObjectId) => {
  // TeamMembership経由でチームを取得
  const memberships = await TeamMembership.find({ userId });
  
  // チームIDを抽出
  const teamIds = memberships.map(m => m.teamId);
  
  // 管理者として管理しているチームも含める
  const adminTeams = await Team.find({ 
    $or: [
      { adminId: userId },
      { administrators: userId }
    ]
  });
  
  // 管理者チームのIDを追加
  const adminTeamIds = adminTeams.map(team => team._id ? team._id.toString() : '');
  
  // メンバーシップがないが管理者になっているチームの場合、メンバーシップを作成
  for (const teamId of adminTeamIds) {
    if (!teamIds.some(id => id.toString() === teamId)) {
      // メンバーシップなしの管理者チーム
      await TeamMembership.findOneAndUpdate(
        { userId, teamId },
        {
          userId,
          teamId,
          role: 'チーム管理者',
          isAdmin: true,
          joinedAt: new Date()
        },
        { upsert: true }
      );
    }
  }
  
  // 最新のメンバーシップ情報を取得
  const updatedMemberships = await TeamMembership.find({ userId })
    .sort({ joinedAt: -1 });
  
  // 重複を除去したチームIDリスト
  const uniqueTeamIds = [...new Set([
    ...updatedMemberships.map(m => m.teamId.toString())
  ])];
  
  // チーム情報を取得
  const teams = await Team.find({
    _id: { $in: uniqueTeamIds.map(id => new mongoose.Types.ObjectId(id)) }
  });
  
  // チーム情報とメンバーシップ情報を結合
  return teams.map(team => {
    const teamIdStr = team._id ? team._id.toString() : '';
    const membership = updatedMemberships.find(
      m => m.teamId.toString() === teamIdStr
    );
    
    return {
      team,
      membership: membership || null,
      isAdmin: membership?.isAdmin || false
    };
  });
};
