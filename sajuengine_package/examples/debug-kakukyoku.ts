/**
 * 格局判定のロジックをデバッグするためのスクリプト
 * 特に通変星のカウント方法と格局判定の詳細をトレースする
 */
import { FourPillars, Pillar, IKakukyoku } from '../src/types';
import * as kakukyokuCalculator from '../src/kakukyokuCalculator';

// 四柱情報を設定: 丙寅 癸巳 庚午 己卯
const fourPillars: FourPillars = {
  yearPillar: {
    stem: '丙',
    branch: '寅',
    fullStemBranch: '丙寅',
    hiddenStems: ['甲', '丙', '戊'],
    branchTenGod: '偏財',
    hiddenStemsTenGods: [
      { stem: '甲', tenGod: '偏財', weight: 1 },
      { stem: '丙', tenGod: '偏官', weight: 0.7 },
      { stem: '戊', tenGod: '偏印', weight: 0.4 }
    ]
  },
  monthPillar: {
    stem: '癸',
    branch: '巳',
    fullStemBranch: '癸巳',
    hiddenStems: ['丙', '庚', '戊'],
    branchTenGod: '正官',
    hiddenStemsTenGods: [
      { stem: '丙', tenGod: '偏官', weight: 1 },
      { stem: '庚', tenGod: '比肩', weight: 0.7 },
      { stem: '戊', tenGod: '偏印', weight: 0.4 }
    ]
  },
  dayPillar: {
    stem: '庚',
    branch: '午',
    fullStemBranch: '庚午',
    hiddenStems: ['丁', '己'],
    branchTenGod: '偏官',
    hiddenStemsTenGods: [
      { stem: '丁', tenGod: '正官', weight: 1 },
      { stem: '己', tenGod: '正印', weight: 0.7 }
    ]
  },
  hourPillar: {
    stem: '己',
    branch: '卯',
    fullStemBranch: '己卯',
    hiddenStems: ['乙'],
    branchTenGod: '正財',
    hiddenStemsTenGods: [
      { stem: '乙', tenGod: '正財', weight: 1 }
    ]
  }
};

// 十神関係情報
const tenGods = {
  year: '偏官',
  month: '傷官',
  hour: '正印',
  day: '比肩'
};

// 通変星カウント関数を実装（kakukyokuCalculatorのcountTenGods関数を参考に）
function countTenGods(fourPillars: FourPillars): Record<string, number> {
  const counts: Record<string, number> = {
    '比肩': 0,
    '劫財': 0,
    '食神': 0,
    '傷官': 0,
    '偏財': 0,
    '正財': 0,
    '偏官': 0,
    '正官': 0,
    '偏印': 0,
    '正印': 0
  };
  
  // 天干の十神関係をカウント
  const stemTenGods = [
    { pillar: 'year', stem: fourPillars.yearPillar.stem, tenGod: tenGods.year },
    { pillar: 'month', stem: fourPillars.monthPillar.stem, tenGod: tenGods.month },
    { pillar: 'hour', stem: fourPillars.hourPillar.stem, tenGod: tenGods.hour }
  ];
  
  stemTenGods.forEach(({ pillar, stem, tenGod }) => {
    if (tenGod && tenGod in counts) {
      counts[tenGod]++;
      console.log(`天干カウント: ${pillar}干(${stem})の十神(${tenGod})をカウント`);
    }
  });
  
  // 地支の十神関係もカウント
  const branchTenGods = [
    { pillar: 'year', branch: fourPillars.yearPillar.branch, tenGod: fourPillars.yearPillar.branchTenGod },
    { pillar: 'month', branch: fourPillars.monthPillar.branch, tenGod: fourPillars.monthPillar.branchTenGod },
    { pillar: 'day', branch: fourPillars.dayPillar.branch, tenGod: fourPillars.dayPillar.branchTenGod },
    { pillar: 'hour', branch: fourPillars.hourPillar.branch, tenGod: fourPillars.hourPillar.branchTenGod }
  ];
  
  branchTenGods.forEach(({ pillar, branch, tenGod }) => {
    if (tenGod && tenGod in counts) {
      counts[tenGod]++;
      console.log(`地支カウント: ${pillar}支(${branch})の十神(${tenGod})をカウント`);
    }
  });
  
  // 蔵干の十神関係もカウント
  const hiddenStemsTenGods = [
    ...(fourPillars.yearPillar.hiddenStemsTenGods || []).map(item => ({ pillar: 'year', ...item })),
    ...(fourPillars.monthPillar.hiddenStemsTenGods || []).map(item => ({ pillar: 'month', ...item })),
    ...(fourPillars.dayPillar.hiddenStemsTenGods || []).map(item => ({ pillar: 'day', ...item })),
    ...(fourPillars.hourPillar.hiddenStemsTenGods || []).map(item => ({ pillar: 'hour', ...item }))
  ];
  
  hiddenStemsTenGods.forEach(({ pillar, stem, tenGod, weight = 1 }) => {
    if (tenGod && tenGod in counts) {
      counts[tenGod] += weight;
      console.log(`蔵干カウント: ${pillar}支蔵干(${stem})の十神(${tenGod})を重み${weight}でカウント`);
    }
  });
  
  return counts;
}

