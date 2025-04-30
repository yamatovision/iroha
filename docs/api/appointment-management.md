# 美姫命 - 予約・担当管理 API仕様書

このドキュメントでは、美姫命アプリケーションの予約・担当管理システムのAPI仕様について詳細に説明します。

## 目次

1. [概要](#概要)
2. [認証と認可](#認証と認可)
3. [共通パラメータとレスポンス](#共通パラメータとレスポンス)
4. [予約管理API](#予約管理api)
5. [タイムスロット管理API](#タイムスロット管理api)
6. [スタイリスト割り当てAPI](#スタイリスト割り当てapi)
7. [カレンダー同期API](#カレンダー同期api)
8. [予約分析API](#予約分析api)
9. [エラー処理](#エラー処理)
10. [データ型定義](#データ型定義)

## 概要

予約・担当管理APIは、美容サロンでのクライアント予約管理とスタイリスト割り当てを効率化するためのインターフェースを提供します。四柱推命に基づいた相性スコアを活用してスタイリストの割り当てを最適化することが特徴です。

### ベースURL

```
https://api.bikimei.com/v1
```

## 認証と認可

すべてのAPIリクエストには、JWT認証トークンをAuthorizationヘッダーに含める必要があります。

```
Authorization: Bearer <token>
```

### 権限レベル

APIエンドポイントは、次の権限レベルに基づいてアクセス制御されています：

- `OWNER`: サロンオーナー（最高権限）
- `ADMIN`: 管理者権限
- `STYLIST`: スタイリスト権限
- `PUBLIC`: 認証不要（一部の公開エンドポイントのみ）

## 共通パラメータとレスポンス

### リクエストヘッダー

| ヘッダー名 | 説明 |
|------------|------|
| Authorization | JWT認証トークン。形式: `Bearer <token>` |
| Content-Type | `application/json` |
| Accept-Language | 言語設定（オプション）。デフォルト: `ja` |

### レスポンス形式

すべてのAPIレスポンスは次の形式に統一されています：

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

エラーの場合：

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定された予約が見つかりません",
    "details": { ... }
  }
}
```

## 予約管理API

### 予約一覧の取得

```
GET /appointments
```

指定された条件に基づいて予約一覧を取得します。

#### クエリパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| date | string | × | 指定日付の予約を取得（YYYY-MM-DD形式）。指定がない場合は当日 |
| startDate | string | × | 期間指定の開始日（YYYY-MM-DD形式） |
| endDate | string | × | 期間指定の終了日（YYYY-MM-DD形式） |
| stylistId | string | × | 特定のスタイリストの予約のみを取得 |
| clientId | string | × | 特定のクライアントの予約のみを取得 |
| status | string | × | 予約ステータスでフィルタリング（scheduled, completed, cancelled, no-show） |
| hasAssignedStylist | boolean | × | `true`の場合はスタイリスト割り当て済みの予約のみ、`false`の場合は未割り当ての予約のみ |
| page | number | × | ページ番号（1から開始）。デフォルト: 1 |
| limit | number | × | 1ページあたりの件数。デフォルト: 20、最大: 100 |
| sortBy | string | × | ソート項目（createdAt, startTime）。デフォルト: startTime |
| sortOrder | string | × | ソート順（asc, desc）。デフォルト: asc |

#### レスポンス例

```json
{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "client": {
        "_id": "60d21b4667d0d8992e610c80",
        "name": "山田花子",
        "gender": "female",
        "phone": "090-1234-5678",
        "email": "yamada@example.com"
      },
      "stylist": {
        "_id": "60d21b4667d0d8992e610c82",
        "name": "鈴木一郎",
        "profileImage": "https://example.com/images/suzuki.jpg"
      },
      "timeSlot": {
        "_id": "60d21b4667d0d8992e610c83",
        "startTime": "2025-05-01T10:00:00.000Z",
        "endTime": "2025-05-01T11:30:00.000Z"
      },
      "service": "カット・カラー",
      "notes": "前回よりも明るめの色を希望",
      "status": "scheduled",
      "compatibilityScore": 85,
      "externalCalendarId": "google_calendar_event_id_123",
      "externalCalendarSource": "google",
      "createdAt": "2025-04-20T09:00:00.000Z",
      "updatedAt": "2025-04-25T14:30:00.000Z"
    },
    // ... 他の予約データ
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

### 予約の詳細取得

```
GET /appointments/:id
```

特定の予約の詳細情報を取得します。

#### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| id | string | ○ | 予約ID |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "client": {
      "_id": "60d21b4667d0d8992e610c80",
      "name": "山田花子",
      "gender": "female",
      "phone": "090-1234-5678",
      "email": "yamada@example.com",
      "birthdate": "1990-05-15T00:00:00.000Z",
      "sajuProfile": {
        "yearPillar": {
          "heavenlyStem": "庚",
          "earthlyBranch": "午"
        },
        "monthPillar": {
          "heavenlyStem": "丙",
          "earthlyBranch": "午"
        },
        "dayPillar": {
          "heavenlyStem": "甲",
          "earthlyBranch": "子"
        },
        "hourPillar": {
          "heavenlyStem": "甲",
          "earthlyBranch": "申"
        },
        "elements": {
          "wood": 30,
          "fire": 20,
          "earth": 15,
          "metal": 15,
          "water": 20
        }
      }
    },
    "stylist": {
      "_id": "60d21b4667d0d8992e610c82",
      "name": "鈴木一郎",
      "profileImage": "https://example.com/images/suzuki.jpg",
      "sajuProfile": {
        "yearPillar": {
          "heavenlyStem": "癸",
          "earthlyBranch": "丑"
        },
        "monthPillar": {
          "heavenlyStem": "壬",
          "earthlyBranch": "子"
        },
        "dayPillar": {
          "heavenlyStem": "戊",
          "earthlyBranch": "申"
        },
        "hourPillar": {
          "heavenlyStem": "己",
          "earthlyBranch": "未"
        },
        "elements": {
          "wood": 10,
          "fire": 15,
          "earth": 25,
          "metal": 15,
          "water": 35
        }
      }
    },
    "timeSlot": {
      "_id": "60d21b4667d0d8992e610c83",
      "startTime": "2025-05-01T10:00:00.000Z",
      "endTime": "2025-05-01T11:30:00.000Z",
      "isAvailable": false
    },
    "service": "カット・カラー",
    "notes": "前回よりも明るめの色を希望",
    "status": "scheduled",
    "compatibilityScore": 85,
    "compatibilityReason": "水の要素が互いに補完し合い、クリエイティブな関係性が期待できます",
    "externalCalendarId": "google_calendar_event_id_123",
    "externalCalendarSource": "google",
    "createdAt": "2025-04-20T09:00:00.000Z",
    "updatedAt": "2025-04-25T14:30:00.000Z"
  }
}
```

### 予約の新規作成

```
POST /appointments
```

新しい予約を作成します。

#### リクエストボディ

```json
{
  "clientId": "60d21b4667d0d8992e610c80",
  "stylistId": "60d21b4667d0d8992e610c82",
  "timeSlotId": "60d21b4667d0d8992e610c83",
  "service": "カット・カラー",
  "notes": "前回よりも明るめの色を希望",
  "status": "scheduled"
}
```

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| clientId | string | ○ | クライアントID |
| stylistId | string | × | スタイリストID（未割り当ての場合は省略可能） |
| timeSlotId | string | ○ | タイムスロットID |
| service | string | ○ | 予約サービス内容 |
| notes | string | × | 備考・メモ |
| status | string | × | 予約ステータス。デフォルト: "scheduled" |
| externalCalendarId | string | × | 外部カレンダーイベントID（同期用） |
| externalCalendarSource | string | × | 外部カレンダーソース（"google"または"apple"） |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "client": {
      "_id": "60d21b4667d0d8992e610c80",
      "name": "山田花子"
    },
    "stylist": {
      "_id": "60d21b4667d0d8992e610c82",
      "name": "鈴木一郎"
    },
    "timeSlot": {
      "_id": "60d21b4667d0d8992e610c83",
      "startTime": "2025-05-01T10:00:00.000Z",
      "endTime": "2025-05-01T11:30:00.000Z"
    },
    "service": "カット・カラー",
    "notes": "前回よりも明るめの色を希望",
    "status": "scheduled",
    "compatibilityScore": 85,
    "createdAt": "2025-04-29T09:00:00.000Z",
    "updatedAt": "2025-04-29T09:00:00.000Z"
  }
}
```

### 予約の更新

```
PUT /appointments/:id
```

既存の予約情報を更新します。

#### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| id | string | ○ | 予約ID |

#### リクエストボディ

```json
{
  "stylistId": "60d21b4667d0d8992e610c87",
  "timeSlotId": "60d21b4667d0d8992e610c90",
  "service": "カット・カラー・トリートメント",
  "notes": "カラーは赤みを抑えた茶色希望",
  "status": "scheduled"
}
```

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| clientId | string | × | クライアントID |
| stylistId | string | × | スタイリストID |
| timeSlotId | string | × | タイムスロットID |
| service | string | × | 予約サービス内容 |
| notes | string | × | 備考・メモ |
| status | string | × | 予約ステータス |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "client": {
      "_id": "60d21b4667d0d8992e610c80",
      "name": "山田花子"
    },
    "stylist": {
      "_id": "60d21b4667d0d8992e610c87",
      "name": "田中美咲"
    },
    "timeSlot": {
      "_id": "60d21b4667d0d8992e610c90",
      "startTime": "2025-05-01T13:00:00.000Z",
      "endTime": "2025-05-01T15:00:00.000Z"
    },
    "service": "カット・カラー・トリートメント",
    "notes": "カラーは赤みを抑えた茶色希望",
    "status": "scheduled",
    "compatibilityScore": 72,
    "updatedAt": "2025-04-29T10:15:00.000Z"
  }
}
```

### 予約ステータスの更新

```
PUT /appointments/:id/status
```

予約ステータスのみを更新します。スタイリストも更新可能なエンドポイントです。

#### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| id | string | ○ | 予約ID |

#### リクエストボディ

```json
{
  "status": "completed"
}
```

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| status | string | ○ | 予約ステータス（"scheduled", "completed", "cancelled", "no-show"のいずれか） |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "status": "completed",
    "updatedAt": "2025-05-01T11:45:00.000Z"
  }
}
```

### 予約の削除

```
DELETE /appointments/:id
```

予約を削除します。

#### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| id | string | ○ | 予約ID |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "message": "予約が正常に削除されました",
    "id": "60d21b4667d0d8992e610c85"
  }
}
```

## タイムスロット管理API

### タイムスロット一覧の取得

```
GET /timeslots
```

指定された日付のタイムスロット一覧を取得します。

#### クエリパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| date | string | ○ | 指定日付（YYYY-MM-DD形式） |
| stylistId | string | × | 特定のスタイリストのタイムスロットのみを取得 |
| available | boolean | × | 利用可能なタイムスロットのみを取得する場合は`true` |

#### レスポンス例

```json
{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c83",
      "startTime": "2025-05-01T10:00:00.000Z",
      "endTime": "2025-05-01T10:30:00.000Z",
      "isAvailable": false,
      "appointment": {
        "_id": "60d21b4667d0d8992e610c85",
        "client": {
          "_id": "60d21b4667d0d8992e610c80",
          "name": "山田花子"
        },
        "service": "カット・カラー"
      }
    },
    {
      "_id": "60d21b4667d0d8992e610c84",
      "startTime": "2025-05-01T10:30:00.000Z",
      "endTime": "2025-05-01T11:00:00.000Z",
      "isAvailable": true,
      "appointment": null
    },
    // ... 他のタイムスロット
  ],
  "meta": {
    "total": 32
  }
}
```

### タイムスロットの作成

```
POST /timeslots
```

新しいタイムスロットを作成します。

#### リクエストボディ

```json
{
  "startTime": "2025-05-01T14:00:00.000Z",
  "endTime": "2025-05-01T14:30:00.000Z",
  "isAvailable": true,
  "stylistId": "60d21b4667d0d8992e610c82"
}
```

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| startTime | string | ○ | 開始時間（ISO 8601形式） |
| endTime | string | ○ | 終了時間（ISO 8601形式） |
| isAvailable | boolean | × | 利用可能フラグ。デフォルト: true |
| stylistId | string | × | 特定のスタイリスト用のタイムスロットの場合に指定 |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c95",
    "startTime": "2025-05-01T14:00:00.000Z",
    "endTime": "2025-05-01T14:30:00.000Z",
    "isAvailable": true,
    "stylist": {
      "_id": "60d21b4667d0d8992e610c82",
      "name": "鈴木一郎"
    },
    "createdAt": "2025-04-29T09:00:00.000Z"
  }
}
```

