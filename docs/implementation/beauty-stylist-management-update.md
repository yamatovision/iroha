# 「スタイリスト管理」実装ガイド（更新版）

## 概要

美姫命アプリの「スタイリスト管理」機能の実装ガイドです。4階層ロール構造（SuperAdmin、Owner、Admin、User）に対応し、組織（Organization）を中心としたユーザー管理を実装します。

## フロントエンド実装時の注意点

### 1. 最小限のコンポーネント構成（更新）

スタイリスト管理機能は以下のコアコンポーネントで構成されます：

- **StylistManagementPage**: メインコンテナ
- **StylistCard**: スタイリスト情報表示カード（ロールバッジを含む）
- **StylistModal**: スタイリスト追加/編集用モーダル（ロール選択肢更新）
- **SajuProfileModal**: 四柱推命情報表示モーダル
- **OrganizationOwnerSection**: 組織オーナー情報表示（新規）
- **ChangeOwnerModal**: オーナー変更モーダル（新規）

これらのコンポーネントは、既存の基盤コンポーネントを活用して実装します。

### 2. AuthContextの拡張対応

新しい4階層ロール構造に対応するために、AuthContextを拡張します：

```typescript
// AuthContext.tsx - 拡張例
export const AuthContext = createContext<{
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isOwner: boolean; // 新規: Owner権限チェック
  isAdmin: boolean; // 新規: Admin権限チェック
  hasAdminAccess: boolean; // 新規: Admin以上の権限チェック
  // その他のプロパティ
}>({
  // 初期値
});

// Provider内での実装
const value = {
  user,
  isAuthenticated: !!user,
  isLoading,
  isSuperAdmin: user?.role === 'SuperAdmin',
  isOwner: user?.role === 'Owner',
  isAdmin: user?.role === 'Admin',
  hasAdminAccess: ['Admin', 'Owner', 'SuperAdmin'].includes(user?.role || ''),
  // その他のメソッド
};
```

これにより、権限チェックがシンプルになります：

```jsx
// 使用例
const { isOwner, hasAdminAccess } = useAuth();

// オーナー専用UI
{isOwner && <OwnerOnlyFeature />}

// 管理者以上が利用可能なUI
{hasAdminAccess && <AdminFeature />}
```

### 3. 権限ベースのUI制御

ロールに基づいた条件付きUIレンダリングを実装します：

```typescript
// 権限チェックヘルパー
export const usePermissions = () => {
  const { user } = useAuth();
  
  // 権限チェック関数
  const canCreateAdmin = useCallback(() => {
    return ['Owner', 'SuperAdmin'].includes(user?.role || '');
  }, [user]);
  
  const canDeleteUser = useCallback((targetUser) => {
    // SuperAdminは全削除可能
    if (user?.role === 'SuperAdmin') return true;
    
    // Ownerは自組織内のAdmin/Userを削除可能（自分以外）
    if (user?.role === 'Owner') {
      return (
        targetUser.organizationId === user.organizationId &&
        targetUser._id !== user._id &&
        targetUser.role !== 'Owner'
      );
    }
    
    // Adminは自組織内のUserのみ削除可能
    if (user?.role === 'Admin') {
      return (
        targetUser.organizationId === user.organizationId &&
        targetUser.role === 'User'
      );
    }
    
    return false;
  }, [user]);
  
  // 他の権限チェック関数...
  
  return {
    canCreateAdmin,
    canDeleteUser,
    // その他のチェック関数
  };
};
```

### 4. organizationIdベースのデータ操作

従来の`createdBy`ではなく`organizationId`を使用してスタイリスト管理を行います：

