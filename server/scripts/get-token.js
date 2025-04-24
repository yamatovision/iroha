/**
 * JWT認証トークン取得スクリプト
 * 
 * DBに保存されているユーザー情報を使ってJWTトークンを生成するスクリプトです。
 * テスト実行時や管理者API呼び出し時の認証トークン取得に使用します。
 * 
 * 使用方法: 
 *   node get-token.js <MongoDB ユーザーID> [権限]
 * 
 * 例:
 *   node get-token.js 67f87e86a7d83fb995de0ee6
 *   node get-token.js 67f87e86a7d83fb995de0ee6 admin
 * 
 * 出力:
 *   JWT認証トークン: xxxxxx.yyyyy.zzzzz
 *   ユーザーID: MongoDB ドキュメントID
 *   権限: user / admin / super_admin
 *   有効期限: トークン有効期限
 * 
 * 環境変数:
 *   JWT_ACCESS_SECRET - JWT認証用シークレットキー
 *   MONGODB_URI - MongoDB接続URI
 * 
 * 引数がない場合はメッセージを表示して終了します。
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// JWT設定
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;
const TOKEN_EXPIRY = '1h';

/**
 * 指定されたユーザーIDでJWTトークンを生成する関数
 * @param {string} userId ユーザーID (MongoDB _id)
 * @param {string} role 権限 (user, admin, super_admin)
 * @returns {Promise<string>} JWT認証トークン
 */
async function generateToken(userId, role = 'user') {
  if (!userId) {
    console.error('使用法: node get-token.js <MongoDB ユーザーID> [権限]');
    process.exit(1);
  }

  try {
    // JWTペイロードを構築
    const payload = {
      sub: userId,
      role: role
    };
    
    // JWTトークンを生成
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    
    // 関数として呼び出された場合はトークンを返す
    if (module.parent) {
      return token;
    }
    
    // スクリプトとして実行された場合は情報を表示
    console.log(`\nJWT認証トークン: ${token}\n`);
    
    // トークンの詳細情報を表示
    console.log('ユーザーID:', userId);
    console.log('権限:', role);
    
    // 有効期限を計算（1時間）
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    console.log(`有効期限: ${expiry.toISOString()}`);
    
    // ユーザー情報を取得して表示
    if (process.env.MONGODB_URI) {
      try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await mongoose.connection.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
        
        if (user) {
          console.log('\nユーザー情報:');
          console.log('メール:', user.email);
          console.log('表示名:', user.displayName);
        } else {
          console.warn('\n警告: 指定したIDのユーザーが存在しません');
        }
        
        await mongoose.disconnect();
      } catch (dbError) {
        console.warn('\n警告: データベースからユーザー情報を取得できませんでした');
        console.warn(dbError.message);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// コマンドライン実行時のみ実行
if (require.main === module) {
  // コマンドライン引数を取得
  const userId = process.argv[2];
  const role = process.argv[3] || 'user';
  
  generateToken(userId, role);
}

// モジュールとしてgenerateToken関数をエクスポート
module.exports = { generateToken };