const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB接続情報
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

// ユーザースキーマの簡易版を作成（実際のモデルに合わせて調整）
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  role: { type: String, enum: ['SuperAdmin', 'Admin', 'User'], default: 'User' },
  plan: { type: String, enum: ['elite', 'lite'], default: 'lite' },
  isActive: { type: Boolean, default: true },
  refreshToken: String,
  tokenVersion: { type: Number, default: 0 },
  lastLogin: Date
}, { timestamps: true });

// パスワードハッシュ化フック
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// モデル登録
const User = mongoose.model('User', userSchema);

async function createJwtUser() {
  try {
    // MongoDB接続
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDBに接続しました');
    
    // SuperAdminユーザーの作成
    const tatsuyaEmail = 'shiraishi.tatsuya@mikoto.co.jp';
    const existingTatsuya = await User.findOne({ email: tatsuyaEmail });
    
    if (existingTatsuya) {
      // 既存ユーザーの更新
      console.log('既存ユーザーを更新します:', existingTatsuya.email);
      
      // パスワードとロールを更新
      existingTatsuya.password = 'aikakumei';
      existingTatsuya.role = 'SuperAdmin';
      await existingTatsuya.save();
      
      console.log('スーパー管理者更新完了:');
      console.log('- ID:', existingTatsuya._id);
      console.log('- Email:', existingTatsuya.email);
      console.log('- Role:', existingTatsuya.role);
      
    } else {
      // 新規ユーザー作成
      const newSuperAdmin = new User({
        email: tatsuyaEmail,
        password: 'aikakumei', // 保存前に自動的にハッシュ化
        displayName: 'Tatsuya Shiraishi',
        role: 'SuperAdmin',
        plan: 'elite',
        isActive: true
      });
      
      await newSuperAdmin.save();
      
      console.log('新規スーパー管理者作成完了:');
      console.log('- ID:', newSuperAdmin._id);
      console.log('- Email:', newSuperAdmin.email);
      console.log('- Role:', newSuperAdmin.role);
    }
    
  } catch (err) {
    console.error('エラー:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDBの接続を閉じました');
  }
}

// スクリプト実行
createJwtUser();