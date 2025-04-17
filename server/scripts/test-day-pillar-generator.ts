/**
 * 日柱生成バッチ処理のテストスクリプト
 * このスクリプトは手動実行用です
 */
import { generateDayPillars } from '../src/batch/day-pillar-generator';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/config/database';
import { BatchJobLog } from '../src/models/BatchJobLog';
import { DayPillar } from '../src/models/DayPillar';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

// メイン処理
async function main() {
  try {
    console.log('日柱生成バッチ処理テストを開始します');
    
    // データベース接続
    if (mongoose.connection.readyState !== 1) {
      console.log('データベースに接続します...');
      await connectToDatabase();
      console.log('データベースに接続しました');
    }
    
    // バッチ処理ログとDayPillarのコレクション情報を表示
    const batchCount = await BatchJobLog.countDocuments({ jobType: 'day-pillar-generator' });
    const dayPillarCount = await DayPillar.countDocuments({});
    
    console.log(`現在のバッチ処理ログ数: ${batchCount}`);
    console.log(`現在の日柱情報数: ${dayPillarCount}`);
    
    // テスト実行（少ない日数で実行）
    console.log('\n5日分の日柱情報を生成します...');
    const result = await generateDayPillars(5);
    
    // 結果表示
    console.log('\n===== 実行結果 =====');
    console.log(`成功: ${result.success}`);
    console.log(`メッセージ: ${result.message}`);
    console.log(`合計対象日数: ${result.total}`);
    console.log(`生成数: ${result.created}`);
    console.log(`スキップ数: ${result.skipped}`);
    console.log(`エラー数: ${result.errors}`);
    
    if (result.errorDetails) {
      console.log('\n===== エラー詳細 =====');
      console.log(result.errorDetails);
    }
    
    // 最新の日柱情報を表示
    const latestDayPillars = await DayPillar.find({})
      .sort({ date: -1 })
      .limit(5);
    
    console.log('\n===== 最新の日柱情報 =====');
    latestDayPillars.forEach(dp => {
      console.log(`日付: ${dp.date.toISOString().split('T')[0]}, 天干: ${dp.heavenlyStem}, 地支: ${dp.earthlyBranch}`);
    });
    
    // 終了処理
    console.log('\n===== テスト完了 =====');
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  } finally {
    // データベース接続を閉じる
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('データベース接続を閉じました');
    }
  }
}

// スクリプト実行
main().catch(error => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});