/**
 * 国際タイムゾーン対応マイグレーション結果確認スクリプト
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

// MongoDB接続
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyfortune';

// マイグレーション結果確認
async function checkMigrationResults() {
  try {
    console.log('MongoDB URIを使用:', MONGODB_URI);
    console.log('MongoDBに接続中...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDBに正常に接続しました');
    
    // ユーザーモデルを取得
    const UserSchema = new mongoose.Schema({
      _id: mongoose.Schema.Types.Mixed,
      email: String,
      displayName: String,
      birthDate: Date,
      birthTime: String,
      birthPlace: String,
      gender: String,
      birthplaceCoordinates: {
        longitude: Number,
        latitude: Number
      },
      localTimeOffset: Number,
      timeZone: String,
      extendedLocation: {
        name: String,
        country: String,
        coordinates: {
          longitude: Number,
          latitude: Number
        },
        timeZone: String
      }
    }, { strict: false });
    
    const User = mongoose.model('User', UserSchema);
    
    // 国際タイムゾーン情報が追加されたユーザーを確認
    const usersWithTimezone = await User.find({
      timeZone: { $exists: true },
      extendedLocation: { $exists: true }
    });
    
    console.log(`\n国際タイムゾーン情報が追加されたユーザー数: ${usersWithTimezone.length}\n`);
    
    // ユーザーごとに情報表示
    for (const user of usersWithTimezone) {
      console.log(`ユーザー: ${user.displayName} (${user.email})`);
      console.log(`出生地: ${user.birthPlace || 'N/A'}`);
      console.log(`座標: ${user.birthplaceCoordinates?.longitude || 'N/A'}, ${user.birthplaceCoordinates?.latitude || 'N/A'}`);
      console.log(`タイムゾーン: ${user.timeZone || 'N/A'}`);
      
      if (user.extendedLocation) {
        console.log('拡張ロケーション情報:');
        console.log(`  - 都市: ${user.extendedLocation.name || 'N/A'}`);
        console.log(`  - 国: ${user.extendedLocation.country || 'N/A'}`);
        console.log(`  - タイムゾーン: ${user.extendedLocation.timeZone || 'N/A'}`);
      }
      
      console.log('---------------------------------------------------');
    }
    
    // 国際タイムゾーン情報のないユーザーも確認
    const usersWithoutTimezone = await User.find({
      $or: [
        { timeZone: { $exists: false } },
        { extendedLocation: { $exists: false } }
      ],
      birthDate: { $exists: true }
    });
    
    console.log(`\n国際タイムゾーン情報が追加されていないユーザー数: ${usersWithoutTimezone.length}\n`);
    
    if (usersWithoutTimezone.length > 0) {
      for (const user of usersWithoutTimezone) {
        console.log(`ユーザー: ${user.displayName} (${user.email})`);
        console.log(`出生地: ${user.birthPlace || 'N/A'}`);
        console.log(`座標: ${user.birthplaceCoordinates?.longitude || 'N/A'}, ${user.birthplaceCoordinates?.latitude || 'N/A'}`);
        console.log('---------------------------------------------------');
      }
    }
    
    // マイグレーション成功率を計算
    const totalUsers = await User.countDocuments({ birthDate: { $exists: true } });
    const successRate = (usersWithTimezone.length / totalUsers) * 100;
    
    console.log(`\nマイグレーション結果サマリ:`);
    console.log(`  - 四柱推命プロフィール登録ユーザー総数: ${totalUsers}`);
    console.log(`  - 国際タイムゾーン情報追加済みユーザー: ${usersWithTimezone.length}`);
    console.log(`  - 国際タイムゾーン情報未追加ユーザー: ${usersWithoutTimezone.length}`);
    console.log(`  - マイグレーション成功率: ${successRate.toFixed(2)}%`);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDBから切断しました');
  }
}

// スクリプトを実行
checkMigrationResults();