/**
 * SajuProfile 公開APIテストスクリプト
 * 
 * このスクリプトは認証が不要な公開APIエンドポイントをテストします。
 */

const http = require('http');
const url = require('url');

// サーバーのベースURL
const baseUrl = 'http://localhost:8080';
// APIのベースパス
const apiPath = '/api/v1/public/saju';

// 設定
const requestTimeout = 5000; // タイムアウト5秒

/**
 * HTTPリクエストを送信する関数
 * @param {string} method - HTTPメソッド（GET/POST）
 * @param {string} path - リクエストパス
 * @param {object} [data] - POSTリクエストのデータ（オプション）
 * @returns {Promise<object>} - レスポンスオブジェクト
 */
function sendRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(`${baseUrl}${path}`);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        let parsedData;
        try {
          parsedData = JSON.parse(body);
        } catch (e) {
          parsedData = body;
        }
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, data: parsedData });
        } else {
          reject({ statusCode: res.statusCode, data: parsedData });
        }
      });
    });

    req.on('error', (error) => {
      reject({ statusCode: -1, data: error.message });
    });

    req.setTimeout(requestTimeout, () => {
      req.abort();
      reject({ statusCode: 408, data: 'リクエストがタイムアウトしました' });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * 利用可能な都市リストを取得するテスト
 */
async function testGetAvailableCities() {
  console.log('1. 利用可能な都市リストを取得しています...');
  try {
    const response = await sendRequest('GET', `${apiPath}/available-cities`);
    console.log('✅ 成功!');
    console.log(`都市数: ${response.data.cities.length}`);
    console.log('都市サンプル:');
    console.log(response.data.cities.slice(0, 5));
    return response.data.cities;
  } catch (error) {
    console.error('❌ エラー:', error.data || error.message);
    return null;
  }
}

/**
 * 都市の座標を取得するテスト
 * @param {string} cityName - 都市名
 */
async function testGetCityCoordinates(cityName) {
  console.log(`\n2. 都市『${cityName}』の座標を取得しています...`);
  try {
    const encodedCityName = encodeURIComponent(cityName);
    const response = await sendRequest('GET', `${apiPath}/city-coordinates/${encodedCityName}`);
    console.log('✅ 成功!');
    console.log('座標情報:');
    console.log(response.data);
    return response.data.coordinates;
  } catch (error) {
    console.error('❌ エラー:', error.data || error.message);
    return null;
  }
}

/**
 * 地方時オフセットを計算するテスト
 * @param {number} longitude - 経度
 * @param {number} latitude - 緯度
 */
async function testCalculateLocalTimeOffset(longitude, latitude) {
  console.log(`\n3. 座標 [経度=${longitude}, 緯度=${latitude}] の地方時オフセットを計算しています...`);
  try {
    const data = {
      coordinates: {
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude)
      }
    };
    const response = await sendRequest('POST', `${apiPath}/local-time-offset`, data);
    console.log('✅ 成功!');
    console.log('オフセット情報:');
    console.log(response.data);
    return response.data.offsetMinutes;
  } catch (error) {
    console.error('❌ エラー:', error.data || error.message);
    return null;
  }
}

/**
 * メイン関数 - 全てのテストを実行
 */
async function main() {
  console.log('SajuProfile 公開API テスト開始');
  console.log('=======================================');
  
  // サーバーの健全性チェック
  try {
    await sendRequest('GET', '/api/v1/status');
    console.log('サーバー接続OK! テスト開始します...\n');
  } catch (error) {
    console.error('❌ サーバー接続エラー:', error.data || error.message);
    console.error('サーバーが起動していることを確認してください');
    process.exit(1);
  }
  
  // 1. 利用可能な都市リストを取得
  const cities = await testGetAvailableCities();
  
  if (cities && cities.length > 0) {
    // 2. 都市の座標を取得（東京をテスト）
    const tokyo = '東京';
    const coordinates = await testGetCityCoordinates(tokyo);
    
    if (coordinates) {
      // 3. 座標から地方時オフセットを計算
      await testCalculateLocalTimeOffset(coordinates.longitude, coordinates.latitude);
    }
  }
  
  console.log('\nテスト完了!');
}

// スクリプト実行
main().catch(error => {
  console.error('予期せぬエラーが発生しました:', error);
  process.exit(1);
});