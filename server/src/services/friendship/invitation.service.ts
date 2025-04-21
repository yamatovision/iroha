import mongoose from 'mongoose';
import { 
  User, 
  InvitationLink, 
  Friendship, 
  Team, 
  TeamMembership 
} from '../../models';
import { 
  NotFoundError, 
  BadRequestError, 
  UnauthorizedError 
} from '../../utils/error-handler';
import { establishTeamFriendships } from '../team';

/**
 * 招待処理サービス - 招待リンクの生成と処理を担当
 */

/**
 * 友達招待リンクの作成
 * @param inviterId 招待者ID
 * @param email 招待先メールアドレス
 * @returns 生成された招待情報
 */
export const createFriendInvitation = async (inviterId: string, email: string) => {
  // 招待者の存在確認
  const inviter = await User.findById(inviterId);
  if (!inviter) {
    throw new NotFoundError('招待者が見つかりません');
  }

  // 自分自身を招待しようとしている場合
  if (inviter.email === email) {
    throw new BadRequestError('自分自身を招待することはできません');
  }

  // 既存ユーザーか確認 (必要な場合のみ)
  const existingUser = await User.findOne({ email });

  // 既存の招待がないか確認
  const existingInvitation = await InvitationLink.findOne({
    inviterId,
    email,
    type: 'friend',
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });

  if (existingInvitation) {
    return {
      invitationCode: existingInvitation.code,
      existingUser: !!existingUser
    };
  }

  // 新しい招待リンクを作成
  const invitation = await InvitationLink.create({
    inviterId,
    email,
    type: 'friend',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7日間有効
  });

  // TODO: メール送信ロジック
  // EmailService.sendFriendInvitation(email, invitation.code, inviter.displayName);

  return {
    invitationCode: invitation.code,
    existingUser: !!existingUser
  };
};

/**
 * チーム招待リンクの作成
 * @param teamId チームID
 * @param inviterId 招待者ID
 * @param email 招待先メールアドレス
 * @param role メンバー役割 (オプション)
 * @returns 生成された招待情報
 */
export const createTeamInvitation = async (
  teamId: string,
  inviterId: string,
  email: string,
  role?: string
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // 招待者がチーム管理者か確認
  const membership = await TeamMembership.findOne({
    userId: inviterId,
    teamId,
    isAdmin: true
  });

  if (!membership) {
    throw new UnauthorizedError('チーム招待の権限がありません');
  }

  // 招待者の存在確認
  const inviter = await User.findById(inviterId);
  if (!inviter) {
    throw new NotFoundError('招待者が見つかりません');
  }

  // 自分自身を招待しようとしている場合
  if (inviter.email === email) {
    throw new BadRequestError('自分自身を招待することはできません');
  }

  // 既存ユーザーか確認
  const existingUser = await User.findOne({ email });

  // 既に招待済みかチェック
  const existingInvitation = await InvitationLink.findOne({
    teamId,
    email,
    type: 'team',
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });

  if (existingInvitation) {
    return {
      invitationCode: existingInvitation.code,
      existingUser: !!existingUser
    };
  }

  // 招待先ユーザーが既にチームメンバーかチェック
  if (existingUser) {
    const existingMembership = await TeamMembership.findOne({
      userId: existingUser._id,
      teamId
    });

    if (existingMembership) {
      throw new BadRequestError('このユーザーは既にチームメンバーです');
    }
  }

  // 新しい招待リンクを作成
  const invitation = await InvitationLink.create({
    teamId,
    inviterId,
    email,
    type: 'team',
    role: role || '',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7日間有効
  });

  // TODO: メール送信ロジック
  // EmailService.sendTeamInvitation(email, invitation.code, inviter.displayName, team.name);

  return {
    invitationCode: invitation.code,
    existingUser: !!existingUser
  };
};

/**
 * 招待コードの検証と情報取得
 * @param invitationCode 招待コード
 * @returns 招待情報
 */
export const getInvitationInfo = async (invitationCode: string) => {
  // 招待コードを検証
  const invitation = await InvitationLink.findOne({
    code: invitationCode,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });

  if (!invitation) {
    throw new NotFoundError('無効な招待コードか、期限切れです');
  }

  // 招待者情報取得
  const inviter = await User.findById(invitation.inviterId);
  if (!inviter) {
    throw new NotFoundError('招待者情報が見つかりません');
  }

  // 招待情報を返す
  const result: any = {
    type: invitation.type,
    inviter: {
      id: inviter._id,
      displayName: inviter.displayName
    },
    email: invitation.email
  };

  // チーム招待の場合、チーム情報も取得
  if (invitation.type === 'team' && invitation.teamId) {
    const team = await Team.findById(invitation.teamId);
    if (team) {
      result.team = {
        id: team._id,
        name: team.name,
        description: team.description,
        memberCount: await TeamMembership.countDocuments({ teamId: team._id })
      };
    }
  }

  return result;
};

/**
 * 招待の処理 (承認または拒否)
 * @param invitationCode 招待コード
 * @param userId ユーザーID (現在ログインしているユーザー)
 * @param action 'accept' | 'reject' のアクション
 * @returns 処理結果
 */
