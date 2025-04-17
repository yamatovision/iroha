import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { DailyFortuneUpdateLog, SystemSetting, DailyFortune } from '../../models';
import mongoose from 'mongoose';
import { fortuneService } from '../../services/fortune.service';

// ローカルでの型定義（Userモデルに合わせる）
enum UserRole {
  USER = 'User',
  ADMIN = 'Admin',
  SUPER_ADMIN = 'SuperAdmin'
}

/**
 * 運勢更新設定を取得する
 */
export const getFortuneUpdateSettings = async (req: Request, res: Response) => {
  try {
    // 運勢更新時間の設定を取得
    const setting = await SystemSetting.findOne({ key: 'fortune_update_time' });
    
    if (!setting) {
      // デフォルト値を返す
      return res.status(200).json({
        key: 'fortune_update_time',
        value: '03:00',
        description: '毎日の運勢更新実行時間',
        updatedAt: new Date(),
        updatedBy: null
      });
    }
    
    return res.status(200).json(setting);
  } catch (error) {
    console.error('運勢更新設定取得エラー:', error);
    return res.status(500).json({ message: '運勢更新設定の取得に失敗しました' });
  }
};

/**
 * 運勢更新設定を更新する
 */
export const updateFortuneUpdateSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    
    // SuperAdmin権限チェック
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ message: '運勢更新設定の変更にはSuperAdmin権限が必要です' });
    }
    
    const { value, description } = req.body;
    
    // 入力検証
    if (!value) {
      return res.status(400).json({ message: '設定値は必須です' });
    }
    
    // 時間フォーマット検証（HH:MM形式）
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(value)) {
      return res.status(400).json({ message: '時間は「HH:MM」形式で指定してください（例: 03:00）' });
    }
    
    // 運勢更新時間の設定を更新または作成
    const setting = await SystemSetting.findOneAndUpdate(
      { key: 'fortune_update_time' },
      {
        value,
        description: description || '毎日の運勢更新実行時間',
        updatedBy: req.user.id // MongoDBのObjectID
      },
      { new: true, upsert: true }
    );
    
    return res.status(200).json(setting);
  } catch (error) {
    console.error('運勢更新設定更新エラー:', error);
    return res.status(500).json({ message: '運勢更新設定の更新に失敗しました' });
  }
};

/**
 * 運勢更新ログ一覧を取得する
 */
export const getFortuneUpdateLogs = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status, startDate, endDate } = req.query;
    
    // ページネーションパラメータ
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    // フィルター条件
    const filter: any = {};
    
    // ステータス条件
    if (status && ['scheduled', 'running', 'completed', 'failed'].includes(status as string)) {
      filter.status = status;
    }
    
    // 日付条件
    if (startDate || endDate) {
      filter.date = {};
      
      if (startDate) {
        filter.date.$gte = new Date(startDate as string);
      }
      
      if (endDate) {
        // 終了日の23:59:59までを含める
        const endDateTime = new Date(endDate as string);
        endDateTime.setHours(23, 59, 59, 999);
        filter.date.$lte = endDateTime;
      }
    }
    
    // 総件数取得
    const totalLogs = await DailyFortuneUpdateLog.countDocuments(filter);
    
    // ログ一覧取得
    const logs = await DailyFortuneUpdateLog.find(filter)
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limitNumber);
    
    return res.status(200).json({
      logs,
      pagination: {
        total: totalLogs,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(totalLogs / limitNumber)
      }
    });
  } catch (error) {
    console.error('運勢更新ログ取得エラー:', error);
    return res.status(500).json({ message: '運勢更新ログの取得に失敗しました' });
  }
};

/**
 * 運勢更新ログ詳細を取得する
 */
export const getFortuneUpdateLogDetail = async (req: Request, res: Response) => {
  try {
    const { logId } = req.params;
    
    // ログ詳細取得
    const log = await DailyFortuneUpdateLog.findById(logId);
    
    if (!log) {
      return res.status(404).json({ message: '運勢更新ログが見つかりません' });
    }
    
    return res.status(200).json(log);
  } catch (error) {
    console.error('運勢更新ログ詳細取得エラー:', error);
    return res.status(500).json({ message: '運勢更新ログの取得に失敗しました' });
  }
};

/**
 * 手動で運勢更新を実行する
 */
