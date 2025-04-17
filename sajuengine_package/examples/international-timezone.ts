/**
 * 国際対応タイムゾーン機能のサンプル
 */
import { SajuEngine } from '../src/SajuEngine';

// 1. 通常の四柱推命計算（東京）
console.log('=== 東京での四柱推命計算 ===');
const engine = new SajuEngine();

// 1986年5月5日午前2時25分（東京）
const birthDateTokyo = new Date(1986, 4, 5, 2, 25);

// 東京での計算
const resultTokyo = engine.calculate(
  birthDateTokyo,
  2.42, // 2時25分 = 2 + 25/60 = 2.42
  'M',  // 男性
  'Tokyo' // 東京
);

// 結果の出力
console.log(`東京での計算結果:`);
console.log(`日時: ${birthDateTokyo.toLocaleString('ja-JP')}`);
console.log(`調整日時: ${resultTokyo.processedDateTime.adjustedDate.year}年${resultTokyo.processedDateTime.adjustedDate.month}月${resultTokyo.processedDateTime.adjustedDate.day}日 ${resultTokyo.processedDateTime.adjustedDate.hour}時${resultTokyo.processedDateTime.adjustedDate.minute}分`);
console.log(`四柱: ${resultTokyo.fourPillars.yearPillar.fullStemBranch} ${resultTokyo.fourPillars.monthPillar.fullStemBranch} ${resultTokyo.fourPillars.dayPillar.fullStemBranch} ${resultTokyo.fourPillars.hourPillar.fullStemBranch}`);
console.log(`タイムゾーン: ${resultTokyo.timezoneInfo?.politicalTimeZone}`);
console.log(`地方時調整: ${resultTokyo.timezoneInfo?.adjustmentDetails?.totalAdjustmentMinutes}分`);
console.log();

// 2. ニューヨークでの四柱推命計算
console.log('=== ニューヨークでの四柱推命計算 ===');

// 1986年5月4日午後1時25分（ニューヨーク現地時間）
const birthDateNY = new Date(1986, 4, 4, 13, 25);

// ニューヨークでの計算
const resultNY = engine.calculate(
  birthDateNY,
  13.42, // 13時25分 = 13 + 25/60 = 13.42
  'M',
  'New York'
);

// 結果の出力
console.log(`ニューヨークでの計算結果:`);
console.log(`日時: ${birthDateNY.toLocaleString('en-US')}`);
console.log(`調整日時: ${resultNY.processedDateTime.adjustedDate.year}年${resultNY.processedDateTime.adjustedDate.month}月${resultNY.processedDateTime.adjustedDate.day}日 ${resultNY.processedDateTime.adjustedDate.hour}時${resultNY.processedDateTime.adjustedDate.minute}分`);
console.log(`四柱: ${resultNY.fourPillars.yearPillar.fullStemBranch} ${resultNY.fourPillars.monthPillar.fullStemBranch} ${resultNY.fourPillars.dayPillar.fullStemBranch} ${resultNY.fourPillars.hourPillar.fullStemBranch}`);
console.log(`タイムゾーン: ${resultNY.timezoneInfo?.politicalTimeZone}`);
console.log(`地方時調整: ${resultNY.timezoneInfo?.adjustmentDetails?.totalAdjustmentMinutes}分`);
console.log(`サマータイム適用: ${resultNY.timezoneInfo?.isDST ? 'あり' : 'なし'}`);
console.log();

// 3. ロンドンでの四柱推命計算
console.log('=== ロンドンでの四柱推命計算 ===');

// 1986年5月4日午後6時25分（ロンドン現地時間）
const birthDateLondon = new Date(1986, 4, 4, 18, 25);

// ロンドンでの計算
const resultLondon = engine.calculate(
  birthDateLondon,
  18.42, // 18時25分
  'M',
  'London'
);

