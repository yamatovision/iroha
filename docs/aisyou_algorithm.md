# 四柱推命の相性診断アルゴリズム

## 1. 基本概念

四柱推命での相性診断は、以下の5つの基準に基づいて行います：

1. 自分と相手の陰陽五行のバランス
2. 蔵干・身強の組み合わせ
3. 自分と相手の日支が支合・三合会局・支沖の関係かどうか
4. 自分の用神・喜神にあたる五行を相手がたくさん持っているか
5. 自分と相手の日干が干合しているかどうか

## 2. 陰陽五行バランスの評価

### 2.1 陰陽のバランス

陽の気が強い人と陰の気が強い人の組み合わせは相性が良いです。陰陽の気質が同質同士の場合は衝突することがあります。

- 陽の気が強い人：日干が「甲」「丙」「戊」「庚」「壬」の人
- 陰の気が強い人：日干が「乙」「丁」「己」「辛」「癸」の人

#### 実装方法
```typescript
// 陽の気の干支
const YANG_GANS = ['甲', '丙', '戊', '庚', '壬'];
// 陰の気の干支
const YIN_GANS = ['乙', '丁', '己', '辛', '癸'];

// 陰陽バランスの相性を評価する関数
function evaluateYinYangBalance(person1DayGan: string, person2DayGan: string): number {
  const isPerson1Yang = YANG_GANS.includes(person1DayGan);
  const isPerson2Yang = YANG_GANS.includes(person2DayGan);
  
  // 陰陽が異なる場合は高いスコア、同じ場合は低いスコア
  if (isPerson1Yang !== isPerson2Yang) {
    return 100; // 最高スコア
  } else {
    return 50; // 中間スコア
  }
}
```

### 2.2 五行の強弱バランス

身強と身弱の組み合わせでも、相性が良いとされます。身強同士や身弱同士は平和な関係ですが、強い相性はありません。

- 身強：命式に自らの五行が多く、エネルギーが外向きの人
- 身弱：命式に自らの五行が少なく、エネルギーが内向きの人

#### 実装方法
```typescript
// 身強弱の相性を評価する関数
function evaluateStrengthBalance(person1IsStrong: boolean, person2IsStrong: boolean): number {
  // 一方が強く一方が弱い場合は高いスコア
  if (person1IsStrong !== person2IsStrong) {
    return 100;
  } 
  // 同士の場合は中間スコア
  else {
    return 70;
  }
}
```

## 3. 日支の関係性評価

### 3.1 日支の組み合わせ

日支同士の相性は、「三合会局」「支合」「支沖」などの関係によって決まります。

- 三合会局：相互補完的で最も良い関係（例：寅・午・戌の組み合わせ）
- 支合：安定した良い関係（例：子と丑、寅と亥など）
- 支沖：刺激的な関係（例：子と午、丑と未など）

#### 実装方法
```typescript
// 三合会局の組み合わせ
const SANGOKAIGYO_GROUPS = [
  ['寅', '午', '戌'], // 火局
  ['亥', '卯', '未'], // 木局
  ['申', '子', '辰'], // 水局
  ['巳', '酉', '丑']  // 金局
];

// 支合の組み合わせ
const SHIGOU_PAIRS = [
  ['子', '丑'],
  ['寅', '亥'],
  ['卯', '戌'],
  ['辰', '酉'],
  ['巳', '申'],
  ['午', '未']
];

// 支沖の組み合わせ
const SHICHU_PAIRS = [
  ['子', '午'],
  ['丑', '未'],
  ['寅', '申'],
  ['卯', '酉'],
  ['辰', '戌'],
  ['巳', '亥']
];

// 日支の関係を評価する関数
function evaluateDayBranchRelationship(person1DayBranch: string, person2DayBranch: string): {
  score: number,
  relationship: string
} {
  // 三合会局かチェック
  for (const group of SANGOKAIGYO_GROUPS) {
    if (group.includes(person1DayBranch) && group.includes(person2DayBranch) && person1DayBranch !== person2DayBranch) {
      return { score: 100, relationship: '三合会局' };
    }
  }
  
  // 支合かチェック
  for (const pair of SHIGOU_PAIRS) {
    if ((pair[0] === person1DayBranch && pair[1] === person2DayBranch) ||
        (pair[1] === person1DayBranch && pair[0] === person2DayBranch)) {
      return { score: 85, relationship: '支合' };
    }
  }
  
  // 支沖かチェック
  for (const pair of SHICHU_PAIRS) {
    if ((pair[0] === person1DayBranch && pair[1] === person2DayBranch) ||
        (pair[1] === person1DayBranch && pair[0] === person2DayBranch)) {
      return { score: 60, relationship: '支沖' };
    }
  }
  
  // どの関係にもない場合
  return { score: 50, relationship: '通常' };
}
```

