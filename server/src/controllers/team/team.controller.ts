import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../middleware/auth.middleware';
import { teamService } from '../../services/team';
import { BadRequestError } from '../../utils/error-handler';
// ユーティリティ関数を直接定義（インポートの問題を回避）
const ensureString = (value: string | undefined | null, defaultValue: string = ''): string => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return value;
};

const ensureObjectIdOrString = (value: any): string | mongoose.Types.ObjectId => {
  if (!value) {
    throw new Error('ID値が指定されていません');
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }
  
  // toString()が使用可能な場合は文字列化
  if (value && typeof value.toString === 'function') {
    return value.toString();
  }
  
  throw new Error('有効なIDではありません');
};

/**
 * チーム一覧を取得
 */
export const getTeams = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 型安全な変換を適用
    const userId = ensureString(req.user?.id);
    const teams = await teamService.getTeams(userId);
    
    res.status(200).json({ 
      success: true, 
      teams: teams.map(team => ({
        id: team._id,
        name: team.name,
        description: team.description,
        iconInitial: team.iconInitial,
        iconColor: team.iconColor,
        adminId: team.adminId,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * チーム詳細を取得
 */
export const getTeamById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teamId = ensureString(req.params.teamId);
    const userId = ensureString(req.user?.id);
    
    const team = await teamService.getTeamById(teamId, userId);
    
    res.status(200).json({
      success: true,
      team: {
        id: team._id,
        name: team.name,
        description: team.description,
        iconInitial: team.iconInitial,
        iconColor: team.iconColor,
        adminId: team.adminId,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 新しいチームを作成
 */
export const createTeam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, iconColor } = req.body;
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;
    
    // 必須パラメータのチェック
    if (!name) {
      throw new BadRequestError('チーム名は必須です');
    }
    
    // organizationIdがundefinedの場合は新しいObjectIdを生成
    const orgId = organizationId ? 
      new mongoose.Types.ObjectId(organizationId) : 
      new mongoose.Types.ObjectId();
    
    const team = await teamService.createTeam(
      name,
      ensureString(userId),
      orgId,
      description,
      iconColor
    );
    
    res.status(201).json({
      success: true,
      message: 'チームが正常に作成されました',
      team: {
        id: team._id,
        name: team.name,
        description: team.description,
        iconInitial: team.iconInitial,
        iconColor: team.iconColor,
        adminId: team.adminId,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * チーム情報を更新
 */
export const updateTeam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const { name, description, iconColor } = req.body;
    const userId = req.user!.id;
    
    // 更新データがあるかチェック
    if (!name && !description && !iconColor) {
      throw new BadRequestError('更新するデータが指定されていません');
    }
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (iconColor) updateData.iconColor = iconColor;
    
    const updatedTeam = await teamService.updateTeam(teamId, ensureString(userId), updateData);
    
    res.status(200).json({
      success: true,
      message: 'チーム情報が正常に更新されました',
      team: {
        id: updatedTeam._id,
        name: updatedTeam.name,
        description: updatedTeam.description,
        iconInitial: updatedTeam.iconInitial,
        iconColor: updatedTeam.iconColor,
        adminId: updatedTeam.adminId,
        createdAt: updatedTeam.createdAt,
        updatedAt: updatedTeam.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * チームを削除
 */
export const deleteTeam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const userId = ensureString(req.user?.id);
    
    await teamService.deleteTeam(teamId, userId);
    
    res.status(200).json({
      success: true,
      message: 'チームが正常に削除されました'
    });
  } catch (error) {
    next(error);
  }
};