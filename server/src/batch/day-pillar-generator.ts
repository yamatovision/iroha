/**
 * 日柱生成バッチ処理
 * 
 * このスクリプトは毎日実行され、未来の日付（デフォルトで30日分）の日柱情報を生成します。
 * 既に生成済みの日付はスキップされ、新しい日付のみが追加されます。
 */

import { SajuEngineService } from '../services/saju-engine.service';
import { DayPillar } from '../models/DayPillar';
import mongoose from 'mongoose';
import { connectToDatabase } from '../config/database';
import { BatchJobLog } from '../models/BatchJobLog';

/**
 * 日柱生成処理のメイン関数
 * @param daysInput 生成する日数（デフォルト30日）
 * @returns 生成結果の情報
 */
export async function generateDayPillars(daysInput?: number): Promise<{
  success: boolean;
  message: string;
  total: number;
  created: number;
  skipped: number;
  errors: number;
  errorDetails?: any;
}> {
  // 明示的に型変換とデフォルト値設定を行う
  const days = daysInput === undefined || isNaN(Number(daysInput)) ? 30 : Number(daysInput);
  console.log(`日柱生成バッチ処理を開始します。対象日数: ${days}日（入力値: ${daysInput}）`);
  
  let logId: string | null = null;
  
  try {
    // 環境変数の確認
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI環境変数が設定されていません');
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    // データベース接続状態のログ出力
    console.log(`データベース接続状態: ${mongoose.connection.readyState} (0:切断, 1:接続済み, 2:接続中, 3:切断中)`);
    
    // データベース接続（既に接続されている場合はスキップ）
    if (mongoose.connection.readyState !== 1) {
      try {
        console.log('データベースに接続します...');
        await connectToDatabase();
        console.log('データベース接続に成功しました');
      } catch (error) {
        console.error('データベース接続エラー:', error);
        throw new Error(`データベース接続エラー: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log('データベースに既に接続されています');
    }
    
    // バッチ実行ログの作成
    const jobLog = new BatchJobLog({
      jobType: 'day-pillar-generator',
      status: 'running',
      startTime: new Date(),
      params: { days }
    });
    await jobLog.save();
    logId = String(jobLog._id);
    
    console.log(`バッチジョブログ作成: ${logId}`);
    
    // SajuEngineServiceのインスタンス作成
    const sajuEngineService = new SajuEngineService();
    
    // 今日の日付
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 結果カウンター
    let created = 0;
    let skipped = 0;
    let errors = 0;
    let errorDetails: any[] = [];
    
    // 指定された日数分のループ
    for (let i = 0; i < days; i++) {
      try {
        // 処理対象の日付
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        
        // 既存データの確認
        const existingDayPillar = await DayPillar.findOne({ 
          date: {
            $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            $lt: new Date(targetDate.setHours(23, 59, 59, 999))
          }
        });
        
        if (existingDayPillar) {
          console.log(`${targetDate.toISOString().split('T')[0]} の日柱情報は既に存在します。スキップします。`);
          skipped++;
          continue;
        }
        
        // 日柱情報の計算
        const dayPillarInfo = sajuEngineService.getDayPillarByDate(targetDate);
        
        // 日柱情報の保存
        const newDayPillar = new DayPillar({
          date: targetDate,
          heavenlyStem: dayPillarInfo.heavenlyStem,
          earthlyBranch: dayPillarInfo.earthlyBranch,
          hiddenStems: dayPillarInfo.hiddenStems || [],
          energyDescription: dayPillarInfo.energyDescription
        });
        
        await newDayPillar.save();
        created++;
        
        console.log(`${targetDate.toISOString().split('T')[0]} の日柱情報を生成しました: ${dayPillarInfo.heavenlyStem}${dayPillarInfo.earthlyBranch}`);
      } catch (error) {
        console.error(`日付 ${new Date(today.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} の日柱生成中にエラーが発生しました:`, error);
        errors++;
        errorDetails.push({
          date: new Date(today.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // バッチ実行ログの更新
    const result = {
      success: errors === 0,
      message: `日柱生成バッチ処理が完了しました。生成済み: ${created}, スキップ: ${skipped}, エラー: ${errors}`,
      total: days,
      created,
      skipped,
      errors,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined
    };
    
    if (logId) {
      await BatchJobLog.findByIdAndUpdate(logId, {
        status: errors === 0 ? 'completed' : 'completed_with_errors',
        endTime: new Date(),
        result
      });
    }
    
    console.log(result.message);
    return result;
    
  } catch (error) {
    console.error('日柱生成バッチ処理でエラーが発生しました:', error);
    
    // バッチ実行ログの更新（エラー状態）
    if (logId) {
      await BatchJobLog.findByIdAndUpdate(logId, {
        status: 'failed',
        endTime: new Date(),
        result: {
          success: false,
          message: `日柱生成バッチ処理が失敗しました: ${error instanceof Error ? error.message : String(error)}`,
          error: error instanceof Error ? error.stack : String(error)
        }
      });
    }
    
    return {
      success: false,
      message: `日柱生成バッチ処理が失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      total: 0,
      created: 0,
      skipped: 0,
      errors: 1,
      errorDetails: error
    };
  } finally {
    // スタンドアロン実行時はデータベース接続を閉じる
    if (require.main === module) {
      await mongoose.disconnect();
      console.log('データベース接続を閉じました');
    }
  }
}

/**
 * スクリプトが直接実行された場合の処理
 */
if (require.main === module) {
  // コマンドライン引数から日数を取得（デフォルト: 30日）
  const days = process.argv[2] ? parseInt(process.argv[2], 10) : 30;
  
  generateDayPillars(days)
    .then(result => {
      console.log('実行結果:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('予期しないエラーが発生しました:', error);
      process.exit(1);
    });
}