# デイリーフォーチュン運勢アドバイス生成プロンプト

## 現在のプロンプト構成

現在のシステムでは、`fortune.service.ts` 内の `generateAdviceWithClaude` 関数で以下のプロンプトを使用して運勢アドバイスを生成しています：

```
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

以下の3セクションからなるマークダウン形式のアドバイスを作成してください：
1. 「今日のあなたの運気」- 本日の日柱と用神・喜神・忌神との相性や、五行バランスを考慮した運気の分析
2. 「個人目標へのアドバイス」- 格局と用神を考慮したうえで、目標達成のための具体的なアドバイス
3. 「チーム目標へのアドバイス」- 五行特性を活かした対人関係や協力のためのアドバイス

それぞれのセクションは200-300文字程度にしてください。四柱推命の知識に基づいた具体的で実用的なアドバイスを提供してください。セクション内では、用神や喜神を活かす時間帯、注意すべき時間帯なども含めると良いでしょう。
```

## プロンプトの特徴

1. **ユーザー情報の包括的提供**:
   - 基本的なユーザー情報（名前、日主、主要五行）
   - 四柱命式の詳細（年柱・月柱・日柱・時柱）
   - 五行バランス（木・火・土・金・水の割合）
   - 格局・用神関連情報（格局タイプ、用神、喜神、忌神、仇神）

2. **日柱と運勢情報**:
   - 当日の日柱データ（天干・地支とその五行属性）
   - 運勢スコア（0-100点）と運勢タイプ（excellent/good/neutral/poor/bad）

3. **ユーザー固有の目標情報**:
   - 個人目標
   - チーム内での役割

4. **生成すべきアドバイスの構造指定**:
   - マークダウン形式の3セクション構成
   - 各セクションの目的と内容を明確に定義
   - セクションごとの文字数制限（200-300文字）

5. **アドバイス内容の方向性**:
   - 四柱推命の知識に基づいた具体的で実用的なアドバイス
   - 用神や喜神を活かす時間帯、注意すべき時間帯の提案

## 実装の特徴

1. **API連携**:
   - Claude 3.7 Sonnet モデルを使用
   - max_tokens = 1024 に設定

2. **フォールバック機構**:
   - Claude API呼び出しに失敗した場合、テンプレートベースのアドバイス生成にフォールバック

3. **環境変数による制御**:
   - `USE_CLAUDE_API` 環境変数で、API使用の有無を制御可能

## テンプレートベースのフォールバック

APIに接続できない、または使用しない設定の場合、以下のテンプレートベースの生成方法にフォールバックします：

1. **基本的なテンプレート構造**:
   - `getDayDescription`: 日の基本的な説明を生成
   - `getPersonalGoalAdvice`: 個人目標に対するアドバイスを生成
   - `getTeamGoalAdvice`: チーム目標に対するアドバイスを生成

2. **テンプレート選択の基準**:
   - ユーザーの五行属性
   - 日柱の五行属性
   - 運勢タイプ（excellent/good/neutral/poor/bad）

3. **フォーマット**:
   - 同じ3セクション構造のマークダウン形式
   - 固定テンプレートからの選択と組み合わせ