```typescript
// スタイリスト取得カスタムフック
export const useStylistList = () => {
  const { user } = useAuth();
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchStylists = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      
      // 組織IDでフィルタリング
      const queryParams = new URLSearchParams({
        organizationId: user.organizationId,
        ...filters
      });
      
      const response = await fetch(`/api/v1/users?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('スタイリスト情報の取得に失敗しました');
      }
      
      const data = await response.json();
      setStylists(data.stylists || data);
    } catch (error) {
      console.error('Error fetching stylists:', error);
    } finally {
      setLoading(false);
    }
  }, [user.organizationId]);
  
  useEffect(() => {
    if (user?.organizationId) {
      fetchStylists();
    }
  }, [fetchStylists, user?.organizationId]);
  
  return { stylists, loading, fetchStylists };
};
```

### 5. オーナー管理機能の実装

組織オーナー情報の表示と変更機能を実装します：

```typescript
// オーナー管理カスタムフック
export const useOwnerManagement = (organizationId) => {
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const fetchOwner = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/organizations/${organizationId}/owner`);
      
      if (!response.ok) {
        throw new Error('オーナー情報の取得に失敗しました');
      }
      
      const data = await response.json();
      setOwner(data.owner);
    } catch (error) {
      console.error('Error fetching owner:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);
  
  const changeOwner = useCallback(async (newOwnerId) => {
    if (!organizationId || !newOwnerId) return;
    
    try {
      const response = await fetch(`/api/v1/organizations/${organizationId}/owner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newOwnerId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'オーナー変更に失敗しました');
      }
      
      // 成功時にデータを再取得
      fetchOwner();
      return true;
    } catch (error) {
      console.error('Error changing owner:', error);
      throw error;
    }
  }, [organizationId, fetchOwner]);
  
  useEffect(() => {
    fetchOwner();
  }, [fetchOwner]);
  
  return { owner, loading, fetchOwner, changeOwner };
};
```

## バックエンド実装時の注意点

### 1. データモデルの更新

組織を中心としたユーザー管理を実現するために、Userモデルを更新します：

```typescript
// User モデルの更新
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  displayName: string;
  role: 'SuperAdmin' | 'Owner' | 'Admin' | 'User';
  organizationId?: mongoose.Types.ObjectId;
  jobTitle?: string;
  profileImage?: string;
  // 他のフィールド
}

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  role: {
    type: String,
    enum: ['SuperAdmin', 'Owner', 'Admin', 'User'],
    default: 'User'
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },
  jobTitle: String,
  profileImage: String,
  // 他のフィールド
});

export const User = mongoose.model<IUser>('User', UserSchema);
```

### 2. APIエンドポイントの更新

組織IDベースのフィルタリングに対応し、権限チェックを実装します：

```typescript
// users.controller.ts - スタイリスト一覧取得
export const getUsers = async (req, res) => {
  try {
    const { organizationId, role, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * Number(limit);
    
    // 検索条件の構築
    const filter: any = {};
    
    // 組織IDでフィルタリング（重要：権限ベースのチェック）
    if (req.user.role === 'SuperAdmin') {
      // SuperAdminは任意の組織のユーザーを取得可能
      if (organizationId) {
        filter.organizationId = organizationId;
      }
    } else {
      // そうでない場合は自組織のユーザーのみ取得可能
      filter.organizationId = req.user.organizationId;
    }
    
    // ロールでフィルタリング
    if (role) {
      if (Array.isArray(role)) {
        filter.role = { $in: role };
      } else {
        filter.role = role;
      }
    }
    
    // 検索条件
    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
      ];
    }
    
    // ユーザー取得
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    
    // 総数取得
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      stylists: users,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ message: 'ユーザー情報の取得に失敗しました', error: error.message });
  }
};
```

### 3. 権限チェックミドルウェアの更新

4階層ロール構造に対応した権限チェックミドルウェアを実装します：

```typescript
// auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Organization } from '../models/Organization';

// SuperAdmin権限チェック
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'SuperAdmin permission required' });
  }
  next();
};

// Owner権限チェック（SuperAdminも通過可能）
export const requireOwner = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'Owner' && req.user?.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Owner permission required' });
  }
  next();
};

// Admin権限チェック（Owner/SuperAdminも通過可能）
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!['Admin', 'Owner', 'SuperAdmin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Admin permission required' });
  }
  next();
};

// 組織オーナーチェック
export const requireOrganizationOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    
    // SuperAdminはすべての組織にアクセス可能
    if (req.user?.role === 'SuperAdmin') {
      return next();
    }
    
    // 組織存在チェック
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    // オーナーチェック
    if (req.user?.role === 'Owner' && 
        organization.ownerId?.toString() === req.user._id?.toString()) {
      return next();
    }
    
    return res.status(403).json({ message: 'Organization owner permission required' });
  } catch (error) {
    return res.status(500).json({ message: 'Permission check error', error: error.message });
  }
};

