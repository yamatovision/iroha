# Sajuエンジンパッケージリファクタリング計画

## 現状分析

### 1. 主要な問題点

1. **型エラー**:
   - `yojinCalculator.ts` で発生している複数の型エラー
   - 引数の型不一致
   - 変数名の重複定義
   - 存在しない変数参照

2. **コード構造の問題**:
   - 関数間の依存関係が複雑
   - 関数シグネチャの一貫性がない
   - Elementプロファイル型の定義が不完全

3. **特に注目すべきエラー**:
   - 変数 `dayStem` の重複宣言
   - 存在しない `tenGodCounts` や `fourPillars` への参照
   - 不完全な `Record<TenGodRelation, number>` 型

### 2. 影響範囲

- `SajuEngine.ts`: 五行バランス計算部分で型エラー
- `yojinCalculator.ts`: 関数シグネチャとロジックに複数の問題
- `types.ts`: ElementProfile型の定義不足

## リファクタリング計画

### Phase 1: 型定義の整理と標準化

#### 1.1 ElementProfile型の拡張
```typescript
// types.ts
export interface ElementProfile {
  mainElement: string;      // 主要五行: wood, fire, earth, metal, water
  secondaryElement: string; // 二次的五行
  yinYang: string;          // 陰陽: '陽' または '陰'
  wood: number;             // 木の強さ
  fire: number;             // 火の強さ
  earth: number;            // 土の強さ
  metal: number;            // 金の強さ
  water: number;            // 水の強さ
}
```

#### 1.2 TenGodAndElement型の追加
```typescript
// types.ts
export interface TenGodWithElement {
  tenGod: TenGodRelation;
  element: string;
  description?: string;
}

// 特殊格局の関連神情報
export interface SpecialKakukyokuGods {
  kijin: TenGodWithElement;
  kijin2: TenGodWithElement;
  kyujin: TenGodWithElement;
}
```

### Phase 2: 用神計算モジュールの再構築

#### 2.1 関数シグネチャの標準化
- 関数の引数と戻り値の型を明確にする
- 日干（dayStem）を一貫した方法で渡す

```typescript
// yojinCalculator.ts
function getDayElementFromStem(stem: string): string {
  // 実装
}

function getSpecialKakukyokuRelatedGods(
  kakukyokuType: string,
  dayStem: string
): SpecialKakukyokuGods {
  // 実装
}

function countTenGods(fourPillars: FourPillars): Record<TenGodRelation, number> {
  // 実装
}
```

#### 2.2 モック機能の追加
- 実装が不完全な部分をモック処理で一時的に置き換える
- 型システムを満たしつつ、実行時のエラーを防止

```typescript
// yojinCalculator.ts
function createMockTenGodCounts(): Record<TenGodRelation, number> {
  return {
    '比肩': 1, '劫財': 1, '食神': 1, '傷官': 1,
    '偏財': 1, '正財': 1, '偏官': 1, '正官': 1,
    '偏印': 1, '正印': 1, 
    // 通変星グループ
    '比劫': 2, '印': 2, '食傷': 2, '財': 2, '官殺': 2,
    // フォールバック
    'なし': 0, '不明': 0
  };
}
```

### Phase 3: 依存関係の整理と関数修正

#### 3.1 重複宣言の解決
- 重複している変数・パラメータの名前変更
- スコープを考慮した変数命名の標準化

```typescript
// 重複パラメータの修正例
function determineRelatedGods(
  yojin: TenGodRelation,
  stemDay: string, // dayStemから名前変更
  kakukyoku: IKakukyoku
): SpecialKakukyokuGods {
  // 実装
}
```

#### 3.2 countTenGods関数の修正と拡張
- 引数の型をanyからFourPillarsに修正
- 不足している十神グループの集計を追加

```typescript
function countTenGods(fourPillars: FourPillars): Record<TenGodRelation, number> {
  const counts: Record<TenGodRelation, number> = {
    // 個別十神
    '比肩': 0, '劫財': 0, '食神': 0, '傷官': 0, '偏財': 0, '正財': 0, '偏官': 0, '正官': 0, '偏印': 0, '正印': 0,
    // 通変星グループ
    '比劫': 0, '印': 0, '食傷': 0, '財': 0, '官殺': 0,
    // フォールバック
    'なし': 0, '不明': 0
  };
  
  // 実装...
  
  // 通変星ペアの集計を追加
  counts['比劫'] = counts['比肩'] + counts['劫財'];
  counts['印'] = counts['偏印'] + counts['正印'];
  counts['食傷'] = counts['食神'] + counts['傷官'];
  counts['財'] = counts['偏財'] + counts['正財'];
  counts['官殺'] = counts['偏官'] + counts['正官'];
  
  return counts;
}
```

### Phase 4: SajuEngine.tsの修正

#### 4.1 calculateElementBalance関数の戻り値型を明示
```typescript
calculateElementBalance(fourPillars: FourPillars): {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}
```

#### 4.2 ElementProfile型のキャスト処理改善
```typescript
// 型を拡張して五行バランスを追加
const extendedProfile: ElementProfile = {
  ...elementProfile,
  wood: elementBalance.wood,
  fire: elementBalance.fire,
  earth: elementBalance.earth,
  metal: elementBalance.metal,
  water: elementBalance.water
};
```

### Phase 5: テストとバグ修正

#### 5.1 ユニットテストの作成
- 各関数の入出力を検証するテストケース作成
- エッジケースと標準ケースの両方をカバー

#### 5.2 E2Eテスト
- 実際の四柱データを使った検証
- 修正前の出力と修正後の出力の比較

## 実装の優先順位

1. **最重要（即時対応）**:
   - ElementProfile型の拡張
   - countTenGods関数の修正
   - 重複変数宣言の解決

2. **高優先度**:
   - SajuEngine.tsのエラー修正
   - 型定義の標準化と拡充

3. **中優先度**:
   - 関数シグネチャの一貫性確保
   - モック機能の実装

4. **低優先度**:
   - コード構造の最適化
   - ドキュメントの改善
   - パフォーマンス最適化

## リスク評価

### 1. 互換性のリスク
- 型の変更により既存のコードが影響を受ける可能性
- **対策**: 既存インターフェースは維持し、拡張のみ行う

### 2. 機能的リスク
- ロジック変更により計算結果が変わる可能性
- **対策**: テストケースで結果を比較検証

### 3. パフォーマンスリスク
- 新しい型チェックによるオーバーヘッド増加の可能性
- **対策**: コンパイル時の型チェックのみで、実行時の追加チェックは最小化

## リファクタリング作業のタイムライン

1. **Week 1**: 型定義の整理とElementProfile型の拡張
2. **Week 2**: yojinCalculator.tsの重複変数解決と関数修正
3. **Week 3**: SajuEngine.tsの型エラー修正
4. **Week 4**: テスト作成と実行、バグ修正

## 結論

このリファクタリング計画は、Sajuエンジンパッケージの型エラーを解消し、コードの堅牢性と保守性を高めることを目的としています。主要な問題が修正されれば、将来的な機能拡張や改善がより容易になり、コードの品質向上につながります。