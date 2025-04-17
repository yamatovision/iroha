/**
 * 国際タイムゾーン対応APIエンドポイント統合テスト
 * 
 * このスクリプトは以下のエンドポイントをテストします：
 * 1. /api/v1/day-pillars/timezone-info - タイムゾーン情報の取得
 * 2. /api/v1/day-pillars/available-cities - 利用可能な都市リストの取得
 */

const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 環境変数の読み込み
dotenv.config();

// axios設定（タイムアウト設定）
const axiosConfig = {
  timeout: 10000 // 10秒
};

// ベースURL設定
const BASE_URL = 'http://localhost:8080'; // サーバーのポートに合わせて設定
const API_PREFIX = '/api/v1';

// テスト対象の都市リスト
const TEST_CITIES = [
  'Tokyo',
  'New York',
  'London',
  'Sydney',
  'Seoul'
];

// 座標データ
const TEST_COORDINATES = [
  { longitude: 139.6917, latitude: 35.6895, expectedCity: 'Tokyo' },
  { longitude: -74.0060, latitude: 40.7128, expectedCity: 'New York' },
  { longitude: -0.1278, latitude: 51.5074, expectedCity: 'London' }
];

/**
 * タイムゾーン情報取得エンドポイントのテスト（都市名指定）
 */
async function testTimezoneInfoByCity() {
  console.log('\n=== 都市名からのタイムゾーン情報取得テスト ===');
  
  for (const city of TEST_CITIES) {
    try {
      const response = await axios.get(`${BASE_URL}${API_PREFIX}/day-pillars/timezone-info`, {
        ...axiosConfig,
        params: { location: city }
      });
      
      console.log(`✅ ${city}のタイムゾーン情報を取得しました:`);
      console.log(`  - タイムゾーン: ${response.data.politicalTimeZone}`);
      console.log(`  - オフセット (分): ${response.data.timeZoneOffsetMinutes}`);
      console.log(`  - 座標: ${response.data.location.coordinates.longitude}, ${response.data.location.coordinates.latitude}`);
      console.log(`  - 夏時間: ${response.data.isDST ? 'あり' : 'なし'}`);
      
      if (response.data.adjustmentDetails) {
        console.log(`  - 調整詳細: `, response.data.adjustmentDetails);
      }
      
    } catch (error) {
      console.error(`❌ ${city}のタイムゾーン情報取得に失敗しました:`, error.message);
      if (error.response) {
        console.error('レスポンス:', error.response.data);
      }
    }
  }
}

/**
 * タイムゾーン情報取得エンドポイントのテスト（座標指定）
 */
async function testTimezoneInfoByCoordinates() {
  console.log('\n=== 座標からのタイムゾーン情報取得テスト ===');
  
  for (const coords of TEST_COORDINATES) {
    try {
      const response = await axios.get(`${BASE_URL}${API_PREFIX}/day-pillars/timezone-info`, {
        ...axiosConfig,
        params: { location: JSON.stringify(coords) }
      });
      
      console.log(`✅ 座標(${coords.longitude}, ${coords.latitude})のタイムゾーン情報を取得しました:`);
      console.log(`  - タイムゾーン: ${response.data.politicalTimeZone}`);
      console.log(`  - オフセット (分): ${response.data.timeZoneOffsetMinutes}`);
      console.log(`  - 座標: ${response.data.location.coordinates.longitude}, ${response.data.location.coordinates.latitude}`);
      console.log(`  - 夏時間: ${response.data.isDST ? 'あり' : 'なし'}`);
      console.log(`  - 期待される都市: ${coords.expectedCity}`);
      
      if (response.data.adjustmentDetails) {
        console.log(`  - 調整詳細: `, response.data.adjustmentDetails);
      }
      
    } catch (error) {
      console.error(`❌ 座標(${coords.longitude}, ${coords.latitude})のタイムゾーン情報取得に失敗しました:`, error.message);
      if (error.response) {
        console.error('レスポンス:', error.response.data);
      }
    }
  }
}

/**
 * 拡張ロケーション情報を使用したタイムゾーン情報取得テスト
 */
