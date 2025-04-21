/**
 * 友達相性診断APIのテストスクリプト
 * 実際のユーザーデータを使用して友達相性診断APIを呼び出すテスト
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const { generateToken } = require('./utils/auth-helper');

// デフォルト設定
const API_BASE_URL = 'http://localhost:8080/api/v1';
const DEFAULT_USER_ID = '65f4fe4bfe04b371f21576f7'; // テスト用ユーザーID
const DEFAULT_FRIEND_ID = '65f4fbbd4da35d0b2e8891ed'; // テスト用友達ID

// コマンドライン引数解析
const args = process.argv.slice(2);
const userId = args[0] || DEFAULT_USER_ID;
const friendId = args[1] || DEFAULT_FRIEND_ID;

/**
 * データベースに接続して、有効なユーザーが存在するか確認
 */
async function checkDatabaseEntities() {
  try {
    console.log('MongoDB接続を試みます...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune');
    console.log('MongoDB接続成功');

    // ユーザーを確認
    const users = await mongoose.connection.collection('users').find({
      _id: { $in: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(friendId)] }
    }).toArray();

    if (users.length < 2) {
      console.error(`エラー: テスト用のユーザーが見つかりません。見つかったユーザー数: ${users.length}`);
      users.forEach(user => console.log(`- ユーザー: ${user._id}, ${user.displayName}`));
      console.log('有効なユーザーIDを指定してください');
      process.exit(1);
    }

    // 五行属性が設定されているかチェック
    const usersMissingElements = users.filter(user => !user.elementAttribute);
    if (usersMissingElements.length > 0) {
      console.warn(`警告: 以下のユーザーには五行属性が設定されていません:`);
      usersMissingElements.forEach(user => console.log(`- ${user.displayName} (${user._id})`));
      console.log('相性診断に必要な五行属性が不足しています。テスト結果が不正確になる可能性があります。');
    }

    // 友達関係があるかチェック（これは重要ではない - APIが既に確認するため）
    const friendship = await mongoose.connection.collection('friendships').findOne({
      $or: [
        { userId1: new mongoose.Types.ObjectId(userId), userId2: new mongoose.Types.ObjectId(friendId) },
        { userId1: new mongoose.Types.ObjectId(friendId), userId2: new mongoose.Types.ObjectId(userId) }
      ]
    });

    console.log(`テスト準備完了:`);
    console.log(`- ユーザー: ${users[0].displayName} (${users[0]._id})`);
    console.log(`- 友達: ${users.length > 1 ? users[1].displayName : 'Not Found'} (${users.length > 1 ? users[1]._id : 'N/A'})`);
    console.log(`- 友達関係: ${friendship ? '存在します' : '存在しません'}`);

    return { users, friendship };
  } catch (error) {
    console.error('データベース確認中にエラーが発生しました:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB切断');
  }
}

/**
 * APIを呼び出して友達相性診断をテスト
 */
async function testFriendCompatibilityAPI() {
  try {
    // 認証トークンを取得
    const token = await generateToken();
    console.log('認証トークンを取得しました');

    // 友達相性診断APIを呼び出し
    console.log(`\n友達相性診断API (GET /api/v1/friends/${friendId}/compatibility) を呼び出し中...`);
    const response = await axios.get(
      `${API_BASE_URL}/friends/${friendId}/compatibility`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    console.log('友達相性診断APIのレスポンス:');
    console.log('- 成功:', response.data.success);
    
    if (response.data.success && response.data.data) {
      console.log('\n相性情報:');
      const data = response.data.data;
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('エラー: 相性情報が取得できませんでした');
      console.log(response.data);
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
  console.log('友達相性診断APIテストを開始します...');
  
  // データベースのエンティティを確認
  await checkDatabaseEntities();
  
  // APIをテスト
  await testFriendCompatibilityAPI();
}

// スクリプト実行
main().catch(error => {
  console.error('テスト実行中にエラーが発生しました:', error);
  process.exit(1);
});