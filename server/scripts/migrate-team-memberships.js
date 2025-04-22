/**
 * TeamMembershipテーブルにmemberRoleを設定するマイグレーションスクリプト
 * 
 * 以下のルールでデータを移行:
 * - チーム作成者は'creator'ロールを設定
 * - isAdmin = trueのメンバーは'admin'ロールを設定
 * - それ以外のメンバーは'member'ロールを設定
 * 
 * 使用方法:
 * $ node scripts/migrate-team-memberships.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// モンゴDBへの接続
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB接続成功'))
  .catch(err => {
    console.error('MongoDB接続エラー:', err);
    process.exit(1);
  });

// TeamMemberRoleの定義 (共有定義と同一にする)
const TeamMemberRole = {
  CREATOR: 'creator',
  ADMIN: 'admin',
  MEMBER: 'member'
};

// Teamスキーマ定義
const teamSchema = new mongoose.Schema({
  name: String,
  adminId: mongoose.Schema.Types.ObjectId, // チーム作成者
  administrators: [mongoose.Schema.Types.ObjectId]
}, { collection: 'teams' });

// TeamMembershipスキーマ定義
const teamMembershipSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  teamId: mongoose.Schema.Types.ObjectId,
  role: String,
  memberRole: String,
  isAdmin: Boolean,
  joinedAt: Date
}, { collection: 'teammemberships' });

// モデル作成
const Team = mongoose.model('Team', teamSchema);
const TeamMembership = mongoose.model('TeamMembership', teamMembershipSchema);

/**
 * チームメンバーシップにロールを設定するマイグレーション
 */
async function migrateTeamMemberships() {
  console.log('チームメンバーシップマイグレーション開始...');
  let creatorCount = 0;
  let adminCount = 0;
  let memberCount = 0;
  let totalCount = 0;

  try {
    // すべてのチームを取得
    const teams = await Team.find({});
    console.log(`${teams.length}個のチームを処理します`);

    for (const team of teams) {
      console.log(`チームID: ${team._id} のメンバーシップを処理中...`);

      // チーム作成者をcreatorに設定
      if (team.adminId) {
        const result = await TeamMembership.findOneAndUpdate(
          { 
            teamId: team._id, 
            userId: team.adminId,
            memberRole: { $exists: false }  // memberRoleがまだ設定されていない場合のみ
          },
          { 
            $set: { 
              memberRole: TeamMemberRole.CREATOR,
              isAdmin: true  // 後方互換性のため
            } 
          }
        );
        
        if (result) {
          creatorCount++;
          console.log(`チーム作成者を設定: ${team.adminId}`);
        }
      }

      // isAdmin=trueのメンバーをadminに設定
      const adminResult = await TeamMembership.updateMany(
        {
          teamId: team._id,
          userId: { $ne: team.adminId }, // チーム作成者は除外
          isAdmin: true,
          memberRole: { $exists: false }  // memberRoleがまだ設定されていない場合のみ
        },
        { $set: { memberRole: TeamMemberRole.ADMIN } }
      );
      
      adminCount += adminResult.modifiedCount;
      console.log(`チーム管理者を設定: ${adminResult.modifiedCount}人`);

      // その他のメンバーをmemberに設定
      const memberResult = await TeamMembership.updateMany(
        {
          teamId: team._id,
          userId: { $ne: team.adminId }, // チーム作成者は除外
          isAdmin: false,
          memberRole: { $exists: false }  // memberRoleがまだ設定されていない場合のみ
        },
        { $set: { memberRole: TeamMemberRole.MEMBER } }
      );
      
      memberCount += memberResult.modifiedCount;
      console.log(`一般メンバーを設定: ${memberResult.modifiedCount}人`);
    }

    // memberRoleが設定されていない残りのメンバーシップを全て'member'に設定
    const remainingResult = await TeamMembership.updateMany(
      { memberRole: { $exists: false } },
      { $set: { memberRole: TeamMemberRole.MEMBER } }
    );
    
    memberCount += remainingResult.modifiedCount;
    console.log(`残りのメンバーを設定: ${remainingResult.modifiedCount}人`);

    totalCount = creatorCount + adminCount + memberCount;
    console.log('\nマイグレーション完了!');
    console.log(`合計処理件数: ${totalCount}`);
    console.log(`- チーム作成者(creator): ${creatorCount}人`);
    console.log(`- チーム管理者(admin): ${adminCount}人`);
    console.log(`- 一般メンバー(member): ${memberCount}人`);
    
  } catch (error) {
    console.error('マイグレーションエラー:', error);
  } finally {
    mongoose.disconnect();
    console.log('データベース接続を終了しました');
  }
}

// マイグレーション実行
migrateTeamMemberships();