// kakukyokuCalculatorのdetermineSpecialKakukyoku関数を直接使用せず類似処理を実装
function determineSpecialKakukyokuType(tenGodCounts: Record<string, number>, isStrong: boolean): string {
  // 通変星の合計数を計算
  const total = Object.values(tenGodCounts).reduce((sum, count) => sum + count, 0);
  
  // 各ペアの割合を計算
  const pairPercentages = {
    '比肩劫財': (tenGodCounts['比肩'] + tenGodCounts['劫財']) / total,
    '食神傷官': (tenGodCounts['食神'] + tenGodCounts['傷官']) / total,
    '偏財正財': (tenGodCounts['偏財'] + tenGodCounts['正財']) / total,
    '偏官正官': (tenGodCounts['偏官'] + tenGodCounts['正官']) / total,
    '偏印正印': (tenGodCounts['偏印'] + tenGodCounts['正印']) / total
  };
  
  console.log('通変星ペアの割合:');
  Object.entries(pairPercentages).forEach(([pair, percentage]) => {
    console.log(`${pair}: ${(percentage * 100).toFixed(2)}%`);
  });
  
  // 特別格局の判定
  if (isStrong) {
    // 極身強の場合
    if (pairPercentages['比肩劫財'] >= 0.3) {
      return '従旺格';
    } else if (pairPercentages['偏印正印'] >= 0.3) {
      return '従強格';
    }
  } else {
    // 極身弱の場合
    if (pairPercentages['食神傷官'] >= 0.3) {
      return '従児格';
    } else if (pairPercentages['偏財正財'] >= 0.3) {
      return '従財格';
    } else if (pairPercentages['偏官正官'] >= 0.3) {
      return '従殺格';
    }
    
    // 従勢格の判定
    const sixTypeCount = tenGodCounts['食神'] + tenGodCounts['傷官'] + 
                        tenGodCounts['偏財'] + tenGodCounts['正財'] + 
                        tenGodCounts['偏官'] + tenGodCounts['正官'];
    
    if (sixTypeCount / total >= 0.6) {
      // 均等性をチェック
      const sixTypes = ['食神', '傷官', '偏財', '正財', '偏官', '正官'];
      const counts = sixTypes.map(type => tenGodCounts[type]);
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      
      // 最大値が0でなく、最小値÷最大値が0.5以上なら均等と判断
      if (max > 0 && min / max >= 0.5) {
        return '従勢格';
      }
    }
  }
  
  return '特殊格局判定できず';
}

// メイン処理
console.log('===== 格局判定ロジックのデバッグ =====');
console.log('四柱: 丙寅 癸巳 庚午 己卯');

// 通変星をカウント
console.log('\n1. 通変星のカウント処理:');
const counts = countTenGods(fourPillars);