// 結果の出力
console.log(`ロンドンでの計算結果:`);
console.log(`日時: ${birthDateLondon.toLocaleString('en-GB')}`);
console.log(`調整日時: ${resultLondon.processedDateTime.adjustedDate.year}年${resultLondon.processedDateTime.adjustedDate.month}月${resultLondon.processedDateTime.adjustedDate.day}日 ${resultLondon.processedDateTime.adjustedDate.hour}時${resultLondon.processedDateTime.adjustedDate.minute}分`);
console.log(`四柱: ${resultLondon.fourPillars.yearPillar.fullStemBranch} ${resultLondon.fourPillars.monthPillar.fullStemBranch} ${resultLondon.fourPillars.dayPillar.fullStemBranch} ${resultLondon.fourPillars.hourPillar.fullStemBranch}`);
console.log(`タイムゾーン: ${resultLondon.timezoneInfo?.politicalTimeZone}`);
console.log(`地方時調整: ${resultLondon.timezoneInfo?.adjustmentDetails?.totalAdjustmentMinutes}分`);
console.log(`サマータイム適用: ${resultLondon.timezoneInfo?.isDST ? 'あり' : 'なし'}`);
console.log();

// 4. 秒単位の精度の検証
console.log('=== 秒単位の精度検証 ===');

// 2000年1月1日0時0分0秒（正確に立春の瞬間だと仮定）
const preciseDate = new Date(2000, 0, 1, 0, 0, 0);

// デフォルトで秒単位の精度が有効
const resultPrecise = engine.calculate(
  preciseDate,
  0,
  'M',
  'Tokyo'
);

console.log(`秒単位精度での計算結果:`);
console.log(`日時: ${preciseDate.toLocaleString('ja-JP')}`);
// 秒情報は型定義では任意なのでキャストして取得
const adjustedDateWithSeconds = resultPrecise.processedDateTime.adjustedDate as any;
console.log(`調整日時: ${adjustedDateWithSeconds.year}年${adjustedDateWithSeconds.month}月${adjustedDateWithSeconds.day}日 ${adjustedDateWithSeconds.hour}時${adjustedDateWithSeconds.minute}分${adjustedDateWithSeconds.second || 0}秒`);
console.log(`四柱: ${resultPrecise.fourPillars.yearPillar.fullStemBranch} ${resultPrecise.fourPillars.monthPillar.fullStemBranch} ${resultPrecise.fourPillars.dayPillar.fullStemBranch} ${resultPrecise.fourPillars.hourPillar.fullStemBranch}`);

// 秒単位の精度を無効化
engine.updateOptions({ useSecondsPrecision: false });
const resultWithoutSeconds = engine.calculate(
  preciseDate,
  0,
  'M',
  'Tokyo'
);

console.log(`分単位精度での計算結果:`);
console.log(`日時: ${preciseDate.toLocaleString('ja-JP')}`);
console.log(`調整日時: ${resultWithoutSeconds.processedDateTime.adjustedDate.year}年${resultWithoutSeconds.processedDateTime.adjustedDate.month}月${resultWithoutSeconds.processedDateTime.adjustedDate.day}日 ${resultWithoutSeconds.processedDateTime.adjustedDate.hour}時${resultWithoutSeconds.processedDateTime.adjustedDate.minute}分`);
console.log(`四柱: ${resultWithoutSeconds.fourPillars.yearPillar.fullStemBranch} ${resultWithoutSeconds.fourPillars.monthPillar.fullStemBranch} ${resultWithoutSeconds.fourPillars.dayPillar.fullStemBranch} ${resultWithoutSeconds.fourPillars.hourPillar.fullStemBranch}`);
console.log();

// 5. 拡張座標・ロケーション情報の検証
console.log('=== 拡張ロケーション情報の検証 ===');

// 拡張ロケーション情報を使用
const extendedLocation = {
  name: 'パリ',
  country: 'フランス',
  coordinates: {
    longitude: 2.3522,
    latitude: 48.8566
  },
  timeZone: 'Europe/Paris'
};

const resultParis = engine.calculate(
  new Date(1986, 4, 5, 10, 0),
  10,
  'F',
  extendedLocation
);