## 4. 用神・喜神の評価

自分の用神・喜神にあたる五行を相手がたくさん持っている場合、その関係は良好です。

### 4.1 五行と日干の関係

日干の五行によって、用神（必要な五行）と喜神（幸福をもたらす五行）が決まります。

- 例：日干が「木」なら、水が用神で生じる五行、火が喜神で克される五行

#### 実装方法
```typescript
// 干支の五行マッピング
const GAN_TO_ELEMENT = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

const ZHI_TO_ELEMENT = {
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '辰': '土', '戌': '土', '丑': '土', '未': '土',
  '申': '金', '酉': '金',
  '子': '水', '亥': '水'
};

// 相生（生じる）関係
const GENERATES = {
  '木': '火',
  '火': '土',
  '土': '金',
  '金': '水',
  '水': '木'
};

// 相克（克す）関係
const RESTRICTS = {
  '木': '土',
  '土': '水',
  '水': '火',
  '火': '金',
  '金': '木'
};

// 用神・喜神にあたる五行の評価
function evaluateUsefulGods(
  personDayGan: string,
  otherPersonPillars: { gan: string, zhi: string }[]
): number {
  const dayGanElement = GAN_TO_ELEMENT[personDayGan];
  
  // 用神（生じる五行）
  const youjin = GENERATES[dayGanElement];
  // 喜神（克される五行）
  const kijin = RESTRICTS[dayGanElement];
  
  let youjinCount = 0;
  let kijinCount = 0;
  
  // 相手の四柱に含まれる五行をカウント
  for (const pillar of otherPersonPillars) {
    if (GAN_TO_ELEMENT[pillar.gan] === youjin) youjinCount++;
    if (ZHI_TO_ELEMENT[pillar.zhi] === youjin) youjinCount++;
    
    if (GAN_TO_ELEMENT[pillar.gan] === kijin) kijinCount++;
    if (ZHI_TO_ELEMENT[pillar.zhi] === kijin) kijinCount++;
  }
  
  // 用神と喜神の数に基づいてスコア計算
  const totalCount = youjinCount + kijinCount;
  const maxPossibleCount = 8; // 四柱で最大8つの干支
  
  return Math.min(100, (totalCount / maxPossibleCount) * 100);
}
```

## 5. 日干の干合評価

日干同士が干合の関係にある場合、非常に強い結びつきがあります。

### 5.1 干合の組み合わせ

- 甲乙、丙丁、戊己、庚辛、壬癸の組み合わせが干合となります

#### 実装方法
```typescript
// 干合の組み合わせ
const GANGOU_PAIRS = [
  ['甲', '乙'],
  ['丙', '丁'],
  ['戊', '己'],
  ['庚', '辛'],
  ['壬', '癸']
];

// 日干の干合を評価する関数
function evaluateDayGanCombination(person1DayGan: string, person2DayGan: string): {
  score: number,
  isGangou: boolean
} {
  // 干合かチェック
  for (const pair of GANGOU_PAIRS) {
    if ((pair[0] === person1DayGan && pair[1] === person2DayGan) ||
        (pair[1] === person1DayGan && pair[0] === person2DayGan)) {
      return { score: 100, isGangou: true };
    }
  }
  
  // 干合でない場合
  return { score: 50, isGangou: false };
}
```

