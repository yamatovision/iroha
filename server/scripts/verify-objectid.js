/**
 * MongoDB ObjectID検証スクリプト
 */
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB接続
const connectToDatabase = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  const DB_NAME = process.env.DB_NAME || 'dailyfortune';

  if (!MONGODB_URI) {
    console.error('MONGODB_URI環境変数が設定されていません');
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });
    console.log('MongoDBに接続しました');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// モデルのインポート
const { User } = require('../dist/models/User');
const { ChatHistory } = require('../dist/models/ChatHistory');
const { TeamMemberCard } = require('../dist/models/TeamMemberCard');

// テキストのカラーコード
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// ObjectIDの妥当性チェック関数
function isValidObjectId(id) {
  if (!id) return false;
  
  if (id instanceof mongoose.Types.ObjectId) {
    return true;
  }
  
  // 文字列で表現されたObjectID (24文字の16進数)
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) && id.match(/^[0-9a-fA-F]{24}$/)) {
    return true;
  }
  
  return false;
}

async function validateMigration() {
  console.log(`${colors.blue}===== MongoDB ObjectID検証 =====${colors.reset}`);
  
  await connectToDatabase();
  console.log('MongoDBに接続しました');
  
  try {
    // ユーザーデータ検証
    const users = await User.find().limit(3).lean();
    console.log(`\n${colors.blue}===== ユーザーID検証 =====${colors.reset}`);
    users.forEach(user => {
      console.log(`ユーザー ${user.email} のID: ${user._id}`);
      const valid = isValidObjectId(user._id);
      console.log(`ObjectID検証: ${valid ? colors.green + '有効' + colors.reset : colors.red + '無効' + colors.reset}`);
    });
    
    // チャット履歴検証
    const chats = await ChatHistory.find().limit(3).lean();
    console.log(`\n${colors.blue}===== チャット履歴ユーザーID検証 =====${colors.reset}`);
    for (const chat of chats) {
      console.log(`チャットID ${chat._id} のユーザーID: ${chat.userId}`);
      const valid = isValidObjectId(chat.userId);
      console.log(`ObjectID検証: ${valid ? colors.green + '有効' + colors.reset : colors.red + '無効' + colors.reset}`);
      const user = await User.findById(chat.userId);
      console.log(`対応するユーザー: ${user ? user.email : colors.red + '見つかりません' + colors.reset}`);
      console.log('--------------------------');
    }
    
    // チームメンバーカード検証
    const cards = await TeamMemberCard.find().limit(3).lean();
    console.log(`\n${colors.blue}===== チームメンバーカードユーザーID検証 =====${colors.reset}`);
    for (const card of cards) {
      console.log(`カードID ${card._id} のユーザーID: ${card.userId}`);
      const valid = isValidObjectId(card.userId);
      console.log(`ObjectID検証: ${valid ? colors.green + '有効' + colors.reset : colors.red + '無効' + colors.reset}`);
      const user = await User.findById(card.userId);
      console.log(`対応するユーザー: ${user ? user.email : colors.red + '見つかりません' + colors.reset}`);
      console.log('--------------------------');
    }
    
    // ID型の集計
    console.log(`\n${colors.blue}===== ID型の集計 =====${colors.reset}`);
    
    // ユーザーID型集計
    const totalUsers = await User.countDocuments();
    console.log(`総ユーザー数: ${totalUsers}`);
    
    // チャット履歴のID型集計
    const totalChats = await ChatHistory.countDocuments();
    const stringIdChats = await ChatHistory.countDocuments({
      userId: { $not: { $type: 'objectId' } }
    });
    console.log(`総チャット履歴数: ${totalChats}`);
    console.log(`文字列型ユーザーIDを持つチャット履歴: ${stringIdChats || 0} (${((stringIdChats / totalChats) * 100).toFixed(2)}%)`);
    
    // チームメンバーカードのID型集計
    const totalCards = await TeamMemberCard.countDocuments();
    const stringIdCards = await TeamMemberCard.countDocuments({
      userId: { $not: { $type: 'objectId' } }
    });
    console.log(`総メンバーカード数: ${totalCards}`);
    console.log(`文字列型ユーザーIDを持つメンバーカード: ${stringIdCards || 0} (${((stringIdCards / totalCards) * 100).toFixed(2)}%)`);
    
    // 最終判定
    if (stringIdChats === 0 && stringIdCards === 0) {
      console.log(`\n${colors.green}✅ 成功: すべてのデータがObjectID形式に正しく移行されています${colors.reset}`);
    } else {
      console.log(`\n${colors.red}❌ 失敗: 一部のデータが正しく移行されていません${colors.reset}`);
    }
    
  } finally {
    await mongoose.disconnect();
    console.log('データベース接続を閉じました');
  }
}

validateMigration().catch(error => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});