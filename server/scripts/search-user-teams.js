/**
 * ユーザーとチーム情報検索スクリプト
 * 
 * 特定のメールアドレスに関連するユーザー、チームメンバーシップ、チーム情報を検索します
 */
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDBへの接続
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
const EMAIL_TO_SEARCH = 'shiraishi.tatsuya@mikoto.co.jp';
const SPECIFIC_TEAM_IDS = ['6805e8e7952f7bda054b4477', '67f71bb9b24269b1a55c6afb'];

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // ユーザーコレクションから指定されたメールアドレスのユーザーを検索
    const userCollection = mongoose.connection.collection('users');
    const user = await userCollection.findOne({ email: EMAIL_TO_SEARCH });
    
    if (!user) {
      console.log(`User with email ${EMAIL_TO_SEARCH} not found.`);
      return;
    }
    
    console.log('\n=== User Information ===');
    console.log(`User ID: ${user._id} (${typeof user._id})`);
    console.log(`Email: ${user.email}`);
    console.log(`Display Name: ${user.displayName || 'N/A'}`);
    console.log(`Role: ${user.role || 'N/A'}`);
    console.log(`Created At: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}`);
    
    // TeamMembershipコレクションからユーザーのメンバーシップを検索
    const membershipCollection = mongoose.connection.collection('teammemberships');
    const memberships = await membershipCollection.find({ userId: user._id.toString() }).toArray();
    
    console.log(`\n=== Team Memberships (${memberships.length}) ===`);
    
    if (memberships.length === 0) {
      console.log('No team memberships found for this user.');
    } else {
      // チームIDのリストを抽出
      const teamIds = memberships.map(membership => membership.teamId);
      
      // Teamコレクションから関連するチーム情報を取得
      const teamCollection = mongoose.connection.collection('teams');
      const teams = await teamCollection.find({ _id: { $in: teamIds.map(id => new mongoose.Types.ObjectId(id)) } }).toArray();
      
      // メンバーシップとチームの情報を結合して表示
      for (const membership of memberships) {
        const team = teams.find(t => t._id.toString() === membership.teamId);
        
        console.log(`\n--- Membership ---`);
        console.log(`Team ID: ${membership.teamId}`);
        console.log(`Role: ${membership.role}`);
        console.log(`Joined At: ${membership.createdAt ? new Date(membership.createdAt).toLocaleString() : 'N/A'}`);
        
        if (team) {
          console.log(`Team Name: ${team.name}`);
          console.log(`Team Description: ${team.description || 'N/A'}`);
          console.log(`Team Created At: ${team.createdAt ? new Date(team.createdAt).toLocaleString() : 'N/A'}`);
          console.log(`Default Team: ${team.isDefault ? 'Yes' : 'No'}`);
        } else {
          console.log('Team information not found');
        }
      }
    }
    
    // 特定のチームIDについて詳細情報を取得
    console.log('\n=== Specific Teams Information ===');
    
    const teamCollection = mongoose.connection.collection('teams');
    
    for (const teamId of SPECIFIC_TEAM_IDS) {
      try {
        const team = await teamCollection.findOne({ _id: new mongoose.Types.ObjectId(teamId) });
        
        if (team) {
          console.log(`\n--- Team ID: ${teamId} ---`);
          console.log(`Name: ${team.name}`);
          console.log(`Description: ${team.description || 'N/A'}`);
          console.log(`Created At: ${team.createdAt ? new Date(team.createdAt).toLocaleString() : 'N/A'}`);
          console.log(`Owner: ${team.ownerId || 'N/A'}`);
          console.log(`Default: ${team.isDefault ? 'Yes' : 'No'}`);
          
          // チームメンバー数を取得
          const memberCount = await membershipCollection.countDocuments({ teamId: teamId });
          console.log(`Member Count: ${memberCount}`);
          
          // ユーザーがこのチームのメンバーかどうかを確認
          const membership = await membershipCollection.findOne({ 
            teamId: teamId, 
            userId: user._id.toString() 
          });
          
          if (membership) {
            console.log(`User is a member with role: ${membership.role}`);
          } else {
            console.log(`User is NOT a member of this team`);
          }
        } else {
          console.log(`\n--- Team ID: ${teamId} not found ---`);
        }
      } catch (error) {
        console.log(`Error retrieving team ${teamId}: ${error.message}`);
      }
    }
    
    // TeamContextコードを検索して、自動表示チームのロジックを調査
    console.log('\n=== Team Context Logic ===');
    
    // TeamMembershipコレクションでデフォルトチームを検索
    const defaultMembership = await membershipCollection.findOne({ 
      userId: user._id.toString(),
      isDefault: true
    });
    
    if (defaultMembership) {
      console.log(`User has a default team membership: ${defaultMembership.teamId}`);
      
      // デフォルトチームの情報を取得
      const defaultTeam = await teamCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(defaultMembership.teamId) 
      });
      
      if (defaultTeam) {
        console.log(`Default Team Name: ${defaultTeam.name}`);
      }
    } else {
      console.log('User does not have a default team membership set.');
    }
    
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