// 組織内のユーザー管理権限チェック
export const requireOrganizationAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 対象ユーザーの取得
    const { userId } = req.params;
    if (!userId) {
      return next(); // ユーザーIDがない場合は次へ（新規作成など）
    }
    
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // SuperAdminはすべてのユーザーを管理可能
    if (req.user?.role === 'SuperAdmin') {
      return next();
    }
    
    // 自分自身の場合、一部の操作は許可（詳細取得など）
    if (req.user?._id.toString() === userId) {
      // ロール変更などは別のミドルウェアでチェック
      return next();
    }
    
    // 組織チェック - 同じ組織のユーザーのみ操作可能
    if (targetUser.organizationId?.toString() !== req.user?.organizationId?.toString()) {
      return res.status(403).json({ message: 'Cannot manage users from different organizations' });
    }
    
    // Owner権限チェック
    if (req.user?.role === 'Owner') {
      return next(); // Ownerはすべての組織内ユーザーを管理可能
    }
    
    // Admin権限チェック - Adminは一般ユーザーのみ管理可能
    if (req.user?.role === 'Admin' && targetUser.role === 'User') {
      return next();
    }
    
    return res.status(403).json({ message: 'Insufficient permissions' });
  } catch (error) {
    return res.status(500).json({ message: 'Permission check error', error: error.message });
  }
};
```

### 4. オーナー変更APIの実装

組織オーナー変更のエンドポイントを実装します：

```typescript
// organization.controller.ts

// 組織オーナー取得
export const getOrganizationOwner = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    if (!organization.ownerId) {
      return res.status(404).json({ message: 'No owner assigned to this organization' });
    }
    
    const owner = await User.findById(organization.ownerId).select('-password');
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    
    res.status(200).json({ owner });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get organization owner', error: error.message });
  }
};

