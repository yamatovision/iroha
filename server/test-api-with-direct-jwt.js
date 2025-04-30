/**
 * 直接JWTを生成して友達拡張相性診断APIをテストするスクリプト
 */
require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

// JWT Accessキー（環境変数から取得）
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'SecureJwtAccessKey2025';

// 実際のユーザーID（MongoDBのドキュメントID）を使用
const TEST_USER_ID = '67f87e86a7d83fb995de0ee6'; // Tatsuya
const FRIEND_ID = '67f87e86a7d83fb995de0ee7';    // あみ

// JWTトークンを生成
function generateToken(userId) {
  const payload = {
    sub: userId,  // 重要: サーバーは'sub'フィールドからユーザーIDを取得する
    email: 'test@example.com',
    role: 'user'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// 友達拡張相性診断APIをテスト
async function testEnhancedCompatibilityAPI() {
  const token = generateToken(TEST_USER_ID);
  
  try {
    console.log('友達拡張相性診断APIをテスト中...');
    console.log('使用トークン:', token);
    console.log('エンドポイント:', `http://localhost:8080/api/v1/friends/${FRIEND_ID}/enhanced-compatibility`);
    
    const response = await axios({
      method: 'get',
      url: `http://localhost:8080/api/v1/friends/${FRIEND_ID}/enhanced-compatibility`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('ステータスコード:', response.status);
    console.log('レスポンスデータ:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // 拡張相性診断データの検証
    if (response.data.compatibility) {
      // 新しいレスポンス形式: compatibility
      const compatibilityData = response.data.compatibility;
      console.log('\n--- 拡張相性診断の詳細 (新形式) ---');
      console.log('- 関係性タイプ:', compatibilityData.relationshipType || 'N/A');
      
      if (compatibilityData.enhancedDetails) {
        const enhancedDetails = compatibilityData.enhancedDetails;
        console.log('- 陰陽バランス:', enhancedDetails.yinYangBalance || 'N/A');
        console.log('- 身強弱バランス:', enhancedDetails.strengthBalance || 'N/A');
        console.log('- 日支関係:', enhancedDetails.dayBranchRelationship?.relationship || 'N/A', 
                  `(${enhancedDetails.dayBranchRelationship?.score || 0}点)`);
        console.log('- 用神・喜神の評価:', enhancedDetails.usefulGods || 'N/A');
        console.log('- 日干干合:', enhancedDetails.dayGanCombination?.isGangou ? 'あり' : 'なし', 
                  `(${enhancedDetails.dayGanCombination?.score || 0}点)`);
        console.log('- 関係性タイプ:', enhancedDetails.relationshipType || 'N/A');
      } else {
        console.log('enhancedDetailsが見つかりません！');
        console.log('実際のレスポンス構造:', Object.keys(compatibilityData));
      }

      // 基本的な五行相性情報の表示
      console.log('\n--- 五行相性情報 ---');
      if (compatibilityData.users && compatibilityData.users.length >= 2) {
        console.log(`${compatibilityData.users[0].displayName}(${compatibilityData.users[0].elementAttribute}) と ${compatibilityData.users[1].displayName}(${compatibilityData.users[1].elementAttribute})`);
        console.log(`関係: ${compatibilityData.relationshipType}, スコア: ${compatibilityData.score}`);
      }
      console.log(`説明: ${compatibilityData.detailDescription.substring(0, 100)}...`);
    } else if (response.data.data) {
      // 古い形式: data
      const compatibilityData = response.data.data;
      console.log('\n--- 拡張相性診断の詳細 (古い形式) ---');
      console.log('- 関係性タイプ:', compatibilityData.relationshipType || 'N/A');
      
      if (compatibilityData.enhancedDetails) {
        const enhancedDetails = compatibilityData.enhancedDetails;
        console.log('- 陰陽バランス:', enhancedDetails.yinYangBalance || 'N/A');
        console.log('- 身強弱バランス:', enhancedDetails.strengthBalance || 'N/A');
        console.log('- 日支関係:', enhancedDetails.dayBranchRelationship?.relationship || 'N/A');
        console.log('- 用神・喜神の評価:', enhancedDetails.usefulGods || 'N/A');
        console.log('- 日干干合:', enhancedDetails.dayGanCombination?.isGangou ? 'あり' : 'なし');
        console.log('- 関係性タイプ:', enhancedDetails.relationshipType || 'N/A');
      } else {
        console.log('enhancedDetailsが見つかりません！');
        console.log('実際のレスポンス構造:', Object.keys(compatibilityData));
      }
    } else {
      console.error('互換性データが見つかりません');
    }
    
    console.log('\nテスト成功! 拡張相性診断APIが正常に動作しています。');
  } catch (error) {
    console.error('APIリクエストエラー:');
    if (error.response) {
      console.error('ステータス:', error.response.status);
      console.error('データ:', error.response.data);
    } else {
      console.error('エラー詳細:', error.message);
      console.error(error.stack);
    }
  }
}

// 実行
console.log('==== 友達拡張相性診断APIテスト ====');
testEnhancedCompatibilityAPI();