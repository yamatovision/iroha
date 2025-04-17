# ラッキーアイテム生成機能 四柱推命統合移行計画

## 概要

現在のテンプレートベースのラッキーアイテム生成機能から、四柱推命の詳細情報（格局・用神・五行バランスなど）を活用したClaude AI生成方式への移行計画を詳述します。

## 現状分析

### 現在の実装
- `fortune.service.ts` の `generateLuckyItems` 関数で生成
- 五行属性ごとに事前定義された選択肢（計15種類）からランダム選択
- シンプルだが、バリエーションが少なく個別化されていない

### 目標とする状態
- 四柱命式、格局、用神、五行バランスなどの詳細情報を活用
- Claude AI を使用したパーソナライズされた提案
- 自然言語でパース可能な一貫したフォーマット

## 移行実装計画

### 1. 最終システムプロンプト

```
あなたは四柱推命の専門家として、ユーザーの四柱命式、格局、用神、および五行バランスを総合的に考慮した今日のラッキーアイテムを提案します。

【命式情報】
年柱: ${user.fourPillars.year.heavenlyStem}${user.fourPillars.year.earthlyBranch}
月柱: ${user.fourPillars.month.heavenlyStem}${user.fourPillars.month.earthlyBranch}
日柱: ${user.fourPillars.day.heavenlyStem}${user.fourPillars.day.earthlyBranch}
時柱: ${user.fourPillars.hour.heavenlyStem}${user.fourPillars.hour.earthlyBranch}

格局: ${user.kakukyoku.type}（${user.kakukyoku.strength}）
用神: ${user.yojin.tenGod}（${user.yojin.element}）
忌神: ${user.yojin.kijin2.tenGod}（${user.yojin.kijin2.element}）

【五行バランス】
木: ${user.elementProfile.wood}%
火: ${user.elementProfile.fire}%
土: ${user.elementProfile.earth}%
金: ${user.elementProfile.metal}%
水: ${user.elementProfile.water}%

【今日の情報】
今日の日柱: ${dayStem}${dayBranch}

【回答形式】
必ず以下の3行のフォーマットで回答してください。各行は必ず「ラッキーファッション: 」「ラッキーフード: 」「ラッキードリンク: 」から始めてください。

ラッキーファッション: [具体的なファッションアイテム、色、スタイルなど]
ラッキーフード: [具体的な食べ物、料理、メニューなど]
ラッキードリンク: [具体的な飲み物、ドリンクなど]

【重要】
- 必ず指定された3行のフォーマットを守ってください
- 余分な説明や追加情報は入れないでください
- 各アイテムの説明は具体的かつ簡潔にしてください
- 用神を強化し、忌神を避けるアイテムを提案してください
- 不足している五行を補うアイテムも考慮してください
- 命式全体と今日の日柱との関係を考慮してください
```

### 2. パース関数の実装

```typescript
function parseLuckyItems(text: string): { 
  color: string; 
  item: string; 
  drink: string; 
} {
  const lines = text.trim().split('\n');
  const result = {
    color: '',  // ラッキーファッション
    item: '',   // ラッキーフード
    drink: ''   // ラッキードリンク
  };
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('ラッキーファッション:')) {
      result.color = trimmedLine.substring('ラッキーファッション:'.length).trim();
    } else if (trimmedLine.startsWith('ラッキーフード:')) {
      result.item = trimmedLine.substring('ラッキーフード:'.length).trim();
    } else if (trimmedLine.startsWith('ラッキードリンク:')) {
      result.drink = trimmedLine.substring('ラッキードリンク:'.length).trim();
    }
  }
  
  return result;
}
```

### 3. 移行フェーズ

#### フェーズ1: 既存実装に並行実装を追加（2週間）

