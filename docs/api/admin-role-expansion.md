# 4階層ロール構造のAPI設計・実装ガイド

## 1. 概要

本文書は美姫命システムのユーザーロール構造を3階層から4階層へと拡張する実装方法を定義します。具体的には、「Owner（組織オーナー）」ロールを新たに追加し、組織の所有者と通常の管理者を明確に区別します。

## 2. 現在の実装と拡張の必要性

### 2.1 現在のロール構造（3階層）

現在のシステムでは以下の3階層のロール構造が実装されています：

1. **SuperAdmin**: システム全体の管理権限（サービス提供者側）
2. **Admin**: 組織の管理者権限（サロン管理者）
3. **User**: 一般ユーザー権限（スタイリスト）

この構造では、組織の所有者（オーナー）と一般管理者の区別がなく、両方とも「Admin」として扱われています。

### 2.2 新しいロール構造（4階層）

要件定義の変更に基づき、以下の4階層のロール構造を実装します：

1. **SuperAdmin**: システム全体の管理権限（サービス提供者側）
2. **Owner**: 組織（サロン）オーナー権限（組織の存続に関わる決定権限）
3. **Admin**: 組織内の管理者権限（日常運営の権限）
4. **User**: 一般ユーザー権限（スタイリスト）

### 2.3 拡張の必要性

- 組織の所有者と日常管理者の権限を明確に分離する
- 組織の存続に関わる重要な決定（課金管理、Admin権限付与など）はOwnerのみが行えるようにする
- 日常的な運営管理はAdminでも実行可能にする

## 3. データモデル変更

### 3.1 UserRoleの拡張

```typescript
// server/src/types/auth.d.ts または類似ファイル

// 現在の実装
export type UserRole = 'SuperAdmin' | 'Admin' | 'User';

// 新しい実装
export type UserRole = 'SuperAdmin' | 'Owner' | 'Admin' | 'User';
```

### 3.2 Userモデルスキーマの更新

```typescript
// server/src/models/User.ts

// 現在の実装
const UserSchema = new Schema({
  // 既存フィールド
  role: {
    type: String,
    enum: ['SuperAdmin', 'Admin', 'User'],
    default: 'User'
  },
  // 他のフィールド
});

// 新しい実装
const UserSchema = new Schema({
  // 既存フィールド
  role: {
    type: String,
    enum: ['SuperAdmin', 'Owner', 'Admin', 'User'],
    default: 'User'
  },
  // 他のフィールド
});
```

### 3.3 Organizationモデルの更新

```typescript
// server/src/models/Organization.ts

// 現在の実装
const OrganizationSchema = new Schema({
  name: { type: String, required: true },
  superAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
  // 他のフィールド
});

// 新しい実装
const OrganizationSchema = new Schema({
  name: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' }, // superAdminIdから変更
  // adminIds配列を追加して複数の管理者を管理できるようにする（オプション）
  adminIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  // 他のフィールド
});
```

## 4. 認証・認可ミドルウェアの更新

### 4.1 認可ミドルウェアの拡張

```typescript
// server/src/middleware/hybrid-auth.middleware.ts

// 現在の実装
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === 'Admin' || req.user?.role === 'SuperAdmin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin permission required' });
};

export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === 'SuperAdmin') {
    return next();
  }
  return res.status(403).json({ message: 'SuperAdmin permission required' });
};

// 新しい実装
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (['Admin', 'Owner', 'SuperAdmin'].includes(req.user?.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Admin permission required' });
};

export const requireOwner = async (req: Request, res: Response, next: NextFunction) => {
  if (['Owner', 'SuperAdmin'].includes(req.user?.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Owner permission required' });
};

export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === 'SuperAdmin') {
    return next();
  }
  return res.status(403).json({ message: 'SuperAdmin permission required' });
};

// 組織の所有者かどうかをチェックする新ミドルウェア
export const requireOrganizationOwner = async (req: Request, res: Response, next: NextFunction) => {
  const { organizationId } = req.params;
  
  // SuperAdminはすべての組織の所有者として振る舞える
  if (req.user?.role === 'SuperAdmin') {
    return next();
  }
  
  // ユーザーが組織のオーナーかどうかをチェック
  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    if (req.user?.role === 'Owner' && organization.ownerId.toString() === req.user._id.toString()) {
      return next();
    }
    
    return res.status(403).json({ message: 'You must be the organization owner to perform this action' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};
```

## 5. API変更とエンドポイント拡張

### 5.1 ユーザーロール変更 API の更新

