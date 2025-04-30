# スタイリスト管理機能 更新計画

## 現状分析と更新目的

現在のスタイリスト管理機能は、3階層のロール構造（SuperAdmin、Admin、User）を前提に設計されており、ユーザーは直接Adminに紐づいています。新しい4階層ロール構造（SuperAdmin、Owner、Admin、User）に対応し、Organization（組織）を中心としたデータモデルに変更する必要があります。

## 主な更新ポイント

### データモデル更新
1. User モデルに明示的な `organizationId` フィールドを追加する
2. ロールフィールドに「Owner」を追加する
3. スタイリスト取得時に `createdBy` ではなく `organizationId` でフィルタリングする
4. 組織内での権限管理を強化する（Owner、Adminの権限を明確化）
5. スタイリスト追加時に組織IDを設定する

### UI更新
1. ロール選択肢に「Owner」を追加
2. 権限に基づいた機能制限（Ownerのみができる操作を明確化）
3. UI表示の調整（ロールバッジなど）
4. バックエンドAPI呼び出しの修正（新しい権限チェックに対応）
5. オーナー管理機能の追加

## 実装計画

### 1. データモデル更新
```typescript
// User モデル
const UserSchema = new Schema({
  // 既存フィールド...
  
  // 組織ID参照（重要）
  organizationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Organization' 
  },
  
  // createdBy は残すが、直接的な権限管理には使用しない
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  role: {
    type: String,
    enum: ['SuperAdmin', 'Owner', 'Admin', 'User'],
    default: 'User'
  },
  
  // その他のフィールド...
});
```

### 2. API更新
```typescript
// スタイリスト一覧取得 API
export const getStylists = async (req, res) => {
  try {
    // 現在のユーザーの組織ID
    const { organizationId } = req.user;
    
    // 検索条件の構築 - organizationId で絞り込み
    const filter: any = { 
      organizationId, // 組織に属するユーザーを取得
      role: { $ne: 'SuperAdmin' } // SuperAdminは除外
    };
    
    // SuperAdminの場合は特定の組織でフィルタリング
    if (req.user.role === 'SuperAdmin' && req.query.organizationId) {
      filter.organizationId = req.query.organizationId;
    }
    
    // 検索条件
    if (req.query.search) {
      filter.$or = [
        { displayName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { jobTitle: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // スタイリスト取得
    const stylists = await User.find(filter)
      .select('-password') // パスワードは除外
      .sort({ createdAt: -1 });
    
    res.status(200).json(stylists);
  } catch (error) {
    res.status(500).json({ message: 'スタイリスト情報の取得に失敗しました', error: error.message });
  }
};
```

### 3. 権限チェック更新
```typescript
// 権限チェックヘルパー関数
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

### 4. UI更新（ロールバッジ）
```html
<!-- スタイリストカード内のロール表示部分を修正 -->
<div class="stylist-role">
  スタイリスト
  <!-- 管理者ロールバッジ -->
  <span class="stylist-badge" v-if="stylist.role === 'Admin'">管理者</span>
  <!-- オーナーロールバッジ（追加） -->
  <span class="stylist-badge owner-badge" v-if="stylist.role === 'Owner'">オーナー</span>
</div>
```

### 5. スタイリスト編集モーダル更新
```html
<!-- 権限選択部分を修正 -->
<div class="form-group">
  <label class="form-label">権限</label>
  <div class="status-selector">
    <div class="status-option" :class="{ active: selectedRole === 'User' }" @click="selectedRole = 'User'">
      スタイリスト
    </div>
    <div class="status-option" :class="{ active: selectedRole === 'Admin' }" @click="selectedRole = 'Admin'">
      管理者
    </div>
    <!-- オーナー権限はOwnerまたはSuperAdminの場合のみ表示 -->
    <div class="status-option" :class="{ active: selectedRole === 'Owner' }" @click="selectedRole = 'Owner'"
         v-if="user.role === 'Owner' || user.role === 'SuperAdmin'">
      オーナー
    </div>
  </div>
</div>
```

### 6. オーナー管理機能の追加
```jsx
// オーナー情報表示
<div class="organization-owner-info" v-if="user.role === 'Owner' || user.role === 'SuperAdmin'">
  <h3>サロンオーナー情報</h3>
  <p>このサロンのオーナーは <strong>{{owner.name}}</strong> です。</p>
  <p>オーナーは課金情報の管理や管理者ユーザーの登録などを行う権限を持ちます。</p>
  
  <!-- オーナー変更ボタン（SuperAdminまたは現オーナーのみ表示） -->
  <button 
    v-if="user._id === owner._id || user.role === 'SuperAdmin'"
    class="btn-change-owner" 
    @click="showChangeOwnerModal">
    オーナーを変更
  </button>
</div>
```

## 実装優先順位

1. データモデル更新と基本APIの対応
2. 権限チェックロジックの実装
3. UIコンポーネントの更新
4. オーナー管理機能の追加
5. 高度な機能（フィルタリング等）の実装

## 注意点

1. **データ移行**: 既存のAdmin権限ユーザーが適切にOwner/Adminに分離されるようにマイグレーションを慎重に行う
2. **権限チェック**: 組織間のデータアクセスが発生しないよう、厳格な権限チェックを実装する
3. **UI整合性**: 権限に応じて適切なUIコンポーネントのみが表示されるようにする
4. **オーナー一意性**: 組織内にはオーナーが必ず1人存在し、かつ最大1人しか存在しないよう制約する

## 次のステップ

1. データモデルの詳細設計書の更新
2. UI設計書の更新
3. API仕様書の更新
4. 実装ガイドの更新
5. マイグレーションスクリプトの作成