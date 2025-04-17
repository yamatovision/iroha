/**
 * @deprecated このファイルはレガシーです。代わりに hybrid-auth.middleware.ts を使用してください。
 */

import { Request, Response, NextFunction } from 'express';

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
    id: string; // MongoDB ObjectIDを文字列化した値
    email: string;
    role: UserRole;
    organizationId?: string;
  };
}

/**
 * 認証不要なパスのリスト
 */
const PUBLIC_PATHS = [
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
 * レガシー認証ミドルウェア - hybrid-auth.middleware.ts を使用してください
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.warn('レガシー認証ミドルウェアが使用されています。hybrid-auth.middleware.ts に移行してください。');
  
  // 認証不要なパスの場合はスキップ
  if (isPublicPath(req.path)) {
    return next();
  }

  return res.status(401).json({ 
    message: 'レガシー認証は廃止されました。JWT認証システムに移行してください。', 
    code: 'LEGACY_AUTH_DEPRECATED' 
  });
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