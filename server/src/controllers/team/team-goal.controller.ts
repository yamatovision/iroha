import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { teamGoalService } from '../../services/team';
import { BadRequestError } from '../../utils/error-handler';

/**
 * チーム目標を取得
 */
export const getTeamGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const userId = req.user!.id;
    
    const goal = await teamGoalService.getTeamGoal(teamId, userId);
    
    if (!goal) {
      return res.status(200).json({
        success: true,
        message: 'チーム目標は設定されていません',
        goal: null
      });
    }
    
    res.status(200).json({
      success: true,
      goal: {
        id: goal._id,
        teamId: goal.teamId,
        content: goal.content,
        deadline: goal.deadline,
        status: goal.status,
        progress: goal.progress,
        collaborators: goal.collaborators,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * チーム目標を設定・更新
 */
export const createOrUpdateTeamGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const { content, deadline, status, progress, collaborators } = req.body;
    const adminId = req.user!.id;
    
    // 必須パラメータのチェック
    if (!content) {
      throw new BadRequestError('目標内容は必須です');
    }
    
    // 日付形式チェック
    let parsedDeadline;
    if (deadline) {
      parsedDeadline = new Date(deadline);
      if (isNaN(parsedDeadline.getTime())) {
        throw new BadRequestError('期限の日付形式が正しくありません');
      }
    }
    
    // 進捗範囲チェック
    if (progress !== undefined && (progress < 0 || progress > 100)) {
      throw new BadRequestError('進捗は0から100の間である必要があります');
    }
    
    const goalData = {
      content,
      deadline: parsedDeadline,
      status,
      progress,
      collaborators
    };
    
    const goal = await teamGoalService.createOrUpdateTeamGoal(teamId, adminId, goalData);
    
    res.status(200).json({
      success: true,
      message: 'チーム目標が正常に設定されました',
      goal: {
        id: goal._id,
        teamId: goal.teamId,
        content: goal.content,
        deadline: goal.deadline,
        status: goal.status,
        progress: goal.progress,
        collaborators: goal.collaborators,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * チーム目標の進捗を更新
 */
export const updateTeamGoalProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const { progress, status } = req.body;
    const adminId = req.user!.id;
    
    // 必須パラメータのチェック
    if (progress === undefined) {
      throw new BadRequestError('進捗は必須です');
    }
    
    // 進捗範囲チェック
    if (progress < 0 || progress > 100) {
      throw new BadRequestError('進捗は0から100の間である必要があります');
    }
    
    const updatedGoal = await teamGoalService.updateTeamGoalProgress(teamId, adminId, progress, status);
    
    res.status(200).json({
      success: true,
      message: 'チーム目標の進捗が正常に更新されました',
      goal: {
        id: updatedGoal._id,
        teamId: updatedGoal.teamId,
        content: updatedGoal.content,
        deadline: updatedGoal.deadline,
        status: updatedGoal.status,
        progress: updatedGoal.progress,
        collaborators: updatedGoal.collaborators,
        createdAt: updatedGoal.createdAt,
        updatedAt: updatedGoal.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};