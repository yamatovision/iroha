# スタイリスト管理機能実装計画書

## 概要

美姫命アプリのスタイリスト管理機能を、新しい4階層ロール構造（SuperAdmin、Owner、Admin、User）に対応させるための実装計画です。従来の「Admin-User」関係から「Organization-User」関係へと変更し、組織ベースのユーザー管理を実現します。

## 実装目標

1. 組織（Organization）を基盤とした新しいデータモデルの導入
2. 4階層ロール構造による権限管理システムの実装
3. 組織オーナー（Owner）の設定・変更機能の実装
4. 組織ベースのユーザーフィルタリングとUI表示
5. 既存データから新モデルへのスムーズな移行

## 実装フェーズ

### フェーズ1: データモデル変更とバックエンド基盤整備（1週間）

#### タスク

1. **新しいスキーマとモデルの実装**
   - Organization スキーマの作成
   - User スキーマの更新（organizationId フィールド追加）
   - PricePlan スキーマの作成
   - MongoDB インデックスの設定

2. **マイグレーションスクリプトの作成**
   - 既存 Admin ユーザーから Organization への変換
   - User の organizationId フィールド設定
   - テスト環境でのマイグレーション検証

3. **バックエンドサービス層の実装**
   - OrganizationService の作成
   - UserService の更新（組織ベースフィルタリング）
   - RoleService の実装（権限管理）

4. **認証・認可システムの更新**
   - JWT ペイロードに organizationId 追加
   - ロールベースの認可ミドルウェア更新
   - 組織間アクセス制限の実装

#### コード例: JWT認証ミドルウェア更新

```typescript
// auth.middleware.ts
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '認証トークンがありません' });
    }

    // JWTを検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
      organizationId?: string; // 組織ID追加
    };

    // ユーザー情報を取得
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }

    // ユーザー情報をリクエストに追加
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: '無効なトークンです' });
  }
};

// 組織アクセス制限ミドルウェア
export const organizationAccessMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const requestedOrgId = req.params.organizationId || req.body.organizationId;
    
    // SuperAdminは全組織にアクセス可能
    if (user.role === 'SuperAdmin') {
      return next();
    }
    
    // 自分の組織以外へのアクセスを制限
    if (requestedOrgId && user.organizationId?.toString() !== requestedOrgId) {
      return res.status(403).json({ message: 'この組織へのアクセス権限がありません' });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};
```

### フェーズ2: APIエンドポイント実装（1週間）

#### タスク

1. **組織管理API**
   - 組織作成、取得、更新、削除API
   - 組織メンバーリスト取得API
   - 組織オーナー変更API

2. **ユーザー管理API**
   - 組織ベースのユーザーCRUD API
   - ロール変更API
   - ユーザー検索・フィルタリングAPI

3. **権限管理API**
   - ロールベースの権限チェックAPI
   - 組織内ロール割り当てAPI

4. **プランと請求API**
   - 料金プラン管理API
   - 組織サブスクリプション管理API

#### コード例: 組織ユーザー管理コントローラー

