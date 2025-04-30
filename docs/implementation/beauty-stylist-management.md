# 「スタイリスト管理」実装ガイド

## 概要

美姫命アプリの「スタイリスト管理」機能の実装ガイドです。このドキュメントでは、フロントエンドとバックエンドの実装上の注意点、エッジケースとその対処法、パフォーマンスとセキュリティの考慮点、および実装優先順位について説明します。

## フロントエンド実装時の注意点

### 1. 最小限のコンポーネント構成

スタイリスト管理機能は以下のコアコンポーネントで構成することを推奨します：

- **StylistManagementPage**: メインコンテナ
- **StylistCard**: スタイリスト情報表示カード
- **StylistModal**: スタイリスト追加/編集用モーダル
- **SajuProfileModal**: 四柱推命情報表示モーダル

これらのコンポーネントは、既存の基盤コンポーネント（Button、Input、Modal など）を活用して実装することで、コード量を削減できます。

### 2. React Context の最適な活用

`AuthContext` などの既存のコンテキストを活用し、以下の点に注意してください：

- 権限チェックは `AuthContext` を使用
- グローバルな通知には `NotificationContext` を使用
- ページ固有のロジックはカスタムフックにカプセル化

```typescript
// スタイリスト管理カスタムフック
export const useStylistManagement = () => {
  const { user } = useAuth(); // 既存のAuthContextを使用
  const { showNotification } = useNotification(); // 既存のNotificationContextを使用
  
  const [stylists, setStylists] = useState<IStylist[]>([]);
  const [loading, setLoading] = useState(true);
  
  // スタイリスト取得ロジック
  const fetchStylists = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/users?createdBy=${user._id}&role=User`);
      // ... 以下、APIデータ処理
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user._id, showNotification]);
  
  // その他の操作ロジック...
  
  return {
    stylists,
    loading,
    fetchStylists,
    // その他の状態と操作メソッド
  };
};
```

### 3. パフォーマンスの最適化

- **レンダリング最適化**:
  - `memo`、`useMemo`、`useCallback` の適切な使用
  - 大規模なリストには仮想化（React Window など）を検討

```typescript
// スタイリストカードのメモ化（不要な再レンダリングを防止）
const StylistCard = memo(({ stylist, onEdit, onDelete, onShowProfile }: StylistCardProps) => {
  // ...実装
});