### タイムスロットの一括作成

```
POST /timeslots/bulk
```

複数のタイムスロットを一括で作成します。営業時間の設定などに利用します。

#### リクエストボディ

```json
{
  "date": "2025-05-01",
  "startHour": 10,
  "endHour": 18,
  "intervalMinutes": 30,
  "excludedTimes": ["12:00-13:00"],
  "stylistIds": ["60d21b4667d0d8992e610c82", "60d21b4667d0d8992e610c87"]
}
```

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| date | string | ○ | 対象日付（YYYY-MM-DD形式） |
| startHour | number | ○ | 開始時間（0-23） |
| endHour | number | ○ | 終了時間（0-23） |
| intervalMinutes | number | ○ | 時間間隔（分） |
| excludedTimes | array | × | 除外する時間帯（"HH:MM-HH:MM"形式の配列） |
| stylistIds | array | × | 対象スタイリストID（指定がない場合はサロン全体のタイムスロット） |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "message": "タイムスロットが正常に作成されました",
    "count": 32,
    "date": "2025-05-01"
  }
}
```

### タイムスロットの更新

```
PUT /timeslots/:id
```

既存のタイムスロット情報を更新します。

#### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| id | string | ○ | タイムスロットID |

#### リクエストボディ

```json
{
  "startTime": "2025-05-01T14:30:00.000Z",
  "endTime": "2025-05-01T15:00:00.000Z",
  "isAvailable": false
}
```

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| startTime | string | × | 開始時間（ISO 8601形式） |
| endTime | string | × | 終了時間（ISO 8601形式） |
| isAvailable | boolean | × | 利用可能フラグ |
| stylistId | string | × | スタイリストID |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c95",
    "startTime": "2025-05-01T14:30:00.000Z",
    "endTime": "2025-05-01T15:00:00.000Z",
    "isAvailable": false,
    "updatedAt": "2025-04-29T10:15:00.000Z"
  }
}
```

