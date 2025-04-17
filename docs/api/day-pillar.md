# 日柱API

## 概要

日柱API（DayPillar API）は、特定の日付の干支（天干地支）日柱情報を提供するエンドポイントを提供します。日柱は四柱推命において日々の運勢や相性を判断するために使用される重要な要素です。

## ベースパス

```
/api/v1/day-pillars
```

## エンドポイント

### 今日の日柱取得

現在の日付の日柱情報を取得します。

**URL:** `GET /api/v1/day-pillars/today`

**認証:** 不要

**成功レスポンス:**
- コード: 200 OK
- 内容:
```json
{
  "date": "2025-04-07",
  "heavenlyStem": "辛",
  "earthlyBranch": "丑",
  "element": "metal",
  "animalSign": "Ox"
}
```

**エラーレスポンス:**
- コード: 500 Internal Server Error
  - 内容: `{ "error": "サーバーエラーが発生しました" }`

### 特定日付の日柱取得

指定された日付の日柱情報を取得します。

**URL:** `GET /api/v1/day-pillars/{date}`

**認証:** 不要

**パスパラメータ:**
- `date`: YYYY-MM-DD形式の日付

**成功レスポンス:**
- コード: 200 OK
- 内容:
```json
{
  "date": "2025-01-01",
  "heavenlyStem": "丙",
  "earthlyBranch": "子",
  "element": "fire",
  "animalSign": "Rat"
}
```

**エラーレスポンス:**
- コード: 400 Bad Request
  - 内容: `{ "error": "無効な日付フォーマットです" }`
- コード: 500 Internal Server Error
  - 内容: `{ "error": "サーバーエラーが発生しました" }`

### 日付範囲の日柱一括取得

指定された日付範囲の日柱情報を一括取得します（管理者権限が必要）。

**URL:** `GET /api/v1/day-pillars?startDate={startDate}&endDate={endDate}`

**認証:** 必須（Bearerトークン）

**リクエストヘッダー:**
```
Authorization: Bearer {Firebase IDトークン}
```

**クエリパラメータ:**
- `startDate`: 開始日（YYYY-MM-DD形式）
- `endDate`: 終了日（YYYY-MM-DD形式）

**成功レスポンス:**
- コード: 200 OK
- 内容:
```json
{
  "count": 7,
  "dayPillars": [
    {
      "date": "2025-01-01",
      "heavenlyStem": "丙",
      "earthlyBranch": "子",
      "element": "fire",
      "animalSign": "Rat"
    },
    {
      "date": "2025-01-02",
      "heavenlyStem": "丁",
      "earthlyBranch": "丑",
      "element": "fire",
      "animalSign": "Ox"
    },
    // ...
  ]
}
```

**エラーレスポンス:**
- コード: 400 Bad Request
  - 内容: `{ "error": "開始日と終了日は必須です" }` または `{ "error": "無効な日付フォーマットです" }` または `{ "error": "終了日は開始日より後である必要があります" }` または `{ "error": "日付範囲は最大30日までです" }`
- コード: 401 Unauthorized
  - 内容: `{ "error": "認証されていません" }`
- コード: 403 Forbidden
  - 内容: `{ "error": "管理者権限が必要です" }`
- コード: 500 Internal Server Error
  - 内容: `{ "error": "サーバーエラーが発生しました" }`

## データモデル

### DayPillar（日柱）

```json
{
  "date": "2025-01-01",
  "heavenlyStem": "丙",
  "earthlyBranch": "子",
  "element": "fire",
  "animalSign": "Rat"
}
```

- `date`: 日付（YYYY-MM-DD形式）
- `heavenlyStem`: 天干（十干の一つ）
- `earthlyBranch`: 地支（十二支の一つ）
- `element`: 五行属性（wood, fire, earth, metal, water）
- `animalSign`: 干支の動物（英語名）

## 実装ノート

日柱APIの実装においては以下の点に注意してください：

1. **日付の計算**:
   - 四柱推命では旧暦（太陰暦）の考え方が一部取り入れられるため、実装には暦の変換が含まれます
   - 太陽暦（グレゴリオ暦）の日付から正確な天干地支を計算するための特殊なアルゴリズムを使用しています

2. **キャッシュ戦略**:
   - 日柱情報は日付ごとに固定されるため、計算結果をキャッシュすることで処理効率を向上させています
   - 日付範囲の取得では、範囲が広すぎる場合はパフォーマンス上の理由から制限（30日まで）を設けています

3. **バッチ処理**:
   - 日柱情報は毎日のバッチ処理で事前に計算・保存されます
   - これにより、APIリクエスト時のレスポンス速度を向上させています