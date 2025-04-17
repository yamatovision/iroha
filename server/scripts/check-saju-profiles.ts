import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/config/database';
import { SajuProfile, User } from '../src/models';

// 環境変数を読み込み
dotenv.config();

// 特定のユーザーのSajuProfileを確認する関数
async function checkUserSajuProfile(email: string) {
  try {
    // MongoDBに接続
    await connectToDatabase();
    console.log('\n===== MongoDBに接続しました =====');
    
    // ユーザーを検索
    console.log(`\n===== ユーザー情報の検索: ${email} =====`);
    const user = await User.findOne({ email }).exec();
    
    if (!user) {
      console.log(`ユーザーが見つかりません: ${email}`);
      return;
    }
    
    console.log('ユーザー情報:');
    console.log({
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role
    });
    
    // SajuProfileを検索
    console.log('\n===== 四柱推命プロフィールの検索 =====');
    const profile = await SajuProfile.findOne({ userId: user._id }).exec();
    
    if (!profile) {
      console.log(`四柱推命プロフィールは見つかりませんでした: ユーザーID ${user._id}`);
      return;
    }
    
    // プロフィール情報を表示
    console.log('\n===== 四柱推命プロフィール情報 =====');
    console.log({
      profileId: profile._id,
      userId: profile.userId,
      birthplace: profile.birthplace,
      elementAttribute: profile.elementAttribute,
      dayMaster: profile.dayMaster,
      fourPillars: {
        year: {
          heavenlyStem: profile.pillars.year.heavenlyStem,
          earthlyBranch: profile.pillars.year.earthlyBranch,
        },
        month: {
          heavenlyStem: profile.pillars.month.heavenlyStem,
          earthlyBranch: profile.pillars.month.earthlyBranch,
        },
        day: {
          heavenlyStem: profile.pillars.day.heavenlyStem,
          earthlyBranch: profile.pillars.day.earthlyBranch,
        },
        time: {
          heavenlyStem: profile.pillars.time.heavenlyStem,
          earthlyBranch: profile.pillars.time.earthlyBranch,
        }
      },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    });
    
    console.log('\n===== 性格特性と仕事適性 =====');
    console.log(`性格特性: ${profile.personalityDescription.substring(0, 100)}...`);
    console.log(`仕事適性: ${profile.careerDescription.substring(0, 100)}...`);
    
    return profile;
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

// すべてのSajuProfileを表示する関数
async function listAllSajuProfiles() {
  try {
    // MongoDBに接続
    await connectToDatabase();
    console.log('\n===== MongoDBに接続しました =====');
    
    // SajuProfileの総数を取得
    const count = await SajuProfile.countDocuments();
    console.log(`\n===== 四柱推命プロフィール総数: ${count} =====`);
    
    if (count === 0) {
      console.log('四柱推命プロフィールはまだ登録されていません');
      return;
    }
    
    // 最新の5件のプロフィールを取得
    console.log('\n===== 最新の四柱推命プロフィール (最大5件) =====');
    const profiles = await SajuProfile.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();
    
    for (const profile of profiles) {
      // 対応するユーザー情報を取得
      const user = await User.findById(profile.userId).exec();
      const userEmail = user ? user.email : '不明';
      
      console.log('\n----- プロフィール情報 -----');
      console.log(`ID: ${profile._id}`);
      console.log(`ユーザー: ${userEmail} (${profile.userId})`);
      console.log(`出生地: ${profile.birthplace}`);
      console.log(`五行属性: ${profile.elementAttribute}`);
      console.log(`日主: ${profile.dayMaster}`);
      console.log(`四柱: 年(${profile.pillars.year.heavenlyStem}${profile.pillars.year.earthlyBranch}) 月(${profile.pillars.month.heavenlyStem}${profile.pillars.month.earthlyBranch}) 日(${profile.pillars.day.heavenlyStem}${profile.pillars.day.earthlyBranch}) 時(${profile.pillars.time.heavenlyStem}${profile.pillars.time.earthlyBranch})`);
      console.log(`作成日時: ${profile.createdAt}`);
    }
    
    return profiles;
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

// コマンドライン引数からモードを判断
const specificEmail = process.argv[2];

if (specificEmail && specificEmail.includes('@')) {
  // 特定のユーザーのSajuProfileを確認
  checkUserSajuProfile(specificEmail)
    .then(() => {
      console.log(`\n===== ${specificEmail} のプロフィールチェックが完了しました =====`);
      process.exit(0);
    })
    .catch(error => {
      console.error('エラーが発生しました:', error);
      process.exit(1);
    });
} else {
  // すべてのSajuProfileを一覧表示
  listAllSajuProfiles()
    .then(() => {
      console.log('\n===== 四柱推命プロフィール一覧の表示が完了しました =====');
      process.exit(0);
    })
    .catch(error => {
      console.error('エラーが発生しました:', error);
      process.exit(1);
    });
}