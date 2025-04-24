/**
 * チーム情報を詳細に確認するスクリプト
 */
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDBへの接続
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
const SPECIFIC_TEAM_IDS = ['6805e8e7952f7bda054b4477', '67f71bb9b24269b1a55c6afb'];

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // コレクション取得
    const teamCollection = mongoose.connection.collection('teams');
    const teamMembershipCollection = mongoose.connection.collection('teammemberships');
    const teamMemberCardCollection = mongoose.connection.collection('teammembercards');
    
    // 全チーム一覧を取得
    const teams = await teamCollection.find({}).toArray();
    console.log(`\n=== All Teams (${teams.length}) ===`);
    
    for (const team of teams) {
      console.log(`\n--- Team: ${team.name} ---`);
      console.log(`ID: ${team._id}`);
      console.log(`Description: ${team.description || 'N/A'}`);
      console.log(`Admin ID: ${team.adminId || 'N/A'}`);
      console.log(`Creator ID: ${team.creatorId || 'N/A'}`);
      console.log(`Organization ID: ${team.organizationId || 'N/A'}`);
      console.log(`Created At: ${team.createdAt ? new Date(team.createdAt).toLocaleString() : 'N/A'}`);
      
      // チームメンバーシップ数を取得
      const membershipCount = await teamMembershipCollection.countDocuments({ teamId: team._id.toString() });
      console.log(`Team Membership Count: ${membershipCount}`);
      
      // チームメンバーカード数を取得
      const memberCardCount = await teamMemberCardCollection.countDocuments({ teamId: team._id.toString() });
      console.log(`Team Member Card Count: ${memberCardCount}`);
    }
    
    // 特定のチームについて詳細情報を取得
    console.log('\n=== Specific Teams Information ===');
    
    for (const teamId of SPECIFIC_TEAM_IDS) {
      try {
        const team = await teamCollection.findOne({ _id: new mongoose.Types.ObjectId(teamId) });
        
        if (team) {
          console.log(`\n--- Team ID: ${teamId} ---`);
          console.log(`Name: ${team.name}`);
          console.log(`Description: ${team.description || 'N/A'}`);
          console.log(`Admin ID: ${team.adminId || 'N/A'}`);
          console.log(`Creator ID: ${team.creatorId || 'N/A'}`);
          console.log(`Organization ID: ${team.organizationId || 'N/A'}`);
          console.log(`Created At: ${team.createdAt ? new Date(team.createdAt).toLocaleString() : 'N/A'}`);
          
          // チームメンバーシップを取得
          const memberships = await teamMembershipCollection.find({ teamId: teamId }).toArray();
          
          console.log(`\nTeam Members (${memberships.length}):`);
          for (const membership of memberships) {
            console.log(`- User ID: ${membership.userId}, Role: ${membership.role || 'N/A'}, Member Role: ${membership.memberRole || 'N/A'}`);
          }
          
          // チームメンバーカードを取得
          const memberCards = await teamMemberCardCollection.find({ teamId: teamId }).toArray();
          
          console.log(`\nTeam Member Cards (${memberCards.length}):`);
          for (const card of memberCards) {
            console.log(`- User ID: ${card.userId}, card ID: ${card._id}`);
          }
        } else {
          console.log(`\n--- Team ID: ${teamId} not found ---`);
        }
      } catch (error) {
        console.log(`Error retrieving team ${teamId}: ${error.message}`);
      }
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