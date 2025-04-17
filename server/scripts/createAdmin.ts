import * as dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { connectToDatabase } from '../src/config/database';
import mongoose from 'mongoose';
import { User } from '../src/models';

// UserRoleを直接定義（@shared/indexからのインポートができない場合）
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

// Firebaseで使用するロールとMongoDBで使用するロールのマッピング
const roleMapping = {
  [UserRole.USER]: 'User',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.SUPER_ADMIN]: 'SuperAdmin',
};

// 環境変数を読み込み
dotenv.config();

// Firebase Admin初期化
const initializeFirebaseAdmin = () => {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
  }

  try {
    // 環境変数からJSONを解析
    const serviceAccountJson = JSON.parse(
      Buffer.from(serviceAccount, 'base64').toString()
    );

    // Firebaseアプリを初期化
    const app = initializeApp({
      credential: cert(serviceAccountJson),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    }, 'admin-script');

    console.log('Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
};

// サービスアカウントJSONファイルを直接使用
const serviceAccountPath = '/Users/tatsuya/Desktop/システム開発/DailyFortune/docs/scopes/sys-76614112762438486420044584-firebase-adminsdk-fbsvc-cfd0a33bc9.json';
const fs = require('fs');

let firebaseApp;

try {
  // JSONファイルを読み込み
  const serviceAccountJson = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  // Firebase Adminを初期化
  firebaseApp = initializeApp({
    credential: cert(serviceAccountJson),
    databaseURL: `https://${serviceAccountJson.project_id}.firebaseio.com`
  }, 'admin-script');
  
  console.log('Firebase Admin initialized for admin creation using service account file');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

const auth = getAuth(firebaseApp);

// 管理者ユーザーの作成
async function createAdminUser(email: string, password: string, displayName: string) {
  try {
    // 1. Firebaseユーザーを作成
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });

    console.log('Firebase ユーザーが作成されました:', userRecord.uid);

    // 2. カスタムクレームを設定して管理者権限を付与
    await auth.setCustomUserClaims(userRecord.uid, { role: UserRole.SUPER_ADMIN });
    
    console.log('ユーザーにスーパー管理者権限を付与しました:', email);

    // 3. データベースに管理者ユーザーを登録
    try {
      await connectToDatabase();
      console.log('データベースに接続しました');
      
      // Default organization and team IDs (temporary values)
      const defaultOrganizationId = new mongoose.Types.ObjectId();
      const defaultTeamId = new mongoose.Types.ObjectId();
      
      // ユーザー情報をMongoDBに保存
      const newUser = new User({
        _id: new mongoose.Types.ObjectId(userRecord.uid),
        email,
        displayName,
        // Firebaseのロール（'super_admin'）をMongoDBのロール（'SuperAdmin'）に変換
        role: roleMapping[UserRole.SUPER_ADMIN],
        organizationId: defaultOrganizationId,
        teamId: defaultTeamId,
        plan: 'elite',
        isActive: true
      });
      
      await newUser.save();
      console.log('データベースにユーザー情報を登録しました:', newUser._id);

    } catch (dbError) {
      console.error('データベース操作エラー:', dbError);
      // データベース操作に失敗してもFirebaseユーザーは作成されているので
      // 全体としては成功とみなす
    }

    return userRecord;
  } catch (error) {
    console.error('管理者ユーザー作成エラー:', error);
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

// コマンドライン引数からユーザー情報を取得
const email = process.argv[2];
const password = process.argv[3];
const displayName = process.argv[4] || email.split('@')[0];

if (!email || !password) {
  console.error('使用方法: ts-node createAdmin.ts <email> <password> [displayName]');
  process.exit(1);
}

// 管理者ユーザーを作成
createAdminUser(email, password, displayName)
  .then(user => {
    console.log(`管理者ユーザーの作成が完了しました: ${user.email}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  });