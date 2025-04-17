/**
 * SajuProfile API エンドポイントのテストスクリプト
 * このスクリプトは、新しく追加された座標情報・都市情報に関する
 * APIエンドポイントをテストします。
 */

const axios = require('axios');

// サーバーのベースURL
const baseUrl = 'http://localhost:8080';
// APIのベースパス
const apiBasePath = '/api/v1';
// テスト対象のパス
const apiPath = `${apiBasePath}/saju-profiles`;

// テスト対象の都市名
const testCities = ['東京', '大阪', 'ソウル', '北京'];

// 認証ヘッダー
const authToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjcxMTE1MjM1YTZjNjE0NTRlZmRlZGM0NWE3N2U0MzUxMzY3ZWViZTAiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiVGF0c3V5YSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9zeXMtNzY2MTQxMTI3NjI0Mzg0ODY0MjAwNDQ1ODQiLCJhdWQiOiJzeXMtNzY2MTQxMTI3NjI0Mzg0ODY0MjAwNDQ1ODQiLCJhdXRoX3RpbWUiOjE3NDQwMjM2NTYsInVzZXJfaWQiOiJCczJNYWNMdEsxWjFmVm5hdTJkWVBwc1dScGEyIiwic3ViIjoiQnMyTWFjTHRLMVoxZlZuYXUyZFlQcHNXUnBhMiIsImlhdCI6MTc0NDAyMzY1NiwiZXhwIjoxNzQ0MDI3MjU2LCJlbWFpbCI6InNoaXJhaXNoaS50YXRzdXlhQG1pa290by5jby5qcCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJzaGlyYWlzaGkudGF0c3V5YUBtaWtvdG8uY28uanAiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.QC7NExatcQaS5b-f4dC16XD3aqYrjDAMomXf7vY1XVC6ybSLgohhmay-wvnnoTOKrHF-oGCAlQbFT3yZ0ET960uKQ_gjUJytyVFypjPessQFc51zq_pyHsYBgG94xiTB8EVYl466w2euwdndmSQlmrkjLm_KMAwP3N5QMZYYPN7uFwJZnU1vlux1478z481-A9gZNjiK7kJpeVToqHlNwLCkyov4k9tRycyKpGZW0JcOX8M8q289VYWpGO7P7ECID_yHTRIEv_7SUCgEzjFftjUcRkdJ0lEuNB6UxTVw9F7dhIzpGkkWM7i9iDkdjb7mclZbbspkLcz16Flmz3oIMQ';

// 使い方
async function showUsage() {
  console.log('SajuProfile API エンドポイントテストスクリプト');
  console.log('--------------------------------------------------------');
  console.log('利用可能なコマンド:');
  console.log('  cities      - 利用可能な都市リストを取得');
  console.log('  coordinates - 特定の都市の座標を取得');
  console.log('  offset      - 座標から地方時オフセットを計算');
  console.log('  all         - 全てのエンドポイントをテスト');
  console.log('');
  console.log('使用例:');
  console.log('  node test-saju-endpoints.js cities');
  console.log('  node test-saju-endpoints.js coordinates 東京');
  console.log('  node test-saju-endpoints.js offset 139.6917 35.6895');
  console.log('  node test-saju-endpoints.js all');
  console.log('--------------------------------------------------------');
}

// 都市リストの取得
async function getAvailableCities() {
  console.log('利用可能な都市リストを取得しています...');
  try {
    const response = await axios.get(`${baseUrl}${apiPath}/available-cities`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('成功!');
    console.log(`都市数: ${response.data.cities.length}`);
    console.log('都市サンプル:');
    console.log(response.data.cities.slice(0, 10));
    return response.data.cities;
  } catch (error) {
    console.error('エラー:', error.response ? error.response.data : error.message);
    return null;
  }
}

// 都市の座標を取得
async function getCityCoordinates(cityName) {
  console.log(`都市『${cityName}』の座標を取得しています...`);
  try {
    const response = await axios.get(`${baseUrl}${apiPath}/city-coordinates/${encodeURIComponent(cityName)}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('成功!');
    console.log('座標情報:');
    console.log(response.data);
    return response.data.coordinates;
  } catch (error) {
    console.error('エラー:', error.response ? error.response.data : error.message);
    return null;
  }
}

// 地方時オフセットの計算
async function calculateLocalTimeOffset(longitude, latitude) {
  console.log(`座標 [経度=${longitude}, 緯度=${latitude}] の地方時オフセットを計算しています...`);
  try {
    const response = await axios.post(`${baseUrl}${apiPath}/local-time-offset`, 
      {
        coordinates: {
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude)
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('成功!');
    console.log('オフセット情報:');
    console.log(response.data);
    return response.data.offsetMinutes;
  } catch (error) {
    console.error('エラー:', error.response ? error.response.data : error.message);
    return null;
  }
}

// 全てのエンドポイントをテスト
async function testAll() {
  console.log('全てのエンドポイントをテストします...');
  console.log('----------------------------------------');
  
  // 1. 都市リストの取得
  const cities = await getAvailableCities();
  console.log('----------------------------------------');
  
  // 2. 各テスト都市の座標を取得
  for (const city of testCities) {
    const coordinates = await getCityCoordinates(city);
    console.log('----------------------------------------');
    
    // 3. 取得した座標から地方時オフセットを計算
    if (coordinates) {
      await calculateLocalTimeOffset(coordinates.longitude, coordinates.latitude);
      console.log('----------------------------------------');
    }
  }
  
  console.log('全てのテストが完了しました!');
}

// メイン関数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help') {
    await showUsage();
    return;
  }
  
  // サーバーの応答をチェック
  try {
    await axios.get(`${baseUrl}${apiBasePath}/status`);
  } catch (error) {
    console.error(`エラー: サーバー ${baseUrl} に接続できません`);
    console.error('サーバーが起動していることを確認してください');
    return;
  }
  
  // コマンドに応じてAPIをテスト
  switch (command) {
    case 'cities':
      await getAvailableCities();
      break;
    case 'coordinates':
      if (!args[1]) {
        console.error('エラー: 都市名を指定してください');
        await showUsage();
        return;
      }
      await getCityCoordinates(args[1]);
      break;
    case 'offset':
      if (!args[1] || !args[2]) {
        console.error('エラー: 経度と緯度を指定してください');
        await showUsage();
        return;
      }
      await calculateLocalTimeOffset(args[1], args[2]);
      break;
    case 'all':
      await testAll();
      break;
    default:
      console.error(`エラー: 不明なコマンド "${command}"`);
      await showUsage();
  }
}

// スクリプト実行
main().catch(error => {
  console.error('予期せぬエラーが発生しました:', error);
  process.exit(1);
});