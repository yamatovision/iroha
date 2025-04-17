# チーム相性（aisyou）API リファレンス

このドキュメントでは、チームメンバー間の相性確認画面「aisyou.html」の実装に必要なAPIエンドポイントについて説明します。

## ベースURL

```
/api/v1
```

## エンドポイント一覧

### チーム相性関連

| メソッド | エンドポイント                            | 説明                                     |
|---------|------------------------------------------|------------------------------------------|
| GET     | `/api/v1/teams/:teamId/members`          | チームメンバー一覧を取得                  |
| GET     | `/api/v1/fortune/team/:teamId/ranking`   | チーム内の今日の運勢ランキングを取得      |
| GET     | `/api/v1/teams/:teamId/compatibility/:userId1/:userId2` | チームメンバー間の相性情報を取得 |
| GET     | `/api/v1/users/:userId`                  | ユーザー基本情報を取得（五行属性など）     |

## 詳細API仕様

### チームメンバー一覧取得

チームに所属するメンバーの一覧とその五行属性情報を取得します。

```
GET /api/v1/teams/:teamId/members
```

#### リクエストパラメータ

- `teamId`: チームID

#### レスポンス

```json
{
  "members": [
    {
      "userId": "user-id-1",
      "displayName": "鈴木 花子",
      "email": "hanako.suzuki@example.com",
      "role": "デザイナー",
      "elementAttribute": "water",
      "avatarInitial": "鈴"
    },
    {
      "userId": "user-id-2", 
      "displayName": "田中 太郎",
      "email": "taro.tanaka@example.com",
      "role": "エンジニア",
      "elementAttribute": "metal",
      "avatarInitial": "田"
    },
    {
      "userId": "user-id-3",
      "displayName": "渡辺 健太",
      "email": "kenta.watanabe@example.com",
      "role": "営業",
      "elementAttribute": "fire",
      "avatarInitial": "渡"
    }
  ]
}
```

### チーム内運勢ランキング取得

チーム内のメンバーの今日の運勢ランキングを取得します。

```
GET /api/v1/fortune/team/:teamId/ranking
```

#### リクエストパラメータ

- `teamId`: チームID

#### レスポンス

```json
{
  "date": "2025-04-09",
  "ranking": [
    {
      "rank": 1,
      "userId": "user-id-1",
      "displayName": "鈴木 花子",
      "role": "デザイナー",
      "elementAttribute": "water",
      "avatarInitial": "鈴",
      "fortuneScore": 92,
      "luckyItems": {
        "color": "ブルー",
        "item": "鍵",
        "drink": "ミネラルウォーター"
      }
    },
    {
      "rank": 2,
      "userId": "user-id-2",
      "displayName": "田中 太郎",
      "role": "エンジニア",
      "elementAttribute": "metal",
      "avatarInitial": "田",
      "fortuneScore": 87,
      "luckyItems": {
        "color": "シルバー",
        "item": "コイン",
        "drink": "白ワイン"
      }
    },
    {
      "rank": 3,
      "userId": "user-id-3",
      "displayName": "渡辺 健太",
      "role": "営業",
      "elementAttribute": "fire",
      "avatarInitial": "渡",
      "fortuneScore": 85,
      "luckyItems": {
        "color": "レッド",
        "item": "手帳",
        "drink": "コーヒー"
      }
    },
    {
      "rank": 4,
      "userId": "user-id-4",
      "displayName": "高橋 めぐみ",
      "role": "マーケティング",
      "elementAttribute": "wood",
      "avatarInitial": "高",
      "fortuneScore": 81,
      "luckyItems": {
        "color": "グリーン",
        "item": "観葉植物",
        "drink": "緑茶"
      }
    },
    {
      "rank": 5,
      "userId": "user-id-5",
      "displayName": "佐藤 次郎",
      "role": "マネージャー",
      "elementAttribute": "earth",
      "avatarInitial": "佐",
      "fortuneScore": 78,
      "luckyItems": {
        "color": "イエロー",
        "item": "ノート",
        "drink": "オレンジジュース"
      }
    }
  ]
}
```

### チームメンバー相性情報取得

二人のチームメンバー間の相性情報を取得します。

```
GET /api/v1/teams/:teamId/compatibility/:userId1/:userId2
```

#### リクエストパラメータ

- `teamId`: チームID
- `userId1`: ユーザー1のID（通常は自分自身）
- `userId2`: ユーザー2のID（相性を確認したい相手）

#### レスポンス

