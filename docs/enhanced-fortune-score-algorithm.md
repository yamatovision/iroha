# 拡張版 運勢スコア計算アルゴリズム提案

## 概要

本ドキュメントでは、現行の五行相性ベースの運勢スコア計算を拡張し、十神関係と格局情報を組み込んだより洗練されたアルゴリズムを提案します。この拡張アルゴリズムにより、より伝統的な四柱推命の理論に準拠した運勢評価が可能になります。

## 現行アルゴリズムの制限事項

現行の運勢スコア計算では、ユーザーの五行属性と日柱の五行属性の相性のみを考慮しています。これは基本的な相性を評価するには有効ですが、四柱推命の深い洞察には以下の制限があります：

1. **十神関係の無視**: 日主から見た天干の特定の関係（十神）を考慮していない
2. **格局情報の未活用**: ユーザーの命式の特性（身強・身弱など）を反映していない
3. **地支の隠れた要素**: 地支に内包される隠れた天干の影響が計算されていない


  - ユーザーの全体的な五行バランスを考慮するため
  より個人化された評価が可能
  - 用神（喜神・忌神・仇神など）の全てを活用し、
  より深い相性評価ができる



  ユーザーの五行バランス
　用神（喜神・忌神・仇神など）
　日柱

これだけでいいかなと思ってます使うデータ。


問題は、
十神関係という伝統的四柱推命の中核概念を活用

こちらのあるごりずむのほうがいいのか、
それとも今提案しているアルゴリズムの方がいいのかということです



## 十神関係の基本概念

十神は、日主（日柱の天干）から見た他の天干の関係性を表す重要な概念です：

| 十神 | 関係 | 五行関係 | 陰陽 | 基本的な性質 |
|------|------|----------|------|------------|
| 比肩 | 同類 | 同じ五行 | 同じ陰陽 | 協力、同志 |
| 劫財 | 同類 | 同じ五行 | 異なる陰陽 | 競争、闘争心 |
| 食神 | 喜神 | 自分が生む五行 | 陽 | 創造性、楽しみ |
| 傷官 | 喜神 | 自分が生む五行 | 陰 | 表現力、芸術性 |
| 偏財 | 喜神 | 自分を生む五行 | 陽 | 意外な収穫 |
| 正財 | 喜神 | 自分を生む五行 | 陰 | 安定した収入 |
| 偏官 | 忌神 | 自分を克する五行 | 陽 | 権力、抑圧 |
| 正官 | 忌神 | 自分を克する五行 | 陰 | 規律、秩序 |
| 偏印 | 忌神 | 自分が克する五行 | 陽 | 学術、知恵 |
| 印綬 | 忌神 | 自分が克する五行 | 陰 | 権威、サポート |

## 拡張アルゴリズムの設計

### 1. 十神関係スコアの計算

```typescript
/**
 * 日主から見た天干の十神関係に基づいてスコアを算出
 * @param dayMaster 日主（日柱の天干）
 * @param dayStem 評価対象の天干（今日の天干）
 * @returns 0-5スケールのスコア
 */
function getTenGodCompatibility(dayMaster: string, dayStem: string): number {
  // 日主から見た十神関係を判定
  const tenGod = calculateTenGod(dayMaster, dayStem);
  
  // 十神ごとのスコア（0-5スケール）
  switch (tenGod) {
    // 喜神グループ - 基本的に吉
    case '食神': return 5.0;    // 最も吉、創造的エネルギー
    case '傷官': return 4.0;    // 創造的だが少し不安定
    case '偏財': return 4.5;    // 良い機会、外部からの支援
    case '正財': return 4.5;    // 安定した利益
    
    // 同類グループ - 状況による
    case '比肩': return 4.0;    // 協力的なエネルギー
    case '劫財': return 3.5;    // 競合するがエネルギッシュ
    
    // 忌神グループ - 基本的に凶だが活用可能
    case '偏官': return 2.5;    // 強い抑制、チャレンジ
    case '正官': return 3.0;    // 穏やかな抑制、規律
    case '偏印': return 3.5;    // 知恵、学習だが実用性に欠ける
    case '印綬': return 3.8;    // 権威、サポートだが依存的
    
    default: return 3.0;        // 不明の場合はニュートラル
  }
}
```

### 2. 地支の隠れた天干の影響を考慮

