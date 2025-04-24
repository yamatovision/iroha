/**
 * 特定の友達関係レコードを削除するスクリプト
 * 使用方法: node delete-friendship.js <friendship_id>
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function main() {
  try {
    // コマンドライン引数の取得
    const friendshipId = process.argv[2];
    
    if (!friendshipId) {
      console.error('エラー: 削除するFriendship IDを指定してください');
      console.log('使用方法: node delete-friendship.js <friendship_id>');
      return;
    }
    
    // 接続文字列の確認
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('エラー: MONGODB_URI 環境変数が設定されていません');
      return;
    }

    console.log('MongoDB接続を試みます...');
    await mongoose.connect(uri);
    console.log('MongoDB接続成功');

    // Friendshipレコードの削除
    console.log(`Friendship ID ${friendshipId} を削除しています...`);
    const result = await mongoose.connection.collection('friendships').deleteOne({ 
      _id: new ObjectId(friendshipId) 
    });
    
    if (result.deletedCount > 0) {
      console.log('削除成功: レコードが正常に削除されました');
    } else {
      console.log('削除失敗: 指定されたIDのレコードが見つかりませんでした');
    }
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB切断');
  }
}

main();