1. **claudeで生成する新機能の実装**
   ```typescript
   // claude-ai.ts に追加
   const LUCKY_ITEMS_SYSTEM_PROMPT = `...`; // 上記システムプロンプト
   
   export async function generateLuckyItemsWithClaude(
     user: any,
     dayStem: string,
     dayBranch: string
   ): Promise<{color: string; item: string; drink: string}> {
     // プロンプト構築
     const prompt = buildLuckyItemsPrompt(user, dayStem, dayBranch);
     
     try {
       // Claude APIを呼び出し
       const response = await callClaudeAPI(prompt, LUCKY_ITEMS_SYSTEM_PROMPT, 1000);
       
       // レスポンスをパース
       return parseLuckyItems(response);
     } catch (error) {
       console.error('ラッキーアイテム生成エラー:', error);
       throw error;
     }
   }
   ```

2. **フォールバック機構を備えた新機能の統合**
   ```typescript
   // fortune.service.ts を修正
   async generateLuckyItems(userId: string, dayStem: string, dayBranch: string): Promise<{color: string; item: string; drink: string}> {
     try {
       // ユーザー情報を取得（格局・用神情報を含む）
       const user = await User.findById(userId);
       if (!user) {
         throw new Error('ユーザーが見つかりません');
       }
       
       // 1. Claudeで生成を試みる
       try {
         return await generateLuckyItemsWithClaude(user, dayStem, dayBranch);
       } catch (claudeError) {
         console.warn('Claude生成エラー、従来方式にフォールバック:', claudeError);
         // フォールバック: 従来方式でラッキーアイテムを生成
         return this.generateLuckyItemsLegacy(user.elementAttribute || 'water', dayStem, dayBranch);
       }
     } catch (error) {
       console.error('ラッキーアイテム生成総合エラー:', error);
       // 最終フォールバック: 安全なデフォルト値
       return {
         color: '青色のアクセサリー',
         item: '旬の野菜料理',
         drink: '緑茶'
       };
     }
   }
   
   // 既存メソッドをリネーム
   private generateLuckyItemsLegacy(userElement: string, dayStem: string, dayBranch: string): {color: string; item: string; drink: string} {
     // 既存コードをそのまま移行
     // ...
   }
   ```

3. **キャッシュ機構の実装（オプション）**
   ```typescript
   // 日付+ユーザーIDによるキャッシュ（24時間有効）
   const luckyItemsCache = new Map<string, {
     data: {color: string; item: string; drink: string},
     expiry: number
   }>();
   
   function getCacheKey(userId: string, date: string): string {
     return `${userId}:${date}`;
   }
   
   // キャッシュ機構を組み込んだ関数
   async generateLuckyItemsWithCache(userId: string, dayStem: string, dayBranch: string, date: string): Promise<{color: string; item: string; drink: string}> {
     const cacheKey = getCacheKey(userId, date);
     const now = Date.now();
     
     // キャッシュチェック
     const cached = luckyItemsCache.get(cacheKey);
     if (cached && cached.expiry > now) {
       console.log('キャッシュからラッキーアイテムを取得');
       return cached.data;
     }
     
     // 新規生成
     const items = await this.generateLuckyItems(userId, dayStem, dayBranch);
     
     // キャッシュに保存（24時間有効）
     luckyItemsCache.set(cacheKey, {
       data: items,
       expiry: now + 24 * 60 * 60 * 1000
     });
     
     return items;
   }
   ```

4. **テスト環境での検証**
   - 様々なユーザー命式、格局、用神パターンでのテスト
   - 一貫したフォーマットかつ適切な内容が生成されるか検証
   - パース成功率の確認

#### フェーズ2: A/Bテストによる段階的移行（1週間）

1. **トラフィック分割**
   ```typescript
   async generateLuckyItems(userId: string, dayStem: string, dayBranch: string): Promise<{color: string; item: string; drink: string}> {
     // ユーザーIDをハッシュ化して10%を新方式に振り分け
     const userIdHash = crypto.createHash('md5').update(userId).digest('hex');
     const useNewMethod = parseInt(userIdHash.substring(0, 2), 16) < 26; // ~10%
     
     if (useNewMethod) {
       try {
         // 新方式
         const user = await User.findById(userId);
         return await generateLuckyItemsWithClaude(user, dayStem, dayBranch);
       } catch (error) {
         // フォールバック
         console.warn('新方式エラー、従来方式にフォールバック:', error);
         return this.generateLuckyItemsLegacy(userElement, dayStem, dayBranch);
       }
     } else {
       // 従来方式
       return this.generateLuckyItemsLegacy(userElement, dayStem, dayBranch);
     }
   }
   ```

