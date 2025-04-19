/**
 * test-available-cities.js
 * 
 * available-cities APIをテストするスクリプト
 * 新しい形式（locations, categories）に対応しているかを検証
 */

const axios = require('axios');

// 設定
const API_URL = 'http://localhost:8080/api/v1/day-pillars/available-cities';

// メイン関数
async function testAvailableCitiesAPI() {
  console.log('=== 「利用可能な出生地リスト」APIテスト ===');
  console.log(`URL: ${API_URL}`);
  
  try {
    // APIリクエスト
    console.log('APIリクエスト送信中...');
    const response = await axios.get(API_URL);
    
    // 基本情報
    console.log(`\nステータスコード: ${response.status}`);
    console.log(`レスポンスデータサイズ: ${JSON.stringify(response.data).length} バイト`);
    
    // レスポンス構造チェック
    console.log('\n=== レスポンス構造チェック ===');
    const { count, cities, locations, categories } = response.data;
    
    // countフィールド
    console.log(`count: ${count !== undefined ? '存在する ✓' : '存在しない ✗'}`);
    
    // citiesフィールド（互換性用）
    console.log(`cities: ${cities ? '存在する ✓' : '存在しない ✗'}`);
    if (cities) {
      console.log(`- 要素数: ${cities.length}`);
      console.log(`- サンプル: ${cities.slice(0, 3).join(', ')}${cities.length > 3 ? ', ...' : ''}`);
    }
    
    // locationsフィールド（新形式）
    console.log(`locations: ${locations ? '存在する ✓' : '存在しない ✗'}`);
    if (locations) {
      console.log(`- 要素数: ${locations.length}`);
      if (locations.length > 0) {
        const sample = locations[0];
        console.log('- 構造:');
        console.log(`  - name: ${sample.name !== undefined ? '存在する ✓' : '存在しない ✗'}`);
        console.log(`  - adjustment: ${sample.adjustment !== undefined ? '存在する ✓' : '存在しない ✗'}`);
        console.log(`  - description: ${sample.description !== undefined ? '存在する ✓' : '存在しない ✗'}`);
        console.log(`  - isOverseas: ${sample.isOverseas !== undefined ? '存在する ✓' : '存在しない ✗'}`);
      }
    }
    
    // categoriesフィールド（新形式）
    console.log(`categories: ${categories ? '存在する ✓' : '存在しない ✗'}`);
    if (categories) {
      console.log('- 構造:');
      console.log(`  - prefectures: ${categories.prefectures ? '存在する ✓' : '存在しない ✗'}`);
      if (categories.prefectures) {
        console.log(`    - 要素数: ${categories.prefectures.length}`);
      }
      console.log(`  - overseas: ${categories.overseas ? '存在する ✓' : '存在しない ✗'}`);
      if (categories.overseas) {
        console.log(`    - 要素数: ${categories.overseas.length}`);
      }
    }
    
    // 結論
    console.log('\n=== 結論 ===');
    if (locations && categories) {
      console.log('✅ APIは新形式（locations, categories）に対応しています');
    } else {
      console.log('❌ APIは新形式に対応していません');
      console.log('- 必要なフィールド:');
      console.log(`  - locations: ${locations ? '存在する' : '存在しない'}`);
      console.log(`  - categories: ${categories ? '存在する' : '存在しない'}`);
    }
    
  } catch (error) {
    console.error('\n❌ APIリクエストエラー:');
    if (error.response) {
      // サーバーからのエラーレスポンス
      console.error(`ステータスコード: ${error.response.status}`);
      console.error('レスポンスデータ:', error.response.data);
    } else if (error.request) {
      // リクエストは送信されたがレスポンスを受信しなかった
      console.error('サーバーからの応答がありません。サーバーが起動しているか確認してください。');
    } else {
      // リクエスト設定中にエラーが発生
      console.error('エラーメッセージ:', error.message);
    }
  }
}

// スクリプト実行
testAvailableCitiesAPI();