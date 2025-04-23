/**
 * 友達相性診断APIのスタンドアロンテストスクリプト
 * データベース接続なしで実行できます
 */

const axios = require('axios');

// デフォルト設定
const API_BASE_URL = 'http://localhost:8080/api/v1';
const DEFAULT_FRIEND_ID = '67f87e86a7d83fb995de0ee7'; // あみユーザーのID

// コマンドライン引数解析
const args = process.argv.slice(2);
const friendId = args[0] || DEFAULT_FRIEND_ID;
const authToken = args[1]; // トークンをコマンドライン引数で受け取る

/**
 * 基本相性診断APIを呼び出してテスト
 */
async function testBasicCompatibilityAPI(token) {
  if (!token) {
    console.error('認証トークンが提供されていません');
    return null;
  }

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
  if (!token) {
    console.error('認証トークンが提供されていません');
    return null;
  }

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
  
  if (!authToken) {
    console.error('使用法: node test-friendship-standalone.js [friendId] [authToken]');
    console.error('認証トークンが必要です。別のターミナルでサーバー内のget-jwt-token.jsスクリプトを実行して取得してください。');
    process.exit(1);
  }
  
  console.log(`\nテスト設定:`);
  console.log(`- APIベースURL: ${API_BASE_URL}`);
  console.log(`- 友達ID: ${friendId}`);
  
  // 基本相性診断APIをテスト
  const basicResult = await testBasicCompatibilityAPI(authToken);
  
  // 拡張相性診断APIをテスト
  const enhancedResult = await testEnhancedCompatibilityAPI(authToken);
  
  // 結果を比較
  compareCompatibilityResults(basicResult, enhancedResult);
  
  console.log('\nテスト完了!');
}

// スクリプト実行
main().catch(error => {
  console.error('テスト実行中にエラーが発生しました:', error);
  process.exit(1);
});