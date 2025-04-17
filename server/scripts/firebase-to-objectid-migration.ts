/**
 * Firebase UIDからMongoDB ObjectIDへの完全移行スクリプト
 * 
 * このスクリプトはFirebase認証からJWT認証への移行に伴い、
 * すべてのコレクションでFirebase UIDをMongoDBのObjectIDに置き換えます。
 * 
 * 実行コマンド:
 * ts-node server/scripts/firebase-to-objectid-migration.ts [--check | --migrate | --verify | --cleanup]
 * 
 * オプション:
 * --check: 現在の状態を確認するだけで、データの変更は行わない（デフォルト）
 * --migrate: 実際にデータ移行を実行する
 * --verify: 移行が完了したかを検証する
 * --cleanup: 移行完了後、uidとfirebaseUidフィールドを削除する（注意: 慎重に実行すること）
 */
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/config/database';
import { User, TeamMemberCard, ChatHistory, Team } from '../src/models';
import fs from 'fs';
import path from 'path';

// 環境変数を読み込み
dotenv.config();

// ログファイルのパス
const LOG_DIR = path.join(__dirname, 'migration-logs');
const LOG_FILE = path.join(LOG_DIR, `firebase-objectid-migration-${new Date().toISOString().replace(/:/g, '-')}.json`);

// 移行ステータスを記録するオブジェクト
interface MigrationStatus {
  startTime: Date;
  endTime?: Date;
  userCount: number;
  usersWithFirebaseId: number;
  teamMemberCardCount: number;
  chatHistoryCount: number;
  migratedTeamMemberCards: number;
  migratedChatHistories: number;
  failedMigrations: {
    teamMemberCards: Array<{ id: string; error: string }>;
    chatHistories: Array<{ id: string; error: string }>;
  };
  idMappings: Record<string, string>; // Firebase UID -> ObjectID
}

// 移行ステータス
const migrationStatus: MigrationStatus = {
  startTime: new Date(),
  userCount: 0,
  usersWithFirebaseId: 0,
  teamMemberCardCount: 0,
  chatHistoryCount: 0,
  migratedTeamMemberCards: 0,
  migratedChatHistories: 0,
  failedMigrations: {
    teamMemberCards: [],
    chatHistories: []
  },
  idMappings: {}
};

/**
 * Firebase UIDからMongoDB ObjectIDへのマッピングを作成する関数
 */
async function createIdMappings(): Promise<Record<string, string>> {
  console.log('\n===== Firebase UID -> ObjectID マッピング作成 =====');
  
  // すべてのユーザーを検索（デバッグのため、すべてのユーザーを確認）
  const users = await User.find().lean();
  
  migrationStatus.userCount = users.length;
  
  // uidまたはfirebaseUidを持つユーザーをフィルタリング
  const usersWithFirebaseIds = users.filter(user => 
    (user.uid !== undefined && user.uid !== null) || 
    (user.firebaseUid !== undefined && user.firebaseUid !== null)
  );
  
  migrationStatus.usersWithFirebaseId = usersWithFirebaseIds.length;
  
  console.log(`総ユーザー数: ${migrationStatus.userCount}`);
  console.log(`Firebase IDを持つユーザー: ${usersWithFirebaseIds.length}`);
  
  // ユーザーIDのデバッグ情報を表示
  console.log("\nユーザーIDデバッグ情報:");
  users.forEach((user, index) => {
    console.log(`ユーザー ${index + 1}:`);
    console.log(`  _id: ${user._id}`);
    console.log(`  uid: ${user.uid || 'なし'}`);
    console.log(`  firebaseUid: ${user.firebaseUid || 'なし'}`);
    console.log(`  email: ${user.email || 'なし'}`);
  });
  
  // 追加のデバッグ情報：TeamMemberCardのユーザーID
  const teamMemberCards = await TeamMemberCard.find().limit(2).lean();
  console.log("\nTeamMemberCardサンプルのユーザーID:");
  teamMemberCards.forEach((card, index) => {
    console.log(`カード ${index + 1}: userId = ${card.userId}`);
  });
  
  const idMappings: Record<string, string> = {};
  
  // FirebaseベースのIDが見つからない場合は、すべてのユーザーを1:1でマッピング
  if (usersWithFirebaseIds.length === 0) {
    console.log("\n警告: Firebase IDを持つユーザーが見つかりませんでした");
    console.log("すべてのユーザーに対して直接のID変換マッピングを作成します");
    
    // すべてのユーザーに対してそのままマッピング
    for (const user of users) {
      const objectId = user._id.toString();
      idMappings[objectId] = objectId;
      console.log(`マッピング作成: ${objectId} -> ${objectId} (${user.email || 'メールなし'})`);
    }
    
    // TeamMemberCardとChatHistoryのユーザーIDを直接収集してマッピングに追加
    const allTeamMemberCards = await TeamMemberCard.find({
      userId: { $type: 'string' }
    }).lean();
    
    for (const card of allTeamMemberCards) {
      const cardUserId = String(card.userId);
      if (!idMappings[cardUserId]) {
        // ユーザーIDが直接マッチするユーザーを探す
        const matchingUser = users.find(u => u._id.toString() === cardUserId);
        if (matchingUser) {
          idMappings[cardUserId] = matchingUser._id.toString();
          console.log(`TeamMemberCard ID変換マッピング: ${cardUserId} -> ${matchingUser._id.toString()}`);
        } else {
          console.log(`警告: TeamMemberCardのユーザーID ${cardUserId} に一致するユーザーが見つかりません`);
        }
      }
    }
  } else {
    // 通常のFirebase UIDマッピングを作成
    for (const user of usersWithFirebaseIds) {
      const objectId = user._id.toString();
      
      // uidフィールドからのマッピング
      if (user.uid) {
        idMappings[user.uid] = objectId;
        console.log(`マッピング作成 (uid): ${user.uid} -> ${objectId}`);
      }
      
      // firebaseUidフィールドからのマッピング
      if (user.firebaseUid) {
        idMappings[user.firebaseUid] = objectId;
        console.log(`マッピング作成 (firebaseUid): ${user.firebaseUid} -> ${objectId}`);
      }
    }
  }
  
  console.log(`作成されたマッピング数: ${Object.keys(idMappings).length}`);
  
  // サンプルとして最初の5つのマッピングを表示
  const sampleEntries = Object.entries(idMappings).slice(0, 5);
  if (sampleEntries.length > 0) {
    console.log('\nマッピングサンプル:');
    sampleEntries.forEach(([sourceId, targetId]) => {
      console.log(`${sourceId} -> ${targetId}`);
    });
  }
  
  return idMappings;
}

