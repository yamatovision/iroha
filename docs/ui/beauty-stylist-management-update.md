# 「スタイリスト管理」UI設計と状態管理（更新版）

## 概要

美姫命アプリのスタイリスト管理画面のUI設計と状態管理の詳細設計です。4階層ロール構造（SuperAdmin、Owner、Admin、User）に対応し、組織に紐づくユーザー管理を実現します。

## コンポーネント構成とレイアウト

### 主要コンポーネント

1. **StylistManagementPage**:
   - 全体のページコンテナ
   - レイアウト管理とデータ取得ロジックを担当

2. **StylistSearchBar**:
   - スタイリスト検索フォーム
   - フィルタリングオプション（ロール別など）

3. **StylistCardGrid**:
   - スタイリストカードのグリッドコンテナ
   - レスポンシブレイアウト管理

4. **StylistCard**:
   - 個別のスタイリスト情報表示カード
   - ロールバッジの表示（Owner/Admin/User）
   - 権限に基づいた操作ボタン表示

5. **StylistModal**:
   - スタイリスト追加/編集用モーダル
   - 4階層ロール構造に対応したロール選択UI
   - 権限に基づいた入力フィールド制御

6. **SajuProfileModal**:
   - 四柱推命プロファイル表示用モーダル
   - 四柱推命情報の詳細表示

7. **OrganizationOwnerSection**（新規）:
   - 組織オーナー情報表示セクション
   - オーナー変更機能（Owner/SuperAdminのみ表示）

### コンポーネント階層

```
StylistManagementPage
│
├── Header
│   ├── StylistSearchBar
│   └── OrganizationOwnerSection (新規)
│
├── StylistCardGrid
│   ├── StylistCard (複数)
│   │   ├── StylistCardHeader
│   │   │   └── RoleBadge (Owner/Admin/User)
│   │   ├── StylistCardBody
│   │   └── StylistCardFooter
│   │
│   └── EmptyState (スタイリストがない場合)
│
├── Pagination
│
├── StylistModal (追加/編集用)
│   ├── StylistForm
│   │   ├── AvatarUpload
│   │   ├── RoleSelector (権限に基づいて選択肢を変更)
│   │   └── FormFields
│   │
│   └── ModalFooter
│
├── SajuProfileModal (四柱推命情報表示用)
│   ├── ProfileHeader
│   ├── ElementBalance
│   ├── TabPanel
│   │   ├── PillarTab
│   │   ├── CombinationTab
│   │   ├── TenGodTab
│   │   └── CharacteristicsTab
│   │
│   └── ModalFooter
│
└── ChangeOwnerModal (新規)
    ├── CurrentOwnerInfo
    ├── NewOwnerSelector
    └── ModalFooter
```

## 状態管理方法

### グローバル状態 (React Context)

1. **AuthContext**:
   - 認証情報、ユーザーロール状態
   - 権限ヘルパー関数（isOwner, isAdmin, isSuperAdmin）
   - 組織ID情報

2. **NotificationContext**:
   - 操作結果の通知表示
   - エラーメッセージ管理

### ローカル状態 (useState/useReducer)

1. **StylistManagementPage**:
   ```typescript
   // スタイリスト一覧データ
   const [stylists, setStylists] = useState<IStylist[]>([]);
   
   // ローディング状態
   const [loading, setLoading] = useState<boolean>(true);
   
   // エラー状態
   const [error, setError] = useState<string | null>(null);
   
   // 組織情報
   const [organization, setOrganization] = useState<IOrganization | null>(null);
   
   // ページネーション状態
   const [pagination, setPagination] = useState({
     currentPage: 1,
     totalPages: 1,
     totalItems: 0
   });
   
   // 検索フィルタ状態
   const [filters, setFilters] = useState({
     searchTerm: '',
     hasSajuProfile: null,
     role: ''  // ロールによるフィルタリング追加
   });
   
   // モーダル表示状態
   const [modalState, setModalState] = useState({
     isAddModalOpen: false,
     isEditModalOpen: false,
     isSajuModalOpen: false,
     isChangeOwnerModalOpen: false, // 新規追加
     selectedStylist: null
   });
   ```

