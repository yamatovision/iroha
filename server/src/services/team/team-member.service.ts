import mongoose from 'mongoose';
import { User } from '../../models/User';
import { Team } from '../../models/Team';
import { TeamMembership } from '../../models/TeamMembership';
import { Friendship } from '../../models/Friendship';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../../utils/error-handler';
import { isTeamAdmin as checkTeamAdmin, establishTeamFriendships, isTeamMember } from './team.service';

// 具体的なドキュメント型を定義
interface IUserDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  displayName?: string;
  email?: string;
  teamRole?: string; // 後方互換性のために保持
  elementAttribute?: string;
  motivation?: number;
  leaveRisk?: string;
  teamId?: mongoose.Types.ObjectId; // 後方互換性のために保持
}

// メンバーデータ型
interface ITeamMemberData {
  _id: mongoose.Types.ObjectId | string;
  displayName: string;
  email: string;
  role: string; // teamRoleをroleに変替
  teamRole?: string; // 後方互換性のため
  elementAttribute?: string;
  motivation?: number;
  leaveRisk?: string;
  isAdmin?: boolean;
  joinedAt?: Date;
  isNewUser?: boolean;
  [key: string]: any; // その他の拡張プロパティに対応
}

/**
 * チームメンバー一覧を取得する
 * @param teamId チームID
 * @param userId リクエスト元ユーザーID（権限チェック用）
 * @returns チームメンバー一覧
 */
