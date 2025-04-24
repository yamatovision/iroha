/**
 * 友達拡張相性診断APIのテストスクリプト（修正確認用）
 * 修正後の実装が正しく動作するかをチェックします
 */

require('dotenv').config();
const axios = require('axios');

// 設定
const API_BASE_URL = 'http://localhost:8080/api/v1';

/**
 * ログイン処理
 */
async function login(email, password) {
  console.log(`ログイン処理: ${email}`);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/jwt-auth/login`, {
      email,
      password
    });
    
    const token = response.data.tokens.accessToken;
    console.log('認証トークン取得成功:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('ログインエラー:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 友達一覧を取得
 */
async function getFriends(token) {
  console.log('友達一覧を取得中...');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/friends`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (response.data.success && response.data.data) {
      console.log(`友達数: ${response.data.data.length}`);
      return response.data.data;
    }
    
    console.warn('友達データが見つかりません');
    return [];
  } catch (error) {
    console.error('友達一覧取得エラー:', error.response?.data || error.message);
    return [];
  }
}

/**
 * 拡張相性診断API呼び出し
 */
async function getEnhancedCompatibility(token, friendId) {
  console.log(`拡張相性診断API呼び出し: 友達ID=${friendId}`);
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/friends/${friendId}/enhanced-compatibility`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    console.log('APIレスポンス構造:', 
      Object.keys(response.data).join(', '),
      response.data.compatibility ? '(compatibility あり)' : '(compatibility なし)',
      response.data.data ? '(data あり)' : '(data なし)'
    );
    
    return response.data;
  } catch (error) {
    console.error('拡張相性診断API呼び出しエラー:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * レスポンスデータのチェック
 */
function validateResponse(data) {
  console.log('\n===== レスポンス検証 =====');
  
  // 新しいレスポンス構造に対応
  const compatibility = data.compatibility;
  
  if (!compatibility) {
    console.error('互換性データが見つかりません');
    return false;
  }
  
  // enhancedDetailsの存在確認
  if (!compatibility.enhancedDetails) {
    console.error('enhancedDetailsが存在しません');
    return false;
  }
  
  // 各項目の検証
  console.log('1. 陰陽バランス確認:', 
    compatibility.enhancedDetails.yinYangBalance ? '✓' : '✗', 
    compatibility.enhancedDetails.yinYangBalance
  );
  
  console.log('2. 身強弱バランス確認:', 
    compatibility.enhancedDetails.strengthBalance ? '✓' : '✗', 
    compatibility.enhancedDetails.strengthBalance
  );
  
  // 日支関係のチェック - 空オブジェクト{'日支関係確認:{}'でなく、ちゃんとした値か
  const dayBranchRel = compatibility.enhancedDetails.dayBranchRelationship;
  const hasDayBranchDetails = dayBranchRel && 
                              typeof dayBranchRel === 'object' && 
                              Object.keys(dayBranchRel).length > 0 &&
                              'score' in dayBranchRel &&
                              'relationship' in dayBranchRel;
  
  console.log('3. 日支関係確認:', 
    hasDayBranchDetails ? '✓' : '✗', 
    JSON.stringify(dayBranchRel)
  );
  
  // 日干干合のチェック
  const dayGanComb = compatibility.enhancedDetails.dayGanCombination;
  const hasDayGanDetails = dayGanComb && 
                           typeof dayGanComb === 'object' && 
                           Object.keys(dayGanComb).length > 0 &&
                           'score' in dayGanComb &&
                           'isGangou' in dayGanComb;
  
  console.log('4. 日干干合確認:', 
    hasDayGanDetails ? '✓' : '✗', 
    JSON.stringify(dayGanComb)
  );
  
  // 用神情報のチェック
  console.log('5. 用神情報確認:', 
    compatibility.enhancedDetails.usefulGods ? '✓' : '✗',
    compatibility.enhancedDetails.usefulGods
  );
  
  // 総合判定
  const isValid = compatibility.enhancedDetails.yinYangBalance &&
                  compatibility.enhancedDetails.strengthBalance &&
                  hasDayBranchDetails &&
                  hasDayGanDetails &&
                  compatibility.enhancedDetails.usefulGods;
  
  console.log('\n総合判定:', isValid ? '✅ 修正成功' : '❌ 問題あり');
  return isValid;
}

/**
 * メイン関数
 */
async function main() {
  try {
    // 1. ログイン
    const token = await login('shiraishi.tatsuya@mikoto.co.jp', 'aikakumei');
    
    // 2. 友達一覧取得
    const friends = await getFriends(token);
    if (friends.length === 0) {
      console.error('友達がいません。テストできません。');
      return;
    }
    
    // 3. レノンという友達を探して拡張相性診断を実行
    // レノンとの友達関係を優先的にテスト
    const targetFriendName = 'レノン';
    // まずレノンを探す
    let targetFriend = friends.find(friend => friend.displayName === targetFriendName);
    
    // レノンが友達リストになければ、新しく友達申請と承認を行う必要がある
    if (!targetFriend) {
      console.log('レノンが友達リストにありません。最初の友達を使用します。');
      targetFriend = friends[0];
    }
    console.log(`\n${targetFriend.displayName === targetFriendName ? 'レノンを使用してテスト実行:' : '最初の友達を使用してテスト実行:'}`);
    console.log(`- 名前: ${targetFriend.displayName}`);
    console.log(`- ID: ${targetFriend.userId}`);
    
    // 4. 拡張相性診断API呼び出し
    const compatibilityData = await getEnhancedCompatibility(token, targetFriend.userId);
    
    // 5. レスポンス検証
    console.log('\n完全なレスポンス構造:');
    console.log(JSON.stringify(compatibilityData, null, 2));
    validateResponse(compatibilityData);
    
    console.log('\n詳細なレスポンス構造（一部）:');
    console.log(JSON.stringify(compatibilityData, null, 2).substring(0, 500) + '...');
    
  } catch (error) {
    console.error('テスト実行エラー:', error);
  }
}

// スクリプト実行
main();