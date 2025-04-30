/**
 * チームメンバー取得APIをテストするスクリプト
 * 使用方法: node test-team-members-api.js <チームID> <ユーザーID>
 */

const mongoose = require('mongoose');
require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

// 引数からチームIDとユーザーIDを取得
const teamId = process.argv[2];
const userId = process.argv[3];

if (!teamId || !userId) {
  console.error('チームIDとユーザーIDを指定してください。例: node test-team-members-api.js 6805e8e7952f7bda054b4477 67f87e86a7d83fb995de0ee6');
  process.exit(1);
}

// MongoDBへの接続
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

// JWTトークンを生成する関数
function generateToken(userId) {
  const payload = {
    id: userId,
    role: 'User'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function main() {
  let mongoConn = null;
  
  try {
    console.log('Connecting to MongoDB...');
    mongoConn = await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // コレクション取得
    const teamCollection = mongoose.connection.collection('teams');
    const userCollection = mongoose.connection.collection('users');
    const teamMembershipCollection = mongoose.connection.collection('teammemberships');

    console.log(`\n=== テスト実行: チームID ${teamId}, ユーザーID ${userId} ===`);

    // チームとユーザーの存在確認
    const team = await teamCollection.findOne({ _id: new mongoose.Types.ObjectId(teamId) });
    const user = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });

    if (!team) {
      console.error(`チームID ${teamId} は存在しません`);
      process.exit(1);
    }

    if (!user) {
      console.error(`ユーザーID ${userId} は存在しません`);
      process.exit(1);
    }

    console.log(`チーム「${team.name}」とユーザー「${user.displayName || user.email}」が存在することを確認しました`);

    // MongoDB上のチームメンバーシップを確認
    const membership = await teamMembershipCollection.findOne({
      teamId: new mongoose.Types.ObjectId(teamId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    console.log("\n=== MongoDB上のメンバーシップ情報 ===");
    if (membership) {
      console.log(`メンバーシップが存在します: ${JSON.stringify(membership, null, 2)}`);
    } else {
      console.log(`メンバーシップが存在しません`);
    }

    // チームのメンバー一覧をMongoDB直接取得
    const memberships = await teamMembershipCollection.find({
      teamId: new mongoose.Types.ObjectId(teamId)
    }).toArray();

    console.log(`\n=== MongoDB上の全チームメンバー (${memberships.length}) ===`);
    if (memberships.length > 0) {
      for (const mem of memberships) {
        console.log(`- User ID: ${mem.userId}, Role: ${mem.role || 'N/A'}, MemberRole: ${mem.memberRole || 'N/A'}`);
      }
    } else {
      console.log('メンバーが存在しません');
    }

    // JWTトークンを生成
    const token = generateToken(userId);
    console.log("\n=== JWTトークン ===");
    console.log(token);

    // APIリクエスト: チームメンバー取得
    console.log("\n=== API呼び出し: getTeamMembers ===");
    console.log(`${API_URL}/teams/${teamId}/members`);
    
    try {
      const response = await axios.get(`${API_URL}/teams/${teamId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // レスポンスを表示
      console.log("\n=== API レスポンス ===");
      console.log(`Status: ${response.status}`);
      console.log("データ:", JSON.stringify(response.data, null, 2));

      // メンバー一覧の分析
      if (response.data.members && response.data.members.length > 0) {
        console.log(`\n=== メンバー一覧分析 (${response.data.members.length}件) ===`);
        
        // ユーザーが含まれているか確認
        const foundMember = response.data.members.find(m => m.userId === userId);
        
        if (foundMember) {
          console.log(`✅ ユーザー ${userId} がメンバー一覧に含まれています:`);
          console.log(JSON.stringify(foundMember, null, 2));
        } else {
          console.log(`❌ ユーザー ${userId} がメンバー一覧に含まれていません`);
        }
      }

    } catch (error) {
      console.error("\n=== API エラー ===");
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error("Error data:", error.response.data);
      } else {
        console.error(error.message);
      }
    }

    // TeamMemberService.getTeamMembersを直接テスト
    console.log("\n=== チームメンバーサービスの直接テスト ===");
    try {
      // TeamMemberService.getTeamMembersのパス
      const { getTeamMembers } = require('../dist/services/team/team-member.service');
      
      // 関数を直接呼び出し
      console.log("TeamMemberService.getTeamMembers を直接呼び出しています...");
      const serviceMembers = await getTeamMembers(teamId, userId);
      
      console.log(`\n=== サービス関数の結果 (${serviceMembers.length}件) ===`);
      console.log(JSON.stringify(serviceMembers, null, 2));
      
      // ユーザーが含まれているか確認
      const foundMember = serviceMembers.find(m => 
        m._id.toString() === userId || 
        (typeof m._id === 'object' && m._id.toString() === userId)
      );
      
      if (foundMember) {
        console.log(`✅ ユーザー ${userId} がサービス結果に含まれています:`);
        console.log(JSON.stringify(foundMember, null, 2));
      } else {
        console.log(`❌ ユーザー ${userId} がサービス結果に含まれていません`);
      }
      
    } catch (serviceError) {
      console.error("サービス関数呼び出しエラー:", serviceError);
    }

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    // 接続を閉じる
    if (mongoConn) {
      await mongoose.disconnect();
      console.log('\nMongoDBとの接続を切断しました');
    }
  }
}

// スクリプトを実行
main();