2. **メトリクス収集**
   - 新旧両方式の成功率、応答時間、エラー率を記録
   - ユーザーエンゲージメント指標の比較（表示時間、操作回数など）

3. **段階的な割合増加**
   - 10% → 25% → 50% → 75% → 100% と段階的に新方式の割合を増加

#### フェーズ3: 完全移行と最適化（1週間）

1. **完全移行**
   - 旧コードパスを完全に廃止
   - キャッシュ機構の本格導入

2. **エラーハンドリングとフォールバックの強化**
   - タイムアウト処理
   - リトライ機構
   - 詳細なエラーログ

3. **パフォーマンス最適化**
   - プロンプトの最適化
   - リクエスト/レスポンスサイズの最適化

## ファイル変更リスト

1. `server/src/services/claude-ai.ts`
   - ラッキーアイテム生成用システムプロンプト追加
   - `generateLuckyItemsWithClaude` 関数実装
   - プロンプト構築ヘルパー関数実装
   - パース関数実装

2. `server/src/services/fortune.service.ts`
   - `generateLuckyItems` 関数の更新
   - 既存コードを `generateLuckyItemsLegacy` としてリネーム
   - キャッシュ機構の追加（オプション）
   - フォールバック処理の追加

3. `server/src/types/index.ts`
   - ラッキーアイテム関連の型定義更新（必要に応じて）

## テスト計画

1. **ユニットテスト**
   - パース関数のテスト
   - フォールバック機構のテスト
   - キャッシュ機構のテスト

2. **統合テスト**
   - 様々な命式パターンでのラッキーアイテム生成テスト
   - エラー処理のテスト
   - 実際のAPIを使用した検証

3. **パフォーマンステスト**
   - レスポンス時間の計測
   - 一日あたりのAPI呼び出し回数の見積もり
   - コスト見積もり

## リスク管理

1. **API障害対策**
   - フォールバック機構の徹底テスト
   - 監視システムの構築

2. **コスト管理**
   - キャッシュ機構の最適化
   - バッチ処理による事前生成の検討

3. **内容品質管理**
   - 生成結果のサンプリング監査
   - 不適切な内容検出の仕組み

## タイムライン

| 週 | フェーズ | 活動内容 |
|----|----------|----------|
| 1  | 準備     | プロトタイプ開発とテスト |
| 2  | フェーズ1 | 並行実装と内部テスト |
| 3  | フェーズ2 | A/Bテスト 10%-25% |
| 4  | フェーズ2 | A/Bテスト 50%-75% |
| 5  | フェーズ3 | 完全移行と最適化 |

## チーム編成

- バックエンド開発者（1名）: Claude API連携、パース処理実装
- テスト担当者（1名）: 品質保証、エラーケースのテスト
- プロジェクト管理者（0.5名）: 進捗管理、リスク管理

## 成功指標

1. **技術的指標**
   - パース成功率 99.9%以上
   - API呼び出し成功率 99.5%以上
   - 平均レスポンス時間 1秒以内

2. **ビジネス指標**
   - ユーザーエンゲージメント増加
   - アプリ満足度向上
   - ユーザーリテンション向上

## まとめ

この移行計画によって、シンプルなテンプレートベースからより詳細な四柱推命情報を活用した、パーソナライズされたラッキーアイテム生成システムへの段階的な移行が可能になります。リスクを最小限に抑えながら、フォールバック機構を備えた堅牢なシステムを構築することで、ユーザー体験の向上と技術的な安定性の両立を図ります。