```typescript
/**
 * 地支に隠れた天干（通変星）の影響も考慮したスコアを計算
 * @param dayMaster 日主
 * @param dayStem 今日の天干
 * @param dayBranch 今日の地支
 * @returns 調整済み十神スコア
 */
function getModifiedTenGodScore(dayMaster: string, dayStem: string, dayBranch: string): number {
  // 基本の十神スコア
  const baseTenGodScore = getTenGodCompatibility(dayMaster, dayStem);
  
  // 地支の中の通変星（隠れた天干）を取得
  const hiddenStems = getHiddenStems(dayBranch);
  let hiddenStemsScore = 0;
  
  if (hiddenStems.length > 0) {
    // 隠れた天干の十神関係を評価
    for (const hiddenStem of hiddenStems) {
      const hiddenTenGodScore = getTenGodCompatibility(dayMaster, hiddenStem);
      hiddenStemsScore += hiddenTenGodScore;
    }
    hiddenStemsScore /= hiddenStems.length; // 平均スコア
  }
  
  // 基本スコアと隠れた影響の加重平均
  // 天干の影響を70%、隠れた天干の影響を30%として計算
  return baseTenGodScore * 0.7 + (hiddenStemsScore || baseTenGodScore) * 0.3;
}

/**
 * 地支に隠れた天干を返す関数
 * @param branch 地支
 * @returns 隠れた天干の配列
 */
function getHiddenStems(branch: string): string[] {
  const hiddenStemsMap: { [key: string]: string[] } = {
    '子': ['癸'],
    '丑': ['己', '辛', '癸'],
    '寅': ['甲', '丙', '戊'],
    '卯': ['乙'],
    '辰': ['戊', '乙', '癸'],
    '巳': ['丙', '庚', '戊'],
    '午': ['丁', '己'],
    '未': ['己', '乙', '丁'],
    '申': ['庚', '壬', '戊'],
    '酉': ['辛'],
    '戌': ['戊', '辛', '丁'],
    '亥': ['壬', '甲']
  };
  return hiddenStemsMap[branch] || [];
}
```

### 3. 格局に基づく調整

```typescript
/**
 * 格局タイプに基づいて十神スコアを調整
 * @param tenGodScore 基本十神スコア
 * @param kakukyokuStrength 格局の強弱 ('strong'|'weak'|'neutral')
 * @param tenGod 十神関係
 * @returns 調整後のスコア
 */
function adjustScoreByKakukyoku(
  tenGodScore: number, 
  kakukyokuStrength: string, 
  tenGod: string
): number {
  // 身強（日主が強い）の場合
  if (kakukyokuStrength === 'strong') {
    // 身強は財官が喜神、印比が忌神
    if (['偏財', '正財', '偏官', '正官'].includes(tenGod)) {
      return tenGodScore * 1.2; // 20%スコア増加
    } else if (['偏印', '印綬', '比肩', '劫財'].includes(tenGod)) {
      return tenGodScore * 0.8; // 20%スコア減少
    }
  } 
  // 身弱（日主が弱い）の場合
  else if (kakukyokuStrength === 'weak') {
    // 身弱は印比が喜神、財官が忌神
    if (['偏印', '印綬', '比肩', '劫財'].includes(tenGod)) {
      return tenGodScore * 1.2; // 20%スコア増加
    } else if (['偏財', '正財', '偏官', '正官'].includes(tenGod)) {
      return tenGodScore * 0.8; // 20%スコア減少
    }
  }
  // 中和（日主が中庸）の場合は調整なし
  return tenGodScore;
}
```

### 4. ユーザーの用神情報の活用

```typescript
/**
 * ユーザーの用神情報に基づいてスコアを調整
 * @param score 基本スコア
 * @param yojinElement ユーザーの用神五行
 * @param dayElement 今日の天干の五行
 * @returns 調整後のスコア
 */
function adjustScoreByYojin(
  score: number, 
  yojinElement: string, 
  dayElement: string
): number {
  // 今日の五行が用神と一致する場合、スコアを上げる
  if (yojinElement === dayElement) {
    return Math.min(score * 1.3, 5.0); // 最大30%増加（上限5.0）
  }
  
  // 今日の五行が用神を生じさせる関係の場合も好影響
  const generatingRelations: [string, string][] = [
    ['water', 'wood'],  // 水は木を育てる
    ['wood', 'fire'],   // 木は火を燃やす
    ['fire', 'earth'],  // 火は土を作る
    ['earth', 'metal'], // 土は金を生み出す
    ['metal', 'water']  // 金は水を浄化する
  ];
  
  for (const [gen, rec] of generatingRelations) {
    if (dayElement === gen && yojinElement === rec) {
      return Math.min(score * 1.2, 5.0); // 最大20%増加（上限5.0）
    }
  }
  
  return score; // その他の場合は変更なし
}
```

