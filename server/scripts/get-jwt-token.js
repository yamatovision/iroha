/**
 * JWT認証トークン取得スクリプト
 * 
 * 使用方法: 
 *   node get-jwt-token.js メールアドレス パスワード
 * 
 * 例:
 *   node get-jwt-token.js shiraishi.tatsuya@mikoto.co.jp aikakumei
 */
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// API URLの設定
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';
const LOGIN_URL = `${API_BASE_URL}/jwt-auth/login`;

/**
 * JWTトークンを取得する関数
 * @param {string} email メールアドレス
 * @param {string} password パスワード
 * @returns {Promise<string>} JWTトークン
 */
async function getJwtToken(email, password) {
  // 引数がない場合はコマンドライン引数を使用
  if (!email) email = process.argv[2];
  if (!password) password = process.argv[3];

  if (!email || !password) {
    console.error('使用法: node get-jwt-token.js メールアドレス パスワード');
    process.exit(1);
  }

  try {
    console.log(`${email} でJWTログイン中...`);
    const response = await axios.post(LOGIN_URL, {
      email,
      password
    });

    if (response.data.tokens && response.data.tokens.accessToken) {
      const token = response.data.tokens.accessToken;
      const refreshToken = response.data.tokens.refreshToken;
      const user = response.data.user;

      // トークンをキャッシュに保存
      const cacheData = {
        token,
        refreshToken,
        expires: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1時間後
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role
        }
      };

      const tokenCachePath = path.join(__dirname, '.jwt_token_cache.json');
      fs.writeFileSync(tokenCachePath, JSON.stringify(cacheData, null, 2));
      console.log(`トークンをキャッシュに保存しました: ${tokenCachePath}`);

      // 関数として呼び出された場合はトークンを返す
      if (module.parent) {
        return token;
      }

      // スクリプトとして実行された場合は情報を表示
      console.log(`\nJWT認証トークン: ${token}\n`);
      console.log('ID:', user.id);
      console.log('メール:', user.email);
      console.log('表示名:', user.displayName);
      console.log('権限:', user.role);

      // 有効期限を表示
      console.log(`有効期限: ${cacheData.expires}`);

      process.exit(0);
    } else {
      throw new Error('トークンが見つかりません');
    }
  } catch (error) {
    console.error('JWTトークン取得エラー:', error.response?.data || error.message);
    process.exit(1);
  }
}

// コマンドライン実行時のみ実行
if (require.main === module) {
  getJwtToken();
}

/**
 * キャッシュからJWTトークンを取得する関数
 * @returns {Promise<string>} JWTトークン
 */
async function getJwtTokenFromCache() {
  const tokenCachePath = path.join(__dirname, '.jwt_token_cache.json');
  
  try {
    if (fs.existsSync(tokenCachePath)) {
      const cache = JSON.parse(fs.readFileSync(tokenCachePath, 'utf8'));
      if (cache.token && cache.expires && new Date(cache.expires) > new Date()) {
        return cache.token;
      }
    }
  } catch (error) {
    console.error('キャッシュからのトークン取得エラー:', error.message);
  }
  
  // キャッシュからトークンを取得できない場合はデフォルト認証情報でログイン
  return getJwtToken('shiraishi.tatsuya@mikoto.co.jp', 'aikakumei');
}

// モジュールとしてエクスポート
module.exports = { getJwtToken, getJwtTokenFromCache };