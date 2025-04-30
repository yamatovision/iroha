# 「スタイリスト管理」データモデル設計（更新版）

## 概要

美姫命アプリの4階層ロール構造（SuperAdmin、Owner、Admin、User）に対応したスタイリスト管理機能のデータモデル設計です。従来の「Admin-User」関係から「Organization-User」関係へと変更し、組織ベースのユーザー管理を実現します。

## 主なデータモデル

### User (ユーザー)

```typescript
interface IUser {
  _id: string;                  // MongoDB ObjectId
  email: string;                // メールアドレス（ログイン用）
  password: string;             // ハッシュ化されたパスワード
  displayName: string;          // 表示名
  profileImage?: string;        // プロフィール画像URL
  role: 'SuperAdmin' | 'Owner' | 'Admin' | 'User'; // 4階層ロール（重要な変更）
  organizationId?: string;      // 所属組織ID（重要な変更：createdByからの置き換え）
  jobTitle?: string;            // 役職/ポジション
  phoneNumber?: string;         // 電話番号
  isActive: boolean;            // アクティブ状態
  lastLogin?: Date;             // 最終ログイン日時
  deviceTokens?: string[];      // 通知用デバイストークン
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
  
  // 四柱推命関連情報（サブドキュメント化も検討）
  birthDate?: string;           // 生年月日
  birthTime?: string;           // 生まれた時間
  birthPlace?: string;          // 生まれた場所
  sajuProfile?: ISajuProfile;   // 四柱推命プロファイル（計算済み）
}
```

### Organization (組織)

```typescript
interface IOrganization {
  _id: string;                  // MongoDB ObjectId
  name: string;                 // 組織名（サロン名）
  ownerId: string;              // オーナーのユーザーID（重要：必ず1人のOwnerと紐づく）
  address?: {                   // 住所情報
    street: string;             // 町名・番地
    city: string;               // 市区町村
    state: string;              // 都道府県
    postalCode: string;         // 郵便番号
    country: string;            // 国
  };
  contactEmail?: string;        // 連絡先メールアドレス
  contactPhone?: string;        // 連絡先電話番号
  logoUrl?: string;             // ロゴ画像URL
  websiteUrl?: string;          // ウェブサイトURL
  businessHours?: {             // 営業時間
    start: string;              // 開始時間
    end: string;                // 終了時間
    dayOfWeek: number;          // 曜日（0=日曜〜6=土曜）
  }[];
  description?: string;         // 組織の説明文
  planId?: string;              // 契約プランID
  isActive: boolean;            // アクティブ状態
  stripeCustomerId?: string;    // Stripe顧客ID（課金用）
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
}
```

### PricePlan (料金プラン)

```typescript
interface IPricePlan {
  _id: string;                  // MongoDB ObjectId
  name: string;                 // プラン名
  description: string;          // プラン説明
  price: number;                // 価格
  currency: string;             // 通貨単位（JPY等）
  billingCycle: 'monthly' | 'yearly'; // 課金サイクル
  features: {                   // 機能制限
    maxUsers: number;           // 最大ユーザー数
    maxClients: number;         // 最大クライアント数
    allowedFeatures: string[];  // 利用可能機能リスト
  };
  isActive: boolean;            // アクティブ状態
  stripeProductId?: string;     // StripeプロダクトID
  stripePriceId?: string;       // Stripe価格ID
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
}
```

## データリレーションシップ（ER図）

```
┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│   Organization    │      │       User        │      │    SajuProfile    │
├───────────────────┤      ├───────────────────┤      ├───────────────────┤
│ _id               │◄─┐   │ _id               │◄────┐│ _id               │
│ name              │  │   │ email             │     ││ userId            │
│ ownerId ──────────┼──┘   │ password          │     ││ dayPillar         │
│ address           │      │ displayName       │     ││ monthPillar       │
│ contactEmail      │      │ profileImage      │     ││ yearPillar        │
│ contactPhone      │      │ role              │     ││ hourPillar        │
│ logoUrl           │  ┌───┤ organizationId    │     ││ elements          │
│ websiteUrl        │  │   │ jobTitle          │     ││ combinations      │
│ businessHours     │  │   │ phoneNumber       │     ││ tenGods           │
│ description       │  │   │ isActive          │     ││ characteristics   │
│ planId ───────────┼──┼───┘ lastLogin         │     ││ createdAt         │
│ isActive          │  │     deviceTokens      │     ││ updatedAt         │
│ stripeCustomerId  │  │     createdAt         │     │└───────────────────┘
│ createdAt         │  │     updatedAt         │     │
│ updatedAt         │  │     birthDate         │     │
└───────────────────┘  │     birthTime         │     │
                       │     birthPlace        │     │
┌───────────────────┐  │     sajuProfile ──────┼─────┘
│    PricePlan      │  │   └───────────────────┘
├───────────────────┤  │
│ _id ◄──────────────┼──┘
│ name              │
│ description       │
│ price             │
│ currency          │
│ billingCycle      │
│ features          │
│ isActive          │
│ stripeProductId   │
│ stripePriceId     │
│ createdAt         │
│ updatedAt         │
└───────────────────┘
```