```typescript
// organization-users.controller.ts
export class OrganizationUsersController {
  
  // 組織内ユーザー一覧取得
  static async getOrganizationUsers(req: Request, res: Response) {
    try {
      const { organizationId } = req.params;
      const { page = 1, limit = 20, role, search, sortBy, sortOrder } = req.query;
      
      // アクセス権限チェック
      if (req.user.role !== 'SuperAdmin' && req.user.organizationId?.toString() !== organizationId) {
        return res.status(403).json({ message: 'この組織へのアクセス権限がありません' });
      }
      
      // ユーザー一覧取得
      const result = await UserService.getOrganizationUsers(organizationId, {
        page: Number(page),
        limit: Number(limit),
        role: role as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error getting organization users:', error);
      return res.status(500).json({ message: '組織ユーザー取得中にエラーが発生しました' });
    }
  }
  
  // 組織内ユーザー作成
  static async createOrganizationUser(req: Request, res: Response) {
    try {
      const { organizationId } = req.params;
      const userData = req.body;
      
      // アクセス権限チェック（OwnerまたはAdmin以上のみ）
      if (req.user.role !== 'SuperAdmin' && 
          req.user.organizationId?.toString() !== organizationId &&
          !['Owner', 'Admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'ユーザー作成権限がありません' });
      }
      
      // 作成可能なロールをチェック
      if (req.user.role === 'Admin' && userData.role !== 'User') {
        return res.status(403).json({ message: '管理者は一般ユーザーのみ作成できます' });
      }
      
      // 組織IDを設定
      userData.organizationId = organizationId;
      
      // ユーザー作成
      const newUser = await UserService.createUser(userData, req.user._id);
      
      return res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating organization user:', error);
      return res.status(500).json({ message: 'ユーザー作成中にエラーが発生しました' });
    }
  }
  
  // 組織オーナー変更
  static async changeOrganizationOwner(req: Request, res: Response) {
    try {
      const { organizationId } = req.params;
      const { newOwnerId } = req.body;
      
      // アクセス権限チェック（SuperAdminまたは現オーナーのみ）
      const organization = await OrganizationService.getOrganizationById(organizationId);
      if (req.user.role !== 'SuperAdmin' && organization.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'オーナー変更権限がありません' });
      }
      
      // オーナー変更
      const updatedOrganization = await OrganizationService.changeOrganizationOwner(
        organizationId,
        newOwnerId,
        req.user._id
      );
      
      return res.status(200).json(updatedOrganization);
    } catch (error) {
      console.error('Error changing organization owner:', error);
      return res.status(500).json({ message: 'オーナー変更中にエラーが発生しました' });
    }
  }
  
  // その他のメソッド...
}
```

### フェーズ3: フロントエンド実装（2週間）

#### タスク

1. **グローバルコンテキストとステート管理**
   - AuthContext の更新（組織情報含める）
   - 権限管理ユーティリティ関数の作成
   - API サービス層の更新

2. **スタイリスト管理画面の実装**
   - スタイリスト一覧コンポーネント
   - スタイリスト詳細モーダル
   - スタイリスト追加/編集フォーム
   - ロール管理UI
   - 検索/フィルタリング機能

3. **組織管理画面の実装**
   - 組織情報表示/編集コンポーネント
   - オーナー変更UI
   - 組織メンバー管理
   - プラン管理と制限表示

4. **権限ベースUI条件分岐**
   - ロールに応じたメニュー表示
   - アクセス制限コンポーネント
   - 機能制限表示

#### コード例: AuthContext更新

