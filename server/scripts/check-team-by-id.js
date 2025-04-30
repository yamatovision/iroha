/**
 * 指定したチームIDの情報を確認するスクリプト
 */
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDBへの接続
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

async function main() {
  try {
    // チームIDを取得
    const teamId = process.argv[2];
    if (!teamId) {
      console.error('使用方法: node check-team-by-id.js "チームID"');
      process.exit(1);
    }

    console.log(`検索するチームID: ${teamId}`);
    
    // MongoDBに接続
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // MongoDB接続
    const db = mongoose.connection.db;
    
    // チームコレクションを取得
    const teamCollection = db.collection('teams');
    
    // チームIDでチームを検索
    let team;
    try {
      const teamObjectId = new mongoose.Types.ObjectId(teamId);
      team = await teamCollection.findOne({ _id: teamObjectId });
    } catch (err) {
      console.error('無効なチームIDフォーマット:', err.message);
      process.exit(1);
    }
    
    if (team) {
      console.log('\n=== チーム情報 ===');
      console.log(`ID: ${team._id}`);
      console.log(`名前: ${team.name}`);
      console.log(`説明: ${team.description || 'N/A'}`);
      console.log(`管理者ID: ${team.adminId}`);
      console.log(`作成日: ${team.createdAt ? new Date(team.createdAt).toLocaleString() : 'N/A'}`);
      
      // このチームのメンバーシップを検索
      const membershipCollection = db.collection('teammemberships');
      const memberships = await membershipCollection.find({ teamId: team._id }).toArray();
      
      console.log(`\n=== チームメンバー (${memberships.length}件) ===`);
      
      if (memberships.length > 0) {
        for (const membership of memberships) {
          const userCollection = db.collection('users');
          const user = await userCollection.findOne({ _id: membership.userId });
          
          console.log(`- ユーザーID: ${membership.userId}`);
          console.log(`  ユーザー: ${user ? user.email : '不明'}`);
          console.log(`  役割: ${membership.role || 'N/A'}`);
          console.log(`  管理者: ${membership.isAdmin ? 'はい' : 'いいえ'}`);
          console.log(`  参加日: ${membership.joinedAt ? new Date(membership.joinedAt).toLocaleString() : 'N/A'}`);
          console.log('');
        }
      } else {
        console.log('このチームにはメンバーがいません');
      }
    } else {
      console.log('\n=== チーム情報 ===');
      console.log(`チームID ${teamId} は存在しません`);
      
      // このチームIDを参照するメンバーシップはあるか
      const membershipCollection = db.collection('teammemberships');
      const memberships = await membershipCollection.find({ 
        teamId: new mongoose.Types.ObjectId(teamId) 
      }).toArray();
      
      console.log(`\n=== このチームIDを参照するメンバーシップ (${memberships.length}件) ===`);
      
      if (memberships.length > 0) {
        console.log('\n警告: 存在しないチームIDを参照するメンバーシップが見つかりました');
        
        for (const membership of memberships) {
          const userCollection = db.collection('users');
          const user = await userCollection.findOne({ _id: membership.userId });
          
          console.log(`- ユーザーID: ${membership.userId}`);
          console.log(`  ユーザー: ${user ? user.email : '不明'}`);
          console.log(`  メンバーシップID: ${membership._id}`);
          console.log(`  役割: ${membership.role || 'N/A'}`);
          console.log(`  参加日: ${membership.joinedAt ? new Date(membership.joinedAt).toLocaleString() : 'N/A'}`);
          console.log('');
        }
      } else {
        console.log('このチームIDを参照するメンバーシップはありません');
      }
    }
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    // MongoDBとの接続を切断
    await mongoose.disconnect();
    console.log('\nMongoDBとの接続を切断しました');
  }
}

main();