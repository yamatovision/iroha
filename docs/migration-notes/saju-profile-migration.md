# SajuProfile to User モデル統合マイグレーション

## 概要

2025/04/08に、SajuProfileモデルのデータをUserモデルに完全に統合しました。この変更により、
四柱推命プロフィールデータに直接アクセスしやすくなり、データアクセスの効率が向上しました。

## 変更内容

### 1. データモデル変更
- SajuProfileモデルを廃止し、すべてのフィールドをUserモデルに移行
- Userモデルに以下のフィールドを追加:
  - birthDate, birthTime, birthPlace
  - birthplaceCoordinates, localTimeOffset
  - elementAttribute, dayMaster
  - fourPillars (年柱、月柱、日柱、時柱の情報)
  - elementProfile (五行属性のバランス)
  - personalityDescription, careerAptitude

### 2. APIエンドポイント変更
- `/api/v1/saju-profiles` 関連のエンドポイントをリダイレクトまたは統合
- 四柱推命データのCRUD操作が `/api/v1/users` を通じて提供

### 3. コード変更
- `server/src/models/SajuProfile.ts` ファイルを削除
- `server/src/routes/saju-profile.routes.ts` の削除
- `server/src/index.ts` からSajuProfileルートを削除
- `server/src/models/index.ts` からSajuProfileエクスポートを削除
- 関連するアクセスコードをUserモデルに向けるよう更新
- `client/src/services/saju-profile.service.ts` を更新してUserエンドポイントを使用するよう変更

### 4. ドキュメント更新
- `docs/api/saju-profile.md` を更新してリダイレクト情報を提供
- `docs/data_models.md` を更新して統合されたUserモデルの情報を提供
- `server/docs/models.md` を更新

### 5. データベース操作
- 既存のSajuProfileコレクションのデータはすでにUser内に存在
- SajuProfileコレクションは安全に削除可能

## マイグレーションスクリプト

SajuProfileコレクションを安全に削除するためのスクリプト:

```javascript
// server/scripts/saju-profile-purge.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrateSajuProfilesToUser() {
  console.log('SajuProfile コレクション削除スクリプト開始');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('MongoDB に接続しました');
    
    const db = client.db('dailyfortune');
    
    // コレクションの存在を確認
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('sajuprofiles')) {
      console.log('SajuProfile コレクションは存在しません。削除操作は不要です。');
      return;
    }
    
    // 削除前の最終確認
    console.log('警告: SajuProfile コレクションを削除します。');
    console.log('5秒以内に Ctrl+C で中止できます...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // SajuProfile コレクションを削除
    await db.collection('sajuprofiles').drop();
    console.log('SajuProfile コレクションを削除しました');
    
    console.log('マイグレーション完了');
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await client.close();
    console.log('MongoDB 接続を閉じました');
  }
}

migrateSajuProfilesToUser();
```

## 今後の対応

1. **バックエンド**: 
   - sajuProfileId 参照を持つUserドキュメントから、この参照フィールドを将来的に削除

2. **フロントエンド**:
   - コードベース内の残りの `ISajuProfile` インターフェース参照を `IUser` の適切なフィールドに更新

## 統合の利点

1. **パフォーマンス向上**: 
   - JOIN操作の削減によるクエリ効率の向上
   - API呼び出し回数の削減

2. **コードシンプル化**:
   - UserとSajuProfileの同期に関する複雑なロジックの削除
   - 一貫したデータアクセスパターン

3. **保守性向上**:
   - 複数のコレクション間での整合性を維持する必要がなくなった
   - モデル数の削減によるプロジェクト複雑性の低減

## 注意点

- クライアント側のコードで `/api/v1/saju-profiles` エンドポイントを直接呼び出している場合は、Userエンドポイントに切り替える必要があります
- レガシー対応のため、一部のSajuProfileエンドポイントは機能するよう残されていますが、新しいコードではUserエンドポイントを使用してください

---

このマイグレーションに関する質問や問題がある場合は、プロジェクト管理者に連絡してください。