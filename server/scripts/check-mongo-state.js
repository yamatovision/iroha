const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

async function checkDatabase() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('MongoDBに接続しました');
    
    const db = client.db('dailyfortune');
    
    // コレクション一覧を取得
    const collections = await db.listCollections().toArray();
    console.log('コレクション一覧:');
    collections.forEach(coll => console.log(`- ${coll.name}`));
    
    // ユーザー数
    const userCount = await db.collection('users').countDocuments();
    console.log(`\nユーザー数: ${userCount}`);
    
    if (userCount > 0) {
      // ユーザー情報の確認
      const users = await db.collection('users').find({}).toArray();
      console.log('ユーザー情報:');
      users.forEach(user => {
        console.log(`- ID: ${user._id}, Email: ${user.email || 'なし'}, Role: ${user.role || 'なし'}`);
      });
    }
    
    // TeamMemberCardの確認
    const teamMemberCardCount = await db.collection('teammembercards').countDocuments();
    console.log(`\nTeamMemberCard数: ${teamMemberCardCount}`);
    
    if (teamMemberCardCount > 0) {
      // TeamMemberCard情報の確認
      const cards = await db.collection('teammembercards').find({}).toArray();
      console.log('TeamMemberCard情報:');
      cards.forEach(card => {
        console.log(`- TeamID: ${card.teamId}, UserID: ${card.userId}, Type: ${typeof card.userId}`);
      });
    }
    
    // ChatHistoryの確認
    const chatHistoryCount = await db.collection('chathistories').countDocuments();
    console.log(`\nChatHistory数: ${chatHistoryCount}`);
    
    if (chatHistoryCount > 0) {
      // サンプルのChatHistory情報
      const chats = await db.collection('chathistories').find({}).limit(2).toArray();
      console.log('ChatHistory情報サンプル:');
      chats.forEach(chat => {
        console.log(`- ID: ${chat._id}, UserID: ${chat.userId}, Type: ${typeof chat.userId}`);
      });
    }
    
  } catch (err) {
    console.error('エラー:', err);
  } finally {
    await client.close();
    console.log('\nMongoDBの接続を閉じました');
  }
}

checkDatabase();