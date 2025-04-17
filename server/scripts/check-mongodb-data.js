/**
 * MongoDBデータ確認スクリプト
 * 
 * MongoDBに直接接続してユーザー、TeamMemberCard、ChatHistoryのデータを確認します。
 */
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDBへの接続
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // ユーザーコレクションのデータを取得
    const userCollection = mongoose.connection.collection('users');
    const users = await userCollection.find({}).toArray();
    
    console.log(`Total Users: ${users.length}`);
    
    // 各ユーザーの詳細を表示
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log(`_id: ${user._id} (${typeof user._id})`);
      console.log(`email: ${user.email || 'N/A'}`);
      console.log(`displayName: ${user.displayName || 'N/A'}`);
      console.log(`role: ${user.role || 'N/A'}`);
      console.log(`uid: ${user.uid || 'N/A'}`);
      console.log(`firebaseUid: ${user.firebaseUid || 'N/A'}`);
    });
    
    // TeamMemberCardコレクションのデータを取得
    const teamMemberCardCollection = mongoose.connection.collection('teammembercards');
    const cards = await teamMemberCardCollection.find({}).limit(2).toArray();
    
    console.log(`\n\n=== TeamMemberCards (Sample of 2) ===`);
    console.log(`Total TeamMemberCards: ${await teamMemberCardCollection.countDocuments()}`);
    
    cards.forEach((card, index) => {
      console.log(`\n--- Card ${index + 1} ---`);
      console.log(`_id: ${card._id} (${typeof card._id})`);
      console.log(`userId: ${card.userId} (${typeof card.userId})`);
      console.log(`teamId: ${card.teamId} (${typeof card.teamId})`);
    });
    
    // ChatHistoryコレクションのデータを取得
    const chatHistoryCollection = mongoose.connection.collection('chathistories');
    const histories = await chatHistoryCollection.find({}).limit(2).toArray();
    
    console.log(`\n\n=== ChatHistories (Sample of 2) ===`);
    console.log(`Total ChatHistories: ${await chatHistoryCollection.countDocuments()}`);
    
    histories.forEach((history, index) => {
      console.log(`\n--- History ${index + 1} ---`);
      console.log(`_id: ${history._id} (${typeof history._id})`);
      console.log(`userId: ${history.userId} (${typeof history.userId})`);
      console.log(`chatType: ${history.chatType}`);
    });
    
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