## 主な変更点

1. **User スキーマ変更**:
   - `createdBy` フィールドの削除：従来の「どのAdminが作成したか」から変更
   - `organizationId` フィールドの追加：「どの組織に所属するか」を明示
   - `role` フィールドのタイプを更新：`'SuperAdmin' | 'Owner' | 'Admin' | 'User'` の4階層に

2. **Organization スキーマ追加**:
   - 組織を表す明示的なスキーマを追加
   - 各組織は必ず1人の「Owner」ロールユーザーと紐づく
   - 契約プラン情報への参照を含む

3. **PricePlan スキーマ追加**:
   - 料金プラン情報を管理するスキーマを追加
   - 機能制限情報（ユーザー数上限など）を含む

## データバリデーション

### User モデルのバリデーション

```typescript
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: (v: string) => /^\S+@\S+\.\S+$/.test(v),
      message: 'メールアドレスの形式が正しくありません'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'パスワードは8文字以上である必要があります']
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, '表示名は2文字以上である必要があります']
  },
  profileImage: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['SuperAdmin', 'Owner', 'Admin', 'User'],
    required: true,
    default: 'User'
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    // 重要なバリデーション：SuperAdmin以外は組織IDが必須
    validate: {
      validator: function(this: IUser, v: string) {
        return this.role === 'SuperAdmin' || v !== undefined;
      },
      message: 'SuperAdmin以外のユーザーには組織IDが必要です'
    }
  },
  jobTitle: {
    type: String,
    default: ''
  },
  // 他のフィールドは省略...
});

// カスタムバリデーションフック
userSchema.pre('save', async function(next) {
  // 同一組織内でメールアドレスが重複しないことを確認
  if (this.organizationId && this.isModified('email')) {
    const existingUser = await this.constructor.findOne({
      email: this.email,
      organizationId: this.organizationId,
      _id: { $ne: this._id } // 自分自身は除外
    });
    
    if (existingUser) {
      throw new Error('このメールアドレスは既に登録されています');
    }
  }
  
  // Ownerロールの一意性を確認
  if (this.role === 'Owner' && this.organizationId && this.isModified('role')) {
    const existingOwner = await this.constructor.findOne({
      role: 'Owner',
      organizationId: this.organizationId,
      _id: { $ne: this._id } // 自分自身は除外
    });
    
    if (existingOwner) {
      throw new Error('この組織には既にオーナーが存在します');
    }
  }
  
  next();
});
```

### Organization モデルのバリデーション

```typescript
const organizationSchema = new Schema<IOrganization>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, '組織名は2文字以上である必要があります']
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 他のフィールドは省略...
});

// カスタムバリデーションフック
organizationSchema.pre('save', async function(next) {
  // ユーザーがOwnerロールであることを確認
  if (this.isModified('ownerId')) {
    const owner = await mongoose.model('User').findById(this.ownerId);
    
    if (!owner || owner.role !== 'Owner') {
      throw new Error('組織のオーナーはOwnerロールが必要です');
    }
    
    // オーナーの組織IDを更新
    await mongoose.model('User').findByIdAndUpdate(this.ownerId, {
      organizationId: this._id
    });
  }
  
  next();
});
```

## データマイグレーション戦略

既存データから新しいデータモデルへの移行のためのマイグレーションスクリプト概要：

