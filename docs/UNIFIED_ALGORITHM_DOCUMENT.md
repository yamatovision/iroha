# 四柱推命エンジン統合実装ドキュメント

## 概要
このドキュメントは、四柱推命計算エンジン（SajuEngine）の実装詳細と、引き継いだ際の修正箇所および今後の課題について記述します。特に、十神関係計算と地支の十神関係計算などの複雑な部分に焦点を当てています。

## 1. 実装の全体構成

```
sajuengine_package/
├── src/
│   ├── DateTimeProcessor.ts      - 日時処理モジュール
│   ├── SajuEngine.ts             - メインエンジンクラス
│   ├── dayPillarCalculator.ts    - 日柱計算モジュール
│   ├── hourPillarCalculator.ts   - 時柱計算モジュール
│   ├── koreanYearPillarCalculator.ts - 年柱計算モジュール
│   ├── koreanMonthPillarCalculator.ts - 月柱計算モジュール
│   ├── lichunDatabase.ts         - 立春データベース
│   ├── lunarConverter-new.ts     - 旧暦変換モジュール
│   ├── specialCaseHandler.ts     - 特殊ケース処理
│   ├── tenGodBasicData.ts        - 十神計算基本データ
│   ├── tenGodCalculator.ts       - 十神計算モジュール
│   ├── tenGodFixedMapping.ts     - 十神マッピングテーブル
│   ├── tenGodImprovedAlgorithm.ts - 十神計算改良アルゴリズム
│   ├── twelveFortuneSpiritCalculator.ts - 十二運星計算
│   ├── twelveSpiritKillerCalculator.ts - 十二神殺計算
│   └── types.ts                  - 型定義
├── examples/
│   └── basic-usage.ts            - 基本的な使用例
└── dist/                        - ビルド出力ディレクトリ
```

## 2. 主要コンポーネントと機能

### 2.1 SajuEngineクラス

メインの計算エンジンです。生年月日時と場所情報から四柱推命の計算を行います。

```typescript
export class SajuEngine {
  // 初期化
  constructor(options: SajuOptions = {}) {
    this.options = {
      useLocalTime: true, // デフォルトで地方時調整を有効化
      ...options
    };
    this.dateProcessor = new DateTimeProcessor(this.options);
  }

  // 四柱推命計算の実行
  calculate(
    birthDate: Date, 
    birthHour: number, 
    gender?: 'M' | 'F',
    location?: string | { longitude: number, latitude: number }
  ): SajuResult {
    // 1. 日時の前処理（地方時調整と旧暦変換）
    // 2. 年柱計算
    // 3. 日柱計算
    // 4. 月柱計算
    // 5. 時柱計算
    // 6. 十神関係計算
    // 7. 蔵干情報計算
    // 8. 十二運星計算
    // 9. 結果返却
  }

  // 現在の日時の四柱推命情報を取得
  getCurrentSaju(): SajuResult {
    const now = new Date();
    return this.calculate(now, now.getHours());
  }
}
```

### 2.2 DateTimeProcessor

日時の前処理を行うモジュールです。地方時への調整や旧暦変換などを担当します。

```typescript
export class DateTimeProcessor {
  // 日時を前処理
  processDateTime(date: Date, hour: number): ProcessedDateTime {
    // 1. 入力日時の標準化
    // 2. 地方時への調整
    // 3. 旧暦への変換（lunar-javascriptライブラリを使用）
    // 4. 節気情報の取得
    // 5. 結果返却
  }
}
```

### 2.3 十神計算関連モジュール

天干と地支の関係から十神を計算する重要なモジュール群です。

- **tenGodBasicData.ts**: 基本的な五行データと陰陽データを提供
- **tenGodCalculator.ts**: 天干の十神関係を計算する基本機能
- **tenGodFixedMapping.ts**: マッピングテーブルを用いた高精度計算
- **tenGodImprovedAlgorithm.ts**: マッピングと計算ロジックを組み合わせた高精度計算

## 3. 実装上の特徴と工夫

### 3.1 高精度計算のアプローチ

1. **二重計算システム**:
   - lunar-javascriptを使用した方式と、独自計算による方式の二重実装
   - ライブラリが利用できない場合のフォールバック処理

2. **特殊ケース処理**:
   - 立春日や節気変わり目における特殊処理の実装
   - データベースを用いた高精度な判定

3. **多層マッピング**:
   - 純粋計算と固定マッピングの組み合わせによる高精度化
   - 蔵干情報の活用による精度向上

### 3.2 地支の十神関係計算の改良

特に複雑な地支の十神関係計算では、次のような段階的アプローチを採用しています：

1. **第一層: 蔵干の主要天干を利用**
   ```typescript
   // 蔵干の主要天干（最初の蔵干）を取得
   const primaryHiddenStem = hiddenStemsInBranch[0];
   const primaryHiddenStemElement = stemElements[primaryHiddenStem];
   const primaryHiddenStemYin = isStemYin(primaryHiddenStem);
   
   // 蔵干と日主の関係から十神を決定
   if (dayStemElement === primaryHiddenStemElement) {
     // 同じ五行属性で陰陽判定
     return dayStemYin === primaryHiddenStemYin ? '比肩' : '劫財';
   } else if (generatesRelation[dayStemElement] === primaryHiddenStemElement) {
     return dayStemYin === primaryHiddenStemYin ? '食神' : '傷官';
   } // ...他の関係
   ```

