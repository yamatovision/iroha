import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/hybrid-auth.middleware';
import { LoginRequest, RegisterRequest, IUser } from '../types/index';
import { AuthService } from '../services';
import { handleError, AuthenticationError, ValidationError } from '../utils';

/**
 * プロフィール情報を取得するコントローラー
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }
    
    const authService = new AuthService();
    const userData = await authService.getProfile(req.user.id);
    
    return res.status(200).json(userData);
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * ユーザー登録処理コントローラー
 */
export const register = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }
    
    const { displayName } = req.body as RegisterRequest;
    if (!displayName) {
      throw new ValidationError('表示名は必須です');
    }
    
    const authService = new AuthService();
    const newUser = await authService.register({
      id: req.user.id, // MongoDB ObjectID
      email: req.user.email || '',
      displayName
    });
    
    return res.status(201).json(newUser);
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * パスワードリセットリクエスト処理コントローラー
 */
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    const authService = new AuthService();
    await authService.requestPasswordReset(email);
    
    return res.status(200).json({ message: 'パスワードリセットメールを送信しました' });
  } catch (error) {
    return handleError(error, res);
  }
};