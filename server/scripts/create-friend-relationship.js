/**
 * 特定の2人のユーザー間に友達関係を作成するスクリプト
 * 使用方法: node create-friend-relationship.js
 */
require('dotenv').config();
const axios = require('axios');

// 設定
const API_BASE_URL = 'http://localhost:8080/api/v1';
const EMAIL = 'shiraishi.tatsuya@mikoto.co.jp';
const PASSWORD = 'aikakumei';
const TARGET_USER_ID = '6803699aac7c6a58f9a207b0'; // レノンさんのID

// メイン関数
async function main() {
  try {
    // 1. ログイン
    console.log(`ログイン処理: ${EMAIL}`);
    const loginResponse = await axios.post(`${API_BASE_URL}/jwt-auth/login`, {
      email: EMAIL,
      password: PASSWORD
    });
    
    const token = loginResponse.data.tokens.accessToken;
    console.log('認証トークン取得成功:', token.substring(0, 20) + '...');
    
    // 2. 友達リクエスト送信
    console.log(`友達リクエスト送信: ターゲットID=${TARGET_USER_ID}`);
    const requestResponse = await axios.post(
      `${API_BASE_URL}/friends/request`,
      { targetUserId: TARGET_USER_ID },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    console.log('友達リクエスト送信結果:', requestResponse.data);
    
    // 3. 友達リクエスト承認（擬似的に自動承認）
    if (requestResponse.data.success) {
      console.log('友達リクエストを自動承認します');
      
      // friendship IDを取得
      const friendshipId = requestResponse.data.data._id;
      
      const acceptResponse = await axios.post(
        `${API_BASE_URL}/friends/requests/${friendshipId}/accept`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('友達リクエスト承認結果:', acceptResponse.data);
    }
    
    // 4. 拡張相性診断を実行
    console.log(`拡張相性診断実行: ターゲットID=${TARGET_USER_ID}`);
    const compatibilityResponse = await axios.get(
      `${API_BASE_URL}/friends/${TARGET_USER_ID}/enhanced-compatibility`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    console.log('拡張相性診断結果:', JSON.stringify(compatibilityResponse.data, null, 2));
    
    // 5. 友達関係の確認
    console.log('友達関係を確認します');
    const friendsResponse = await axios.get(
      `${API_BASE_URL}/friends`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const friends = friendsResponse.data.data;
    const targetFriend = friends.find(friend => friend.userId === TARGET_USER_ID);
    
    if (targetFriend) {
      console.log('友達関係が正常に作成されました:');
      console.log(`- 名前: ${targetFriend.displayName}`);
      console.log(`- ID: ${targetFriend.userId}`);
      console.log(`- フレンドシップID: ${targetFriend.friendship}`);
    } else {
      console.log('友達関係の作成に失敗しました');
    }
    
  } catch (error) {
    console.error('エラー発生:', error.response?.data || error.message);
  }
}

// スクリプト実行
main();