## 6. 総合評価アルゴリズム

上記の5つの評価基準に基づき、総合的な相性スコアを算出します。各基準には重み付けを行います。

### 6.1 重み付け

1. 陰陽五行バランス評価: 20%
2. 日支の関係性評価: 25%
3. 用神・喜神の評価: 30%
4. 日干の干合評価: 25%

### 6.2 総合評価関数

```typescript
// 総合評価関数
function calculateCompatibilityScore(
  person1: {
    dayGan: string,
    dayZhi: string,
    isStrong: boolean,
    pillars: { gan: string, zhi: string }[]
  },
  person2: {
    dayGan: string,
    dayZhi: string,
    isStrong: boolean,
    pillars: { gan: string, zhi: string }[]
  }
): {
  totalScore: number,
  details: {
    yinYangBalance: number,
    strengthBalance: number,
    dayBranchRelationship: { score: number, relationship: string },
    usefulGods: number,
    dayGanCombination: { score: number, isGangou: boolean }
  }
} {
  // 各評価を実行
  const yinYangBalance = evaluateYinYangBalance(person1.dayGan, person2.dayGan);
  const strengthBalance = evaluateStrengthBalance(person1.isStrong, person2.isStrong);
  const dayBranchRelationship = evaluateDayBranchRelationship(person1.dayZhi, person2.dayZhi);
  const usefulGods1 = evaluateUsefulGods(person1.dayGan, person2.pillars);
  const usefulGods2 = evaluateUsefulGods(person2.dayGan, person1.pillars);
  const usefulGods = (usefulGods1 + usefulGods2) / 2; // 両者の平均
  const dayGanCombination = evaluateDayGanCombination(person1.dayGan, person2.dayGan);
  
  // 重み付け総合スコア計算
  const totalScore = 
    yinYangBalance * 0.2 +
    strengthBalance * 0.2 +
    dayBranchRelationship.score * 0.25 +
    usefulGods * 0.2 +
    dayGanCombination.score * 0.15;
  
  return {
    totalScore: Math.round(totalScore),
    details: {
      yinYangBalance,
      strengthBalance,
      dayBranchRelationship,
      usefulGods,
      dayGanCombination
    }
  };
}
```

## 7. 相性判定基準

総合スコアに基づく相性判定基準は以下の通りです：

- 90〜100点: 最高の相性（非常に相補的で長期的な関係に適する）
- 80〜89点: 優れた相性（お互いを高め合うことができる）
- 70〜79点: 良好な相性（調和が取れている）
- 60〜69点: 普通の相性（特に問題はないが、特筆すべき利点もない）
- 50〜59点: やや難ありの相性（いくつかの課題がある）
- 50点未満: 相性が良くない（多くの課題や衝突がある可能性が高い）

## 8. 具体的な関係性タイプの判定

相性診断の結果に基づき、以下のような具体的な関係性タイプを判定することもできます：

### 8.1 関係性タイプ

1. **理想的パートナー**
   - 条件: 日干が干合 + 日支が三合会局 + 陰陽バランスが良い
   - スコア: 90点以上

2. **良好な協力関係**
   - 条件: 用神・喜神の評価が高い + 身強弱バランスが良い
   - スコア: 80点以上

3. **安定した関係**
   - 条件: 日支が支合 + 陰陽バランスが良い
   - スコア: 70点以上

4. **刺激的な関係**
   - 条件: 日支が支沖 + 用神・喜神の評価が中程度以上
   - スコア: 60点以上

5. **要注意の関係**
   - 条件: 陰陽同質 + 身強弱同質 + 用神・喜神の評価が低い
   - スコア: 60点未満