async function testTimezoneInfoByExtendedLocation() {
  console.log('\n=== 拡張ロケーション情報からのタイムゾーン情報取得テスト ===');
  
  const extendedLocation = {
    name: 'Paris',
    country: 'France',
    coordinates: {
      longitude: 2.3522,
      latitude: 48.8566
    },
    timeZone: 'Europe/Paris'
  };
  
  try {
    const response = await axios.get(`${BASE_URL}${API_PREFIX}/day-pillars/timezone-info`, {
      ...axiosConfig,
      params: { location: JSON.stringify(extendedLocation) }
    });
    
    console.log(`✅ 拡張ロケーション情報(${extendedLocation.name}, ${extendedLocation.country})のタイムゾーン情報を取得しました:`);
    console.log(`  - タイムゾーン: ${response.data.politicalTimeZone}`);
    console.log(`  - オフセット (分): ${response.data.timeZoneOffsetMinutes}`);
    console.log(`  - 座標: ${response.data.location.coordinates.longitude}, ${response.data.location.coordinates.latitude}`);
    console.log(`  - 夏時間: ${response.data.isDST ? 'あり' : 'なし'}`);
    
    if (response.data.adjustmentDetails) {
      console.log(`  - 調整詳細: `, response.data.adjustmentDetails);
    }
    
  } catch (error) {
    console.error(`❌ 拡張ロケーション情報のタイムゾーン情報取得に失敗しました:`, error.message);
    if (error.response) {
      console.error('レスポンス:', error.response.data);
    }
  }
}

/**
 * 利用可能な都市リスト取得エンドポイントのテスト
 */
async function testAvailableCities() {
  console.log('\n=== 利用可能な都市リスト取得テスト ===');
  
  try {
    const response = await axios.get(`${BASE_URL}${API_PREFIX}/day-pillars/available-cities`, axiosConfig);
    
    console.log(`✅ 利用可能な都市リストを取得しました:`);
    console.log(`  - 都市数: ${response.data.count}`);
    console.log(`  - 最初の10都市: ${response.data.cities.slice(0, 10).join(', ')}...`);
    
    // 完全な都市リストをファイルに保存
    const cityListFile = path.join(__dirname, 'available-cities.json');
    fs.writeFileSync(cityListFile, JSON.stringify(response.data, null, 2));
    console.log(`  - 都市リスト全体を ${cityListFile} に保存しました`);
    
  } catch (error) {
    console.error(`❌ 利用可能な都市リスト取得に失敗しました:`, error.message);
    if (error.response) {
      console.error('レスポンス:', error.response.data);
    }
  }
}

/**
 * メイン処理
 */
async function runTests() {
  try {
    console.log('国際タイムゾーン対応APIエンドポイント統合テストを開始します...\n');
    
    // サーバー状態確認
    try {
      console.log(`サーバー接続テスト: ${BASE_URL}${API_PREFIX}/day-pillars/today`);
      const response = await axios.get(`${BASE_URL}${API_PREFIX}/day-pillars/today`, axiosConfig);
      console.log('✅ サーバーが起動しています。日柱情報:', response.data.heavenlyStem + response.data.earthlyBranch);
    } catch (error) {
      console.error('❌ サーバーに接続できません。サーバーが起動しているか確認してください:', error.message);
      if (error.code) {
        console.error('エラーコード:', error.code);
      }
      if (error.response) {
        console.error('レスポンスステータス:', error.response.status);
        console.error('レスポンスデータ:', error.response.data);
      }
      process.exit(1);
    }
    
    // タイムゾーン情報取得テスト（都市名）
    await testTimezoneInfoByCity();
    
    // タイムゾーン情報取得テスト（座標）
    await testTimezoneInfoByCoordinates();
    
    // タイムゾーン情報取得テスト（拡張ロケーション情報）
    await testTimezoneInfoByExtendedLocation();
    
    // 利用可能な都市リスト取得テスト
    await testAvailableCities();
    
    console.log('\n✨ すべてのテストが完了しました');
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  }
}

// テスト実行
runTests();