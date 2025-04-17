/**
 * 国際タイムゾーン機能のテストスクリプト
 * 
 * 使い方:
 * node scripts/test-international-timezone.js
 */

const axios = require('axios');
const baseURL = 'http://localhost:8090/api/v1'; // APIのベースURL

// 異なる都市と座標でテスト
async function testTimezoneInfo() {
  console.log('=== タイムゾーン情報のテスト ===');
  
  try {
    // 都市名でテスト
    console.log('\n1. 都市名によるタイムゾーン情報テスト:');
    const cities = ['Tokyo', 'New York', 'London', 'Sydney', 'Paris'];
    
    for (const city of cities) {
      const response = await axios.get(`${baseURL}/day-pillars/timezone-info`, {
        params: { location: city }
      });
      
      console.log(`\n${city}のタイムゾーン情報:`);
      console.log(`  タイムゾーン: ${response.data.politicalTimeZone}`);
      console.log(`  サマータイム: ${response.data.isDST ? 'あり' : 'なし'}`);
      console.log(`  オフセット(分): ${response.data.timeZoneOffsetMinutes}`);
      
      if (response.data.location && response.data.location.coordinates) {
        console.log(`  座標: ${response.data.location.coordinates.longitude}, ${response.data.location.coordinates.latitude}`);
      }
    }
    
    // 座標でテスト
    console.log('\n2. 座標によるタイムゾーン情報テスト:');
    const coordinates = [
      { longitude: 139.7671, latitude: 35.6812 }, // 東京
      { longitude: -74.0060, latitude: 40.7128 }, // ニューヨーク
      { longitude: -0.1278, latitude: 51.5074 }   // ロンドン
    ];
    
    for (const coords of coordinates) {
      const response = await axios.get(`${baseURL}/day-pillars/timezone-info`, {
        params: { location: JSON.stringify(coords) }
      });
      
      console.log(`\n座標(${coords.longitude}, ${coords.latitude})のタイムゾーン情報:`);
      console.log(`  タイムゾーン: ${response.data.politicalTimeZone}`);
      console.log(`  サマータイム: ${response.data.isDST ? 'あり' : 'なし'}`);
      console.log(`  オフセット(分): ${response.data.timeZoneOffsetMinutes}`);
    }
    
    // 拡張ロケーション情報でテスト
    console.log('\n3. 拡張ロケーション情報によるタイムゾーン情報テスト:');
    const extendedLocations = [
      {
        name: '大阪',
        country: 'Japan',
        coordinates: { longitude: 135.5023, latitude: 34.6937 },
        timeZone: 'Asia/Tokyo'
      },
      {
        name: 'San Francisco',
        country: 'USA',
        coordinates: { longitude: -122.4194, latitude: 37.7749 }
      }
    ];
    
    for (const extLoc of extendedLocations) {
      const response = await axios.get(`${baseURL}/day-pillars/timezone-info`, {
        params: { location: JSON.stringify(extLoc) }
      });
      
      console.log(`\n${extLoc.name}(${extLoc.country})のタイムゾーン情報:`);
      console.log(`  タイムゾーン: ${response.data.politicalTimeZone}`);
      console.log(`  サマータイム: ${response.data.isDST ? 'あり' : 'なし'}`);
      console.log(`  オフセット(分): ${response.data.timeZoneOffsetMinutes}`);
      console.log(`  座標: ${response.data.location.coordinates.longitude}, ${response.data.location.coordinates.latitude}`);
    }
    
  } catch (error) {
    console.error('タイムゾーン情報テストエラー:', error.response?.data || error.message);
  }
}

// 利用可能な都市一覧を取得
async function testAvailableCities() {
  console.log('\n=== 利用可能な都市一覧のテスト ===');
  
  try {
    const response = await axios.get(`${baseURL}/day-pillars/available-cities`);
    
    console.log(`利用可能な都市数: ${response.data.count}`);
    console.log('都市サンプル(先頭10件):');
    
    const sampleCities = response.data.cities.slice(0, 10);
    sampleCities.forEach(city => console.log(`  - ${city}`));
    
    // 特定の主要都市が含まれているか確認
    const majorCities = ['Tokyo', 'New York', 'London', 'Paris', 'Beijing'];
    console.log('\n主要都市の存在確認:');
    
    majorCities.forEach(city => {
      const exists = response.data.cities.includes(city);
      console.log(`  ${city}: ${exists ? '✓' : '✗'}`);
    });
    
  } catch (error) {
    console.error('利用可能な都市一覧テストエラー:', error.response?.data || error.message);
  }
}

// メイン実行関数
async function main() {
  console.log('国際タイムゾーン機能テスト開始\n');
  
  await testTimezoneInfo();
  await testAvailableCities();
  
  console.log('\n国際タイムゾーン機能テスト完了');
}

main().catch(err => {
  console.error('テスト実行エラー:', err);
  process.exit(1);
});