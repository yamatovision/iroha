/**
 * 格局判定処理をトレースするスクリプト
 * 特に「従財格」と「従殺格」の判定の違いに注目
 */
import { SajuEngine } from '../src';

// 生年月日情報
const birthDate = new Date(1986, 4, 26); // 1986年5月26日 (月は0-indexed)
const birthHour = 5; // 5時
const gender = 'M'; // 男性
const birthPlace = '東京';

// 通変星の分布を手動で集計する関数
function analyzeDistribution(result: any) {
  try {
    // 各十神関係の出現回数を数える
    const tenGodCounts: Record<string, number> = {
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
    
    // 天干の十神関係
    if (result.tenGods) {
      Object.values(result.tenGods).forEach((tenGod: any) => {
        if (typeof tenGod === 'string' && tenGod in tenGodCounts) {
          tenGodCounts[tenGod]++;
          console.log(`天干十神カウント: ${tenGod}`);
        }
      });
    }
    
    // 地支の十神関係
    const pillars = ['yearPillar', 'monthPillar', 'dayPillar', 'hourPillar'];
    pillars.forEach(pillar => {
      const branch = result.fourPillars[pillar].branchTenGod;
      if (branch && branch in tenGodCounts) {
        tenGodCounts[branch]++;
        console.log(`地支十神カウント: ${pillar}の${branch}`);
      }
    });
    
    // 蔵干の十神関係
    pillars.forEach(pillar => {
      const hiddenStems = result.fourPillars[pillar].hiddenStemsTenGods;
      if (hiddenStems && Array.isArray(hiddenStems)) {
        hiddenStems.forEach(({stem, tenGod, weight = 1}: any) => {
          if (tenGod && tenGod in tenGodCounts) {
            tenGodCounts[tenGod] += weight;
            console.log(`蔵干十神カウント: ${pillar}の蔵干${stem}の${tenGod}, 重み:${weight}`);
          }
        });
      }
    });
    
    // 集計結果
    console.log('\n通変星集計結果:');
    Object.entries(tenGodCounts).forEach(([tenGod, count]) => {
      console.log(`${tenGod}: ${count}`);
    });
    
    // 合計を計算
    const total = Object.values(tenGodCounts).reduce((sum, count) => sum + count, 0);
    console.log('合計:', total);
    
    // ペアごとの分布
    console.log('\n通変星ペアの分布:');
    const pairs = [
      ['比肩', '劫財'],
      ['食神', '傷官'],
      ['偏財', '正財'],
      ['偏官', '正官'],
      ['偏印', '正印']
    ];
    
    pairs.forEach(([a, b]) => {
      const count = tenGodCounts[a] + tenGodCounts[b];
      const percentage = (count / total) * 100;
      console.log(`${a}・${b}: ${percentage.toFixed(2)}% (${count}/${total})`);
      
      // 特別格局の閾値チェック
      if (percentage >= 30) {
        console.log(`  → 閾値30%以上: 特別格局判定の候補`);
        
        // 身弱の場合の特別格局タイプ
        if (a === '食神' && b === '傷官') {
          console.log(`  → 身弱の場合: 従児格`);
        } else if (a === '偏財' && b === '正財') {
          console.log(`  → 身弱の場合: 従財格`);
        } else if (a === '偏官' && b === '正官') {
          console.log(`  → 身弱の場合: 従殺格`);
        }
      }
    });
    
    // 実際の判定結果との照合
    console.log('\n実際の判定結果:');
    if (result.kakukyoku) {
      console.log(`格局タイプ: ${result.kakukyoku.type}`);
      console.log(`カテゴリ: ${result.kakukyoku.category}`);
      console.log(`身強弱: ${result.kakukyoku.strength}`);
    }
    
    // 判定理由の推測
    console.log('\n判定理由の分析:');
    // 偏財・正財と偏官・正官の比率を比較
    const pzRatio = (tenGodCounts['偏財'] + tenGodCounts['正財']) / total;
    const pgRatio = (tenGodCounts['偏官'] + tenGodCounts['正官']) / total;
    
    if (pzRatio >= 0.3 && pgRatio >= 0.3) {
      console.log('→ 両方のペアが閾値30%以上なので、判定優先順位が影響している可能性があります');
      console.log(`   偏財・正財: ${(pzRatio * 100).toFixed(2)}%`);
      console.log(`   偏官・正官: ${(pgRatio * 100).toFixed(2)}%`);
      
      // 優先順位の仮説を検証
      if (result.kakukyoku && result.kakukyoku.type === '従財格') {
        console.log('→ 「従財格」が選ばれたことから、偏財・正財 > 偏官・正官 の優先順位がある可能性');
      } else if (result.kakukyoku && result.kakukyoku.type === '従殺格') {
        console.log('→ 「従殺格」が選ばれたことから、偏官・正官 > 偏財・正財 の優先順位がある可能性');
      }
    } else if (pzRatio >= 0.3) {
      console.log(`→ 偏財・正財が閾値以上 (${(pzRatio * 100).toFixed(2)}%) なので「従財格」と判定されています`);
    } else if (pgRatio >= 0.3) {
      console.log(`→ 偏官・正官が閾値以上 (${(pgRatio * 100).toFixed(2)}%) なので「従殺格」が期待されますが...`);
      if (result.kakukyoku && result.kakukyoku.type === '従財格') {
        console.log('→ 実際は「従財格」と判定されているため、別の要因が影響しています');
      }
    }
    
    return { counts: tenGodCounts, total };
  } catch (error) {
    console.error('分析中にエラーが発生しました:', error);
    return null;
  }
}

// メイン処理
console.log('===== 格局判定ロジックのトレース =====');
console.log('四柱: 丙寅 癸巳 庚午 己卯 (1986年5月26日 5時 東京)');

// SajuEngineを初期化
const engine = new SajuEngine({
  useInternationalMode: true
});

// 四柱推命計算を実行
const result = engine.calculate(birthDate, birthHour, gender, birthPlace);

// 結果を表示
console.log('\n===== 計算結果 =====');
console.log('四柱:');
console.log(`年柱: ${result.fourPillars.yearPillar.stem}${result.fourPillars.yearPillar.branch}`);
console.log(`月柱: ${result.fourPillars.monthPillar.stem}${result.fourPillars.monthPillar.branch}`);
console.log(`日柱: ${result.fourPillars.dayPillar.stem}${result.fourPillars.dayPillar.branch}`);
console.log(`時柱: ${result.fourPillars.hourPillar.stem}${result.fourPillars.hourPillar.branch}`);

// 通変星集計と分析
console.log('\n===== 通変星の分布と格局判定の分析 =====');
analyzeDistribution(result);

// 結論
console.log('\n===== 結論 =====');
console.log('「従財格」と判定された理由の可能性:');
console.log('1. 蔵干の重み付けの違い - 実装では本気/中気/余気の重みが異なる可能性');
console.log('2. 通変星ペアの優先順位 - 偏財・正財 > 偏官・正官の優先順位がある可能性');
console.log('3. 蔵干の影響度の違い - 実装では「甲」「乙」の影響が強く計算されている可能性');