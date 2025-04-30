const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

async function verifyMigration() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('dailyfortune');
    
    // ユーザー情報の確認
    const users = await db.collection('users').find({}).toArray();
    console.log('ユーザー情報:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // TeamMemberCardの確認
    const teamMemberCards = await db.collection('teammembercards').find({}).toArray();
    console.log('\nTeamMemberCard情報:');
    teamMemberCards.forEach(card => {
      console.log(`- TeamID: ${card.teamId}, UserID: ${card.userId}, Type: ${typeof card.userId}`);
    });
    
    // ChatHistoryの確認
    const chatHistories = await db.collection('chathistories').find({}).limit(2).toArray();
    console.log('\nChatHistory情報:');
    chatHistories.forEach(chat => {
      console.log(`- UserID: ${chat.userId}, ChatType: ${chat.chatType}, Type: ${typeof chat.userId}`);
    });
    
    console.log('\n移行状態の検証完了');
    
  } catch (err) {
    console.error('エラー:', err);
  } finally {
    await client.close();
    console.log('データベース接続閉じました');
  }
}

verifyMigration();