import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../services/jwt.service';
import { User } from '../models/User';
import { AuthRequest } from './hybrid-auth.middleware';
import mongoose from 'mongoose';

/**
 * JWT認証のエッジケースを処理するミドルウェア
 * トークン関連の特殊なケースを検出し、適切に対応する
 */
export const jwtEdgeCaseHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 認証トークンをヘッダーから取得
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // トークンがない場合は何もせずに次へ
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    // 1. トークン検証 - あえて例外をキャッチせず、エラーの種類を検出
    const verification = JwtService.verifyAccessToken(token);
    
    // 特殊処理：間もなく期限切れになるトークン（5分以内）に対して警告ヘッダーを付与
    if (verification.valid && verification.payload.exp) {
      const expiryTime = verification.payload.exp * 1000; // JWT expは秒単位
      const currentTime = Date.now();
      const timeToExpiry = expiryTime - currentTime;
      
      // 期限切れまで5分未満の場合に警告ヘッダーを追加
      if (timeToExpiry > 0 && timeToExpiry < 5 * 60 * 1000) {
        res.setHeader('X-Token-Expiring-Soon', 'true');
        res.setHeader('X-Token-Expires-In', Math.floor(timeToExpiry / 1000).toString());
      }
    }
    
    // 2. ユーザー検証（リクエストにユーザー情報がある場合のみ）
    if (req.user && verification.valid && verification.payload.sub) {
      // トークンバージョン検証 - 古いバージョンのトークンを検出
      const userId = verification.payload.sub;
      const user = await User.findById(userId).select('+tokenVersion');
      
      // ユーザーが存在し、トークンバージョンが一致するか確認
      // トークンバージョンを確認（tokenVersionフィールドがない場合は0とみなす）
      const tokenVersion = verification.payload.tokenVersion || 0;
      const userTokenVersion = user?.tokenVersion || 0;
      
      if (user && userTokenVersion > tokenVersion) {
        // バージョンが古い場合は専用のエラーを返す（クライアントが適切に対応できるよう）
        return res.status(401).json({
          message: 'トークンバージョンが古いため無効です',
          code: 'TOKEN_VERSION_INVALID',
          currentVersion: userTokenVersion,
          tokenVersion: tokenVersion
        });
      }
      
      // 同時ログイン処理（オプショナル機能）
      // この例ではデバイスIDを使用した同時ログイン処理を行うことができる
      const deviceId = req.headers['x-device-id'] as string;
      if (deviceId && user) {
        // 実際のアプリケーションでは、ここでデバイスIDを登録・管理する処理を実装
        // （例：デバイスIDとトークンの関連付けなど）
      }
    }

    // ロギング（必要に応じて）
    // req.jwtMetrics = { /* トークン検証メトリクスなど */ };
    
    next();
  } catch (error) {
    // エラーが発生してもリクエストを止めない（他の認証方法があるかもしれないため）
    console.error('JWT エッジケースハンドラーエラー:', error);
    next();
  }
};

/**
 * リフレッシュトークン再利用検出ミドルウェア
 * 既に使用済みのリフレッシュトークンの再利用を検出する
 */
export const refreshTokenReuseDetector = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // リフレッシュトークンエンドポイントでのみ動作
  if (req.path !== '/refresh-token' || req.method !== 'POST') {
    return next();
  }
  
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return next();
    }
    
    // トークンを検証
    const verification = JwtService.verifyRefreshToken(refreshToken);
    
    if (!verification.valid) {
      return next(); // 通常のエラーはここでは処理しない
    }
    
    const userId = verification.payload?.sub;
    
    if (!userId) {
      return next();
    }
    
    // ユーザー情報を取得
    const user = await User.findById(userId).select('+refreshToken +tokenVersion');
    
    // ユーザーが存在しない場合は次へ
    if (!user) {
      return next();
    }
    
    // 注意：このチェックではリフレッシュトークンの内容自体は比較していません
    // 実際の実装では、保存されているリフレッシュトークンとの一致も検証すべき
    
    // トークンバージョンの不一致を検出（トークン無効化の可能性）
    if (user.tokenVersion !== undefined && 
        verification.payload.tokenVersion !== undefined && 
        user.tokenVersion > verification.payload.tokenVersion) {
      
      // 無効化されたトークンの再利用の可能性があるため、追加セキュリティ対策を実施
      console.warn(`リフレッシュトークン再利用の可能性を検出: ユーザー ${userId}`);
      
      // アクションログ（監査用）
      // 実際のアプリケーションでは監査ログに記録する処理を実装
      
      // セキュリティ対策：ユーザーの全トークンを無効化
      await User.updateOne(
        { _id: userId },
        { 
          $inc: { tokenVersion: 1 },
          $unset: { refreshToken: "" }
        }
      );
      
      // セキュリティアラート用のレスポンス
      return res.status(403).json({
        message: '無効なトークンの再利用が検出されました。セキュリティ上の理由により全てのセッションが無効化されました。',
        code: 'TOKEN_REUSE_DETECTED',
        action: 'SESSIONS_INVALIDATED'
      });
    }
    
    // 問題なければ次へ
    next();
  } catch (error) {
    console.error('リフレッシュトークン再利用検出エラー:', error);
    next();
  }
};

/**
 * ネットワークエラー回復ミドルウェア
 * クライアント側のネットワーク切断からの回復時に適切に対応する
 */
export const networkRecoveryHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // クライアントからの復旧フラグをチェック
  const isRecovering = req.headers['x-network-recovery'] === 'true';
  
  if (isRecovering) {
    // ネットワーク回復中のリクエストには特別なヘッダーを付与
    res.setHeader('X-Recovery-Acknowledged', 'true');
    
    // レスポンスに回復ガイダンスを含める
    res.on('finish', () => {
      // この時点でレスポンスは既に送信されている
      // 実際のアプリケーションでは適切な回復メカニズムを実装
      console.log(`ネットワーク回復リクエスト検出: ${req.method} ${req.path}`);
    });
  }
  
  next();
};