// メインページでの最適化
const StylistManagementPage = () => {
  // ...状態
  
  // メモ化された依存関係
  const cardActions = useMemo(() => ({
    handleEdit: (stylistId: string) => { /* ... */ },
    handleDelete: (stylistId: string) => { /* ... */ },
    handleShowProfile: (stylistId: string) => { /* ... */ }
  }), [/* 依存配列 */]);
  
  // ...残りの実装
};
```

### 4. フォームハンドリングとバリデーション

- **フォーム状態管理**:
  - 複雑なフォームには React Hook Form の使用を検討
  - シンプルなフォームには `useState` と自作バリデーションを使用

- **バリデーションルール**:
  - メールアドレスの形式チェック
  - 必須フィールドの検証
  - パスワード強度の検証（新規登録時）

```typescript
// シンプルなバリデーション実装例
const validateStylistForm = (formData) => {
  const errors = {};
  
  if (!formData.displayName.trim()) {
    errors.displayName = '名前を入力してください';
  }
  
  if (!formData.email.trim()) {
    errors.email = 'メールアドレスを入力してください';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = '有効なメールアドレスを入力してください';
  }
  
  if (formData.isNewStylist && (!formData.password || formData.password.length < 8)) {
    errors.password = 'パスワードは8文字以上で入力してください';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

### 5. アバター画像のハンドリング

- **画像プレビュー**:
  - ファイル選択後のローカルプレビュー表示
  - 画像フォーマットとサイズの検証

- **画像アップロード**:
  - Base64エンコーディングによる小サイズ画像の直接送信
  - 大きなファイルは事前検証と適切なリサイズ
  - S3等への直接アップロードはフェーズ2で検討

```typescript
// 画像プレビュー処理
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // サイズ検証
  if (file.size > 2 * 1024 * 1024) { // 2MB制限
    showNotification('画像サイズは2MB以下にしてください', 'error');
    return;
  }
  
  // プレビュー表示とBase64変換
  const reader = new FileReader();
  reader.onloadend = () => {
    setFormData(prev => ({
      ...prev,
      profileImage: reader.result as string
    }));
  };
  reader.readAsDataURL(file);
};
```

## バックエンド実装時の注意点

### 1. シンプルな処理フロー

既存のAPIを最大限に活用し、以下のシンプルな処理フローを実装します：

- **スタイリスト管理機能**:
  - 既存の `User` モデルと API を活用
  - 必要最小限のフィールド拡張
  - 既存の認証・権限システムをそのまま利用

### 2. 既存APIの拡張ポイント

既存のユーザーAPI（`/api/v1/users`）を拡張して、スタイリスト管理に必要な機能を追加します：

```typescript
// users.controller.ts - 既存コントローラーの拡張

// スタイリスト一覧取得（既存のgetUsers関数の拡張）
export const getStylists = async (req, res) => {
  try {
    const { createdBy, search } = req.query;
    
    // 検索条件の構築
    const filter: any = { role: 'User' };
    
    // 管理者IDによるフィルタリング
    if (createdBy) {
      filter.createdBy = createdBy;
    }
    
    // 検索条件
    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
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

// routes/users.routes.ts - ルートの追加
router.get('/stylists', requireAuth, requireAdmin, getStylists);
```

### 3. 権限管理の実装

既存の権限管理システムを活用し、以下の権限チェックを実装します：

```typescript
// 既存のミドルウェアを活用した権限チェック
// middleware/auth.middleware.ts

// 同一サロン内のユーザーのみアクセス可能
export const requireSameSalon = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;
    
    // 自分自身のIDの場合はそのまま通過
    if (userId === requestingUser._id.toString()) {
      return next();
    }
    
    // SuperAdminはすべてのユーザーにアクセス可能
    if (requestingUser.role === 'SuperAdmin') {
      return next();
    }
    
    // 管理者の場合、同じcreatedByまたは自分が作成したユーザーのみアクセス可能
    if (requestingUser.role === 'Admin') {
      const targetUser = await User.findById(userId);
      
      if (!targetUser) {
        return res.status(404).json({ message: 'ユーザーが見つかりません' });
      }
      
      // 同じ管理者が作成したユーザーか確認
      if (
        targetUser.createdBy && 
        targetUser.createdBy.toString() === requestingUser._id.toString()
      ) {
        return next();
      }
    }
    
    // アクセス権限なし
    return res.status(403).json({ message: 'このユーザーにアクセスする権限がありません' });
  } catch (error) {
    return res.status(500).json({ message: '権限チェックエラー', error: error.message });
  }
};
```

## 重要なエッジケースとその対処法

### 1. 同一メールアドレスの重複登録

- **問題**: 同じメールアドレスで複数のスタイリストが登録される可能性
- **対処法**: 
  - データベースレベルでユニーク制約を設定（既存）
  - 登録前にメールアドレスの重複チェックを実施
  
```typescript
// スタイリスト登録前のメールアドレス重複チェック
const createStylist = async (req, res) => {
  try {
    const { email } = req.body;
    
    // メールアドレスの重複チェック
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'このメールアドレスは既に使用されています' });
    }
    
    // 残りの登録処理...
  } catch (error) {
    res.status(500).json({ message: 'スタイリストの登録に失敗しました', error: error.message });
  }
};
```

### 2. 管理者の削除またはロール変更

- **問題**: 管理者が削除または役割が変更された場合、関連スタイリストの扱い
- **対処法**:
  - 管理者削除時に関連スタイリストを別の管理者に譲渡するオプションを提供
  - または、管理者削除前に関連スタイリストの存在をチェックして警告

```typescript
// 管理者削除前のチェック
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 削除対象ユーザーを取得
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }
    
    // 管理者の場合、関連スタイリストをチェック
    if (userToDelete.role === 'Admin') {
      const relatedStylists = await User.countDocuments({
        createdBy: userId,
        role: 'User'
      });
      
      if (relatedStylists > 0) {
        return res.status(400).json({
          message: `このアカウントは${relatedStylists}人のスタイリストを管理しています。削除する前に、スタイリストの管理者を変更するか、スタイリストを削除してください。`,
          relatedStylistsCount: relatedStylists
        });
      }
    }
    
    // 削除処理...
  } catch (error) {
    res.status(500).json({ message: 'ユーザーの削除に失敗しました', error: error.message });
  }
};
```

### 3. 四柱推命情報の整合性

- **問題**: 四柱推命情報が不完全な状態で保存される可能性
- **対処法**:
  - 必須フィールド（birthDate、birthTime、birthPlace、gender）のすべてが存在する場合のみ四柱推命情報を計算
  - 四柱推命情報の状態を明示的に保持するフラグの追加（オプション）

```typescript
// 四柱推命情報の整合性チェック
const updateBirthInfo = async (req, res) => {
  try {
    const { userId, birthDate, birthTime, birthPlace, gender } = req.body;
    
    // すべての必須情報が存在するか確認
    if (!birthDate || !birthTime || !birthPlace || !gender) {
      return res.status(400).json({
        message: '生年月日、出生時間、出生地、性別はすべて必須です',
        isSajuProfileComplete: false
      });
    }
    
    // 残りの処理...
  } catch (error) {
    res.status(500).json({ message: '四柱推命情報の更新に失敗しました', error: error.message });
  }
};
```

### 4. 画像データの安全な処理

- **問題**: 大きなプロフィール画像によるパフォーマンス問題
- **対処法**:
  - フロントエンドでの画像リサイズ
  - バックエンドでのファイルサイズと形式の検証
  - Base64データの適切な処理

```typescript
// バックエンドでの画像データ検証
const validateProfileImage = (imageData) => {
  if (!imageData) return { isValid: true };
  
  // Base64文字列の検証
  if (!imageData.startsWith('data:image/')) {
    return {
      isValid: false,
      message: '無効な画像形式です'
    };
  }
  
  // サイズ検証（Base64のおおよそのサイズ）
  const sizeInBytes = (imageData.length * 3) / 4 - 
    (imageData.endsWith('==') ? 2 : imageData.endsWith('=') ? 1 : 0);
  
  const sizeInMB = sizeInBytes / (1024 * 1024);
  if (sizeInMB > 2) {
    return {
      isValid: false,
      message: '画像サイズは2MB以下にしてください'
    };
  }
  
  return { isValid: true };
};
```

## パフォーマンス考慮点とセキュリティ対策

### 1. パフォーマンス最適化

- **データ取得の効率化**:
  - 必要なフィールドのみを選択（`select()`）
  - ページネーションの実装（初期実装では100件まで）
  - インデックスの適切な設定（`email`、`createdBy`、`role`）

```typescript
// 効率的なデータ取得
const getStylists = async (req, res) => {
  try {
    const { page = 1, limit = 100, createdBy } = req.query;
    const skip = (page - 1) * limit;
    
    // 検索条件
    const filter = { 
      role: 'User',
      ...(createdBy && { createdBy })
    };
    
    // 必要フィールドのみ取得
    const stylists = await User.find(filter)
      .select('_id displayName email jobTitle profileImage birthDate birthTime birthPlace createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    // 総件数の取得
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      stylists,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'スタイリスト情報の取得に失敗しました', error: error.message });
  }
};
```

- **フロントエンドの最適化**:
  - スケルトンローダーの使用（初期読み込み時）
  - 遅延読み込み（リストのページネーション）
  - 画像のレスポンシブロード

### 2. セキュリティ対策

- **データ検証**:
  - すべてのユーザー入力の厳格なバリデーション
  - XSS対策（HTMLエスケープ）
  - SQLインジェクション対策（Mongooseの使用）

- **権限管理**:
  - 既存の権限システムを活用した厳格なアクセス制御
  - AdminロールとUserロールの明確な区分

- **センシティブデータの保護**:
  - パスワードのハッシュ化（既存）
  - 不要なユーザー情報の非表示
  - Base64画像データの安全な処理

```typescript
// センシティブデータの保護
const getStylistProfile = async (req, res) => {
  try {
    const { stylistId } = req.params;
    
    // スタイリスト情報を取得
    const stylist = await User.findById(stylistId)
      // パスワードなどのセンシティブデータを除外
      .select('-password -refreshToken -tokenVersion');
    
    if (!stylist) {
      return res.status(404).json({ message: 'スタイリストが見つかりません' });
    }
    
    res.status(200).json(stylist);
  } catch (error) {
    res.status(500).json({ message: 'スタイリスト情報の取得に失敗しました', error: error.message });
  }
};
```

## シンプル化と代替実装案

### 1. シンプル化の提案

- **初期実装の簡略化**:
  - プロフィール画像機能は後回しにすることも検討（初期はデフォルトアバターを使用）
  - 四柱推命情報の入力フォームは既存のSajuProfileFormコンポーネントを再利用
  - 複雑なフィルタリング機能は段階的に実装

- **最小限の実装から始める**:
  ```typescript
  // 最小限のスタイリスト管理ページ
  const StylistManagementPage = () => {
    const { user } = useAuth();
    const [stylists, setStylists] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const fetchStylists = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/v1/users?createdBy=${user._id}&role=User`);
          const data = await response.json();
          setStylists(data);
        } catch (error) {
          console.error('スタイリスト取得エラー:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchStylists();
    }, [user._id]);
    
    // 最小限のUI実装
    return (
      <div className="main-content">
        <h1>スタイリスト管理</h1>
        
        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <div className="card-grid">
            {stylists.map(stylist => (
              <StylistCard key={stylist._id} stylist={stylist} />
            ))}
            
            <button className="add-stylist-btn">
              <span className="material-icons">person_add</span>
              新規スタイリスト
            </button>
          </div>
        )}
      </div>
    );
  };
  ```

### 2. 代替実装案

- **既存コンポーネントの再利用**:
  - チームメンバー管理コンポーネントをベースにした実装
  - UIコンポーネントの共通化（カード、モーダル、フォームなど）

```typescript
// 既存のTeamMemberリストコンポーネントをベースにした実装
const StylistManagementPage = () => {
  // 既存のTeamMembersListコンポーネントの処理を流用
  const { 
    members, 
    loading, 
    addMember, 
    removeMember, 
    updateMember 
  } = useTeamMembers();
  
  // スタイリスト管理用に調整
  const stylists = useMemo(() => {
    return members.map(member => ({
      _id: member._id,
      displayName: member.user.displayName,
      email: member.user.email,
      role: member.user.role,
      jobTitle: member.role, // TeamMemberのroleフィールドを職位として使用
      // その他の必要なフィールド
    }));
  }, [members]);
  
  // 残りの実装...
};
```

## 実装優先順位リスト

以下の優先順位で実装を進めることを推奨します：

1. **基本的なスタイリスト管理機能**:
   - スタイリスト一覧表示
   - スタイリスト追加機能
   - 基本情報（名前、メール、役職）の編集

2. **四柱推命情報の連携**:
   - 四柱推命情報の有無表示
   - 既存のSajuProfileFormを活用した情報登録
   - 四柱推命情報の詳細表示

3. **拡張機能**:
   - 検索・フィルタリング機能
   - プロフィール画像アップロード
   - 詳細な権限管理

4. **UIの洗練**:
   - レスポンシブデザインの調整
   - トランジションとアニメーション
   - エラー状態とローディング状態の改善

## 段階的リリース戦略

1. **フェーズ1**: MVP（最小限の機能セット）
   - 基本的なスタイリスト一覧表示と追加機能
   - 四柱推命情報の有無表示と既存APIを使用した情報登録
   - プロフィール画像なし（デフォルトアバターのみ）

2. **フェーズ2**: 基本機能の完成
   - 検索・フィルタリング機能の追加
   - シンプルなプロフィール画像アップロード
   - 四柱推命情報の詳細表示の改善

3. **フェーズ3**: 機能拡張
   - 高度な検索・フィルタリング
   - スタイリストと顧客のマッチング機能
   - パフォーマンス最適化と洗練されたUI

## テスト戦略とテストケース一覧

### 1. ユニットテスト

- **APIエンドポイントのテスト**:
  - スタイリスト一覧取得 API のテスト
  - スタイリスト追加 API のテスト
  - スタイリスト更新 API のテスト
  - スタイリスト削除 API のテスト

```typescript
// users.controller.test.ts
describe('Stylist Management APIs', () => {
  // スタイリスト一覧取得のテスト
  describe('GET /api/v1/users (stylists)', () => {
    it('should return stylists for admin user', async () => {
      // テスト実装
    });
    
    it('should filter stylists by createdBy', async () => {
      // テスト実装
    });
    
    it('should return 403 for non-admin users', async () => {
      // テスト実装
    });
  });
  
  // その他のAPIテスト
});
```

- **Reactコンポーネントのテスト**:
  - StylistCard コンポーネントのレンダリングテスト
  - StylistModal コンポーネントのフォーム動作テスト
  - ページネーションの動作テスト

### 2. 統合テスト

- **スタイリスト管理フローのテスト**:
  - スタイリスト追加→編集→削除のフローテスト
  - 四柱推命情報登録フローのテスト
  - 権限によるアクセス制御テスト

### 3. エンドツーエンドテスト

- **ユーザーシナリオテスト**:
  - 管理者がスタイリストを追加・編集・削除するシナリオ
  - スタイリストの四柱推命情報を登録・表示するシナリオ
  - 検索・フィルタリング機能の使用シナリオ

## 「本質的な価値」の評価

スタイリスト管理機能において、以下の機能は本質的な価値を提供します：

### 必須機能（削除不可）

- **スタイリスト基本情報管理**:
  - 名前、メールアドレス、役職の管理
  - スタイリストの追加・編集・削除

- **四柱推命情報連携**:
  - 四柱推命情報の登録状態表示
  - 四柱推命情報の詳細表示

### 重要だが簡略化可能な機能

- **検索・フィルタリング**:
  - 初期実装では単純な検索のみで可
  - 高度なフィルタリングは後続フェーズで追加

- **プロフィール画像**:
  - 初期実装ではデフォルトアバターのみでも可
  - 画像アップロード機能は後続フェーズで追加

### 削除しても本質を損なわない機能

- **複雑なアニメーション**:
  - シンプルなトランジションのみで十分
  - 複雑なアニメーションはパフォーマンスに影響する可能性

- **高度な権限管理**:
  - 初期実装では基本的な Admin/User 区分で十分
  - 詳細な権限管理は後続フェーズで検討

美姫命アプリのスタイリスト管理機能は、既存のユーザー管理機能を最大限に活用しつつ、美容サロン特有の要件に合わせた最小限の拡張を行うことで、効率的かつ効果的に実装できます。