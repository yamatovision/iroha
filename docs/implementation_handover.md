# DailyFortune 実装引き継ぎ資料

## 0. 四柱推命プロフィールフォーム実装（最新更新）

### 概要

四柱推命計算に必要な出生地の座標情報を取得し、地方時調整を行うための機能を実装しました。
主な改善点は以下の通りです：

1. 出生地の都市選択UI（MUIのAutocomplete）の実装
2. 都市名から座標情報を取得するAPIの実装
3. 座標情報から地方時オフセットを計算するAPIの実装
4. 座標情報と地方時オフセットの視覚的表示

### 実装済みの機能

#### クライアント側

1. **SajuProfileForm.tsx**
   - MUI Autocompleteコンポーネントによる都市選択フォーム
   - 都市名からの座標情報取得
   - 座標情報の表示UI
   - 地方時オフセット情報の表示

2. **saju-profile.service.ts**
   - 都市リスト取得API
   - 座標情報取得API
   - 地方時オフセット計算API

#### サーバー側

1. **saju-engine.service.ts**
   - 都市リスト取得メソッド
   - 座標情報取得メソッド
   - 地方時オフセット計算メソッド

### 未実装部分・課題

#### エンドポイント認証問題

**主な問題**: APItの一部は認証不要で利用できるべきですが、現在は全てのエンドポイントで認証が必要

**解決案**:
1. 認証不要のパスをスキップする例外ロジックを`auth.middleware.ts`に追加
2. パスをVPIとして`/api/v1/public/*`のように分離

**実装優先度**: 高（フォームが正常に動作するために必要）

#### 座標表示のUI改善

**現状**: 座標情報は取得できていますが、ユーザーフレンドリーな表示になっていない

**改善案**:
1. 座標情報を地図上に表示（Googleマップ等の埋め込み）
2. 検索時のローディング表示の改善
3. エラー時のフォールバック処理の強化

**実装優先度**: 中

#### ネットワークエラー処理

**現状**: ネットワークエラー発生時の処理が不十分

**改善案**:
1. リトライ機能の実装
2. エラー時のフォールバック値の設定
3. オフラインモードでの動作

**実装優先度**: 低

### テスト

#### 実装済みテスト
- 座標情報取得テスト（開発中）
- 地方時オフセット計算テスト（開発中）

#### 未実装テスト
- UI操作のE2Eテスト
- エラー状態のテスト
- パフォーマンステスト

### 設計メモ

#### SajuProfileForm入力フローの最適化

1. ユーザーが都市名を入力/選択
2. 座標情報を非同期で取得
3. 座標が取得できたら地方時オフセットを計算
4. オフセット情報をUIに表示し、フォームデータに含める
5. フォーム送信時にプロフィール情報と一緒にサーバーに送信

#### リクエスト最適化

- デバウンス処理により過剰なAPI呼び出しを防止
- 一定の待機時間後に座標取得リクエストを実行
- 都市名が2文字以上入力された場合のみリクエスト実行

### コード例

#### AutoCompleteコンポーネント実装例

```tsx
<Autocomplete
  id="birthplace-autocomplete"
  options={availableCities}
  value={birthPlace}
  onChange={handleCityChange}
  loading={loadingCities}
  freeSolo
  filterOptions={(options, state) => {
    // 2文字以上入力されている場合のみフィルタリングを行う
    if (state.inputValue.length < 2) return [];
    return options.filter(option => 
      option.toLowerCase().includes(state.inputValue.toLowerCase())
    );
  }}
  renderOption={(props, option) => (
    <li {...props}>
      <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'primary.light' }} />
      {option}
    </li>
  )}
  renderInput={(params) => (
    <TextField
      {...params}
      label="出生地"
      fullWidth
      required
      error={!!errors.birthPlace || !!errors.coordinates}
      helperText={errors.birthPlace || errors.coordinates || '都市名を選択または入力してください（2文字以上で検索）'}
      // ...その他のプロパティ
    />
  )}
/>
```

#### 座標情報表示例

