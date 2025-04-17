// 四柱推命計算をテストするスクリプト
const path = require('path');
const projectRoot = path.resolve(path.join(__dirname, '..', '..'));
const { SajuEngine } = require(path.join(projectRoot, 'sajuengine_package', 'src'));

// テスト用の生年月日
const birthDate = new Date('1986-05-26');
const birthHour = 5;  // 朝5時
const birthMinute = 0;
const gender = 'M';
const location = 'Tokyo, Japan';

// SajuEngineのインスタンス化
const sajuEngine = new SajuEngine();

// 時間計算（分も考慮）
const hourWithMinutes = birthHour + (birthMinute / 60);

try {
  // 四柱推命計算を実行
  const result = sajuEngine.calculate(birthDate, hourWithMinutes, gender, location);
  
  // 結果を表示
  console.log('四柱推命計算結果:');
  console.log('==================');
  console.log('四柱:');
  console.log(`年柱: ${result.fourPillars.yearPillar.stem}${result.fourPillars.yearPillar.branch}`);
  console.log(`月柱: ${result.fourPillars.monthPillar.stem}${result.fourPillars.monthPillar.branch}`);
  console.log(`日柱: ${result.fourPillars.dayPillar.stem}${result.fourPillars.dayPillar.branch}`);
  console.log(`時柱: ${result.fourPillars.hourPillar.stem}${result.fourPillars.hourPillar.branch}`);
  console.log('\n十神:');
  console.log(`年柱天干の十神: ${result.tenGods.year}`);
  console.log(`月柱天干の十神: ${result.tenGods.month}`);
  console.log(`日柱天干の十神: ${result.tenGods.day}`);
  console.log(`時柱天干の十神: ${result.tenGods.hour}`);
  
  // 五行特性
  if (result.elementProfile) {
    console.log('\n五行特性:');
    console.log(`主要な五行: ${result.elementProfile.mainElement}`);
    console.log(`補助的な五行: ${result.elementProfile.secondaryElement}`);
    console.log(`陰陽: ${result.elementProfile.yinYang}`);
  }
  
} catch (error) {
  console.error('計算エラー:', error);
}