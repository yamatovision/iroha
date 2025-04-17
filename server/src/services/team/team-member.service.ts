import mongoose from 'mongoose';
import { User } from '../../models/User';
import { Team } from '../../models/Team';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../../utils/error-handler';
import { isTeamAdmin as checkTeamAdmin } from './team.service';

// 具体的なドキュメント型を定義
interface IUserDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  displayName?: string;
  email?: string;
  teamRole?: string;
  elementAttribute?: string;
  motivation?: number;
  leaveRisk?: string;
  teamId?: mongoose.Types.ObjectId;
}

/**
 * チームメンバー一覧を取得する
 * @param teamId チームID
 * @param userId リクエスト元ユーザーID（権限チェック用）
 * @returns チームメンバー一覧
 */
export const getTeamMembers = async (teamId: string | mongoose.Types.ObjectId, userId: string | mongoose.Types.ObjectId): Promise<any[]> => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  const teamIdStr = teamId.toString();

  // リクエスト元がチームメンバーまたはチーム管理者かチェック
  const requestUser = await User.findById(userId);
  
  if (!requestUser) {
    throw new NotFoundError('ユーザーが見つかりません');
  }
  
  const isAdmin = await checkTeamAdmin(teamId, userId);
  
  // User.teamIdを使用して一貫したメンバーシップ確認を行う
  const isMember = requestUser.teamId && requestUser.teamId.toString() === teamIdStr;
  
  if (!isAdmin && !isMember) {
    throw new UnauthorizedError('このチームのメンバー情報にアクセスする権限がありません');
  }

  // チーム管理者が自分自身のチームメンバーでない場合は自動追加
  // adminIdが存在するかチェック
  if (!team.adminId) {
    console.warn(`チーム(${teamId})に管理者IDが設定されていません`);
  }
  
  const adminId = team.adminId ? team.adminId.toString() : '';
  const adminUser = adminId ? await User.findById(adminId) : null;
  
  if (adminUser && (!adminUser.teamId || adminUser.teamId.toString() !== teamIdStr)) {
    console.log(`チーム管理者(${adminId})がチームメンバーではないため、自動的に追加します`);
    
    // 管理者をチームメンバーとして追加 (User.teamIdを使用)
    await User.findByIdAndUpdate(
      adminId,
      {
        teamId: teamId,
        teamRole: 'チーム管理者'
      }
    );
  }

  // User.teamIdをベースにしたチームメンバー一覧取得（標準化された方法）
  const members = await User.find(
    { teamId: teamId },
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

  // 何らかの理由で管理者がメンバーに含まれていない場合の対応
  if (adminUser && adminUser._id && adminId && 
      !members.some(member => member._id && member._id.toString() === adminId)) {
    // 管理者のチームロールが設定されていなければデフォルト値を設定
    if (!adminUser.teamRole) {
      adminUser.teamRole = 'チーム管理者';
    }
    members.push(adminUser);
  }

  return members;
};

/**
 * ユーザーIDを使用してチームメンバーを追加する
 * チーム作成時などの内部処理用に使用
 */
