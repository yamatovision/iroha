/**
 * MongoDB ObjectID標準化のテストスクリプト
 * 
 * このスクリプトは、MongoDB ObjectIDへの標準化が正しく行われたかを検証します。
 * モデル定義、実際のデータ、参照整合性などをチェックします。
 * 
 * 実行コマンド:
 * ts-node server/scripts/test-objectid-migration.ts
 */
import * as dotenv from 'dotenv';
import mongoose, { Schema } from 'mongoose';
import { connectToDatabase } from '../src/config/database';
import { User, TeamMemberCard, ChatHistory, Team } from '../src/models';

// 環境変数を読み込み
dotenv.config();

/**
 * モデル定義の検証
 */
async function validateModels() {
  console.log('\n===== モデル定義の検証 =====');
  
  // TeamMemberCardモデルの検証
  const teamMemberCardSchema = TeamMemberCard.schema.obj;
  console.log('TeamMemberCard.userId の型:', teamMemberCardSchema.userId.type);
  if (teamMemberCardSchema.userId.type === Schema.Types.Mixed) {
    console.log('✅ TeamMemberCardモデルのuserIdは正しくMixed型として定義されています（移行期間対応）');
  } else if (teamMemberCardSchema.userId.type.schemaName === 'ObjectId') {
    console.log('✅ TeamMemberCardモデルのuserIdはObjectID型として定義されています（移行後）');
  } else {
    console.log('❌ TeamMemberCardモデルのuserIdが正しく定義されていません');
  }
  
  // ChatHistoryモデルの検証
  const chatHistorySchema = ChatHistory.schema.obj;
  console.log('ChatHistory.userId の型:', chatHistorySchema.userId.type);
  if (chatHistorySchema.userId.type === Schema.Types.Mixed) {
    console.log('✅ ChatHistoryモデルのuserIdは正しくMixed型として定義されています（移行期間対応）');
  } else if (chatHistorySchema.userId.type.schemaName === 'ObjectId') {
    console.log('✅ ChatHistoryモデルのuserIdはObjectID型として定義されています（移行後）');
  } else {
    console.log('❌ ChatHistoryモデルのuserIdが正しく定義されていません');
  }
  
  // Userモデルの検証
  const userSchema = User.schema.obj;
  const hasFirebaseUid = userSchema.hasOwnProperty('firebaseUid');
  const hasUid = userSchema.hasOwnProperty('uid');
  
  if (!hasFirebaseUid && !hasUid) {
    console.log('✅ Userモデルから完全にFirebase関連フィールドが削除されています');
  } else {
    console.log('⚠️ Userモデルにはまだ移行用のFirebase関連フィールドが定義されています');
    console.log(`  - uid: ${hasUid ? '定義あり' : '定義なし'}`);
    console.log(`  - firebaseUid: ${hasFirebaseUid ? '定義あり' : '定義なし'}`);
  }
}

/**
 * 実際のデータ型の検証
 */
async function validateData() {
  console.log('\n===== 実際のデータ型の検証 =====');
  
  // TeamMemberCardデータの検証
  const teamMemberCardCount = await TeamMemberCard.countDocuments();
  const teamMemberCardsWithStringId = await TeamMemberCard.countDocuments({
    userId: { $type: 'string' }
  });
  
  console.log(`TeamMemberCard総数: ${teamMemberCardCount}`);
  console.log(`String型userIdを持つTeamMemberCard: ${teamMemberCardsWithStringId}`);
  
  if (teamMemberCardsWithStringId === 0) {
    console.log('✅ すべてのTeamMemberCardデータが正しくObjectIDを使用しています');
  } else {
    console.log(`❌ ${teamMemberCardsWithStringId}件のTeamMemberCardがまだStringタイプのuserIdを使用しています`);
  }
  
  // ChatHistoryデータの検証
  const chatHistoryCount = await ChatHistory.countDocuments();
  const chatHistoriesWithStringId = await ChatHistory.countDocuments({
    userId: { $type: 'string' }
  });
  
  console.log(`ChatHistory総数: ${chatHistoryCount}`);
  console.log(`String型userIdを持つChatHistory: ${chatHistoriesWithStringId}`);
  
  if (chatHistoriesWithStringId === 0) {
    console.log('✅ すべてのChatHistoryデータが正しくObjectIDを使用しています');
  } else {
    console.log(`❌ ${chatHistoriesWithStringId}件のChatHistoryがまだStringタイプのuserIdを使用しています`);
  }
  
  // Userデータの検証
  const userCount = await User.countDocuments();
  const usersWithFirebaseRefs = await User.countDocuments({
    $or: [
      { uid: { $exists: true } },
      { firebaseUid: { $exists: true } }
    ]
  });
  
  console.log(`User総数: ${userCount}`);
  console.log(`Firebase参照を持つUser: ${usersWithFirebaseRefs}`);
  
  if (usersWithFirebaseRefs === 0) {
    console.log('✅ すべてのUserデータからFirebase参照が削除されています');
  } else {
    console.log(`⚠️ ${usersWithFirebaseRefs}件のUserデータにまだFirebase参照が残っています`);
  }
}

/**
 * 参照整合性の検証
 */
async function validateReferences() {
  console.log('\n===== 参照整合性の検証 =====');
  
  // TeamMemberCardの参照整合性
  console.log('TeamMemberCardの参照整合性を検証中...');
  const sampleTeamMemberCards = await TeamMemberCard.find().limit(5);
  
  for (const card of sampleTeamMemberCards) {
    const user = await User.findById(card.userId);
    if (user) {
      console.log(`✅ TeamMemberCard ${card._id} のuserID ${card.userId} は有効なユーザーを参照しています`);
    } else {
      console.log(`❌ TeamMemberCard ${card._id} のuserID ${card.userId} は存在しないユーザーを参照しています`);
    }
  }
  
  // ChatHistoryの参照整合性
  console.log('\nChatHistoryの参照整合性を検証中...');
  const sampleChatHistories = await ChatHistory.find().limit(5);
  
  for (const history of sampleChatHistories) {
    const user = await User.findById(history.userId);
    if (user) {
      console.log(`✅ ChatHistory ${history._id} のuserID ${history.userId} は有効なユーザーを参照しています`);
    } else {
      console.log(`❌ ChatHistory ${history._id} のuserID ${history.userId} は存在しないユーザーを参照しています`);
    }
  }
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    // データベースに接続
    await connectToDatabase();
    console.log('MongoDBに接続しました');
    
    // モデル定義の検証
    await validateModels();
    
    // 実際のデータ型の検証
    await validateData();
    
    // 参照整合性の検証
    await validateReferences();
    
    console.log('\n===== テスト完了 =====');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    // データベース接続を閉じる
    await mongoose.disconnect();
    console.log('データベース接続を閉じました');
  }
}

// スクリプトを実行
main().catch(err => {
  console.error('スクリプト実行中にエラーが発生しました:', err);
  process.exit(1);
});