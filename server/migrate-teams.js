require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB接続
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('環境変数MONGODB_URIが設定されていません');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB接続成功'))
  .catch(err => {
    console.error('MongoDB接続エラー:', err);
    process.exit(1);
  });

// Teamスキーマ定義
const teamSchema = new mongoose.Schema({
  name: String,
  adminId: mongoose.Schema.Types.Mixed,
  organizationId: mongoose.Schema.Types.ObjectId,
  description: String,
  iconInitial: String,
  iconColor: String,
  members: [{
    userId: mongoose.Schema.Types.Mixed,
    role: String,
    joinedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}, { versionKey: false });

// Teamモデル
const Team = mongoose.model('Team', teamSchema);

// マイグレーション実行関数
async function migrateTeams() {
  try {
    // membersフィールドが存在しないチームを検索
    const teams = await Team.find({ members: { $exists: false } });
    console.log(`マイグレーション対象チーム数: ${teams.length}`);
    
    // 各チームを更新
    for (const team of teams) {
      console.log(`チーム処理: "${team.name}" (ID: ${team._id})`);
      
      // membersフィールドを追加（管理者を最初のメンバーとして追加）
      const updateResult = await Team.updateOne(
        { _id: team._id },
        { 
          $set: { 
            members: [{
              userId: team.adminId,
              role: 'admin',
              joinedAt: team.createdAt || new Date()
            }]
          }
        }
      );
      
      console.log(`チーム "${team.name}" 更新結果:`, updateResult);
    }
    
    console.log('マイグレーション完了');
  } catch (error) {
    console.error('マイグレーションエラー:', error);
  } finally {
    // MongoDB接続を閉じる
    await mongoose.connection.close();
    console.log('MongoDB接続を閉じました');
  }
}

// マイグレーション実行
migrateTeams();
