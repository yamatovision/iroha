# チーム管理 API リファレンス

このドキュメントでは、チーム管理機能に関連するAPIエンドポイントについて説明します。

## ベースURL

```
/api/v1/teams
```

## エンドポイント一覧

### チーム管理

| メソッド | エンドポイント                           | 説明                                   |
|---------|----------------------------------------|----------------------------------------|
| GET     | `/api/v1/teams`                        | ユーザーが所属する全チームを取得       |
| GET     | `/api/v1/teams/:teamId`                | 特定チームの詳細情報を取得             |
| POST    | `/api/v1/teams`                        | 新しいチームを作成                     |
| PUT     | `/api/v1/teams/:teamId`                | チーム情報を更新                       |
| DELETE  | `/api/v1/teams/:teamId`                | チームを削除                           |

### チーム目標

| メソッド | エンドポイント                         | 説明                                   |
|---------|--------------------------------------|----------------------------------------|
| GET     | `/api/v1/teams/:teamId/goal`         | チームの目標を取得                     |
| POST    | `/api/v1/teams/:teamId/goal`         | チームの目標を設定・更新               |

### チームメンバー

| メソッド | エンドポイント                           | 説明                                   |
|---------|----------------------------------------|----------------------------------------|
| GET     | `/api/v1/teams/:teamId/members`        | チームメンバー一覧を取得               |
| POST    | `/api/v1/teams/:teamId/members`        | チームにメンバーを追加                 |
| PUT     | `/api/v1/teams/:teamId/members/:userId/role` | メンバーの役割を更新           |
| DELETE  | `/api/v1/teams/:teamId/members/:userId` | メンバーをチームから削除             |
| GET     | `/api/v1/teams/:teamId/members/:userId/card` | メンバーカルテ情報を取得     |

### チーム相性分析

| メソッド | エンドポイント                           | 説明                                   |
|---------|----------------------------------------|----------------------------------------|
| GET     | `/api/v1/teams/:teamId/compatibility`  | チームメンバー間の相性マトリクスを取得 |
| GET     | `/api/v1/teams/:teamId/compatibility/analysis` | チーム全体の相性分析を取得  |

### チーム統計とインサイト

| メソッド | エンドポイント                           | 説明                                   |
|---------|----------------------------------------|----------------------------------------|
| GET     | `/api/v1/teams/:teamId/stats`          | チームの統計情報を取得                 |
| GET     | `/api/v1/teams/:teamId/alerts`         | チームのアラート一覧を取得             |
| GET     | `/api/v1/teams/:teamId/members/:userId/insights` | 特定メンバーのインサイトを取得 |

## 詳細API仕様

### チーム一覧取得

```
GET /api/v1/teams
```

ユーザーがアクセスできるすべてのチームを取得します。

#### レスポンス

