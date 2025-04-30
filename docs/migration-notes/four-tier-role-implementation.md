# 4階層ロール構造 実装プラン

## 概要

美姫命システムのユーザーロール構造を現行の3階層（SuperAdmin、Admin、User）から4階層（SuperAdmin、Owner、Admin、User）へと拡張するプランです。この変更により、組織のオーナー（Owner）と一般管理者（Admin）を明確に区別し、より細かな権限管理が可能になります。

## 変更の目的

1. 組織（サロン）の所有者と通常管理者の権限を明確に分離
2. 組織の存続に関わる重要決定（課金情報管理、管理者追加など）はオーナーのみが可能に
3. 日常的な運営管理（ユーザー管理、クライアント管理など）は一般管理者でも実行可能に

## 主要な変更点

1. **データモデル変更**
   - User.ts: `role`フィールドに`'Owner'`を追加
   - Organization.ts: `superAdminId`を`ownerId`に名称変更

2. **認証・認可ミドルウェア拡張**
   - `requireOwner`ミドルウェアの追加
   - 既存`requireAdmin`の修正（Ownerも通過可能に）
   - 組織所有者チェックミドルウェアの追加

3. **API変更**
   - ユーザーロール変更APIの権限チェック強化
   - 組織オーナー管理APIの追加
   - Owner専用APIエンドポイントの保護

4. **フロントエンド対応**
   - AuthContextの拡張（isOwner、isAdminプロパティ追加）
   - Owner専用ルート保護コンポーネント追加
   - 権限に基づく条件付きUI表示

## 実装手順

1. **準備フェーズ**
   - データベースバックアップ作成
   - テスト環境のセットアップ

2. **バックエンド実装**
   - データモデル変更
   - ミドルウェア拡張
   - APIエンドポイント更新
   - マイグレーションスクリプト作成

3. **マイグレーション実行**
   - テスト環境でのデータ移行テスト
   - 本番環境への適用

4. **フロントエンド実装**
   - AuthContext拡張
   - 権限に基づくコンポーネント更新
   - 管理機能のUI調整

5. **テスト & 検証**
   - 単体テスト実行
   - 統合テスト実行
   - 全体機能テスト

## コードサンプル：主要変更部分

### 1. User.tsモデル更新
```typescript
// 更新前
const UserSchema = new Schema({
  role: {
    type: String,
    enum: ['SuperAdmin', 'Admin', 'User'],
    default: 'User'
  },
  // 他のフィールド
});

// 更新後
const UserSchema = new Schema({
  role: {
    type: String,
    enum: ['SuperAdmin', 'Owner', 'Admin', 'User'],
    default: 'User'
  },
  // 他のフィールド
});
```

### 2. 認証ミドルウェア更新
```typescript
// 新規追加のミドルウェア
export const requireOwner = async (req: Request, res: Response, next: NextFunction) => {
  if (['Owner', 'SuperAdmin'].includes(req.user?.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Owner permission required' });
};

// 既存ミドルウェアの修正
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (['Admin', 'Owner', 'SuperAdmin'].includes(req.user?.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Admin permission required' });
};
```

### 3. マイグレーションスクリプト
```typescript
async function migrateToOwnerRole() {
  // 組織を取得
  const organizations = await Organization.find({});
  
  // 各組織のsuperAdminIdを検索し、対応するユーザーをOwnerに変更
  for (const org of organizations) {
    if (org.superAdminId) {
      const adminUser = await User.findById(org.superAdminId);
      
      if (adminUser && adminUser.role === 'Admin') {
        // ロールとフィールド名を更新
        adminUser.role = 'Owner';
        await adminUser.save();
        
        // 組織のownerIdフィールドを更新
        org.ownerId = org.superAdminId;
        await org.save();
      }
    }
  }
}
```

## エッジケースと対応

1. **組織にオーナーがいない場合**
   - マイグレーション時に検出
   - 組織に所属するAdminの中から最も古いユーザーをOwnerに設定

2. **SuperAdminがオーナーの場合**
   - SuperAdminロールは変更せず
   - Organization.ownerIdのみ設定

3. **権限降格時のリスク**
   - Owner→Adminに降格する場合、組織内の別のユーザーをOwnerに昇格させる必要あり
   - 降格確認時に警告表示

## セキュリティ考慮事項

1. ロール変更操作の監査ログ記録強化
2. 権限エスカレーション（不正な権限昇格）の防止
3. Owner権限を持つユーザーのセキュリティ意識向上

## ロールバック計画

問題発生時のためのロールバックスクリプトも用意：

```typescript
async function rollbackOwnerMigration() {
  // Ownerロールを持つすべてのユーザーをAdminロールに戻す
  const ownerUsers = await User.find({ role: 'Owner' });
  for (const user of ownerUsers) {
    user.role = 'Admin';
    await user.save();
  }
  
  // 組織のownerIdをsuperAdminIdに戻す
  const organizations = await Organization.find();
  for (const org of organizations) {
    if (org.ownerId) {
      org.superAdminId = org.ownerId;
      delete org.ownerId;
      await org.save();
    }
  }
}
```

## 実装スケジュール

1. **準備フェーズ**: 2日
2. **バックエンド実装**: 3日
3. **マイグレーションテスト**: 2日
4. **フロントエンド実装**: 3日
5. **全体テスト & 検証**: 2日
6. **本番適用**: 1日

合計: 約2週間

## 関連文書

- [API仕様詳細](../api/admin-role-expansion.md)
- [要件定義書](../requirements.md)（セクション2.5参照）

---

*このプランは、現状のコードベースと要件定義書の分析に基づいています。実装の詳細は、現在のシステム構成や具体的な要件によって調整される可能性があります。*