export const getTeamMembers = async (teamId: string | mongoose.Types.ObjectId, userId: string | mongoose.Types.ObjectId): Promise<ITeamMemberData[]> => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // リクエスト元がチームメンバーまたはチーム管理者かチェック
  const isAdmin = await checkTeamAdmin(teamId, userId);
  
  // TeamMembership経由でメンバーシップ確認
  const requestMembership = await TeamMembership.findOne({ 
    teamId, 
    userId 
  });
  
  // 後方互換性のため、User.teamIdも確認
  const requestUser = await User.findById(userId);
  if (!requestUser) {
    throw new NotFoundError('ユーザーが見つかりません');
  }
  
  // チーム所属チェック - TeamMembershipが適切な方法
  const isMemberViaUser = await isTeamMember(teamId, userId);
  
  if (!isAdmin && !requestMembership && !isMemberViaUser) {
    throw new UnauthorizedError('このチームのメンバー情報にアクセスする権限がありません');
  }

  // TeamMembership経由でメンバー取得
  const memberships = await TeamMembership.find({ teamId })
    .populate('userId', 'displayName email elementAttribute motivation leaveRisk');
  
  // メンバーシップに紐づくユーザー情報をフォーマット
  const membershipUsers = memberships.map(membership => {
    const user = membership.userId as any; // 型キャスト
    return {
      _id: user._id,
      displayName: user.displayName,
      email: user.email,
      elementAttribute: user.elementAttribute,
      motivation: user.motivation,
      leaveRisk: user.leaveRisk,
      teamRole: membership.role, // TeamMembershipからのrole
      isAdmin: membership.isAdmin,
      joinedAt: membership.joinedAt
    };
  });
  
  // 後方互換性のため、User.teamId経由でも補完的にメンバーを取得
  const legacyMembers = await User.find(
    { 
      teamId, 
      _id: { $nin: membershipUsers.map(user => user._id) } // 重複を避ける
    },
    {
      _id: 1,
      displayName: 1,
      email: 1,
      teamRole: 1,
      elementAttribute: 1,
      motivation: 1,
      leaveRisk: 1
    }
  );
  
  // メンバー一覧を統合
  // legacyMembersのフィールド名を統一（teamRoleをroleに変換）
  const formattedLegacyMembers = legacyMembers.map(member => {
    const legacyMember: ITeamMemberData = {
      _id: member._id as mongoose.Types.ObjectId,
      displayName: member.displayName || '',
      email: member.email || '',
      role: '', // メンバー役割は不明なのでデフォルト空
      teamRole: '', // 後方互換性のため
      elementAttribute: member.elementAttribute,
      motivation: member.motivation,
      leaveRisk: member.leaveRisk,
      isAdmin: false,
      joinedAt: new Date()
    };
    return legacyMember;
  });
  
  // 型を明示的に指定し、Union型からITeamMemberData[]型へ変換
  const allMembers = [
    ...membershipUsers, 
    ...formattedLegacyMembers.map(legacy => {
      // formattedLegacyMembersの各要素をITeamMemberData型に適合させる
      return {
        ...legacy,
        role: legacy.teamRole || '' // ITeamMemberDataが要求するroleプロパティを追加
      };
    })
  ] as ITeamMemberData[]; // Type Assertionを使用して型を強制
  
  // チーム管理者は確実に含める
  if (team.adminId) {
    const adminId = team.adminId.toString();
    const adminIncluded = allMembers.some(member => {
      const memberId = typeof member._id === 'string' ? member._id : member._id.toString();
      return memberId === adminId;
    });
    
    if (!adminIncluded) {
      const adminUser = await User.findById(adminId, {
        _id: 1,
        displayName: 1,
        email: 1,
        teamRole: 1,
        elementAttribute: 1,
        motivation: 1,
        leaveRisk: 1
      });
      
      if (adminUser) {
        // 型安全なadminUserデータの生成
        const adminData: ITeamMemberData = {
          _id: adminUser._id as mongoose.Types.ObjectId,
          displayName: adminUser.displayName || '',
          email: adminUser.email || '',
          role: 'チーム管理者',
          teamRole: 'チーム管理者',
          elementAttribute: adminUser.elementAttribute,
          motivation: adminUser.motivation,
          leaveRisk: adminUser.leaveRisk,
          isAdmin: true,
          joinedAt: new Date()
        };
        
        // メンバーとして追加
        allMembers.push(adminData);
        
        // TeamMembershipがない場合は作成
        const adminMembership = await TeamMembership.findOne({ 
          teamId, 
          userId: adminId 
        });
        
        if (!adminMembership) {
          await TeamMembership.create({
            teamId,
            userId: adminId,
            role: 'チーム管理者',
            isAdmin: true,
            joinedAt: new Date()
          });
        }
      }
    }
  }
  
  // 管理者配列のメンバーも確実に含める
  if (team.administrators && team.administrators.length > 0) {
    for (const adminId of team.administrators) {
      if (!adminId) continue;
      
      const adminIdStr = adminId.toString();
      const adminIncluded = allMembers.some(member => member._id.toString() === adminIdStr);
      
      if (!adminIncluded) {
        const adminUser = await User.findById(adminId, {
          _id: 1,
          displayName: 1,
          email: 1,
          teamRole: 1,
          elementAttribute: 1,
          motivation: 1,
          leaveRisk: 1
        });
        
        if (adminUser) {
          // adminUserをメンバーとして追加
          const userObj = adminUser.toObject();
          // ITeamMemberData 型に準拠したオブジェクトを作成
          const adminData: ITeamMemberData = {
            _id: userObj._id as mongoose.Types.ObjectId,
            displayName: userObj.displayName || '',
            email: userObj.email || '',
            role: 'チーム管理者',
            teamRole: 'チーム管理者',
            elementAttribute: userObj.elementAttribute,
            motivation: userObj.motivation,
            leaveRisk: userObj.leaveRisk,
            isAdmin: true,
            joinedAt: new Date()
          };
          
          // メンバーとして追加
          allMembers.push(adminData);
          
          // TeamMembershipがない場合は作成
          const adminMembership = await TeamMembership.findOne({ 
            teamId, 
            userId: adminId 
          });
          
          if (!adminMembership) {
            await TeamMembership.create({
              teamId,
              userId: adminId,
              role: 'チーム管理者',
              isAdmin: true,
              joinedAt: new Date()
            });
          }
        }
      }
    }
  }

  // role プロパティを確実に持つよう変換して返す
  return allMembers.map(member => {
    if (!member.role && member.teamRole) {
      member.role = member.teamRole;
    } else if (!member.role) {
      member.role = '';
    }
    return member as ITeamMemberData;
  });
};

/**
 * ユーザーIDを使用してチームメンバーを追加する
 * チーム作成時などの内部処理用に使用
 */
