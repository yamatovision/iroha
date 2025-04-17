// TypeScriptを直接使用せず四柱推命計算をテストするスクリプト
// 日本語対応のため文字コードはUTF-8

// テスト用の生年月日
const birthDate = new Date('1986-05-26');
const birthHour = 5;  // 朝5時
const birthMinute = 0;
const gender = 'M';
const location = 'Tokyo, Japan';

// 手動で実装する簡易的な計算関数
function calculateBasicSaju(birthDate, hour, gender) {
  // 干支配列
  const heavenlyStems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const earthlyBranches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  
  // 年、月、日、時の計算（簡易バージョン）
  // 実際の四柱推命ではもっと複雑な計算が必要
  
  // 年柱の計算（西暦年から甲子からの60干支を計算）
  const year = birthDate.getFullYear();
  const stemIndexForYear = (year - 4) % 10;
  const branchIndexForYear = (year - 4) % 12;
  
  const yearStem = heavenlyStems[stemIndexForYear];
  const yearBranch = earthlyBranches[branchIndexForYear];
  
  // 月柱の計算（月から干支を求める、実際はもっと複雑）
  const month = birthDate.getMonth() + 1; // JavaScriptの月は0始まり
  const stemIndexForMonth = (year * 2 + month) % 10;
  const branchIndexForMonth = ((month + 2) % 12);
  
  const monthStem = heavenlyStems[stemIndexForMonth];
  const monthBranch = earthlyBranches[branchIndexForMonth];
  
  // 日柱の計算（1900年1月31日から数えて60干支を巡回）
  // 実際はもっと複雑な立春などの考慮が必要
  const baseDate = new Date(1900, 0, 31); // 1900年1月31日は甲子
  const diffDays = Math.floor((birthDate - baseDate) / (24 * 60 * 60 * 1000));
  const stemIndexForDay = diffDays % 10;
  const branchIndexForDay = diffDays % 12;
  
  const dayStem = heavenlyStems[stemIndexForDay];
  const dayBranch = earthlyBranches[branchIndexForDay];
  
  // 時柱の計算
  // 時間は2時間ごとに支が変わる
  const timeIndex = Math.floor(hour / 2);
  // 日柱の干から時柱の干を求める（簡易版）
  const stemIndexForTime = (stemIndexForDay * 2 + timeIndex) % 10;
  
  const timeStem = heavenlyStems[stemIndexForTime];
  const timeBranch = earthlyBranches[timeIndex];
  
  // 五行属性（簡易版）
  // 干の五行：甲乙=木、丙丁=火、戊己=土、庚辛=金、壬癸=水
  const elementMap = {
    "甲": "wood", "乙": "wood",
    "丙": "fire", "丁": "fire",
    "戊": "earth", "己": "earth",
    "庚": "metal", "辛": "metal",
    "壬": "water", "癸": "water"
  };
  
  const mainElement = elementMap[dayStem];
  const secondaryElement = elementMap[monthStem];
  
  // 陰陽（簡易版）
  // 甲丙戊庚壬=陽、乙丁己辛癸=陰
  const yinYang = ["甲", "丙", "戊", "庚", "壬"].includes(dayStem) ? "陽" : "陰";
  
  // 結果を返す
  return {
    fourPillars: {
      yearPillar: { stem: yearStem, branch: yearBranch },
      monthPillar: { stem: monthStem, branch: monthBranch },
      dayPillar: { stem: dayStem, branch: dayBranch },
      hourPillar: { stem: timeStem, branch: timeBranch }
    },
    elementProfile: {
      mainElement,
      secondaryElement,
      yinYang
    }
  };
}

// 計算を実行
try {
  // 四柱推命計算を実行（簡易版）
  const result = calculateBasicSaju(birthDate, birthHour, gender);
  
  // 結果を表示
  console.log('【1986年5月26日 朝5時 東京生まれの四柱推命計算結果】');
  console.log('==================');
  console.log('【四柱】');
  console.log(`年柱: ${result.fourPillars.yearPillar.stem}${result.fourPillars.yearPillar.branch}`);
  console.log(`月柱: ${result.fourPillars.monthPillar.stem}${result.fourPillars.monthPillar.branch}`);
  console.log(`日柱: ${result.fourPillars.dayPillar.stem}${result.fourPillars.dayPillar.branch}`);
  console.log(`時柱: ${result.fourPillars.hourPillar.stem}${result.fourPillars.hourPillar.branch}`);
  
  // 五行特性
  if (result.elementProfile) {
    console.log('\n【五行特性】');
    console.log(`主要な五行: ${result.elementProfile.mainElement}`);
    console.log(`補助的な五行: ${result.elementProfile.secondaryElement}`);
    console.log(`陰陽: ${result.elementProfile.yinYang}`);
  }
  
  // 注意書き
  console.log('\n※注意：これは簡易計算です。実際の四柱推命ではもっと複雑な計算方法を使用します。');
  console.log('立春の考慮や閏月、節気、地方時の調整なども必要です。');
  
} catch (error) {
  console.error('計算エラー:', error);
}