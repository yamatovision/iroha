/**
 * 簡易版四柱推命計算テストスクリプト
 * 実際の生年月日データを使用して四柱（四本の柱）の基本情報を計算する
 */

// 天干と地支の配列
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// 五行の属性マッピング
const STEM_ELEMENTS = {
  "甲": "木", "乙": "木", 
  "丙": "火", "丁": "火",
  "戊": "土", "己": "土",
  "庚": "金", "辛": "金",
  "壬": "水", "癸": "水"
};

const BRANCH_ELEMENTS = {
  "子": "水", "丑": "土", "寅": "木", "卯": "木",
  "辰": "土", "巳": "火", "午": "火", "未": "土",
  "申": "金", "酉": "金", "戌": "土", "亥": "水"
};

// 簡易版四柱（四本の柱）計算関数
function calculateFourPillars(birthDate, birthHour) {
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;  // JavaScriptの月は0始まり
  const day = birthDate.getDate();
  const hour = birthHour;
  
  // 年柱の計算
  // 天干 = (年 - 4) % 10
  const yearStemIndex = (year - 4) % 10;
  const yearStem = STEMS[yearStemIndex];
  
  // 地支 = (年 - 4) % 12
  const yearBranchIndex = (year - 4) % 12;
  const yearBranch = BRANCHES[yearBranchIndex];
  
  // 月柱の計算
  // 節気を考慮しない簡易版（実際の四柱推命では節気によって月柱が変わる）
  // 天干 = (年の天干のインデックス * 2 + 月) % 10
  const monthStemIndex = (yearStemIndex * 2 + month) % 10;
  const monthStem = STEMS[monthStemIndex];
  
  // 地支 = (月 + 2) % 12 (3月が寅月始まり)
  const monthBranchIndex = (month + 2) % 12 || 12; // 12で割り切れる場合は12を使用
  const monthBranch = BRANCHES[monthBranchIndex - 1]; // 配列は0始まり
  
  // 日柱の計算（簡易版）
  // 元旦からの日数を計算
  const startOfYear = new Date(year, 0, 1); // 1月1日
  const dayOfYear = Math.floor((birthDate - startOfYear) / (24 * 60 * 60 * 1000));
  
  // 元旦の天干地支からの日数を追加
  // 1900年1月1日は「庚子」の日
  const baseYear = 1900;
  const baseStemIndex = 6; // 庚のインデックス
  const baseBranchIndex = 0; // 子のインデックス
  
  // 1900年からの経過日数
  const daysSince1900 = Math.floor((new Date(year, 0, 1) - new Date(baseYear, 0, 1)) / (24 * 60 * 60 * 1000)) + dayOfYear;
  
  // 天干 = (baseStemIndex + daysSince1900) % 10
  const dayStemIndex = (baseStemIndex + daysSince1900) % 10;
  const dayStem = STEMS[dayStemIndex];
  
  // 地支 = (baseBranchIndex + daysSince1900) % 12
  const dayBranchIndex = (baseBranchIndex + daysSince1900) % 12;
  const dayBranch = BRANCHES[dayBranchIndex];
  
  // 時柱の計算
  // 時間は0-23時で、その中で12の時間帯に分ける
  // 子時（23:00-0:59）、丑時（1:00-2:59）...
  const timeIndex = Math.floor((hour + 1) / 2) % 12;
  const hourBranchIndex = timeIndex;
  const hourBranch = BRANCHES[hourBranchIndex];
  
  // 日柱の天干インデックスから時柱の天干を計算
  // 日柱が甲、己の日は甲子の時から始まる
  // 日柱が乙、庚の日は丙子の時から始まる
  // 日柱が丙、辛の日は戊子の時から始まる
  // 日柱が丁、壬の日は庚子の時から始まる
  // 日柱が戊、癸の日は壬子の時から始まる
  let hourStemStartIndex;
  if (dayStemIndex % 5 === 0) {       // 甲、己の日
    hourStemStartIndex = 0;           // 甲子の時から
  } else if (dayStemIndex % 5 === 1) { // 乙、庚の日
    hourStemStartIndex = 2;           // 丙子の時から
  } else if (dayStemIndex % 5 === 2) { // 丙、辛の日
    hourStemStartIndex = 4;           // 戊子の時から
  } else if (dayStemIndex % 5 === 3) { // 丁、壬の日
    hourStemStartIndex = 6;           // 庚子の時から
  } else {                            // 戊、癸の日
    hourStemStartIndex = 8;           // 壬子の時から
  }
  
  const hourStemIndex = (hourStemStartIndex + hourBranchIndex) % 10;
  const hourStem = STEMS[hourStemIndex];
  
  // 結果を返す
  return {
    yearPillar: { stem: yearStem, branch: yearBranch },
    monthPillar: { stem: monthStem, branch: monthBranch },
    dayPillar: { stem: dayStem, branch: dayBranch },
    hourPillar: { stem: hourStem, branch: hourBranch }
  };
}