export const processInvitation = async (
  invitationCode: string,
  userId: string,
  action: 'accept' | 'reject' = 'accept'
) => {
  // 招待コードを検証
  const invitation = await InvitationLink.findOne({
    code: invitationCode,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });

  if (!invitation) {
    throw new NotFoundError('無効な招待コードか、期限切れです');
  }

  // ログインユーザーの取得
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('ユーザー情報が見つかりません');
  }

  // 招待先メールアドレスとユーザーのメールアドレスが一致するか確認
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new BadRequestError('招待されたメールアドレスとログインユーザーが一致しません');
  }

  // 招待者情報
  const inviter = await User.findById(invitation.inviterId);
  if (!inviter) {
    throw new NotFoundError('招待者情報が見つかりません');
  }

  // 拒否の場合
  if (action === 'reject') {
    invitation.status = 'expired';
    await invitation.save();
    return { success: true, action: 'rejected' };
  }

  try {
    // 招待タイプに応じた処理
    if (invitation.type === 'friend') {
      // 友達関係の承認処理
      await processFriendInvitation(invitation, userId);
    } else if (invitation.type === 'team') {
      // チーム招待の承認処理
      await processTeamInvitation(invitation, userId);
    }

    // 招待ステータスを更新
    invitation.status = 'accepted';
    await invitation.save();

    return {
      success: true,
      type: invitation.type,
      team: invitation.teamId ? await Team.findById(invitation.teamId) : null
    };
  } catch (error) {
    console.error('招待処理エラー:', error);
    throw error;
  }
};

/**
 * 友達招待の処理
 * @param invitation 招待情報
 * @param userId 受諾するユーザーID
 */
const processFriendInvitation = async (invitation: any, userId: string) => {
  // 既存の友達関係をチェック
  const existingFriendship = await Friendship.findOne({
    $or: [
      { userId1: invitation.inviterId, userId2: userId },
      { userId1: userId, userId2: invitation.inviterId }
    ]
  });

  if (existingFriendship) {
    if (existingFriendship.status === 'accepted') {
      // 既に友達関係がある場合は何もしない
      return existingFriendship;
    }

    // pending または rejected の場合は accepted に更新
    existingFriendship.status = 'accepted';
    existingFriendship.acceptedAt = new Date();
    return await existingFriendship.save();
  }

  // 新しい友達関係を作成
  return await Friendship.create({
    userId1: invitation.inviterId,
    userId2: userId,
    status: 'accepted',
    requesterId: invitation.inviterId,
    acceptedAt: new Date()
  });
};

/**
 * チーム招待の処理
 * @param invitation 招待情報
 * @param userId 受諾するユーザーID
 */
const processTeamInvitation = async (invitation: any, userId: string) => {
  // チームの存在確認
  if (!invitation.teamId) {
    throw new BadRequestError('チーム情報が見つかりません');
  }

  const team = await Team.findById(invitation.teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // 既にメンバーかチェック
  const existingMembership = await TeamMembership.findOne({
    teamId: invitation.teamId,
    userId
  });

  if (existingMembership) {
    // 既にメンバーの場合は何もしない
    return existingMembership;
  }

  // チームメンバーシップ作成
  const membership = await TeamMembership.create({
    teamId: invitation.teamId,
    userId,
    role: invitation.role || '',
    isAdmin: false,
    joinedAt: new Date()
  });

  // チームメンバー間の相互友達関係確立
  await establishTeamFriendships(invitation.teamId.toString(), userId);

  return membership;
};

/**
 * 招待リンクの取り消し (発行者のみ可能)
 * @param invitationId 招待ID
 * @param userId 現在のユーザーID (招待の発行者であること)
 * @returns 取り消し結果
 */
export const cancelInvitation = async (invitationId: string, userId: string) => {
  // 招待の存在確認
  const invitation = await InvitationLink.findOne({
    _id: invitationId,
    inviterId: userId,
    status: 'pending'
  });

  if (!invitation) {
    throw new NotFoundError('招待が見つかりません');
  }

  // 招待の状態を expired に更新
  invitation.status = 'expired';
  await invitation.save();

  return { success: true, message: '招待を取り消しました' };
};

/**
 * ユーザーが作成した招待一覧の取得
 * @param userId ユーザーID
 * @param status ステータスでフィルタリング (オプション)
 * @returns 招待一覧
 */
export const getUserInvitations = async (
  userId: string,
  status: 'pending' | 'accepted' | 'expired' | 'all' = 'pending'
) => {
  // クエリ条件の設定
  const query: any = { inviterId: userId };
  
  // 特定のステータスでフィルタリング
  if (status !== 'all') {
    query.status = status;
  }

  // 招待一覧取得
  const invitations = await InvitationLink.find(query).sort({ createdAt: -1 });

  // チーム情報とメール情報を付加
  const result = await Promise.all(
    invitations.map(async (invitation) => {
      const invitationObj = invitation.toObject();
      
      // チーム招待の場合はチーム情報も取得
      if (invitation.type === 'team' && invitation.teamId) {
        const team = await Team.findById(invitation.teamId);
        if (team) {
          // Type Assertionを使用して型エラーを回避
          (invitationObj as any).teamInfo = {
            name: team.name,
            description: team.description
          };
        }
      }
      
      return invitationObj;
    })
  );

  return result;
};

/**
 * 有効期限切れの招待を自動的に expired に更新
 * バッチジョブなどで定期的に実行する想定
 */
export const cleanupExpiredInvitations = async () => {
  const result = await InvitationLink.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );

  return {
    success: true,
    updatedCount: result.modifiedCount
  };
};

// 招待サービスのエクスポート
export default {
  createFriendInvitation,
  createTeamInvitation,
  getInvitationInfo,
  processInvitation,
  cancelInvitation,
  getUserInvitations,
  cleanupExpiredInvitations
};