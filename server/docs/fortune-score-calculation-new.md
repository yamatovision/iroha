# 五行バランス・用神ベース運勢スコア計算アルゴリズム

## 概要

本ドキュメントでは、「五行バランス・用神ベース運勢スコア計算アルゴリズム」の設計と実装について説明します。このアルゴリズムは、ユーザーの五行バランスと用神情報を活用して、より個人化された運勢スコアを計算します。

## アルゴリズムの特徴

1. **五行バランスの考慮**：ユーザーの命式における五行バランスを分析し、日柱の五行が不足している五行を補う場合に高評価を与えます
2. **用神情報の活用**：用神、喜神、忌神、仇神と日柱の関係性を重視します
3. **相生・相剋関係の考慮**：五行間の相互作用を計算に取り入れています

## アルゴリズムの構成要素

### 1. 五行バランス分析

ユーザーの五行プロファイルを分析し、各五行の割合によって状態を判定します：

- **不足**（deficient）: 15%未満
- **均衡**（balanced）: 15%～25%
- **過剰**（excessive）: 25%超

```javascript
function analyzeElementBalance(elementProfile) {
  // 五行の合計値
  const total = elementProfile.wood + elementProfile.fire + elementProfile.earth + 
                elementProfile.metal + elementProfile.water;
  
  // 各五行の状態を判定
  return {
    wood: getBalanceStatus(elementProfile.wood, total),
    fire: getBalanceStatus(elementProfile.fire, total),
    earth: getBalanceStatus(elementProfile.earth, total),
    metal: getBalanceStatus(elementProfile.metal, total),
    water: getBalanceStatus(elementProfile.water, total)
  };
}
```

### 2. 五行バランススコア計算

日柱の五行とユーザーの五行バランスの関係から評価を行います：

- 不足している五行と日柱の五行が一致 → 最高評価 (5.0)
- 過剰な五行と日柱の五行が一致 → 最低評価 (1.5)
- バランスの取れた五行と日柱の五行が一致 → 高評価 (4.0)

```javascript
function calculateElementBalanceScore(elementProfile, dayElement) {
  // 五行バランスの分析
  const balanceStatus = analyzeElementBalance(elementProfile);
  
  // 不足している五行が補われる場合（高評価）
  if (balanceStatus[dayElement] === 'deficient') {
    return 5.0;
  }
  
  // 過剰な五行がさらに強化される場合（低評価）
  if (balanceStatus[dayElement] === 'excessive') {
    return 1.5;
  }
  
  // バランスの取れた五行の場合
  return 4.0;
}
```

### 3. 用神スコア計算

ユーザーの用神情報と日柱の五行の関係から評価を行います：

- 用神と日柱の五行が一致 → 最高評価 (5.0)
- 喜神と日柱の五行が一致 → 高評価 (4.5)
- 忌神と日柱の五行が一致 → 低評価 (2.0)
- 仇神と日柱の五行が一致 → 最低評価 (1.0)

また、相生・相剋関係も考慮します：

- 日柱が用神を生み出す関係 → 高評価 (4.0)
- 日柱が用神を抑制する関係 → 低評価 (2.5)

```javascript
function calculateYojinScore(user, dayElement) {
  // 用神との関係
  if (user.yojin.element === dayElement) {
    return 5.0; // 用神と一致（最高評価）
  }
  
  // 喜神との関係
  if (user.yojin.kijin && user.yojin.kijin.element === dayElement) {
    return 4.5; // 喜神と一致（高評価）
  }
  
  // 忌神との関係
  if (user.yojin.kijin2 && user.yojin.kijin2.element === dayElement) {
    return 2.0; // 忌神と一致（低評価）
  }
  
  // 仇神との関係
  if (user.yojin.kyujin && user.yojin.kyujin.element === dayElement) {
    return 1.0; // 仇神と一致（最低評価）
  }
  
  // 相生・相剋関係の確認
  const isGenerating = isGeneratingRelation(dayElement, user.yojin.element);
  const isControlling = isControllingRelation(dayElement, user.yojin.element);
  
  if (isGenerating) {
    return 4.0; // 日柱が用神を生み出す関係
  } else if (isControlling) {
    return 2.5; // 日柱が用神を抑制する関係
  }
  
  return 3.0; // その他の関係
}
```

### 4. 総合スコア計算

各要素のスコアを重み付けして最終スコアを計算します：

- 五行バランススコア: 40%
- 用神スコア: 40%
- 従来の五行相性スコア: 20%

```javascript
function calculateBalancedFortuneScore(user, heavenlyStem, earthlyBranch, stemElement, branchElement, elementCompatibilityScore) {
  // 五行バランスベースのスコア計算
  let balanceScore = 3.0; // デフォルト値
  if (user.elementProfile) {
    balanceScore = calculateElementBalanceScore(
      user.elementProfile,
      stemElement // 天干の五行を優先
    );
  }
  
  // 用神ベースのスコア計算
  let yojinScore = 3.0; // デフォルト値
  if (user.yojin) {
    yojinScore = calculateYojinScore(user, stemElement);
  }
  
  // 複合スコア計算（重み付け）
  const combinedScore = (
    balanceScore * 0.4 +
    yojinScore * 0.4 +
    elementCompatibilityScore * 0.2
  );
  
  // 0-100スケールに変換
  const rawScore = Math.round(combinedScore * 20);
  return Math.max(0, Math.min(rawScore, 100));
}
```

## 運勢スコアの解釈

計算された0-100スケールの運勢スコアは、従来と同様に5段階に分類されます：

- **excellent（絶好調）**: 80-100点
- **good（好調）**: 60-79点
- **neutral（普通）**: 40-59点
- **poor（やや不調）**: 20-39点
- **bad（不調）**: 0-19点

## 従来アルゴリズムとの比較

| 特徴 | 従来アルゴリズム | 拡張版アルゴリズム | 五行バランス・用神ベースアルゴリズム |
|------|----------------|-------------------|--------------------------------|
| 基本計算 | 五行相性のみ | 十神関係を中心 | 五行バランスと用神情報を活用 |
| 個人化 | 低 | 中 | 高 |
| 理論的根拠 | 基本的な五行相性 | 十神関係（日主から見た天干の関係） | 命式全体のバランスと用神理論 |
| 複雑性 | 低 | 高 | 中 |

## 実装のメリット

1. **理論的整合性**: 四柱推命の本質である「命式全体のバランス」と「用神」の概念を中心に据えています
2. **個人化された評価**: ユーザー固有の五行バランスと用神情報を活用するため、より個人に適した運勢評価が可能です
3. **データの活用**: 既に計算・保存されている格局、用神情報を活用します
4. **計算効率**: 十神ベースより計算ステップが少なく、効率的です

## 結論

「五行バランス・用神ベース運勢スコア計算アルゴリズム」は、四柱推命の根本理論に基づき、ユーザーの命式特性を反映したより個人化された運勢評価を提供します。このアルゴリズムにより、ユーザーは自身の五行バランスや用神との関係からより具体的で実用的なアドバイスを受け取ることができます。