/**
 * TeamMemberCardコレクションのFirebase UIDをObjectIDに移行する関数
 */
async function migrateTeamMemberCards(idMappings: Record<string, string>) {
  console.log('\n===== TeamMemberCard コレクション移行 =====');
  
  // String型のuserIdを持つTeamMemberCardを検索
  const teamMemberCards = await TeamMemberCard.find({
    userId: { $type: 'string' }
  });
  
  migrationStatus.teamMemberCardCount = await TeamMemberCard.countDocuments();
  
  console.log(`総TeamMemberCard数: ${migrationStatus.teamMemberCardCount}`);
  console.log(`移行が必要なTeamMemberCard: ${teamMemberCards.length}`);
  
  if (teamMemberCards.length === 0) {
    console.log('移行が必要なTeamMemberCardはありません');
    return;
  }
  
  // 実際の移行処理（--migrateフラグがある場合のみ）
  if (process.argv.includes('--migrate')) {
    console.log('TeamMemberCardの移行を開始します...');
    
    for (const card of teamMemberCards) {
      try {
        const firebaseUid = String(card.userId);
        const mongoObjectId = idMappings[firebaseUid];
        
        if (!mongoObjectId) {
          throw new Error(`UID ${firebaseUid} に対応するObjectIDが見つかりません`);
        }
        
        // userIdをObjectIDに変換
        card.userId = new mongoose.Types.ObjectId(mongoObjectId);
        await card.save();
        
        migrationStatus.migratedTeamMemberCards++;
        
      } catch (error: any) {
        console.error(`TeamMemberCard ${(card._id as mongoose.Types.ObjectId).toString()} の移行に失敗: ${error.message}`);
        migrationStatus.failedMigrations.teamMemberCards.push({
          id: (card._id as mongoose.Types.ObjectId).toString(),
          error: error.message
        });
      }
    }
    
    console.log(`${migrationStatus.migratedTeamMemberCards}/${teamMemberCards.length} のTeamMemberCardを移行しました`);
  } else {
    console.log('--migrateフラグが指定されていないため、実際の移行は行いません');
  }
}

/**
 * ChatHistoryコレクションのFirebase UIDをObjectIDに移行する関数
 */
