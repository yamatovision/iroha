# 干合・支合機能の実装ドキュメント

## 概要

四柱推命における干合（天干の変化）と支合（地支の五行強化）の処理機能です。この機能により、基本の四柱（年月日時の干支）を計算した後、干合・支合による変化を適用することができます。

## 実装された機能

1. **干合処理** - 隣接する天干の組み合わせによる変化
2. **支合処理** - 隣接する地支の組み合わせによる五行の強化
3. **姻合（妬合）の判定** - 両側から干合を受ける天干の効果打ち消し
4. **支冲による打ち消し** - 地支の対立関係による支合効果の打ち消し

## 干合のルール

### 基本的な干合ペア

| 組み合わせ | 変化 | 五行強化 |
|----------|------|----------|
| 甲己 | 甲→戊 (己は不変) | 土の力量が強まる |
| 乙庚 | 乙→辛 (庚は不変) | 金の力量が強まる |
| 丙辛 | 丙→壬 (辛は不変) | 水の力量が強まる |
| 丁壬 | 丁→乙, 壬→甲 | 木の力量が強まる |
| 戊癸 | 戊→丙, 癸→丁 | 火の力量が強まる |

### 干合の変化条件

干合が発生するためには以下の条件を満たす必要があります：

1. **隣接する柱間の関係であること** - 「年月」「月日」「日時」の間で発生
2. **姻合（妬合）の状態でないこと** - 両側から干合を受けないこと
3. **特定の五行条件を満たすこと**
   - 甲己：月支に土の気が多く、命式に木の気がない
   - 乙庚：月支に金の気が多く、命式に火の気がない
   - 丙辛：月支に水の気が多く、命式に土の気がない
   - 丁壬：月支に木の気が多く、命式に金の気がない
   - 戊癸：月支に火の気が多く、命式に水の気がない

## 支合のルール

### 基本的な支合ペア

| 組み合わせ | 強化される五行 |
|----------|--------------|
| 子丑 | 土 |
| 寅亥 | 木 |
| 卯戌 | 火 |
| 辰酉 | 金 |
| 巳申 | 水 |
| 午未 | 火 |

### 支合の変化条件

支合による五行強化が発生するためには以下の条件を満たす必要があります：

1. **隣接する柱間の関係であること** - 「年月」「月日」「日時」の間で発生
2. **支冲の関係にないこと** - 七番目の地支との対立関係がないこと
3. **両側から支合を受けていないこと** - 妬合に似た状態でないこと
4. **特定の五行条件を満たすこと**
   - 子丑：天干に土の気があり、命式に木の気がない
   - 寅亥：天干に木の気があり、命式に金の気がない
   - 卯戌：天干に火の気があり、命式に水の気がない
   - 辰酉：天干に金の気があり、命式に火の気がない
   - 巳申：天干に水の気があり、命式に土の気がない
   - 午未：天干に火/木の気があり、命式に水の気がない

## 支冲の組み合わせ

支冲は相反する地支の関係で、支合効果を打ち消します：

| 地支 | 対立する地支 |
|------|------------|
| 子 | 午 |
| 丑 | 未 |
| 寅 | 申 |
| 卯 | 酉 |
| 辰 | 戌 |
| 巳 | 亥 |

## 使用方法

### 1. 直接関数を呼び出す方法

```typescript
import { processStemCombinations, processBranchCombinations } from 'sajuengine_package';

// 干合の処理
const stems = ['甲', '己', '戊', '辛']; // 年月日時の天干
const branches = ['寅', '巳', '申', '亥']; // 年月日時の地支
const transformedStems = processStemCombinations(stems, branches);

// 支合の処理
const branchResult = processBranchCombinations(branches, transformedStems);
```

### 2. SajuEngineから利用する方法

```typescript
import { SajuEngine } from 'sajuengine_package';

// SajuEngineのインスタンスを作成
const engine = new SajuEngine();

// 四柱を計算（干合・支合の処理は内部で自動的に実行される）
const result = engine.calculate(new Date(2021, 1, 3), 12);

// 変化があった場合は originalStem プロパティを確認
if (result.fourPillars.yearPillar.originalStem && 
    result.fourPillars.yearPillar.originalStem !== result.fourPillars.yearPillar.stem) {
  console.log(`年柱天干の変化: ${result.fourPillars.yearPillar.originalStem} → ${result.fourPillars.yearPillar.stem}`);
}

// 支合による五行強化を確認
if (result.fourPillars.yearPillar.enhancedElement) {
  console.log(`年柱地支の五行強化: ${result.fourPillars.yearPillar.enhancedElement}`);
}
```

## 実装ファイル

- `src/ganShiCombinations.ts` - 干合・支合処理の核となる実装
- `src/SajuEngine.ts` - 四柱推命計算エンジンへの統合
- `examples/gan-shi-combinations.ts` - 使用例

## テスト方法

干合・支合機能のテストは以下のコマンドで実行できます：

```bash
cd sajuengine_package
npx ts-node examples/gan-shi-combinations.ts
```

さらに詳細なテストは以下で実行できます：

```bash
npx ts-node examples/test-gan-shi.ts
```

## 注意事項

1. 干合・支合は一定の条件を満たした場合にのみ発生します。そのため、多くの命式では変化が発生しません。
2. 干合による天干の変化は、十神関係の計算にも影響します。
3. 支合による地支の五行強化は、命式全体のバランスを見る際に重要です。
4. この実装は四柱推命の伝統的な干合・支合のルールに基づいており、流派によって細部が異なる場合があります。