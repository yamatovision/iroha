# SajuEngine - 韓国式四柱推命計算エンジン

高精度な韓国式四柱推命（八字）の計算を行うTypeScriptライブラリです。生年月日時から四柱（年柱・月柱・日柱・時柱）と十神関係を計算し、運勢分析に必要なデータを提供します。

## 機能

- 四柱（年柱・月柱・日柱・時柱）の天干地支を計算
- 日主（日柱天干）に対する十神関係を計算
- 地支の十神関係を高精度に計算（改良アルゴリズム搭載）
- 蔵干（地支に内包される天干）とその十神関係を計算
- 十二運星（十二運）を計算
- 十二神殺（十二神煞）を計算
- 干合・支合の変化を計算（天干の変化と地支の五行強化）
- 立春に基づいた正確な計算
- 地方時調整機能
- 国際対応タイムゾーン調整機能
- 特殊ケース処理による精度向上

## インストール

```bash
npm install saju-engine
```

## 使用方法

```typescript
import { SajuEngine } from 'saju-engine';

// 四柱推命エンジンの初期化
const sajuEngine = new SajuEngine();

// 生年月日と時間から四柱推命情報を計算
const birthDate = new Date(1990, 0, 15); // 1990年1月15日
const birthHour = 13; // 13時 (午後1時)
const gender = 'M'; // 'M'=男性, 'F'=女性
const location = 'Tokyo'; // 位置情報（都市名または経度・緯度）

const result = sajuEngine.calculate(birthDate, birthHour, gender, location);

// 結果を表示
console.log('四柱:', result.fourPillars);
console.log('十神関係:', result.tenGods);
console.log('五行プロファイル:', result.elementProfile);
console.log('十二運星:', result.twelveFortunes);
console.log('十二神殺:', result.twelveSpiritKillers);
```

## 計算結果の解釈

SajuEngineの計算結果は、以下の情報を含みます：

- `fourPillars`: 年柱・月柱・日柱・時柱の情報（天干・地支・十神関係など）
  - `originalStem`: 干合変化前の元の天干（変化した場合のみ）
  - `enhancedElement`: 支合により強化された五行（支合が発生した場合のみ）
- `lunarDate`: 旧暦日付（農暦）
- `tenGods`: 日主（日柱天干）から見た十神関係
- `elementProfile`: 五行プロファイル（主要属性・副次属性・陰陽）
- `twelveFortunes`: 十二運星（十二運）
- `twelveSpiritKillers`: 十二神殺（十二神煞）
- `hiddenStems`: 蔵干（地支に内包される天干）
- `location`: 地理的位置情報（国際対応モード時）
- `timezoneInfo`: タイムゾーン調整情報（国際対応モード時）

## 高度な使用方法

### オプション設定

```typescript
// オプションを指定して初期化
const options = {
  useLocalTime: true, // 地方時調整を有効化（デフォルト）
  useInternationalMode: true, // 国際対応モードを有効化
  useDST: true, // サマータイムを考慮
  useHistoricalDST: true, // 歴史的サマータイムを考慮
  location: {
    longitude: 139.6917, // 経度（東京）
    latitude: 35.6895, // 緯度（東京）
    timeZone: 'Asia/Tokyo' // タイムゾーン
  },
  referenceStandardMeridian: 135 // 標準経度（日本の場合は東経135度）
};
const sajuEngine = new SajuEngine(options);

// 現在時刻の四柱推命情報を取得
const currentSaju = sajuEngine.getCurrentSaju();

// オプションを更新
sajuEngine.updateOptions({ useLocalTime: false });
```

### 干合・支合の確認

```typescript
// 干合・支合を含む四柱計算
const birthDate = new Date(1989, 7, 8); // 1989年8月8日
const birthHour = 14; // 14時
const result = sajuEngine.calculate(birthDate, birthHour);

// 干合による変化を確認
if (result.fourPillars.dayPillar.originalStem && 
    result.fourPillars.dayPillar.originalStem !== result.fourPillars.dayPillar.stem) {
  console.log(`日柱天干の変化: ${result.fourPillars.dayPillar.originalStem} → ${result.fourPillars.dayPillar.stem}`);
}

// 支合による五行強化を確認
if (result.fourPillars.monthPillar.enhancedElement) {
  console.log(`月柱地支の五行強化: ${result.fourPillars.monthPillar.enhancedElement}`);
}
```

## 依存ライブラリ

- `lunar-javascript`: 旧暦変換と天干地支計算のために使用

## ドキュメント

詳細なドキュメントは以下を参照してください：

- [干合・支合機能](./docs/gan-shi-combinations.md)
- [国際対応機能](./docs/international-timezone.md)

## ライセンス

MIT