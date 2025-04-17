# MongoDBオブジェクトID標準化ガイドライン

## 概要

このドキュメントはDailyFortuneアプリケーションにおける、ユーザーIDとその他のドキュメント識別子の標準化に関するガイドラインを定義します。現在、IDの扱いに関する非一貫性が、バッチ処理のエラーやコードの複雑化など、様々な問題を引き起こしています。この標準化により、コード品質の向上、バグの減少、そして処理効率の改善を目指します。

## 現在の問題点

1. **ID形式の混在**：
   - MongoDB ObjectID（Mongoose型）
   - 文字列ID（Firebase UIDなど）
   - 型の混在（`string | mongoose.Types.ObjectId`）

2. **バッチ処理などで発生する課題**：
   - 「ユーザーが見つかりません」エラーが頻発
   - 複雑な検索条件が必要（複数条件でのOR検索）
   - 型変換が頻繁に必要で、コードが複雑化
   - デバッグが困難

3. **コード品質への影響**：
   - TypeScriptの型安全性が低下
   - 同じ概念に対して異なる表現方法が存在
   - エラー処理が煩雑になり、堅牢性が低下

## MongoDB ObjectID標準化の目標

1. **一貫した識別子の使用**：
   - すべてのドキュメント参照でMongoDBのObjectIDのみを使用
   - 文字列ID（特にFirebase UID）からの完全な移行

2. **型安全性の向上**：
   - TypeScriptの型チェックを最大限活用
   - 混在型（`string | mongoose.Types.ObjectId`）の排除

3. **処理効率の向上**：
   - シンプルな検索クエリ（`findById`のみで対応可能）
   - バッチ処理などでのエラー削減
   - パフォーマンスの最適化

## 実装ガイドライン

### 1. モデル定義の標準化

```typescript
// 変更前
export interface IUser {
  _id?: string | mongoose.Types.ObjectId;  // 問題のある混在型
  teamId?: string | mongoose.Types.ObjectId;
  // ...
}

// 変更後
export interface IUser {
  _id: mongoose.Types.ObjectId;  // 明確なObjectID型の指定
  teamId?: mongoose.Types.ObjectId;
  // ...
}
```

### 2. ID生成と参照の標準パターン

```typescript
// 新規ドキュメント作成時
const newUser = new User({
  _id: new mongoose.Types.ObjectId(),  // 明示的にObjectIDを生成
  // 他のフィールド
});

// ドキュメント参照時
const user = await User.findById(userId);  // findByIdを優先使用

// 関連ドキュメントの参照
const team = await Team.findById(user.teamId);
```

### 3. クライアント・サーバー間のID受け渡し

```typescript
// クライアントへの送信時は文字列に変換
res.json({
  userId: user._id.toString(),
  // 他のフィールド
});

// クライアントからの受信時はObjectIDに変換
const userId = new mongoose.Types.ObjectId(req.params.userId);
```

### 4. バッチ処理での実装

```typescript
// 効率的で型安全なバッチ処理
async function processBatch(userIds: mongoose.Types.ObjectId[]) {
  // findメソッドで複数ドキュメントを効率的に取得
  const users = await User.find({ _id: { $in: userIds } });
  
  // 各ユーザーに対する処理
  return Promise.all(users.map(async (user) => {
    // ここでuserIdは明確にObjectID型
    return processUser(user._id);
  }));
}
```

### 5. 移行戦略

既存データを新しい標準に合わせるための移行ステップ：

1. **データマッピング**：
   - すべてのFirebase UIDと対応するMongoDB ObjectIDのマッピングを作成
   - 関連するコレクション（Team, DailyFortune, TeamContextFortuneなど）の参照関係を特定

2. **移行スクリプト作成**：
   - ユーザー識別子の移行
   - 関連コレクションの参照更新
   - インデックスの更新

3. **コード更新**：
   - モデル定義の更新
   - 検索ロジックの簡素化
   - 型安全性の向上

4. **検証**：
   - 単体テスト
   - 統合テスト
   - 実環境テスト

### 6. 移行スクリプト例

