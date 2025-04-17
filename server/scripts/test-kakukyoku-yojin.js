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
    name: '極身強ケース - 1985年5月8日 東京',
    birthDate: new Date('1985-05-08T06:31:00+09:00'),
    birthHour: 6.5,
    gender: 'M',
    location: 'Tokyo, Japan'
  },
  {
    name: '極身弱ケース - 1990年12月15日 大阪',
    birthDate: new Date('1990-12-15T22:45:00+09:00'),
    birthHour: 22.75,
    gender: 'F',
    location: 'Osaka, Japan'
  },
  {
    name: '中和ケース - 1982年9月21日 名古屋',
    birthDate: new Date('1982-09-21T14:20:00+09:00'),
    birthHour: 14.33,
    gender: 'M',
    location: 'Nagoya, Japan'
  },
  {
    name: '従旺格の特殊パターン - 1975年3月10日 京都',
    birthDate: new Date('1975-03-10T09:30:00+09:00'),
    birthHour: 9.5,
    gender: 'M',
    location: 'Kyoto, Japan'
  },
  {
    name: '従財格の特殊パターン - 1980年11月18日 神戸',
    birthDate: new Date('1980-11-18T18:15:00+09:00'),
    birthHour: 18.25,
    gender: 'F',
    location: 'Kobe, Japan'
  },
  {
    name: '建禄格パターン - 1988年2月4日 札幌',
    birthDate: new Date('1988-02-04T12:00:00+09:00'),
    birthHour: 12,
    gender: 'M',
    location: 'Sapporo, Japan'
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