### タイムスロットの削除

```
DELETE /timeslots/:id
```

タイムスロットを削除します。

#### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| id | string | ○ | タイムスロットID |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "message": "タイムスロットが正常に削除されました",
    "id": "60d21b4667d0d8992e610c95"
  }
}
```

## スタイリスト割り当てAPI

### 予約へのスタイリスト割り当て

```
PUT /appointments/:id/stylist
```

予約に対してスタイリストを割り当てます。

#### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| id | string | ○ | 予約ID |

#### リクエストボディ

```json
{
  "stylistId": "60d21b4667d0d8992e610c82"
}
```

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| stylistId | string | ○ | 割り当てるスタイリストのID |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "client": {
      "_id": "60d21b4667d0d8992e610c80",
      "name": "山田花子"
    },
    "stylist": {
      "_id": "60d21b4667d0d8992e610c82",
      "name": "鈴木一郎"
    },
    "compatibilityScore": 85,
    "updatedAt": "2025-04-29T11:30:00.000Z"
  }
}
```

### 推奨スタイリスト一覧取得

```
GET /appointments/:id/recommended-stylists
```

予約に対して相性スコアに基づく推奨スタイリスト一覧を取得します。

#### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| id | string | ○ | 予約ID |

#### クエリパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| limit | number | × | 取得する最大スタイリスト数。デフォルト: 5 |

