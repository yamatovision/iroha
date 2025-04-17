/**
 * サジュプロファイルのタイムゾーン情報マイグレーションスクリプト
 * 
 * 既存のユーザープロファイルに国際タイムゾーン情報を追加します。
 * 座標情報から最適なタイムゾーンを推測し、extendedLocationフィールドを設定します。
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 環境変数の読み込み
dotenv.config();

// MongoDB接続
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyfortune';

// タイムゾーンデータベース（主要都市のみ）
const cities = [
  { name: 'Tokyo', country: 'Japan', coordinates: { longitude: 139.6917, latitude: 35.6895 }, timeZone: 'Asia/Tokyo' },
  { name: 'Osaka', country: 'Japan', coordinates: { longitude: 135.5023, latitude: 34.6937 }, timeZone: 'Asia/Tokyo' },
  { name: 'New York', country: 'USA', coordinates: { longitude: -74.0060, latitude: 40.7128 }, timeZone: 'America/New_York' },
  { name: 'London', country: 'UK', coordinates: { longitude: -0.1278, latitude: 51.5074 }, timeZone: 'Europe/London' },
  { name: 'Paris', country: 'France', coordinates: { longitude: 2.3522, latitude: 48.8566 }, timeZone: 'Europe/Paris' },
  { name: 'Berlin', country: 'Germany', coordinates: { longitude: 13.4050, latitude: 52.5200 }, timeZone: 'Europe/Berlin' },
  { name: 'Sydney', country: 'Australia', coordinates: { longitude: 151.2093, latitude: -33.8688 }, timeZone: 'Australia/Sydney' },
  { name: 'Seoul', country: 'South Korea', coordinates: { longitude: 126.9780, latitude: 37.5665 }, timeZone: 'Asia/Seoul' },
  { name: 'Beijing', country: 'China', coordinates: { longitude: 116.4074, latitude: 39.9042 }, timeZone: 'Asia/Shanghai' },
  { name: 'Hong Kong', country: 'China', coordinates: { longitude: 114.1694, latitude: 22.3193 }, timeZone: 'Asia/Hong_Kong' },
];

// 座標から最寄りの都市を見つける関数
function findNearestCity(longitude, latitude) {
  if (!longitude || !latitude) return null;
  
  let minDistance = Infinity;
  let nearestCity = null;
  
  for (const city of cities) {
    const distance = calculateDistance(
      latitude, 
      longitude, 
      city.coordinates.latitude, 
      city.coordinates.longitude
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }
  
  // 1000km以上離れている場合は最寄り都市とは見なさない
  if (minDistance > 1000) {
    return null;
  }
  
  return nearestCity;
}

// ハーバーサイン公式で2点間の距離を計算（km単位）
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球の半径（km）
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// 経度からタイムゾーンオフセットを推測（粗い推定）
function estimateTimezoneFromLongitude(longitude) {
  // 経度1度あたり4分の時差（24時間/360度 = 4分/度）
  // グリニッジ子午線（経度0度）からの差を計算
  const hourOffset = Math.round(longitude / 15);
  return `UTC${hourOffset >= 0 ? '+' : ''}${hourOffset}`;
}

// メイン処理
async function migrateSajuProfiles() {
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
    
    // 四柱推命プロフィール情報が登録済みのユーザーを取得
    const users = await User.find({
      birthDate: { $exists: true },
      birthplaceCoordinates: { $exists: true },
      $or: [
        { timeZone: { $exists: false } },
        { extendedLocation: { $exists: false } }
      ]
    });
    
    console.log(`マイグレーション対象ユーザー数: ${users.length}`);
    
    const migrationResults = {
      success: 0,
      failed: 0,
      noCoordinates: 0,
      alreadyMigrated: 0,
      details: []
    };
    
    // 各ユーザーの四柱推命プロフィールを処理
    for (const user of users) {
      try {
        // 既にマイグレーション済みかチェック
        if (user.timeZone && user.extendedLocation) {
          console.log(`ユーザー ${user._id} (${user.email || 'N/A'}) は既にマイグレーション済みです`);
          migrationResults.alreadyMigrated++;
          continue;
        }
        
        // 座標情報がない場合はスキップ
        if (!user.birthplaceCoordinates || 
            !user.birthplaceCoordinates.longitude || 
            !user.birthplaceCoordinates.latitude) {
          console.log(`ユーザー ${user._id} (${user.email || 'N/A'}) は座標情報がありません`);
          migrationResults.noCoordinates++;
          continue;
        }
        
        // 座標情報から最寄りの都市を検索
        const { longitude, latitude } = user.birthplaceCoordinates;
        const nearestCity = findNearestCity(longitude, latitude);
        
        // 新しい拡張ロケーション情報を作成
        let extendedLocation;
        let timeZone;
        
        if (nearestCity) {
          // 最寄り都市が見つかった場合
          extendedLocation = {
            name: nearestCity.name,
            country: nearestCity.country,
            coordinates: {
              longitude: longitude,
              latitude: latitude
            },
            timeZone: nearestCity.timeZone
          };
          timeZone = nearestCity.timeZone;
        } else {
          // 最寄り都市が見つからない場合は経度から推測
          const estimatedTimezone = estimateTimezoneFromLongitude(longitude);
          extendedLocation = {
            name: user.birthPlace || 'Unknown Location',
            country: 'Unknown',
            coordinates: {
              longitude: longitude,
              latitude: latitude
            },
            timeZone: estimatedTimezone
          };
          timeZone = estimatedTimezone;
        }
        
        // 更新を適用
        await User.updateOne(
          { _id: user._id },
          { 
            $set: { 
              timeZone: timeZone,
              extendedLocation: extendedLocation
            } 
          }
        );
        
        console.log(`ユーザー ${user._id} (${user.email || 'N/A'}) を更新しました：`);
        console.log(`  - 出生地: ${user.birthPlace || 'N/A'}`);
        console.log(`  - 座標: ${longitude}, ${latitude}`);
        console.log(`  - 設定タイムゾーン: ${timeZone}`);
        console.log(`  - 最寄り都市: ${extendedLocation.name}, ${extendedLocation.country}`);
        
        migrationResults.success++;
        migrationResults.details.push({
          userId: user._id,
          email: user.email || 'N/A',
          birthPlace: user.birthPlace || 'N/A',
          coordinates: `${longitude}, ${latitude}`,
          timeZone: timeZone,
          nearestCity: extendedLocation.name,
          country: extendedLocation.country
        });
        
      } catch (userError) {
        console.error(`ユーザー ${user._id} の処理中にエラーが発生しました:`, userError);
        migrationResults.failed++;
      }
    }
    
    // 結果サマリを表示
    console.log('\nマイグレーション結果サマリ:');
    console.log(`  - 成功: ${migrationResults.success} ユーザー`);
    console.log(`  - 失敗: ${migrationResults.failed} ユーザー`);
    console.log(`  - 座標なし: ${migrationResults.noCoordinates} ユーザー`);
    console.log(`  - 既にマイグレーション済み: ${migrationResults.alreadyMigrated} ユーザー`);
    
    // 詳細な結果をJSONとして保存
    const resultFileName = `saju-timezone-migration-${new Date().toISOString().replace(/:/g, '-')}.json`;
    const resultPath = path.join(__dirname, resultFileName);
    fs.writeFileSync(resultPath, JSON.stringify(migrationResults, null, 2));
    console.log(`\n詳細な結果が ${resultPath} に保存されました。`);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    console.log('MongoDBから切断しました');
    mongoose.connection.close();
  }
}

// スクリプトを実行
migrateSajuProfiles();