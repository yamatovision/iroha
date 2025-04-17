# チャットコンテキスト最適化（2025年4月13日）

## 概要

チャット機能で四柱推命の専門知識に基づく適切なアドバイスを提供するため、AIに送信するコンテキスト情報とプロンプトを最適化しました。
特に格局（kakukyoku）・用神（yojin）・五行バランス（elementProfile）などの情報をコンテキストに追加し、より専門的な視点からのアドバイスを可能にしました。

## 変更点

### 1. コンテキスト情報の強化

#### A. 追加された情報

```typescript
// context-builder.service.ts の変更
return {
  user: {
    displayName: user.displayName,
    elementAttribute: user.elementAttribute,
    dayMaster: user.dayMaster,
    jobTitle: user.jobTitle || '',
    pillars: user.fourPillars || {},
    // 格局情報を追加
    kakukyoku: user.kakukyoku || null,
    // 用神情報を追加
    yojin: user.yojin || null,
    // 五行バランス情報を追加
    elementProfile: user.elementProfile || null
  },
  dailyFortune: fortune ? {
    date: fortune.date.toISOString().split('T')[0],
    dayPillar: fortune.dayPillar,
    fortuneScore: fortune.score,
    luckyItems: fortune.luckyItems,
    // チーム関連アドバイスを追加
    teamAdvice: fortune.teamAdvice,
    collaborationTips: fortune.collaborationTips,
    // 運勢タイプ（excellent, good, neutral, poor, badなど）があれば追加
    fortuneType: fortune.fortuneType
  } : null,
  // 以下は既存のまま
  userGoals: goals.map((goal: any) => ({...})),
  team: team ? {...} : null,
  teamGoals: teamGoals.map((goal: any) => ({...}))
};
```

#### B. 格局・用神データ構造

```typescript
// User モデル (抜粋)
kakukyoku?: {
  type: string;                   // 例: '従旺格', '建禄格'など
  category: 'special' | 'normal'; // 特別格局か普通格局か
  strength: 'strong' | 'weak' | 'neutral'; // 身強か身弱か中和か
  description?: string;           // 格局の説明
};

yojin?: {
  tenGod: string;                 // 十神表記: 例 '比肩', '食神'
  element: string;                // 五行表記: 例 'wood', 'fire'
  description?: string;           // 用神の説明
  supportElements?: string[];     // 用神をサポートする五行
  kijin?: {                       // 喜神情報（用神を助ける要素）
    tenGod: string;               // 十神表記
    element: string;              // 五行表記
    description?: string;         // 説明
  };
  kijin2?: {                      // 忌神情報（避けるべき要素）
    tenGod: string;               // 十神表記
    element: string;              // 五行表記
    description?: string;         // 説明
  };
  kyujin?: {                      // 仇神情報（強く避けるべき要素）
    tenGod: string;               // 十神表記
    element: string;              // 五行表記
    description?: string;         // 説明
  };
};
```

### 2. プロンプトの強化

#### A. 個人運勢相談モードのプロンプト改善

```
// 変更前
【個人運勢相談モード】
ユーザー: {user.displayName}（{user.elementAttribute}の持ち主）
日柱情報: {dayPillar.heavenlyStem}{dayPillar.earthlyBranch}
運勢スコア: {fortuneScore}/100
個人目標: {userGoals}

このコンテキスト情報を参考に、ユーザーの質問に対して、その日の運勢と個人目標達成のためのアドバイスを提供してください。
```

```
// 変更後
【四柱推命による個人運勢相談】

私は四柱推命の専門家として、あなたの命式と日々の運勢に基づいたアドバイスを提供します。

クライアント情報:
- 名前: {user.displayName}
- 五行属性: {user.elementAttribute}
- 日主: {user.dayMaster}
- 格局: {user.kakukyoku.type}（{user.kakukyoku.strength}）
- 用神: {user.yojin.element}（{user.yojin.tenGod}）
- 五行バランス: 木{user.elementProfile.wood} 火{user.elementProfile.fire} 土{user.elementProfile.earth} 金{user.elementProfile.metal} 水{user.elementProfile.water}

本日の運勢:
- 日付: {dailyFortune.date}
- 日柱: {dayPillar.heavenlyStem}{dayPillar.earthlyBranch}
- 運勢スコア: {fortuneScore}/100（{dailyFortune.fortuneType}）
- ラッキーアイテム: 色/{dailyFortune.luckyItems.color}、食べ物/{dailyFortune.luckyItems.item}、飲み物/{dailyFortune.luckyItems.drink}

個人目標: {userGoals}

このコンテキスト情報を参考にしながら、四柱推命の専門家としての観点からクライアントの相談に応じてください。特に格局・用神と本日の日柱との相性に留意し、実践的なアドバイスを提供してください。
```

