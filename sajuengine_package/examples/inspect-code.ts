/**
 * SajuEngine内部処理の検証用スクリプト
 * 特に通変星カウントと重み付けに注目
 */
import { SajuEngine } from '../src';

// 生年月日情報
const birthDate = new Date(1986, 4, 26); // 1986年5月26日 (月は0-indexed)
const birthHour = 5; // 5時
const gender = 'M'; // 男性
const birthPlace = '東京';

console.log('===== SajuEngine実行ログの検証 =====');
console.log('四柱: 丙寅 癸巳 庚午 己卯 (1986年5月26日 5時 東京)');

// SajuEngineを初期化
const engine = new SajuEngine({
  useInternationalMode: true
});

// 実行時に詳細なログを出力するようにする
console.log('実行ログ (通変星カウントと重み付けに注目):');
console.log('--------------------------------------');
// 四柱推命計算を実行
const result = engine.calculate(birthDate, birthHour, gender, birthPlace);

// 結果を表示
console.log('\n===== 計算結果 =====');
console.log('四柱:');
console.log(`年柱: ${result.fourPillars.yearPillar.stem}${result.fourPillars.yearPillar.branch}`);
console.log(`月柱: ${result.fourPillars.monthPillar.stem}${result.fourPillars.monthPillar.branch}`);
console.log(`日柱: ${result.fourPillars.dayPillar.stem}${result.fourPillars.dayPillar.branch}`);
console.log(`時柱: ${result.fourPillars.hourPillar.stem}${result.fourPillars.hourPillar.branch}`);

console.log('\n格局情報:');
if (result.kakukyoku) {
  console.log(`格局タイプ: ${result.kakukyoku.type}`);
  console.log(`カテゴリ: ${result.kakukyoku.category}`);
  console.log(`身強弱: ${result.kakukyoku.strength}`);
  console.log(`説明: ${result.kakukyoku.description}`);
}

console.log('\n用神情報:');
if (result.yojin) {
  console.log(`用神: ${result.yojin.tenGod} (${result.yojin.element})`);
  console.log(`説明: ${result.yojin.description}`);
}