// 結果を表示
console.log('\n2. 通変星のカウント結果:');
Object.entries(counts).forEach(([tenGod, count]) => {
  console.log(`${tenGod}: ${count}`);
});

// 通変星の合計数
const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
console.log('\n合計:', total);

// ペアごとのパーセンテージ
console.log('\n3. 通変星ペアの分布:');
const bk = (counts['比肩'] + counts['劫財']) / total * 100;
const st = (counts['食神'] + counts['傷官']) / total * 100;
const pz = (counts['偏財'] + counts['正財']) / total * 100;
const pg = (counts['偏官'] + counts['正官']) / total * 100;
const pi = (counts['偏印'] + counts['正印']) / total * 100;

console.log(`比肩・劫財: ${bk.toFixed(2)}%`);
console.log(`食神・傷官: ${st.toFixed(2)}%`);
console.log(`偏財・正財: ${pz.toFixed(2)}%`);
console.log(`偏官・正官: ${pg.toFixed(2)}%`);
console.log(`偏印・正印: ${pi.toFixed(2)}%`);

// 実際の格局判定
console.log('\n4. 格局判定処理:');
// 身弱として判定
const kakukyokuType = determineSpecialKakukyokuType(counts, false);
console.log(`\n判定された格局: ${kakukyokuType}`);

// 実際のテスト結果との比較
console.log('\n5. 実際のSajuEngineテスト結果との比較:');
console.log('テスト結果では「従財格」と判定されていました');

// 特別格局判定のロジックを検証
console.log('\n6. 特別格局判定ロジックの詳細検証:');

// 実際の重み付け適用後の値を仮定して再計算
console.log('\n蔵干の重み付け適用後の推定値:');
const modifiedCounts = { ...counts };

// 蔵干の重みを適用して数値を調整
// 蔵干の「本気」は1.0、「中気」は0.7、「余気」は0.4の重み
// この調整が実際の処理に近づくよう微調整
console.log('蔵干の重み調整の影響を検証:');

// 偏財・正財の割合と偏官・正官の割合の違いを確認
console.log(`\n調整前: 偏財・正財: ${pz.toFixed(2)}%, 偏官・正官: ${pg.toFixed(2)}%`);

// 仮説: 実際の処理では蔵干の重みにより偏財・正財の率が上がっている可能性
const threshold = 30.0; // 30%の閾値
console.log(`特別格局の判定閾値: ${threshold}%`);

// 実際の判定理由を分析
if (pz >= threshold) {
  console.log('→ 偏財・正財が閾値を超えているため「従財格」と判定されています');
} else if (pg >= threshold) {
  console.log('→ 偏官・正官が閾値を超えているため「従殺格」と判定されるはずですが...');
  
  console.log('\n*** 原因分析 ***');
  console.log('1. 蔵干の重み付けの影響:');
  console.log('   - 蔵干の本気(1.0)・中気(0.7)・余気(0.4)の重みづけにより分布が変化');
  console.log('   - 特に偏財・正財の割合が実際の処理では高くなっている可能性');
  
  console.log('\n2. 内部計算ロジックの違い:');
  console.log('   - 地支の十神関係だけでなく、その影響度も変化している可能性');
  console.log('   - 偏財・正財：地支では年支(寅)と時支(卯)、さらに蔵干の「甲」と「乙」が影響');
  console.log('   - 偏官・正官：地支では月支(巳)と日支(午)が影響、蔵干の「丙」「丁」も影響');
  
  console.log('\n3. 特殊な判定ルール:');
  console.log('   - 複数の通変星ペアが30%以上の場合、優先順位が存在する可能性');
  console.log('   - 偏財・正財 > 偏官・正官 の優先順位である可能性');
  
  console.log('\n考えられる最も可能性の高い理由:');
  console.log('蔵干と地支の重み付け計算により、実際のSajuEngine処理では');
  console.log('「偏財・正財」の割合が30%以上になり「従財格」と判定されたと考えられます');
} else {
  console.log('→ 両方とも閾値未満のため、他の要因が影響している可能性があります');
}