#### レスポンス例

```json
{
  "success": true,
  "data": [
    {
      "stylist": {
        "_id": "60d21b4667d0d8992e610c82",
        "name": "鈴木一郎",
        "profileImage": "https://example.com/images/suzuki.jpg"
      },
      "compatibilityScore": 85,
      "compatibilityReason": "水の要素が互いに補完し合い、クリエイティブな関係性が期待できます"
    },
    {
      "stylist": {
        "_id": "60d21b4667d0d8992e610c87",
        "name": "田中美咲",
        "profileImage": "https://example.com/images/tanaka.jpg"
      },
      "compatibilityScore": 72,
      "compatibilityReason": "木の要素と火の要素のバランスが良好です"
    },
    // ... 他のスタイリスト
  ]
}
```

### クライアントとの相性スコア計算

```
GET /compatibility/client/:clientId/stylist/:stylistId
```

特定のクライアントとスタイリストの相性スコアを計算します。

#### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| clientId | string | ○ | クライアントID |
| stylistId | string | ○ | スタイリストID |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "compatibilityScore": 85,
    "compatibilityDetails": {
      "elementCompatibility": {
        "wood": 80,
        "fire": 75,
        "earth": 90,
        "metal": 85,
        "water": 95
      },
      "pillarsCompatibility": {
        "yearPillar": 70,
        "monthPillar": 85,
        "dayPillar": 90,
        "hourPillar": 80
      }
    },
    "compatibilityReason": "水の要素が互いに補完し合い、クリエイティブな関係性が期待できます",
    "recommendedStyles": [
      "ナチュラルウェーブ",
      "グラデーションカラー",
      "ソフトレイヤー"
    ]
  }
}
```

## カレンダー同期API

### Google認証URLの取得

```
GET /calendar/auth/google
```

Googleカレンダー認証のためのOAuth URLを取得します。

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "url": "https://accounts.google.com/o/oauth2/auth?client_id=...&redirect_uri=...&scope=https://www.googleapis.com/auth/calendar&response_type=code&access_type=offline"
  }
}
```

