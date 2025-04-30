/**
 * 格局と用神計算機能のテストスクリプト
 * 
 * 使用方法:
 * node server/scripts/test-kakukyoku-yojin.js
 */

// sajuengine_packageから直接SajuEngineをインポート
const { SajuEngine } = require('../../sajuengine_package/dist');

// テストケースの定義
const testCases = [
  {
    name: '1986年5月26日 東京 5時生まれ',
    birthDate: new Date('1986-05-26T05:00:00+09:00'),
    birthHour: 5,
    gender: 'M',
    location: 'Tokyo, Japan'
  }
];

// SajuEngineインスタンスの作成
const sajuEngine = new SajuEngine({
  useInternationalMode: true,
  useLocalTime: true
});

// テスト関数
async function runTests() {
  console.log('格局と用神計算機能テスト開始');
  console.log('-------------------------------------');
  console.log('※特定の生年月日時でテスト実行');

  for (const testCase of testCases) {
    console.log(`\nテストケース: ${testCase.name}\n`);
    
    try {
      // 四柱推命計算の実行
      const result = sajuEngine.calculate(
        testCase.birthDate,
        testCase.birthHour,
        testCase.gender,
        testCase.location
      );
      
      // 結果を表示
      console.log('四柱:');
      console.log(`  年柱: ${result.fourPillars.yearPillar.fullStemBranch}`);
      console.log(`  月柱: ${result.fourPillars.monthPillar.fullStemBranch}`);
      console.log(`  日柱: ${result.fourPillars.dayPillar.fullStemBranch}`);
      console.log(`  時柱: ${result.fourPillars.hourPillar.fullStemBranch}`);
      
      // 格局情報の表示
      console.log('\n格局情報:');
      if (result.kakukyoku) {
        console.log(`  タイプ: ${result.kakukyoku.type}`);
        console.log(`  カテゴリ: ${result.kakukyoku.category}`);
        console.log(`  身強・身弱: ${result.kakukyoku.strength}`);
        console.log(`  説明: ${result.kakukyoku.description || '説明なし'}`);
      } else {
        console.log('  格局情報がありません');
      }
      
      // 用神情報の表示
      console.log('\n用神情報:');
      if (result.yojin) {
        console.log(`  十神: ${result.yojin.tenGod}`);
        console.log(`  五行: ${result.yojin.element}`);
        console.log(`  サポート五行: ${result.yojin.supportElements ? result.yojin.supportElements.join(', ') : '情報なし'}`);
        console.log(`  説明: ${result.yojin.description || '説明なし'}`);
      } else {
        console.log('  用神情報がありません');
      }
      
      console.log('\n-------------------------------------');
    } catch (error) {
      console.error(`エラー (${testCase.name}):`, error.message);
      console.log('\n-------------------------------------');
    }
  }
  
  console.log('\nテスト完了');
}

// テストの実行
runTests().catch(err => {
  console.error('テスト実行エラー:', err);
  process.exit(1);
});