# 「スタイリスト管理」API仕様書

## 概要

美姫命アプリのスタイリスト管理機能で必要となるAPIエンドポイントの仕様です。既存のAPIを最大限に活用し、最小限の拡張によって美容サロン向けの機能を実現します。

## 必要なAPIエンドポイント

### 1. スタイリスト一覧取得

```typescript
// TypeScript型定義
interface GetStylistsRequest {
  // 管理者IDによるフィルタリング（既存パラメータを活用）
  createdBy?: string;
}

interface StylistData {
  _id: string;
  displayName: string;
  email: string;
  role: 'Admin' | 'User';
  jobTitle?: string;
  profileImage?: string;
  
  // 四柱推命情報の登録状態
  hasSajuProfile: boolean;
  
  // その他の基本情報
  createdAt: string;
  updatedAt: string;
}

interface GetStylistsResponse {
  stylists: StylistData[];
  total: number;
}
```

- **URL**: `/api/v1/users`
- **メソッド**: GET
- **認証**: 必要（Admin権限）
- **クエリパラメータ**: 
  - `createdBy` - 管理者IDによるフィルタリング
  - `role=User` - スタイリスト（Userロール）のみ取得
- **レスポンス**: スタイリスト情報の配列
- **エラーケース**:
  - 401: 認証エラー
  - 403: 権限エラー（Admin権限が必要）
  - 500: サーバーエラー

### 2. スタイリスト詳細取得

```typescript
// TypeScript型定義
interface GetStylistDetailRequest {
  stylistId: string;
}

interface StylistDetailResponse {
  _id: string;
  displayName: string;
  email: string;
  role: 'Admin' | 'User';
  jobTitle?: string;
  profileImage?: string;
  
  // 四柱推命関連情報（登録済みの場合）
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  gender?: string;
  elementAttribute?: string;
  fourPillars?: object;
  // その他の四柱推命関連フィールド
  
  // その他の基本情報
  createdAt: string;
  updatedAt: string;
}
```

- **URL**: `/api/v1/users/{stylistId}`
- **メソッド**: GET
- **認証**: 必要（Admin権限）
- **リクエストパラメータ**: スタイリストID（URL内）
- **レスポンス**: スタイリスト詳細情報
- **エラーケース**:
  - 401: 認証エラー
  - 403: 権限エラー（Admin権限または本人のみアクセス可能）
  - 404: スタイリストが見つからない
  - 500: サーバーエラー

### 3. スタイリスト追加

```typescript
// TypeScript型定義
interface CreateStylistRequest {
  email: string;
  password: string;
  displayName: string;
  jobTitle?: string;
  profileImage?: string;
}

interface CreateStylistResponse {
  _id: string;
  displayName: string;
  email: string;
  role: 'User';
  jobTitle?: string;
  profileImage?: string;
  createdAt: string;
}
```

- **URL**: `/api/v1/users`
- **メソッド**: POST
- **認証**: 必要（Admin権限）
- **リクエストボディ**: スタイリスト情報
- **レスポンス**: 作成されたスタイリスト情報
- **エラーケース**:
  - 400: 不正なリクエスト（入力値の検証エラー）
  - 401: 認証エラー
  - 403: 権限エラー（Admin権限が必要）
  - 409: メールアドレスの重複
  - 500: サーバーエラー

### 4. スタイリスト情報更新

```typescript
// TypeScript型定義
interface UpdateStylistRequest {
  stylistId: string;
  displayName?: string;
  email?: string;
  jobTitle?: string;
  profileImage?: string;
  password?: string; // パスワード変更のみの場合
}

interface UpdateStylistResponse {
  _id: string;
  displayName: string;
  email: string;
  role: 'User';
  jobTitle?: string;
  profileImage?: string;
  updatedAt: string;
}
```

- **URL**: `/api/v1/users/{stylistId}`
- **メソッド**: PUT
- **認証**: 必要（Admin権限または本人）
- **リクエストパラメータ**: スタイリストID（URL内）
- **リクエストボディ**: 更新するスタイリスト情報
- **レスポンス**: 更新されたスタイリスト情報
- **エラーケース**:
  - 400: 不正なリクエスト（入力値の検証エラー）
  - 401: 認証エラー
  - 403: 権限エラー（Admin権限または本人のみ更新可能）
  - 404: スタイリストが見つからない
  - 409: メールアドレスの重複
  - 500: サーバーエラー

### 5. スタイリスト削除

```typescript
// TypeScript型定義
interface DeleteStylistRequest {
  stylistId: string;
}

interface DeleteStylistResponse {
  message: string; // "スタイリストが正常に削除されました"
}
```