console.log(`拡張ロケーション情報での計算結果:`);
console.log(`場所: ${resultParis.location?.name}, ${resultParis.location?.country}`);
// 座標情報を文字列化して表示すると、undefinedになるケースがあるので、条件分岐で処理
if (resultParis.location?.coordinates) {
  console.log(`座標: 経度${resultParis.location.coordinates.longitude}, 緯度${resultParis.location.coordinates.latitude}`);
} else {
  console.log('座標: 取得できませんでした');
}
console.log(`タイムゾーン: ${resultParis.location?.timeZone}`);
console.log(`調整日時: ${resultParis.processedDateTime.adjustedDate.year}年${resultParis.processedDateTime.adjustedDate.month}月${resultParis.processedDateTime.adjustedDate.day}日 ${resultParis.processedDateTime.adjustedDate.hour}時${resultParis.processedDateTime.adjustedDate.minute}分`);
console.log(`四柱: ${resultParis.fourPillars.yearPillar.fullStemBranch} ${resultParis.fourPillars.monthPillar.fullStemBranch} ${resultParis.fourPillars.dayPillar.fullStemBranch} ${resultParis.fourPillars.hourPillar.fullStemBranch}`);
console.log();

// 6. 日本の歴史的サマータイム (1948-1951)
console.log('=== 日本の歴史的サマータイム検証 ===');

// 1950年6月15日（日本の歴史的サマータイム期間中）
const historicalDSTDate = new Date(1950, 5, 15, 12, 0);

// 歴史的サマータイムを有効化
engine.updateOptions({ useHistoricalDST: true });
const resultHistoricalDST = engine.calculate(
  historicalDSTDate,
  12,
  'M',
  'Tokyo'
);

console.log(`歴史的サマータイム有効での計算結果:`);
console.log(`日時: 1950年6月15日12時00分（東京）`);
console.log(`調整日時: ${resultHistoricalDST.processedDateTime.adjustedDate.year}年${resultHistoricalDST.processedDateTime.adjustedDate.month}月${resultHistoricalDST.processedDateTime.adjustedDate.day}日 ${resultHistoricalDST.processedDateTime.adjustedDate.hour}時${resultHistoricalDST.processedDateTime.adjustedDate.minute}分`);
console.log(`サマータイム適用: ${resultHistoricalDST.timezoneInfo?.isDST ? 'あり' : 'なし'}`);
console.log(`サマータイム調整: ${resultHistoricalDST.timezoneInfo?.adjustmentDetails?.dstAdjustment}分`);
console.log(`四柱: ${resultHistoricalDST.fourPillars.yearPillar.fullStemBranch} ${resultHistoricalDST.fourPillars.monthPillar.fullStemBranch} ${resultHistoricalDST.fourPillars.dayPillar.fullStemBranch} ${resultHistoricalDST.fourPillars.hourPillar.fullStemBranch}`);

// 歴史的サマータイムを無効化
engine.updateOptions({ useHistoricalDST: false });
const resultWithoutHistoricalDST = engine.calculate(
  historicalDSTDate,
  12,
  'M',
  'Tokyo'
);

console.log(`歴史的サマータイム無効での計算結果:`);
console.log(`日時: 1950年6月15日12時00分（東京）`);
console.log(`調整日時: ${resultWithoutHistoricalDST.processedDateTime.adjustedDate.year}年${resultWithoutHistoricalDST.processedDateTime.adjustedDate.month}月${resultWithoutHistoricalDST.processedDateTime.adjustedDate.day}日 ${resultWithoutHistoricalDST.processedDateTime.adjustedDate.hour}時${resultWithoutHistoricalDST.processedDateTime.adjustedDate.minute}分`);
console.log(`サマータイム適用: ${resultWithoutHistoricalDST.timezoneInfo?.isDST ? 'あり' : 'なし'}`);
console.log(`サマータイム調整: ${resultWithoutHistoricalDST.timezoneInfo?.adjustmentDetails?.dstAdjustment}分`);
console.log(`四柱: ${resultWithoutHistoricalDST.fourPillars.yearPillar.fullStemBranch} ${resultWithoutHistoricalDST.fourPillars.monthPillar.fullStemBranch} ${resultWithoutHistoricalDST.fourPillars.dayPillar.fullStemBranch} ${resultWithoutHistoricalDST.fourPillars.hourPillar.fullStemBranch}`);