```json
{
  "compatibility": {
    "relationship": "相生",
    "relationshipType": "mutual_generation",
    "user1": {
      "userId": "user-id-5",
      "displayName": "佐藤 次郎",
      "elementAttribute": "earth",
      "roleDescription": "現実的"
    },
    "user2": {
      "userId": "user-id-1",
      "displayName": "鈴木 花子",
      "elementAttribute": "water",
      "roleDescription": "創造的"
    },
    "detailDescription": "鈴木さん（水属性）の性格は、創造性に溢れ柔軟な思考を持ちながらも、知的好奇心が旺盛な印象です。あなた（土属性）との関係では、彼女はあなたに対して新しいアイデアや視点を提供する役割を自然と担えるでしょう。彼女の持つ水の性質はあなたの命式を活性化させる形となり、あなたの思考に新たな流れをもたらします。また、あなたの土の性質は彼女のアイデアを形にする力となり、互いに良い影響を与え合える関係です。仕事面では、彼女の創造性とあなたの実行力を組み合わせることで、優れた成果を生み出せる可能性が高いでしょう。\n\n### 協業のヒント\n- 彼女のアイデアに対して、実現可能性の観点からフィードバックを提供する\n- 定期的なブレインストーミングセッションを設けることで創造性を引き出す\n- 具体的な実行計画を立てる際に協力することで相互の強みを活かせる",
    "createdAt": "2025-04-09T05:23:16.789Z",
    "updatedAt": "2025-04-09T05:23:16.789Z"
  }
}
```

### ユーザー基本情報取得

特定ユーザーの基本情報と五行属性情報を取得します。

```
GET /api/v1/users/:userId
```

#### リクエストパラメータ

- `userId`: ユーザーID

#### レスポンス

```json
{
  "id": "user-id-1",
  "email": "hanako.suzuki@example.com",
  "displayName": "鈴木 花子",
  "role": "User",
  "teamId": "team-id-1",
  "jobTitle": "デザイナー",
  "elementAttribute": "water",
  "dayMaster": "壬子",
  "fourPillars": {
    "year": {
      "heavenlyStem": "己",
      "earthlyBranch": "酉"
    },
    "month": {
      "heavenlyStem": "丁",
      "earthlyBranch": "亥"
    },
    "day": {
      "heavenlyStem": "壬",
      "earthlyBranch": "子"
    },
    "hour": {
      "heavenlyStem": "甲",
      "earthlyBranch": "辰"
    }
  },
  "elementProfile": {
    "wood": 15,
    "fire": 20,
    "earth": 30,
    "metal": 15,
    "water": 70
  },
  "personalityDescription": "創造的で直感力が高く、流れるような柔軟性を持ちます。深い理解力と他者との繋がりを大切にする特性があります。",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-04-08T12:34:56.789Z"
}
```

## データモデル

### 相性（Compatibility）モデル

```typescript
interface ICompatibility {
  user1Id: string; // ユーザー1のID（常に小さいIDが先）
  user2Id: string; // ユーザー2のID
  relationship: 'mutual_generation' | 'mutual_restriction' | 'neutral'; // 相生・相克・中和関係
  relationshipType?: '相生' | '相克' | '中和'; // 日本語表記
  user1Element: 'wood' | 'fire' | 'earth' | 'metal' | 'water'; // ユーザー1の五行属性
  user2Element: 'wood' | 'fire' | 'earth' | 'metal' | 'water'; // ユーザー2の五行属性
  detailDescription: string; // 相性詳細説明文（マークダウン形式、協業ヒント含む）
  createdAt: Date;
  updatedAt: Date;
}
```

### 運勢ランキング（FortuneRanking）レスポンス

```typescript
interface FortuneRankingResponse {
  date: string; // YYYY-MM-DD形式
  ranking: {
    rank: number; // 順位
    userId: string;
    displayName: string;
    role: string;
    elementAttribute: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
    avatarInitial: string;
    fortuneScore: number; // 0-100
    luckyItems: {
      color: string;
      item: string;
      drink: string;
    }
  }[];
}
```

## 実装ノート

1. **相性計算アルゴリズム**:
   - 五行の相生・相克関係を基にした相性スコア算出
   - 相性のタイプは以下の3種類:
     - 相生（mutual_generation）: スコア 75-100
     - 中和（neutral）: スコア 45-74
     - 相克（mutual_restriction）: スコア 0-44
   - 各ユーザーの五行バランスも考慮したより精密な計算

2. **AIによる相性説明生成**:
   - 相性情報はAPIからの基本情報を元に、Claude AIにより詳細な説明文を生成
   - 説明文には性格の相性、協業のポイント、コミュニケーション上の注意点などが含まれる
   - ユーザーの四柱推命データとチーム内での役割を考慮したパーソナライズされた内容

3. **運勢ランキング生成プロセス**:
   - 各ユーザーの運勢スコアは事前計算されたDailyFortuneモデルから取得
   - チーム内の全メンバーのスコアを比較し、ランキングを生成
   - 各ユーザーのラッキーアイテムはその日の運勢と五行属性を考慮して選定

4. **キャッシュ戦略**:
   - 相性情報は頻繁に変更されないため、計算結果をデータベースにキャッシュ
   - 運勢ランキングは日次更新されるため、その日のランキングを一度計算した後はキャッシュを活用
   - 効率的なAPIレスポンスのためにユーザー情報も含めて必要なデータを一括取得