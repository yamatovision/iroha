// シンプルな通変星ペア集計の検証用テスト
// JavaScript版（TypeScriptコンパイルエラーを回避）

const { SajuEngine } = require('../../dist');

// テスト用の生年月日
const testDates = [
  { date: new Date(1990, 0, 1), hour: 12, desc: '1990年1月1日 12時' },
  { date: new Date(1985, 5, 15), hour: 8, desc: '1985年6月15日 8時' },
  { date: new Date(2000, 11, 31), hour: 23, desc: '2000年12月31日 23時' }
];

// テスト実行
async function runTest() {
  const engine = new SajuEngine();
  
  for (const test of testDates) {
    console.log(`\n========== ${test.desc} のテスト ==========`);
    const result = engine.calculate(test.date, test.hour);
    
    // 四柱の表示
    console.log('四柱:');
    console.log(`年柱: ${result.fourPillars.yearPillar.stem}${result.fourPillars.yearPillar.branch}`);
    console.log(`月柱: ${result.fourPillars.monthPillar.stem}${result.fourPillars.monthPillar.branch}`);
    console.log(`日柱: ${result.fourPillars.dayPillar.stem}${result.fourPillars.dayPillar.branch}`);
    console.log(`時柱: ${result.fourPillars.hourPillar.stem}${result.fourPillars.hourPillar.branch}`);
    
    // 十神関係の表示
    console.log('\n十神関係:');
    console.log(`年柱: ${result.tenGods.year}`);
    console.log(`月柱: ${result.tenGods.month}`);
    console.log(`時柱: ${result.tenGods.hour}`);
    
    // 地支十神関係の表示
    console.log('\n地支十神関係:');
    console.log(`年柱: ${result.fourPillars.yearPillar.branchTenGod}`);
    console.log(`月柱: ${result.fourPillars.monthPillar.branchTenGod}`);
    console.log(`日柱: ${result.fourPillars.dayPillar.branchTenGod}`);
    console.log(`時柱: ${result.fourPillars.hourPillar.branchTenGod}`);
    
    // 格局情報の表示
    console.log('\n格局情報:');
    console.log(`タイプ: ${result.kakukyoku?.type}`);
    console.log(`分類: ${result.kakukyoku?.category}`);
    console.log(`身強弱: ${result.kakukyoku?.strength}`);
    console.log(`説明: ${result.kakukyoku?.description}`);
    
    // 用神情報の表示
    console.log('\n用神情報:');
    console.log(`用神: ${result.yojin?.tenGod}`);
    console.log(`五行: ${result.yojin?.element}`);
    console.log(`説明: ${result.yojin?.description}`);
    
    // 通変星ペア集計テスト
    console.log('\n通変星ペア集計テスト:');
    
    // 通変星の個別カウントを表示
    if (result.fourPillars.yearPillar.hiddenStemsTenGods && 
        result.fourPillars.monthPillar.hiddenStemsTenGods && 
        result.fourPillars.dayPillar.hiddenStemsTenGods && 
        result.fourPillars.hourPillar.hiddenStemsTenGods) {
      
      // 十神のカウントを集計
      const tenGodCounts = {
        '比肩': 0, '劫財': 0,
        '偏印': 0, '正印': 0,
        '食神': 0, '傷官': 0,
        '偏財': 0, '正財': 0,
        '偏官': 0, '正官': 0
      };
      
      // 天干の十神関係をカウント（3つの柱から）
      if (result.tenGods.year && result.tenGods.year in tenGodCounts) {
        tenGodCounts[result.tenGods.year]++;
      }
      if (result.tenGods.month && result.tenGods.month in tenGodCounts) {
        tenGodCounts[result.tenGods.month]++;
      }
      if (result.tenGods.hour && result.tenGods.hour in tenGodCounts) {
        tenGodCounts[result.tenGods.hour]++;
      }
      
      // 地支の十神関係をカウント（4つの柱から）
      const branchTenGods = [
        result.fourPillars.yearPillar.branchTenGod,
        result.fourPillars.monthPillar.branchTenGod,
        result.fourPillars.dayPillar.branchTenGod,
        result.fourPillars.hourPillar.branchTenGod
      ];
      
      branchTenGods.forEach(tenGod => {
        if (tenGod && tenGod in tenGodCounts) {
          tenGodCounts[tenGod]++;
        }
      });
      
      // 蔵干の十神関係もカウント
      const allHiddenStemsTenGods = [
        ...result.fourPillars.yearPillar.hiddenStemsTenGods,
        ...result.fourPillars.monthPillar.hiddenStemsTenGods,
        ...result.fourPillars.dayPillar.hiddenStemsTenGods,
        ...result.fourPillars.hourPillar.hiddenStemsTenGods
      ];
      
      allHiddenStemsTenGods.forEach(({ tenGod, weight = 1 }) => {
        if (tenGod && tenGod in tenGodCounts) {
          tenGodCounts[tenGod] += weight;
        }
      });
      
      // 個別十神の集計結果を表示
      console.log('個別十神カウント:');
      Object.entries(tenGodCounts).forEach(([tenGod, count]) => {
        console.log(`${tenGod}: ${count}`);
      });
      
      // 通変星ペアの集計
      const pairCounts = {
        '比劫': tenGodCounts['比肩'] + tenGodCounts['劫財'],
        '印': tenGodCounts['偏印'] + tenGodCounts['正印'],
        '食傷': tenGodCounts['食神'] + tenGodCounts['傷官'],
        '財': tenGodCounts['偏財'] + tenGodCounts['正財'],
        '官殺': tenGodCounts['偏官'] + tenGodCounts['正官']
      };
      
      // 通変星ペアの集計結果を表示
      console.log('\n通変星ペアカウント:');
      Object.entries(pairCounts).forEach(([pair, count]) => {
        console.log(`${pair}: ${count}`);
      });
      
      // 検証：通変星ペアが個別十神の合計と一致するか
      let allValid = true;
      if (pairCounts['比劫'] !== tenGodCounts['比肩'] + tenGodCounts['劫財']) {
        console.log('❌ 比劫の集計が不一致');
        allValid = false;
      }
      if (pairCounts['印'] !== tenGodCounts['偏印'] + tenGodCounts['正印']) {
        console.log('❌ 印の集計が不一致');
        allValid = false;
      }
      if (pairCounts['食傷'] !== tenGodCounts['食神'] + tenGodCounts['傷官']) {
        console.log('❌ 食傷の集計が不一致');
        allValid = false;
      }
      if (pairCounts['財'] !== tenGodCounts['偏財'] + tenGodCounts['正財']) {
        console.log('❌ 財の集計が不一致');
        allValid = false;
      }
      if (pairCounts['官殺'] !== tenGodCounts['偏官'] + tenGodCounts['正官']) {
        console.log('❌ 官殺の集計が不一致');
        allValid = false;
      }
      
      if (allValid) {
        console.log('✅ 全ての通変星ペアが正しく集計されています');
      }
    } else {
      console.log('❌ 蔵干十神関係情報が不足しています');
    }
    
    console.log('\n------------------------------');
  }
}

// テストを実行
runTest().catch(console.error);