```json
{
  "teams": [
    {
      "id": "team-id-1",
      "name": "営業チーム",
      "description": "四半期売上目標達成を目指すチーム",
      "adminId": "user-id-1",
      "iconInitial": "営",
      "iconColor": "primary",
      "memberCount": 5,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "team-id-2",
      "name": "開発チーム",
      "description": "新機能開発を担当するチーム",
      "adminId": "user-id-2",
      "iconInitial": "開",
      "iconColor": "water",
      "memberCount": 7,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### チーム詳細取得

```
GET /api/v1/teams/:teamId
```

指定されたIDのチーム詳細情報を取得します。

#### レスポンス

```json
{
  "team": {
    "id": "team-id-1",
    "name": "営業チーム",
    "description": "四半期売上目標達成を目指すチーム",
    "adminId": "user-id-1",
    "iconInitial": "営",
    "iconColor": "primary",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "goal": {
      "content": "四半期売上目標（1200万円）の達成と顧客満足度90%の維持",
      "deadline": "2025-06-30T00:00:00.000Z",
      "progress": 65,
      "status": "in_progress"
    }
  }
}
```

### チーム作成

```
POST /api/v1/teams
```

新しいチームを作成します。

#### リクエストボディ

```json
{
  "name": "マーケティングチーム",
  "description": "マーケティング戦略の企画と実行を担当",
  "iconColor": "fire"
}
```

#### レスポンス

```json
{
  "team": {
    "id": "team-id-3",
    "name": "マーケティングチーム",
    "description": "マーケティング戦略の企画と実行を担当",
    "adminId": "current-user-id",
    "iconInitial": "マ",
    "iconColor": "fire",
    "createdAt": "2025-04-08T12:34:56.789Z",
    "updatedAt": "2025-04-08T12:34:56.789Z"
  }
}
```

### チーム目標設定

```
POST /api/v1/teams/:teamId/goal
```

チームの目標を設定または更新します。

#### リクエストボディ

```json
{
  "content": "四半期売上目標（1200万円）の達成と顧客満足度90%の維持",
  "deadline": "2025-06-30T00:00:00.000Z"
}
```

#### レスポンス

```json
{
  "success": true,
  "goal": {
    "teamId": "team-id-1",
    "content": "四半期売上目標（1200万円）の達成と顧客満足度90%の維持",
    "deadline": "2025-06-30T00:00:00.000Z",
    "status": "not_started",
    "progress": 0,
    "createdAt": "2025-04-08T12:34:56.789Z",
    "updatedAt": "2025-04-08T12:34:56.789Z"
  }
}
```

### チームメンバー一覧取得

```
GET /api/v1/teams/:teamId/members
```

チームのメンバー一覧を取得します。

#### レスポンス

```json
{
  "members": [
    {
      "userId": "user-id-1",
      "displayName": "鈴木 花子",
      "email": "hanako.suzuki@example.com",
      "role": "デザイナー",
      "mainElement": "water",
      "avatarInitial": "鈴"
    },
    {
      "userId": "user-id-2",
      "displayName": "田中 太郎",
      "email": "taro.tanaka@example.com",
      "role": "エンジニア",
      "mainElement": "metal",
      "avatarInitial": "田"
    }
  ]
}
```

### メンバー追加

```
POST /api/v1/teams/:teamId/members
```

チームに新しいメンバーを追加します。既存ユーザーでない場合は新規ユーザーも同時に作成します。

#### リクエストボディ

```json
{
  "email": "kenta.watanabe@example.com",
  "password": "initialPassword123",
  "role": "営業",
  "element": "fire"
}
```

#### レスポンス

```json
{
  "success": true,
  "member": {
    "userId": "user-id-3",
    "displayName": "渡辺 健太",
    "email": "kenta.watanabe@example.com",
    "role": "営業"
  }
}
```

### メンバー情報更新

```
PUT /api/v1/teams/:teamId/members/:userId/role
```

チームメンバーの情報（主に役割）を更新します。

#### リクエストボディ

```json
{
  "role": "シニアデザイナー",
  "displayName": "鈴木 花子",
  "email": "hanako.suzuki@example.com"
}
```

#### レスポンス

```json
{
  "success": true,
  "member": {
    "userId": "user-id-1",
    "displayName": "鈴木 花子",
    "email": "hanako.suzuki@example.com",
    "role": "シニアデザイナー"
  }
}
```

### メンバーカルテ情報取得

```
GET /api/v1/teams/:teamId/members/:userId/card
```

チームメンバーの詳細なプロファイルカルテ情報を取得します。四柱推命データに基づいた特性分析、チームへの貢献方法、コミュニケーションガイドなどが含まれます。

#### レスポンス

```json
{
  "userInfo": {
    "userId": "user-id-1",
    "displayName": "鈴木 花子",
    "role": "デザイナー",
    "mainElement": "water",
    "avatarInitial": "鈴",
    "elementProfile": {
      "wood": 15,
      "fire": 20,
      "earth": 30,
      "metal": 15,
      "water": 70
    },
    "dayMaster": "壬子",
    "fourPillars": {
      "day": {
        "heavenlyStem": "壬",
        "earthlyBranch": "子"
      }
    }
  },
  "cardContent": "# 鈴木 花子の特性分析\n\n## 基本プロファイル\n\n五行属性: 水（壬子）\n\n水の気質は流動的で柔軟な思考を持ち、深い洞察力と直感を備えています。\n\n## 特性と才能\n\n- 創造的な問題解決能力\n- 直感的な洞察力\n- 柔軟な思考と適応力\n- 複雑な状況の理解と整理\n\n## チーム貢献分析\n\n鈴木さんの水の気質は、顧客満足度向上に特に適しています。直感的なユーザー体験設計と、顧客の潜在的ニーズを感知する能力が目標達成に大きく貢献します。\n\n### 最適な役割\n\n- 顧客体験の設計と最適化\n- ユーザーフィードバックの収集と分析\n- チーム内の創造的プロセスのファシリテーション\n- ブレインストーミングや問題解決セッションのリード\n\n### 強化すべき領域\n\n- 詳細な実装計画への注意（「土」の要素を強化）\n- 締切管理の徹底（「金」の要素を強化）\n- アイデアの選別と優先順位付け\n- 定期的な進捗報告の習慣化\n\n## コミュニケーションガイド\n\n### 効果的なアプローチ\n\n- 視覚的な資料や例を用いた説明\n- オープンエンドな質問と発想の余地\n- 大局的なビジョンの共有\n- 柔軟性のある進め方\n\n### 避けるべきアプローチ\n\n- 過度に構造化された指示\n- 細かいマイクロマネジメント\n- 創造性を制限する厳格なルール\n- 短すぎる締切の連続",
  "teamGoal": {
    "content": "四半期売上目標（1200万円）の達成と顧客満足度90%の維持",
    "deadline": "2025-06-30T00:00:00.000Z"
  },
  "lastUpdated": "2025-04-09T05:23:16.789Z"
}
```

### 相性マトリクス取得

```
GET /api/v1/teams/:teamId/compatibility
```

チームメンバー間の相性マトリクスを取得します。

#### レスポンス

```json
{
  "compatibilityMatrix": {
    "user-id-1": {
      "user-id-2": {
        "score": 90,
        "relationship": "相生",
        "description": "水（鈴木）は金（田中）を育てる関係です"
      },
      "user-id-3": {
        "score": 45,
        "relationship": "相克",
        "description": "水（鈴木）は火（渡辺）を抑制する関係です"
      }
    },
    "user-id-2": {
      "user-id-1": {
        "score": 90,
        "relationship": "相生",
        "description": "金（田中）は水（鈴木）に育てられる関係です"
      },
      "user-id-3": {
        "score": 85,
        "relationship": "相生",
        "description": "金（田中）は火（渡辺）を生み出す関係です"
      }
    },
    "user-id-3": {
      "user-id-1": {
        "score": 45,
        "relationship": "相克",
        "description": "火（渡辺）は水（鈴木）に抑制される関係です"
      },
      "user-id-2": {
        "score": 85,
        "relationship": "相生",
        "description": "火（渡辺）は金（田中）から生み出される関係です"
      }
    }
  },
  "teamMembers": [
    {
      "userId": "user-id-1",
      "displayName": "鈴木 花子",
      "element": "water",
      "avatarInitial": "鈴"
    },
    {
      "userId": "user-id-2",
      "displayName": "田中 太郎",
      "element": "metal",
      "avatarInitial": "田"
    },
    {
      "userId": "user-id-3",
      "displayName": "渡辺 健太",
      "element": "fire",
      "avatarInitial": "渡"
    }
  ]
}
```

### チーム相性分析取得

```
GET /api/v1/teams/:teamId/compatibility/analysis
```

チーム全体の相性分析とアドバイスを取得します。

#### レスポンス

```json
{
  "strengths": [
    "田中（金）と鈴木（水）の相性は極めて良好で、論理的分析と創造的発想を組み合わせたプロジェクトに最適です",
    "田中（金）と渡辺（火）の組み合わせは戦略立案と実行の流れに優れています"
  ],
  "challenges": [
    "高橋（木）と鈴木（水）の相性には工夫が必要です",
    "チーム全体として木の要素が不足しており、成長と拡大の機会を逃す可能性があります"
  ],
  "advice": "チーム全体として、土と金の要素が強いため、創造性と成長（水と木）を促進する活動を意識的に取り入れることで、より均衡のとれたチームダイナミクスが形成されます",
  "elementalBalance": {
    "wood": 20,
    "fire": 10,
    "earth": 30,
    "metal": 25,
    "water": 15
  }
}
```

### チーム統計取得

```
GET /api/v1/teams/:teamId/stats
```

チームの統計情報を取得します。

#### レスポンス

```json
{
  "memberCount": 5,
  "averageMotivation": 82,
  "alertCount": 2,
  "turnoverRiskCount": 1
}
```

### チームアラート取得

```
GET /api/v1/teams/:teamId/alerts
```

チームに関連するアラートを取得します。

#### レスポンス

```json
{
  "alerts": [
    {
      "userId": "user-id-3",
      "userName": "渡辺 健太",
      "type": "motivation_drop",
      "level": "medium",
      "description": "過去2週間でモチベーションスコアが25%減少しています。面談を推奨します。"
    },
    {
      "userId": "user-id-5",
      "userName": "高橋 めぐみ",
      "type": "turnover_risk",
      "level": "high",
      "description": "AIチャット分析から離職の可能性が検出されました。早急な対応が必要です。"
    }
  ]
}
```

### メンバーインサイト取得

```
GET /api/v1/teams/:teamId/members/:userId/insights
```

特定のチームメンバーに関するAIインサイトを取得します。

#### レスポンス

```json
{
  "element": "water",
  "analysis": "最近の会話から、新しいデザインツールの導入に興味を持っていることが検出されました。特にUI/UXの効率化について頻繁に言及しています。",
  "interests": ["デザインツール", "UI/UX", "効率化"],
  "todayCompatibility": "本日は「水」の気が強い日であり、鈴木さんの水属性と相性が良いため、創造的な提案を受け入れやすい状態です。",
  "advice": "新しいデザインツールの試験導入について話し合うと良いでしょう。データや具体例を示すとさらに効果的です。"
}
```