/**
 * 友達相性診断APIのテストスクリプト
 * 基本相性診断と拡張相性診断の両方のエンドポイントをテストします
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
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyfortune');
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

    // 五行属性と四柱推命データが設定されているかチェック
    const usersMissingElements = users.filter(user => !user.elementAttribute);
    if (usersMissingElements.length > 0) {
      console.warn(`警告: 以下のユーザーには五行属性が設定されていません:`);
      usersMissingElements.forEach(user => console.log(`- ${user.displayName} (${user._id})`));
      console.log('相性診断に必要な五行属性が不足しています。テスト結果が不正確になる可能性があります。');
    }

    const usersMissingFourPillars = users.filter(user => !user.fourPillars || !user.fourPillars.day || !user.fourPillars.day.heavenlyStem);
    if (usersMissingFourPillars.length > 0) {
      console.warn(`警告: 以下のユーザーには四柱推命データが設定されていません:`);
      usersMissingFourPillars.forEach(user => console.log(`- ${user.displayName} (${user._id})`));
      console.log('拡張相性診断に必要な四柱推命データが不足しています。テスト結果が不正確になる可能性があります。');
    }

    // 友達関係があるかチェック
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
    if (friendship) {
      console.log(`  - 関係ID: ${friendship._id}`);
      console.log(`  - ステータス: ${friendship.status}`);
      console.log(`  - 既存の相性スコア: ${friendship.compatibilityScore || 'なし'}`);
    }

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
 * 基本相性診断APIを呼び出してテスト
 */