export const addMemberById = async (
  teamId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId,
  role?: string,
  skipAdminCheck: boolean = false,
  isAdmin: boolean = false
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // 追加対象ユーザーの存在確認
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('指定されたユーザーが見つかりません');
  }

  // 管理者チェックをスキップしない場合（通常のケース）
  if (!skipAdminCheck) {
    // 実行者が管理者かどうかを確認
    const isTeamAdmin = await checkTeamAdmin(teamId, userId);
    if (!isTeamAdmin) {
      throw new UnauthorizedError('チームメンバーの追加は管理者のみ可能です');
    }
  }

  // TeamMembershipが既に存在するか確認
  const existingMembership = await TeamMembership.findOne({
    teamId,
    userId
  });

  if (existingMembership) {
    // 既存のメンバーシップを更新
    existingMembership.role = role || existingMembership.role;
    existingMembership.isAdmin = isAdmin || existingMembership.isAdmin;
    await existingMembership.save();
  } else {
    // 新規メンバーシップ作成
    await TeamMembership.create({
      teamId,
      userId,
      role: role || '',
      isAdmin,
      joinedAt: new Date()
    });
  }

  // 後方互換性のため、Userモデルも更新
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      teamId,
      teamRole: role || ''
    },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error('ユーザー情報の更新に失敗しました');
  }

  // メンバー間の友達関係を確立（skip処理時はこれを行わない）
  if (!skipAdminCheck) {
    await establishTeamFriendships(teamId, userId);
  }

  return updatedUser;
};

/**
 * メールアドレスからユーザーを検索してチームメンバーとして追加する
 * 未登録の場合は新規ユーザーを作成する
 * 外部APIエンドポイント用
 */
export const addMember = async (
  teamId: string | mongoose.Types.ObjectId,
  adminId: string | mongoose.Types.ObjectId,
  userEmail: string,
  role?: string,
  password?: string,
  displayName?: string
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // チーム管理者権限チェック
  const isAdmin = await checkTeamAdmin(teamId, adminId);
  if (!isAdmin) {
    throw new UnauthorizedError('チームメンバーの追加は管理者のみ可能です');
  }

  // 追加対象ユーザーの存在確認
  let user = await User.findOne({ email: userEmail });
  let isNewUser = false;
  
  // ユーザーが存在しない場合で、パスワードが提供されていれば新規作成
  if (!user && password) {
    try {
      // 新規ユーザー作成
      user = new User({
        _id: new mongoose.Types.ObjectId(),
        email: userEmail,
        password: password,
        displayName: displayName || userEmail.split('@')[0],
        role: 'User',
        plan: 'lite',
        isActive: true
      });
      
      await user.save();
      isNewUser = true;
      
      console.log(`新規ユーザー(${userEmail})を作成しました`);
    } catch (error) {
      console.error('新規ユーザー作成エラー:', error);
      throw new Error('新規ユーザーの作成に失敗しました');
    }
  } else if (!user) {
    // ユーザーが存在せず、パスワードも提供されていない場合
    throw new BadRequestError('未登録ユーザーを追加するにはパスワードを指定してください');
  }

  if (!user) {
    throw new Error('ユーザー情報の作成に失敗しました');
  }

  // ユーザーをチームに追加
  const userId = user._id ? (typeof user._id === 'string' ? user._id : user._id.toString()) : '';
  if (!userId) {
    throw new Error('ユーザーIDが無効です');
  }
  await addMemberById(
    teamId,
    userId, // 文字列として渡す
    role,
    true, // 管理者チェックをスキップ（既に確認済み）
    false // 管理者権限は付与しない
  );
  
  // レスポンスオブジェクトに新規ユーザーフラグを追加
  const userWithFlag = user.toObject ? user.toObject() : { ...user };
  Object.defineProperty(userWithFlag, 'isNewUser', {
    value: isNewUser,
    enumerable: true
  });

  return userWithFlag;
};

/**
 * チームメンバーの役割を更新する
 */
