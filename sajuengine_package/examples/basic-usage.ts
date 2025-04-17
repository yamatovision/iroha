// 基本的な使用例
import { SajuEngine, SajuOptions, ExtendedLocation } from '../src';

// 四柱推命エンジンの初期化 (デフォルトで国際モード有効)
const sajuEngine = new SajuEngine();

// 生年月日と時間から四柱推命情報を計算
const birthDate = new Date(1990, 0, 15); // 1990年1月15日
const birthHour = 13; // 13時 (午後1時)
const gender = 'M'; // 'M'=男性, 'F'=女性
const location = 'Tokyo, Japan'; // 位置情報（都市名または経度・緯度）

// 四柱推命情報を計算
const result = sajuEngine.calculate(birthDate, birthHour, gender, location);

// 結果を表示
console.log('====== 四柱推命計算結果 ======');
console.log('生年月日時:', birthDate.toLocaleString(), birthHour + '時');
console.log('場所:', location);

// 四柱（年月日時の天干地支）
console.log('\n【四柱】');
console.log('年柱:', `${result.fourPillars.yearPillar.stem}${result.fourPillars.yearPillar.branch}`);
console.log('月柱:', `${result.fourPillars.monthPillar.stem}${result.fourPillars.monthPillar.branch}`);
console.log('日柱:', `${result.fourPillars.dayPillar.stem}${result.fourPillars.dayPillar.branch}`);
console.log('時柱:', `${result.fourPillars.hourPillar.stem}${result.fourPillars.hourPillar.branch}`);

// 十神関係
console.log('\n【十神関係】');
console.log('年柱天干:', result.tenGods.year);
console.log('月柱天干:', result.tenGods.month);
console.log('日柱天干:', result.tenGods.day); // 本命
console.log('時柱天干:', result.tenGods.hour);

// 地支の十神関係
console.log('\n【地支の十神関係】');
console.log('年柱地支:', result.fourPillars.yearPillar.branchTenGod);
console.log('月柱地支:', result.fourPillars.monthPillar.branchTenGod);
console.log('日柱地支:', result.fourPillars.dayPillar.branchTenGod);
console.log('時柱地支:', result.fourPillars.hourPillar.branchTenGod);

// 五行プロファイル
console.log('\n【五行プロファイル】');
console.log('主要属性:', result.elementProfile.mainElement);
console.log('副次属性:', result.elementProfile.secondaryElement);
console.log('陰陽:', result.elementProfile.yinYang);

// 十二運星
console.log('\n【十二運星】');
console.log('年柱:', result.twelveFortunes?.year);
console.log('月柱:', result.twelveFortunes?.month);
console.log('日柱:', result.twelveFortunes?.day);
console.log('時柱:', result.twelveFortunes?.hour);

// 十二神殺
console.log('\n【十二神殺】');
console.log('年柱:', result.twelveSpiritKillers?.year || '無し');
console.log('月柱:', result.twelveSpiritKillers?.month || '無し');
console.log('日柱:', result.twelveSpiritKillers?.day || '無し');
console.log('時柱:', result.twelveSpiritKillers?.hour || '無し');

// 国際対応タイムゾーン情報
if (result.timezoneInfo) {
  console.log('\n【タイムゾーン情報】');
  console.log('政治的タイムゾーン:', result.timezoneInfo.politicalTimeZone);
  console.log('サマータイム:', result.timezoneInfo.isDST ? '適用' : '非適用');
  console.log('タイムゾーンオフセット(分):', result.timezoneInfo.timeZoneOffsetMinutes);
  
  if (result.timezoneInfo.adjustmentDetails) {
    console.log('\n【時差調整詳細】');
    console.log('政治的タイムゾーン調整(分):', result.timezoneInfo.adjustmentDetails.politicalTimeZoneAdjustment);
    console.log('経度ベース調整(分):', result.timezoneInfo.adjustmentDetails.longitudeBasedAdjustment);
    console.log('DST調整(分):', result.timezoneInfo.adjustmentDetails.dstAdjustment);
    console.log('地域調整(分):', result.timezoneInfo.adjustmentDetails.regionalAdjustment);
    console.log('合計調整(分):', result.timezoneInfo.adjustmentDetails.totalAdjustmentMinutes);
  }
}

