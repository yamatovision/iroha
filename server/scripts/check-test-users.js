/**
 * テスト用ユーザーを確認するスクリプト
 */
const mongoose = require('mongoose');
const { config } = require('dotenv');
const path = require('path');

// 環境変数の読み込み
config({ path: path.resolve(__dirname, '../../.env') });

// MongoDB接続設定
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

async function checkTestUsers() {
  try {
    // MongoDB接続
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB接続成功');

    // ユーザーコレクションを取得（実際のスキーマに合わせた定義）
    const userSchema = new mongoose.Schema({
      firebaseId: String,
      email: String,
      displayName: String,
      role: String,
      createdAt: Date,
      updatedAt: Date,
      // 他のフィールドも必要に応じて定義
    }, { strict: false });
    
    const User = mongoose.model('User', userSchema, 'users');

    // 特定のユーザーを検索
    console.log('\n1. テスト用ユーザーの確認:');
    const testUser = await User.findOne({ email: 'shiraishi.tatsuya@mikoto.co.jp' });
    if (testUser) {
      console.log('テスト用ユーザーが見つかりました:');
      console.log(`  ID: ${testUser._id}`);
      console.log(`  Email: ${testUser.email}`);
      console.log(`  Name: ${testUser.displayName}`);
      console.log(`  Role: ${testUser.role}`);
    } else {
      console.log('テスト用ユーザーが見つかりません: shiraishi.tatsuya@mikoto.co.jp');
    }

    // firebaseIdによる検索
    console.log('\n2. Firebase UIDによるユーザー検索:');
    const firebaseIdToSearch = 'Bs2MacLtK1Z1fVnau2dYPpsWRpa2';
    const userByFirebaseId = await User.findOne({ firebaseId: firebaseIdToSearch });
    if (userByFirebaseId) {
      console.log(`Firebase UID ${firebaseIdToSearch} のユーザーが見つかりました:`);
      console.log(`  ID: ${userByFirebaseId._id}`);
      console.log(`  Email: ${userByFirebaseId.email}`);
      console.log(`  Name: ${userByFirebaseId.displayName}`);
      console.log(`  すべてのフィールド:`, JSON.stringify(userByFirebaseId.toObject(), null, 2));
    } else {
      console.log(`Firebase UID ${firebaseIdToSearch} のユーザーが見つかりません`);
    }

    // すべてのユーザー
    console.log('\n3. すべてのユーザー:');
    const allUsers = await User.find();
    console.log(`データベース内の全ユーザー数: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.displayName || 'No Name'}) - ID: ${user._id}`);
    });

    // コレクション情報
    console.log('\n4. コレクション情報:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('データベース内のコレクション:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });

    // Schema情報
    console.log('\n5. ユーザースキーマ情報:');
    const userInfo = await User.findOne();
    if (userInfo) {
      console.log('ユーザードキュメントの構造:', Object.keys(userInfo._doc));
    }

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    // MongoDB切断
    await mongoose.disconnect();
    console.log('\nMongoDB切断');
  }
}

// スクリプト実行
checkTestUsers();