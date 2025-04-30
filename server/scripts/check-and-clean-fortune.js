// チームコンテキスト運勢の確認と削除
require('dotenv').config();
const mongoose = require('mongoose');

async function checkAndCleanFortune() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB接続成功');
    
    // コレクションに直接アクセス（モデル定義を避ける）
    const collection = mongoose.connection.db.collection('teamcontextfortunes');
    
    // 特定のチームIDのデータを検索
    const teamId = '6805e8e7952f7bda054b4477';
    const teamIdObj = new mongoose.Types.ObjectId(teamId);
    
    const records = await collection.find({ teamId: teamIdObj }).toArray();
    
    console.log(`チーム ${teamId} のレコード数: ${records.length}`);
    
    for (const record of records) {
      console.log(`\nレコードID: ${record._id}`);
      console.log(`ユーザーID: ${record.userId}`);
      console.log(`日付: ${new Date(record.date).toISOString().split('T')[0]}`);
      console.log(`teamContextAdvice長さ: ${record.teamContextAdvice?.length || 0}文字`);
      
      if (record.teamContextAdvice) {
        console.log(`サンプル: ${record.teamContextAdvice.substring(0, 50)}...`);
      }
      
      // 短すぎるデータを削除
      if (record.teamContextAdvice?.length < 100) {
        console.log(`短すぎるデータを削除します (${record.teamContextAdvice?.length || 0}文字)...`);
        await collection.deleteOne({ _id: record._id });
        console.log('削除完了');
      }
    }
    
  } catch (e) {
    console.error('エラー:', e);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB接続を閉じました');
  }
}

// スクリプト実行
checkAndCleanFortune();