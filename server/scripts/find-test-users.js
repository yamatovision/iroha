/**
 * テストユーザーを検索するスクリプト
 */
require('dotenv').config();
const mongoose = require('mongoose');

// MongoDBに接続
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyfortune');
    console.log('MongoDBに接続しました');
  } catch (error) {
    console.error('MongoDBへの接続に失敗しました:', error);
    process.exit(1);
  }
}

// ユーザーモデルの簡易定義
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema, 'users');

// テストユーザーを検索する関数
async function findTestUsers() {
  try {
    console.log('テストユーザーを検索中...');
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id email name createdAt');
    
    if (users.length === 0) {
      console.log('テストユーザーが見つかりませんでした');
    } else {
      console.log(`${users.length}人のユーザーが見つかりました：`);
      users.forEach((user, index) => {
        console.log(`ユーザー${index + 1}:`);
        console.log(`  ID: ${user._id}`);
        console.log(`  メール: ${user.email}`);
        console.log(`  名前: ${user.name || '未設定'}`);
        console.log(`  作成日: ${user.createdAt}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('ユーザー検索中にエラーが発生しました:', error);
  }
}

// スクリプト実行
async function main() {
  await connectDB();
  await findTestUsers();
  mongoose.connection.close();
}

main();