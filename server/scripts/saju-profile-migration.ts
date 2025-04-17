/**
 * 四柱推命プロフィールデータ移行スクリプト
 * SajuProfileコレクションのデータをUserコレクションに移行し、
 * 参照整合性を維持しながらプロフィールデータを一元化します。
 * 
 * 実行コマンド:
 * ts-node server/scripts/saju-profile-migration.ts [--check | --migrate | --purge]
 * 
 * オプション:
 * --check: 現在の状態を確認するだけで、データの変更は行わない（デフォルト）
 * --migrate: 実際にデータを移行する
 * --purge: データ完全移行後、不要になったSajuProfileコレクションを削除する
 */
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/config/database';
import { User } from '../src/models';

// 環境変数を読み込み
dotenv.config();

// コレクション名
const SAJU_PROFILE_COLLECTION = 'sajuprofiles';

/**
 * SajuProfileからUserへのデータマッピング関数
 * @param sajuProfile SajuProfileドキュメント
 * @returns Userモデル用の更新データ
 */
function mapSajuProfileToUser(sajuProfile: any): Partial<any> {
  return {
    birthDate: sajuProfile.birthdate,
    birthTime: sajuProfile.birthtime,
    birthPlace: sajuProfile.birthplace,
    gender: sajuProfile.gender,
    birthplaceCoordinates: sajuProfile.birthplaceCoordinates,
    localTimeOffset: sajuProfile.localTimeOffset,
    elementAttribute: sajuProfile.elementAttribute,
    dayMaster: sajuProfile.dayMaster,
    fourPillars: {
      year: {
        heavenlyStem: sajuProfile.pillars.year.heavenlyStem,
        earthlyBranch: sajuProfile.pillars.year.earthlyBranch,
        heavenlyStemTenGod: sajuProfile.pillars.year.heavenlyStemTenGod,
        earthlyBranchTenGod: sajuProfile.pillars.year.earthlyBranchTenGod,
        hiddenStems: sajuProfile.pillars.year.hiddenStems || []
      },
      month: {
        heavenlyStem: sajuProfile.pillars.month.heavenlyStem,
        earthlyBranch: sajuProfile.pillars.month.earthlyBranch,
        heavenlyStemTenGod: sajuProfile.pillars.month.heavenlyStemTenGod,
        earthlyBranchTenGod: sajuProfile.pillars.month.earthlyBranchTenGod,
        hiddenStems: sajuProfile.pillars.month.hiddenStems || []
      },
      day: {
        heavenlyStem: sajuProfile.pillars.day.heavenlyStem,
        earthlyBranch: sajuProfile.pillars.day.earthlyBranch,
        heavenlyStemTenGod: sajuProfile.pillars.day.heavenlyStemTenGod,
        earthlyBranchTenGod: sajuProfile.pillars.day.earthlyBranchTenGod,
        hiddenStems: sajuProfile.pillars.day.hiddenStems || []
      },
      hour: {
        heavenlyStem: sajuProfile.pillars.time.heavenlyStem,
        earthlyBranch: sajuProfile.pillars.time.earthlyBranch,
        heavenlyStemTenGod: sajuProfile.pillars.time.heavenlyStemTenGod,
        earthlyBranchTenGod: sajuProfile.pillars.time.earthlyBranchTenGod,
        hiddenStems: sajuProfile.pillars.time.hiddenStems || []
      }
    },
    elementProfile: {
      wood: 20, // デフォルト値（実際のデータがない場合）
      fire: 20,
      earth: 20,
      metal: 20,
      water: 20
    },
    personalityDescription: sajuProfile.personalityDescription,
    careerAptitude: sajuProfile.careerDescription
  };
}

/**
 * データベースの現在の状態を確認する関数
 */
async function checkStatus() {
  console.log('\n===== データ移行前状態確認 =====');
  
  // MongoDBに接続
  const db = mongoose.connection.db;
  
  // SajuProfileコレクションの存在確認
  const collections = await db.listCollections().toArray();
  const hasSajuProfileCollection = collections.some(c => c.name === SAJU_PROFILE_COLLECTION);
  
  if (!hasSajuProfileCollection) {
    console.log('SajuProfileコレクションは存在しません。移行は不要です。');
    return {
      hasSajuProfileCollection: false,
      sajuProfileCount: 0,
      userCount: 0,
      usersWithSajuData: 0
    };
  }
  
  // SajuProfileコレクションのドキュメント数
  const sajuProfileCollection = db.collection(SAJU_PROFILE_COLLECTION);
  const sajuProfileCount = await sajuProfileCollection.countDocuments();
  
  console.log(`SajuProfileコレクションのドキュメント数: ${sajuProfileCount}`);
  
  // ユーザー数
  const userCount = await User.countDocuments();
  console.log(`Userコレクションのドキュメント数: ${userCount}`);
  
  // 四柱推命データを持つユーザー数
  const usersWithSajuData = await User.countDocuments({
    elementAttribute: { $exists: true },
    fourPillars: { $exists: true }
  });
  
  console.log(`四柱推命データを持つユーザー数: ${usersWithSajuData}`);
  console.log(`四柱推命データ移行率: ${userCount > 0 ? ((usersWithSajuData / userCount) * 100).toFixed(2) : 0}%`);
  
  if (sajuProfileCount > 0) {
    // サンプルとして一つのSajuProfileを表示
    const sampleProfile = await sajuProfileCollection.findOne();
    console.log('\n===== SajuProfileサンプル =====');
    console.log(JSON.stringify(sampleProfile, null, 2).substring(0, 500) + '...');
    
    // 対応するユーザーのデータも表示
    if (sampleProfile && sampleProfile.userId) {
      const user = await User.findById(sampleProfile.userId).lean();
      if (user) {
        console.log('\n===== 対応するユーザーデータ =====');
        const { password, ...userWithoutPassword } = user as any;
        console.log(JSON.stringify(userWithoutPassword, null, 2).substring(0, 500) + '...');
      }
    }
  }
  
  return {
    hasSajuProfileCollection,
    sajuProfileCount,
    userCount,
    usersWithSajuData
  };
}

