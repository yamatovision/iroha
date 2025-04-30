/**
 * テスト用ユーザーを作成するスクリプト
 */
const mongoose = require('mongoose');
const { config } = require('dotenv');
const path = require('path');

// 環境変数の読み込み
config({ path: path.resolve(__dirname, '../../.env') });

// MongoDB接続設定
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

// モデル定義
const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  displayName: String,
  role: {
    type: String,
    enum: ['User', 'Admin', 'SuperAdmin'],
    default: 'User'
  },
  teamId: mongoose.Schema.Types.ObjectId,
  plan: {
    type: String,
    enum: ['elite', 'lite'],
    default: 'lite'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // その他の必要なフィールド
  elementAttribute: String,
  birthDate: Date,
  birthTime: String,
  gender: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    // MongoDB接続
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB接続成功');

    // テスト用ユーザーの情報
    const testUserData = {
      _id: 'Bs2MacLtK1Z1fVnau2dYPpsWRpa2', // メインテストユーザーID
      email: 'shiraishi.tatsuya@mikoto.co.jp',
      displayName: 'Tatsuya',
      role: 'SuperAdmin',
      plan: 'elite',
      isActive: true,
      elementAttribute: 'metal',
      birthDate: new Date('1986-05-26'),
      birthTime: '05:00',
      gender: 'M'
    };

    // 既存のユーザーをチェック
    const existingUser = await User.findById(testUserData._id);
    
    if (existingUser) {
      console.log('テスト用ユーザーは既に存在します:', existingUser.email);
    } else {
      // 新しいユーザーを作成
      const newUser = await User.create(testUserData);
      console.log('テスト用ユーザーを作成しました:', newUser.email);
    }

    // その他のテスト用ユーザーも同様に作成
    const otherTestUsers = [
      {
        _id: 'jFaU2Jq7pzeskDpyuELmCADjjw43',
        email: 'shiraishi.ami@mikoto.co.jp',
        displayName: 'あみ',
        role: 'User',
        plan: 'lite',
        isActive: true,
        elementAttribute: 'wood',
        birthDate: new Date('1994-07-12'),
        birthTime: '12:00',
        gender: 'F'
      },
      {
        _id: '65fdc1f9e38f04d2d7636222',
        email: 'test.user1@example.com',
        displayName: 'Test User 1',
        role: 'User',
        plan: 'lite',
        isActive: true,
        elementAttribute: 'wood',
        birthDate: new Date('1990-01-01'),
        birthTime: '10:00',
        gender: 'M'
      },
      {
        _id: '65fdc1f9e38f04d2d7636223',
        email: 'test.user2@example.com',
        displayName: 'Test User 2',
        role: 'User',
        plan: 'lite',
        isActive: true,
        elementAttribute: 'fire',
        birthDate: new Date('1990-02-02'),
        birthTime: '14:00',
        gender: 'F'
      }
    ];

    for (const userData of otherTestUsers) {
      const existingOtherUser = await User.findById(userData._id);
      
      if (existingOtherUser) {
        console.log('テスト用ユーザーは既に存在します:', existingOtherUser.email);
      } else {
        const newUser = await User.create(userData);
        console.log('テスト用ユーザーを作成しました:', newUser.email);
      }
    }

    // すべてのユーザーを表示
    const allUsers = await User.find();
    console.log(`\nデータベース内の全ユーザー (${allUsers.length}人):`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.displayName}) - ${user._id}`);
    });

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    // MongoDB切断
    await mongoose.disconnect();
    console.log('\nMongoDB切断');
  }
}

// スクリプト実行
createTestUser();