```typescript
// 1. すべてのAdminユーザーを特定
const adminUsers = await User.find({ role: 'Admin' });

// 2. 各Adminユーザーに対して組織を作成し、Ownerロールに変更
for (const admin of adminUsers) {
  console.log(`Processing admin: ${admin.email}`);
  
  // 組織を作成
  const organization = new Organization({
    name: `${admin.displayName}のサロン`, // デフォルト名：後で変更可能
    ownerId: admin._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // 組織を保存
  await organization.save();
  
  // AdminをOwnerロールに変更し、組織IDを設定
  admin.role = 'Owner';
  admin.organizationId = organization._id;
  await admin.save();
  
  console.log(`Created organization: ${organization._id} for owner: ${admin.email}`);
  
  // このAdminが作成した他のユーザーを特定
  const relatedUsers = await User.find({ createdBy: admin._id });
  
  // 関連ユーザーに組織IDを設定
  for (const user of relatedUsers) {
    user.organizationId = organization._id;
    // createdByフィールドは将来的に削除予定
    await user.save();
    console.log(`Updated user: ${user.email} with organizationId: ${organization._id}`);
  }
}

console.log('Migration completed successfully');
```

## データアクセスパターン

### 1. 組織に所属するスタイリスト一覧取得

```typescript
/**
 * 組織に所属するスタイリスト一覧を取得
 * @param organizationId 組織ID
 * @param options ページネーション、フィルタリングオプション
 */
async function getOrganizationUsers(
  organizationId: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<{ users: IUser[]; total: number; page: number; pages: number }> {
  // デフォルト値の設定
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;
  
  // 検索フィルターの構築
  const filter: any = { organizationId }; // 重要：organizationIdでフィルタリング
  
  // 任意のロールフィルタ
  if (options.role) {
    filter.role = options.role;
  }
  
  // 検索テキストがある場合
  if (options.search) {
    const searchRegex = new RegExp(options.search, 'i');
    filter.$or = [
      { displayName: searchRegex },
      { email: searchRegex },
      { jobTitle: searchRegex }
    ];
  }
  
  // ソート設定
  const sortField = options.sortBy || 'createdAt';
  const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
  const sortOptions = { [sortField]: sortDirection };
  
  // ユーザー一覧とカウントを取得
  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-password'), // パスワードは除外
    
    User.countDocuments(filter)
  ]);
  
  return {
    users,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}
```

### 2. 組織オーナーの変更

```typescript
/**
 * 組織オーナーを変更する
 * トランザクションを使用して、一貫性を保証
 * @param organizationId 組織ID
 * @param newOwnerId 新しいオーナーのユーザーID
 * @param currentUserId 操作実行者のユーザーID（権限チェック用）
 */
async function changeOrganizationOwner(
  organizationId: string,
  newOwnerId: string,
  currentUserId: string
): Promise<IOrganization> {
  // トランザクション開始
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 組織の取得
    const organization = await Organization.findById(organizationId).session(session);
    if (!organization) {
      throw new Error('組織が見つかりません');
    }
    
    // 現在のオーナーの取得
    const currentOwner = await User.findById(organization.ownerId).session(session);
    if (!currentOwner) {
      throw new Error('現在のオーナーが見つかりません');
    }
    
    // 新しいオーナーの取得
    const newOwner = await User.findById(newOwnerId).session(session);
    if (!newOwner) {
      throw new Error('新しいオーナーとなるユーザーが見つかりません');
    }
    
    // 操作実行者の権限チェック
    const currentUser = await User.findById(currentUserId).session(session);
    if (!currentUser) {
      throw new Error('操作実行者が見つかりません');
    }
    
    // SuperAdminまたは現在のオーナーのみが変更可能
    if (currentUser.role !== 'SuperAdmin' && currentUser._id.toString() !== currentOwner._id.toString()) {
      throw new Error('オーナー変更権限がありません');
    }
    
    // 新しいオーナーが同じ組織に所属しているか確認
    if (newOwner.organizationId?.toString() !== organizationId) {
      throw new Error('新しいオーナーは同じ組織に所属している必要があります');
    }
    
    // 現在のオーナーのロールをAdminに変更
    currentOwner.role = 'Admin';
    await currentOwner.save({ session });
    
    // 新しいオーナーのロールをOwnerに変更
    newOwner.role = 'Owner';
    await newOwner.save({ session });
    
    // 組織のオーナーIDを更新
    organization.ownerId = newOwnerId;
    organization.updatedAt = new Date();
    await organization.save({ session });
    
    // トランザクションをコミット
    await session.commitTransaction();
    
    return organization;
  } catch (error) {
    // エラーが発生した場合、トランザクションをロールバック
    await session.abortTransaction();
    throw error;
  } finally {
    // セッションを終了
    session.endSession();
  }
}
```

