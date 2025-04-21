import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { UserService } from '../../services';
import { handleError, AuthenticationError, ensureString } from '../../utils';

/**
 * ユーザー一覧を取得する
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const userService = new UserService();
    
    const result = await userService.getUsers({
      page: parseInt(req.query.page as string || '1', 10),
      limit: parseInt(req.query.limit as string || '20', 10),
      role: req.query.role as string,
      plan: req.query.plan as string,
      search: req.query.search as string
    });
    
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * 新規ユーザーを作成する
 */
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }
    
    const userService = new UserService();
    const newUser = await userService.createUser(req.body, {
      id: ensureString(req.user?.id), // MongoDB ObjectID
      role: req.user?.role || 'User'
    });
    
    return res.status(201).json(newUser);
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * ユーザー権限を変更する
 */
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }
    
    const { userId } = req.params;
    const { role } = req.body;
    
    const userService = new UserService();
    const updatedUser = await userService.updateUserRole(userId, role, {
      id: ensureString(req.user?.id), // MongoDB ObjectID
      role: req.user?.role || 'User'
    });
    
    return res.status(200).json(updatedUser);
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * ユーザープランを変更する
 */
export const updateUserPlan = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }
    
    const { userId } = req.params;
    const { plan } = req.body;
    
    const userService = new UserService();
    const updatedUser = await userService.updateUserPlan(userId, plan, {
      id: ensureString(req.user?.id), // MongoDB ObjectID
      role: req.user?.role || 'User'
    });
    
    return res.status(200).json(updatedUser);
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * ユーザーを削除する
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }
    
    const { userId } = req.params;
    
    const userService = new UserService();
    const result = await userService.deleteUser(userId, {
      id: ensureString(req.user?.id), // MongoDB ObjectID
      role: req.user?.role || 'User'
    });
    
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};