// 五行の分布を計算
function calculateElementDistribution(pillars) {
  const elements = {
    '木': 0, '火': 0, '土': 0, '金': 0, '水': 0
  };
  
  // 天干の五行をカウント
  elements[STEM_ELEMENTS[pillars.yearPillar.stem]]++;
  elements[STEM_ELEMENTS[pillars.monthPillar.stem]]++;
  elements[STEM_ELEMENTS[pillars.dayPillar.stem]]++;
  elements[STEM_ELEMENTS[pillars.hourPillar.stem]]++;
  
  // 地支の五行をカウント
  elements[BRANCH_ELEMENTS[pillars.yearPillar.branch]]++;
  elements[BRANCH_ELEMENTS[pillars.monthPillar.branch]]++;
  elements[BRANCH_ELEMENTS[pillars.dayPillar.branch]]++;
  elements[BRANCH_ELEMENTS[pillars.hourPillar.branch]]++;
  
  return elements;
}

// 陰陽を判定
function determineYinYang(stem) {
  const stemIndex = STEMS.indexOf(stem);
  return stemIndex % 2 === 0 ? '陽' : '陰';
}

// 生年月日時情報（1986年5月26日 午前5時）
const birthDate = new Date(1986, 4, 26); // 注: JavaScriptの月は0から始まるので5月は4になる
const birthHour = 5; // 午前5時

// 計算実行
const fourPillars = calculateFourPillars(birthDate, birthHour);
const elements = calculateElementDistribution(fourPillars);

// 五行の中で最も多い要素を見つける
let mainElement = '';
let maxCount = 0;
for (const [element, count] of Object.entries(elements)) {
  if (count > maxCount) {
    maxCount = count;
    mainElement = element;
  }
}

// 結果表示
console.log('====== 四柱推命計算結果（簡易版） ======');
console.log('生年月日時:', `${birthDate.getFullYear()}年${birthDate.getMonth() + 1}月${birthDate.getDate()}日 ${birthHour}時`);

// 四柱（年月日時の天干地支）
console.log('\n【四柱】');
console.log('年柱:', `${fourPillars.yearPillar.stem}${fourPillars.yearPillar.branch}`);
console.log('月柱:', `${fourPillars.monthPillar.stem}${fourPillars.monthPillar.branch}`);
console.log('日柱:', `${fourPillars.dayPillar.stem}${fourPillars.dayPillar.branch}`);
console.log('時柱:', `${fourPillars.hourPillar.stem}${fourPillars.hourPillar.branch}`);

// 五行の分布
console.log('\n【五行の分布】');
console.log('木:', elements['木']);
console.log('火:', elements['火']);
console.log('土:', elements['土']);
console.log('金:', elements['金']);
console.log('水:', elements['水']);

// 主要な五行属性
console.log('\n【五行属性】');
console.log('主要属性:', mainElement);
console.log('陰陽:', determineYinYang(fourPillars.dayPillar.stem)); // 日干の陰陽

console.log('\n===== 計算完了 =====');