/**
 * 実際にデータを移行する関数
 */
async function migrateData() {
  console.log('\n===== SajuProfile -> User データ移行を開始 =====');
  
  // MongoDBに接続
  const db = mongoose.connection.db;
  
  // SajuProfileコレクションの存在確認
  const collections = await db.listCollections().toArray();
  const hasSajuProfileCollection = collections.some(c => c.name === SAJU_PROFILE_COLLECTION);
  
  if (!hasSajuProfileCollection) {
    console.log('SajuProfileコレクションは存在しません。移行は不要です。');
    return;
  }
  
  // SajuProfileコレクションの取得
  const sajuProfileCollection = db.collection(SAJU_PROFILE_COLLECTION);
  const profiles = await sajuProfileCollection.find({}).toArray();
  
  console.log(`${profiles.length}件のSajuProfileが見つかりました。移行を開始します...`);
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  // すべてのプロフィールを処理
  for (const profile of profiles) {
    try {
      // プロフィールがすでに処理済みかチェック
      const userData = await User.findById(profile.userId).exec();
      
      if (!userData) {
        console.log(`警告: UserID ${profile.userId} に対応するユーザーが見つかりません。スキップします。`);
        skippedCount++;
        continue;
      }
      
      // すでに四柱推命データを持っているか確認
      if (userData.elementAttribute && userData.fourPillars) {
        console.log(`ユーザー ${userData.email} (${userData._id}) はすでに四柱推命データを持っています。スキップします。`);
        skippedCount++;
        continue;
      }
      
      // マッピング関数でSajuProfileからUserデータへ変換
      const updateData = mapSajuProfileToUser(profile);
      
      // レガシー参照としてsajuProfileIdを追加
      updateData.sajuProfileId = profile._id;
      
      // ユーザーデータを更新
      await User.updateOne(
        { _id: profile.userId },
        { $set: updateData }
      );
      
      console.log(`ユーザー ${userData.email} (${userData._id}) のデータを移行しました`);
      successCount++;
      
    } catch (error) {
      console.error(`エラー: プロフィールID ${profile._id} の処理中に問題が発生しました`, error);
      errorCount++;
    }
  }
  
  console.log('\n===== データ移行完了 =====');
  console.log(`処理したプロフィール: ${profiles.length}`);
  console.log(`成功: ${successCount}`);
  console.log(`エラー: ${errorCount}`);
  console.log(`スキップ: ${skippedCount}`);
}

/**
 * SajuProfileコレクションを完全に削除する関数
 * 注意: すべてのデータが安全に移行された後にのみ実行すべき
 */
async function purgeSajuProfileCollection() {
  console.log('\n===== SajuProfileコレクション削除 =====');
  
  // 現在の状態を確認
  const status = await checkStatus();
  
  if (!status.hasSajuProfileCollection) {
    console.log('SajuProfileコレクションは既に存在しません。');
    return;
  }
  
  // 移行が完了しているか確認
  if (status.sajuProfileCount > 0 && status.usersWithSajuData < status.sajuProfileCount) {
    console.log('警告: すべてのSajuProfileデータがUserに移行されていない可能性があります。');
    console.log(`SajuProfile数: ${status.sajuProfileCount}, 四柱推命データを持つユーザー数: ${status.usersWithSajuData}`);
    console.log('安全のため、削除操作を中止します。');
    return;
  }
  
  // SajuProfileコレクションを削除
  const db = mongoose.connection.db;
  await db.dropCollection(SAJU_PROFILE_COLLECTION);
  
  console.log('SajuProfileコレクションを削除しました。');
  
  // sajuProfileIdフィールドの削除（オプション）
  const removeReferenceField = true;
  if (removeReferenceField) {
    await User.updateMany(
      { sajuProfileId: { $exists: true } },
      { $unset: { sajuProfileId: "" } }
    );
    
    console.log('すべてのユーザーからsajuProfileId参照を削除しました。');
  }
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    await connectToDatabase();
    console.log('MongoDBに接続しました');
    
    // コマンドライン引数を解析
    const args = process.argv.slice(2);
    const mode = args[0] || '--check';
    
    switch (mode) {
      case '--check':
        await checkStatus();
        break;
        
      case '--migrate':
        await checkStatus();
        await migrateData();
        break;
        
      case '--purge':
        await checkStatus();
        await purgeSajuProfileCollection();
        break;
        
      default:
        console.log('不明なオプション:', mode);
        console.log('使用法: ts-node server/scripts/saju-profile-migration.ts [--check | --migrate | --purge]');
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
main().catch(err => {
  console.error('スクリプト実行中にエラーが発生しました:', err);
  process.exit(1);
});