2. **StylistForm**:
   ```typescript
   // フォーム入力値
   const [formData, setFormData] = useState({
     displayName: '',
     email: '',
     password: '',
     jobTitle: '',
     profileImage: '',
     role: 'User' // 初期値を User に設定
   });
   
   // 入力検証エラー
   const [formErrors, setFormErrors] = useState({
     displayName: '',
     email: '',
     password: ''
   });
   
   // 送信中状態
   const [submitting, setSubmitting] = useState(false);
   ```

## データロードと更新フロー

### データロードフロー

1. **初期データロード**:
   ```typescript
   useEffect(() => {
     const fetchStylists = async () => {
       try {
         setLoading(true);
         
         // 組織ID基準でスタイリスト取得（重要な変更）
         const response = await fetch(
           `/api/v1/users?organizationId=${currentUser.organizationId}&role=${filters.role}&page=${pagination.currentPage}&search=${filters.searchTerm}`
         );
         
         if (!response.ok) {
           throw new Error('スタイリスト情報の取得に失敗しました');
         }
         
         const data = await response.json();
         
         // 四柱推命情報の有無を判定してフラグを追加
         const stylistsWithSajuStatus = data.stylists.map(stylist => ({
           ...stylist,
           hasSajuProfile: !!(stylist.birthDate && stylist.birthTime && stylist.birthPlace)
         }));
         
         setStylists(stylistsWithSajuStatus);
         setPagination({
           currentPage: data.currentPage,
           totalPages: data.totalPages,
           totalItems: data.total
         });
       } catch (error) {
         setError(error.message);
       } finally {
         setLoading(false);
       }
     };
     
     // 組織情報の取得も追加
     const fetchOrganization = async () => {
       if (currentUser.organizationId) {
         try {
           const response = await fetch(`/api/v1/organizations/${currentUser.organizationId}`);
           if (response.ok) {
             const orgData = await response.json();
             setOrganization(orgData);
           }
         } catch (error) {
           console.error('組織情報の取得に失敗:', error);
         }
       }
     };
     
     fetchStylists();
     fetchOrganization();
   }, [currentUser.organizationId, pagination.currentPage, filters]);
   ```

### スタイリスト更新フロー

1. **スタイリスト追加**:
   ```typescript
   const handleAddStylist = async (formData) => {
     try {
       setSubmitting(true);
       
       // 組織IDの設定
       const requestData = {
         ...formData,
         organizationId: currentUser.organizationId  // 所属組織の設定
       };
       
       const response = await fetch('/api/v1/users', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify(requestData)
       });
       
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'スタイリストの追加に失敗しました');
       }
       
       const newStylist = await response.json();
       
       // 状態を更新
       setStylists(prev => [...prev, {
         ...newStylist,
         hasSajuProfile: false // 新規追加時は四柱推命情報なし
       }]);
       
       // モーダルを閉じる
       setModalState(prev => ({ ...prev, isAddModalOpen: false }));
       
       // 成功通知
       showNotification('スタイリストを追加しました', 'success');
       
       // Owner追加時は組織情報も更新
       if (formData.role === 'Owner') {
         fetchOrganization();
       }
     } catch (error) {
       showNotification(error.message, 'error');
     } finally {
       setSubmitting(false);
     }
   };
   ```

2. **オーナー変更処理**（新規）:
   ```typescript
   const handleChangeOwner = async (newOwnerId) => {
     try {
       setSubmitting(true);
       
       const response = await fetch(`/api/v1/organizations/${currentUser.organizationId}/owner`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           userId: newOwnerId
         })
       });
       
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'オーナー変更に失敗しました');
       }
       
       const result = await response.json();
       
       // モーダルを閉じる
       setModalState(prev => ({ ...prev, isChangeOwnerModalOpen: false }));
       
       // スタイリスト一覧と組織情報を更新
       fetchStylists();
       fetchOrganization();
       
       // 成功通知
       showNotification('組織オーナーを変更しました', 'success');
     } catch (error) {
       showNotification(error.message, 'error');
     } finally {
       setSubmitting(false);
     }
   };
   ```

