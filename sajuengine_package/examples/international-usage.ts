/**
 * 国際対応モジュールの使用例
 */
import { 
  SajuEngine, 
  InternationalDateTimeProcessor,
  TimeZoneUtils,
  TimeZoneDatabase
} from '../src';

// 1. 国際対応DateTimeProcessor単体での使用例
console.log("=== 国際対応DateTimeProcessor ===");

const dateProcessor = new InternationalDateTimeProcessor({
  useLocalTime: true,
  useDST: true,
  useHistoricalDST: true,
  useStandardTimeZone: true,
  useSecondsPrecision: true
});

// 東京の例
const tokyoDateTime = new Date(2000, 0, 1, 12, 30, 0); // 2000年1月1日12:30
const tokyoResult = dateProcessor.processDateTime(tokyoDateTime, 12.5, '東京');

console.log("東京での時間調整結果:");
console.log(`元の時間: ${tokyoDateTime.toLocaleString('ja-JP')}`);
console.log(`調整後: ${tokyoResult.adjustedDate.year}年${tokyoResult.adjustedDate.month}月${tokyoResult.adjustedDate.day}日 ${tokyoResult.adjustedDate.hour}:${tokyoResult.adjustedDate.minute}`);
console.log(`タイムゾーン: ${tokyoResult.politicalTimeZone}, サマータイム適用: ${tokyoResult.isDST}`);
console.log(`地方時調整: ${tokyoResult.localTimeAdjustment}分`);
console.log(`調整詳細:`, tokyoResult.adjustmentDetails);

// ニューヨークの例
const nyDateTime = new Date(2000, 0, 1, 12, 30, 0); // 2000年1月1日12:30
const nyResult = dateProcessor.processDateTime(nyDateTime, 12.5, 'ニューヨーク');

console.log("\nニューヨークでの時間調整結果:");
console.log(`元の時間: ${nyDateTime.toLocaleString('ja-JP')}`);
console.log(`調整後: ${nyResult.adjustedDate.year}年${nyResult.adjustedDate.month}月${nyResult.adjustedDate.day}日 ${nyResult.adjustedDate.hour}:${nyResult.adjustedDate.minute}`);
console.log(`タイムゾーン: ${nyResult.politicalTimeZone}, サマータイム適用: ${nyResult.isDST}`);
console.log(`地方時調整: ${nyResult.localTimeAdjustment}分`);
console.log(`調整詳細:`, nyResult.adjustmentDetails);

// 2. TimeZoneUtils単体での使用例
console.log("\n=== TimeZoneUtils ===");
console.log("東京のタイムゾーン識別子:", TimeZoneUtils.getTimezoneIdentifier(35.6895, 139.6917));
console.log("ニューヨークのタイムゾーン識別子:", TimeZoneUtils.getTimezoneIdentifier(40.7128, -74.0060));

const winterDate = new Date(2000, 0, 1); // 冬時間
const summerDate = new Date(2000, 6, 1); // 夏時間

console.log("東京のタイムゾーンオフセット:", TimeZoneUtils.getTimezoneOffset(winterDate, 'Asia/Tokyo'), "分");
console.log("ニューヨークの冬時間オフセット:", TimeZoneUtils.getTimezoneOffset(winterDate, 'America/New_York'), "分");
console.log("ニューヨークの夏時間オフセット:", TimeZoneUtils.getTimezoneOffset(summerDate, 'America/New_York'), "分");

console.log("ニューヨークの冬時間サマータイム状態:", TimeZoneUtils.isDST(winterDate, 'America/New_York'));
console.log("ニューヨークの夏時間サマータイム状態:", TimeZoneUtils.isDST(summerDate, 'America/New_York'));

// 歴史的サマータイム
const historicalDSTDate = new Date(1948, 5, 1); // 1948年6月1日
console.log("1948年6月1日は日本の歴史的サマータイム期間か:", TimeZoneUtils.isJapaneseHistoricalDST(historicalDSTDate));

// 3. TimeZoneDatabase単体での使用例
console.log("\n=== TimeZoneDatabase ===");
const tzDb = new TimeZoneDatabase();

// 都市検索
const tokyo = tzDb.findCity('東京');
console.log("東京の都市データ:", tokyo);

// スマート検索
const results = tzDb.smartSearch('New York America');
console.log("「New York America」の検索結果:", results.map(r => r.name));

// 最も近い都市検索
const nearest = tzDb.findNearestCity(139.8, 35.7);
console.log("座標(139.8, 35.7)に最も近い都市:", nearest?.name);

// 4. SajuEngineと組み合わせた例
console.log("\n=== SajuEngineでの国際対応 ===");

// 国際対応のオプションを設定
const sajuEngine = new SajuEngine({
  useLocalTime: true,
  useDST: true,
  useHistoricalDST: true,
  useStandardTimeZone: true
});

// 東京での計算
const tokyoBirthDate = new Date(1986, 4, 26, 5, 0); // 1986年5月26日 5:00
const tokyoSajuResult = sajuEngine.calculate(
  tokyoBirthDate, 
  5,
  'M',
  '東京'
);

console.log("東京での四柱:");
console.log(`年柱: ${tokyoSajuResult.fourPillars.yearPillar.fullStemBranch}`);
console.log(`月柱: ${tokyoSajuResult.fourPillars.monthPillar.fullStemBranch}`);
console.log(`日柱: ${tokyoSajuResult.fourPillars.dayPillar.fullStemBranch}`);
console.log(`時柱: ${tokyoSajuResult.fourPillars.hourPillar.fullStemBranch}`);

// ニューヨークでの計算（同じ現地時間）
const nyBirthDate = new Date(1986, 4, 26, 5, 0); // 1986年5月26日 5:00
const nySajuResult = sajuEngine.calculate(
  nyBirthDate, 
  5,
  'M',
  'ニューヨーク'
);

console.log("\nニューヨークでの四柱:");
console.log(`年柱: ${nySajuResult.fourPillars.yearPillar.fullStemBranch}`);
console.log(`月柱: ${nySajuResult.fourPillars.monthPillar.fullStemBranch}`);
console.log(`日柱: ${nySajuResult.fourPillars.dayPillar.fullStemBranch}`);
console.log(`時柱: ${nySajuResult.fourPillars.hourPillar.fullStemBranch}`);

// 地方時の経度による影響
console.log("\n異なる経度での時柱の変化:");
const longitudes = [120, 135, 150];
for (const longitude of longitudes) {
  const result = sajuEngine.calculate(
    new Date(1986, 4, 26, 5, 0),
    5,
    'M',
    { coordinates: { longitude, latitude: 35 } }
  );
  console.log(`経度${longitude}度: 時柱=${result.fourPillars.hourPillar.fullStemBranch}, 調整=${result.processedDateTime.localTimeAdjustment}分`);
}