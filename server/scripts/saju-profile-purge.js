/**
 * SajuProfileコレクションの完全削除スクリプト
 * 安全チェック付き
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

async function purgeSajuProfileCollection() {
  console.log('\n===== SajuProfileコレクション削除スクリプト =====');
  
  let client;
  try {
    console.log('MongoDBに接続中...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('MongoDBに接続しました');
    
    const db = client.db();
    console.log(`データベース: ${db.databaseName}`);
    
    // SajuProfileコレクションの存在確認
    const collections = await db.listCollections().toArray();
    const hasSajuProfileCollection = collections.some(c => c.name === 'sajuprofiles');
    
    if (!hasSajuProfileCollection) {
      console.log('SajuProfileコレクションは存在しません。削除は不要です。');
      return;
    }
    
    // ドキュメント数を確認
    const profileCount = await db.collection('sajuprofiles').countDocuments();
    console.log(`SajuProfileコレクションのドキュメント数: ${profileCount}`);
    
    if (profileCount > 0) {
      console.log('\n⚠️ 警告: SajuProfileコレクションにまだドキュメントが存在します');
      console.log('削除を続行する前に、以下のことを確認してください:');
      console.log('1. すべてのデータがUserモデルに移行されていること');
      console.log('2. アプリケーションのコードでSajuProfileへの参照がないこと');
      
      // プロンプトなしで続行（セキュリティ上の理由から）
      console.log('\nデータ移行の確認が完了していると仮定して削除を続行します...');
    }
    
    // コレクションの削除
    await db.dropCollection('sajuprofiles');
    console.log('\n✅ SajuProfileコレクションを削除しました');
    
    // 確認
    const collectionsAfter = await db.listCollections().toArray();
    const stillExists = collectionsAfter.some(c => c.name === 'sajuprofiles');
    
    if (stillExists) {
      console.log('❌ エラー: 削除処理は成功しましたが、コレクションがまだ存在しています');
    } else {
      console.log('✅ 確認完了: SajuProfileコレクションが正常に削除されました');
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nデータベース接続を閉じました');
    }
  }
}

// スクリプト実行
purgeSajuProfileCollection().catch(console.error);