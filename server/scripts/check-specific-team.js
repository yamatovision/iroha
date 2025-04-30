/**
 * ユーザー所属チームおよびメンバーシップの整合性を検証するスクリプト
 */
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDBへの接続
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

// コマンドライン引数からユーザーIDを取得
const userId = process.argv[2];
if (!userId) {
  console.error('ユーザーIDを指定してください。例: node check-specific-team.js 6806c251ee9352d08ceba138');
  process.exit(1);
}

// クリーンアップモードかどうかのフラグ
const cleanupMode = process.argv.includes('--cleanup');

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // コレクション取得
    const userCollection = mongoose.connection.collection('users');
    const teamCollection = mongoose.connection.collection('teams');
    const teamMembershipCollection = mongoose.connection.collection('teammemberships');
    
    console.log(`\n=== ユーザーID: ${userId} の所属チーム検証 ===`);
    
    // ユーザーの存在確認
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
      console.log('有効なユーザーIDフォーマットです');
    } catch (err) {
      console.error('無効なユーザーIDフォーマットです:', err.message);
      process.exit(1);
    }
    
    // ユーザー情報を取得
    const user = await userCollection.findOne({ _id: userObjectId });
    
    if (!user) {
      console.error('ユーザーが見つかりません');
      process.exit(1);
    }
    
    console.log(`\n--- ユーザー情報 ---`);
    console.log(`ID: ${user._id}`);
    console.log(`Name: ${user.displayName || 'N/A'}`);
    console.log(`Email: ${user.email || 'N/A'}`);
    
    // メンバーシップデータを取得
    const memberships = await teamMembershipCollection.find({ userId: userObjectId }).toArray();
    
    console.log(`\n--- メンバーシップ情報 (${memberships.length}件) ---`);
    
    // 問題のある（存在しないチームを参照している）メンバーシップのリスト
    const invalidMemberships = [];
    
    // 各メンバーシップについて詳細を表示
    for (const membership of memberships) {
      const teamId = membership.teamId;
      const teamObjectId = membership.teamId instanceof mongoose.Types.ObjectId 
                         ? membership.teamId 
                         : new mongoose.Types.ObjectId(membership.teamId);
      
      // チームデータを取得
      const team = await teamCollection.findOne({ _id: teamObjectId });
      
      if (team) {
        console.log(`- チームあり - Name: ${team.name}, ID: ${teamId}, Role: ${membership.role || 'N/A'}`);
      } else {
        console.log(`- チームなし - ID: ${teamId}, Role: ${membership.role || 'N/A'} (存在しないチームへの参照)`);
        invalidMemberships.push(membership);
      }
    }
    
    // 管理者として登録されているチームを検索
    console.log(`\n--- 管理者チーム ---`);
    const adminTeams = await teamCollection.find({ 
      $or: [
        { adminId: userObjectId },
        { administrators: userObjectId }
      ]
    }).toArray();
    
    console.log(`管理者チーム数: ${adminTeams.length}件`);
    for (const team of adminTeams) {
      console.log(`- Name: ${team.name}, ID: ${team._id}`);
      
      // このチームのメンバーシップがあるか確認
      const membership = memberships.find(m => 
        m.teamId.toString() === team._id.toString()
      );
      
      if (!membership) {
        console.log(`  警告: このチームのメンバーシップ情報がありません`);
      }
    }
    
    // getUserTeamsWithMemberships のロジックをシミュレート
    console.log(`\n--- getUserTeamsWithMemberships シミュレーション ---`);
    
    // チームIDを抽出
    const teamIds = memberships.map(m => m.teamId);
    
    // 重複を除去したチームIDリスト
    const uniqueTeamIds = [...new Set(
      memberships.map(m => m.teamId.toString())
    )];
    
    console.log(`ユニークなチームID数: ${uniqueTeamIds.length}件`);
    
    // チーム情報を取得
    const teams = await teamCollection.find({
      _id: { $in: uniqueTeamIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).toArray();
    
    console.log(`取得できたチーム数: ${teams.length}件`);
    
    // 存在しないチームIDのリスト
    const missingTeamIds = uniqueTeamIds.filter(id => 
      !teams.some(team => team._id.toString() === id)
    );
    
    if (missingTeamIds.length > 0) {
      console.log(`\n*** 問題: ${missingTeamIds.length}件の存在しないチームIDが参照されています ***`);
      console.log('存在しないチームID:');
      missingTeamIds.forEach(id => console.log(`- ${id}`));
    } else {
      console.log(`\n全てのチームIDは有効です`);
    }
    
    // クリーンアップモードであれば、存在しないチームのメンバーシップを削除
    if (cleanupMode && invalidMemberships.length > 0) {
      console.log(`\n--- クリーンアップモード: ${invalidMemberships.length}件の無効なメンバーシップを削除します ---`);
      
      for (const membership of invalidMemberships) {
        console.log(`削除: メンバーシップID ${membership._id}, TeamID ${membership.teamId}`);
        await teamMembershipCollection.deleteOne({ _id: membership._id });
      }
      
      console.log(`クリーンアップ完了: ${invalidMemberships.length}件のメンバーシップを削除しました`);
    } else if (invalidMemberships.length > 0) {
      console.log(`\n無効なメンバーシップを削除するには --cleanup オプションを追加してください`);
    }
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    // 接続を閉じる
    await mongoose.disconnect();
    console.log('\nMongoDBとの接続を切断しました');
  }
}

// スクリプトを実行
main();