```typescript
// server/src/controllers/admin.controller.ts または類似ファイル

// ユーザーロール変更メソッド
export const changeUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['User', 'Admin', 'Owner', 'SuperAdmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }
    
    // 自分自身のロールは変更できない
    if (userId === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot change your own role' });
    }
    
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // SuperAdmin権限のみがOwnerやSuperAdminを割り当て可能
    if ((role === 'Owner' || role === 'SuperAdmin') && req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can assign this role' });
    }
    
    // Ownerの降格はSuperAdminのみ可能
    if (targetUser.role === 'Owner' && role !== 'Owner' && req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can downgrade an Owner' });
    }
    
    // Ownerへの昇格時、organizationIdを確認
    if (role === 'Owner' && !targetUser.organizationId) {
      return res.status(400).json({ message: 'User must belong to an organization to be an Owner' });
    }
    
    // 組織内の既存Ownerを確認し、必要な処理を行う
    if (role === 'Owner' && targetUser.organizationId) {
      const organization = await Organization.findById(targetUser.organizationId);
      if (organization) {
        // 現在のOwnerがいる場合は、OwnerからAdminへ降格
        if (organization.ownerId && organization.ownerId.toString() !== targetUser._id.toString()) {
          const currentOwner = await User.findById(organization.ownerId);
          if (currentOwner) {
            currentOwner.role = 'Admin';
            await currentOwner.save();
          }
        }
        
        // 新しいOwnerを組織に設定
        organization.ownerId = targetUser._id;
        await organization.save();
      }
    }
    
    // ユーザーロールを更新
    targetUser.role = role;
    await targetUser.save();
    
    return res.status(200).json({
      message: 'User role updated successfully',
      user: {
        id: targetUser._id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};
```

### 5.2 組織オーナー管理API

#### 5.2.1 組織オーナー取得

```typescript
// 組織のオーナー情報を取得
export const getOrganizationOwner = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    if (!organization.ownerId) {
      return res.status(404).json({ message: 'This organization has no owner assigned' });
    }
    
    const owner = await User.findById(organization.ownerId);
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    
    return res.status(200).json({
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};
```

#### 5.2.2 組織オーナー変更

```typescript
// 組織のオーナーを変更
export const changeOrganizationOwner = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { userId } = req.body;
    
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    const newOwner = await User.findById(userId);
    if (!newOwner) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // 新しいオーナーが組織に所属しているか確認
    if (newOwner.organizationId?.toString() !== organizationId) {
      return res.status(400).json({ message: 'User must belong to this organization to be assigned as owner' });
    }
    
    // 現在のオーナーを取得
    let previousOwner = null;
    if (organization.ownerId) {
      previousOwner = await User.findById(organization.ownerId);
    }
    
    // 現在のオーナーがいる場合は、ロールをAdminに変更
    if (previousOwner && previousOwner._id.toString() !== userId) {
      previousOwner.role = 'Admin';
      await previousOwner.save();
    }
    
    // 新しいオーナーのロールを更新
    newOwner.role = 'Owner';
    await newOwner.save();
    
    // 組織のオーナーIDを更新
    organization.ownerId = newOwner._id;
    await organization.save();
    
    return res.status(200).json({
      message: 'Organization owner changed successfully',
      organization: {
        id: organization._id,
        name: organization.name
      },
      newOwner: {
        id: newOwner._id,
        name: newOwner.name,
        email: newOwner.email
      },
      previousOwner: previousOwner ? {
        id: previousOwner._id,
        name: previousOwner.name,
        email: previousOwner.email,
        newRole: 'Admin'
      } : null
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};
```

### 5.3 新しいAPIルーティング

```typescript
// server/src/routes/admin.routes.ts

import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';
import { hybridAuthenticate, requireAdmin, requireOwner, requireSuperAdmin, requireOrganizationOwner } from '../middleware/hybrid-auth.middleware';

const router = Router();

// 既存のルート
router.get('/admins', hybridAuthenticate, requireSuperAdmin, AdminController.getAllUsers);
router.post('/admins', hybridAuthenticate, requireSuperAdmin, AdminController.createUser);

// ロール変更API - SuperAdmin権限が必要
router.put('/admins/:userId/role', hybridAuthenticate, requireSuperAdmin, AdminController.changeUserRole);

// 組織管理API - 新しいルート
router.get('/organizations/:organizationId/owner', hybridAuthenticate, requireAdmin, AdminController.getOrganizationOwner);

// 組織オーナー変更 - SuperAdminまたは現在のOwnerのみ可能
router.put('/organizations/:organizationId/owner', hybridAuthenticate, requireOrganizationOwner, AdminController.changeOrganizationOwner);

// その他のルート
// ...

export default router;
```

## 6. マイグレーション計画

既存のAdminロールユーザーからOwnerロールへの移行を行うためのマイグレーションスクリプトを作成します。

### 6.1 マイグレーションスクリプト

