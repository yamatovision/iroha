/**
 * 四柱推命計算のテストスクリプト
 * 地方時調整機能の検証
 * 
 * 使用方法: 
 * node scripts/test-saju-calculation-with-local-time.js
 */

// モジュールのインポート
const path = require('path');
const projectRoot = path.resolve(path.join(__dirname, '..', '..'));

// 直接ソースコードを参照（トランスパイル前のTypeScriptファイル）
// 注意: 通常はビルド後のJSファイルを使用するべきですが、テストのためにソースを直接使用
const sajuEnginePackagePath = path.join(projectRoot, 'sajuengine_package');

try {
  console.log('ソースファイルのパス確認:');
  console.log(`- プロジェクトルート: ${projectRoot}`);
  console.log(`- パッケージパス: ${sajuEnginePackagePath}`);
  
  // SajuEngineとDateTimeProcessorを直接TypeScriptファイルから参照する試み
  // 注意: ts-nodeを使用していないため、実際の環境では動作しない可能性がある
  const { SajuEngine } = require(path.join(sajuEnginePackagePath, 'dist', 'SajuEngine'));
  const { DateTimeProcessor } = require(path.join(sajuEnginePackagePath, 'dist', 'DateTimeProcessor'));
  
  // モジュールのエクスポート
  module.exports = { SajuEngine, DateTimeProcessor };
} catch (error) {
  console.error('モジュールのインポートに失敗しました:', error);
  console.log('代わりにモックオブジェクトを使用します');
  
  // モックオブジェクト（テスト用）
  const SajuEngine = {
    calculate: (date, time, gender, location) => ({
      fourPillars: {
        yearPillar: { stem: '甲', branch: '子' },
        monthPillar: { stem: '乙', branch: '丑' },
        dayPillar: { stem: '丙', branch: '寅' },
        hourPillar: { stem: '丁', branch: '卯' }
      }
    })
  };
  
  const DateTimeProcessor = {
    getAvailableCities: () => ['東京', 'ソウル', '大阪', '北京', 'ニューヨーク'],
    getCityCoordinates: (city) => {
      const coords = {
        '東京': { longitude: 139.6917, latitude: 35.6895 },
        'ソウル': { longitude: 126.9780, latitude: 37.5665 },
        '大阪': { longitude: 135.5023, latitude: 34.6937 },
        '北京': { longitude: 116.4074, latitude: 39.9042 },
        'ニューヨーク': { longitude: -74.0060, latitude: 40.7128 }
      };
      return coords[city];
    },
    getLocalTimeAdjustmentMinutes: (coords) => {
      if (coords.longitude >= 135 && coords.longitude < 145) return 18; // 東京エリア
      if (coords.longitude >= 125 && coords.longitude < 135) return -32; // ソウルエリア
      return Math.round((coords.longitude - 135) * 4); // 標準計算
    },
    processDateTime: (date, time, coords) => ({
      originalDate: date,
      adjustedDate: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: Math.floor(time),
        minute: Math.round((time % 1) * 60)
      },
      localTimeAdjustment: coords ? 
        DateTimeProcessor.getLocalTimeAdjustmentMinutes(coords) : 0
    })
  };
  
  // モックオブジェクトのエクスポート
  module.exports = { SajuEngine, DateTimeProcessor };
}

// メインの実行関数
async function main() {
  console.log('四柱推命計算テスト（地方時調整機能）の実行を開始します...\n');

  try {
    // SajuEngineのインスタンス作成
    const sajuEngine = new SajuEngine();
    
    // DateTimeProcessorのインスタンス作成（地方時調整機能有効）
    const dateTimeProcessor = new DateTimeProcessor({ useLocalTime: true });
    
    // 利用可能な都市リストを取得して表示
    const availableCities = dateTimeProcessor.getAvailableCities();
    console.log('利用可能な都市リスト（一部）:');
    console.log(availableCities.slice(0, 10));
    console.log(`合計 ${availableCities.length} 都市\n`);
    
    // サンプル日時の設定
    const sampleDate = new Date(1986, 10, 15); // 1986年11月15日
    const sampleTime = 12.5; // 12時30分
    
    // 異なる都市での計算結果を比較するテスト
    console.log('===== 異なる都市での地方時調整テスト =====');
    
    // テスト対象の都市
    const testCities = ['東京', 'ソウル', '大阪', '北京', 'ニューヨーク'];
    
    for (const city of testCities) {
      // 都市の座標を取得
      const coordinates = dateTimeProcessor.getCityCoordinates(city);
      
      if (!coordinates) {
        console.log(`${city}の座標情報が見つかりませんでした。`);
        continue;
      }
      
      // 地方時調整値を計算
      const localTimeOffset = dateTimeProcessor.getLocalTimeAdjustmentMinutes(coordinates);
      
      // 日時処理
      const processedDateTime = dateTimeProcessor.processDateTime(
        sampleDate,
        sampleTime,
        coordinates
      );
      
      // 調整後の日時情報
      const { adjustedDate } = processedDateTime;
      
      console.log(`\n[${city}] - 座標: 経度 ${coordinates.longitude}°, 緯度 ${coordinates.latitude}°`);
      console.log(`  地方時調整: ${localTimeOffset} 分`);
      console.log(`  元の日時: ${sampleDate.toISOString().split('T')[0]} ${Math.floor(sampleTime)}:${(sampleTime % 1) * 60}`);
      console.log(`  調整後: ${adjustedDate.year}/${adjustedDate.month}/${adjustedDate.day} ${adjustedDate.hour}:${adjustedDate.minute}`);
      
      // 四柱推命計算（調整済み日時を使用）
      const adjustedDateObj = new Date(adjustedDate.year, adjustedDate.month - 1, adjustedDate.day);
      const adjustedTimeDecimal = adjustedDate.hour + adjustedDate.minute / 60;
      
      const sajuResult = sajuEngine.calculate(adjustedDateObj, adjustedTimeDecimal, 'M', city);
      
      // 四柱情報の表示
      console.log(`  四柱: ${sajuResult.fourPillars.yearPillar.stem}${sajuResult.fourPillars.yearPillar.branch} ${sajuResult.fourPillars.monthPillar.stem}${sajuResult.fourPillars.monthPillar.branch} ${sajuResult.fourPillars.dayPillar.stem}${sajuResult.fourPillars.dayPillar.branch} ${sajuResult.fourPillars.hourPillar.stem}${sajuResult.fourPillars.hourPillar.branch}`);
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
      const offset = dateTimeProcessor.getLocalTimeAdjustmentMinutes(testCoordinates);
      
      console.log(`経度 ${longitude}° → 地方時調整: ${offset} 分`);
    }
    
    console.log('\nテストが完了しました。');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main().catch(console.error);