## 権限に基づいたUI条件レンダリング

```jsx
// 権限チェックヘルパー関数
const canEditRole = (targetUser, targetRole) => {
  // SuperAdminはすべてのロール変更可能
  if (currentUser.role === 'SuperAdmin') return true;
  
  // Ownerは自組織内の権限変更可能（ただしOwner権限の付与はOwnerのみ）
  if (currentUser.role === 'Owner') {
    // Ownerは自分自身のロールを変更できない
    if (targetUser._id === currentUser._id) return false;
    
    // Ownerは他のユーザーをOwnerにはできない（オーナー変更APIを使用）
    if (targetRole === 'Owner') return false;
    
    // AdminやUserへの変更は可能
    return true;
  }
  
  // Adminはロール変更不可
  return false;
};

// UI内での使用例
{/* ロール選択コンポーネント */}
<div className="form-group">
  <label className="form-label">権限</label>
  <div className="status-selector">
    <div 
      className={`status-option ${selectedRole === 'User' ? 'active' : ''}`} 
      onClick={() => setSelectedRole('User')}
    >
      スタイリスト
    </div>
    
    {/* Admin権限はOwnerまたはSuperAdminのみ選択可能 */}
    {(currentUser.role === 'Owner' || currentUser.role === 'SuperAdmin') && (
      <div 
        className={`status-option ${selectedRole === 'Admin' ? 'active' : ''}`} 
        onClick={() => setSelectedRole('Admin')}
      >
        管理者
      </div>
    )}
    
    {/* Owner権限はOwner変更機能を通じてのみ設定可能 */}
    {currentUser.role === 'SuperAdmin' && (
      <div 
        className={`status-option ${selectedRole === 'Owner' ? 'active' : ''}`} 
        onClick={() => setSelectedRole('Owner')}
      >
        オーナー
      </div>
    )}
  </div>
</div>
```

## コンポーネント間のデータフロー詳細図

```
┌─────────────────┐     ユーザー認証情報    ┌────────────────────┐
│                 │◄────────────────────────┤                    │
│   AuthContext   │                         │ スタイリスト管理画面 │
│                 │────────────────────────►│                    │
└─────────────────┘     権限チェック        └────────────────────┘
        ▲                                          │
        │                                          │
        │ ユーザー情報                              │
        │                                          ▼
┌─────────────────┐ 組織・スタイリスト情報取得 ┌────────────────────┐
│                 │◄────────────────────────┤                    │
│   APIサービス    │                         │  データ管理コンポーネント│
│                 │────────────────────────►│                    │
└─────────────────┘                         └────────────────────┘
        │                                          │
        │ CRUD操作                                 │
        ▼                                          ▼
┌─────────────────┐      コンポーネント更新   ┌────────────────────┐
│ 権限管理システム  │◄────────────────────────┤                    │
│ (4階層ロール)    │                         │ UI表示コンポーネント群 │
│                 │────────────────────────►│                    │
└─────────────────┘      権限によるUI制御     └────────────────────┘
```

## 新しいUI要素の詳細

### 1. オーナー情報セクション（新規）

```jsx
// OrganizationOwnerSection コンポーネント
const OrganizationOwnerSection = ({ organization, onChangeOwner }) => {
  const { user } = useAuth();
  const isOwnerOrSuperAdmin = user.role === 'Owner' || user.role === 'SuperAdmin';
  
  if (!organization || !organization.ownerId) return null;
  
  return (
    <div className="owner-info-section">
      <h3>サロンオーナー情報</h3>
      <div className="owner-card">
        <div className="owner-avatar">
          {organization.owner.profileImage ? (
            <img src={organization.owner.profileImage} alt={organization.owner.displayName} />
          ) : (
            <span className="avatar-placeholder">{organization.owner.displayName.charAt(0)}</span>
          )}
        </div>
        <div className="owner-details">
          <div className="owner-name">{organization.owner.displayName}</div>
          <div className="owner-email">{organization.owner.email}</div>
        </div>
        {isOwnerOrSuperAdmin && (
          <button className="change-owner-btn" onClick={onChangeOwner}>
            オーナー変更
          </button>
        )}
      </div>
      <p className="owner-description">
        オーナーはサロン全体の設定、課金情報の管理、管理者の追加などの権限を持ちます。
      </p>
    </div>
  );
};
```

