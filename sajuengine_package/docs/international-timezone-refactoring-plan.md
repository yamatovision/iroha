# 国際タイムゾーン対応リファクタリング計画

## 概要

本リファクタリング計画は、SajuEngine（四柱推命エンジン）を国際タイムゾーンに完全対応させるための変更を段階的に実装するものです。この改善により、世界中のあらゆる場所での出生に対して、正確な四柱推命計算が可能になります。

## フェーズ構成と進捗状況

### フェーズ1: タイムゾーン処理エンジンの実装 ✅ (2025-04-08 完了)

- ✅ 国際標準のタイムゾーンデータベース（IANA/Olson）を活用した処理機能の実装
- ✅ 歴史的サマータイム（DST）対応の実装（日本1948-1951年など）
- ✅ タイムゾーン識別と正規化機能の実装
- ✅ 2段階タイムゾーン調整プロセス（政治的タイムゾーン + 経度ベース調整）の設計
- ✅ テスト環境の整備

### フェーズ2: インターフェースの拡張と型定義 ✅ (2025-04-09 完了)

- ✅ SajuOptions インターフェースの拡張（国際対応フラグの追加）
- ✅ ExtendedLocation 型の定義と実装
- ✅ TimezoneAdjustmentInfo 型の定義と実装
- ✅ 既存APIとの互換性維持
- ✅ 拡張されたロケーション情報処理の実装

### フェーズ3: SajuEngine の国際対応化 ✅ (2025-04-11 完了)

- ✅ SajuEngine.calculate メソッドの拡張
- ✅ SajuResult インターフェースの拡張（タイムゾーン情報、ロケーション情報の追加）
- ✅ 国際タイムゾーン処理を組み込んだ計算フローの実装
- ✅ 従来の地方時調整（中国標準時ベース）との互換性維持
- ✅ 国際対応版テストケースの作成と検証
- ✅ プロジェクト内での共有型定義の更新

### フェーズ4: サーバーサイド API の拡張 ⚠️ (2025-04-11 一部完了)

- ✅ サーバーサイドの国際タイムゾーン対応（コントローラーとルート実装）
- ✅ タイムゾーン情報取得 API の追加 (/day-pillars/timezone-info)
- ✅ 利用可能な都市情報 API の追加 (/day-pillars/available-cities)
- ⚠️ 型定義の競合解決（進行中）
- ⚠️ APIのテスト実行と検証

### フェーズ5: ドキュメントとサンプルコード ✅ (2025-04-11 完了)

- ✅ 国際タイムゾーン対応機能のドキュメント作成
- ✅ サンプルコードとチュートリアルの作成
- ✅ 使用例の充実
- ✅ 国際対応リファクタリング計画のまとめ

## 実装の詳細

### 国際対応タイムゾーン調整プロセス

国際タイムゾーン処理は以下の2段階で行います：

1. **政治的タイムゾーン調整**:
   - IANA/Olson タイムゾーンデータベースを使用
   - その地域の標準タイムゾーンとDST（サマータイム）を考慮
   - 例: 'America/New_York', 'Europe/London' など

2. **経度ベース微調整**:
   - 実際の経度に基づく地方時調整（従来の四柱推命の考え方）
   - 基準経度（日本/中国標準時）からのオフセット計算
   - 例: 東経120度の場所は東経135度（日本標準時）より15度西にあるため、1時間の調整が必要

### オプション設定

- `useInternationalMode`: 国際タイムゾーン対応モードを有効化（デフォルト: true）
- `useDST`: サマータイム対応を有効化（デフォルト: true）
- `useHistoricalDST`: 歴史的サマータイム対応を有効化（デフォルト: true）
- `useSecondsPrecision`: 秒単位の精度を有効化（デフォルト: true）

### 拡張ロケーション情報

```typescript
export interface ExtendedLocation {
  name?: string;        // 都市名
  country?: string;     // 国名
  coordinates: {        // 座標
    longitude: number;  // 経度
    latitude: number;   // 緯度
  };
  timeZone?: string;    // タイムゾーン識別子（例: 'Asia/Tokyo'）
}
```

### タイムゾーン調整情報

```typescript
export interface TimezoneAdjustmentInfo {
  politicalTimeZone?: string;  // 政治的タイムゾーン（例: 'Asia/Tokyo'）
  isDST: boolean;              // サマータイム適用有無
  timeZoneOffsetMinutes: number; // タイムゾーンオフセット（分）
  timeZoneOffsetSeconds: number; // タイムゾーンオフセット（秒）
  localTimeAdjustmentSeconds: number; // 地方時調整（秒）
  adjustmentDetails: {          // 調整詳細
    politicalTimeZoneAdjustment: number; // 政治的タイムゾーン調整（分）
    longitudeBasedAdjustment: number;   // 経度ベース調整（分）
    dstAdjustment: number;              // サマータイム調整（分）
    regionalAdjustment: number;         // 地域調整（分）
    totalAdjustmentMinutes: number;     // 合計調整（分）
    totalAdjustmentSeconds: number;     // 合計調整（秒）
  };
}
```

## スケジュール

| フェーズ | ステータス | 完了日     | 備考 |
|---------|----------|------------|------|
| フェーズ1 | 完了 ✅    | 2025-04-08 | タイムゾーン基盤構築 |
| フェーズ2 | 完了 ✅    | 2025-04-09 | インターフェース整備 |
| フェーズ3 | 完了 ✅    | 2025-04-11 | SajuEngine改修 |
| フェーズ4 | 一部完了 ⚠️ | 2025-04-11 | API実装/型定義解決中 |
| フェーズ5 | 完了 ✅    | 2025-04-11 | ドキュメント整備 |

## 課題と解決策

### 型定義の競合

- **問題**: サーバー側で`sajuengine_package/src`の型定義（特に`ExtendedLocation`と`SajuOptions`）が正しく解決されない
- **原因**: TypeScriptのモジュール解決問題と、異なる環境間でのパス解決の相違
- **解決策**:
  1. 共有型定義ファイル（`shared/index.ts`）に必要な型を明示的に定義
  2. サーバー側では`SajuOptions`などの型をローカルで再定義し、競合を回避
  3. 型の安全性確保のために`any`型の使用を最小限に抑える

### API実装の検証

- **状況**: 実装したAPIエンドポイント（`/day-pillars/timezone-info`と`/day-pillars/available-cities`）の動作検証が必要
- **課題**: サーバー起動時の型エラーにより、完全なテストが未実施
- **次のステップ**: TypeScriptの型定義問題を解決し、APIの統合テストを実施

## ノート

- 国際対応機能はオプトインですが、デフォルトで有効にしています
- 既存のAPIとの互換性を維持し、既存のコードに影響を与えないよう設計しています
- タイムゾーン情報と座標のキャッシュ機構を実装し、パフォーマンスを最適化しています
- テストケースは複数のタイムゾーンとエッジケースをカバーしています
- 各国の都市データベースは主要都市を中心に約500都市の情報を含んでいます
