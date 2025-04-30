/**
 * メールアドレスからユーザー情報を検索するスクリプト
 * 使用方法: node check-user-email.js "example@example.com"
 */
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDBへの接続
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

async function main() {
  try {
    // メールアドレスを取得
    const email = process.argv[2];
    if (!email) {
      console.error('使用方法: node check-user-email.js "example@example.com"');
      process.exit(1);
    }

    console.log(`検索するメールアドレス: ${email}`);
    
    // MongoDBに接続
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // ユーザーコレクションを取得
    const userCollection = mongoose.connection.collection('users');
    
    // メールアドレスでユーザーを検索
    const user = await userCollection.findOne({ email });
    
    if (user) {
      console.log('\n=== ユーザー情報 ===');
      console.log(`ID: ${user._id}`);
      console.log(`メールアドレス: ${user.email}`);
      console.log(`表示名: ${user.displayName || 'N/A'}`);
      console.log(`役割: ${user.role || 'N/A'}`);
      console.log(`作成日: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}`);
      
      // チームメンバーシップを検索
      const membershipCollection = mongoose.connection.collection('teammemberships');
      const memberships = await membershipCollection.find({ userId: user._id }).toArray();
      
      console.log(`\n=== チームメンバーシップ (${memberships.length}件) ===`);
      
      if (memberships.length > 0) {
        for (const membership of memberships) {
          console.log(`- チームID: ${membership.teamId}`);
          console.log(`  役割: ${membership.role || 'N/A'}`);
          console.log(`  管理者: ${membership.isAdmin ? 'はい' : 'いいえ'}`);
          console.log(`  参加日: ${membership.joinedAt ? new Date(membership.joinedAt).toLocaleString() : 'N/A'}`);
          
          // このチームの情報も取得
          const teamCollection = mongoose.connection.collection('teams');
          const team = await teamCollection.findOne({ _id: membership.teamId });
          
          if (team) {
            console.log(`  チーム名: ${team.name}`);
            console.log(`  説明: ${team.description || 'N/A'}`);
          } else {
            console.log(`  警告: このチームID (${membership.teamId}) は存在しません`);
          }
          console.log('');
        }
      } else {
        console.log('チームメンバーシップがありません');
      }
      
      // サジュプロファイル情報
      const sajuProfileCollection = mongoose.connection.collection('sajuprofiles');
      const profile = await sajuProfileCollection.findOne({ userId: user._id });
      
      if (profile) {
        console.log('\n=== サジュプロファイル ===');
        console.log(`名前: ${profile.name || 'N/A'}`);
        console.log(`生年月日: ${profile.birthDate ? new Date(profile.birthDate).toLocaleString() : 'N/A'}`);
        console.log(`出生地: ${profile.birthplace || 'N/A'}`);
      } else {
        console.log('\nサジュプロファイルがありません');
      }
      
    } else {
      console.log(`\nメールアドレス "${email}" のユーザーは見つかりませんでした`);
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