### 2. ロールバッジ（更新）

```css
/* スタイルの更新例 */
.stylist-badge {
  background-color: #e91e63;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
}

.owner-badge {
  background-color: #9c27b0; /* オーナーは紫色 */
}

.admin-badge {
  background-color: #e91e63; /* 管理者はピンク */
}

.user-badge {
  background-color: #2196f3; /* スタイリストは青 */
}
```

```jsx
// ロールバッジコンポーネント
const RoleBadge = ({ role }) => {
  let badgeClass = 'stylist-badge';
  let label = '';
  
  switch (role) {
    case 'Owner':
      badgeClass += ' owner-badge';
      label = 'オーナー';
      break;
    case 'Admin':
      badgeClass += ' admin-badge';
      label = '管理者';
      break;
    case 'User':
      badgeClass += ' user-badge';
      label = 'スタイリスト';
      break;
    default:
      return null;
  }
  
  return <span className={badgeClass}>{label}</span>;
};

// 使用例
<div className="stylist-name">
  {stylist.displayName}
  <RoleBadge role={stylist.role} />
</div>
```

## レスポンシブデザインの考慮点

1. **モバイル対応**:
   - スタイリストカードを1列表示に変更
   - 操作ボタンをタップしやすいサイズに調整
   - モーダルの幅をビューポートに適応

2. **タブレット対応**:
   - 2列グリッドレイアウトに変更
   - サイドバーを適切なサイズに調整

3. **デスクトップ対応**:
   - 3列以上のグリッドレイアウト
   - より多くの情報を同時に表示

4. **実装方法**:
   ```css
   /* スタイリストカードグリッド */
   .card-grid {
     display: grid;
     grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
     gap: 24px;
   }
   
   /* レスポンシブ対応 */
   @media (max-width: 768px) {
     .card-grid {
       grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
     }
   }
   
   @media (max-width: 480px) {
     .card-grid {
       grid-template-columns: 1fr;
     }
   }
   ```

## アクセシビリティ対応

1. **キーボードナビゲーション**:
   - フォーカス可能な要素の適切なタブ順序
   - キーボードでの操作サポート

2. **スクリーンリーダー対応**:
   - 適切なARIA属性の使用
   - 意味のある代替テキストの提供

3. **カラーコントラスト**:
   - アクセシビリティガイドラインに準拠したカラーコントラスト
   - 視覚的な状態表示の補足情報提供

4. **実装例**:
   ```jsx
   <button
     className="saju-button"
     onClick={handleShowProfile}
     disabled={!hasSajuProfile}
     aria-label={hasSajuProfile ? "四柱推命情報を表示" : "四柱推命情報なし"}
   >
     <span className="material-icons" aria-hidden="true">psychology</span>
     {hasSajuProfile ? '四柱推命情報を表示' : '四柱推命情報なし'}
   </button>
   ```

## 実装優先順位

前回の設計から継続して、レスポンシブ対応とアクセシビリティ対応を維持します。加えて、4階層ロール構造とOrganizationベースのデータモデルに対応するために、以下の実装優先順位を設定します：

1. データモデル更新と基本APIの対応
2. 権限チェックロジックの実装
3. UIコンポーネントの更新
4. オーナー管理機能の追加
5. 高度な機能（フィルタリング等）の実装

## まとめ

4階層ロール構造と組織ベースのデータモデルに対応するために、スタイリスト管理のUI設計を更新しました。ロールに基づいた権限管理と条件付きUIレンダリングにより、各ユーザーが適切な機能にのみアクセスできるようになります。また、オーナー管理機能の追加により、組織のガバナンスが明確化されます。