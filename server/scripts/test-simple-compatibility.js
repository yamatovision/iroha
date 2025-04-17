require('dotenv').config();
const axios = require('axios');
const { generateToken } = require('./utils/auth-helper');

// テスト設定
const API_BASE_URL = 'http://localhost:8080/api/v1';
const USER1_ID = '67f87e86a7d83fb995de0ee6'; // Tatsuya
const USER2_ID = '67f87e86a7d83fb995de0ee7'; // あみ
const TEAM_ID = '67f71bb9b24269b1a55c6afb';  // 白石team

/**
 * 拡張相性APIのシンプルなテスト
 */
async function testEnhancedCompatibility() {
  try {
    // 認証トークンを取得
    const token = await generateToken();
    console.log('認証トークンを取得しました');

    // 2人のメンバー間の拡張相性情報をテスト
    console.log(`\n${USER1_ID}と${USER2_ID}の拡張相性情報を取得中...`);
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/teams/${TEAM_ID}/enhanced-compatibility/${USER1_ID}/${USER2_ID}`,
        { 
          headers: { 'Authorization': `Bearer ${token}` },
          validateStatus: null // すべてのステータスコードを許可
        }
      );
      
      console.log('APIレスポンス:');
      console.log('- ステータスコード:', response.status);
      console.log('- レスポンスデータ:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('API呼び出しエラー:', error.message);
      if (error.response) {
        console.error('エラーレスポンス:', {
          status: error.response.status,
          data: error.response.data
        });
      }
    }
  } catch (error) {
    console.error('テスト実行エラー:', error);
  }
}

// スクリプト実行
testEnhancedCompatibility();