```typescript
// AuthContext.tsx
interface AuthContextType {
  user: IUser | null;
  organization: IOrganization | null; // 組織情報追加
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkPermission: (permission: string) => boolean; // 権限チェック関数
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [organization, setOrganization] = useState<IOrganization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // ユーザー情報取得とともに組織情報も取得
  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // トークンが存在するか確認
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setOrganization(null);
        setLoading(false);
        return;
      }
      
      // ユーザー情報取得
      const { data: userData } = await axios.get('/api/v1/users/me');
      setUser(userData);
      
      // 組織情報取得（SuperAdmin以外）
      if (userData.role !== 'SuperAdmin' && userData.organizationId) {
        const { data: orgData } = await axios.get(`/api/v1/organizations/${userData.organizationId}`);
        setOrganization(orgData);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('ユーザー情報の取得に失敗しました');
      // トークンを削除
      localStorage.removeItem('token');
      setUser(null);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  };
  
  // 初回レンダリング時にユーザー情報取得
  useEffect(() => {
    fetchUserData();
  }, []);
  
  // ログイン処理
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data } = await axios.post('/api/v1/auth/login', { email, password });
      
      // トークンを保存
      localStorage.setItem('token', data.token);
      
      // ユーザー情報取得
      await fetchUserData();
    } catch (err) {
      console.error('Login error:', err);
      setError('ログインに失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // ログアウト処理
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setOrganization(null);
  };
  
  // 権限チェック関数
  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // SuperAdminは全権限あり
    if (user.role === 'SuperAdmin') return true;
    
    // 権限マッピング
    const rolePermissions = {
      Owner: [
        'manage_organization',
        'manage_admins',
        'manage_users',
        'view_analytics',
        'manage_subscriptions'
      ],
      Admin: [
        'manage_users',
        'view_analytics'
      ],
      User: [
        'view_profile',
        'manage_own_profile'
      ]
    };
    
    // ユーザーのロールに基づく権限チェック
    return rolePermissions[user.role]?.includes(permission) || false;
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      organization, 
      loading, 
      error, 
      login, 
      logout,
      checkPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### コード例: スタイリスト一覧コンポーネント

```tsx
// StylistList.tsx
const StylistList: React.FC = () => {
  const { user, organization, checkPermission } = useAuth();
  const [stylists, setStylists] = useState<IUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  
  // ページネーション状態
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  
  // スタイリスト一覧取得
  const fetchStylists = async () => {
    try {
      setLoading(true);
      
      // 組織IDが存在しない場合（SuperAdmin等）
      if (!user?.organizationId && user?.role !== 'SuperAdmin') {
        setError('組織情報がありません');
        setLoading(false);
        return;
      }
      
      // 組織IDを設定（SuperAdminの場合は指定可能）
      const organizationId = user?.role === 'SuperAdmin' 
        ? (organization?._id || '')
        : user?.organizationId;
      
      // APIパラメータ設定
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: searchTerm
      });
      
      // ロールフィルターがある場合
      if (selectedRole !== 'all') {
        params.append('role', selectedRole);
      }
      
      // スタイリスト一覧取得
      const { data } = await axios.get(
        `/api/v1/organizations/${organizationId}/users?${params.toString()}`
      );
      
      setStylists(data.users);
      setPagination({
        ...pagination,
        totalPages: data.pages,
        totalItems: data.total
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching stylists:', err);
      setError('スタイリスト情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 初回レンダリングとフィルター変更時に一覧取得
  useEffect(() => {
    fetchStylists();
  }, [pagination.currentPage, searchTerm, selectedRole, organization?._id]);
  
  // スタイリスト追加処理
  const handleAddStylist = async (stylistData: Partial<IUser>) => {
    try {
      setLoading(true);
      
      const organizationId = user?.role === 'SuperAdmin' 
        ? (organization?._id || stylistData.organizationId)
        : user?.organizationId;
      
      // スタイリスト追加API呼び出し
      await axios.post(`/api/v1/organizations/${organizationId}/users`, stylistData);
      
      // 一覧を再取得
      await fetchStylists();
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding stylist:', err);
      setError('スタイリストの追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="stylist-list-container">
      <h1>スタイリスト管理</h1>
      
      {/* 検索・フィルターセクション */}
      <div className="search-filter-section">
        <input
          type="text"
          placeholder="名前またはメールで検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <div className="role-filter">
          <button 
            className={selectedRole === 'all' ? 'active' : ''} 
            onClick={() => setSelectedRole('all')}
          >
            すべて
          </button>
          <button 
            className={selectedRole === 'Admin' ? 'active' : ''} 
            onClick={() => setSelectedRole('Admin')}
          >
            管理者
          </button>
          <button 
            className={selectedRole === 'User' ? 'active' : ''} 
            onClick={() => setSelectedRole('User')}
          >
            一般
          </button>
          
          {/* Ownerロールのボタンは所有者のみ表示 */}
          {(user?.role === 'Owner' || user?.role === 'SuperAdmin') && (
            <button 
              className={selectedRole === 'Owner' ? 'active' : ''} 
              onClick={() => setSelectedRole('Owner')}
            >
              オーナー
            </button>
          )}
        </div>
        
        {/* 追加ボタン（権限がある場合のみ表示） */}
        {checkPermission('manage_users') && (
          <button 
            className="add-button"
            onClick={() => setShowAddModal(true)}
          >
            スタイリスト追加
          </button>
        )}
      </div>
      
      {/* エラーメッセージ */}
      {error && <div className="error-message">{error}</div>}
      
      {/* ローディング表示 */}
      {loading ? (
        <div className="loading-indicator">読み込み中...</div>
      ) : (
        <>
          {/* スタイリスト一覧 */}
          <div className="stylist-cards">
            {stylists.length > 0 ? (
              stylists.map((stylist) => (
                <StylistCard 
                  key={stylist._id} 
                  stylist={stylist}
                  onUpdate={fetchStylists}
                  canEdit={checkPermission('manage_users')}
                  canChangeRole={user?.role === 'Owner' || user?.role === 'SuperAdmin'}
                  isOwner={stylist._id === organization?.ownerId}
                />
              ))
            ) : (
              <div className="no-results">
                スタイリストが見つかりません
              </div>
            )}
          </div>
          
          {/* ページネーション */}
          <Pagination 
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setPagination({...pagination, currentPage: page})}
          />
        </>
      )}
      
      {/* スタイリスト追加モーダル */}
      {showAddModal && (
        <StylistModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddStylist}
          canAssignRoles={user?.role === 'Owner' || user?.role === 'SuperAdmin'}
        />
      )}
    </div>
  );
};

export default StylistList;
```

### フェーズ4: データマイグレーションと統合テスト（1週間）

#### タスク

1. **マイグレーションスクリプト実行**
   - 本番環境用のマイグレーション実行プラン策定
   - バックアップの作成
   - マイグレーションスクリプト実行

2. **統合テスト**
   - 機能テスト
   - パフォーマンステスト
   - セキュリティテスト（クロス組織アクセス等）

3. **モニタリングと問題解決**
   - エラーログ監視設定
   - パフォーマンスモニタリング
   - 問題発生時の対応プラン

4. **ドキュメント更新**
   - API仕様書更新
   - フロントエンド・バックエンド実装ガイド更新
   - 管理者向けマニュアル更新

#### コード例: マイグレーションスクリプト実行

```typescript
// migration-executor.ts
import mongoose from 'mongoose';
import { promises as fs } from 'fs';
import { User, Organization } from '../models';
import { createLogger } from '../utils/logger';

// ロガー設定
const logger = createLogger('migration');

// 実行オプション
interface MigrationOptions {
  dryRun?: boolean;
  batchSize?: number;
  logFile?: string;
}

// マイグレーション実行関数
async function executeMigration(options: MigrationOptions = {}) {
  // デフォルトオプション
  const {
    dryRun = false,
    batchSize = 100,
    logFile = `migration-${new Date().toISOString()}.json`
  } = options;
  
  // ログ開始
  logger.info(`Migration started. Dry run: ${dryRun}, Batch size: ${batchSize}`);
  console.log(`Migration started. Dry run: ${dryRun}, Batch size: ${batchSize}`);
  
  // 結果ログオブジェクト
  const migrationLog = {
    startTime: new Date().toISOString(),
    endTime: '',
    totalAdmins: 0,
    totalOrganizationsCreated: 0,
    totalUsersUpdated: 0,
    errors: [] as string[],
    warnings: [] as string[],
    details: [] as any[]
  };
  
  try {
    // 1. すべてのAdminユーザーを取得
    const adminUsers = await User.find({ role: 'Admin' });
    migrationLog.totalAdmins = adminUsers.length;
    
    logger.info(`Found ${adminUsers.length} admin users to process.`);
    console.log(`Found ${adminUsers.length} admin users to process.`);
    
    // 2. トランザクションを使用（ドライランの場合はスキップ）
    if (!dryRun) {
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // 3. 各Adminごとに処理
        for (const [index, admin] of adminUsers.entries()) {
          // 進捗表示
          if (index % 10 === 0) {
            logger.info(`Processing admin ${index + 1}/${adminUsers.length}`);
            console.log(`Processing admin ${index + 1}/${adminUsers.length}`);
          }
          
          // 組織名を設定
          const organizationName = `${admin.displayName}のサロン`;
          
          // 組織オブジェクト作成
          const organization = new Organization({
            name: organizationName,
            ownerId: admin._id,
            isActive: true,
            createdAt: admin.createdAt || new Date(),
            updatedAt: new Date()
          });
          
          // 組織を保存
          if (!dryRun) {
            await organization.save({ session });
          }
          
          // 詳細ログに追加
          migrationLog.details.push({
            adminId: admin._id.toString(),
            adminEmail: admin.email,
            organizationId: organization._id.toString(),
            organizationName,
            usersUpdated: 0
          });
          
          // AdminをOwnerロールに変更
          if (!dryRun) {
            admin.role = 'Owner';
            admin.organizationId = organization._id;
            await admin.save({ session });
          }
          
          // このAdminが作成した他のユーザーを特定
          const relatedUsers = await User.find({
            createdBy: admin._id,
            _id: { $ne: admin._id } // Admin自身を除外
          });
          
          // ログに追加
          migrationLog.details[migrationLog.details.length - 1].usersUpdated = relatedUsers.length;
          
          // 関連ユーザーに組織IDを設定
          if (!dryRun && relatedUsers.length > 0) {
            // バッチ処理（大量データの場合）
            for (let i = 0; i < relatedUsers.length; i += batchSize) {
              const batch = relatedUsers.slice(i, i + batchSize);
              const userIds = batch.map(user => user._id);
              
              // バッチ更新
              await User.updateMany(
                { _id: { $in: userIds } },
                { $set: { organizationId: organization._id } },
                { session }
              );
              
              logger.info(`Updated batch of ${batch.length} users`);
            }
          }
          
          migrationLog.totalOrganizationsCreated++;
          migrationLog.totalUsersUpdated += relatedUsers.length;
        }
        
        // トランザクションコミット
        if (!dryRun) {
          await session.commitTransaction();
          logger.info('Transaction committed successfully.');
        } else {
          logger.info('Dry run completed, no changes were made.');
        }
      } catch (error) {
        // エラー発生時はロールバック
        if (!dryRun) {
          await session.abortTransaction();
          logger.error('Transaction rolled back due to error.');
        }
        throw error;
      } finally {
        // セッション終了
        session.endSession();
      }
    } else {
      // ドライランモード（変更なし、確認のみ）
      logger.info('Dry run mode - no changes will be made.');
      for (const admin of adminUsers) {
        const relatedUsers = await User.find({
          createdBy: admin._id,
          _id: { $ne: admin._id }
        });
        
        migrationLog.details.push({
          adminId: admin._id.toString(),
          adminEmail: admin.email,
          organizationName: `${admin.displayName}のサロン`,
          usersCount: relatedUsers.length
        });
        
        migrationLog.totalOrganizationsCreated++;
        migrationLog.totalUsersUpdated += relatedUsers.length;
      }
    }
    
    // マイグレーション完了
    migrationLog.endTime = new Date().toISOString();
    logger.info(`Migration completed successfully. Organizations created: ${migrationLog.totalOrganizationsCreated}, Users updated: ${migrationLog.totalUsersUpdated}`);
    console.log(`Migration completed successfully. Organizations created: ${migrationLog.totalOrganizationsCreated}, Users updated: ${migrationLog.totalUsersUpdated}`);
  } catch (error) {
    // エラー発生時
    logger.error(`Migration failed: ${error.message}`);
    console.error(`Migration failed: ${error.message}`);
    
    migrationLog.endTime = new Date().toISOString();
    migrationLog.errors.push(error.message);
  }
  
  // 結果をファイルに保存
  await fs.writeFile(
    `./logs/${logFile}`,
    JSON.stringify(migrationLog, null, 2)
  );
  
  logger.info(`Migration log saved to ./logs/${logFile}`);
  console.log(`Migration log saved to ./logs/${logFile}`);
  
  return migrationLog;
}

// スクリプト実行（コマンドライン引数から実行オプション取得）
async function runMigration() {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {};
  
  args.forEach(arg => {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.replace('--batch-size=', ''), 10);
    } else if (arg.startsWith('--log-file=')) {
      options.logFile = arg.replace('--log-file=', '');
    }
  });
  
  console.log('Migration options:', options);
  
  // マイグレーション実行
  await executeMigration(options);
  
  // 完了後に接続終了
  await mongoose.disconnect();
  process.exit(0);
}

