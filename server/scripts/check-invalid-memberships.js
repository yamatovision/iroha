/**
 * 無効なチームメンバーシップを検出するスクリプト
 */
const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  try {
    console.log('MongoDB接続中...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('接続成功');

    // TeamMembershipコレクションで不正な参照をチェック
    const db = mongoose.connection.db;
    const membershipsCollection = db.collection('teammemberships');
    const teamsCollection = db.collection('teams');

    // 1. すべてのチームID取得
    const teams = await teamsCollection.find({}, { projection: { _id: 1 } }).toArray();
    const validTeamIds = teams.map(team => team._id.toString());
    console.log(`システム内の有効なチーム数: ${validTeamIds.length}`);

    // 2. すべてのメンバーシップ取得
    const memberships = await membershipsCollection.find({}).toArray();
    console.log(`システム内のメンバーシップ総数: ${memberships.length}`);

    // 3. 無効なメンバーシップを検出
    const invalidMemberships = [];
    for (const membership of memberships) {
      const teamIdStr = membership.teamId.toString();
      if (!validTeamIds.includes(teamIdStr)) {
        invalidMemberships.push(membership);
      }
    }

    console.log(`無効なメンバーシップ数: ${invalidMemberships.length}`);
    
    if (invalidMemberships.length > 0) {
      console.log('\n無効なメンバーシップサンプル (最大10件):');
      const sampleSize = Math.min(invalidMemberships.length, 10);
      
      for (let i = 0; i < sampleSize; i++) {
        const membership = invalidMemberships[i];
        const userCollection = db.collection('users');
        const user = await userCollection.findOne({ _id: membership.userId });
        
        console.log(`- メンバーシップID: ${membership._id}`);
        console.log(`  無効なチームID: ${membership.teamId}`);
        console.log(`  ユーザーID: ${membership.userId}`);
        console.log(`  ユーザー: ${user ? user.email : '不明'}`);
        console.log('');
      }
      
      // 問題のチームIDごとの集計
      const teamCounts = {};
      for (const membership of invalidMemberships) {
        const teamId = membership.teamId.toString();
        teamCounts[teamId] = (teamCounts[teamId] || 0) + 1;
      }
      
      console.log('問題のチームID別集計:');
      Object.entries(teamCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([teamId, count]) => {
          console.log(`- チームID: ${teamId}, 参照数: ${count}件`);
        });
    }
  } catch (err) {
    console.error('エラー:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB接続終了');
  }
}

main();