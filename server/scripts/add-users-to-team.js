const mongoose = require('mongoose');
require('dotenv').config();

async function addUsersToTeam() {
  try {
    await mongoose.connect('mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune');
    
    const userId1 = '67f87e86a7d83fb995de0ee6'; // Tatsuya
    const userId2 = '67f87e86a7d83fb995de0ee7'; // あみ
    const teamId = '67f71bb9b24269b1a55c6afb';  // 白石team
    
    console.log(`ユーザーをチームに追加します: チーム ${teamId}`);
    
    // ユーザー1をチームに追加
    const result1 = await mongoose.connection.db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(userId1) },
      { $set: { teamId: new mongoose.Types.ObjectId(teamId) } }
    );
    
    // ユーザー2をチームに追加
    const result2 = await mongoose.connection.db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(userId2) },
      { $set: { teamId: new mongoose.Types.ObjectId(teamId) } }
    );
    
    console.log('更新結果:', {
      user1: {
        matchedCount: result1.matchedCount,
        modifiedCount: result1.modifiedCount
      },
      user2: {
        matchedCount: result2.matchedCount,
        modifiedCount: result2.modifiedCount
      }
    });
    
    // 確認
    const users = await mongoose.connection.db.collection('users').find({
      _id: { $in: [new mongoose.Types.ObjectId(userId1), new mongoose.Types.ObjectId(userId2)] }
    }).toArray();
    
    for (const user of users) {
      console.log(`ユーザー ${user.displayName} (${user._id}):`, 
        user.teamId ? `チーム ${user.teamId} に所属` : 'チームに所属していません');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

addUsersToTeam();