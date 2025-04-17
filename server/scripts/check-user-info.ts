import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/config/database';
import { User } from '../src/models';

// 環境変数を読み込み
dotenv.config();

// 特定のユーザーの詳細情報を確認する関数
async function checkUserDetails(email: string) {
  try {
    // MongoDBに接続
    await connectToDatabase();
    console.log('\n===== MongoDBに接続しました =====');
    
    // ユーザーを検索
    console.log(`\n===== ユーザー詳細情報: ${email} =====`);
    const user = await User.findOne({ email }).exec();
    
    if (!user) {
      console.log(`ユーザーが見つかりません: ${email}`);
      return null;
    }
    
    // ユーザー情報をすべて表示
    console.log('\n----- 基本情報 -----');
    console.log(`ID: ${user._id}`);
    console.log(`メールアドレス: ${user.email}`);
    console.log(`表示名: ${user.displayName}`);
    console.log(`役割: ${user.role}`);
    console.log(`アクティブ: ${user.isActive}`);
    console.log(`プラン: ${user.plan}`);
    console.log(`役職: ${user.jobTitle || '未設定'}`);
    console.log(`五行属性: ${user.elementAttribute || '未設定'}`);
    
    console.log('\n----- 関連情報 -----');
    console.log(`SajuProfileID: ${user.sajuProfileId || '未設定'}`);
    console.log(`チームID: ${user.teamId || '未設定'}`);
    console.log(`組織ID: ${user.organizationId || '未設定'}`);
    
    // 四柱推命プロフィール関連の処理は削除
    console.log('\n四柱推命プロフィールの検索はスキップします');
    
    // ドキュメントの完全な内容も表示（開発者向け）
    console.log('\n----- ドキュメント全体 -----');
    console.log(JSON.stringify(user.toObject(), null, 2));
    
    return { user };
  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  } finally {
    // Mongooseの接続を閉じる
    try {
      await mongoose.disconnect();
      console.log('\n===== データベース接続を閉じました =====');
    } catch (err) {
      console.error('データベース切断エラー:', err);
    }
  }
}

// コマンドライン引数からメールアドレスを取得
const email = process.argv[2] || 'shiraishi.tatsuya@mikoto.co.jp';

// ユーザー情報を確認
checkUserDetails(email)
  .then(result => {
    if (result) {
      console.log(`\n===== ${email} の情報表示が完了しました =====`);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  });