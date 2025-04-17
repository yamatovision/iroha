# 認証API

## 概要

認証APIは、ユーザーの認証・登録・プロフィール情報の取得などを処理するエンドポイントを提供します。このAPIはFirebase Authenticationと連携しており、トークンベースの認証を使用しています。

## ベースパス

```
/api/v1/auth
```

## エンドポイント

### プロフィール情報取得

認証されたユーザーのプロフィール情報を取得します。

**URL:** `GET /api/v1/auth/profile`

**認証:** 必須（Bearerトークン）

**リクエストヘッダー:**
```
Authorization: Bearer {Firebase IDトークン}
```

**成功レスポンス:**
- コード: 200 OK
- 内容:
```json
{
  "id": "string",
  "email": "string",
  "displayName": "string",
  "role": "user|admin|super_admin",
  "createdAt": "ISO日付",
  "updatedAt": "ISO日付"
}
```

**エラーレスポンス:**
- コード: 401 Unauthorized
  - 内容: `{ "error": "認証されていません" }`
- コード: 404 Not Found
  - 内容: `{ "error": "ユーザーが見つかりません" }`
- コード: 500 Internal Server Error
  - 内容: `{ "error": "サーバーエラーが発生しました" }`

### ユーザー登録

認証後のユーザー情報をデータベースに登録します。Firebase Authenticationで作成されたユーザーに対して追加情報を設定します。

**URL:** `POST /api/v1/auth/register`

**認証:** 必須（Bearerトークン）

**リクエストヘッダー:**
```
Authorization: Bearer {Firebase IDトークン}
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "displayName": "string"
}
```

**成功レスポンス:**
- コード: 201 Created
- 内容:
```json
{
  "id": "string",
  "email": "string",
  "displayName": "string",
  "role": "user",
  "createdAt": "ISO日付",
  "updatedAt": "ISO日付"
}
```

**エラーレスポンス:**
- コード: 400 Bad Request
  - 内容: `{ "error": "表示名は必須です" }` または `{ "error": "ユーザーは既に登録されています" }`
- コード: 401 Unauthorized
  - 内容: `{ "error": "認証されていません" }`
- コード: 500 Internal Server Error
  - 内容: `{ "error": "サーバーエラーが発生しました" }`

### パスワードリセットリクエスト

パスワードリセット用のメールを送信します。

**URL:** `POST /api/v1/auth/password-reset`

**認証:** 不要

**リクエストヘッダー:**
```
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "email": "string"
}
```

**成功レスポンス:**
- コード: 200 OK
- 内容: `{ "message": "パスワードリセットメールを送信しました" }`

**エラーレスポンス:**
- コード: 400 Bad Request
  - 内容: `{ "error": "メールアドレスは必須です" }`
- コード: 500 Internal Server Error
  - 内容: `{ "error": "サーバーエラーが発生しました" }`

## 認証フロー

1. フロントエンドでFirebase Authenticationを使用してユーザーを認証します
2. ログイン成功後、Firebase IDトークンを取得します
3. このトークンをAuthorizationヘッダーに含めて、APIリクエストを行います
4. バックエンドではミドルウェアがトークンを検証し、有効な場合はリクエストを処理します

## エラーコード

| コード | 説明 |
|--------|------|
| 400    | リクエストが不正または必須パラメータが欠けています |
| 401    | 認証が必要か、認証情報が無効です |
| 403    | 権限がありません |
| 404    | リクエストされたリソースが見つかりません |
| 500    | サーバー内部エラー |