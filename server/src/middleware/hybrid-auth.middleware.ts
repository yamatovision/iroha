import { Request, Response, NextFunction } from 'express';
import { User, IUserDocument } from '../models/User';
import { JwtService } from '../services/jwt.service';
import mongoose from 'mongoose';

// Userモデルに合わせた独自の権限列挙型
export enum UserRole {
  USER = 'User',
  ADMIN = 'Admin',
  SUPER_ADMIN = 'SuperAdmin'
}

/**
 * リクエスト型拡張 - ユーザー情報を含める
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    organizationId?: string;
  };
}

/**
 * 認証不要なパスのリスト
 * フォーム入力支援など、認証前に必要となるエンドポイント
 */
const PUBLIC_PATHS = [
  // JWT認証関連のエンドポイント
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh-token',
  
  // 四柱推命プロフィール関連の公開API
  '/api/v1/saju-profiles/available-cities',
  '/api/v1/saju-profiles/city-coordinates',
  '/api/v1/saju-profiles/local-time-offset',
];

/**
 * 認証をバイパスできるパスかチェックする
 * @param path リクエストパス
 * @returns 認証不要なパスならtrue
 */
const isPublicPath = (path: string): boolean => {
  return PUBLIC_PATHS.some(publicPath => 
    path === publicPath || 
    (publicPath.endsWith('/') ? path.startsWith(publicPath) : path.startsWith(publicPath + '/'))
  );
};

/**
 * JWT認証ミドルウェア
 * トークンの検証とユーザー情報の取得を行います
 */
export const hybridAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 認証不要なパスの場合はスキップ
  if (isPublicPath(req.path)) {
    return next();
  }

  try {
    // トークンをヘッダーまたはクエリパラメータから取得
    let token: string | undefined;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1];
    }
    
    // クエリパラメータからのトークン取得（SSE用）
    if (!token && req.query.token) {
      token = req.query.token as string;
    }
    
    if (!token) {
      return res.status(401).json({ message: '認証トークンがありません' });
    }
    
    // JWTトークンの検証
    const verification = JwtService.verifyAccessToken(token);
    
    if (!verification.valid || !verification.payload) {
      return res.status(401).json({ message: '無効なトークンです' });
    }
    
    const userId = verification.payload.sub;
    if (!userId) {
      return res.status(401).json({ message: 'トークンにユーザーIDがありません' });
    }
    
    // データベースからユーザー情報を取得
    const user = await User.findById(userId) as IUserDocument;
    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }
    
    // トークンバージョンの検証
    if (user.tokenVersion !== undefined && 
        verification.payload.tokenVersion !== undefined &&
        user.tokenVersion > verification.payload.tokenVersion) {
      return res.status(401).json({ 
        message: 'トークンバージョンが無効です', 
        code: 'TOKEN_VERSION_INVALID' 
      });
    }
    
    // ユーザー情報をリクエストに添付
    req.user = {
      id: user._id ? user._id.toString() : userId,
      email: user.email,
      role: user.role as UserRole,
      organizationId: user.organizationId ? user.organizationId.toString() : undefined
    };
    
    next();
  } catch (error) {
    console.error('JWT認証エラー:', error);
    return res.status(401).json({ message: '認証処理中にエラーが発生しました' });
  }
};

/**
 * 管理者権限を検証するミドルウェア
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: '認証されていません' });
  }
  
  if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ message: '管理者権限が必要です' });
  }
  
  next();
};

/**
 * スーパー管理者権限を検証するミドルウェア
 */
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: '認証されていません' });
  }
  
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ message: 'スーパー管理者権限が必要です' });
  }
  
  next();
};