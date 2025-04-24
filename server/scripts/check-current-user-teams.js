/**
 * 現在のユーザーが所属しているチームとチームメンバーシップの詳細を調査するスクリプト
 */
require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB接続URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

// 問題の原因を調査するため、新しく調査対象のユーザーIDを追加
const USER_ID = process.argv[2] || '67f87e86a7d83fb995de0ee6'; // デフォルトは白石さんのID
const TEAM_ID1 = '6805e8e7952f7bda054b4477'; // ローカルで表示されるID
const TEAM_ID2 = '67f71bb9b24269b1a55c6afb'; // 本番で表示されるID

async function main() {
  try {
    console.log('MongoDB接続中...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB接続完了\n');

    // 必要なコレクションの取得
    const TeamMembership = mongoose.connection.collection('teammemberships');
    const Team = mongoose.connection.collection('teams');
    const User = mongoose.connection.collection('users');

    // ユーザー情報の取得
    const user = await User.findOne({ _id: new mongoose.Types.ObjectId(USER_ID) });
    if (!user) {
      console.log(`ユーザーID ${USER_ID} が見つかりません`);
      return;
    }

    console.log(`===== ユーザー情報 =====`);
    console.log(`ID: ${user._id}`);
    console.log(`名前: ${user.displayName}`);
    console.log(`メール: ${user.email || '不明'}`);
    console.log(`作成日: ${user.createdAt ? new Date(user.createdAt).toISOString() : '不明'}`);

    // チームメンバーシップの取得
    console.log(`\n===== メンバーシップ情報 =====`);
    const memberships = await TeamMembership.find({ userId: USER_ID }).toArray();
    
    if (memberships.length === 0) {
      console.log(`このユーザーはどのチームにも所属していません`);
      
      // 検証：ユーザーIDがFirebaseID形式（文字列）の場合を確認
      const firebaseIdMemberships = await TeamMembership.find({ 
        userId: { $regex: /^[A-Za-z0-9]{20,28}$/ } 
      }).limit(5).toArray();
      
      if (firebaseIdMemberships.length > 0) {
        console.log(`\n検出: FirebaseID形式のユーザーIDを持つメンバーシップが存在します`);
        console.log(`サンプル: ${JSON.stringify(firebaseIdMemberships[0], null, 2)}`);
        
        // 対象ユーザーのFirebaseIDがあれば、それを使ってメンバーシップを再検索
        if (user.firebaseId) {
          console.log(`\nFirebaseIDでメンバーシップを再検索: ${user.firebaseId}`);
          const fbMemberships = await TeamMembership.find({ userId: user.firebaseId }).toArray();
          
          if (fbMemberships.length > 0) {
            console.log(`FirebaseIDでの検索結果: ${fbMemberships.length}件のメンバーシップが見つかりました`);
            // メンバーシップ詳細を表示
            for (const membership of fbMemberships) {
              const team = await Team.findOne({ _id: new mongoose.Types.ObjectId(membership.teamId) });
              console.log(`- チーム: ${team ? team.name : '不明'} (${membership.teamId})`);
              console.log(`  役割: ${membership.role || '不明'}`);
              console.log(`  参加日: ${membership.joinedAt ? new Date(membership.joinedAt).toISOString() : '不明'}`);
            }
          } else {
            console.log(`FirebaseIDでの検索結果: メンバーシップが見つかりません`);
          }
        }
      }
    } else {
      console.log(`このユーザーは ${memberships.length} 個のチームに所属しています`);
      
      // 各メンバーシップの詳細を表示
      for (const membership of memberships) {
        const team = await Team.findOne({ _id: new mongoose.Types.ObjectId(membership.teamId) });
        const isTeam1 = membership.teamId === TEAM_ID1;
        const isTeam2 = membership.teamId === TEAM_ID2;
        const highlight = isTeam1 ? ' ← ローカル表示ID' : isTeam2 ? ' ← 本番自動表示ID' : '';
        
        console.log(`\nチーム: ${team ? team.name : '不明'} (${membership.teamId})${highlight}`);
        console.log(`役割: ${membership.role || '不明'}`);
        console.log(`メンバー権限: ${membership.memberRole || '不明'}`);
        console.log(`管理者フラグ: ${membership.isAdmin ? 'はい' : 'いいえ'}`);
        console.log(`デフォルトフラグ: ${membership.isDefault ? 'はい' : 'いいえ'}`);
        console.log(`参加日: ${membership.joinedAt ? new Date(membership.joinedAt).toISOString() : '不明'}`);
      }
    }
    
    // 各チームの詳細を確認
    console.log(`\n===== 対象チームの詳細 =====`);
    
    // チーム1の情報
    const team1 = await Team.findOne({ _id: new mongoose.Types.ObjectId(TEAM_ID1) });
    if (team1) {
      console.log(`\nチーム1 (ローカル表示): ${team1.name}`);
      console.log(`ID: ${TEAM_ID1}`);
      console.log(`管理者ID: ${team1.adminId}`);
      console.log(`作成日: ${team1.createdAt ? new Date(team1.createdAt).toISOString() : '不明'}`);
      
      // 管理者ユーザー情報
      if (team1.adminId) {
        let adminUser;
        try {
          adminUser = await User.findOne({ _id: new mongoose.Types.ObjectId(team1.adminId) });
        } catch (e) {
          // ObjectIDでない場合はFirebaseIDとして検索
          adminUser = await User.findOne({ firebaseId: team1.adminId });
        }
        
        if (adminUser) {
          console.log(`管理者名: ${adminUser.displayName}`);
          console.log(`管理者メール: ${adminUser.email || '不明'}`);
        } else {
          console.log(`管理者ユーザー情報が見つかりません`);
        }
      }
      
      // チームのメンバー数
      const memberCount1 = await TeamMembership.countDocuments({ teamId: TEAM_ID1 });
      console.log(`メンバー数: ${memberCount1}`);
      
      if (memberCount1 > 0) {
        const members = await TeamMembership.find({ teamId: TEAM_ID1 }).toArray();
        console.log(`\nメンバー一覧:`);
        
        for (const member of members) {
          let memberUser;
          try {
            memberUser = await User.findOne({ _id: new mongoose.Types.ObjectId(member.userId) });
          } catch (e) {
            memberUser = await User.findOne({ firebaseId: member.userId });
          }
          
          console.log(`- ${memberUser ? memberUser.displayName : '不明'} (${member.userId})`);
          console.log(`  役割: ${member.role || '不明'}`);
          console.log(`  参加日: ${member.joinedAt ? new Date(member.joinedAt).toISOString() : '不明'}`);
        }
      }
    } else {
      console.log(`チーム1 (${TEAM_ID1}) の情報が見つかりません`);
    }
    
    // チーム2の情報
    const team2 = await Team.findOne({ _id: new mongoose.Types.ObjectId(TEAM_ID2) });
    if (team2) {
      console.log(`\nチーム2 (本番自動表示): ${team2.name}`);
      console.log(`ID: ${TEAM_ID2}`);
      console.log(`管理者ID: ${team2.adminId}`);
      console.log(`作成日: ${team2.createdAt ? new Date(team2.createdAt).toISOString() : '不明'}`);
      
      // 管理者ユーザー情報
      if (team2.adminId) {
        let adminUser;
        try {
          adminUser = await User.findOne({ _id: new mongoose.Types.ObjectId(team2.adminId) });
        } catch (e) {
          // ObjectIDでない場合はFirebaseIDとして検索
          adminUser = await User.findOne({ firebaseId: team2.adminId });
        }
        
        if (adminUser) {
          console.log(`管理者名: ${adminUser.displayName}`);
          console.log(`管理者メール: ${adminUser.email || '不明'}`);
        } else {
          console.log(`管理者ユーザー情報が見つかりません`);
        }
      }
      
      // チームのメンバー数
      const memberCount2 = await TeamMembership.countDocuments({ teamId: TEAM_ID2 });
      console.log(`メンバー数: ${memberCount2}`);
      
      if (memberCount2 > 0) {
        const members = await TeamMembership.find({ teamId: TEAM_ID2 }).toArray();
        console.log(`\nメンバー一覧:`);
        
        for (const member of members) {
          let memberUser;
          try {
            memberUser = await User.findOne({ _id: new mongoose.Types.ObjectId(member.userId) });
          } catch (e) {
            memberUser = await User.findOne({ firebaseId: member.userId });
          }
          
          console.log(`- ${memberUser ? memberUser.displayName : '不明'} (${member.userId})`);
          console.log(`  役割: ${member.role || '不明'}`);
          console.log(`  参加日: ${member.joinedAt ? new Date(member.joinedAt).toISOString() : '不明'}`);
        }
      }
    } else {
      console.log(`チーム2 (${TEAM_ID2}) の情報が見つかりません`);
    }
    
    // 解決策の提案
    console.log(`\n===== 問題の原因と解決策 =====`);
    console.log(`問題: ローカル環境では ${TEAM_ID1} が表示され、本番環境では ${TEAM_ID2} が自動選択される`);
    console.log(`原因:`);
    console.log(`1. チームID1 (${TEAM_ID1}) はローカル環境のストレージに保存されたActiveTeamIDで、ユーザーが選択したチーム`);
    console.log(`2. チームID2 (${TEAM_ID2}) はデータベース内で最初のチームであり、本番環境で自動選択される`);
    console.log(`3. TeamContext.tsxのfetchTeams関数において、activeTeamIdが未設定か所属チームにない場合は`);
    console.log(`   userTeams配列の最初のチーム(インデックス0)が自動選択される`);
    console.log(`4. 本番環境ではおそらくActiveTeamIDが保存されていないか、異なるブラウザでアクセスしている`);
    
    console.log(`\n解決策:`);
    console.log(`1. チームの選択ロジックを改良する（例: ユーザーが管理者のチームを優先する）`);
    console.log(`2. デフォルトチームをデータベースに指定する（isDefaultフラグを使用）`);
    console.log(`3. ユーザーの最後の選択を永続的に保存する仕組みを強化する`);

  } catch (err) {
    console.error('エラー:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB接続を終了しました');
  }
}

main();