export const addMemberById = async (
  teamId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId,
  role?: string,
  skipAdminCheck: boolean = false
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  const teamIdStr = teamId.toString();

  // 追加対象ユーザーの存在確認
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('指定されたユーザーが見つかりません');
  }

  // 管理者チェックをスキップしない場合（通常のケース）
  if (!skipAdminCheck) {
    // 実行者が管理者かどうかを確認
    const isAdmin = await checkTeamAdmin(teamId, userId);
    if (!isAdmin) {
      throw new UnauthorizedError('チームメンバーの追加は管理者のみ可能です');
    }
  }

  // ユーザーが既に別のチームに所属しているかチェック
  if (user.teamId && user.teamId.toString() !== teamIdStr) {
    throw new BadRequestError('このユーザーは既に別のチームに所属しています');
  }

  // ユーザーのチーム情報を更新
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

  const teamIdStr = teamId.toString();
  const adminIdStr = adminId.toString();

  // チーム管理者権限チェック（checkTeamAdmin関数を使用）
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
      // Firebase認証は廃止されたため、直接MongoDBにユーザーを作成
      user = new User({
        _id: new mongoose.Types.ObjectId(), // 自動生成されるMongoDBのObjectID
        email: userEmail,
        password: password, // モンゴースのミドルウェアでハッシュ化される
        displayName: displayName || userEmail.split('@')[0],
        role: 'User',
        teamId: teamId,
        teamRole: role || '',
        plan: 'lite',
        isActive: true
      });
      
      await user.save();
      isNewUser = true;
      
      console.log(`新規ユーザー(${userEmail})を作成しチームメンバーとして追加しました`);
    } catch (error) {
      console.error('新規ユーザー作成エラー:', error);
      throw new Error('新規ユーザーの作成に失敗しました');
    }
  } else if (!user) {
    // ユーザーが存在せず、パスワードも提供されていない場合
    throw new BadRequestError('未登録ユーザーを追加するにはパスワードを指定してください');
  } else {
    // 既存ユーザーの場合、すでに別のチームに所属していないか確認
    if (user.teamId && user.teamId.toString() !== teamIdStr) {
      throw new BadRequestError('このユーザーは既に別のチームに所属しています');
    }
    
    // 既存ユーザーのチーム情報を更新
    user = await User.findByIdAndUpdate(
      user._id,
      {
        teamId,
        teamRole: role || ''
      },
      { new: true }
    );
  }

  if (!user) {
    throw new Error('ユーザー情報の更新に失敗しました');
  }
  
  // レスポンスオブジェクトに新規ユーザーフラグを追加
  const userWithFlag = user.toObject ? user.toObject() : { ...user };
  Object.defineProperty(userWithFlag, 'isNewUser', {
    value: isNewUser,
    enumerable: true
  });

  return userWithFlag;
};

export const updateMemberRole = async (
  teamId: string | mongoose.Types.ObjectId,
  adminId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId,
  role: string
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  const teamIdStr = teamId.toString();
  const adminIdStr = adminId.toString();
  const userIdStr = userId.toString();

  // 管理者権限チェック（checkTeamAdmin関数を使用）
  const isAdmin = await checkTeamAdmin(teamId, adminId);
  if (!isAdmin) {
    throw new UnauthorizedError('チームメンバーの役割変更は管理者のみ可能です');
  }

  // 対象ユーザーの存在確認
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  // ユーザーがチーム管理者であるかチェック
  const isUserTeamAdmin = team.adminId && team.adminId.toString() === userIdStr;

  // チーム管理者であるがまだチームメンバーとして登録されていない場合、自動追加
  if (isUserTeamAdmin && (!user.teamId || user.teamId.toString() !== teamIdStr)) {
    console.log(`チーム管理者(${userIdStr})がチームメンバーではないため、自動的に追加します`);
    
    // 管理者をチームメンバーとして追加
    await User.findByIdAndUpdate(
      userId,
      {
        teamId: teamId
      }
    );
  } 
  // 管理者ではなく、チームに所属していない場合はエラー
  else if (!user.teamId || user.teamId.toString() !== teamIdStr) {
    throw new BadRequestError('指定されたユーザーはこのチームのメンバーではありません');
  }

  // ユーザーの役割を更新
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { teamRole: role },
    { new: true }
  );

  return updatedUser;
};

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

  const teamIdStr = teamId.toString();
  const adminIdStr = adminId.toString();
  const userIdStr = userId.toString();

  // 管理者権限チェック（checkTeamAdmin関数を使用）
  const isAdmin = await checkTeamAdmin(teamId, adminId);
  if (!isAdmin) {
    throw new UnauthorizedError('チームメンバーの削除は管理者のみ可能です');
  }

  // 管理者自身をチームから削除することはできない
  if (userIdStr === adminIdStr) {
    throw new BadRequestError('チーム管理者をメンバーから削除することはできません');
  }

  // 対象ユーザーがチームに所属しているか確認
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  if (!user.teamId || user.teamId.toString() !== teamIdStr) {
    throw new BadRequestError('指定されたユーザーはこのチームのメンバーではありません');
  }

  // ユーザーのチーム情報をクリア
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $unset: { teamId: 1, teamRole: 1 } },
    { new: true }
  );

  return updatedUser;
};