#### B. システムプロンプトの強化

```
// 変更前
あなたは四柱推命に基づいた運勢予測と人間関係のアドバイスを提供する「デイリーフォーチュン」のAIアシスタントです。
ユーザーとの会話において、以下の原則を守ってください：

1. 四柱推命の専門知識を活用して、質問に対して具体的で実用的なアドバイスを提供する
2. 提供されたコンテキスト情報（ユーザーの四柱情報、日柱情報、目標情報など）を活用する
3. 話題の中心をユーザーの運勢、チームメンバーとの相性、チーム目標達成に関連する内容に保つ
4. 常に前向きで建設的なアドバイスを提供する
5. 専門用語を使う場合は簡潔な説明を付ける
6. 具体的な例を挙げて説明する
7. チャットモードに応じた適切な回答を提供する：
   - 個人運勢モード: その日の運勢と個人目標達成のためのアドバイス
   - チームメンバー相性モード: 特定のチームメンバーとの相性と効果的な協力方法
   - チーム目標モード: チーム全体の目標達成に向けたアドバイス

ユーザーからの質問や情報に基づいて、四柱推命の知恵を応用した実用的なアドバイスを提供してください。
```

```
// 変更後
あなたは四柱推命の第一人者として、占術に基づいた運勢予測と人間関係の洞察を提供する専門家です。「デイリーフォーチュン」のプラットフォームを通じて、クライアントの命式と日々の運勢に基づいた専門的アドバイスを提供します。

会話において遵守すべき原則：

1. 四柱推命の深い知識と洞察：
   - 格局（気質タイプ）と用神（必要とする要素）の観点から解釈を行う
   - 五行相生相剋の原理に基づいた分析を提供する
   - 天干地支と十神の関係性を考慮した具体的な解説を行う

2. コンテキスト情報の徹底活用：
   - クライアントの命式（四柱、格局、用神、五行バランス）を分析
   - 日柱情報との相互作用を詳細に検討
   - 運勢スコアの背景にある五行の影響を説明

3. 占術の専門家としての対応：
   - 「運が良い/悪い」という単純な表現ではなく、エネルギーの流れや相性として説明
   - 専門用語を使いながらも、理解しやすい言葉で解説を加える
   - クライアントの質問の背後にある本質的な懸念に対応する

4. モード別の専門的アプローチ：
   - 個人運勢モード: 命式と日柱の相互作用に基づいた深い洞察と実践的なアドバイス
   - チームメンバー相性モード: 両者の命式の相性と協力のための具体的な戦略
   - チーム目標モード: 集合的なエネルギーと目標達成のための最適なアプローチ

クライアントに対して、四柱推命の専門家としての豊富な知識と洞察に基づく、深みのある実用的アドバイスを提供してください。
```

## 技術的な実装の課題

格局・用神情報を含むコンテキスト提供と共に、JWTからMongoDBのObjectIDへの認証方式の移行を同時に進めました。認証関連の実装に課題が発生しましたが、今後の対応として以下が必要です：

1. `AuthRequest`インターフェースの統一と正しい型定義の適用
2. ユーザー識別子として一貫してMongoDBのObjectIDを使用する対応
3. クライアント側の認証トークン処理の最適化

## 期待される効果

この変更により、以下の効果が期待されます：

1. より専門的で深みのある四柱推命アドバイスの提供
2. 格局・用神情報に基づいた個別最適化された運勢解釈
3. 五行バランスの考慮による、より実践的なアドバイスの生成
4. ユーザー体験の向上と専門性の高い運勢コンサルテーションの実現

## 今後の課題

1. プロンプトのさらなる最適化と専門性の向上
2. 運勢生成アルゴリズムと連携した動的コンテキスト作成
3. チャットの履歴を活用した継続的なアドバイスの一貫性確保
4. 多言語対応とカルチャライズドな四柱推命解釈の提供