- **URL**: `/api/v1/users/{stylistId}`
- **メソッド**: DELETE
- **認証**: 必要（Admin権限）
- **リクエストパラメータ**: スタイリストID（URL内）
- **レスポンス**: 削除確認メッセージ
- **エラーケース**:
  - 401: 認証エラー
  - 403: 権限エラー（Admin権限が必要）
  - 404: スタイリストが見つからない
  - 500: サーバーエラー

### 6. 四柱推命情報更新（既存APIを活用）

```typescript
// TypeScript型定義
interface UpdateSajuProfileRequest {
  userId: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  gender: string;
}

interface UpdateSajuProfileResponse {
  _id: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  gender: string;
  elementAttribute: string;
  fourPillars: object;
  // その他の計算された四柱推命情報
}
```

- **URL**: `/api/v1/users/birth-info`
- **メソッド**: PUT
- **認証**: 必要（Admin権限または本人）
- **リクエストボディ**: 四柱推命基本情報
- **レスポンス**: 更新された四柱推命情報
- **エラーケース**:
  - 400: 不正なリクエスト（入力値の検証エラー）
  - 401: 認証エラー
  - 403: 権限エラー（Admin権限または本人のみ更新可能）
  - 500: サーバーエラー

### 7. 四柱推命情報取得（既存APIを活用）

```typescript
// TypeScript型定義
interface GetSajuProfileRequest {
  userId: string;
}

interface SajuProfileResponse {
  _id: string;
  displayName: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  gender: string;
  elementAttribute: string;
  fourPillars: object;
  kakukyoku: object;
  yojin: object;
  // その他の四柱推命関連情報
}
```

- **URL**: `/api/v1/users/profile`
- **メソッド**: GET
- **認証**: 必要（Admin権限または本人）
- **クエリパラメータ**: `userId` - 取得対象のユーザーID
- **レスポンス**: ユーザーの四柱推命プロファイル情報
- **エラーケース**:
  - 401: 認証エラー
  - 403: 権限エラー（Admin権限または本人のみ取得可能）
  - 404: ユーザーまたはプロファイルが見つからない
  - 500: サーバーエラー

## shared/index.ts 型定義追加

`shared/index.ts`ファイルに以下の型定義を追加します：

```typescript
// 美姫命アプリ - スタイリスト管理関連の型定義

// スタイリスト情報の型（既存のIUser型を拡張）
export interface IStylist extends IUser {
  // IUserの既存フィールドを継承
  
  // 美姫命アプリで特に使用する追加フィールド
  jobTitle?: string;      // 役職情報
  profileImage?: string;  // プロフィール画像URL（任意）
  
  // ヘルパープロパティ（フロントエンド専用）
  hasSajuProfile?: boolean; // 四柱推命情報が登録済みかどうか
}

// スタイリスト検索条件
export interface IStylistFilter {
  createdBy?: string;      // 管理者IDによるフィルタリング
  hasSajuProfile?: boolean; // 四柱推命情報の有無によるフィルタリング
  searchTerm?: string;      // 名前や役職などの検索条件
}
```

## server/src/types/index.ts 型定義追加

`server/src/types/index.ts`ファイルにも同様の型定義を追加します。

## 実装時の注意点

1. **既存APIの活用**:
   - ユーザー（User）モデルとそのAPIを最大限に活用
   - 四柱推命情報の管理には既存のAPIを使用

2. **権限管理**:
   - 管理者（Admin）のみがスタイリスト管理機能にアクセス可能
   - 一部操作（プロフィール閲覧・編集など）はスタイリスト本人も可能

3. **データ整合性**:
   - スタイリスト削除時は関連データの扱いを慎重に検討
   - 特にクライアントとの関連データがある場合は注意

4. **パフォーマンス考慮**:
   - スタイリスト一覧取得時はページネーションを実装
   - 四柱推命情報など大きなデータは必要な場合のみ取得

5. **セキュリティ対策**:
   - パスワード管理は既存システムのセキュリティ機能を活用
   - クロスサイトリクエストフォージェリ（CSRF）対策の実施
   - 入力値のバリデーションを徹底

## 実装優先順位

1. スタイリスト一覧表示機能
2. スタイリスト追加機能
3. スタイリスト情報更新機能
4. 四柱推命情報の連携機能
5. スタイリスト削除機能

## テスト戦略

1. **ユニットテスト**:
   - 各APIエンドポイントの正常系・異常系テスト
   - バリデーションロジックのテスト

2. **統合テスト**:
   - 権限管理の動作確認
   - 四柱推命情報連携フローのテスト

3. **エンドツーエンドテスト**:
   - スタイリスト管理UI（beauty-stylist-management.html）からの操作テスト
   - 実際のユーザーシナリオに基づくテスト