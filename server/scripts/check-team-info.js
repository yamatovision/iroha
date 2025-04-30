const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkTeamInfo() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
  const DB_NAME = process.env.DB_NAME || 'dailyfortune';
  
  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    return;
  }
  
  console.log('Using MongoDB URI:', MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });
    console.log('Connected to MongoDB successfully');
    
    // Define schemas
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const TeamSchema = new mongoose.Schema({}, { strict: false });
    
    // Define models
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);
    
    // チームの総数を確認
    const teamCount = await Team.countDocuments();
    console.log(`\nTotal teams in database: ${teamCount}`);

    // すべてのチームを取得
    const allTeams = await Team.find().lean();
    console.log('\nAll teams:');
    allTeams.forEach((team, index) => {
      console.log(`  ${index + 1}. ID: ${team._id} - Name: ${team.name} - Admin: ${team.adminId}`);
    });

    // 特定のチームIDを検索
    const teamIdToCheck = '6805e8e7952f7bda054b4477';
    console.log(`\nChecking for team with ID: ${teamIdToCheck}`);
    try {
      const specificTeam = await Team.findById(teamIdToCheck).lean();
      if (specificTeam) {
        console.log('Team found:');
        console.log('  ID:', specificTeam._id);
        console.log('  Name:', specificTeam.name);
        console.log('  Admin ID:', specificTeam.adminId);
        console.log('  Created At:', specificTeam.createdAt);
      } else {
        console.log(`No team found with ID: ${teamIdToCheck}`);
      }
    } catch (error) {
      console.log('Error searching for team:', error.message);
    }

    // ユーザー確認
    const userEmail = "shiraishi.tatsuya@mikoto.co.jp";
    console.log(`\nChecking user with email: ${userEmail}`);
    const user = await User.findOne({ email: userEmail }).lean();
    
    if (user) {
      console.log('User found:');
      console.log('  ID:', user._id);
      console.log('  Firebase UID:', user.uid);
      console.log('  Email:', user.email);
      console.log('  Team ID:', user.teamId || 'No team assigned');
      
      // ユーザーに関連付けられたチームがあれば詳細を表示
      if (user.teamId) {
        const userTeam = await Team.findById(user.teamId).lean();
        if (userTeam) {
          console.log('\nUser\'s team details:');
          console.log('  ID:', userTeam._id);
          console.log('  Name:', userTeam.name);
          console.log('  Admin ID:', userTeam.adminId);
          console.log('  Is User Admin:', userTeam.adminId === user.uid || userTeam.adminId === user._id);
        } else {
          console.log(`\nUser has team ID ${user.teamId} but no corresponding team found`);
        }
      }
    } else {
      console.log(`No user found with email: ${userEmail}`);
    }
    
    // Disconnect
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTeamInfo();