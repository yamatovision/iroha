import { Request, Response } from 'express';
import { User } from '../../models/User';
import mongoose from 'mongoose';

/**
 * 認証管理コントローラー
 * JWT認証に関する管理機能を提供します
 */
export class AuthManagementController {
  /**
   * 認証統計情報を取得
   * @param req リクエスト
   * @param res レスポンス
   */
  static async getAuthStats(req: Request, res: Response): Promise<void> {
    try {
      // ユーザー認証タイプの集計（JWT認証・Firebase認証・両方対応）
      const totalUsers = await User.countDocuments();
      const usersWithJwt = await User.countDocuments({ refreshToken: { $exists: true, $ne: null } });
      // Firebase関連の参照は削除されたため、これらの値は0に固定
      const usersWithFirebase = 0;
      const hybridUsers = 0;
      
      // トークンバージョン統計
      const tokenVersionStats = await User.aggregate([
        { 
          $match: { 
            tokenVersion: { $exists: true } 
          } 
        },
        {
          $group: {
            _id: "$tokenVersion",
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      
      // 最近のログイン統計
      const lastDayLogins = await User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      const lastWeekLogins = await User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });
      
      // 認証関連エラー数（実際のシステムではログから取得）
      // ここではモックデータを返す
      const authErrors = {
        invalidToken: 0,
        expiredToken: 0,
        refreshFailures: 0,
        lastDay: 0
      };
      
      res.status(200).json({
        totalUsers,
        authStats: {
          jwt: usersWithJwt,
          firebase: usersWithFirebase,
          hybrid: hybridUsers,
          noAuth: totalUsers - usersWithJwt - usersWithFirebase + hybridUsers, // 重複を調整
        },
        tokenVersions: tokenVersionStats,
        activity: {
          lastDayLogins,
          lastWeekLogins,
        },
        errors: authErrors,
        migrationProgress: {
          completed: usersWithJwt,
          total: totalUsers,
          percentage: totalUsers > 0 ? Math.round((usersWithJwt / totalUsers) * 100) : 0
        }
      });
    } catch (error) {
      console.error('認証統計取得エラー:', error);
      res.status(500).json({ 
        message: '認証統計情報の取得中にエラーが発生しました',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * 特定ユーザーの認証状態を取得
   * @param req リクエスト
   * @param res レスポンス
   */
  static async getUserAuthState(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      // ユーザーを検索（リフレッシュトークンも含めて取得）
      const user = await User.findById(userId).select('+refreshToken');
      
      if (!user) {
        res.status(404).json({ message: 'ユーザーが見つかりません' });
        return;
      }
      
      // 認証状態情報を構築
      const authState = {
        userId: String(user._id),
        email: user.email,
        displayName: user.displayName,
        authMethods: {
          jwt: user.refreshToken ? true : false,
          firebase: false // Firebase認証は完全に廃止されました
        },
        tokenVersion: user.tokenVersion || 0,
        lastLogin: user.lastLogin || null,
        // リフレッシュトークンそのものは安全のため返さない
        hasRefreshToken: !!user.refreshToken,
        // Firebase関連フィールドは削除されました
      };
      
      res.status(200).json(authState);
    } catch (error) {
      console.error('ユーザー認証状態取得エラー:', error);
      res.status(500).json({ 
        message: 'ユーザー認証状態の取得中にエラーが発生しました',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * 特定ユーザーのトークンを無効化
   * @param req リクエスト
   * @param res レスポンス
   */
  static async invalidateUserTokens(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      // ユーザーを検索
      const user = await User.findById(userId);
      
      if (!user) {
        res.status(404).json({ message: 'ユーザーが見つかりません' });
        return;
      }
      
      // トークンバージョンをインクリメントして古いトークンを無効化
      const currentVersion = user.tokenVersion || 0;
      const updateResult = await User.updateOne(
        { _id: userId },
        { 
          $set: { tokenVersion: currentVersion + 1 },
          $unset: { refreshToken: "" }
        }
      );
      
      if (updateResult.modifiedCount === 0) {
        res.status(500).json({ message: 'トークン無効化に失敗しました' });
        return;
      }
      
      res.status(200).json({ 
        message: 'ユーザートークンが正常に無効化されました',
        userId,
        oldTokenVersion: currentVersion,
        newTokenVersion: currentVersion + 1
      });
    } catch (error) {
      console.error('トークン無効化エラー:', error);
      res.status(500).json({ 
        message: 'トークン無効化中にエラーが発生しました',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * 認証移行統計を取得
   * @param req リクエスト
   * @param res レスポンス
   */
  static async getMigrationStats(req: Request, res: Response): Promise<void> {
    try {
      // 全ユーザー数
      const totalUsers = await User.countDocuments();
      
      // JWT認証に移行済みのユーザー数
      const migratedUsers = await User.countDocuments({
        refreshToken: { $exists: true, $ne: null }
      });
      
      // Firebase認証は完全に廃止されました
      const firebaseOnlyUsers = 0;
      
      // ハイブリッド認証のユーザーも存在しません
      const hybridUsers = 0;
      
      // 7日以内にログインしたが移行していないユーザー
      const activeNonMigratedUsers = await User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        refreshToken: { $exists: false }
      });
      
      // 計算した統計情報を返す
      res.status(200).json({
        totalUsers,
        migrationStatus: {
          migrated: migratedUsers,
          firebaseOnly: firebaseOnlyUsers,
          hybrid: hybridUsers,
          noAuth: totalUsers - migratedUsers - firebaseOnlyUsers + hybridUsers, // 重複を調整
        },
        migrationProgress: {
          percentage: totalUsers > 0 ? Math.round((migratedUsers / totalUsers) * 100) : 0,
          remainingActiveUsers: activeNonMigratedUsers
        },
        recommendedAction: activeNonMigratedUsers > 10 
          ? 'アクティブユーザーが多数未移行です。移行キャンペーンを検討してください。'
          : 'スムーズに移行が進行中です。特別なアクションは不要です。'
      });
    } catch (error) {
      console.error('移行統計取得エラー:', error);
      res.status(500).json({ 
        message: '移行統計情報の取得中にエラーが発生しました',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * 古いトークンのクリーンアップ処理を実行
   * @param req リクエスト
   * @param res レスポンス
   */
  static async runTokenCleanup(req: Request, res: Response): Promise<void> {
    try {
      // 最後のログインから30日以上経過したアカウントのリフレッシュトークンをクリア
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const updateResult = await User.updateMany(
        { 
          lastLogin: { $lt: thirtyDaysAgo },
          refreshToken: { $exists: true, $ne: null }
        },
        {
          $unset: { refreshToken: "" },
          $inc: { tokenVersion: 1 }
        }
      );
      
      // クリーンアップ結果を返す
      res.status(200).json({
        message: 'トークンクリーンアップが正常に完了しました',
        clearedTokens: updateResult.modifiedCount,
        matchedAccounts: updateResult.matchedCount,
        date: new Date(),
        threshold: thirtyDaysAgo
      });
    } catch (error) {
      console.error('トークンクリーンアップエラー:', error);
      res.status(500).json({ 
        message: 'トークンクリーンアップ中にエラーが発生しました',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// コントローラーの各メソッドをエクスポート
export const getAuthStats = AuthManagementController.getAuthStats;
export const getUserAuthState = AuthManagementController.getUserAuthState;
export const invalidateUserTokens = AuthManagementController.invalidateUserTokens;
export const getMigrationStats = AuthManagementController.getMigrationStats;
export const runTokenCleanup = AuthManagementController.runTokenCleanup;