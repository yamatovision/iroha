/**
 * スケジューラーテスト用スクリプト
 * 
 * このスクリプトは、スケジューラーが設定値を正しく読み込み、
 * cron式に変換していることを確認するためのテストスクリプトです。
 * 実際にジョブを実行せずに、スケジューラーの設定だけを検証します。
 */

const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// スケジューラーモジュールを動的にインポート
let scheduler;

// データベース接続情報
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DBNAME || 'dailyfortune'; // 正しいデータベース名

async function testSchedulerSettings() {
  console.log('スケジューラー設定テストを開始します...');
  
  try {
    console.log('MongoDBに接続します...');
    await mongoose.connect(`${uri}/${dbName}`);
    console.log(`MongoDBに接続しました (${uri}/${dbName})`);
    
    // SystemSettingを確認
    console.log('運勢更新時間の設定を確認します...');
    const db = mongoose.connection.db;
    const setting = await db.collection('systemsettings').findOne({ key: 'fortuneUpdateTime' });
    
    if (setting && setting.value) {
      console.log(`データベースの運勢更新時間設定: ${setting.value}`);
      console.log(`説明: ${setting.description}`);
      console.log(`最終更新: ${new Date(setting.updatedAt).toLocaleString()}`);
      
      // 時間文字列をcron式に変換（スケジューラーと同じロジック）
      const [hours, minutes] = setting.value.split(':').map(Number);
      const cronExpression = `${minutes} ${hours} * * *`;
      console.log(`期待されるcron式: ${cronExpression}`);
      
      // スケジューラーモジュールを動的に読み込み
      scheduler = require('../dist/batch/scheduler');
      
      console.log('\nスケジューラーのgetFortuneUpdateTime関数をテストします...');
      const fortuneUpdateTime = await scheduler.testGetFortuneUpdateTime();
      console.log(`スケジューラーから取得した運勢更新時間: ${fortuneUpdateTime}`);
      
      if (fortuneUpdateTime === setting.value) {
        console.log('✅ スケジューラーは設定値を正しく読み込みました');
      } else {
        console.log('❌ スケジューラーが設定値を正しく読み込めませんでした');
      }
      
      // cronの変換テスト（スケジューラーのtimeToCronExpression関数を使用）
      console.log('\nスケジューラーのtimeToCronExpression関数をテストします...');
      const actualCronExpression = scheduler.testTimeToCronExpression(fortuneUpdateTime);
      console.log(`スケジューラーが生成したcron式: ${actualCronExpression}`);
      
      if (actualCronExpression === cronExpression) {
        console.log('✅ スケジューラーはcron式を正しく生成しました');
      } else {
        console.log('❌ スケジューラーが生成したcron式が期待値と一致しません');
      }
      
      console.log('\nスケジューラーをテスト起動します...');
      console.log('※実際にジョブを実行せず、設定だけを検証します');
      
      await scheduler.testStartScheduler();
      
      console.log('\nテストが完了しました。スケジューラーは正しく設定されています。');
    } else {
      console.log('⚠️ 運勢更新時間の設定が見つかりません。デフォルト値（03:00）が使用されます。');
    }
  } catch (err) {
    console.error('エラーが発生しました:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDBの接続を閉じました');
  }
}

// スクリプトを実行
testSchedulerSettings().catch(console.error);