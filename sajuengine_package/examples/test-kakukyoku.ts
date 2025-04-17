import { SajuEngine, IKakukyoku, IYojin } from '../src';

// 1986年5月26日 朝5時東京の生年月日データでテスト
const birthYear = 1986;
const birthMonth = 5;
const birthDay = 26;
const birthHour = 5;
const birthMinute = 0;
const gender = 'M'; // 男性
const birthPlace = '東京';

console.log(`===== 1986年5月26日 朝5時東京生まれの四柱推命テスト =====`);

// SajuEngineのインスタンスを作成
const sajuEngine = new SajuEngine();

// 生年月日のDateオブジェクトを作成
const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

// 四柱推命の計算
const result = sajuEngine.calculate(
  birthDate,
  birthHour,
  gender,
  birthPlace
);

// 四柱の表示
console.log('\n【四柱】');
console.log(`年柱: ${result.fourPillars.yearPillar.stem}${result.fourPillars.yearPillar.branch}`);
console.log(`月柱: ${result.fourPillars.monthPillar.stem}${result.fourPillars.monthPillar.branch}`);
console.log(`日柱: ${result.fourPillars.dayPillar.stem}${result.fourPillars.dayPillar.branch}`);
console.log(`時柱: ${result.fourPillars.hourPillar.stem}${result.fourPillars.hourPillar.branch}`);

// 十神の表示
console.log('\n【十神関係】');
console.log(`年柱: ${result.tenGods?.year || '不明'}`);
console.log(`月柱: ${result.tenGods?.month || '不明'}`);
console.log(`時柱: ${result.tenGods?.hour || '不明'}`);

// 地支に隠れた天干の表示
console.log('\n【地支の蔵干】');
console.log(`年支蔵干: ${result.fourPillars.yearPillar.hiddenStems?.join(', ') || '無し'}`);
console.log(`月支蔵干: ${result.fourPillars.monthPillar.hiddenStems?.join(', ') || '無し'}`);
console.log(`日支蔵干: ${result.fourPillars.dayPillar.hiddenStems?.join(', ') || '無し'}`);
console.log(`時支蔵干: ${result.fourPillars.hourPillar.hiddenStems?.join(', ') || '無し'}`);

// 格局の判定
const kakukyoku = result.kakukyoku as IKakukyoku;

// 格局情報の詳細表示
console.log('\n【格局情報】');
console.log(`格局タイプ: ${kakukyoku.type}`);
console.log(`カテゴリ: ${kakukyoku.category === 'special' ? '特別格局' : '普通格局'}`);
console.log(`身強弱: ${kakukyoku.strength === 'strong' ? '身強' : kakukyoku.strength === 'weak' ? '身弱' : '中和'}`);
console.log(`説明: ${kakukyoku.description || '説明なし'}`);

// 追加された新しいプロパティの表示
console.log('\n【身強弱の詳細判定】');
console.log(`極タイプ: ${kakukyoku.extremeType || 'なし'}`);
console.log(`極身強: ${kakukyoku.isExtremeStrong ? 'はい' : 'いいえ'}`);
console.log(`極身弱: ${kakukyoku.isExtremeWeak ? 'はい' : 'いいえ'}`);
console.log(`スコア: ${kakukyoku.score ?? '不明'}`);

// 判定の詳細理由
console.log('\n【判定の詳細理由】');
if (kakukyoku.details && kakukyoku.details.length > 0) {
  kakukyoku.details.forEach((detail, index) => {
    console.log(`${index + 1}. ${detail}`);
  });
} else {
  console.log('詳細な判定理由がありません');
}

// 用神・喜神・忌神・仇神の情報
console.log('\n【用神情報】');
if (result.yojin) {
  const yojin = result.yojin as IYojin;  // 明示的にIYojin型にキャスト
  
  console.log(`用神: ${yojin.tenGod} (${yojin.element})`);
  console.log(`説明: ${yojin.description || '説明なし'}`);
  console.log(`サポートする五行: ${yojin.supportElements?.join(', ') || '不明'}`);
  
  // 喜神・忌神・仇神の情報
  console.log('\n【喜神・忌神・仇神情報】');
  if (yojin.kijin) {
    console.log(`喜神: ${yojin.kijin.tenGod} (${yojin.kijin.element})`);
    console.log(`説明: ${yojin.kijin.description || '説明なし'}`);
  } else {
    console.log('喜神情報がありません');
  }
  
  if (yojin.kijin2) {
    console.log(`忌神: ${yojin.kijin2.tenGod} (${yojin.kijin2.element})`);
    console.log(`説明: ${yojin.kijin2.description || '説明なし'}`);
  } else {
    console.log('忌神情報がありません');
  }
  
  if (yojin.kyujin) {
    console.log(`仇神: ${yojin.kyujin.tenGod} (${yojin.kyujin.element})`);
    console.log(`説明: ${yojin.kyujin.description || '説明なし'}`);
  } else {
    console.log('仇神情報がありません');
  }
} else {
  console.log('用神情報がありません');
}