```tsx
{birthplaceCoordinates && (
  <Box sx={{ mt: 1, p: 1, borderRadius: 1, bgcolor: 'background.paper', border: '1px dashed', borderColor: 'primary.light' }}>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <LocationOnIcon color="primary" sx={{ mr: 1, fontSize: 18 }} />
      <Typography variant="caption" fontWeight="bold" color="primary.main">
        座標情報
      </Typography>
    </Box>
    <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', pl: 2 }}>
      <Typography variant="caption" color="text.secondary">
        経度: {birthplaceCoordinates.longitude.toFixed(4)}° {birthplaceCoordinates.longitude >= 0 ? '東経' : '西経'}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        緯度: {birthplaceCoordinates.latitude.toFixed(4)}° {birthplaceCoordinates.latitude >= 0 ? '北緯' : '南緯'}
      </Typography>
      
      {localTimeOffset !== null && (
        <Typography 
          variant="caption" 
          sx={{ 
            mt: 0.5, 
            color: 'info.main', 
            bgcolor: 'rgba(3, 169, 244, 0.1)', 
            px: 1, 
            py: 0.2, 
            borderRadius: 1, 
            display: 'inline-flex', 
            alignItems: 'center',
            alignSelf: 'flex-start'
          }}
        >
          <span style={{ fontWeight: 'bold', marginRight: '4px' }}>地方時調整:</span> 
          {localTimeOffset > 0 ? '+' : ''}{localTimeOffset}分
        </Typography>
      )}
    </Box>
  </Box>
)}
```

### API説明

#### 利用可能な都市リスト取得API

**エンドポイント**: `GET /api/v1/saju-profiles/available-cities`  
**認証**: 不要（クライアント側で問題発生中）  
**レスポンス**: 
```json
{
  "cities": ["東京", "大阪", "名古屋", "札幌", "福岡", "ソウル", "北京", ...]
}
```

#### 座標情報取得API

**エンドポイント**: `GET /api/v1/saju-profiles/city-coordinates/:cityName`  
**認証**: 不要（クライアント側で問題発生中）  
**レスポンス**: 
```json
{
  "cityName": "東京",
  "coordinates": {
    "longitude": 139.6917,
    "latitude": 35.6895
  },
  "success": true
}
```

#### 地方時オフセット計算API

**エンドポイント**: `POST /api/v1/saju-profiles/local-time-offset`  
**認証**: 不要（クライアント側で問題発生中）  
**リクエスト**:
```json
{
  "coordinates": {
    "longitude": 139.6917,
    "latitude": 35.6895
  }
}
```
**レスポンス**: 
```json
{
  "coordinates": {
    "longitude": 139.6917,
    "latitude": 35.6895
  },
  "offsetMinutes": 18,
  "success": true
}
```

### テストツール

APIエンドポイントのテスト用に以下のスクリプトを作成しました：

1. `server/scripts/test-saju-endpoints.js` - 認証付きでのAPI呼び出しテスト
2. `server/scripts/simplified-public-api-test.js` - 認証なしでのAPI呼び出しテスト

### 今後の改善事項

1. **認証なしでのAPI利用**
   - 認証不要なエンドポイントの仕組みを追加実装する必要があります
   - 特に`/api/v1/saju-profiles/available-cities`などのエンドポイントは認証なしでアクセスできるべき

2. **都市データの拡充**
   - より多くの都市データを追加
   - 日本の都道府県名や区市町村名のサポート

3. **エラーハンドリングの強化**
   - ネットワークエラー時のフォールバック動作
   - 適切なエラーメッセージ表示

4. **パフォーマンス最適化**
   - 座標データのキャッシング
   - 市区町村データのプリロード

### 参照リンク

- [DateTimeProcessor.ts](../sajuengine_package/src/DateTimeProcessor.ts) - 座標情報と地方時計算のロジック

## 1. 現在の実装状況

### 1.1 四柱推命エンジン（SajuEngine）
- 実装完了:
  - SajuEngine.tsとその依存コンポーネントの実装とテスト
  - TypeScript型対応の修正完了（lunar-javascriptモジュールとの連携）
  - 詳細ドキュメント `UNIFIED_ALGORITHM_DOCUMENT.md` を作成

