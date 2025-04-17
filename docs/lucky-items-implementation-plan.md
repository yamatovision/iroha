# ラッキーアイテム生成機能改善計画

## 概要

現在のDailyFortuneアプリでは、ラッキーアイテム（ラッキーファッション、ラッキーフード、ラッキードリンク）はテンプレートベースで生成されています。本計画では、Claude AIを活用してより多様で魅力的なラッキーアイテム提案を行うための実装計画を提案します。

## 現状分析

### 現在の実装
- ラッキーアイテムは `fortune.service.ts` 内の `generateLuckyItems` 関数で生成
- 各五行属性（木・火・土・金・水）ごとに事前定義された選択肢からランダム選択
- 各属性3つずつ、計15種類の組み合わせのみ
- フロントエンドでは「ラッキーファッション」「ラッキーフード」「ラッキードリンク」として表示

### 課題
- バリエーションが少なく、同じユーザーが同じ提案を繰り返し見ることになる
- 季節やイベントなどの文脈を考慮した提案ができない
- ユーザー五行と日柱の相性をより細かく反映させた提案ができていない

## 改善案

### 1. Claude APIによるラッキーアイテム生成

アドバイス生成と同様に、Claude APIを使用してラッキーアイテムを生成します。

1. **テキスト形式での生成**:
   - JSONではなく、単純なテキスト形式でレスポンスを要求
   - `ラッキーファッション: xxx\nラッキーフード: yyy\nラッキードリンク: zzz` の形式

2. **パース処理**:
   - シンプルな正規表現や文字列処理でパース
   - 各項目を抽出し、既存のDB構造（color, item, drink）にマッピング

3. **システムプロンプト**:
```
あなたは四柱推命に基づいたラッキーアイテム生成システムです。
ユーザーの五行属性（木・火・土・金・水）と日柱の五行属性に基づいて、その日のラッキーアイテムを提案します。

【ラッキーアイテム生成の原則】
1. 五行属性の相性に基づくラッキーアイテムを提案する
2. その日の運勢傾向に合わせたアイテムを選ぶ
3. 具体的で実用的なアイテムを提案する
4. 以下のフォーマットに厳密に従って回答する

【回答フォーマット】
必ず以下の3行のフォーマットで回答してください。各行は必ず「ラッキーファッション:」「ラッキーフード:」「ラッキードリンク:」から始めてください。
フォーマット例:
ラッキーファッション: [具体的なファッションアイテムや色]
ラッキーフード: [具体的な食べ物]
ラッキードリンク: [具体的な飲み物]

【重要】
- 必ず指定されたフォーマットを守ってください
- 余分な説明や追加情報は入れないでください
- 各アイテムの説明は具体的かつ簡潔にしてください
- JSON形式にはしないでください
- フォーマット外の追加情報は記載しないでください
```

4. **リクエストプロンプト**:
```
【ユーザー情報】
五行属性: ${userElement}
今日の運勢: ${fortuneType} (${fortuneScore}/100点)
今日の天干: ${dayStem} (${stemElement})
今日の地支: ${dayBranch} (${branchElement})

今日のあなたのラッキーアイテムを提案します。
これらのアイテムは、あなたの五行属性(${userElement})と今日の日柱の五行属性（天干:${stemElement}、地支:${branchElement}）の相性を考慮しています。

今日の運勢は${fortuneType}です。それを踏まえて、最適なラッキーアイテムを提案してください。
```

### 2. フォールバック機構

API呼び出しエラーなどに備え、現在のテンプレートベースの生成方法をフォールバック機構として残します。

```typescript
async function generateLuckyItems(userElement, dayStem, dayBranch, fortuneScore) {
  try {
    // Claude APIを使用してラッキーアイテムを生成
    const luckyItems = await generateLuckyItemsWithClaude(
      userElement, dayStem, dayBranch, fortuneScore
    );
    return luckyItems;
  } catch (error) {
    console.error('ラッキーアイテム生成エラー:', error);
    // フォールバック: 既存のテンプレートベース生成を使用
    return this.generateLuckyItemsFromTemplate(userElement, dayStem, dayBranch);
  }
}
```

### 3. キャッシュ機構（オプション）

