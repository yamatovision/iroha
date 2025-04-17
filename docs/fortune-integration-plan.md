# 運勢機能統合計画

## 概要

現在、運勢機能は「個人運勢（DailyFortune）」と「チームコンテキスト運勢（TeamContextFortune）」の2つのシステムに分かれており、これがユーザー体験の混乱や開発・保守の複雑さを招いています。本計画は両システムを統合し、より明確でシンプルな単一の運勢システムを構築することを目的としています。

## 現状分析

### 現在の問題点

1. **重複するアドバイス**: 
   - 個人運勢に「チーム目標へのアドバイス」セクションがある
   - チームコンテキスト運勢に「チームにおける今日の運勢」セクションがある
   - 両者が異なるデータソースと観点に基づいており、混乱の原因となっている

2. **システム複雑性**:
   - 2つの別々のモデル（DailyFortune, TeamContextFortune）
   - 2つの生成ロジック
   - 2つのAPIエンドポイント群

3. **実装上の問題**:
   - チームコンテキスト運勢の生成エラー（FortuneScore型の問題）
   - 個人運勢にチーム目標の情報が反映されていない

## 統合計画

### 1. モデル統合

#### 1.1 統合モデル設計（DailyFortune拡張）

```typescript
// 拡張版DailyFortuneモデル
interface IDailyFortune {
  userId: mongoose.Types.ObjectId;
  date: Date;
  dayPillarId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId; // オプショナル - チームコンテキスト用
  teamGoalId?: mongoose.Types.ObjectId; // オプショナル - チーム目標参照用
  fortuneScore: number;
  advice: string; // マークダウン形式:「今日の運気」「個人目標」「チーム目標」セクションを含む
  teamAdvice?: string; // チーム特化アドバイス（オプショナル）
  collaborationTips?: string[]; // チーム協力ヒント（オプショナル）
  luckyItems: {
    color: string;
    item: string;
    drink: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. サービス層統合

#### 2.1 運勢生成プロセスの統合

- `generateFortune` メソッドを拡張してチーム情報を含めるよう修正
- チーム目標情報を取得して運勢生成プロンプトに含める
- チームコンテキスト運勢が必要な場合は同じモデルの別インスタンスとして生成

#### 2.2 プロンプト修正

```typescript
// 個人運勢プロンプト修正
const prompt = `
あなたは四柱推命に基づいて運勢アドバイスを作成する専門家です。以下の情報に基づいて、マークダウン形式のアドバイスを作成してください。

# ユーザー基本情報
- 名前: ${user.displayName || 'ユーザー'}
- 日主: ${user.dayMaster || '不明'}
- 主要五行: ${userElement}

# 四柱情報
- 四柱: ${user.fourPillars?.year?.heavenlyStem || ''}${user.fourPillars?.year?.earthlyBranch || ''} ${user.fourPillars?.month?.heavenlyStem || ''}${user.fourPillars?.month?.earthlyBranch || ''} ${user.fourPillars?.day?.heavenlyStem || ''}${user.fourPillars?.day?.earthlyBranch || ''} ${user.fourPillars?.hour?.heavenlyStem || ''}${user.fourPillars?.hour?.earthlyBranch || ''}

# 五行バランス
- 木: ${user.elementProfile?.wood || 0}
- 火: ${user.elementProfile?.fire || 0}
- 土: ${user.elementProfile?.earth || 0}
- 金: ${user.elementProfile?.metal || 0}
- 水: ${user.elementProfile?.water || 0}

# 格局・用神情報
- 格局: ${user.kakukyoku?.type || '不明'}（${user.kakukyoku?.strength || '不明'}）
- 用神: ${user.yojin?.tenGod || '不明'}（${user.yojin?.element || '不明'}）
- 喜神: ${user.yojin?.kijin?.tenGod || '不明'}（${user.yojin?.kijin?.element || '不明'}）
- 忌神: ${user.yojin?.kijin2?.tenGod || '不明'}（${user.yojin?.kijin2?.element || '不明'}）
- 仇神: ${user.yojin?.kyujin?.tenGod || '不明'}（${user.yojin?.kyujin?.element || '不明'}）

# 本日の日柱情報
- 天干: ${dayPillar.heavenlyStem}
- 地支: ${dayPillar.earthlyBranch} 
- 五行属性: ${stemElement}
- 運勢スコア: ${fortuneScore}/100
- 運勢タイプ: ${fortuneType}

# ユーザー目標
- 個人目標: ${user.goal || '設定なし'}
- チーム役割: ${user.teamRole || '設定なし'}
- チーム目標: ${teamGoal?.content || '目標未設定'}
- 目標期限: ${teamGoal?.deadline ? new Date(teamGoal.deadline).toLocaleDateString() : '未設定'}
- 進捗状況: ${teamGoal?.progress || 0}%

以下の3セクションからなるマークダウン形式のアドバイスを作成してください：
1. 「今日のあなたの運気」- 本日の日柱と用神・喜神・忌神との相性や、五行バランスを考慮した運気の分析
2. 「個人目標へのアドバイス」- 格局と用神を考慮したうえで、目標達成のための具体的なアドバイス
3. 「チーム目標へのアドバイス」- チーム目標「${teamGoal?.content || '未設定'}」の達成に向けたアドバイス。五行特性を活かした対人関係や協力について具体的に言及してください。

それぞれのセクションは200-300文字程度にしてください。四柱推命の知識に基づいた具体的で実用的なアドバイスを提供してください。セクション内では、用神や喜神を活かす時間帯、注意すべき時間帯なども含めると良いでしょう。特にチーム目標に関しては、具体的な目標内容を参照した上で、達成のための具体的な行動や注意点を提案してください。
`;
```

### 3. コントローラー統合

#### 3.1 API簡略化

- `getFortuneDashboard` メソッドを継続使用するが、内部ロジックを刷新
- `getTeamContextFortune` と `generateTeamContextFortune` エンドポイントを廃止
- 既存の `getDailyFortune` と `generateFortune` エンドポイントを拡張

#### 3.2 互換性維持

- 既存のAPI呼び出しが壊れないよう、互換性レイヤーを追加
- 既存の TeamContextFortune データを DailyFortune データに移行

### 4. フロントエンド変更

#### 4.1 UI簡略化

- 単一の運勢カードに統合
- チーム情報を含んだ拡張UIに変更

### 5. マイグレーション計画

#### 5.1 データ移行

1. 既存のTeamContextFortuneデータを新しい形式のDailyFortuneデータに変換
2. 重複データの整理（同じ日付・ユーザーのデータ）
3. 新しいスキーマに基づくデータ検証

#### 5.2 デプロイメント計画

1. バックエンド変更実装
2. マイグレーションスクリプト実行
3. フロントエンド更新実装
4. ステージング環境でのテスト
5. 本番デプロイ

## 実装タスク

1. モデル変更
   - DailyFortuneモデルの拡張
   - TeamContextFortuneモデルの廃止準備

2. サービス層修正
   - `fortune.service.ts` の `generateFortune` メソッド修正
   - チーム情報を取得して運勢生成プロンプトに含めるよう変更
   - `getTeamContextFortune` と `generateTeamContextFortune` の機能を統合

3. コントローラー修正
   - `fortune.controller.ts` の API エンドポイント整理
   - `getFortuneDashboard` メソッドの内部ロジック修正

4. マイグレーションスクリプト作成
   - データ変換ロジック実装
   - 重複データの処理

5. フロントエンド修正
   - UI表示の統合
   - チーム情報の表示方法最適化

## 削除対象ファイルと機能

この統合によって不要となるファイルや機能を以下に示します。これらは最終的に削除し、将来の保守や機能追加時の混乱を防ぎます。

### 削除対象ファイル

#### バックエンド

1. **モデル**
   - `/server/src/models/TeamContextFortune.ts` - チームコンテキスト運勢モデル

2. **サービス層のメソッド** (`fortune.service.ts` 内)
   - `getTeamContextFortune()` - チームコンテキスト運勢取得
   - `generateTeamContextFortune()` - チームコンテキスト運勢生成
   - `generateTeamContextAdvice()` - チームコンテキスト専用アドバイス生成
   - `generateTemplateBasedTeamContextAdvice()` - テンプレートベースのチームコンテキストアドバイス

3. **コントローラーメソッド** (`fortune.controller.ts` 内)
   - `generateTeamContextFortune()` - チームコンテキスト運勢生成エンドポイント

4. **ルート定義** (`fortune.routes.ts` 内)
   - `/teams/:teamId/context` への GET リクエスト
   - `/teams/:teamId/context/generate` への POST リクエスト

#### フロントエンド

1. **コンポーネント**
   - `/client/src/components/fortune/TeamContextFortuneCard.tsx` - チームコンテキスト運勢カード

2. **サービス**
   - `/client/src/services/fortune.service.ts` 内のチームコンテキスト関連メソッド:
     - `getTeamContextFortune()`
     - `generateTeamContextFortune()`

3. **型定義**
   - `/shared/index.ts` 内の `ITeamContextFortune` インターフェイス

### 修正が必要なファイル

1. **API定義**
   - `/shared/index.ts` 内の `FORTUNE` オブジェクト:
     - `GET_TEAM_CONTEXT_FORTUNE` と `GENERATE_TEAM_CONTEXT_FORTUNE` の削除
     - `GET_FORTUNE_DASHBOARD` メソッドの内部実装変更

2. **DB参照**
   - チームコンテキスト運勢を参照しているクエリやフィルター
   - ダッシュボード関連の表示ロジック

### バッチ処理・定期実行

1. **運勢更新バッチ**
   - `/server/src/batch/daily-fortune-update.ts` - チームコンテキスト運勢生成部分の削除または統合

### テスト

1. **削除対象のテスト**
   - チームコンテキスト運勢に関するユニットテスト・統合テスト
   - TeamContextFortuneモデルのテスト

2. **修正が必要なテスト**
   - 運勢ダッシュボードに関するテスト

## タイムライン

1. 設計・計画確定: 1日
2. バックエンド実装: 2日
3. マイグレーションスクリプト実装: 1日
4. フロントエンド実装: 1-2日
5. テスト: 1日
6. デプロイ準備: 0.5日
7. リリース: 0.5日

**合計見積もり時間: 7-8日**

## リスクと対策

1. **データ移行リスク**:
   - 既存データの紛失や破損
   - 対策: バックアップ作成、ドライラン実施、ロールバック計画の準備

2. **互換性問題**:
   - 既存のAPIを使用しているクライアントへの影響
   - 対策: 互換性レイヤーの追加、段階的な移行

3. **パフォーマンス**:
   - 一つのモデルに統合することによるパフォーマンス低下
   - 対策: 適切なインデックス設定、クエリ最適化

## 結論

この統合計画により、運勢機能のシンプル化と明確化が実現します。チーム目標を個人運勢に取り込むことで、ユーザーにとってより一貫性のある体験を提供し、開発・保守の負担も軽減できます。この変更は小規模ながらも、システム全体の設計品質向上に貢献するものです。