// ロケーション情報
if (result.location) {
  console.log('\n【ロケーション情報】');
  if (result.location.name) {
    console.log('都市名:', result.location.name);
  }
  if (result.location.country) {
    console.log('国:', result.location.country);
  }
  if (result.location.coordinates) {
    console.log('座標:', `経度: ${result.location.coordinates.longitude}, 緯度: ${result.location.coordinates.latitude}`);
  }
  if (result.location.timeZone) {
    console.log('タイムゾーン:', result.location.timeZone);
  }
}

// 現在の四柱推命情報も取得
console.log('\n====== 現在の四柱推命情報 ======');
const currentSaju = sajuEngine.getCurrentSaju();
console.log(`現在の四柱: ${currentSaju.fourPillars.yearPillar.stem}${currentSaju.fourPillars.yearPillar.branch} ${currentSaju.fourPillars.monthPillar.stem}${currentSaju.fourPillars.monthPillar.branch} ${currentSaju.fourPillars.dayPillar.stem}${currentSaju.fourPillars.dayPillar.branch} ${currentSaju.fourPillars.hourPillar.stem}${currentSaju.fourPillars.hourPillar.branch}`);

// 国際対応モードの例
console.log('\n====== 国際対応モードの例 ======');

// さまざまな都市での出生例
const internationalExamples = [
  {
    name: 'ニューヨーク',
    birthDate: new Date('1985-04-15T14:30:00'),
    gender: 'M' as const,
    location: 'New York, USA'
  },
  {
    name: 'ロンドン',
    birthDate: new Date('1990-07-22T08:15:00'),
    gender: 'F' as const,
    location: 'London, UK'
  },
  {
    name: 'パリ（座標指定）',
    birthDate: new Date('1978-12-10T22:45:00'),
    gender: 'M' as const,
    location: {
      longitude: 2.3522,
      latitude: 48.8566,
      timeZone: 'Europe/Paris'
    }
  },
  {
    name: 'ベルリン（拡張ロケーション）',
    birthDate: new Date('1995-02-28T03:20:00'),
    gender: 'F' as const,
    location: {
      name: 'Berlin',
      country: 'Germany',
      coordinates: {
        longitude: 13.4050,
        latitude: 52.5200
      },
      timeZone: 'Europe/Berlin'
    } as ExtendedLocation
  }
];

// 各国際出生例の計算
internationalExamples.forEach(example => {
  console.log(`\n----- ${example.name}での出生 -----`);
  
  // 時間計算（時間.分）
  const hourWithMinutes = example.birthDate.getHours() + (example.birthDate.getMinutes() / 60);
  
  // 計算実行
  const result = sajuEngine.calculate(example.birthDate, hourWithMinutes, example.gender, example.location);
  
  // 四柱を表示
  console.log('四柱:');
  console.log(`  年柱: ${result.fourPillars.yearPillar.stem}${result.fourPillars.yearPillar.branch}`);
  console.log(`  月柱: ${result.fourPillars.monthPillar.stem}${result.fourPillars.monthPillar.branch}`);
  console.log(`  日柱: ${result.fourPillars.dayPillar.stem}${result.fourPillars.dayPillar.branch}`);
  console.log(`  時柱: ${result.fourPillars.hourPillar.stem}${result.fourPillars.hourPillar.branch}`);
  
  // タイムゾーン情報
  if (result.timezoneInfo && result.timezoneInfo.politicalTimeZone) {
    console.log(`タイムゾーン: ${result.timezoneInfo.politicalTimeZone}`);
  }
});