### Google認証コールバック

```
GET /calendar/auth/google/callback
```

Google OAuth認証コールバックを処理します。

#### クエリパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| code | string | ○ | Google認証コード |
| state | string | × | 状態トークン |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "message": "Googleカレンダーとの連携が完了しました",
    "provider": "google",
    "connected": true
  }
}
```

### Googleカレンダー同期実行

```
POST /calendar/sync/google
```

Googleカレンダーとの同期を実行します。

#### リクエストボディ

```json
{
  "startDate": "2025-05-01",
  "endDate": "2025-05-31"
}
```

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| startDate | string | × | 同期開始日（YYYY-MM-DD形式）。デフォルト: 今日 |
| endDate | string | × | 同期終了日（YYYY-MM-DD形式）。デフォルト: 30日後 |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "message": "同期が完了しました",
    "stats": {
      "totalEvents": 45,
      "created": 12,
      "updated": 5,
      "deleted": 2,
      "skipped": 26
    },
    "syncedAt": "2025-04-29T12:00:00.000Z"
  }
}
```

### Apple認証URLの取得

```
GET /calendar/auth/apple
```

Appleカレンダー認証のためのURLを取得します。

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "url": "https://appleid.apple.com/auth/authorize?client_id=...&redirect_uri=...&response_type=code&scope=..."
  }
}
```

### Apple認証コールバック

```
GET /calendar/auth/apple/callback
```

Apple認証コールバックを処理します。

#### クエリパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| code | string | ○ | Apple認証コード |
| state | string | × | 状態トークン |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "message": "Appleカレンダーとの連携が完了しました",
    "provider": "apple",
    "connected": true
  }
}
```

### Appleカレンダー同期実行

```
POST /calendar/sync/apple
```

Appleカレンダーとの同期を実行します。

#### リクエストボディ