```typescript
// server/src/scripts/migrate-to-owner-role.ts

import { connect } from 'mongoose';
import { User } from '../models/User';
import { Organization } from '../models/Organization';

async function migrateToOwnerRole() {
  try {
    // 環境変数からMongoDB接続情報を取得
    const { MONGODB_URI } = process.env;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    // MongoDBに接続
    await connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // 組織を取得
    const organizations = await Organization.find({});
    console.log(`Found ${organizations.length} organizations`);
    
    // 各組織のsuperAdminIdを検索し、対応するユーザーをOwnerに変更
    for (const org of organizations) {
      if (org.superAdminId) {
        // superAdminIdをもとにユーザーを検索
        const adminUser = await User.findById(org.superAdminId);
        
        if (adminUser && adminUser.role === 'Admin') {
          // ロールとフィールド名を更新
          adminUser.role = 'Owner';
          await adminUser.save();
          
          // 組織のownerIdフィールドを更新
          org.ownerId = org.superAdminId;
          await org.save();
          
          console.log(`User ${adminUser._id} (${adminUser.email}) role changed from Admin to Owner for organization ${org._id} (${org.name})`);
        } else {
          console.log(`No admin user found for organization ${org._id} or user is not an Admin`);
        }
      } else {
        console.log(`Organization ${org._id} has no superAdminId`);
      }
    }
    
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// マイグレーションを実行
migrateToOwnerRole();
```

### 6.2 マイグレーション実行手順

1. マイグレーションスクリプトをserver/src/scriptsディレクトリに作成
2. ファイルをコンパイル（`tsc server/src/scripts/migrate-to-owner-role.ts`）
3. スクリプトを実行（`node server/dist/scripts/migrate-to-owner-role.js`）
4. ログを確認し、すべての組織に対してOwnerが正しく設定されたことを確認

### 6.3 ロールバック計画

マイグレーションに問題が発生した場合に備えて、ロールバックスクリプトも用意します：

```typescript
// server/src/scripts/rollback-owner-migration.ts

import { connect } from 'mongoose';
import { User } from '../models/User';
import { Organization } from '../models/Organization';

async function rollbackOwnerMigration() {
  try {
    // MongoDB接続
    await connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // すべてのOwnerロールユーザーを検索
    const ownerUsers = await User.find({ role: 'Owner' });
    console.log(`Found ${ownerUsers.length} users with Owner role`);
    
    // Ownerロールを持つすべてのユーザーをAdminロールに戻す
    for (const user of ownerUsers) {
      user.role = 'Admin';
      await user.save();
      console.log(`User ${user._id} (${user.email}) role changed from Owner to Admin`);
    }
    
    // 組織のownerIdをsuperAdminIdに戻す
    const organizations = await Organization.find({ ownerId: { $exists: true } });
    for (const org of organizations) {
      org.superAdminId = org.ownerId;
      await org.save();
      console.log(`Organization ${org._id} (${org.name}) ownerId field updated to superAdminId`);
    }
    
    console.log('Rollback completed');
  } catch (error) {
    console.error('Rollback failed:', error);
  }
}

// ロールバックを実行
rollbackOwnerMigration();
```

## 7. フロントエンド対応

### 7.1 認証コンテキスト（AuthContext）の更新

```tsx
// client/src/contexts/AuthContext.tsx

// 現在の実装
export const AuthContext = createContext<{
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  // ...その他のプロパティ
}>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSuperAdmin: false,
  // ...
});

// 拡張実装
export const AuthContext = createContext<{
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isOwner: boolean; // 追加
  isAdmin: boolean; // 追加
  hasAdminAccess: boolean; // 追加 (Admin以上の権限を持っているか)
  // ...その他のプロパティ
}>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSuperAdmin: false,
  isOwner: false,
  isAdmin: false,
  hasAdminAccess: false,
  // ...
});

// AuthProviderコンポーネント内での値の計算
const value = {
  user,
  isAuthenticated: !!user,
  isLoading,
  isSuperAdmin: user?.role === 'SuperAdmin',
  isOwner: user?.role === 'Owner',
  isAdmin: user?.role === 'Admin',
  hasAdminAccess: ['Admin', 'Owner', 'SuperAdmin'].includes(user?.role || ''),
  // ...その他のプロパティと関数
};
```

### 7.2 アクセス制御コンポーネント

```tsx
// client/src/components/common/OwnerRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingOverlay from '../common/LoadingOverlay';

interface OwnerRouteProps {
  children: React.ReactNode;
}

const OwnerRoute: React.FC<OwnerRouteProps> = ({ children }) => {
  const { user, isLoading, isOwner, isSuperAdmin } = useAuth();
  
  if (isLoading) {
    return <LoadingOverlay />;
  }
  
  if (!user || (!isOwner && !isSuperAdmin)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

export default OwnerRoute;
```

### 7.3 条件付きUIレンダリング

