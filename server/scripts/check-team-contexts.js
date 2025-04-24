/**
 * TeamContextとチームメンバーシップの詳細分析スクリプト
 */
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDBへの接続
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
const SPECIFIC_USER_EMAIL = 'shiraishi.tatsuya@mikoto.co.jp';

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // 基本情報の取得
    const userCollection = mongoose.connection.collection('users');
    const teamCollection = mongoose.connection.collection('teams');
    const teamMembershipCollection = mongoose.connection.collection('teammemberships');
    
    // 全ユーザー数を確認
    const userCount = await userCollection.countDocuments();
    console.log(`Total Users: ${userCount}`);
    
    // 全チーム数を確認
    const teamCount = await teamCollection.countDocuments();
    console.log(`Total Teams: ${teamCount}`);
    
    // 全メンバーシップ数を確認
    const membershipCount = await teamMembershipCollection.countDocuments();
    console.log(`Total TeamMemberships: ${membershipCount}`);
    
    // isDefaultフィールドの存在を確認
    const teamWithIsDefault = await teamCollection.findOne({ isDefault: { $exists: true } });
    console.log(`Teams with isDefault field: ${teamWithIsDefault ? 'Yes' : 'No'}`);
    
    const membershipWithIsDefault = await teamMembershipCollection.findOne({ isDefault: { $exists: true } });
    console.log(`TeamMemberships with isDefault field: ${membershipWithIsDefault ? 'Yes' : 'No'}`);
    
    // TeamMembershipスキーマを確認
    const teamMembershipIndexes = await teamMembershipCollection.indexes();
    console.log('\n=== TeamMembership Indexes ===');
    console.log(JSON.stringify(teamMembershipIndexes, null, 2));
    
    // TeamMembershipのサンプル取得
    const sampleMembership = await teamMembershipCollection.findOne({});
    if (sampleMembership) {
      console.log('\n=== Sample TeamMembership ===');
      console.log(JSON.stringify(sampleMembership, null, 2));
    }
    
    // 特定ユーザーの情報取得
    const user = await userCollection.findOne({ email: SPECIFIC_USER_EMAIL });
    if (user) {
      console.log(`\n=== User Information for ${SPECIFIC_USER_EMAIL} ===`);
      console.log(`User ID: ${user._id}`);
      console.log(`Display Name: ${user.displayName || 'N/A'}`);
      console.log(`Role: ${user.role || 'N/A'}`);
      console.log(`Legacy Team ID: ${user.teamId || 'N/A'}`);
      
      // ユーザーのチームメンバーシップを取得
      const memberships = await teamMembershipCollection.find({ 
        userId: user._id.toString() 
      }).toArray();
      
      console.log(`\n=== Team Memberships for ${user.displayName} (${memberships.length}) ===`);
      
      for (const membership of memberships) {
        console.log(`\nTeam ID: ${membership.teamId}`);
        console.log(`Role: ${membership.role || 'N/A'}`);
        console.log(`Member Role: ${membership.memberRole || 'N/A'}`);
        console.log(`Is Admin: ${membership.isAdmin ? 'Yes' : 'No'}`);
        console.log(`Joined At: ${membership.joinedAt ? new Date(membership.joinedAt).toLocaleString() : 'N/A'}`);
        console.log(`Is Default: ${membership.isDefault ? 'Yes' : 'No'}`);
        
        // チーム情報を取得
        const team = await teamCollection.findOne({ 
          _id: new mongoose.Types.ObjectId(membership.teamId) 
        });
        
        if (team) {
          console.log(`Team Name: ${team.name}`);
          console.log(`Team Creator: ${team.creatorId || 'N/A'}`);
          console.log(`Team Admin: ${team.adminId || 'N/A'}`);
          console.log(`Team Is Default: ${team.isDefault ? 'Yes' : 'No'}`);
        } else {
          console.log(`Team not found for ID: ${membership.teamId}`);
        }
      }
      
      // なお、ユーザーがメンバーではないが、クライアントで表示されるチームを確認
      // TeamContextでデフォルト選択されていると思われるチームリスト
      console.log(`\n=== All Default Teams ===`);
      const defaultTeams = await teamCollection.find({ isDefault: true }).toArray();
      
      for (const team of defaultTeams) {
        console.log(`\nDefault Team ID: ${team._id}`);
        console.log(`Name: ${team.name}`);
        console.log(`Admin ID: ${team.adminId || 'N/A'}`);
      }
    } else {
      console.log(`User not found with email: ${SPECIFIC_USER_EMAIL}`);
    }
    
    // チーム選択ロジックに関連すると思われるスキーマやフィールドを調査
    console.log('\n=== Team Selection Logic Investigation ===');
    
    // ランダムなTeamMembershipサンプルを取得してスキーマを分析
    const samples = await teamMembershipCollection.find().limit(5).toArray();
    
    console.log(`\nTeamMembership Schema Fields (from ${samples.length} samples):`);
    
    // サンプルから一意のフィールド名を抽出
    const uniqueFields = new Set();
    samples.forEach(sample => {
      Object.keys(sample).forEach(key => uniqueFields.add(key));
    });
    
    console.log([...uniqueFields].join(', '));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // 接続を閉じる
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// スクリプトを実行
main();