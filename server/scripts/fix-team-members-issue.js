/**
 * チームメンバーシップの問題を修正するスクリプト
 * 存在しないチームへの参照を持つメンバーシップを削除
 */
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDBへの接続
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

// 対象ユーザーID（指定されている場合）
const specificUserId = process.argv[2];

// 実行モード（dry-runかどうか）
const isDryRun = !process.argv.includes('--execute');

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // コレクション取得
    const teamCollection = mongoose.connection.collection('teams');
    const teamMembershipCollection = mongoose.connection.collection('teammemberships');
    
    console.log(`\n=== チームメンバーシップの問題修正 ===`);
    console.log(`モード: ${isDryRun ? 'Dry Run (変更なし)' : '実行 (変更あり)'}`);
    
    // 既存のチームIDリストを取得
    const teams = await teamCollection.find({}, { projection: { _id: 1 } }).toArray();
    const validTeamIds = teams.map(team => team._id.toString());
    
    console.log(`有効なチーム: ${validTeamIds.length}件`);
    
    // クエリ条件の構築
    let query = {};
    if (specificUserId) {
      try {
        const userObjectId = new mongoose.Types.ObjectId(specificUserId);
        query.userId = userObjectId;
        console.log(`特定ユーザーの修正: ${specificUserId}`);
      } catch (err) {
        console.error('無効なユーザーIDフォーマットです:', err.message);
        process.exit(1);
      }
    }
    
    // 全てのメンバーシップを取得
    const memberships = await teamMembershipCollection.find(query).toArray();
    console.log(`メンバーシップ総数: ${memberships.length}件`);
    
    // 無効なメンバーシップを特定
    const invalidMemberships = [];
    
    for (const membership of memberships) {
      const teamIdStr = membership.teamId.toString();
      
      // このチームIDが有効なチームに存在するかチェック
      const isValid = validTeamIds.includes(teamIdStr);
      
      if (!isValid) {
        invalidMemberships.push(membership);
      }
    }
    
    console.log(`無効なメンバーシップ: ${invalidMemberships.length}件`);
    
    if (invalidMemberships.length > 0) {
      console.log('\n無効なメンバーシップの詳細:');
      
      // ユーザーIDと無効チームIDの組み合わせを集計
      const userTeamPairs = {};
      
      for (const membership of invalidMemberships) {
        const userId = membership.userId.toString();
        const teamId = membership.teamId.toString();
        const key = `${userId}:${teamId}`;
        
        if (!userTeamPairs[key]) {
          userTeamPairs[key] = {
            userId,
            teamId,
            count: 0,
            memberships: []
          };
        }
        
        userTeamPairs[key].count++;
        userTeamPairs[key].memberships.push(membership);
      }
      
      // 結果表示
      Object.values(userTeamPairs).forEach(pair => {
        console.log(`- ユーザーID: ${pair.userId}, 無効なチームID: ${pair.teamId}, 件数: ${pair.count}件`);
      });
      
      // 実際に削除処理を行う
      if (!isDryRun) {
        console.log('\n無効なメンバーシップを削除しています...');
        let deletedCount = 0;
        
        for (const membership of invalidMemberships) {
          const result = await teamMembershipCollection.deleteOne({ _id: membership._id });
          if (result.deletedCount > 0) {
            deletedCount++;
          }
        }
        
        console.log(`削除完了: ${deletedCount}/${invalidMemberships.length}件のメンバーシップを削除しました`);
      } else {
        console.log('\n実際に削除するには --execute オプションを付けて再実行してください');
        console.log('例: node fix-team-members-issue.js --execute');
      }
    } else {
      console.log('問題のあるメンバーシップは見つかりませんでした。修正は不要です。');
    }
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    // 接続を閉じる
    await mongoose.disconnect();
    console.log('\nMongoDBとの接続を切断しました');
  }
}

// スクリプトを実行
main();