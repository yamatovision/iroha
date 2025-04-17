# 四柱推命プロフィールAPI (廃止/リダイレクト情報)

> **重要**: このAPIは**廃止**され、Userモデルに統合されました (2025/04/08)。
> 
> 旧SajuProfileの全てのデータはUserモデルのフィールドとして直接アクセスできるようになりました。
> 以下に新しい対応するエンドポイントの情報を示します。

## 変更の概要

四柱推命プロフィールデータはUserモデルに直接統合されました。これによりデータアクセスが簡素化され、効率が向上しています。

## 新しいエンドポイント対応表

| 旧エンドポイント | 新エンドポイント | 備考 |
|-----------------|-----------------|------|
| `GET /api/v1/saju-profiles/available-cities` | そのまま利用可能 | 地理情報エンドポイントは変更なし |
| `GET /api/v1/saju-profiles/city-coordinates/{cityName}` | そのまま利用可能 | 地理情報エンドポイントは変更なし |
| `POST /api/v1/saju-profiles/local-time-offset` | そのまま利用可能 | 地理情報エンドポイントは変更なし |
| `POST /api/v1/saju-profiles` | `PUT /api/v1/users/me/saju-data` | Userモデルの四柱推命データ更新API |
| `GET /api/v1/saju-profiles/me` | `GET /api/v1/users/me` | Userプロフィール取得に四柱推命データ含まれる |
| `GET /api/v1/saju-profiles/{userId}` | `GET /api/v1/users/{userId}` | Userプロフィール取得に四柱推命データ含まれる |
| `PUT /api/v1/saju-profiles` | `PUT /api/v1/users/me/saju-data` | Userモデルの四柱推命データ更新API |
| `GET /api/v1/saju-profiles/element/{element}` | `GET /api/v1/users/element/{element}` | 五行属性による検索 |

## 新しいデータ構造

四柱推命データは現在、User オブジェクトの一部として次のような構造で提供されます：

```json
{
  "userId": "string",
  "email": "string",
  "displayName": "string",
  "role": "User",
  
  // 四柱推命データ
  "birthDate": "1990-01-15",
  "birthTime": "13:30",
  "birthPlace": "Tokyo, Japan",
  "birthplaceCoordinates": {
    "longitude": 139.6917,
    "latitude": 35.6895
  },
  "localTimeOffset": 18,
  "elementAttribute": "fire",
  "dayMaster": "string",
  "fourPillars": {
    "year": {
      "heavenlyStem": "string",
      "earthlyBranch": "string",
      "heavenlyStemTenGod": "string",
      "earthlyBranchTenGod": "string",
      "hiddenStems": ["string"]
    },
    "month": {
      "heavenlyStem": "string",
      "earthlyBranch": "string",
      "heavenlyStemTenGod": "string",
      "earthlyBranchTenGod": "string",
      "hiddenStems": ["string"]
    },
    "day": {
      "heavenlyStem": "string",
      "earthlyBranch": "string",
      "heavenlyStemTenGod": "string",
      "earthlyBranchTenGod": "string",
      "hiddenStems": ["string"]
    },
    "hour": {
      "heavenlyStem": "string",
      "earthlyBranch": "string",
      "heavenlyStemTenGod": "string",
      "earthlyBranchTenGod": "string",
      "hiddenStems": ["string"]
    }
  },
  "elementProfile": {
    "wood": 25,
    "fire": 42,
    "earth": 15,
    "metal": 8,
    "water": 10
  },
  "personalityDescription": "string",
  "careerAptitude": "string",
  
  // その他のユーザーデータ
  "createdAt": "2025-04-07T10:30:00.000Z",
  "updatedAt": "2025-04-07T10:30:00.000Z"
}
```

## 移行に関する注意点

1. 既存のクライアントコードで `/api/v1/saju-profiles/me` を使用している場合は `/api/v1/users/me` に変更してください
2. データ構造の一部が変更されていますので、クライアント側でのパース処理を更新する必要があります
3. フロントエンドでは `saju-profile.service.ts` がこの変更に対応するよう更新されています

## 移行の理由

1. データアクセスの効率化 - 常にユーザーデータとともに四柱推命データを取得できるようになりました
2. 関連データモデルの簡素化 - 不要なJOIN操作が削減されました
3. API呼び出し回数の削減 - ユーザー情報と四柱推命情報を別々に取得する必要がなくなりました