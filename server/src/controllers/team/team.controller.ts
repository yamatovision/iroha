import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../middleware/auth.middleware';
import { teamService } from '../../services/team';
import { BadRequestError } from '../../utils/error-handler';

/**
 * チーム一覧を取得
 */
export const getTeams = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
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
    const { teamId } = req.params;
    const userId = req.user!.id;
    
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
      userId,
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
    
    const updatedTeam = await teamService.updateTeam(teamId, userId, updateData);
    
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
    const userId = req.user!.id;
    
    await teamService.deleteTeam(teamId, userId);
    
    res.status(200).json({
      success: true,
      message: 'チームが正常に削除されました'
    });
  } catch (error) {
    next(error);
  }
};