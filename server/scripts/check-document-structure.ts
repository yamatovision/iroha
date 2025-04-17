/**
 * ドキュメント構造確認スクリプト
 * 
 * このスクリプトは、TeamMemberCardとChatHistoryの実際のデータ構造を確認します。
 */
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/config/database';
import { User, TeamMemberCard, ChatHistory } from '../src/models';

// 環境変数を読み込み
dotenv.config();

/**
 * メイン実行関数
 */
async function main() {
  try {
    // データベースに接続
    await connectToDatabase();
    console.log('MongoDBに接続しました');
    
    // ユーザー情報を取得
    const users = await User.find().lean();
    console.log('===== ユーザー情報 =====');
    console.log(`総ユーザー数: ${users.length}`);
    
    for (const user of users) {
      console.log(`\nユーザー: ${user.email}`);
      console.log(`_id: ${user._id} (${typeof user._id})`);
      console.log(`_id instanceof ObjectId: ${user._id instanceof mongoose.Types.ObjectId}`);
      console.log(`uid: ${user.uid || 'なし'}`);
      console.log(`firebaseUid: ${user.firebaseUid || 'なし'}`);
    }
    
    // TeamMemberCardのサンプルを取得
    console.log('\n\n===== TeamMemberCard情報 =====');
    const teamMemberCards = await TeamMemberCard.find().limit(2).lean();
    
    console.log(`総TeamMemberCard数: ${await TeamMemberCard.countDocuments()}`);
    
    for (const card of teamMemberCards) {
      console.log(`\nTeamMemberCard: ${card._id}`);
      console.log(`_id: ${card._id} (${typeof card._id})`);
      console.log(`_id instanceof ObjectId: ${card._id instanceof mongoose.Types.ObjectId}`);
      console.log(`userId: ${card.userId} (${typeof card.userId})`);
      console.log(`userId instanceof ObjectId: ${card.userId instanceof mongoose.Types.ObjectId}`);
      
      // ユーザーの存在確認
      const user = await User.findById(card.userId).lean();
      console.log(`対応するユーザーが存在: ${user ? 'はい' : 'いいえ'}`);
      if (user) {
        console.log(`ユーザーメール: ${user.email}`);
      }
    }
    
    // ChatHistoryのサンプルを取得
    console.log('\n\n===== ChatHistory情報 =====');
    const chatHistories = await ChatHistory.find().limit(2).lean();
    
    console.log(`総ChatHistory数: ${await ChatHistory.countDocuments()}`);
    
    for (const history of chatHistories) {
      console.log(`\nChatHistory: ${history._id}`);
      console.log(`_id: ${history._id} (${typeof history._id})`);
      console.log(`_id instanceof ObjectId: ${history._id instanceof mongoose.Types.ObjectId}`);
      console.log(`userId: ${history.userId} (${typeof history.userId})`);
      console.log(`userId instanceof ObjectId: ${history.userId instanceof mongoose.Types.ObjectId}`);
      
      // ユーザーの存在確認
      const user = await User.findById(history.userId).lean();
      console.log(`対応するユーザーが存在: ${user ? 'はい' : 'いいえ'}`);
      if (user) {
        console.log(`ユーザーメール: ${user.email}`);
      }
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    // データベース接続を閉じる
    await mongoose.disconnect();
    console.log('データベース接続を閉じました');
  }
}

// スクリプトを実行
main();