async function testBasicCompatibilityAPI(token) {
  try {
    console.log(`\n基本相性診断API (GET /api/v1/friends/${friendId}/compatibility) を呼び出し中...`);
    const response = await axios.get(
      `${API_BASE_URL}/friends/${friendId}/compatibility`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    console.log('基本相性診断APIのレスポンス:');
    console.log('- 成功:', response.data.success);
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log('\n基本相性情報:');
      console.log(`- 相性スコア: ${data.score}`);
      console.log(`- 関係タイプ: ${data.relationshipType || data.relationship || 'N/A'}`);
      console.log(`- ユーザー1: ${data.users[0].displayName} (${data.users[0].elementAttribute})`);
      console.log(`- ユーザー2: ${data.users[1].displayName} (${data.users[1].elementAttribute})`);
      console.log(`- 説明: ${data.description || 'N/A'}`);
      
      if (data.details) {
        console.log('\n詳細情報:');
        console.log(`- 詳細説明: ${data.details.detailDescription || 'N/A'}`);
        console.log(`- チーム考察: ${data.details.teamInsight || 'N/A'}`);
        console.log(`- 協力ヒント: ${data.details.collaborationTips || 'N/A'}`);
      }
      
      return data;
    } else {
      console.error('エラー: 相性情報が取得できませんでした');
      console.log(response.data);
      return null;
    }
  } catch (error) {
    console.error('基本相性診断API呼び出し中にエラーが発生しました:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 拡張相性診断APIを呼び出してテスト
 */
async function testEnhancedCompatibilityAPI(token) {
  try {
    console.log(`\n拡張相性診断API (GET /api/v1/friends/${friendId}/enhanced-compatibility) を呼び出し中...`);
    const response = await axios.get(
      `${API_BASE_URL}/friends/${friendId}/enhanced-compatibility`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    console.log('拡張相性診断APIのレスポンス:');
    console.log('- 成功:', response.data.success);
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log('\n拡張相性情報:');
      console.log(`- 相性スコア: ${data.score}`);
      console.log(`- 関係タイプ: ${data.relationshipType || 'N/A'}`);
      console.log(`- ユーザー1: ${data.users[0].displayName} (${data.users[0].elementAttribute})`);
      console.log(`- ユーザー2: ${data.users[1].displayName} (${data.users[1].elementAttribute})`);
      console.log(`- 説明: ${data.description || 'N/A'}`);
      
      if (data.details) {
        console.log('\n詳細情報:');
        console.log(`- 詳細説明: ${data.details.detailDescription || 'N/A'}`);
        console.log(`- チーム考察: ${data.details.teamInsight || 'N/A'}`);
        console.log(`- 協力ヒント: ${data.details.collaborationTips || 'N/A'}`);
      }
      
      // 拡張詳細情報を表示
      if (data.enhancedDetails) {
        console.log('\n拡張詳細情報:');
        console.log(`- 陰陽バランス: ${data.enhancedDetails.yinYangBalance}`);
        console.log(`- 身強弱バランス: ${data.enhancedDetails.strengthBalance}`);
        if (data.enhancedDetails.dayBranchRelationship) {
          console.log(`- 日支関係: ${data.enhancedDetails.dayBranchRelationship.relationship} (${data.enhancedDetails.dayBranchRelationship.score}点)`);
        }
        console.log(`- 用神・喜神の評価: ${data.enhancedDetails.usefulGods}`);
        if (data.enhancedDetails.dayGanCombination) {
          console.log(`- 日干干合: ${data.enhancedDetails.dayGanCombination.isGangou ? 'あり' : 'なし'} (${data.enhancedDetails.dayGanCombination.score}点)`);
        }
        console.log(`- 関係性タイプ: ${data.enhancedDetails.relationshipType || 'N/A'}`);
      } else {
        console.warn('警告: 拡張詳細情報が含まれていません');
      }
      
      return data;
    } else {
      console.error('エラー: 拡張相性情報が取得できませんでした');
      console.log(response.data);
      return null;
    }
  } catch (error) {
    console.error('拡張相性診断API呼び出し中にエラーが発生しました:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 相性結果を比較して違いを表示
 */
function compareCompatibilityResults(basicResult, enhancedResult) {
  if (!basicResult || !enhancedResult) {
    console.log('\n比較結果: 両方の結果が取得できなかったため、比較できません');
    return;
  }
  
  console.log('\n==== 基本相性診断と拡張相性診断の比較 ====');
  
  // スコアの比較
  const scoreDiff = enhancedResult.score - basicResult.score;
  console.log(`- 相性スコア差: ${scoreDiff} (基本: ${basicResult.score}, 拡張: ${enhancedResult.score})`);
  
  // 関係タイプの比較
  const basicRelationType = basicResult.relationshipType || basicResult.relationship || 'N/A';
  const enhancedRelationType = enhancedResult.relationshipType || 'N/A';
  console.log(`- 関係タイプ: ${basicRelationType !== enhancedRelationType ? '異なる' : '同じ'}`);
  console.log(`  - 基本: ${basicRelationType}`);
  console.log(`  - 拡張: ${enhancedRelationType}`);
  
  // 説明の比較（最初の50文字だけ）
  const basicDesc = (basicResult.description || '').substring(0, 50) + '...';
  const enhancedDesc = (enhancedResult.description || '').substring(0, 50) + '...';
  console.log(`- 説明: ${basicDesc !== enhancedDesc ? '異なる' : '同じ'}`);
  
  // 拡張アルゴリズムで追加された情報
  console.log('\n拡張アルゴリズムで追加された情報:');
  if (enhancedResult.enhancedDetails) {
    console.log('- 陰陽バランスの考慮');
    console.log('- 身強弱バランスの評価');
    console.log('- 日支関係の分析');
    console.log('- 用神・喜神の評価');
    console.log('- 日干干合の検出');
    console.log('- より詳細な関係性タイプの分類');
  } else {
    console.log('- 拡張詳細情報がレスポンスに含まれていないため、不明');
  }
}

/**
 * メイン関数
 */
async function main() {
  console.log('友達相性診断APIテストを開始します...');
  
  // データベースのエンティティを確認
  await checkDatabaseEntities();
  
  // 認証トークンを取得
  const token = await generateToken();
  console.log('認証トークンを取得しました');
  
  // 基本相性診断APIをテスト
  const basicResult = await testBasicCompatibilityAPI(token);
  
  // 拡張相性診断APIをテスト
  const enhancedResult = await testEnhancedCompatibilityAPI(token);
  
  // 結果を比較
  compareCompatibilityResults(basicResult, enhancedResult);
  
  console.log('\nテスト完了!');
}

// スクリプト実行
main().catch(error => {
  console.error('テスト実行中にエラーが発生しました:', error);
  process.exit(1);
});