/**
 * 四柱推命プロフィールAPIのテストスクリプト
 * 地方時調整機能を含むエンドポイントのテスト
 * 
 * 使用方法: 
 * node scripts/test-saju-profile-api.js
 */

// 環境変数読み込み
require('dotenv').config();

// モジュールのインポート
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// トークン取得ツールのインポート
const { getToken } = require('./get-token');

// APIの基本URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';

// テスト結果保存ディレクトリ
const LOG_DIR = path.join(__dirname, '..', '..', 'logs', 'tests');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// メインの実行関数
async function main() {
  console.log('四柱推命プロフィールAPIテストの実行を開始します...\n');

  // 認証トークンの取得
  let authToken = null;
  try {
    // 認証情報(テスト用)
    const email = process.env.TEST_EMAIL || 'shiraishi.tatsuya@mikoto.co.jp';
    const password = process.env.TEST_PASSWORD || 'aikakumei';
    
    // get-token.jsの関数を使用してトークンを取得
    authToken = await getToken(email, password);
    console.log('認証トークンを取得しました。\n');
  } catch (error) {
    console.error('認証トークンの取得に失敗しました:', error.message);
    process.exit(1);
  }
  
  // Axiosインスタンスを設定
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  // テスト結果を保存するオブジェクト
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };
  
  // テスト関数
  async function runTest(testName, testFn) {
    testResults.summary.total++;
    console.log(`\n実行中: ${testName}`);
    
    const testResult = {
      name: testName,
      status: 'PASSED',
      error: null,
      response: null
    };
    
    try {
      const result = await testFn();
      testResult.response = result;
      testResults.summary.passed++;
      console.log(`✅ ${testName}: 成功`);
    } catch (error) {
      testResult.status = 'FAILED';
      testResult.error = {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      };
      testResults.summary.failed++;
      console.log(`❌ ${testName}: 失敗`);
      console.error(`   エラー: ${error.message}`);
      if (error.response) {
        console.error(`   ステータス: ${error.response.status}`);
        console.error(`   レスポンス: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    testResults.tests.push(testResult);
  }
  
  try {
    // テスト1: 利用可能な都市の取得
    await runTest('利用可能な都市の取得', async () => {
      const response = await api.get('/saju-profiles/available-cities');
      console.log(`   都市数: ${response.data.cities.length}`);
      console.log(`   一部の都市: ${response.data.cities.slice(0, 5).join(', ')}...`);
      
      if (!response.data.cities || !Array.isArray(response.data.cities)) {
        throw new Error('cities配列が返されていません');
      }
      
      return response.data;
    });
    
    // テスト2: 都市の座標情報の取得
    await runTest('都市の座標情報の取得（東京）', async () => {
      const response = await api.get('/saju-profiles/city-coordinates/東京');
      console.log(`   座標: 経度 ${response.data.coordinates.longitude}°, 緯度 ${response.data.coordinates.latitude}°`);
      
      if (!response.data.coordinates || !response.data.coordinates.longitude || !response.data.coordinates.latitude) {
        throw new Error('有効な座標情報が返されていません');
      }
      
      return response.data;
    });
    
    // テスト3: 地方時オフセットの計算
    await runTest('地方時オフセットの計算', async () => {
      const coordinates = {
        longitude: 139.6917,
        latitude: 35.6895
      };
      
      const response = await api.post('/saju-profiles/local-time-offset', { coordinates });
      console.log(`   地方時オフセット: ${response.data.offsetMinutes} 分`);
      
      if (typeof response.data.offsetMinutes !== 'number') {
        throw new Error('有効な地方時オフセットが返されていません');
      }
      
      return response.data;
    });
    
    // テスト4: 四柱推命プロフィールの作成 (地方時調整あり)
    await runTest('四柱推命プロフィールの作成 (地方時調整あり)', async () => {
      const profileData = {
        birthDate: '1986-11-15', // 1986年11月15日
        birthTime: '12:30', // 12時30分
        birthPlace: '東京',
        birthplaceCoordinates: {
          longitude: 139.6917,
          latitude: 35.6895
        },
        gender: 'M'
      };
      
      const response = await api.post('/saju-profiles', profileData);
      console.log(`   プロフィールID: ${response.data.profile.id || response.data.profile._id}`);
      console.log(`   地方時オフセット: ${response.data.profile.localTimeOffset} 分`);
      console.log(`   四柱: ${JSON.stringify(response.data.profile.fourPillars)}`);
      
      if (!response.data.profile) {
        throw new Error('有効なプロフィールが返されていません');
      }
      
      return response.data;
    });
    
    // テスト5: 異なる場所での四柱推命プロフィールの比較
    await runTest('異なる場所での四柱推命プロフィールの比較', async () => {
      // 東京のプロフィール
      const tokyo = {
        birthDate: '1986-11-15',
        birthTime: '12:30',
        birthPlace: '東京',
        birthplaceCoordinates: {
          longitude: 139.6917,
          latitude: 35.6895
        },
        gender: 'M'
      };
      
      // ソウルのプロフィール（同じ時刻）
      const seoul = {
        birthDate: '1986-11-15',
        birthTime: '12:30',
        birthPlace: 'ソウル',
        birthplaceCoordinates: {
          longitude: 126.9780,
          latitude: 37.5665
        },
        gender: 'M'
      };
      
      // 2つのAPIリクエストを並行して実行
      const [tokyoResponse, seoulResponse] = await Promise.all([
        api.post('/saju-profiles/calculate', tokyo),
        api.post('/saju-profiles/calculate', seoul)
      ]);
      
      console.log('   東京プロフィール:');
      console.log(`     地方時オフセット: ${tokyoResponse.data.localTimeOffset} 分`);
      console.log(`     四柱: ${JSON.stringify(tokyoResponse.data.fourPillars)}`);
      
      console.log('   ソウルプロフィール:');
      console.log(`     地方時オフセット: ${seoulResponse.data.localTimeOffset} 分`);
      console.log(`     四柱: ${JSON.stringify(seoulResponse.data.fourPillars)}`);
      
      // 結果を比較
      const tokyoPillars = tokyoResponse.data.fourPillars;
      const seoulPillars = seoulResponse.data.fourPillars;
      
      const hasDifference = 
        tokyoPillars.yearPillar.stem !== seoulPillars.yearPillar.stem ||
        tokyoPillars.yearPillar.branch !== seoulPillars.yearPillar.branch ||
        tokyoPillars.monthPillar.stem !== seoulPillars.monthPillar.stem ||
        tokyoPillars.monthPillar.branch !== seoulPillars.monthPillar.branch ||
        tokyoPillars.dayPillar.stem !== seoulPillars.dayPillar.stem ||
        tokyoPillars.dayPillar.branch !== seoulPillars.dayPillar.branch ||
        tokyoPillars.hourPillar.stem !== seoulPillars.hourPillar.stem ||
        tokyoPillars.hourPillar.branch !== seoulPillars.hourPillar.branch;
      
      console.log(`   四柱の違い: ${hasDifference ? 'あり' : 'なし'}`);
      
      return {
        tokyo: tokyoResponse.data,
        seoul: seoulResponse.data,
        hasDifference
      };
    });
    
    // テスト結果のサマリーを表示
    console.log('\n===== テスト結果サマリー =====');
    console.log(`合計: ${testResults.summary.total} テスト`);
    console.log(`成功: ${testResults.summary.passed} テスト`);
    console.log(`失敗: ${testResults.summary.failed} テスト`);
    
    // ログファイルに結果を保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const logFilePath = path.join(LOG_DIR, `saju-profile-api_${timestamp}.json`);
    fs.writeFileSync(logFilePath, JSON.stringify(testResults, null, 2));
    console.log(`\nテスト結果を保存しました: ${logFilePath}`);
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main().catch(console.error);