// 組織オーナー変更
export const changeOrganizationOwner = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
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
      return res.status(400).json({ message: 'User must belong to this organization to be set as owner' });
    }
    
    // 現在のオーナーを取得
    let previousOwner = null;
    if (organization.ownerId) {
      previousOwner = await User.findById(organization.ownerId);
    }
    
    // トランザクション開始
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 現在のオーナーがいる場合はロールをAdminに変更
      if (previousOwner && previousOwner._id.toString() !== userId) {
        previousOwner.role = 'Admin';
        await previousOwner.save({ session });
      }
      
      // 新しいオーナーのロールを更新
      newOwner.role = 'Owner';
      await newOwner.save({ session });
      
      // 組織のオーナーIDを更新
      organization.ownerId = newOwner._id;
      await organization.save({ session });
      
      // トランザクションをコミット
      await session.commitTransaction();
      
      res.status(200).json({
        message: 'Organization owner changed successfully',
        organization: {
          _id: organization._id,
          name: organization.name
        },
        newOwner: {
          _id: newOwner._id,
          name: newOwner.displayName,
          email: newOwner.email,
          role: 'Owner'
        },
        previousOwner: previousOwner ? {
          _id: previousOwner._id,
          name: previousOwner.displayName,
          email: previousOwner.email,
          role: 'Admin'
        } : null
      });
    } catch (error) {
      // エラー時はロールバック
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to change organization owner', error: error.message });
  }
};
```

## 重要なエッジケースとその対処法

以下のエッジケースに特に注意が必要です：

### 1. オーナー不在のケース

- **問題**: 組織からオーナーがいなくなる状況
- **対処法**: 
  - オーナー変更は必ず既存オーナー→新オーナーの順で処理する
  - オーナー削除時は代替オーナーの指定を必須とする

```typescript
// オーナー削除防止チェック
export const checkOwnerDeletion = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // 対象ユーザーを取得
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // オーナー削除チェック
    if (user.role === 'Owner') {
      return res.status(400).json({ 
        message: 'Cannot delete an owner. Change organization owner first.',
        requireOwnerChange: true
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking owner deletion', error: error.message });
  }
};
```

### 2. 同一組織内の権限エスカレーション

- **問題**: 権限のない人がAdmin/Owner権限を与えようとするケース
- **対処法**:
  - 役割変更時の厳格な権限チェック
  - フロントエンドとバックエンドの両方でチェック

```typescript
// 権限エスカレーション防止チェック
export const checkRoleEscalation = async (req, res, next) => {
  try {
    const { role } = req.body;
    
    // ロール変更がない場合はスキップ
    if (!role) {
      return next();
    }
    
    // SuperAdminは全変更可能
    if (req.user.role === 'SuperAdmin') {
      return next();
    }
    
    // Ownerだけが権限昇格できる
    if (req.user.role !== 'Owner') {
      return res.status(403).json({ message: 'Only owners can change user roles' });
    }
    
    // Ownerは他のユーザーをOwnerにできない（オーナー変更API経由のみ可能）
    if (role === 'Owner' || role === 'SuperAdmin') {
      return res.status(403).json({ message: 'Cannot assign this role directly' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking role escalation', error: error.message });
  }
};
```

### 3. 組織間のデータアクセス漏洩

- **問題**: 他の組織のユーザーにアクセスできてしまうケース
- **対処法**:
  - すべてのAPIで組織IDチェックを徹底
  - ミドルウェアによる早期のアクセス制限

```typescript
// 組織間のデータアクセス漏洩防止
export const checkOrganizationAccess = async (req, res, next) => {
  try {
    const targetOrgId = req.params.organizationId || req.query.organizationId;
    
    // SuperAdminはすべての組織にアクセス可能
    if (req.user.role === 'SuperAdmin') {
      return next();
    }
    
    // 組織IDが指定されていない場合は自分の組織IDを設定
    if (!targetOrgId) {
      req.query.organizationId = req.user.organizationId;
      return next();
    }
    
    // 自分の組織以外へのアクセスを制限
    if (targetOrgId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({ message: 'Access denied to other organizations' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking organization access', error: error.message });
  }
};
```

## パフォーマンス考慮点とセキュリティ対策

### パフォーマンス最適化

1. **インデックス設定**:
   ```typescript
   // Userモデルにインデックスを追加
   UserSchema.index({ organizationId: 1 });
   UserSchema.index({ organizationId: 1, role: 1 });
   UserSchema.index({ email: 1 }, { unique: true });
   ```

2. **プロジェクション最適化**:
   ```typescript
   // 必要なフィールドのみ取得
   const users = await User.find(filter)
     .select('_id displayName email role jobTitle profileImage')
     .lean();
   ```

3. **ページネーションの実装**:
   ```typescript
   // ページネーションの実装例
   const { page = 1, limit = 20 } = req.query;
   const skip = (page - 1) * Number(limit);
   
   const users = await User.find(filter)
     .skip(skip)
     .limit(Number(limit))
     .sort({ displayName: 1 });
   ```

### セキュリティ対策

1. **詳細な権限チェック**:
   - 各APIエンドポイントで権限レベルに応じたチェック
   - 権限エスカレーション対策の徹底
   - 組織間のデータアクセス制限

2. **監査ログ実装**:
   ```typescript
   // 権限変更時の監査ログ記録
   export const logRoleChange = async (user, targetUser, prevRole, newRole) => {
     try {
       await AuditLog.create({
         action: 'ROLE_CHANGE',
         performedBy: user._id,
         performedByRole: user.role,
         targetUser: targetUser._id,
         organizationId: targetUser.organizationId,
         details: {
           previousRole: prevRole,
           newRole: newRole
         },
         ipAddress: req.ip,
         timestamp: new Date()
       });
     } catch (error) {
       console.error('Failed to create audit log:', error);
     }
   };
   ```

3. **入力バリデーション強化**:
   ```typescript
   // バリデーション関数
   const validateUserInput = (data) => {
     const errors = {};
     
     if (!data.email || !isValidEmail(data.email)) {
       errors.email = '有効なメールアドレスを入力してください';
     }
     
     if (!data.displayName || data.displayName.trim().length < 2) {
       errors.displayName = '名前は2文字以上で入力してください';
     }
     
     if (data.role && !['User', 'Admin', 'Owner', 'SuperAdmin'].includes(data.role)) {
       errors.role = '無効なロールが指定されています';
     }
     
     return {
       isValid: Object.keys(errors).length === 0,
       errors
     };
   };
   ```

## 実装優先順位リスト

以下の優先順位で実装を進めることを推奨します：

1. **データモデル基盤の更新**:
   - Userモデルの`role`フィールド拡張
   - `organizationId`フィールドによる組織紐付け

2. **API基盤の更新**:
   - 認証・認可ミドルウェアの4階層対応
   - 組織IDベースのフィルタリングの実装

3. **スタイリスト一覧・詳細機能**:
   - ロールバッジ表示の更新
   - 権限に基づいた操作ボタン表示

4. **スタイリスト追加・編集機能**:
   - ロール選択UIの更新
   - 権限チェック機能の実装

5. **オーナー管理機能**:
   - 組織オーナー表示セクション
   - オーナー変更機能

6. **高度な機能追加**:
   - ロールベースフィルタリング
   - 監査ログインターフェース

## 段階的リリース戦略

1. **フェーズ1**: データモデル更新と基本API対応
   - ユーザーモデルの更新
   - 認証・認可ミドルウェアの更新
   - 既存管理者のOwner/Adminへの変換

2. **フェーズ2**: UIアップデート
   - ロールバッジ表示の追加
   - 権限に基づいた操作制限の実装
   - スタイリスト管理画面の更新

3. **フェーズ3**: オーナー管理機能
   - 組織オーナー表示セクションの追加
   - オーナー変更モーダルの実装
   - 監査ログ機能の強化

## テスト戦略とテストケース一覧

### 1. 単体テスト

- **権限チェックミドルウェアのテスト**:
  - 各ロール(SuperAdmin、Owner、Admin、User)のアクセス権限テスト
  - 異なる組織間のアクセス制限テスト

- **ユーザー管理APIのテスト**:
  - 組織IDベースのフィルタリングテスト
  - ロール変更時の権限チェックテスト
  - オーナー変更処理の整合性テスト

### 2. 統合テスト

- **ユーザーフローテスト**:
  - Ownerによるスタイリスト（User）作成→編集→削除フロー
  - Ownerによる管理者（Admin）追加→権限設定フロー
  - オーナー変更プロセス全体のテスト

- **権限分離テスト**:
  - Adminができる操作とできない操作の検証
  - Userの権限制限の検証
  - 異なる組織のユーザーへのアクセス制限テスト

### 3. ビジュアルテスト

- **ロールバッジ表示テスト**:
  - 各ロールのバッジが正しく表示されるか
  - 条件付きUIレンダリングの動作確認

- **権限ベースのUI制御テスト**:
  - 各ロールで表示されるボタンと操作の検証
  - エラーメッセージの表示と処理の検証

## 「本質的な価値」の評価

スタイリスト管理機能において、以下の機能は本質的な価値を提供します：

### 必須機能（削除不可）

- **基本的なユーザー管理**:
  - 組織内のスタイリスト/管理者一覧表示
  - スタイリスト追加・編集・削除
  - ロールに基づいた権限分離

- **四柱推命情報の連携**:
  - スタイリストの命式情報管理
  - 四柱推命情報の表示機能

- **オーナー管理**:
  - 組織オーナーの明確化
  - オーナー変更機能

### 重要だが簡略化可能な機能

- **監査ログ**:
  - 初期段階では簡易的なログ記録で可
  - 後続フェーズで詳細な監査機能を追加

- **詳細な検索・フィルタリング**:
  - 初期段階では基本的な検索機能のみで可
  - 高度なフィルタリングは後続で実装

### 削除しても本質を損なわない機能

- **リッチな統計情報**:
  - 基本的なユーザー管理が整備されれば十分
  - 詳細な統計情報は後続フェーズで追加

- **プロフィール画像アップロード**:
  - 初期段階ではデフォルトアイコンで十分
  - 画像管理機能は後続で実装

## まとめ

4階層ロール構造と組織ベースのデータモデルへの対応により、スタイリスト管理機能はより柔軟で安全なものになります。適切な権限分離と組織間のデータアクセス制限により、マルチテナント環境でも安全な運用が可能になります。段階的な実装アプローチにより、基盤機能から順に拡張していくことで、リスクを最小化しつつ機能を充実させることができます。