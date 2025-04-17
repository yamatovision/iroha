import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/hybrid-auth.middleware';
import { generateDayPillars } from '../../batch/day-pillar-generator';
import { BatchJobLog } from '../../models/BatchJobLog';
import { DayPillar } from '../../models/DayPillar';

// ローカルでの型定義（Userモデルに合わせる）
enum UserRole {
  USER = 'User',
  ADMIN = 'Admin',
  SUPER_ADMIN = 'SuperAdmin'
}

/**
 * 日柱生成ログ一覧を取得する
 */
export const getDayPillarLogs = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    
    // ページネーションパラメータ
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    // フィルター条件
    const filter: any = { jobType: 'day-pillar-generator' };
    
    // ステータス条件
    if (status && ['scheduled', 'running', 'completed', 'completed_with_errors', 'failed'].includes(status as string)) {
      filter.status = status;
    }
    
    // 総件数取得
    const totalLogs = await BatchJobLog.countDocuments(filter);
    
    // ログ一覧取得
    const logs = await BatchJobLog.find(filter)
      .sort({ startTime: -1 })
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
    console.error('日柱生成ログ取得エラー:', error);
    return res.status(500).json({ message: '日柱生成ログの取得に失敗しました' });
  }
};

/**
 * 日柱生成ログ詳細を取得する
 */
export const getDayPillarLogDetail = async (req: Request, res: Response) => {
  try {
    const { logId } = req.params;
    
    // ログ詳細取得
    const log = await BatchJobLog.findById(logId);
    
    if (!log) {
      return res.status(404).json({ message: '日柱生成ログが見つかりません' });
    }
    
    // 日柱生成ジョブでない場合はエラー
    if (log.jobType !== 'day-pillar-generator') {
      return res.status(400).json({ message: '指定されたログは日柱生成ジョブではありません' });
    }
    
    return res.status(200).json(log);
  } catch (error) {
    console.error('日柱生成ログ詳細取得エラー:', error);
    return res.status(500).json({ message: '日柱生成ログの取得に失敗しました' });
  }
};

/**
 * 既存の日柱情報一覧を取得する
 */
export const getDayPillars = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '30', startDate, endDate } = req.query;
    
    // ページネーションパラメータ
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    // フィルター条件
    const filter: any = {};
    
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
    const totalDayPillars = await DayPillar.countDocuments(filter);
    
    // 日柱情報一覧取得
    const dayPillars = await DayPillar.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNumber);
    
    return res.status(200).json({
      dayPillars,
      pagination: {
        total: totalDayPillars,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(totalDayPillars / limitNumber)
      }
    });
  } catch (error) {
    console.error('日柱情報一覧取得エラー:', error);
    return res.status(500).json({ message: '日柱情報の取得に失敗しました' });
  }
};

/**
 * 手動で日柱生成を実行する
 */
export const runDayPillarGeneration = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '認証されていません' });
    }
    
    // SuperAdmin権限チェック
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ message: '日柱生成の実行にはSuperAdmin権限が必要です' });
    }
    
    const { days = 30 } = req.body;
    
    // 入力検証
    const daysNumber = parseInt(String(days), 10);
    if (isNaN(daysNumber) || daysNumber <= 0 || daysNumber > 365) {
      return res.status(400).json({ message: '生成日数は1～365の間で指定してください' });
    }
    
    // バッチ処理ログの作成
    console.log(`日柱生成開始 - 生成日数: ${daysNumber}日`);
    const batchLog = new BatchJobLog({
      jobType: 'day-pillar-generator',
      status: 'started', // 'scheduled'から'started'に変更（モデルで定義された有効な値）
      startTime: new Date(),
      params: { days: daysNumber },
      scheduledBy: req.user.id // MongoDB ObjectIDを使用
    });
    
    await batchLog.save();
    console.log(`バッチログ作成完了: ${batchLog._id}`);
    
    
    // 実際の日柱生成処理を開始（バックグラウンドで実行）
    // 非同期で実行するが結果は待たない
    // より確実にエラーを捕捉するためにtry-catchでラップ
    setTimeout(async () => {
      console.log(`日柱生成バッチ開始: ${daysNumber}日分`);
      
      // 環境変数チェック
      if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI環境変数が設定されていません');
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      try {
        try {
          // 日柱生成バッチ処理を実行
          console.log(`generateDayPillars関数を呼び出します...(日数: ${daysNumber})`);
          // 明示的に数値型として渡す
          const result = await generateDayPillars(Number(daysNumber));
          console.log('日柱生成バッチ実行結果:', result);
          
          console.log('日柱生成バッチ実行が完了しました');
          // 成功時にログを更新
          await BatchJobLog.findByIdAndUpdate(batchLog._id, {
            status: result.success ? 'completed' : 'completed_with_errors',
            endTime: new Date(),
            result
          });
        } catch (genError) {
          console.error('generateDayPillars内部エラー:', genError);
          throw genError;
        }
      } catch (batchError) {
        console.error('日柱生成バッチ実行エラー:', batchError);
        
        // エラー時にログを更新
        await BatchJobLog.findByIdAndUpdate(batchLog._id, {
          status: 'failed',
          endTime: new Date(),
          result: {
            success: false,
            message: batchError instanceof Error ? batchError.message : String(batchError),
            error: batchError instanceof Error ? batchError.stack : undefined
          }
        });
      }
    }, 100);
    
    return res.status(200).json({
      message: '日柱生成ジョブを開始しました',
      jobId: batchLog._id,
      startTime: batchLog.startTime,
      status: batchLog.status
    });
  } catch (error) {
    console.error('日柱生成実行エラー:', error);
    
    // 詳細なエラーメッセージを返す
    const errorMessage = error instanceof Error 
      ? `日柱生成ジョブの開始に失敗しました: ${error.message}` 
      : '日柱生成ジョブの開始に失敗しました';
    
    return res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
};