/**
 * 標準相性診断APIのテストスクリプト
 * 実際のユーザーデータを使用して相性診断APIを呼び出すシンプルなテスト
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const { generateToken } = require('./utils/auth-helper');

// デフォルト設定
const API_BASE_URL = 'http://localhost:8080/api/v1';
const DEFAULT_USER1_ID = '65f4fe4bfe04b371f21576f7'; // テスト用ユーザー1のID
const DEFAULT_USER2_ID = '65f4fbbd4da35d0b2e8891ed'; // テスト用ユーザー2のID
const DEFAULT_TEAM_ID = '67f4fe12fe04b371f21531a1'; // テスト用チームのID

// コマンドライン引数解析
const args = process.argv.slice(2);
const userId1 = args[0] || DEFAULT_USER1_ID;
const userId2 = args[1] || DEFAULT_USER2_ID;
const teamId = args[2] || DEFAULT_TEAM_ID;

/**
 * データベースに接続して、有効なユーザーとチームが存在するか確認
 */
async function checkDatabaseEntities() {
  try {
    console.log('MongoDB接続を試みます...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune');
    console.log('MongoDB接続成功');

    // ユーザーを確認
    const users = await mongoose.connection.collection('users').find({
      _id: { $in: [new mongoose.Types.ObjectId(userId1), new mongoose.Types.ObjectId(userId2)] }
    }).toArray();

    if (users.length < 2) {
      console.error(`エラー: テスト用のユーザーが見つかりません。見つかったユーザー数: ${users.length}`);
      users.forEach(user => console.log(`- ユーザー: ${user._id}, ${user.displayName}`));
      console.log('有効なユーザーIDを指定してください');
      process.exit(1);
    }

    // チームを確認
    const team = await mongoose.connection.collection('teams').findOne({
      _id: new mongoose.Types.ObjectId(teamId)
    });

    if (!team) {
      console.error(`エラー: テスト用のチーム(ID: ${teamId})が見つかりません`);
      console.log('有効なチームIDを指定してください');
      process.exit(1);
    }

    // 五行属性が設定されているかチェック
    const usersMissingElements = users.filter(user => !user.elementAttribute);
    if (usersMissingElements.length > 0) {
      console.warn(`警告: 以下のユーザーには五行属性が設定されていません:`);
      usersMissingElements.forEach(user => console.log(`- ${user.displayName} (${user._id})`));
      console.log('相性診断に必要な五行属性が不足しています。テスト結果が不正確になる可能性があります。');
    }

    console.log(`テスト準備完了:`);
    console.log(`- ユーザー1: ${users[0].displayName} (${users[0]._id})`);
    console.log(`- ユーザー2: ${users.length > 1 ? users[1].displayName : 'Not Found'} (${users.length > 1 ? users[1]._id : 'N/A'})`);
    console.log(`- チーム: ${team.name} (${team._id})`);

    return { users, team };
  } catch (error) {
    console.error('データベース確認中にエラーが発生しました:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB切断');
  }
}

/**
 * APIを呼び出して標準相性診断をテスト
 */
async function testCompatibilityAPI() {
  try {
    // 認証トークンを取得
    const token = await generateToken();
    console.log('認証トークンを取得しました');

    // チーム全体の標準相性情報をテスト
    console.log('\n1. チーム全体の標準相性情報を取得中...');
    const teamCompatibilityResponse = await axios.get(
      `${API_BASE_URL}/teams/${teamId}/compatibility`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    console.log('チーム全体の標準相性情報:');
    console.log('- 成功:', teamCompatibilityResponse.data.success);
    console.log('- データ件数:', teamCompatibilityResponse.data.data?.length || 0);
    
    if (teamCompatibilityResponse.data.data && teamCompatibilityResponse.data.data.length > 0) {
      const firstItem = teamCompatibilityResponse.data.data[0];
      console.log('\n最初の相性データのサンプル:');
      console.log('- 相性ID:', firstItem.id);
      console.log('- ユーザー1:', firstItem.users[0].displayName);
      console.log('- ユーザー2:', firstItem.users[1].displayName);
      console.log('- 相性スコア:', firstItem.score);
      console.log('- 関係性タイプ:', firstItem.relationshipType);
    }

    // 特定の2人のメンバー間の標準相性情報をテスト
    console.log('\n2. 特定の2人のメンバー間の標準相性情報を取得中...');
    const memberCompatibilityResponse = await axios.get(
      `${API_BASE_URL}/teams/${teamId}/compatibility/${userId1}/${userId2}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    console.log('メンバー間の標準相性情報:');
    console.log('- 成功:', memberCompatibilityResponse.data.success);
    
    const compatibilityData = memberCompatibilityResponse.data.compatibility;
    if (compatibilityData) {
      console.log('\n相性情報:');
      console.log('- 相性ID:', compatibilityData.id);
      console.log('- ユーザー1:', compatibilityData.users[0].displayName);
      console.log('- ユーザー2:', compatibilityData.users[1].displayName);
      console.log('- 相性スコア:', compatibilityData.score);
      console.log('- 関係性タイプ:', compatibilityData.relationshipType);
      console.log('- 詳細説明:', compatibilityData.detailDescription);
      console.log('- チーム内洞察:', compatibilityData.teamInsight);
      console.log('- 協力アドバイス:', compatibilityData.collaborationTips);
    } else {
      console.error('エラー: 相性情報が取得できませんでした');
    }

    console.log('\nテスト完了!');
  } catch (error) {
    console.error('APIテスト中にエラーが発生しました:', error.response?.data || error.message);
    process.exit(1);
  }
}

/**
 * メイン関数
 */
async function main() {
  console.log('標準相性診断APIテストを開始します...');
  
  // データベースのエンティティを確認
  await checkDatabaseEntities();
  
  // APIをテスト
  await testCompatibilityAPI();
}

// スクリプト実行
main().catch(error => {
  console.error('テスト実行中にエラーが発生しました:', error);
  process.exit(1);
});