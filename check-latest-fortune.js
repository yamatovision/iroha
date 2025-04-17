/**
 * 最新の運勢データを確認するスクリプト
 * 
 * このスクリプトは、データベース内の最新の運勢データを確認するために使用します。
 * 運勢更新バッチが正しく実行されたかどうかを確認するのに役立ちます。
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

// データベース接続情報
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DBNAME || 'dailyfortune'; // 修正：正しいデータベース名

async function checkLatestFortune() {
  console.log('最新の運勢データを確認しています...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('MongoDBに接続しました');
    
    const db = client.db(dbName);
    
    // 直近の運勢更新ログを確認
    const logs = await db.collection('dailyfortuneupdatelogs')
      .find({})
      .sort({ startTime: -1 })
      .limit(5)
      .toArray();
    
    console.log('\n======= 直近の運勢更新ログ =======');
    if (logs.length === 0) {
      console.log('運勢更新ログが見つかりません');
    } else {
      logs.forEach((log, index) => {
        console.log(`\n[${index + 1}] 更新情報:`);
        console.log(` - 日付: ${new Date(log.date).toLocaleDateString()}`);
        console.log(` - ステータス: ${log.status}`);
        console.log(` - 開始時間: ${new Date(log.startTime).toLocaleString()}`);
        console.log(` - 終了時間: ${log.endTime ? new Date(log.endTime).toLocaleString() : 'なし'}`);
        console.log(` - 総ユーザー数: ${log.totalUsers}`);
        console.log(` - 成功数: ${log.successCount}`);
        console.log(` - 失敗数: ${log.failedCount}`);
      });
    }
    
    // システム設定の運勢更新時間を確認
    const fortuneUpdateSetting = await db.collection('systemsettings')
      .findOne({ key: 'fortuneUpdateTime' });
    
    console.log('\n======= 運勢更新時間設定 =======');
    if (!fortuneUpdateSetting) {
      console.log('運勢更新時間の設定が見つかりません（デフォルト: 03:00）');
    } else {
      console.log(`運勢更新時間: ${fortuneUpdateSetting.value}`);
      console.log(`最終更新: ${new Date(fortuneUpdateSetting.updatedAt).toLocaleString()}`);
      console.log(`説明: ${fortuneUpdateSetting.description}`);
    }
    
    // 最新の運勢データ（サンプル10件）を確認
    const fortunes = await db.collection('dailyfortunes')
      .find({})
      .sort({ date: -1 })
      .limit(10)
      .toArray();
    
    console.log('\n======= 最新の運勢データ（10件） =======');
    if (fortunes.length === 0) {
      console.log('運勢データが見つかりません');
    } else {
      fortunes.forEach((fortune, index) => {
        console.log(`\n[${index + 1}] ユーザーID: ${fortune.userId}`);
        console.log(` - 日付: ${new Date(fortune.date).toLocaleDateString()}`);
        console.log(` - 運勢スコア: ${fortune.fortuneScore}`);
        console.log(` - 更新日時: ${new Date(fortune.updatedAt).toLocaleString()}`);
      });
    }
    
    // バッチジョブログを確認
    const batchLogs = await db.collection('batchjoblogs')
      .find({})
      .sort({ startTime: -1 })
      .limit(5)
      .toArray();
    
    console.log('\n======= 直近のバッチジョブログ =======');
    if (batchLogs.length === 0) {
      console.log('バッチジョブログが見つかりません');
    } else {
      batchLogs.forEach((log, index) => {
        console.log(`\n[${index + 1}] ジョブタイプ: ${log.jobType}`);
        console.log(` - ステータス: ${log.status}`);
        console.log(` - 開始時間: ${new Date(log.startTime).toLocaleString()}`);
        console.log(` - 終了時間: ${log.endTime ? new Date(log.endTime).toLocaleString() : 'なし'}`);
        if (log.result) {
          console.log(` - 結果: ${typeof log.result === 'object' ? JSON.stringify(log.result, null, 2) : log.result}`);
        }
      });
    }
    
  } catch (err) {
    console.error('エラーが発生しました:', err);
  } finally {
    await client.close();
    console.log('\nMongoDBの接続を閉じました');
  }
}

// スクリプトを実行
checkLatestFortune().catch(console.error);