### 3. ユーザー作成時の組織ID自動設定

```typescript
/**
 * 新しいユーザーを作成（Adminまたはユーザー）
 * @param userData ユーザーデータ
 * @param creatorId 作成者ID
 */
async function createUser(
  userData: Partial<IUser>,
  creatorId: string
): Promise<IUser> {
  // 作成者の情報を取得
  const creator = await User.findById(creatorId);
  if (!creator) {
    throw new Error('作成者が見つかりません');
  }
  
  // 権限チェック
  if (creator.role !== 'SuperAdmin' && creator.role !== 'Owner' && creator.role !== 'Admin') {
    throw new Error('ユーザー作成権限がありません');
  }
  
  // SuperAdmin以外は作成できるロールが制限される
  if (creator.role !== 'SuperAdmin') {
    if (userData.role === 'SuperAdmin') {
      throw new Error('SuperAdminを作成する権限がありません');
    }
    
    if (creator.role !== 'Owner' && userData.role === 'Owner') {
      throw new Error('Ownerを作成する権限がありません');
    }
    
    if (creator.role === 'Admin' && userData.role === 'Admin') {
      throw new Error('Adminは他のAdminを作成できません');
    }
  }
  
  // 組織IDの設定
  if (creator.role === 'SuperAdmin') {
    // SuperAdminがSuperAdminでないユーザーを作成する場合、organizationIdが必要
    if (userData.role !== 'SuperAdmin' && !userData.organizationId) {
      throw new Error('組織IDが必要です');
    }
  } else {
    // SuperAdmin以外は自分の組織に所属するユーザーのみ作成可能
    userData.organizationId = creator.organizationId;
  }
  
  // パスワードのハッシュ化
  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, 10);
  }
  
  // ユーザーの作成
  const newUser = new User({
    ...userData,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // ユーザーの保存
  await newUser.save();
  
  // パスワードを除外して返却
  const userObject = newUser.toObject();
  delete userObject.password;
  
  return userObject;
}
```

## インデックス設計

効率的なデータアクセスのためのインデックス設定：

```typescript
// User モデルのインデックス
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ organizationId: 1 }); // 組織IDでの検索を高速化
userSchema.index({ organizationId: 1, role: 1 }); // 組織別ロール検索
userSchema.index({ organizationId: 1, displayName: 1 }); // 組織内での名前検索
userSchema.index({ organizationId: 1, email: 1 }); // 組織内でのメールアドレス検索

// Organization モデルのインデックス
organizationSchema.index({ name: 1 });
organizationSchema.index({ ownerId: 1 }, { unique: true }); // オーナーIDの一意性
organizationSchema.index({ planId: 1 }); // プラン別組織検索
```

## キャッシング戦略

高頻度でアクセスされるデータのキャッシング戦略：

1. **ユーザープロファイル**:
   - Redis TTLキャッシュ（5分）
   - キー：`user:${userId}`
   - 更新時にキャッシュを無効化

2. **組織情報**:
   - Redis TTLキャッシュ（15分）
   - キー：`organization:${organizationId}`
   - 更新時にキャッシュを無効化

3. **組織メンバーリスト**:
   - Redis TTLキャッシュ（10分）
   - キー：`organization:${organizationId}:members`
   - ユーザー追加/更新/削除時にキャッシュを無効化

## セキュリティ考慮事項

1. **クロス組織アクセス防止**:
   - ミドルウェアで組織IDを検証
   - 全APIエンドポイントでorganizationIdフィルタを適用

2. **権限ベースのデータフィルタリング**:
   - SuperAdmin：全組織データにアクセス可能
   - Owner/Admin：自組織のデータのみアクセス可能
   - User：権限を持つデータのみアクセス可能

3. **監査ログ**:
   - 重要なデータ変更操作をログに記録
   - 特にロール変更やオーナー変更操作

## まとめ

4階層ロール構造と組織ベースのデータモデルへの移行により、より柔軟でスケーラブルなスタイリスト管理が可能になります。各ユーザーが組織に所属し、組織内での役割が明確に定義されることで、権限管理が容易になり、セキュリティが強化されます。また、組織単位での課金体系や機能制限の実装も可能になります。