```tsx
// 権限に基づいた条件付きUIレンダリングの例

const SomeComponent = () => {
  const { isOwner, isAdmin, isSuperAdmin } = useAuth();
  
  return (
    <div>
      <h1>ダッシュボード</h1>
      
      {/* すべての管理者が見られるコンテンツ */}
      {(isAdmin || isOwner || isSuperAdmin) && (
        <div className="admin-panel">
          <h2>管理パネル</h2>
          {/* 共通の管理機能 */}
        </div>
      )}
      
      {/* オーナーとスーパー管理者のみが見られるコンテンツ */}
      {(isOwner || isSuperAdmin) && (
        <div className="owner-panel">
          <h2>オーナー設定</h2>
          {/* 課金情報やAdmin管理などの機能 */}
        </div>
      )}
      
      {/* スーパー管理者のみが見られるコンテンツ */}
      {isSuperAdmin && (
        <div className="super-admin-panel">
          <h2>システム管理</h2>
          {/* システム全体の設定など */}
        </div>
      )}
    </div>
  );
};
```

## 8. テスト計画

### 8.1 単体テスト

1. **モデルテスト**
   - Userモデルのバリデーション（有効なロール値のテスト）
   - OrganizationモデルのownerId参照の動作確認

2. **ミドルウェアテスト**
   - requireAdmin, requireOwner, requireSuperAdminミドルウェアの動作確認
   - 各権限レベルでの正常・異常ケーステスト

3. **コントローラーテスト**
   - ロール変更ロジックのテスト
   - 組織オーナー関連APIのテスト

### 8.2 統合テスト

1. **権限階層のテスト**
   - 各ロールでAPIアクセス可否の確認
   - SuperAdmin > Owner > Admin > Userの権限継承の確認

2. **組織関連操作のテスト**
   - 組織作成と自動Owner設定の確認
   - Owner変更時の権限更新の確認

3. **マイグレーションテスト**
   - マイグレーションスクリプトの動作確認（テスト環境）
   - エッジケースの確認

### 8.3 フロントエンドテスト

1. **コンポーネントテスト**
   - OwnerRoute, AdminRouteなどの保護コンポーネントのテスト
   - 条件付きUIレンダリングの確認

2. **E2Eテスト**
   - 異なるロールでのユーザーフローテスト
   - 権限に基づく機能アクセスの確認

## 9. 実装ステップと優先順位

1. **基本データモデル変更**（優先度：高）
   - User.tsモデルのroleフィールド拡張
   - Organization.tsモデルのownerId対応

2. **認証・認可ミドルウェア更新**（優先度：高）
   - hybrid-auth.middleware.tsの更新
   - 新しいミドルウェア関数追加

3. **マイグレーションスクリプト作成**（優先度：中）
   - 既存データの移行スクリプト実装
   - テスト環境での検証

4. **API実装・更新**（優先度：高）
   - 既存エンドポイントの権限チェック更新
   - 新規APIエンドポイント実装

5. **フロントエンド対応**（優先度：中）
   - AuthContextの拡張
   - 保護コンポーネントの更新・追加
   - UIの条件付きレンダリング更新

6. **テスト実施**（優先度：高）
   - 単体テスト・統合テストの実施
   - フロントエンドテストの実施

7. **本番環境への適用**（優先度：中）
   - マイグレーション実行
   - 動作監視

## 10. セキュリティ上の考慮事項

1. **最小権限の原則**
   - 各ロールが必要最小限の権限のみを持つように設計

2. **権限エスカレーション対策**
   - 厳格な権限チェックを実装
   - 特にOwner→SuperAdminへの昇格は厳重に管理

3. **監査ログ**
   - 権限変更操作はすべて監査ログに記録
   - Owner権限の付与・剥奪は詳細に追跡

4. **組織間データ分離**
   - 異なる組織のデータアクセスを厳格に制限
   - クロスオーガニゼーションアクセスの防止

## 11. 移行リスクと対策

1. **データ整合性リスク**
   - 対策：慎重なマイグレーションとバックアップ取得
   - 対策：ロールバックプランの用意

2. **運用混乱リスク**
   - 対策：段階的な移行と十分な説明資料
   - 対策：移行後のユーザーサポート強化

3. **パフォーマンスリスク**
   - 対策：権限チェック処理の最適化
   - 対策：必要に応じたインデックス追加

## 12. まとめ

4階層のロール構造（SuperAdmin、Owner、Admin、User）への移行により、組織の管理構造をより精緻に表現し、権限管理を強化します。本文書で提案された実装計画に従って段階的に移行を進めることで、既存の機能を保ちつつ、新しい権限モデルへとスムーズに移行することができます。

実装の過程では、特に権限チェックロジックと組織間のデータ分離に注意を払い、セキュリティを強化しながら機能拡張を行います。この変更により、より柔軟で安全な組織管理が可能となり、システム全体の堅牢性が向上することが期待されます。