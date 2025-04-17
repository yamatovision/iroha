import { SajuEngine } from '../../src/SajuEngine';
import { countTenGods } from './countTenGods';
import { TenGodRelation } from '../../src/types';

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
      
      // 独自実装のcountTenGods関数でカウント
      const counts = countTenGods(result.fourPillars);
      
      // 個別十神の集計結果を表示
      console.log('個別十神カウント:');
      const individualTenGods: TenGodRelation[] = [
        '比肩', '劫財', '偏印', '正印', '食神', 
        '傷官', '偏財', '正財', '偏官', '正官'
      ];
      
      individualTenGods.forEach(tenGod => {
        console.log(`${tenGod}: ${counts[tenGod]}`);
      });
      
      // 通変星ペアの集計結果を表示
      console.log('\n通変星ペアカウント:');
      const pairTenGods: TenGodRelation[] = ['比劫', '印', '食傷', '財', '官殺'];
      
      pairTenGods.forEach(pair => {
        console.log(`${pair}: ${counts[pair]}`);
      });
      
      // 検証：通変星ペアが個別十神の合計と一致するか
      let allValid = true;
      if (counts['比劫'] !== counts['比肩'] + counts['劫財']) {
        console.log('❌ 比劫の集計が不一致');
        allValid = false;
      }
      if (counts['印'] !== counts['偏印'] + counts['正印']) {
        console.log('❌ 印の集計が不一致');
        allValid = false;
      }
      if (counts['食傷'] !== counts['食神'] + counts['傷官']) {
        console.log('❌ 食傷の集計が不一致');
        allValid = false;
      }
      if (counts['財'] !== counts['偏財'] + counts['正財']) {
        console.log('❌ 財の集計が不一致');
        allValid = false;
      }
      if (counts['官殺'] !== counts['偏官'] + counts['正官']) {
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