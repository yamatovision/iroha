/**
 * 四柱推命プロフィールAPI（格局・用神機能）テストスクリプト
 * このスクリプトは、四柱推命プロフィールAPIが格局・用神情報を適切に返しているかテストします
 */
const axios = require('axios');
const dotenv = require('dotenv');

// 環境変数を読み込み
dotenv.config();

// APIのベースURL
const API_BASE_URL = process.env.API_URL || 'http://localhost:8080';

// テスト用の認証情報
const AUTH_EMAIL = 'shiraishi.tatsuya@mikoto.co.jp';
const AUTH_PASSWORD = 'aikakumei';

async function main() {
  try {
    console.log('四柱推命プロフィールAPI（格局・用神機能）テスト開始');
    
    // Step 1: ログインして認証トークンを取得
    console.log('\nStep 1: ログイン処理');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/jwt-auth/login`, {
      email: AUTH_EMAIL,
      password: AUTH_PASSWORD
    });
    
    const { accessToken } = loginResponse.data.tokens;
    console.log('ログイン成功: アクセストークン取得');
    
    // Step 2: 認証トークンを使用してユーザープロフィールを取得
    console.log('\nStep 2: ユーザープロフィール取得');
    const profileResponse = await axios.get(`${API_BASE_URL}/api/v1/users/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const profile = profileResponse.data;
    console.log('ユーザープロフィール取得成功:');
    console.log('ID:', profile.id);
    console.log('表示名:', profile.displayName);
    console.log('メール:', profile.email);
    
    // Step 3: kakukyokuとyojinデータの存在確認
    console.log('\nStep 3: 格局(kakukyoku)・用神(yojin)データの確認');
    
    if (profile.kakukyoku) {
      console.log('格局(kakukyoku)データが存在します ✅');
      console.log('タイプ:', profile.kakukyoku.type);
      console.log('カテゴリ:', profile.kakukyoku.category);
      console.log('身強・身弱:', profile.kakukyoku.strength);
      console.log('説明:', profile.kakukyoku.description?.substring(0, 100) + '...');
    } else {
      console.log('格局(kakukyoku)データが見つかりません ❌');
    }
    
    if (profile.yojin) {
      console.log('\n用神(yojin)データが存在します ✅');
      console.log('十神:', profile.yojin.tenGod);
      console.log('五行:', profile.yojin.element);
      console.log('サポート五行:', profile.yojin.supportElements?.join(', '));
      console.log('説明:', profile.yojin.description?.substring(0, 100) + '...');
    } else {
      console.log('用神(yojin)データが見つかりません ❌');
    }
    
    // Step 4: 四柱推命再計算APIの呼び出し
    console.log('\nStep 4: 四柱推命再計算API呼び出し');
    try {
      const recalcResponse = await axios.post(`${API_BASE_URL}/api/v1/users/calculate-saju`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log('四柱推命再計算成功 ✅');
      console.log('結果:', recalcResponse.data.message);
      
      // 再計算後のプロフィール取得
      console.log('\nStep 5: 再計算後のプロフィール取得');
      const updatedProfileResponse = await axios.get(`${API_BASE_URL}/api/v1/users/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const updatedProfile = updatedProfileResponse.data;
      
      if (updatedProfile.kakukyoku) {
        console.log('格局(kakukyoku)データが存在します ✅');
        console.log('タイプ:', updatedProfile.kakukyoku.type);
        console.log('カテゴリ:', updatedProfile.kakukyoku.category);
        console.log('身強・身弱:', updatedProfile.kakukyoku.strength);
        console.log('説明:', updatedProfile.kakukyoku.description?.substring(0, 100) + '...');
      } else {
        console.log('格局(kakukyoku)データが見つかりません ❌');
      }
      
      if (updatedProfile.yojin) {
        console.log('\n用神(yojin)データが存在します ✅');
        console.log('十神:', updatedProfile.yojin.tenGod);
        console.log('五行:', updatedProfile.yojin.element);
        console.log('サポート五行:', updatedProfile.yojin.supportElements?.join(', '));
        console.log('説明:', updatedProfile.yojin.description?.substring(0, 100) + '...');
      } else {
        console.log('用神(yojin)データが見つかりません ❌');
      }
      
    } catch (calcError) {
      console.error('四柱推命再計算エラー:', calcError.message);
      if (calcError.response) {
        console.error('エラー詳細:', calcError.response.data);
      }
    }
    
    console.log('\nテスト完了');
    
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    if (error.response) {
      console.error('レスポンスデータ:', error.response.data);
      console.error('ステータスコード:', error.response.status);
    }
  }
}

// スクリプトを実行
main();