export const runFortuneUpdate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    
    // SuperAdmin権限チェック
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ message: '運勢更新の実行にはSuperAdmin権限が必要です' });
    }
    
    const { targetDate, targetUserIds } = req.body;
    
    // 入力検証
    let updateDate = new Date();
    if (targetDate) {
      updateDate = new Date(targetDate);
      
      // 日付の検証
      if (isNaN(updateDate.getTime())) {
        return res.status(400).json({ message: '有効な日付を指定してください' });
      }
    }
    
    // ユーザーIDのバリデーション（指定されている場合）
    if (targetUserIds && !Array.isArray(targetUserIds)) {
      return res.status(400).json({ message: 'targetUserIdsは配列で指定してください' });
    }
    
    // アクティブユーザー数を取得
    const User = mongoose.model('User');
    const totalUsers = targetUserIds 
      ? targetUserIds.length 
      : await User.countDocuments({ isActive: true });
    
    // 新しい運勢更新ログを作成
    const newLog = new DailyFortuneUpdateLog({
      date: updateDate,
      status: 'scheduled',
      startTime: new Date(),
      totalUsers: totalUsers, // アクティブユーザー数を設定
      successCount: 0,
      failedCount: 0,
      isAutomaticRetry: false,
      createdBy: req.user.id // MongoDBのObjectID
    });
    
    await newLog.save();
    
    // 実際の運勢生成処理を開始（バックグラウンドで実行）
    // TODO: 本格的な実装は別途行う予定
    try {
      // 動的インポートではなく、直接バッチ関数を呼び出す
      const userId = req.user?.id || '';
      
      // 非同期で実行するが結果は待たない
      setTimeout(async () => {
        try {
          // 直接バッチ関数のロジックを実装
          // fortuneServiceはファイル先頭でインポート済み
          
          // Userモデルからユーザーを取得
          const User = mongoose.model('User');
          const users = await User.find({ isActive: true }).limit(100);
          
          let successCount = 0;
          let failedCount = 0;
          let updateErrors: any[] = [];
          
          // 各ユーザーの運勢を更新
          for (const user of users) {
            try {
              if (!user._id) continue;
              const userId = String(user._id);
              
              // 手動更新なので既存のデータを削除してから生成
              const targetDate = new Date(updateDate);
              targetDate.setHours(0, 0, 0, 0);
              
              // 既存の運勢データを削除
              await DailyFortune.deleteOne({
                userId: userId,
                date: {
                  $gte: targetDate,
                  $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
                }
              });
              
              // 新しい運勢データを生成
              await fortuneService.generateFortune(userId, updateDate, true);
              successCount++;
            } catch (error) {
              failedCount++;
              const errorMsg = error instanceof Error ? error.message : String(error);
              const stack = error instanceof Error ? error.stack : undefined;
              updateErrors.push({ userId: String(user._id), message: errorMsg, stack });
              console.error(`ユーザー ${user._id} の運勢生成中にエラー:`, errorMsg);
            }
          }
          
          // 結果オブジェクトを作成
          const result = {
            success: failedCount === 0,
            message: `運勢更新処理が完了しました。更新ユーザー数: ${successCount}, 失敗: ${failedCount}`,
            date: updateDate,
            totalUsers: users.length,
            successCount,
            failedCount,
            updateErrors: updateErrors.length > 0 ? updateErrors : undefined
          };
          console.log('運勢更新バッチ実行結果:', result);
          
          // 成功時にログを更新
          await DailyFortuneUpdateLog.findByIdAndUpdate(newLog._id, {
            status: result.success ? 'completed' : 'failed',
            endTime: new Date(),
            successCount: result.successCount || 0,
            failedCount: result.failedCount || 0
          });
        } catch (batchError) {
          console.error('運勢更新バッチ実行エラー:', batchError);
          
          // エラー時にログを更新
          await DailyFortuneUpdateLog.findByIdAndUpdate(newLog._id, {
            status: 'failed',
            endTime: new Date(),
            updateErrors: [{
              userId: 'system',
              message: batchError instanceof Error ? batchError.message : String(batchError)
            }]
          });
        }
      }, 100);
    } catch (error) {
      console.error('バッチ処理開始エラー:', error);
    }
    
    return res.status(200).json({
      message: '運勢更新ジョブを開始しました',
      jobId: newLog._id,
      startTime: newLog.startTime,
      status: newLog.status
    });
  } catch (error) {
    console.error('運勢更新実行エラー:', error);
    return res.status(500).json({ message: '運勢更新ジョブの開始に失敗しました' });
  }
};