### 1.2 サーバーAPI実装状況
- 実装済みコンポーネント:
  - SajuProfile API (`/api/v1/saju-profiles`): コントローラ、ルート、サービス
  - DayPillar API (`/api/v1/day-pillars`): コントローラ、ルート、サービス
  - ベース認証システム
  - 日柱生成バッチ処理 (`/src/batch/day-pillar-generator.ts`)
  - バッチ処理スケジューラー (`/src/batch/scheduler.ts`)

- 完了したタスク:
  - 実認証テスト対応（MongoDB userId連携を修正）
  - day-pillar-generator バッチ処理の実装
  - SajuProfile APIテストの修正
  - DayPillar APIテストの実装

### 1.3 フェーズ進行状況
- 現在はフェーズ2「デイリー運勢機能の実装」の準備段階
- フェーズ1「四柱推命プロフィールと日柱データ実装」はバックエンド部分のみ完了
  - フェーズ1.1.1「SajuEngine連携サービス」完了
  - フェーズ1.1.2-1.1.4 (SajuProfile API) 完了
  - フェーズ1.2.1-1.2.3 (DayPillar API) 完了
  - フェーズ1.2.4 (DayPillar APIのユニットテスト) 実認証テスト部分が未完了
  - フェーズ1.3 (フロントエンド - SajuProfile表示コンポーネント) 未着手

## 2. 実装時の注意点

### 2.1 SajuEngine関連
- lunar-javascriptライブラリ連携時の型定義問題:
  - `@types/lunar-javascript.d.ts` を作成して解決
  - 一部メソッドは `as any` でキャストが必要
- SajuEngineサービスの設計:
  - 複数のメソッドを追加して、日柱情報の取得や属性判定などを行うよう実装
  - 実装データは `/server/src/services/saju-engine.service.ts` に集約

### 2.2 MongoDB連携
- SajuProfileモデルでのuserId対応:
  - Firebase UIDとMongoDBのObjectIdの連携を改善
  - userId型をStringに変更して両方に対応できるよう修正済み
  - `server/src/models/SajuProfile.ts`で実装済み

### 2.3 テスト環境
- TestLAB環境の利用:
  - 実認証テスト優先（モックテストより信頼性が高い）
  - `/server/scripts/run-admin-tests.sh` を利用
  - 実テスト実行: `npm test -- --testPathPattern=src/tests/controllers/real-auth-saju-profile.test.ts`
  - 認証情報: `shiraishi.tatsuya@mikoto.co.jp` / `aikakumei`
- MongoDB接続設定:
  - テスト時はMongoMemoryServerを使用すること
  - 認証テストでも環境変数に依存しない実装に修正済み

## 3. 次の実装タスク

### 3.1 優先度高
1. DailyFortune生成バッチ処理の実装:
   - `server/src/batch/daily-fortune-generator.ts` の作成
   - 既存の日柱データを基にした運勢予測の実装
   - DayPillar生成バッチ処理との連携
   - 参考: `docs/implementation_tasks.md` の「2.1.4 運勢更新バッチ処理」セクション

2. DailyFortuneサービスとコントローラーの実装:
   - `server/src/services/fortune.service.ts` の作成
   - `server/src/controllers/daily-fortune.controller.ts` の作成
   - 運勢スコア計算アルゴリズムの実装

### 3.2 優先度中
1. フロントエンド - SajuProfile表示コンポーネント:
   - `client/src/services/saju-profile.service.ts` の実装
   - `client/src/components/profile/SajuProfileCard.tsx` の実装
   - `client/src/pages/Profile/SajuProfileSection.tsx` の実装

2. フロントエンド - 運勢表示コンポーネント:
   - `client/src/services/fortune.service.ts` の実装
   - `client/src/components/fortune/FortuneCard.tsx` の実装
   - `client/src/pages/Fortune/index.tsx` の実装