```json
{
  "startDate": "2025-05-01",
  "endDate": "2025-05-31"
}
```

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| startDate | string | × | 同期開始日（YYYY-MM-DD形式）。デフォルト: 今日 |
| endDate | string | × | 同期終了日（YYYY-MM-DD形式）。デフォルト: 30日後 |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "message": "同期が完了しました",
    "stats": {
      "totalEvents": 30,
      "created": 8,
      "updated": 3,
      "deleted": 1,
      "skipped": 18
    },
    "syncedAt": "2025-04-29T12:10:00.000Z"
  }
}
```

### カレンダー同期状態の取得

```
GET /calendar/sync/status
```

カレンダー同期の状態を取得します。

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "google": {
      "connected": true,
      "lastSyncedAt": "2025-04-29T12:00:00.000Z",
      "nextSyncAt": "2025-04-29T13:00:00.000Z",
      "tokenExpiry": "2025-05-29T12:00:00.000Z"
    },
    "apple": {
      "connected": true,
      "lastSyncedAt": "2025-04-29T12:10:00.000Z",
      "nextSyncAt": "2025-04-29T13:10:00.000Z",
      "tokenExpiry": "2025-05-29T12:10:00.000Z"
    }
  }
}
```

### カレンダー同期履歴の取得

```
GET /calendar/sync/logs
```

カレンダー同期のログを取得します。

#### クエリパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| provider | string | × | 特定のプロバイダのログのみを取得（"google"または"apple"） |
| page | number | × | ページ番号。デフォルト: 1 |
| limit | number | × | 1ページあたりの件数。デフォルト: 20 |

#### レスポンス例

```json
{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c96",
      "provider": "google",
      "status": "success",
      "stats": {
        "totalEvents": 45,
        "created": 12,
        "updated": 5,
        "deleted": 2,
        "skipped": 26
      },
      "startDate": "2025-04-29T00:00:00.000Z",
      "endDate": "2025-05-29T00:00:00.000Z",
      "syncedAt": "2025-04-29T12:00:00.000Z",
      "duration": 3245
    },
    // ... 他の同期ログ
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

## 予約分析API

### 日別予約統計

```
GET /analytics/appointments/daily
```

日ごとの予約統計情報を取得します。

#### クエリパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| startDate | string | ○ | 開始日（YYYY-MM-DD形式） |
| endDate | string | ○ | 終了日（YYYY-MM-DD形式） |
| stylistId | string | × | 特定のスタイリストの統計のみを取得 |

#### レスポンス例

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-05-01",
      "totalAppointments": 15,
      "completed": 12,
      "cancelled": 2,
      "noShow": 1,
      "revenue": 75000,
      "appointmentsByService": {
        "カット": 5,
        "カラー": 3,
        "パーマ": 2,
        "カット・カラー": 4,
        "トリートメント": 1
      }
    },
    // ... 他の日付
  ]
}
```

### スタイリスト別予約統計

```
GET /analytics/appointments/by-stylist
```

スタイリストごとの予約統計情報を取得します。

#### クエリパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| startDate | string | ○ | 開始日（YYYY-MM-DD形式） |
| endDate | string | ○ | 終了日（YYYY-MM-DD形式） |

#### レスポンス例

```json
{
  "success": true,
  "data": [
    {
      "stylist": {
        "_id": "60d21b4667d0d8992e610c82",
        "name": "鈴木一郎"
      },
      "totalAppointments": 32,
      "completed": 28,
      "cancelled": 3,
      "noShow": 1,
      "revenue": 160000,
      "averageRating": 4.8,
      "popularServices": [
        "カット・カラー",
        "パーマ",
        "カット"
      ]
    },
    // ... 他のスタイリスト
  ]
}
```

### 予約時間傾向分析

```
GET /analytics/appointments/time-trends
```

予約の時間帯傾向を分析します。

#### クエリパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|-------------|------|------|------|
| startDate | string | ○ | 開始日（YYYY-MM-DD形式） |
| endDate | string | ○ | 終了日（YYYY-MM-DD形式） |
| groupBy | string | × | グループ化方法（"hour", "weekday", "month"）。デフォルト: "hour" |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "hourly": [
      { "hour": 10, "count": 45, "percentile": 15 },
      { "hour": 11, "count": 58, "percentile": 20 },
      { "hour": 12, "count": 30, "percentile": 10 },
      // ... 他の時間帯
    ],
    "weekday": [
      { "weekday": 0, "name": "日曜日", "count": 85, "percentile": 28 },
      { "weekday": 1, "name": "月曜日", "count": 15, "percentile": 5 },
      // ... 他の曜日
    ],
    "peakTimes": [
      { "day": "土曜日", "hour": 11, "count": 28 },
      { "day": "日曜日", "hour": 14, "count": 26 },
      { "day": "金曜日", "hour": 17, "count": 22 }
    ]
  }
}
```

## エラー処理

APIはエラー発生時に適切なHTTPステータスコードとエラーメッセージを返します。

### エラーコード一覧

| エラーコード | 説明 |
|-------------|------|
| INVALID_REQUEST | リクエストの形式が不正 |
| MISSING_REQUIRED_FIELD | 必須フィールドが欠落 |
| RESOURCE_NOT_FOUND | リソースが見つからない |
| DUPLICATE_ENTRY | 重複エントリ（例: 同じタイムスロットに複数の予約） |
| VALIDATION_ERROR | バリデーションエラー |
| UNAUTHORIZED | 認証エラー |
| FORBIDDEN | 権限エラー |
| CALENDAR_CONNECTION_ERROR | カレンダー連携エラー |
| CALENDAR_SYNC_ERROR | カレンダー同期エラー |
| INTERNAL_SERVER_ERROR | サーバー内部エラー |

### エラーレスポンス例

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定された予約が見つかりません",
    "details": {
      "id": "60d21b4667d0d8992e610c85"
    }
  }
}
```

## データ型定義

### Appointment（予約）

```typescript
interface Appointment {
  _id: string;
  client: ClientReference | Client;
  stylist?: StylistReference | Stylist;
  timeSlot: TimeSlotReference | TimeSlot;
  service: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  compatibilityScore?: number;
  compatibilityReason?: string;
  externalCalendarId?: string;
  externalCalendarSource?: 'google' | 'apple' | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientReference {
  _id: string;
  name: string;
}

interface StylistReference {
  _id: string;
  name: string;
  profileImage?: string;
}

interface TimeSlotReference {
  _id: string;
  startTime: string;
  endTime: string;
}
```

### TimeSlot（タイムスロット）

```typescript
interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  stylist?: StylistReference;
  appointment?: AppointmentReference;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentReference {
  _id: string;
  client: ClientReference;
  service: string;
}
```

### CalendarSync（カレンダー同期設定）

```typescript
interface CalendarSync {
  _id: string;
  userId: string;
  provider: 'google' | 'apple';
  accessToken: string;
  refreshToken?: string;
  tokenExpiry: string;
  calendarId: string;
  syncFrequency: number; // 分単位
  lastSyncedAt?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
```

### SyncLog（同期ログ）

```typescript
interface SyncLog {
  _id: string;
  userId: string;
  provider: 'google' | 'apple';
  status: 'success' | 'error';
  errorMessage?: string;
  stats?: {
    totalEvents: number;
    created: number;
    updated: number;
    deleted: number;
    skipped: number;
  };
  startDate: string;
  endDate: string;
  syncedAt: string;
  duration: number; // ミリ秒単位
  organizationId: string;
}
```

### ClientStylistCompatibility（クライアントとスタイリストの相性）

```typescript
interface ClientStylistCompatibility {
  _id: string;
  clientId: string;
  stylistId: string;
  compatibilityScore: number;
  compatibilityDetails: {
    elementCompatibility: {
      wood: number;
      fire: number;
      earth: number;
      metal: number;
      water: number;
    };
    pillarsCompatibility: {
      yearPillar: number;
      monthPillar: number;
      dayPillar: number;
      hourPillar: number;
    };
  };
  compatibilityReason: string;
  recommendedStyles: string[];
  organizationId: string;
  calculatedAt: string;
}
```