import { Request, Response } from 'express';
import { SystemSetting } from '../models/SystemSetting';
import { User } from '../models/User';
import { AuthRequest, UserRole } from '../middleware/hybrid-auth.middleware';
import mongoose from 'mongoose';

/**
 * システム設定一覧を取得
 */
export const getSystemSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await SystemSetting.find({});
    return res.status(200).json(settings);
  } catch (error) {
    console.error('システム設定取得エラー:', error);
    return res.status(500).json({ message: 'システム設定の取得に失敗しました' });
  }
};

/**
 * 特定のシステム設定を取得
 */
export const getSystemSetting = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const setting = await SystemSetting.findOne({ key });
    
    if (!setting) {
      return res.status(404).json({ message: '設定が見つかりません' });
    }
    
    return res.status(200).json(setting);
  } catch (error) {
    console.error('システム設定取得エラー:', error);
    return res.status(500).json({ message: 'システム設定の取得に失敗しました' });
  }
};

/**
 * システム設定を更新または作成
 */
export const updateSystemSetting = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    
    const { key } = req.params;
    const { value, description } = req.body;
    
    if (!value) {
      return res.status(400).json({ message: '設定値は必須です' });
    }
    
    // 更新または作成
    const updatedSetting = await SystemSetting.findOneAndUpdate(
      { key },
      {
        value,
        description: description || '管理者による設定',
        updatedBy: new mongoose.Types.ObjectId(req.user.id)
      },
      { new: true, upsert: true }
    );
    
    return res.status(200).json(updatedSetting);
  } catch (error) {
    console.error('システム設定更新エラー:', error);
    return res.status(500).json({ message: 'システム設定の更新に失敗しました' });
  }
};

/**
 * 管理者ユーザー一覧を取得
 */
export const getAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await User.find({
      role: { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] }
    }).select('-password');
    
    return res.status(200).json(admins);
  } catch (error) {
    console.error('管理者一覧取得エラー:', error);
    return res.status(500).json({ message: '管理者一覧の取得に失敗しました' });
  }
};

/**
 * メールアドレスでユーザーを検索し、管理者権限を付与
 */
export const addAdmin = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    
    const { email, role = UserRole.ADMIN } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'メールアドレスは必須です' });
    }
    
    // 指定されたメールアドレスのユーザーを検索
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }
    
    // 既に管理者権限を持っているか確認
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return res.status(400).json({ message: 'このユーザーは既に管理者権限を持っています' });
    }
    
    // 管理者権限を付与
    user.role = role;
    await user.save();
    
    return res.status(200).json({
      message: '管理者権限を付与しました',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('管理者追加エラー:', error);
    return res.status(500).json({ message: '管理者追加に失敗しました' });
  }
};

/**
 * 管理者権限を削除
 */
export const removeAdmin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'ユーザーIDは必須です' });
    }
    
    // ユーザーを検索
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }
    
    // 管理者権限を削除
    user.role = UserRole.USER;
    await user.save();
    
    return res.status(200).json({
      message: '管理者権限を削除しました',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('管理者削除エラー:', error);
    return res.status(500).json({ message: '管理者削除に失敗しました' });
  }
};

/**
 * 管理者の役割を更新
 */
export const updateAdminRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'ユーザーIDは必須です' });
    }
    
    if (!role || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role)) {
      return res.status(400).json({ message: '有効な役割を指定してください' });
    }
    
    // ユーザーを検索
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }
    
    // 既に一般ユーザーの場合はエラー
    if (user.role === UserRole.USER) {
      return res.status(400).json({ message: 'このユーザーは管理者ではありません' });
    }
    
    // 役割を更新
    user.role = role;
    await user.save();
    
    return res.status(200).json({
      message: '管理者役割を更新しました',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('管理者役割更新エラー:', error);
    return res.status(500).json({ message: '管理者役割の更新に失敗しました' });
  }
};

/**
 * システム統計情報を取得
 */
export const getSystemStats = async (req: Request, res: Response) => {
  try {
    // ユーザー統計
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    const usersByRole = {
      [UserRole.USER]: await User.countDocuments({ role: UserRole.USER }),
      [UserRole.ADMIN]: await User.countDocuments({ role: UserRole.ADMIN }),
      [UserRole.SUPER_ADMIN]: await User.countDocuments({ role: UserRole.SUPER_ADMIN })
    };
    
    // 日付範囲で登録統計を取得
    // このサンプルでは過去30日のデータを生成
    const registrationTrend = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // サンプルデータを生成（実際はDBから日付ごとのデータを集計）
      registrationTrend.push({
        date: dateString,
        count: Math.floor(Math.random() * 10)
      });
    }
    
    // AIリクエスト統計（サンプルデータ）
    const aiRequestsByDay = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      aiRequestsByDay.push({
        date: dateString,
        count: Math.floor(Math.random() * 200 + 50)
      });
    }
    
    // 統計情報をレスポンス
    return res.status(200).json({
      userStats: {
        total: totalUsers,
        active: activeUsers,
        byRole: usersByRole,
        registrationTrend
      },
      aiStats: {
        totalRequests: 5843, // サンプル値
        averageResponseTime: 1.2, // サンプル値
        requestsByDay: aiRequestsByDay
      }
    });
  } catch (error) {
    console.error('システム統計取得エラー:', error);
    return res.status(500).json({ message: 'システム統計の取得に失敗しました' });
  }
};

/**
 * 管理者ダッシュボード情報を取得
 */
export const getDashboardInfo = async (req: Request, res: Response) => {
  try {
    // 基本情報を取得
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // アラート情報（サンプル）
    const alerts = [
      {
        userId: '1',
        userName: '山田太郎',
        teamId: 'team1',
        teamName: '開発チーム',
        type: 'motivation_drop',
        level: 'medium',
        description: 'モチベーション低下の兆候があります'
      },
      {
        userId: '2',
        userName: '佐藤次郎',
        teamId: 'team1',
        teamName: '開発チーム',
        type: 'turnover_risk',
        level: 'high',
        description: '離職リスクが高まっています'
      }
    ];
    
    return res.status(200).json({
      totalUsers,
      activeUsers,
      totalTeams: 5, // サンプル値
      alerts
    });
  } catch (error) {
    console.error('ダッシュボード情報取得エラー:', error);
    return res.status(500).json({ message: 'ダッシュボード情報の取得に失敗しました' });
  }
};

/**
 * データベースバックアップ処理
 */
export const backupDatabase = async (req: Request, res: Response) => {
  try {
    // バックアップ処理の実装
    // この例では実際の処理は行わず、成功を返す
    
    return res.status(200).json({
      message: 'データベースバックアップが完了しました',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('データベースバックアップエラー:', error);
    return res.status(500).json({ message: 'データベースバックアップに失敗しました' });
  }
};

/**
 * キャッシュクリア処理
 */
export const clearCache = async (req: Request, res: Response) => {
  try {
    // キャッシュクリア処理の実装
    // この例では実際の処理は行わず、成功を返す
    
    return res.status(200).json({
      message: 'キャッシュクリアが完了しました',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('キャッシュクリアエラー:', error);
    return res.status(500).json({ message: 'キャッシュクリアに失敗しました' });
  }
};

/**
 * チャット履歴全削除処理
 */
export const clearAllChatHistory = async (req: Request, res: Response) => {
  try {
    // チャット履歴削除処理
    // この例では実際の処理は行わず、成功を返す
    
    return res.status(200).json({
      message: 'チャット履歴の全削除が完了しました',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('チャット履歴削除エラー:', error);
    return res.status(500).json({ message: 'チャット履歴削除に失敗しました' });
  }
};