/**
 * 認証ヘルパー関数
 * テスト実行時の実認証サポート用
 */
const path = require('path');
const { getToken } = require('../get-token');
const { getJwtTokenFromCache } = require('../get-jwt-token');
const fs = require('fs');

/**
 * テスト用認証トークンを生成
 * TestLAB原則に従い、実認証を使用
 * 
 * @param {string} email - テスト用メールアドレス
 * @param {string} password - テスト用パスワード
 * @returns {Promise<string>} 認証トークン
 */
async function generateToken(email = 'shiraishi.tatsuya@mikoto.co.jp', password = 'aikakumei') {
  try {
    // まずJWTトークンを試す
    try {
      return await getJwtTokenFromCache();
    } catch (jwtError) {
      console.log('JWTトークン取得に失敗、Firebaseトークンを試行します:', jwtError.message);
    }
    
    // 直接get-token.jsから取得を試みる
    return await getToken(email, password);
  } catch (error) {
    console.error('認証トークン取得エラー:', error.message);
    
    // フォールバック: キャッシュされたトークンがあれば使用（テスト継続のため）
    const tokenCachePath = path.join(__dirname, '../.token_cache.json');
    if (fs.existsSync(tokenCachePath)) {
      try {
        const cache = JSON.parse(fs.readFileSync(tokenCachePath, 'utf8'));
        if (cache.token && cache.expires && new Date(cache.expires) > new Date()) {
          console.log('キャッシュされたトークンを使用します (有効期限:', cache.expires, ')');
          return cache.token;
        }
      } catch (cacheError) {
        console.error('トークンキャッシュ読み込みエラー:', cacheError.message);
      }
    }
    
    // 最終フォールバック: ダミートークン（テストがスキップされるのを防ぐ）
    console.warn('警告: ダミートークンを使用します。認証が必要なテストはスキップされます。');
    return 'dummy-token-for-tests-authentication-will-fail';
  }
}

/**
 * テストで実認証を使用するヘルパー関数
 * 
 * @param {object} request - リクエストオブジェクト
 * @param {string} token - 認証トークン
 * @returns {object} 認証ヘッダー付きリクエスト
 */
function withRealAuth(request, token) {
  return {
    ...request,
    headers: {
      ...request.headers,
      'Authorization': `Bearer ${token}`
    }
  };
}

module.exports = {
  generateToken,
  withRealAuth
};