// スクリプトがコマンドラインから実行された場合
if (require.main === module) {
  // MongoDBに接続
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      return runMigration();
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

export { executeMigration };
```

## リソース要件

### 人員リソース

1. バックエンドエンジニア: 1名（フルタイム、3週間）
   - データモデル実装
   - API実装
   - マイグレーションスクリプト作成

2. フロントエンドエンジニア: 1名（フルタイム、2週間）
   - UI実装
   - APIとの連携
   - 権限ベースレンダリング

3. QAエンジニア: 1名（パートタイム、1週間）
   - 各機能のテスト
   - クロス組織アクセステスト
   - パフォーマンステスト

### 技術スタック

1. バックエンド:
   - Node.js + Express.js
   - MongoDB + Mongoose
   - JWT認証

2. フロントエンド:
   - React
   - TypeScript
   - Axios

## リスクと対策

### リスク1: データマイグレーション失敗

**対策:**
- 完全なデータバックアップを実行
- マイグレーション前に詳細なデータ分析
- ドライランモードでの検証
- トランザクションを使用したアトミックな処理
- ロールバックプランの策定

### リスク2: 権限管理の不備によるセキュリティ問題

**対策:**
- 徹底したアクセス制御テスト
- クロス組織アクセス検出ツールの実装
- セキュリティレビューの実施
- 監査ログの実装と監視

### リスク3: パフォーマンス低下

**対策:**
- インデックス最適化
- クエリパフォーマンス分析
- キャッシング戦略の実装
- 大規模データに対するバッチ処理

## 実装スケジュール

### 週1（フェーズ1）
- データモデル設計と実装
- マイグレーションスクリプト作成
- バックエンドサービス層実装

### 週2（フェーズ2）
- APIエンドポイント実装
- 初期テスト
- 認証・認可システム更新

### 週3-4（フェーズ3）
- フロントエンドUI実装
- API連携
- 権限ベースレンダリング実装

### 週5（フェーズ4）
- 統合テスト
- データマイグレーション
- モニタリング設定
- ドキュメント更新

## 実装後のフォローアップ

1. パフォーマンスモニタリング（2週間）
   - サーバーリソース使用率
   - APIレスポンスタイム
   - データベースクエリパフォーマンス

2. ユーザーフィードバック収集（1週間）
   - UI使いやすさ
   - 機能の過不足
   - パフォーマンス体感

3. バグ修正と最適化（1週間）
   - 発見された問題の修正
   - パフォーマンス最適化
   - UIの改善

## まとめ

この実装計画に従って進めることで、美姫命アプリのスタイリスト管理機能を、新しい4階層ロール構造と組織ベースのデータモデルに移行することができます。段階的なアプローチとリスク管理を重視し、スムーズな移行を実現します。各フェーズの詳細な実装例とコード例を提供することで、開発チームが明確な方向性を持って作業を進められるようにしています。