APIコール回数削減のため、同じ条件の組み合わせに対するレスポンスをキャッシュする機構を追加。

```typescript
// キャッシュデータ（メモリまたはRedisなど）
const luckyItemsCache = new Map();

// キャッシュキーの生成
function createCacheKey(userElement, dayStem, dayBranch, fortuneScore) {
  return `${userElement}:${dayStem}:${dayBranch}:${fortuneScore}`;
}

// キャッシュを使用したラッキーアイテム生成
async function generateLuckyItemsWithCache(userElement, dayStem, dayBranch, fortuneScore) {
  const cacheKey = createCacheKey(userElement, dayStem, dayBranch, fortuneScore);
  
  // キャッシュがあれば使用
  if (luckyItemsCache.has(cacheKey)) {
    return luckyItemsCache.get(cacheKey);
  }
  
  // キャッシュがなければAPIで生成
  const luckyItems = await generateLuckyItemsWithClaude(
    userElement, dayStem, dayBranch, fortuneScore
  );
  
  // キャッシュに保存（24時間有効など）
  luckyItemsCache.set(cacheKey, luckyItems);
  setTimeout(() => luckyItemsCache.delete(cacheKey), 24 * 60 * 60 * 1000);
  
  return luckyItems;
}
```

## 実装変更箇所

### バックエンド変更

1. `server/src/services/fortune.service.ts`:
   - `generateLuckyItems` 関数の更新：Claude API呼び出しを追加
   - `parseLuckyItems` 関数の追加：テキスト応答のパース処理
   - フォールバック処理の追加

2. `server/src/services/claude-ai.ts`:
   - ラッキーアイテム生成用のシステムプロンプト定義
   - ラッキーアイテム生成用のAPIインターフェース追加

### データベースモデル

変更不要：現在の `DailyFortune` モデルの `luckyItems` 構造をそのまま活用できます。

```typescript
luckyItems: {
  color: String,  // ラッキーファッション
  item: String,   // ラッキーフード
  drink: String   // ラッキードリンク
}
```

### フロントエンド変更

変更不要：`LuckyItems.tsx` コンポーネントではすでに適切な表示名（「ラッキーファッション」「ラッキーフード」「ラッキードリンク」）とアイコンが設定されています。

## 実装ステップ

1. テスト環境での実装と検証
   - Claude APIを使用したラッキーアイテム生成機能の実装
   - 各五行属性と運勢スコアの組み合わせテスト
   - パースの安定性検証

2. フォールバック機構の実装
   - API呼び出し失敗時の処理
   - エラーロギング

3. （オプション）キャッシュ機構の実装
   - キャッシュデータ構造の設計
   - キャッシュ有効期限の設定

4. 本番環境への展開
   - 段階的なロールアウト
   - モニタリングとログ分析

## 期待される効果

1. より多様で魅力的なラッキーアイテム提案によるユーザー体験の向上
2. 五行属性と運勢をより細かく反映したパーソナライズされた提案
3. 固定パターンによる繰り返し感の軽減
4. コンテンツの鮮度感向上

## リスクと対策

1. **API呼び出し失敗**
   - 対策：テンプレートベースのフォールバック機構
   
2. **フォーマットエラー**
   - 対策：厳格なシステムプロンプト指示とパース処理の堅牢化
   
3. **APIコスト増加**
   - 対策：キャッシュ機構の実装、バッチ処理での予先生成

4. **不適切な内容生成**
   - 対策：システムプロンプトでの適切な制約、モニタリング

## テスト結果

別添の「ラッキーアイテム生成テスト結果」ドキュメントを参照ください。テスト結果では、様々な五行属性と運勢スコアの組み合わせにおいて、適切なラッキーアイテムが生成され、安定してパースできることが確認されています。

## 結論

Claude APIを活用したラッキーアイテム生成機能は、テンプレートベースの現実装と比較して多様性と魅力度が向上し、ユーザー体験を大きく改善する可能性があります。テスト結果からも、安定した実装が可能であることが確認されました。適切なフォールバック機構と必要に応じたキャッシュ機構を組み合わせることで、運用面でのリスクも最小化できると考えられます。