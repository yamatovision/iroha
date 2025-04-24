/**
 * 友達関係を確認するスクリプト
 * 使用方法: node check-friendship.js [userId1] [userId2]
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
  try {
    // 接続文字列の確認
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('Error: MONGODB_URI environment variable is not set');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
      return;
    }

    console.log('MongoDB接続を試みます...');
    await mongoose.connect(uri);
    console.log('MongoDB接続成功');

    // コマンドライン引数の取得
    const userId1 = process.argv[2];
    const userId2 = process.argv[3];
    
    // 検索条件の設定
    let query = {};
    if (userId1 && userId2) {
      query = {
        $or: [
          { userId1, userId2 },
          { userId1: userId2, userId2: userId1 }
        ]
      };
      console.log(`特定の友達関係を検索: ${userId1} と ${userId2} の間`);
    } else if (userId1) {
      query = {
        $or: [
          { userId1 },
          { userId2: userId1 }
        ]
      };
      console.log(`ユーザー ${userId1} の友達関係を検索`);
    }

    // 友達関係の確認
    const friendships = await mongoose.connection.collection('friendships').find(query).toArray();
    
    console.log(`\n合計友達関係数: ${friendships.length}`);
    
    if (friendships.length > 0) {
      friendships.forEach((friendship, index) => {
        console.log(`\n友達関係 ${index + 1}:`);
        console.log(`  ID: ${friendship._id}`);
        console.log(`  ユーザー1: ${friendship.userId1}`);
        console.log(`  ユーザー2: ${friendship.userId2}`);
        console.log(`  ステータス: ${friendship.status}`);
        console.log(`  リクエスト送信者: ${friendship.requesterId}`);
        console.log(`  相性スコア: ${friendship.compatibilityScore || 'なし'}`);
        console.log(`  関係タイプ: ${friendship.relationshipType || 'なし'}`);
        
        // 拡張相性詳細情報の確認
        if (friendship.enhancedDetails) {
          console.log('  拡張相性詳細:');
          console.log(`    陰陽バランス: ${friendship.enhancedDetails.yinYangBalance || 'なし'}`);
          console.log(`    身強弱バランス: ${friendship.enhancedDetails.strengthBalance || 'なし'}`);
          console.log(`    日支関係: ${JSON.stringify(friendship.enhancedDetails.dayBranchRelationship || {})}`);
          console.log(`    用神情報: ${friendship.enhancedDetails.usefulGods || 'なし'}`);
          console.log(`    日干干合: ${JSON.stringify(friendship.enhancedDetails.dayGanCombination || {})}`);
          console.log(`    関係タイプ: ${friendship.enhancedDetails.relationshipType || 'なし'}`);
        } else {
          console.log('  拡張相性詳細: なし');
        }
        
        console.log(`  作成日: ${friendship.createdAt}`);
      });
    } else {
      console.log('友達関係のレコードが見つかりません');
    }
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB切断');
  }
}

main();