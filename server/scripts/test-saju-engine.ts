/**
 * 四柱推命エンジンのテストスクリプト
 * 実際の生年月日データを使用して計算結果を検証する
 */
import path from 'path';
import { SajuEngine } from '../../sajuengine_package/src';

// 四柱推命エンジンの初期化
const sajuEngine = new SajuEngine();

// ユーザーの生年月日情報（1986年5月26日 午前5時、東京）
const birthDate = new Date(1986, 4, 26); // 注: JavaScriptの月は0から始まるので5月は4になる
const birthHour = 5; // 午前5時
const gender = 'M'; // 'M'=男性, 'F'=女性
const location = 'Tokyo'; // 位置情報

// 四柱推命情報を計算
const result = sajuEngine.calculate(birthDate, birthHour, gender, location);

// 結果を表示
console.log('====== 四柱推命計算結果 ======');
console.log('生年月日時:', `${birthDate.getFullYear()}年${birthDate.getMonth() + 1}月${birthDate.getDate()}日 ${birthHour}時`);
console.log('場所:', location);
console.log('性別:', gender === 'M' ? '男性' : '女性');

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
console.log('年柱地支:', result.fourPillars.yearPillar.branchTenGod || '情報なし');
console.log('月柱地支:', result.fourPillars.monthPillar.branchTenGod || '情報なし');
console.log('日柱地支:', result.fourPillars.dayPillar.branchTenGod || '情報なし');
console.log('時柱地支:', result.fourPillars.hourPillar.branchTenGod || '情報なし');

// 五行プロファイル
console.log('\n【五行プロファイル】');
console.log('主要属性:', result.elementProfile.mainElement);
console.log('副次属性:', result.elementProfile.secondaryElement);
console.log('陰陽:', result.elementProfile.yinYang);

// 十二運星
console.log('\n【十二運星】');
console.log('年柱:', result.twelveFortunes?.year || '情報なし');
console.log('月柱:', result.twelveFortunes?.month || '情報なし');
console.log('日柱:', result.twelveFortunes?.day || '情報なし');
console.log('時柱:', result.twelveFortunes?.hour || '情報なし');

// 十二神殺
console.log('\n【十二神殺】');
console.log('年柱:', result.twelveSpiritKillers?.year || '無し');
console.log('月柱:', result.twelveSpiritKillers?.month || '無し');
console.log('日柱:', result.twelveSpiritKillers?.day || '無し');
console.log('時柱:', result.twelveSpiritKillers?.hour || '無し');

// 蔵干情報（地支に隠された天干）がある場合は表示
if (result.hiddenStems && result.hiddenStems.month) {
  console.log('\n【月支の蔵干】');
  result.hiddenStems.month.forEach((stem: string) => {
    console.log(stem);
  });
}

// 旧暦情報
if (result.lunarDate) {
  console.log('\n【旧暦情報】');
  console.log(`旧暦: ${result.lunarDate.year}年${result.lunarDate.month}月${result.lunarDate.day}日`);
  console.log(`閏月: ${result.lunarDate.isLeapMonth ? 'はい' : 'いいえ'}`);
}

console.log('\n===== 計算完了 =====');