2. **第二層: 地支自体の五行を利用**
   ```typescript
   // 蔵干での判定がうまくいかない場合は地支自体の五行で判定
   if (dayStemElement === branchElement) {
     return dayStemYin === branchYin ? '比肩' : '劫財';
   } else if (generatesRelation[dayStemElement] === branchElement) {
     return dayStemYin === branchYin ? '食神' : '傷官';
   } // ...他の関係
   ```

3. **第三層: 特殊パターンの直接マッピング**
   ```typescript
   // 固有のパターンには直接マッピング
   if (dayStem === '甲' && branch === '子') return '偏印';
   if (dayStem === '甲' && branch === '巳') return '傷官';
   // ...他の特殊パターン
   ```

4. **第四層: マッピングテーブルからの参照**
   ```typescript
   // 全てのアルゴリズムが適用できない場合はマッピングテーブルを参照
   return BRANCH_TEN_GOD_MAP[dayStemIdx][branchIdx];
   ```

## 4. 修正・改善事項

### 4.1 型関連の修正

1. TypeScriptの型エラー修正：
   ```typescript
   // 修正前
   const tianGanOffsets = {
     '甲': 1, 
     // ...他の天干
   };
   
   // 修正後
   const tianGanOffsets: Record<string, number> = {
     '甲': 1, 
     // ...他の天干
   };
   ```

2. Record型の活用：
   ```typescript
   // 修正前
   const solarTermToBranchIndex = {
     1: 1,  // 1月 → 丑(1)
     // ...他の月
   };
   
   // 修正後
   const solarTermToBranchIndex: Record<number, number> = {
     1: 1,  // 1月 → 丑(1)
     // ...他の月
   };
   ```

3. 陰陽判定関数の修正：
   ```typescript
   // 修正前
   const dayStemYin = stemYinYang[dayStem] === 'yin';
   
   // 修正後
   const dayStemYin = isStemYin(dayStem);
   ```

### 4.2 lunar-javascriptライブラリとの連携

1. 型定義ファイルの作成：
   ```typescript
   // @types/lunar-javascript.d.ts
   declare module 'lunar-javascript' {
     export class Solar {
       static fromDate(date: any): Solar;
       // ...他のメソッド
     }
     
     export class Lunar {
       getYear(): number;
       // ...他のメソッド
     }
     
     // ...名前空間や他のクラス
   }
   ```

2. 型安全なコード修正：
   ```typescript
   // 修正前
   const jieQiDate = new Date(jieQiList[i].getTime());
   
   // 修正後
   const jieQi = jieQiList[i] as any;
   const jieQiDate = new Date(jieQi.getTime());
   ```

## 5. テスト体制

1. **単体テスト**:
   - 各計算モジュールを個別にテスト
   - 特定の日付パターンでの計算結果を検証

2. **統合テスト**:
   ```typescript
   describe('SajuEngineService', () => {
     it('1986年5月26日 5時 東京 のプロフィールが正しく計算できる', () => {
       // 入力データ設定
       // 計算実行
       // 結果検証
     });
   });
   ```

3. **特殊ケーステスト**:
   - 立春日のテスト
   - 閏月を含む日付のテスト
   - 十神関係計算の精度検証

## 6. 今後の課題と推奨事項

1. **TypeScript型定義の完全整備**
   - すべてのモジュールでの型安全性向上
   - any型の排除

2. **計算精度のさらなる向上**
   - より多くのテストケースによる検証
   - マッピングテーブルの精度検証と改善

3. **パフォーマンス最適化**
   - キャッシュメカニズムの導入
   - 計算負荷の高い部分の最適化

4. **API拡張**
   - より多様な情報を返却できるよう機能拡張
   - 特定用途向けの専用メソッド追加

## 7. 実装例：サーバー側との連携

```typescript
// SajuEngineService の実装
export class SajuEngineService {
  private sajuEngine: SajuEngine;

  constructor() {
    this.sajuEngine = new SajuEngine();
  }

  // 生年月日時から四柱推命プロフィールを計算
  calculateSajuProfile(
    birthDate: Date, 
    birthHour: number, 
    birthMinute: number, 
    gender: string, 
    location: string
  ) {
    // 入力検証
    if (!birthDate) {
      throw new ValidationError('生年月日は必須です');
    }
    
    // 時間計算（分も考慮）
    const hourWithMinutes = birthHour + (birthMinute / 60);
    
    // sajuengine_packageを使用して四柱推命計算
    try {
      // gender を 'M' | 'F' に型キャスト
      const result = this.sajuEngine.calculate(
        birthDate, 
        hourWithMinutes, 
        gender as 'M' | 'F', 
        location
      );
      
      // 型の互換性を確保するための処理
      if (result.lunarDate === null) {
        result.lunarDate = undefined;
      }
      
      return result;
    } catch (error) {
      throw new ValidationError(`四柱推命計算エラー: ${error instanceof Error ? error.message : error}`);
    }
  }
}
```

## 8. 注意事項とリファレンス

1. **依存関係**
   - lunar-javascript: 旧暦計算に利用
   - TypeScript 5.0以上: 型システムの活用

2. **設定ファイル**
   - tsconfig.json: ES2020以上をターゲット
   - package.json: 必要な依存関係の定義

3. **参考文献**
   - 「四柱推命学入門」高島暦研究所
   - 「運命と星」佐藤六龍著
   - API参考: https://lunisolar.js.org/