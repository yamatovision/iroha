const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// JWT設定
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'dailyfortune_access_token_secret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'dailyfortune_refresh_token_secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// JWT生成関数
function generateAccessToken(user) {
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
}

function generateRefreshToken(user) {
  const payload = {
    sub: user._id.toString(),
    tokenVersion: user.tokenVersion || 0
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY
  });
}

async function migrateUsersToJwt() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
  const DB_NAME = process.env.DB_NAME || 'dailyfortune';
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });
    console.log('Connected to MongoDB successfully');
    
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    const users = await User.find().lean();
    console.log(`\nPreparing to migrate ${users.length} users to JWT authentication:`);
    
    // ユーザーごとにJWT認証情報を設定
    for (const user of users) {
      console.log(`\nMigrating user: ${user.email}`);
      
      // パスワードが既に設定済みか確認
      if (!user.password) {
        console.log(`  WARNING: User ${user.email} does not have a password set!`);
        console.log(`  Skipping this user. Please set a password for this user manually.`);
        continue;
      }
      
      // リフレッシュトークンを生成
      const refreshToken = generateRefreshToken(user);
      const accessToken = generateAccessToken(user);
      
      // Firebaseのuidを対応フィールドに保存
      const firebaseUid = user.uid || null;
      
      // ユーザーを更新 (emailで検索して更新する)
      await User.updateOne(
        { email: user.email },
        { 
          $set: {
            refreshToken,
            lastLogin: new Date(),
            firebaseUid: firebaseUid
          }
        }
      );
      
      console.log(`  Migration successful for ${user.email}`);
      console.log(`  Access Token: ${accessToken.substring(0, 20)}...`);
      console.log(`  Refresh Token: ${refreshToken.substring(0, 20)}...`);
    }
    
    console.log('\nMigration completed successfully!');
    console.log('Please verify the migration results with the check-jwt-status.js script.');
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

migrateUsersToJwt();