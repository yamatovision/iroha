/**
 * チームコンテキスト運勢データマイグレーションスクリプト
 * 
 * このスクリプトは、既存のチームコンテキスト運勢データから
 * 不要な collaborationTips フィールドを完全に削除します。
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function migrateTeamContextFortune() {
  try {
    console.log('MongoDB接続を開始します...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB接続成功');

    // コレクションに直接アクセス
    const collection = mongoose.connection.db.collection('teamcontextfortunes');
    
    // 対象ドキュメントの総数を確認
    const totalDocs = await collection.countDocuments();
    console.log(`総ドキュメント数: ${totalDocs}`);
    
    // collaborationTipsフィールドを持つドキュメント数を確認
    const docsWithField = await collection.countDocuments({ collaborationTips: { $exists: true } });
    console.log(`collaborationTipsフィールドを持つドキュメント数: ${docsWithField}`);
    
    if (docsWithField === 0) {
      console.log('マイグレーション不要: collaborationTipsフィールドを持つドキュメントはありません');
      return;
    }
    
    // 変更前のデータをバックアップ（任意）
    const backupData = await collection.find({ collaborationTips: { $exists: true } }).toArray();
    // 重要なフィールドだけを保存
    const backup = backupData.map(doc => ({ 
      _id: doc._id, 
      userId: doc.userId, 
      teamId: doc.teamId, 
      date: doc.date, 
      collaborationTips: doc.collaborationTips 
    }));
    
    // バックアップをファイルに保存
    const fs = require('fs');
    const backupFilename = `team-context-fortune-backup-${new Date().toISOString().replace(/:/g, '-')}.json`;
    fs.writeFileSync(backupFilename, JSON.stringify(backup, null, 2));
    console.log(`バックアップをファイル ${backupFilename} に保存しました`);
    
    // フィールド削除の実行
    const result = await collection.updateMany(
      { collaborationTips: { $exists: true } },
      { $unset: { collaborationTips: "" } }
    );
    
    console.log('マイグレーション結果:');
    console.log(`- 対象ドキュメント数: ${result.matchedCount}`);
    console.log(`- 更新成功数: ${result.modifiedCount}`);
    
    // 確認
    const remainingDocs = await collection.countDocuments({ collaborationTips: { $exists: true } });
    if (remainingDocs === 0) {
      console.log('✅ マイグレーション成功: すべてのドキュメントからcollaborationTipsフィールドが削除されました');
    } else {
      console.log(`❌ 警告: ${remainingDocs}件のドキュメントにcollaborationTipsフィールドが残っています`);
    }
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB接続を閉じました');
  }
}

// スクリプト実行
migrateTeamContextFortune();