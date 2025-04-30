const mongoose = require('mongoose');
const admin = require('firebase-admin');
const fs = require('fs');

// Firebase Admin SDK初期化
const serviceAccountPath = '/Users/tatsuya/Desktop/システム開発/DailyFortune/docs/scopes/sys-76614112762438486420044584-firebase-adminsdk-fbsvc-cfd0a33bc9.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

// MongoDB接続
async function connectToDatabase() {
  try {
    await mongoose.connect('mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// User Modelの定義
const UserSchema = new mongoose.Schema({
  _id: String,
  email: String,
  displayName: String,
  role: {
    type: String,
    enum: ['User', 'Admin', 'SuperAdmin'],
    default: 'User'
  },
  organizationId: mongoose.Schema.Types.ObjectId,
  teamId: mongoose.Schema.Types.ObjectId,
  plan: {
    type: String,
    enum: ['free', 'premium', 'elite'],
    default: 'free'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);

// Firebaseのroleをモンゴのroleに変換
const roleMapping = {
  'user': 'User',
  'admin': 'Admin',
  'super_admin': 'SuperAdmin'
};

// メイン関数
async function syncFirebaseUsers() {
  try {
    await connectToDatabase();
    
    // Firebaseからすべてのユーザーを取得
    const listUsersResult = await admin.auth().listUsers();
    const firebaseUsers = listUsersResult.users;
    
    console.log(`Found ${firebaseUsers.length} users in Firebase`);
    
    // MongoDB内の既存ユーザーを取得
    const existingUsers = await User.find();
    const existingUserIds = new Set(existingUsers.map(user => user._id));
    
    console.log(`Found ${existingUsers.length} users in MongoDB`);
    
    // 追加または更新するユーザーをカウント
    let addedCount = 0;
    let updatedCount = 0;
    let alreadySyncedCount = 0;
    
    for (const firebaseUser of firebaseUsers) {
      // カスタムクレームからロールを取得
      const firebaseRole = (firebaseUser.customClaims && firebaseUser.customClaims.role) || 'user';
      const mongoRole = roleMapping[firebaseRole];
      
      // デフォルトのOrganizationIdとTeamId
      const defaultOrgId = new mongoose.Types.ObjectId();
      const defaultTeamId = new mongoose.Types.ObjectId();
      
      if (!existingUserIds.has(firebaseUser.uid)) {
        // 新しいユーザーを追加
        const newUser = new User({
          _id: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          role: mongoRole,
          organizationId: defaultOrgId,
          teamId: defaultTeamId,
          plan: firebaseRole === 'super_admin' ? 'elite' : 'free',
          isActive: true
        });
        
        await newUser.save();
        console.log(`Added user: ${firebaseUser.email}`);
        addedCount++;
      } else {
        // 既存ユーザーを更新
        const existingUser = await User.findById(firebaseUser.uid);
        
        // ロールを同期する必要があるか確認
        if (existingUser.role !== mongoRole) {
          existingUser.role = mongoRole;
          existingUser.updatedAt = new Date();
          await existingUser.save();
          console.log(`Updated user role for: ${firebaseUser.email}`);
          updatedCount++;
        } else {
          alreadySyncedCount++;
        }
      }
    }
    
    console.log('Synchronization completed:');
    console.log(`- Added: ${addedCount} users`);
    console.log(`- Updated: ${updatedCount} users`);
    console.log(`- Already synced: ${alreadySyncedCount} users`);
    
  } catch (error) {
    console.error('Error during synchronization:', error);
  } finally {
    // 接続を閉じる
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// スクリプトを実行
syncFirebaseUsers();