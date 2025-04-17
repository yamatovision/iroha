import mongoose from 'mongoose';
import { TeamGoal, ITeamGoalDocument } from '../../models/TeamGoal';
import { Team } from '../../models/Team';
import { User } from '../../models/User';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../../utils/error-handler';
import { isTeamAdmin } from './team.service';

export const getTeamGoal = async (teamId: string | mongoose.Types.ObjectId, userId: string | mongoose.Types.ObjectId): Promise<ITeamGoalDocument | null> => {
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
  
  const isAdmin = await isTeamAdmin(teamId, userId);
  const isMember = requestUser.teamId && requestUser.teamId.toString() === teamIdStr;
  
  if (!isAdmin && !isMember) {
    throw new UnauthorizedError('このチームの目標情報にアクセスする権限がありません');
  }

  // チーム目標取得
  const goal = await TeamGoal.findOne({ teamId });
  return goal;
};

export const createOrUpdateTeamGoal = async (
  teamId: string | mongoose.Types.ObjectId,
  adminId: string | mongoose.Types.ObjectId,
  goalData: {
    content: string;
    deadline?: Date;
    status?: 'not_started' | 'in_progress' | 'at_risk' | 'completed';
    progress?: number;
    collaborators?: string[];
  }
): Promise<ITeamGoalDocument> => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  const teamIdStr = teamId.toString();
  const adminIdStr = adminId.toString();

  // 管理者権限チェック
  if (team.adminId.toString() !== adminIdStr) {
    throw new UnauthorizedError('チーム目標の設定は管理者のみ可能です');
  }

  // collaboratorsが指定されている場合、有効なユーザーIDかチェック
  if (goalData.collaborators && goalData.collaborators.length > 0) {
    const validCollaborators = await User.find({
      _id: { $in: goalData.collaborators },
      teamId: teamIdStr
    });
    
    // 存在する有効なチームメンバーのIDのみを使用
    // 型安全なマッピング
    const validIds: string[] = [];
    validCollaborators.forEach(user => {
      if (user._id) {
        validIds.push(user._id.toString());
      }
    });
    
    goalData.collaborators = validIds;
  }

  // goalDataを適切な形に変換（collaboratorsをObjectIDに）
  const formattedGoalData = {
    ...goalData,
    collaborators: goalData.collaborators?.map(id => new mongoose.Types.ObjectId(id))
  };

  // 既存の目標を検索
  const existingGoal = await TeamGoal.findOne({ teamId });

  if (existingGoal) {
    // 既存の目標を更新
    const updatedGoal = await TeamGoal.findByIdAndUpdate(
      existingGoal._id,
      { $set: formattedGoalData },
      { new: true, runValidators: true }
    );

    if (!updatedGoal) {
      throw new Error('チーム目標の更新に失敗しました');
    }

    return updatedGoal;
  } else {
    // 新しい目標を作成
    const newGoal = await TeamGoal.create({
      teamId,
      ...formattedGoalData
    });

    return newGoal;
  }
};

export const updateTeamGoalProgress = async (
  teamId: string | mongoose.Types.ObjectId,
  adminId: string | mongoose.Types.ObjectId,
  progress: number,
  status?: 'not_started' | 'in_progress' | 'at_risk' | 'completed'
): Promise<ITeamGoalDocument> => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  const teamIdStr = teamId.toString();
  const adminIdStr = adminId.toString();

  // 管理者権限チェック
  if (team.adminId.toString() !== adminIdStr) {
    throw new UnauthorizedError('チーム目標の進捗更新は管理者のみ可能です');
  }

  // 進捗率の範囲チェック
  if (progress < 0 || progress > 100) {
    throw new BadRequestError('進捗率は0から100の間である必要があります');
  }

  // 目標の存在確認
  const goal = await TeamGoal.findOne({ teamId });
  if (!goal) {
    throw new NotFoundError('チーム目標が設定されていません');
  }

  // 更新データの準備
  const updateData: { progress: number; status?: string } = { progress };
  if (status) {
    updateData.status = status;
  }
  
  // 進捗率が100%のとき、ステータスを自動的に「完了」に設定
  if (progress === 100 && !status) {
    updateData.status = 'completed';
  }

  // 目標を更新
  const updatedGoal = await TeamGoal.findByIdAndUpdate(
    goal._id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedGoal) {
    throw new Error('チーム目標の更新に失敗しました');
  }

  return updatedGoal;
};