async function migrateChatHistories(idMappings: Record<string, string>) {
  console.log('\n===== ChatHistory コレクション移行 =====');
  
  // String型のuserIdを持つChatHistoryを検索
  const chatHistories = await ChatHistory.find({
    userId: { $type: 'string' }
  });
  
  migrationStatus.chatHistoryCount = await ChatHistory.countDocuments();
  
  console.log(`総ChatHistory数: ${migrationStatus.chatHistoryCount}`);
  console.log(`移行が必要なChatHistory: ${chatHistories.length}`);
  
  if (chatHistories.length === 0) {
    console.log('移行が必要なChatHistoryはありません');
    return;
  }
  
  // 実際の移行処理（--migrateフラグがある場合のみ）
  if (process.argv.includes('--migrate')) {
    console.log('ChatHistoryの移行を開始します...');
    
    for (const history of chatHistories) {
      try {
        const firebaseUid = String(history.userId);
        const mongoObjectId = idMappings[firebaseUid];
        
        if (!mongoObjectId) {
          throw new Error(`UID ${firebaseUid} に対応するObjectIDが見つかりません`);
        }
        
        // userIdをObjectIDに変換
        history.userId = new mongoose.Types.ObjectId(mongoObjectId);
        await history.save();
        
        migrationStatus.migratedChatHistories++;
        
      } catch (error: any) {
        console.error(`ChatHistory ${(history._id as mongoose.Types.ObjectId).toString()} の移行に失敗: ${error.message}`);
        migrationStatus.failedMigrations.chatHistories.push({
          id: (history._id as mongoose.Types.ObjectId).toString(),
          error: error.message
        });
      }
    }
    
    console.log(`${migrationStatus.migratedChatHistories}/${chatHistories.length} のChatHistoryを移行しました`);
  } else {
    console.log('--migrateフラグが指定されていないため、実際の移行は行いません');
  }
}

/**
 * 移行が完了したかを検証する関数
 */
async function verifyMigration() {
  console.log('\n===== 移行検証 =====');
  
  // String型のuserIdを持つTeamMemberCardを検索
  const teamMemberCardsWithStringId = await TeamMemberCard.countDocuments({
    userId: { $type: 'string' }
  });
  
  // String型のuserIdを持つChatHistoryを検索
  const chatHistoriesWithStringId = await ChatHistory.countDocuments({
    userId: { $type: 'string' }
  });
  
  console.log(`String型userIdを持つTeamMemberCard: ${teamMemberCardsWithStringId}`);
  console.log(`String型userIdを持つChatHistory: ${chatHistoriesWithStringId}`);
  
  if (teamMemberCardsWithStringId === 0 && chatHistoriesWithStringId === 0) {
    console.log('検証成功: すべてのコレクションがObjectIDを使用しています');
    return true;
  } else {
    console.log('検証失敗: まだString型IDを使用しているドキュメントがあります');
    return false;
  }
}

/**
 * 移行完了後にFirebaseの痕跡を削除する関数
 * 注意: これは元に戻せない操作です
 */
async function cleanupFirebaseReferences() {
  console.log('\n===== Firebase参照のクリーンアップ =====');
  
  if (!process.argv.includes('--cleanup')) {
    console.log('--cleanupフラグが指定されていないため、クリーンアップは行いません');
    return;
  }
  
  // 移行が完了しているか再確認
  const migrationComplete = await verifyMigration();
  if (!migrationComplete) {
    console.log('移行が完了していないため、クリーンアップを中止します');
    return;
  }
  
  console.log('警告: このクリーンアップは元に戻せません。すべてのFirebase UIDの参照が削除されます');
  console.log('3秒後にクリーンアップを開始します...');
  
  // 3秒待機
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // User.uidとUser.firebaseUidフィールドを削除
  const userUpdateResult = await User.updateMany(
    { $or: [{ uid: { $exists: true } }, { firebaseUid: { $exists: true } }] },
    { $unset: { uid: "", firebaseUid: "" } }
  );
  
  console.log(`${userUpdateResult.modifiedCount}ユーザーからFirebase参照を削除しました`);
  
  console.log('クリーンアップが完了しました');
}

/**
 * ログファイルを保存する関数
 */
function saveLogFile() {
  migrationStatus.endTime = new Date();
  
  // ログディレクトリがなければ作成
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  
  // ログファイルを保存
  fs.writeFileSync(LOG_FILE, JSON.stringify(migrationStatus, null, 2));
  console.log(`\n移行ログが ${LOG_FILE} に保存されました`);
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    // データベースに接続
    await connectToDatabase();
    console.log('MongoDBに接続しました');
    
    // コマンドライン引数を解析
    const args = process.argv.slice(2);
    const mode = args[0] || '--check';
    
    // ID変換マッピングを作成
    const idMappings = await createIdMappings();
    migrationStatus.idMappings = idMappings;
    
    // TeamMemberCardコレクションの移行
    await migrateTeamMemberCards(idMappings);
    
    // ChatHistoryコレクションの移行
    await migrateChatHistories(idMappings);
    
    // 移行の検証
    if (process.argv.includes('--verify')) {
      await verifyMigration();
    }
    
    // Firebase参照のクリーンアップ
    if (process.argv.includes('--cleanup')) {
      await cleanupFirebaseReferences();
    }
    
    // 移行ログを保存
    saveLogFile();
    
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