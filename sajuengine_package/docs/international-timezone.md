# 国際タイムゾーン対応機能ガイド

このドキュメントでは、四柱推命エンジン（SajuEngine）の国際タイムゾーン対応機能について説明します。

## 概要

四柱推命計算において、「時柱」は出生時間に基づいて計算されるため、正確なタイムゾーン処理が重要です。国際タイムゾーン対応機能は、世界中の異なるタイムゾーンで生まれた人々の四柱推命プロフィールを正確に計算することを可能にします。

## 主要機能

- **政治的タイムゾーン対応**: IANA/Olsonタイムゾーンデータベースに基づく世界中のタイムゾーン対応
- **歴史的サマータイム対応**: 日本の1948年-1951年のサマータイムなど、歴史的なDST期間の対応
- **座標ベースのタイムゾーン検出**: 緯度・経度を使用して最適なタイムゾーンを判定
- **詳細な時差調整情報**: 政治的タイムゾーン調整、経度ベース調整、DST調整など、時差計算の詳細を提供
- **秒単位の精度対応**: 秒単位まで考慮した高精度計算モード
- **拡張ロケーション情報**: 都市名、国名、座標などを含む拡張された位置情報の対応

## 使用方法

### 基本的な使い方（国際モード有効）

```typescript
import { SajuEngine } from 'sajuengine';

// デフォルトで国際タイムゾーン対応モードが有効
const sajuEngine = new SajuEngine();

// ニューヨークでの出生
const birthDate = new Date('1990-07-15T08:30:00');
const birthHour = 8.5; // 8時30分
const gender = 'M';
const location = 'New York, USA';

// 計算実行
const result = sajuEngine.calculate(birthDate, birthHour, gender, location);

// タイムゾーン情報を表示
console.log('タイムゾーン:', result.timezoneInfo?.politicalTimeZone);
console.log('サマータイム:', result.timezoneInfo?.isDST ? '適用' : '非適用');
console.log('四柱:', 
  `${result.fourPillars.yearPillar.fullStemBranch} ${result.fourPillars.monthPillar.fullStemBranch} ${result.fourPillars.dayPillar.fullStemBranch} ${result.fourPillars.hourPillar.fullStemBranch}`
);
```

### オプション設定

```typescript
import { SajuEngine, SajuOptions } from 'sajuengine';

// オプションの設定
const options: SajuOptions = {
  useInternationalMode: true,   // 国際タイムゾーン対応を有効化（デフォルトでtrue）
  useDST: true,                // サマータイム対応（デフォルトでtrue）
  useHistoricalDST: true,      // 歴史的サマータイム対応（デフォルトでtrue）
  useSecondsPrecision: true,   // 秒単位の精度（デフォルトでtrue）
  useStandardTimeZone: true    // 標準タイムゾーン使用（デフォルトでtrue）
};

// オプション付きで初期化
const sajuEngine = new SajuEngine(options);
```

### 座標指定による計算

```typescript
// 座標で位置情報を指定
const birthDate = new Date('1985-03-21T14:30:00');
const birthHour = 14.5; // 14時30分
const result = sajuEngine.calculate(
  birthDate, 
  birthHour, 
  'F',
  {
    longitude: 2.3522, // 経度（パリ）
    latitude: 48.8566, // 緯度（パリ）
    timeZone: 'Europe/Paris' // オプショナル（指定しなくても自動検出）
  }
);
```

### 拡張ロケーション情報の使用

```typescript
import { SajuEngine, ExtendedLocation } from 'sajuengine';

// 拡張ロケーション情報
const location: ExtendedLocation = {
  name: 'London',
  country: 'United Kingdom',
  coordinates: {
    longitude: -0.1278,
    latitude: 51.5074
  },
  timeZone: 'Europe/London'
};

// 計算実行
const result = sajuEngine.calculate(birthDate, birthHour, gender, location);
```

## 時差調整の詳細

国際タイムゾーン対応モードでは、以下の時差調整が行われます：

1. **政治的タイムゾーン調整**: IANA/Olsonタイムゾーンに基づく地域の公式タイムゾーン
2. **経度ベース調整**: 東経135度（日本標準時）を基準とした実際の経度による時差
3. **サマータイム調整**: 適用されている場合のDSTによる時差調整
4. **歴史的サマータイム**: 日本の1948年-1951年などの特殊なDST期間の処理
5. **地域調整**: 特定地域の特殊な時差調整（必要に応じて）

これらの調整情報は `timezoneInfo` プロパティから取得できます：

```typescript
// 時差調整の詳細情報
const adjustmentDetails = result.timezoneInfo?.adjustmentDetails;
console.log('政治的タイムゾーン調整:', adjustmentDetails?.politicalTimeZoneAdjustment);
console.log('経度ベース調整:', adjustmentDetails?.longitudeBasedAdjustment);
console.log('DST調整:', adjustmentDetails?.dstAdjustment);
console.log('合計調整(分):', adjustmentDetails?.totalAdjustmentMinutes);
```

## サーバーAPIとの連携

SajuEngineの国際タイムゾーン対応機能は、以下のAPI経由で利用することもできます：

- `GET /api/v1/day-pillars/timezone-info` - タイムゾーン情報の取得
- `GET /api/v1/day-pillars/available-cities` - 利用可能な都市リストの取得

### APIの使用例（フロントエンド）

```typescript
import { DAY_PILLAR } from '../shared';

// タイムゾーン情報の取得
const getTimezoneInfo = async (location: string) => {
  const response = await fetch(`${DAY_PILLAR.GET_TIMEZONE_INFO}?location=${encodeURIComponent(location)}`);
  const data = await response.json();
  return data;
};

// 利用可能な都市リストの取得
const getAvailableCities = async () => {
  const response = await fetch(DAY_PILLAR.GET_AVAILABLE_CITIES);
  const data = await response.json();
  return data.cities;
};
```

## 互換性について

国際タイムゾーン対応機能はデフォルトで有効になっていますが、従来の計算方法（日本中心）へ戻すこともできます：

```typescript
// 従来モード（日本中心）での計算
const traditionalEngine = new SajuEngine({ useInternationalMode: false });
```

国際対応モードでも、`useLocalTime` オプションはデフォルトで有効なため、東アジア（日本・韓国など）での計算精度は従来通り維持されています。

## 既知の制限

- 一部の非常に古い時代（1900年以前）については、タイムゾーン情報の精度が低下する場合があります
- 非常に特殊なタイムゾーン（例：半時間単位の時差を持つ地域）については追加の調整が必要な場合があります
- 歴史的なタイムゾーン変更については、主要な変更のみサポートしています

## よくある質問

### Q: 「政治的タイムゾーン」と「経度ベース調整」の違いは何ですか？

A: 「政治的タイムゾーン」は国や地域で公式に採用されているタイムゾーン（例：日本標準時、東部標準時など）を指します。一方、「経度ベース調整」は地球上の実際の位置（経度）に基づく時差で、四柱推命の地方時調整において伝統的に使用される方法です。

### Q: 秒単位の精度はどのような場合に重要ですか？

A: 年末年始や日変わり直前など、時間の切り替わりが近い時刻に生まれた場合、秒単位の精度が四柱の計算結果に影響する可能性があります。特に、時柱が変わる可能性がある場合に重要です。

### Q: 歴史的サマータイムとは何ですか？

A: 過去に特定の期間のみ実施されたサマータイム制度を指します。例えば、日本では1948年から1951年までの期間に夏時間が実施されていました。この期間に生まれた場合、正確な四柱計算のためには歴史的サマータイムの考慮が必要です。
