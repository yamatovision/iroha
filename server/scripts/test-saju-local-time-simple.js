/**
 * 地方時調整機能のシンプルなテストスクリプト
 * 
 * 使用方法: 
 * node scripts/test-saju-local-time-simple.js
 */

// モック関数・データ
const mockCities = ['東京', 'ソウル', '大阪', '北京', 'ニューヨーク'];
const mockCoordinates = {
  '東京': { longitude: 139.6917, latitude: 35.6895 },
  'ソウル': { longitude: 126.9780, latitude: 37.5665 },
  '大阪': { longitude: 135.5023, latitude: 34.6937 },
  '北京': { longitude: 116.4074, latitude: 39.9042 },
  'ニューヨーク': { longitude: -74.0060, latitude: 40.7128 }
};

// 地方時オフセット計算関数
function calculateLocalTimeOffset(coordinates) {
  const { longitude } = coordinates;
  
  // 地域特有の調整
  if (longitude >= 135 && longitude < 145) {
    // 東京エリア: +18分
    return 18;
  } else if (longitude >= 125 && longitude < 135) {
    // ソウルエリア: -32分
    return -32;
  } else if (longitude >= 115 && longitude < 125) {
    // 北京エリア: -33分
    return -33;
  }
  
  // 標準経度（日本）からの差に基づく計算
  // 経度1度あたり4分の差
  const standardLongitude = 135; // 日本標準時の経度
  const longitudeDifference = longitude - standardLongitude;
  return Math.round(longitudeDifference * 4);
}

// 日時調整関数
function adjustDateTime(date, time, localTimeAdjustmentMinutes) {
  if (localTimeAdjustmentMinutes === 0) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: Math.floor(time),
      minute: Math.round((time % 1) * 60)
    };
  }
  
  // 調整前の時間と分
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hour = Math.floor(time);
  let minute = Math.round((time % 1) * 60);
  
  // 分の調整
  minute += localTimeAdjustmentMinutes;
  
  // 時間のオーバーフロー処理
  while (minute >= 60) {
    minute -= 60;
    hour += 1;
  }
  
  while (minute < 0) {
    minute += 60;
    hour -= 1;
  }
  
  // 日付のオーバーフロー処理
  while (hour >= 24) {
    hour -= 24;
    day += 1;
  }
  
  while (hour < 0) {
    hour += 24;
    day -= 1;
  }
  
  // 月末日の調整（簡易版）
  const daysInMonth = new Date(year, month, 0).getDate();
  while (day > daysInMonth) {
    day -= daysInMonth;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  
  while (day < 1) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    const prevMonthDays = new Date(year, month, 0).getDate();
    day += prevMonthDays;
  }
  
  return { year, month, day, hour, minute };
}

// メイン実行関数
async function main() {
  console.log('地方時調整機能のシンプルなテスト\n');
  
  // 利用可能な都市リストを表示
  console.log('利用可能な都市リスト:');
  console.log(mockCities);
  console.log();
  
  // サンプル日時の設定
  const sampleDate = new Date(1986, 10, 15); // 1986年11月15日
  const sampleTime = 12.5; // 12時30分
  
  // 異なる都市での計算結果を比較するテスト
  console.log('===== 異なる都市での地方時調整テスト =====');
  
  for (const city of mockCities) {
    // 都市の座標
    const coordinates = mockCoordinates[city];
    
    if (!coordinates) {
      console.log(`${city}の座標情報が見つかりませんでした。`);
      continue;
    }
    
    // 地方時調整値を計算
    const localTimeOffset = calculateLocalTimeOffset(coordinates);
    
    // 調整後の日時情報
    const adjustedDate = adjustDateTime(sampleDate, sampleTime, localTimeOffset);
    
    console.log(`\n[${city}] - 座標: 経度 ${coordinates.longitude}°, 緯度 ${coordinates.latitude}°`);
    console.log(`  地方時調整: ${localTimeOffset} 分`);
    console.log(`  元の日時: ${sampleDate.toISOString().split('T')[0]} ${Math.floor(sampleTime)}:${(sampleTime % 1) * 60}`);
    console.log(`  調整後: ${adjustedDate.year}/${adjustedDate.month}/${adjustedDate.day} ${adjustedDate.hour}:${adjustedDate.minute}`);
  }
  
  // 経度による地方時オフセットを詳細にテスト
  console.log('\n\n===== 経度による地方時オフセットの詳細テスト =====');
  
  // 経度範囲
  const longitudes = [120, 125, 130, 135, 140, 145, 150];
  
  for (const longitude of longitudes) {
    // 仮の座標を作成
    const testCoordinates = {
      longitude: longitude,
      latitude: 35 // 緯度は固定（日本あたり）
    };
    
    // 地方時調整値を計算
    const offset = calculateLocalTimeOffset(testCoordinates);
    
    console.log(`経度 ${longitude}° → 地方時調整: ${offset} 分`);
  }
  
  console.log('\nテストが完了しました。');
}

// スクリプト実行
main().catch(console.error);