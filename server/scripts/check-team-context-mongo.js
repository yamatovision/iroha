/**
 * MongoDBに接続して特定のチームIDに関する詳細情報を調査するスクリプト
 */
require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB接続URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

// 調査対象のチームID（コマンドライン引数で受け取るか、デフォルト値を使用）
const TEAM_ID1 = process.argv[2] || '6805e8e7952f7bda054b4477'; // ローカルで表示されるID
const TEAM_ID2 = process.argv[3] || '67f71bb9b24269b1a55c6afb'; // 本番で表示されるID

async function main() {
  try {
    console.log('MongoDB接続中...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB接続完了\n');

    // Teamsコレクションのスキーマを確認
    const Team = mongoose.connection.collection('teams');
    const TeamMembership = mongoose.connection.collection('teammemberships');
    const User = mongoose.connection.collection('users');
    const TeamContextFortune = mongoose.connection.collection('teamcontextfortunes');

    // チーム情報を取得
    console.log(`===== チームID1 (ローカル表示) の情報: ${TEAM_ID1} =====`);
    const team1 = await Team.findOne({ _id: new mongoose.Types.ObjectId(TEAM_ID1) });
    if (team1) {
      console.log(`チーム名: ${team1.name}`);
      console.log(`管理者ID: ${team1.adminId}`);
      console.log(`作成日: ${team1.createdAt}`);
      console.log(`説明: ${team1.description || 'なし'}`);
      console.log(`デフォルトフラグ: ${team1.isDefault ? 'あり' : 'なし'}`);
      
      // チームメンバー数を取得
      const memberCount1 = await TeamMembership.countDocuments({ teamId: TEAM_ID1 });
      console.log(`メンバー数: ${memberCount1}`);
      
      // チームコンテキスト運勢データを確認
      const teamContextFortune1 = await TeamContextFortune.findOne({ teamId: TEAM_ID1 });
      if (teamContextFortune1) {
        console.log(`チームコンテキスト運勢データ: あり (${teamContextFortune1.date ? new Date(teamContextFortune1.date).toISOString().split('T')[0] : '日付不明'})`);
      } else {
        console.log('チームコンテキスト運勢データ: なし');
      }
    } else {
      console.log(`チームID ${TEAM_ID1} は存在しません`);
    }
    
    console.log('\n');
    
    console.log(`===== チームID2 (本番自動表示) の情報: ${TEAM_ID2} =====`);
    const team2 = await Team.findOne({ _id: new mongoose.Types.ObjectId(TEAM_ID2) });
    if (team2) {
      console.log(`チーム名: ${team2.name}`);
      console.log(`管理者ID: ${team2.adminId}`);
      console.log(`作成日: ${team2.createdAt}`);
      console.log(`説明: ${team2.description || 'なし'}`);
      console.log(`デフォルトフラグ: ${team2.isDefault ? 'あり' : 'なし'}`);
      
      // チームメンバー数を取得
      const memberCount2 = await TeamMembership.countDocuments({ teamId: TEAM_ID2 });
      console.log(`メンバー数: ${memberCount2}`);
      
      // チームコンテキスト運勢データを確認
      const teamContextFortune2 = await TeamContextFortune.findOne({ teamId: TEAM_ID2 });
      if (teamContextFortune2) {
        console.log(`チームコンテキスト運勢データ: あり (${teamContextFortune2.date ? new Date(teamContextFortune2.date).toISOString().split('T')[0] : '日付不明'})`);
      } else {
        console.log('チームコンテキスト運勢データ: なし');
      }
    } else {
      console.log(`チームID ${TEAM_ID2} は存在しません`);
    }
    
    // 両方のチームの比較
    console.log('\n===== 両チームの比較 =====');
    if (team1 && team2) {
      console.log(`チーム1 (${TEAM_ID1}): ${team1.name}`);
      console.log(`チーム2 (${TEAM_ID2}): ${team2.name}`);
      
      // 作成日を比較
      console.log(`チーム1作成日: ${team1.createdAt ? new Date(team1.createdAt).toISOString() : '不明'}`);
      console.log(`チーム2作成日: ${team2.createdAt ? new Date(team2.createdAt).toISOString() : '不明'}`);
      
      // デフォルトフラグを比較
      console.log(`チーム1デフォルトフラグ: ${team1.isDefault ? 'あり' : 'なし'}`);
      console.log(`チーム2デフォルトフラグ: ${team2.isDefault ? 'あり' : 'なし'}`);
      
      // チームの順序を調査
      const allTeams = await Team.find({}).sort({ createdAt: 1 }).toArray();
      console.log(`\nデータベース内の全チーム数: ${allTeams.length}`);
      console.log('チームの順序（作成日順）:');
      
      for (let i = 0; i < allTeams.length; i++) {
        const team = allTeams[i];
        const isFirstTeam = team._id.toString() === TEAM_ID1;
        const isSecondTeam = team._id.toString() === TEAM_ID2;
        const highlight = isFirstTeam ? ' ← ローカル表示ID' : isSecondTeam ? ' ← 本番自動表示ID' : '';
        
        console.log(`${i+1}. ${team.name} (${team._id})${highlight}`);
      }
    }
    
    // ユーザー情報
    console.log('\n===== ユーザー調査 (shiraishi.tatsuya@mikoto.co.jp) =====');
    const user = await User.findOne({ email: 'shiraishi.tatsuya@mikoto.co.jp' });
    if (user) {
      console.log(`ユーザーID: ${user._id}`);
      console.log(`表示名: ${user.displayName}`);
      
      // チームメンバーシップを調査
      const memberships = await TeamMembership.find({ userId: user._id.toString() }).toArray();
      console.log(`\nメンバーシップ数: ${memberships.length}`);
      
      for (const membership of memberships) {
        const memberTeam = await Team.findOne({ _id: new mongoose.Types.ObjectId(membership.teamId) });
        const isFirstTeam = membership.teamId === TEAM_ID1;
        const isSecondTeam = membership.teamId === TEAM_ID2;
        const highlight = isFirstTeam ? ' ← ローカル表示ID' : isSecondTeam ? ' ← 本番自動表示ID' : '';
        
        console.log(`- チーム: ${memberTeam ? memberTeam.name : '不明'} (${membership.teamId})${highlight}`);
        console.log(`  役割: ${membership.role || '不明'}`);
        console.log(`  メンバー権限: ${membership.memberRole || '不明'}`);
        console.log(`  デフォルト: ${membership.isDefault ? 'はい' : 'いいえ'}`);
        console.log(`  参加日: ${membership.joinedAt ? new Date(membership.joinedAt).toISOString() : '不明'}`);
      }
      
      // アクティブチームID設定の動作を確認
      console.log('\n===== アクティブチームID選択ロジックの調査 =====');
      console.log('1. TeamContextのfetchTeamsにおいて、activeTeamIdが未設定か所属チームにない場合:');
      console.log('   → 配列の最初のチームが自動的に選択される');
      
      if (memberships.length > 0) {
        const sortedTeams = [...memberships].sort((a, b) => {
          const dateA = a.joinedAt ? new Date(a.joinedAt) : new Date(0);
          const dateB = b.joinedAt ? new Date(b.joinedAt) : new Date(0);
          return dateA - dateB;
        });
        
        console.log('\n参加日順に並べたチーム:');
        for (let i = 0; i < sortedTeams.length; i++) {
          const membership = sortedTeams[i];
          const memberTeam = await Team.findOne({ _id: new mongoose.Types.ObjectId(membership.teamId) });
          const isFirstTeam = membership.teamId === TEAM_ID1;
          const isSecondTeam = membership.teamId === TEAM_ID2;
          const highlight = isFirstTeam ? ' ← ローカル表示ID' : isSecondTeam ? ' ← 本番自動表示ID' : '';
          
          console.log(`${i+1}. ${memberTeam ? memberTeam.name : '不明'} (${membership.teamId})${highlight}`);
          console.log(`   参加日: ${membership.joinedAt ? new Date(membership.joinedAt).toISOString() : '不明'}`);
        }
        
        // API呼び出し順序の調査（実際にAPIから取得した場合の順序を確認）
        console.log('\n実際のAPIからの取得時の順序 (推測):');
        console.log('- 本番環境とローカル環境でteamServiceのgetUserTeams()の結果順序が異なる可能性があります');
        console.log('- これにより、デフォルト選択されるチームが環境によって異なります');
      }
    } else {
      console.log('ユーザーが見つかりません');
    }

  } catch (err) {
    console.error('エラー:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB接続を終了しました');
  }
}

main();