```javascript
// Firebase UIDからObjectIDへの移行スクリプト
async function migrateUserIds() {
  // 文字列IDを持つユーザーを特定
  const users = await User.find({
    $where: function() {
      return typeof this._id === 'string' || !(this._id instanceof mongoose.Types.ObjectId);
    }
  });
  
  for (const user of users) {
    // 新しいObjectID生成
    const newId = new mongoose.Types.ObjectId();
    const oldId = user._id;
    
    // 関連データの更新
    await Promise.all([
      DailyFortune.updateMany({ userId: oldId }, { userId: newId }),
      TeamContextFortune.updateMany({ userId: oldId }, { userId: newId }),
      Team.updateMany({ adminId: oldId }, { adminId: newId }),
      // その他の関連コレクション
    ]);
    
    // ユーザー自身の更新
    // 移行期間中はフィールドを保持
    user.firebaseUid = oldId;
    user._id = newId;
    await user.save();
  }
}
```

## バッチ処理の最適化例

バッチ処理（特に日次運勢更新など）においては、以下の最適化が可能になります：

```typescript
// 最適化されたバッチ処理
export async function updateDailyFortunes(targetDate: Date = new Date()): Promise<any> {
  // ユーザー取得がシンプルになる
  const users = await User.find({ isActive: true });
  
  // 処理を制御された並列実行
  const batchSize = 10; // 同時処理数の制限
  
  // ID処理が型安全になり、変換が不要に
  const results = await Promise.all(
    chunkArray(users, batchSize).map(async (userBatch) => {
      return Promise.all(userBatch.map(async (user) => {
        try {
          // TypeScript型安全性により、型チェックや変換が不要に
          await fortuneService.generateFortune(user._id, targetDate);
          
          // チームコンテキスト運勢も型安全に生成
          if (user.teamId) {
            await fortuneService.generateTeamContextFortune(user._id, user.teamId, targetDate);
          }
          
          return { success: true, userId: user._id };
        } catch (error) {
          return { success: false, userId: user._id, error };
        }
      }));
    })
  );
  
  // 結果の集計と返却
  // ...
}

// 配列をチャンクに分割するヘルパー関数
function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from(
    { length: Math.ceil(array.length / size) },
    (_, i) => array.slice(i * size, i * size + size)
  );
}
```

## 予想される効果

1. **バグ削減**：
   - 「ユーザーが見つかりません」エラーの大幅減少
   - 型関連のランタイムエラーの排除

2. **コード簡素化**：
   - 型チェックと変換が不要
   - 検索ロジックの単純化
   - エラー処理の簡素化

3. **パフォーマンス向上**：
   - より効率的なデータベースクエリ
   - インデックスの最適利用
   - バッチ処理の安定性向上

4. **保守性の向上**：
   - 一貫したコーディングパターン
   - TypeScriptの型チェックによる早期エラー検出
   - 新しい開発者の学習コスト低減

## 実装タイムライン

| フェーズ | 作業内容 | 期間 |
|----------|----------|------|
| 1 | 現状分析と影響範囲調査 | 1週間 |
| 2 | モデル定義の更新 | 1週間 |
| 3 | バッチ処理等のコア機能更新 | 2週間 |
| 4 | 移行スクリプト作成 | 1週間 |
| 5 | テスト環境での検証 | 1週間 |
| 6 | 本番環境への適用 | 1日 |
| 7 | モニタリングと調整 | 1週間 |

## 結論

MongoDBオブジェクトIDの標準化は、DailyFortuneアプリケーションの安定性、可読性、パフォーマンスを大きく向上させる重要な取り組みです。特にバッチ処理などの複雑な処理において、エラーの削減と処理効率の向上が期待できます。また、TypeScriptの型システムをより効果的に活用することで、開発効率と品質の両面で利益をもたらします。

## 参考リソース

- [MongoDB ObjectID公式ドキュメント](https://docs.mongodb.com/manual/reference/method/ObjectId/)
- [Mongoose SchemaTypes](https://mongoosejs.com/docs/schematypes.html)
- [TypeScript型安全性のベストプラクティス](https://typescript-eslint.io/rules/)