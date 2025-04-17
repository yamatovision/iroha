import * as dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { connectToDatabase } from '../src/config/database';
import mongoose from 'mongoose';
import { User } from '../src/models';

// 環境変数を読み込み
dotenv.config();

// UserRoleのマッピング (Firebase形式 -> MongoDB形式)
const roleMapping: { [key: string]: string } = {
  'user': 'User',
  'admin': 'Admin',
  'super_admin': 'SuperAdmin'
};

// サービスアカウントJSONファイルを直接使用
const serviceAccountPath = '/Users/tatsuya/Desktop/システム開発/DailyFortune/docs/scopes/sys-76614112762438486420044584-firebase-adminsdk-fbsvc-cfd0a33bc9.json';
const fs = require('fs');

// Firebase Adminを初期化
let firebaseApp;
try {
  // JSONファイルを読み込み
  const serviceAccountJson = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  // Firebase Adminを初期化
  firebaseApp = initializeApp({
    credential: cert(serviceAccountJson),
    databaseURL: `https://${serviceAccountJson.project_id}.firebaseio.com`
  }, 'sync-users-script');
  
  console.log('Firebase Admin initialized for user synchronization');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

const auth = getAuth(firebaseApp);

// ユーザー同期処理
async function syncUsers() {
  try {
    // MongoDBに接続
    await connectToDatabase();
    console.log('データベースに接続しました');
    
    // Firebase認証から全ユーザーを取得
    console.log('Firebaseからユーザー一覧を取得中...');
    const listUsersResult = await auth.listUsers();
    const firebaseUsers = listUsersResult.users;
    
    console.log(`Firebase上に ${firebaseUsers.length} 人のユーザーが見つかりました`);
    
    // MongoDBから全ユーザーを取得
    const mongoUsers = await User.find({});
    console.log(`MongoDB上に ${mongoUsers.length} 人のユーザーが見つかりました`);
    
    // MongoDBに存在しないユーザーを特定
    // mongoUsers配列の各要素からDocumentのIDを文字列として取得
    const mongoUserIds = mongoUsers.map(user => String(user._id));
    const missingUsers = firebaseUsers.filter(user => !mongoUserIds.includes(user.uid));
    
    console.log(`MongoDBに存在しないユーザー: ${missingUsers.length} 人`);
    
    // 組織IDとチームIDのデフォルト値
    const defaultOrganizationId = new mongoose.Types.ObjectId();
    const defaultTeamId = new mongoose.Types.ObjectId();
    
    // MongoDBに存在しないユーザーを追加
    if (missingUsers.length > 0) {
      for (const firebaseUser of missingUsers) {
        // カスタムクレームから権限を取得
        const userRecord = await auth.getUser(firebaseUser.uid);
        const customClaims = userRecord.customClaims || {};
        const firebaseRole = customClaims.role || 'user';
        const mongoRole = roleMapping[firebaseRole] || 'User';
        
        console.log(`ユーザー同期中: ${firebaseUser.email} (uid: ${firebaseUser.uid}, role: ${mongoRole})`);
        
        // MongoDBにユーザーを作成（UIDをそのまま使用）
        const newUser = new User({
          _id: firebaseUser.uid,  // ObjectIDに変換せず、UIDをそのまま使用
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          password: 'firebase-auth-' + Math.random().toString(36).substring(2), // Firebase認証なのでパスワードはダミー
          role: mongoRole as 'SuperAdmin' | 'Admin' | 'User',
          organizationId: defaultOrganizationId,
          teamId: defaultTeamId,
          plan: mongoRole === 'SuperAdmin' || mongoRole === 'Admin' ? 'elite' : 'lite',
          isActive: !firebaseUser.disabled
        });
        
        await newUser.save();
        console.log(`ユーザーをMongoDBに追加しました: ${newUser._id}`);
      }
      
      console.log(`${missingUsers.length} 人のユーザーを正常に同期しました`);
    } else {
      console.log('同期が必要なユーザーはいません');
    }
    
    return { 
      total: firebaseUsers.length,
      synced: missingUsers.length
    };
  } catch (error) {
    console.error('ユーザー同期エラー:', error);
    throw error;
  } finally {
    // Mongooseの接続を閉じる
    try {
      await mongoose.disconnect();
      console.log('データベース接続を閉じました');
    } catch (err) {
      console.error('データベース切断エラー:', err);
    }
  }
}

// 特定のユーザーのみを同期（オプション）
async function syncSpecificUser(email: string) {
  try {
    // データベースに接続
    await connectToDatabase();
    console.log('データベースに接続しました');
    
    // Firebaseからユーザーを取得
    console.log(`ユーザー取得中: ${email}`);
    const userRecord = await auth.getUserByEmail(email);
    
    // MongoDBでユーザーを検索 (文字列IDとして)
    const existingUser = await User.findById(userRecord.uid).exec();
    
    if (existingUser) {
      console.log(`ユーザーはすでにMongoDBに存在します: ${email}`);
      return false;
    }
    
    // カスタムクレームから権限を取得
    const customClaims = userRecord.customClaims || {};
    const firebaseRole = customClaims.role || 'user';
    const mongoRole = roleMapping[firebaseRole] || 'User';
    
    console.log(`Firebase権限: ${firebaseRole}, MongoDB権限: ${mongoRole}`);
    
    // 組織IDとチームIDのデフォルト値
    const defaultOrganizationId = new mongoose.Types.ObjectId();
    const defaultTeamId = new mongoose.Types.ObjectId();
    
    // MongoDBにユーザーを作成
    const newUser = new User({
      _id: userRecord.uid,  // ObjectIDに変換せず、UIDをそのまま使用
      email: userRecord.email,
      displayName: userRecord.displayName || userRecord.email?.split('@')[0] || 'User',
      password: 'firebase-auth-' + Math.random().toString(36).substring(2), // Firebase認証なのでパスワードはダミー
      role: mongoRole as 'SuperAdmin' | 'Admin' | 'User',
      organizationId: defaultOrganizationId,
      teamId: defaultTeamId,
      plan: mongoRole === 'SuperAdmin' || mongoRole === 'Admin' ? 'elite' : 'lite',
      isActive: !userRecord.disabled
    });
    
    try {
      await newUser.save();
      console.log(`ユーザーをMongoDBに追加しました: ${email} (${userRecord.uid})`);
      return true;
    } catch (saveError) {
      console.error(`ユーザー保存エラー:`, saveError);
      throw saveError;
    }
  } catch (error) {
    console.error(`ユーザー同期エラー (${email}):`, error);
    throw error;
  } finally {
    // Mongooseの接続を閉じる
    try {
      await mongoose.disconnect();
      console.log('データベース接続を閉じました');
    } catch (err) {
      console.error('データベース切断エラー:', err);
    }
  }
}

// コマンドライン引数からモードを判断
const specificEmail = process.argv[2];

if (specificEmail && specificEmail.includes('@')) {
  // 特定のユーザーのみを同期
  syncSpecificUser(specificEmail)
    .then(isCreated => {
      if (isCreated) {
        console.log(`ユーザー ${specificEmail} の同期が完了しました`);
      } else {
        console.log(`ユーザー ${specificEmail} はすでに同期されています`);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('エラーが発生しました:', error);
      process.exit(1);
    });
} else {
  // 全ユーザーを同期
  syncUsers()
    .then(result => {
      console.log(`同期が完了しました: ${result.total} 人中 ${result.synced} 人のユーザーを同期しました`);
      process.exit(0);
    })
    .catch(error => {
      console.error('エラーが発生しました:', error);
      process.exit(1);
    });
}