### 5. 総合運勢スコア計算

```typescript
/**
 * 拡張版運勢スコア計算アルゴリズム
 * @param user ユーザー情報（日主、格局、用神情報を含む）
 * @param dayStem 今日の天干
 * @param dayBranch 今日の地支
 * @returns 0-100スケールの運勢スコア
 */
function calculateEnhancedFortuneScore(
  user: any, 
  dayStem: string, 
  dayBranch: string
): number {
  // 1. 現行の五行相性スコア計算
  const stemElement = getStemElement(dayStem);
  const branchElement = getBranchElement(dayBranch);
  const stemCompatibility = calculateElementCompatibility(user.elementAttribute, stemElement);
  const branchCompatibility = calculateElementCompatibility(user.elementAttribute, branchElement);
  const elementCompatibilityScore = stemCompatibility * 0.6 + branchCompatibility * 0.4;
  
  // 2. 十神関係スコア計算
  let tenGodScore = getModifiedTenGodScore(user.dayMaster, dayStem, dayBranch);
  
  // 3. 格局による調整
  if (user.kakukyoku && user.kakukyoku.strength) {
    const tenGod = calculateTenGod(user.dayMaster, dayStem);
    tenGodScore = adjustScoreByKakukyoku(tenGodScore, user.kakukyoku.strength, tenGod);
  }
  
  // 4. 用神による調整
  if (user.yojin && user.yojin.element) {
    tenGodScore = adjustScoreByYojin(tenGodScore, user.yojin.element, stemElement);
  }
  
  // 5. 複合スコアの計算（五行相性50%、十神関係50%）
  const combinedScore = elementCompatibilityScore * 0.5 + tenGodScore * 0.5;
  
  // 6. 0-100スケールへの変換
  const rawScore = Math.round(combinedScore * 20);
  return Math.max(0, Math.min(rawScore, 100)); // 0-100の範囲に確実に収める
}
```

## 運勢スコアの解釈

計算された0-100スケールの運勢スコアは、以下のように5段階の運勢タイプに分類されます：

- **excellent（絶好調）**: 80-100点
  - 非常に良好な一日。創造性、幸運、達成感が高まる
  - 重要な決断や新しい取り組みに最適
  - 用神を活かす活動で大きな進展が期待できる

- **good（好調）**: 60-79点
  - 良好な一日。安定感があり、計画通りに物事が進む
  - 既存のプロジェクトを前進させるのに適している
  - 対人関係も円滑で、協力が得られやすい

- **neutral（普通）**: 40-59点
  - 平均的な一日。特に大きな起伏はない
  - 日常業務や維持活動に適している
  - 無理をせず、基本に忠実に行動すると良い

- **poor（やや不調）**: 20-39点
  - やや注意が必要な一日。細部に気を配り、慎重に行動が必要
  - 重要な決断や新規事業の開始は避けた方が無難
  - 用神を意識し、忌神の影響を最小限に抑える工夫を

- **bad（不調）**: 0-19点
  - 困難が予想される一日。重要な決断は先送りするべき
  - 防御的な姿勢で、既存の成果を守ることに集中
  - 静かに過ごし、エネルギーを温存する日

## 実装上の考慮事項

### 1. 必要なデータ要件

この拡張アルゴリズムを実装するには、以下のユーザーデータが必要です：

- **日主** (`user.dayMaster`): 日柱の天干
- **格局情報** (`user.kakukyoku.strength`): 身強/身弱/中和の状態
- **用神情報** (`user.yojin.element`): 用神の五行属性
- **基本五行属性** (`user.elementAttribute`): ユーザーの基本五行

### 2. パフォーマンスに関する考慮

- 十神関係の計算は、事前に参照テーブルを作成しておくことで最適化可能
- 調整係数（重み付けや増減率）は、実際のユーザーフィードバックに基づいて調整することを推奨

### 3. 段階的実装アプローチ

1. **フェーズ1**: 十神関係の基本スコア計算を実装
2. **フェーズ2**: 格局による調整を追加
3. **フェーズ3**: 用神情報と地支の隠れた天干の影響を組み込む

## まとめ

この拡張版運勢スコア計算アルゴリズムは、従来の五行相性のみに基づく計算を超えて、四柱推命の核心的概念である十神関係、格局、用神を考慮に入れています。これにより、より伝統的な四柱推命の理論に沿った、個人化された運勢評価が可能になります。