### 3.3 優先度低
1. その他のユニットテスト:
   - `server/src/tests/services/saju-engine.service.test.ts`
   - `server/src/tests/controllers/day-pillar.controller.test.ts`
   - `server/src/tests/batch/daily-fortune-update.test.ts`

## 4. 実装の詳細メモ

### 4.1 日柱計算の実装
- `getDayPillarByDate`メソッドの実装:
  - 任意の日付を正午に固定して計算
  - 性別・出生地は日柱計算に影響しないため固定値で対応
  - 日柱エネルギーの説明文を生成して返す
  - 実装: `/server/src/services/saju-engine.service.ts`

### 4.2 認証テスト対応
- 実認証テストファイル作成:
  - `real-auth-saju-profile.test.ts`
  - `real-auth-day-pillar.test.ts`
  - withRealAuth()関数を使用して実認証ヘッダーを追加
  - 認証トークンからUIDを抽出してユーザー特定

### 4.3 主要な実装ファイル
- 四柱推命プロファイル関連:
  - `/server/src/services/saju-engine.service.ts` - 四柱推命エンジン連携
  - `/server/src/services/saju-profile.service.ts` - プロフィール管理
  - `/server/src/controllers/saju-profile.controller.ts` - API実装
  - `/server/src/routes/saju-profile.routes.ts` - ルート定義
  - `/server/src/models/SajuProfile.ts` - データモデル

- 日柱データ関連:
  - `/server/src/controllers/day-pillar.controller.ts` - 日柱API
  - `/server/src/routes/day-pillar.routes.ts` - 日柱ルート
  - `/server/src/models/DayPillar.ts` - 日柱データモデル
  - `/server/src/batch/day-pillar-generator.ts` - 日柱生成バッチ

## 5. 残課題

### 5.1 バッチ処理
- DailyFortune更新バッチ処理の実装が必要
- 運勢更新バッチ処理と通知機能の連携が必要
- スケジューラー設定の調整（最適な実行時間の設定）

### 5.2 テスト
- バッチ処理の統合テストの作成
- スケジューラーのテスト実装
- エラーハンドリングのテスト強化
- DayPillar APIの実認証テスト実装
  - `real-auth-day-pillar.test.ts` の基本構造は作成済みだが、より詳細なテストケースが必要
  - バッチ処理との連携テストも実装が必要

### 5.3 ドキュメント
- API仕様書の更新
- データフロードキュメントの更新
- バッチ処理の監視と運用ドキュメントの作成

### 5.4 フロントエンド連携
- SajuProfileコンポーネントの実装
- DayPillar表示コンポーネントの実装
- 日別運勢表示画面の実装

## 6. API設計とデータフロー

### 6.1 SajuProfile API
- `POST /api/v1/saju-profiles` - 四柱推命プロフィール作成
- `GET /api/v1/saju-profiles/me` - 自分のプロフィール取得
- `PUT /api/v1/saju-profiles/me` - プロフィール更新

### 6.2 DayPillar API
- `GET /api/v1/day-pillars/today` - 今日の日柱情報取得
- `GET /api/v1/day-pillars/:date` - 特定日の日柱情報取得
- `GET /api/v1/day-pillars` - 日付範囲の日柱情報取得（管理者用）

### 6.3 DailyFortune API（実装予定）
- `GET /api/v1/daily-fortunes/:userId/today` - 今日の運勢取得
- `GET /api/v1/daily-fortunes/:userId/:date` - 特定日の運勢取得
- `GET /api/v1/teams/:teamId/fortunes/today` - チーム全体の運勢取得
- `GET /api/v1/teams/:teamId/fortunes/ranking` - 運勢ランキング取得

### 6.4 データフロー
1. 日柱生成バッチ処理: 毎日0時に翌日の日柱情報を生成
2. 運勢更新バッチ処理: 毎日3時に全ユーザーの運勢を更新（未実装）
3. ユーザーからの運勢表示リクエスト: キャッシュ済みデータを返却
4. AIチャットでの運勢相談: 運勢データを基にAIが解釈（フェーズ4で実装予定）