### 8.2 関係性タイプ判定関数

```typescript
// 関係性タイプを判定する関数
function determineRelationshipType(
  compatibilityResult: {
    totalScore: number,
    details: {
      yinYangBalance: number,
      strengthBalance: number,
      dayBranchRelationship: { score: number, relationship: string },
      usefulGods: number,
      dayGanCombination: { score: number, isGangou: boolean }
    }
  }
): string {
  const { totalScore, details } = compatibilityResult;
  
  // 理想的パートナー
  if (totalScore >= 90 && 
      details.dayGanCombination.isGangou && 
      details.dayBranchRelationship.relationship === '三合会局' && 
      details.yinYangBalance >= 80) {
    return '理想的パートナー';
  }
  
  // 良好な協力関係
  if (totalScore >= 80 && 
      details.usefulGods >= 80 && 
      details.strengthBalance >= 80) {
    return '良好な協力関係';
  }
  
  // 安定した関係
  if (totalScore >= 70 && 
      details.dayBranchRelationship.relationship === '支合' && 
      details.yinYangBalance >= 70) {
    return '安定した関係';
  }
  
  // 刺激的な関係
  if (totalScore >= 60 && 
      details.dayBranchRelationship.relationship === '支沖' && 
      details.usefulGods >= 50) {
    return '刺激的な関係';
  }
  
  // 要注意の関係
  if (totalScore < 60 && 
      details.yinYangBalance < 60 && 
      details.strengthBalance < 60 && 
      details.usefulGods < 50) {
    return '要注意の関係';
  }
  
  // その他の関係
  return '一般的な関係';
}
```

## 9. 具体的な相性診断の例

実際の相性診断を例示します：

### 例1: AさんとBさんの相性

- Aさん（男性）: 日干「甲」（陽木）、日支「午」（陽火）、身強、四柱全体の五行バランスは木と火が多い
- Bさん（女性）: 日干「辛」（陰金）、日支「丑」（陰土）、身弱、四柱全体の五行バランスは金と土が多い

#### 診断結果

1. 陰陽五行バランス: 
   - 陰陽: Aさんは陽、Bさんは陰で相補的 (100点)
   - 身強弱: Aさんは身強、Bさんは身弱で相補的 (100点)

2. 日支の関係:
   - 「午」と「丑」は特定の関係なし (50点)

3. 用神・喜神:
   - Aさんの用神は「水」、喜神は「土」。Bさんは土が多いので好相性。(80点)
   - Bさんの用神は「水」、喜神は「木」。Aさんは木が多いので好相性。(75点)

4. 日干の干合:
   - 「甲」と「辛」は干合ではない (50点)

#### 総合評価
- 総合スコア: 77点 (良好な相性)
- 関係性タイプ: 「良好な協力関係」

## 10. システム実装上の考慮事項

### 10.1 パフォーマンス最適化

- 相性計算は頻繁に行われる可能性があるため、計算結果をキャッシュする
- 四柱データの事前処理と五行変換テーブルのメモリ内保持

### 10.2 拡張性

- 異なる相性診断方法に対応できるよう、アルゴリズムをモジュール化
- 重み付けをシステム設定から調整可能にする

### 10.3 ユーザーフレンドリーな結果表示

- 数値スコアだけでなく、具体的なアドバイスや解説を提供
- 相性の良い点と注意すべき点を明示
- 視覚的なグラフや図での表現（五行バランスチャートなど）

## 11. まとめ

四柱推命の相性診断は、陰陽五行のバランス、日支の関係性、用神・喜神の関係、日干の干合など複数の要素を組み合わせて総合的に評価します。このアルゴリズムを実装することで、ユーザーに価値ある相性診断結果を提供できます。

相性の良さは、単に似ているかどうかではなく、互いに補完し合える関係かどうかにあります。四柱推命の相性診断は、この補完性を多角的に評価する優れた方法と言えるでしょう。