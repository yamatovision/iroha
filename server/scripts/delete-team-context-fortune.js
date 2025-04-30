// ユーザーのチームコンテキスト運勢データを削除するスクリプト
require('dotenv').config();
const mongoose = require('mongoose');

async function deleteUserTeamContextFortune() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB接続成功');
    
    // コレクションに直接アクセス（モデル定義を避ける）
    const db = mongoose.connection.db;
    const teamContextFortuneCollection = db.collection('teamcontextfortunes');
    
    // ユーザーのメールアドレスを指定
    const userEmail = 'shiraishi.tatsuya@mikoto.co.jp';
    
    // まず対象ユーザーのIDを取得
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`ユーザー (${userEmail}) が見つかりません`);
      return;
    }
    
    console.log(`ユーザーID: ${user._id}`);
    
    // 削除前にデータをバックアップ
    const backup = await teamContextFortuneCollection.find({ userId: user._id }).toArray();
    if (backup.length > 0) {
      // バックアップファイルを作成
      const fs = require('fs');
      const backupFile = `team-context-fortune-backup-${new Date().toISOString()}.json`;
      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
      console.log(`バックアップファイルを作成しました: ${backupFile}`);
    }
    
    // ユーザーIDに基づいてチームコンテキスト運勢を削除
    const result = await teamContextFortuneCollection.deleteMany({ userId: user._id });
    console.log(`削除結果: ${result.deletedCount}件削除しました`);
  } catch (e) {
    console.error('エラー:', e);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB接続を閉じました');
  }
}

// スクリプト実行
deleteUserTeamContextFortune();