運勢スコアはあくまで日々の運気の傾向を示す指標であり、絶対的な予測ではありません。しかし、より洗練された計算方法を採用することで、ユーザーに対してより深いインサイトと有用なガイダンスを提供することができます。

## 移行計画

### フェーズ1: 準備と分析（1-2週間）

1. **データ分析**
   - ユーザーデータベースの分析と必要なフィールドの確認
   - 不足しているデータ（日主、格局、用神情報）の特定
   - 現行アルゴリズムと拡張アルゴリズムの結果比較分析

2. **新規データモデルの設計**
   - User モデルに追加が必要なフィールドの整理
   - 日主情報が存在しない場合の自動生成ロジックの設計
   - 格局・用神情報のデフォルト値や計算ロジックの設計

3. **既存コードの調査**
   - sajuengine_package の tenGodCalculator、kakukyokuCalculator、yojinCalculator との連携調査
   - 現行のスコア計算ロジックの分離と拡張可能な構造への変更計画

### フェーズ2: 基本実装（2-3週間）

1. **十神関係スコア計算モジュールの実装**
   - getTenGodCompatibility 関数の実装
   - getHiddenStems 関数の実装
   - 隠れた天干の影響を考慮した getModifiedTenGodScore 関数の実装

2. **テスト環境の構築**
   - 新旧アルゴリズムの並行実行とスコア比較機能
   - さまざまな日主・格局・日柱組み合わせでのテストケース作成
   - ロギングと分析機能の追加

3. **基本ユーティリティ関数の実装**
   - calculateTenGod 関数の実装または既存 tenGodCalculator との連携
   - 五行相性計算の共通モジュール化

### フェーズ3: 高度機能実装（3-4週間）

1. **格局によるスコア調整の実装**
   - adjustScoreByKakukyoku 関数の実装
   - 格局情報が不足しているユーザーへのフォールバック処理

2. **用神情報によるスコア調整の実装**
   - adjustScoreByYojin 関数の実装
   - 用神情報のロード・検証ロジック

3. **統合ロジックの実装**
   - calculateEnhancedFortuneScore 関数の実装
   - 現行 calculateFortuneScore 関数からの拡張・移行

4. **最適化と調整**
   - 結果分布の分析と調整係数の微調整
   - パフォーマンス最適化（キャッシュなど）

### フェーズ4: テストと検証（2週間）

1. **広範なテスト**
   - 多様なユーザーデータによる結果検証
   - エッジケースのテスト
   - パフォーマンス測定

2. **結果の比較分析**
   - 新旧アルゴリズムのスコア分布比較
   - 極端な差異のある結果の調査

3. **フィードバックループ**
   - テスト結果に基づく調整係数の最終調整

### フェーズ5: デプロイと移行（1-2週間）

1. **段階的ロールアウト計画**
   - AB テストによる段階的導入
   - フィードバックメカニズムの導入

2. **データマイグレーション**
   - 不足データの補完バッチ処理
   - 既存運勢データの再計算（オプション）

3. **モニタリングと調整**
   - デプロイ後のスコア分布監視
   - 必要に応じた最終調整

### フェーズ6: ドキュメントと教育（1週間）

1. **ドキュメント更新**
   - 内部実装ドキュメントの作成
   - 開発者ガイドラインの更新

2. **チーム教育**
   - 新アルゴリズムの概念と動作に関する説明会
   - 運勢スコア解釈ガイドラインの提供

## リスクと対応策

1. **データの不完全性**
   - **リスク**: 一部ユーザーの日主・格局・用神情報が不足
   - **対策**: フォールバックロジックの実装と段階的なデータ収集計画

2. **スコア分布の急激な変化**
   - **リスク**: 新アルゴリズムによるスコア分布の大幅変動
   - **対策**: スケーリング調整と慎重な調整係数選定

3. **パフォーマンス低下**
   - **リスク**: 計算複雑化によるレスポンス時間の増加
   - **対策**: キャッシング戦略と事前計算テーブルの活用

4. **ユーザー混乱**
   - **リスク**: 運勢評価の急な変化によるユーザー混乱
   - **対策**: 変更の事前告知と教育コンテンツの提供

## 結論

この移行計画に従って実装を進めることで、四柱推命の理論に則った、より正確で個人化された運勢評価システムを段階的に導入できます。特に日主、格局、用神といった重要な四柱推命概念を取り入れることで、アプリの専門性と精度を大幅に向上させることが期待できます。