export const updateMemberRole = async (
  teamId: string | mongoose.Types.ObjectId,
  adminId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId,
  role: string,
  isAdmin: boolean = false
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // 管理者権限チェック
  const hasAdminRights = await checkTeamAdmin(teamId, adminId);
  if (!hasAdminRights) {
    throw new UnauthorizedError('チームメンバーの役割変更は管理者のみ可能です');
  }

  // 対象ユーザーの存在確認
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  // TeamMembership確認
  let membership = await TeamMembership.findOne({
    teamId,
    userId
  });

  if (!membership) {
    // TeamMembershipが存在しない場合は操作不可
    throw new BadRequestError('指定されたユーザーはこのチームのメンバーではありません');
  } else {
    // 既存のメンバーシップを更新
    membership.role = role;
    membership.isAdmin = isAdmin;
    await membership.save();
  }

  // 後方互換性のため、Userモデルも更新
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { teamRole: role },
    { new: true }
  );

  return {
    user: updatedUser,
    membership
  };
};

/**
 * チームからメンバーを削除する
 */
export const removeMember = async (
  teamId: string | mongoose.Types.ObjectId, 
  adminId: string | mongoose.Types.ObjectId, 
  userId: string | mongoose.Types.ObjectId
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  const userIdStr = userId.toString();
  const adminIdStr = adminId.toString();

  // 管理者権限チェック
  const isAdmin = await checkTeamAdmin(teamId, adminId);
  if (!isAdmin) {
    throw new UnauthorizedError('チームメンバーの削除は管理者のみ可能です');
  }

  // 管理者自身をチームから削除することはできない
  if (userIdStr === adminIdStr) {
    throw new BadRequestError('チーム管理者をメンバーから削除することはできません');
  }
  
  // チーム管理者リストに含まれる場合も削除不可
  if (team.administrators && team.administrators.some(id => id && id.toString() === userIdStr)) {
    throw new BadRequestError('チーム管理者をメンバーから削除することはできません');
  }

  // メンバーシップを削除
  await TeamMembership.deleteOne({
    teamId,
    userId
  });

  // 後方互換性のため、Userモデルも更新
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $unset: { teamId: 1, teamRole: 1 } },
    { new: true }
  );

  if (!updatedUser) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  return updatedUser;
};

/**
 * 友達をチームメンバーとして追加する
 */
export const addFriendAsMember = async (
  teamId: string | mongoose.Types.ObjectId,
  adminId: string | mongoose.Types.ObjectId,
  friendId: string | mongoose.Types.ObjectId,
  role: string = '',
  isAdmin: boolean = false
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // 管理者権限チェック
  const hasAdminRights = await checkTeamAdmin(teamId, adminId);
  if (!hasAdminRights) {
    throw new UnauthorizedError('チームメンバーの追加は管理者のみ可能です');
  }

  // 友達の存在確認
  const friend = await User.findById(friendId);
  if (!friend) {
    throw new NotFoundError('友達が見つかりません');
  }

  // 友達関係の確認
  const friendship = await Friendship.findOne({
    $or: [
      { userId1: adminId, userId2: friendId, status: 'accepted' },
      { userId1: friendId, userId2: adminId, status: 'accepted' }
    ]
  });

  if (!friendship) {
    throw new BadRequestError('友達関係が確認できませんでした');
  }

  // メンバーシップが既に存在するか確認
  const existingMembership = await TeamMembership.findOne({
    teamId,
    userId: friendId
  });

  if (existingMembership) {
    // 既に存在する場合は更新
    existingMembership.role = role || existingMembership.role;
    existingMembership.isAdmin = isAdmin;
    await existingMembership.save();
    
    // 後方互換性のため、Userモデルも更新
    await User.findByIdAndUpdate(
      friendId,
      {
        teamId,
        teamRole: role || existingMembership.role
      }
    );
    
    return existingMembership;
  }

  // 新規メンバーシップ作成
  const membership = await TeamMembership.create({
    teamId,
    userId: friendId,
    role,
    isAdmin,
    joinedAt: new Date()
  });

  // 後方互換性のため、Userモデルも更新
  await User.findByIdAndUpdate(
    friendId,
    {
      teamId,
      teamRole: role
    }
  );

  // チームメンバー間の友達関係を確立
  await establishTeamFriendships(teamId, friendId);

  return membership;
};