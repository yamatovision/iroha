# Mongooseスキーマ実装例

このドキュメントでは、主要エンティティのMongooseスキーマ実装例を提供します。これらの例は、`server/src/models/`ディレクトリに実装するためのガイドラインとして使用できます。

## 目次

1. [Organization（組織）](#1-organization組織)
2. [User（ユーザー）](#2-userユーザー)
3. [Client（クライアント）](#3-clientクライアント)
4. [BeautyClientChat（クライアントチャット）](#4-beautyclientchatクライアントチャット)
5. [Appointment（予約）](#5-appointment予約)

## 1. Organization（組織）

```typescript
// server/src/models/Organization.ts
import mongoose, { Document, Schema } from 'mongoose';

/**
 * 組織モデルのインターフェース
 */
export interface IOrganization {
  _id?: mongoose.Types.ObjectId;
  name: string;
  ownerId: mongoose.Types.ObjectId;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  websiteUrl?: string;
  businessHours?: {
    start: string;
    end: string;
    dayOfWeek: number;
  }[];
  description?: string;
  planId?: mongoose.Types.ObjectId;
  subscriptionPlan: {
    type: 'none' | 'active' | 'trial' | 'cancelled';
    isActive: boolean;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  };
  billingInfo: {
    companyName?: string;
    contactName: string;
    contactEmail: string;
    address?: string;
    postalCode?: string;
    country?: string;
    taxId?: string;
    paymentMethodId?: string;
  };
  stripeCustomerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IOrganizationDocument extends IOrganization, Document {}

/**
 * 組織スキーマ定義
 */
const organizationSchema = new Schema<IOrganizationDocument>(
  {
    name: {
      type: String,
      required: [true, '組織名は必須です'],
      trim: true,
      minlength: [2, '組織名は2文字以上である必要があります'],
      maxlength: [100, '組織名は100文字以下である必要があります']
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'オーナーIDは必須です'],
      index: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'Japan' }
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        '有効なメールアドレスを入力してください'
      ]
    },
    contactPhone: {
      type: String,
      trim: true
    },
    logoUrl: {
      type: String,
      trim: true
    },
    websiteUrl: {
      type: String,
      trim: true
    },
    businessHours: [{
      start: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '時間はHH:MM形式で入力してください']
      },
      end: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '時間はHH:MM形式で入力してください']
      },
      dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6
      }
    }],
    description: {
      type: String,
      trim: true
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'PricePlan'
    },
    subscriptionPlan: {
      type: {
        type: String,
        enum: {
          values: ['none', 'active', 'trial', 'cancelled'],
          message: '{VALUE}は有効なサブスクリプションタイプではありません'
        },
        default: 'none'
      },
      isActive: {
        type: Boolean,
        default: false
      },
      currentPeriodStart: {
        type: Date,
        default: Date.now
      },
      currentPeriodEnd: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30日後
      }
    },
    billingInfo: {
      companyName: {
        type: String,
        trim: true
      },
      contactName: {
        type: String,
        required: [true, '請求先担当者名は必須です'],
        trim: true
      },
      contactEmail: {
        type: String,
        required: [true, '請求先メールアドレスは必須です'],
        trim: true,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          '有効なメールアドレスを入力してください'
        ]
      },
      address: {
        type: String,
        trim: true
      },
      postalCode: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true,
        default: 'Japan'
      },
      taxId: {
        type: String,
        trim: true
      },
      paymentMethodId: {
        type: String,
        trim: true
      }
    },
    stripeCustomerId: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定（複合インデックスのみ）
organizationSchema.index({ name: 1 });
organizationSchema.index({ 'subscriptionPlan.isActive': 1 });
organizationSchema.index({ planId: 1 });

/**
 * 組織モデル
 */
export const Organization = mongoose.model<IOrganizationDocument>('Organization', organizationSchema);
```

## 2. User（ユーザー）

```typescript
// server/src/models/User.ts - 更新バージョン
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * ユーザーモデルのインターフェース
 */
export interface IUser {
  _id?: mongoose.Types.ObjectId;
  email: string;
  password: string;
  displayName: string;
  role: 'SuperAdmin' | 'Owner' | 'Admin' | 'User';
  organizationId?: mongoose.Types.ObjectId;
  jobTitle?: string;
  phoneNumber?: string;
  
  // JWT認証関連
  refreshToken?: string;
  tokenVersion?: number;
  lastLogin?: Date;
  
  // 基本的な誕生情報
  birthDate?: Date;
  birthTime?: string;
  birthPlace?: string;
  gender?: 'M' | 'F';
  birthplaceCoordinates?: {
    longitude: number;
    latitude: number;
  };
  localTimeOffset?: number;
  
  // 国際対応拡張情報
  timeZone?: string;
  extendedLocation?: {
    name?: string;
    country?: string;
    coordinates: {
      longitude: number;
      latitude: number;
    };
    timeZone?: string;
  };
  
  // ユーザー行動関連
  motivation?: number;
  leaveRisk?: 'none' | 'low' | 'medium' | 'high';
  goal?: string;
  
  // 四柱推命情報
  elementAttribute?: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  dayMaster?: string;
  fourPillars?: {
    year: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
    month: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
    day: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
    hour: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
  };
  elementProfile?: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  
  // 格局（気質タイプ）情報
  kakukyoku?: {
    type: string;
    category: 'special' | 'normal';
    strength: 'strong' | 'weak' | 'neutral';
    description?: string;
  };
  yojin?: {
    tenGod: string;
    element: string;
    description?: string;
    supportElements?: string[];
    kijin?: {
      tenGod: string;
      element: string;
      description?: string;
    };
    kijin2?: {
      tenGod: string;
      element: string;
      description?: string;
    };
    kyujin?: {
      tenGod: string;
      element: string;
      description?: string;
    };
  };
  personalityDescription?: string;
  careerAptitude?: string;
  
  // サブスクリプション情報
  plan: 'elite' | 'lite';
  isActive: boolean;
  
  // デバイス情報
  deviceTokens?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  getTeams(): Promise<any[]>;
  getFriends(): Promise<any[]>;
  getFriendRequests(): Promise<any[]>;
  getSentRequests(): Promise<any[]>;
}

/**
 * ユーザースキーマ定義
 */
const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'メールアドレスは必須です'],
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        '有効なメールアドレスを入力してください'
      ]
    },
    password: {
      type: String,
      required: [true, 'パスワードは必須です'],
      minlength: [8, 'パスワードは8文字以上である必要があります'],
      select: false // デフォルトではパスワードを取得しない
    },
    displayName: {
      type: String,
      required: [true, '表示名は必須です'],
      trim: true,
      minlength: [2, '表示名は2文字以上である必要があります'],
      maxlength: [50, '表示名は50文字以下である必要があります']
    },
    role: {
      type: String,
      enum: {
        values: ['SuperAdmin', 'Owner', 'Admin', 'User'],
        message: '{VALUE}は有効な権限ではありません'
      },
      required: [true, '権限は必須です'],
      default: 'User',
      index: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      // SuperAdmin以外は必須
      validate: {
        validator: function(this: IUser, v: string) {
          return this.role === 'SuperAdmin' || v !== undefined;
        },
        message: 'SuperAdmin以外のユーザーには組織IDが必要です'
      },
      index: true
    },
    jobTitle: {
      type: String,
      trim: true
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    // JWT認証関連フィールド
    refreshToken: {
      type: String,
      select: false  // セキュリティ上、通常のクエリでは取得しない
    },
    tokenVersion: {
      type: Number,
      default: 0    // トークンの無効化に使用
    },
    lastLogin: {
      type: Date
    },
    
    // 基本的な誕生情報
    birthDate: {
      type: Date
    },
    birthTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '時間はHH:MM形式で入力してください']
    },
    birthPlace: {
      type: String,
      trim: true
    },
    gender: {
      type: String,
      enum: {
        values: ['M', 'F'],
        message: '{VALUE}は有効な性別ではありません'
      }
    },
    birthplaceCoordinates: {
      longitude: {
        type: Number,
        min: [-180, '経度は-180度以上である必要があります'],
        max: [180, '経度は180度以下である必要があります']
      },
      latitude: {
        type: Number,
        min: [-90, '緯度は-90度以上である必要があります'],
        max: [90, '緯度は90度以下である必要があります']
      }
    },
    localTimeOffset: {
      type: Number,
      description: '地方時オフセット（分単位）'
    },
    // 国際対応拡張情報
    timeZone: {
      type: String,
      trim: true,
      description: 'タイムゾーン識別子（例：Asia/Tokyo）'
    },
    extendedLocation: {
      name: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true
      },
      coordinates: {
        longitude: {
          type: Number,
          min: [-180, '経度は-180度以上である必要があります'],
          max: [180, '経度は180度以下である必要があります']
        },
        latitude: {
          type: Number,
          min: [-90, '緯度は-90度以上である必要があります'],
          max: [90, '緯度は90度以下である必要があります']
        }
      },
      timeZone: {
        type: String,
        trim: true
      }
    },
    
    // ユーザー行動関連
    motivation: {
      type: Number,
      min: [0, 'モチベーションは0%以上である必要があります'],
      max: [100, 'モチベーションは100%以下である必要があります'],
      default: 100
    },
    leaveRisk: {
      type: String,
      enum: {
        values: ['none', 'low', 'medium', 'high'],
        message: '{VALUE}は有効な離職リスクレベルではありません'
      },
      default: 'none'
    },
    goal: {
      type: String,
      trim: true,
      maxlength: [1000, '目標は1000文字以下である必要があります']
    },
    
    // 四柱推命情報
    elementAttribute: {
      type: String,
      enum: {
        values: ['wood', 'fire', 'earth', 'metal', 'water'],
        message: '{VALUE}は有効な五行属性ではありません'
      }
    },
    dayMaster: {
      type: String
    },
    fourPillars: {
      year: {
        heavenlyStem: String,
        earthlyBranch: String,
        heavenlyStemTenGod: String,
        earthlyBranchTenGod: String,
        hiddenStems: [String]
      },
      month: {
        heavenlyStem: String,
        earthlyBranch: String,
        heavenlyStemTenGod: String,
        earthlyBranchTenGod: String,
        hiddenStems: [String]
      },
      day: {
        heavenlyStem: String,
        earthlyBranch: String,
        heavenlyStemTenGod: String,
        earthlyBranchTenGod: String,
        hiddenStems: [String]
      },
      hour: {
        heavenlyStem: String,
        earthlyBranch: String,
        heavenlyStemTenGod: String,
        earthlyBranchTenGod: String,
        hiddenStems: [String]
      }
    },
    elementProfile: {
      wood: Number,
      fire: Number,
      earth: Number,
      metal: Number,
      water: Number
    },
    // 格局（気質タイプ）情報
    kakukyoku: {
      type: {
        type: String,
        trim: true
      },
      category: {
        type: String,
        enum: ['special', 'normal']
      },
      strength: {
        type: String,
        enum: ['strong', 'weak', 'neutral']
      },
      description: {
        type: String
      }
    },
    yojin: {
      tenGod: {
        type: String,
        trim: true
      },
      element: {
        type: String,
        trim: true
      },
      description: {
        type: String
      },
      supportElements: [String],
      kijin: {
        tenGod: {
          type: String,
          trim: true
        },
        element: {
          type: String,
          trim: true
        },
        description: {
          type: String
        }
      },
      kijin2: {
        tenGod: {
          type: String,
          trim: true
        },
        element: {
          type: String,
          trim: true
        },
        description: {
          type: String
        }
      },
      kyujin: {
        tenGod: {
          type: String,
          trim: true
        },
        element: {
          type: String,
          trim: true
        },
        description: {
          type: String
        }
      }
    },
    personalityDescription: {
      type: String
    },
    careerAptitude: {
      type: String
    },
    
    // サブスクリプション情報
    plan: {
      type: String,
      enum: {
        values: ['elite', 'lite'],
        message: '{VALUE}は有効なプランではありません'
      },
      required: [true, 'プランは必須です'],
      default: 'lite'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    
    // デバイス情報
    deviceTokens: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// パスワードのハッシュ化
userSchema.pre('save', async function(next) {
  // パスワードが変更されていない場合はスキップ
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // ソルトを生成
    const salt = await bcrypt.genSalt(10);
    // パスワードをハッシュ化
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// パスワード比較メソッド
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    if (!this.password) {
      return false;
    }
    
    // パスワードのサニタイズ
    const sanitizedCandidate = String(candidatePassword).trim();
    const sanitizedHash = String(this.password).trim();
    
    // bcryptのハッシュ形式を確認
    if (!sanitizedHash.startsWith('$2')) {
      return false;
    }
    
    return await bcrypt.compare(sanitizedCandidate, sanitizedHash);
  } catch (error) {
    throw error;
  }
};

// チーム取得メソッド
userSchema.methods.getTeams = async function() {
  const TeamMembership = mongoose.model('TeamMembership');
  
  const memberships = await TeamMembership.find({ 
    userId: this._id 
  }).populate('teamId');
  
  return memberships;
};

// 友達関係取得メソッド
userSchema.methods.getFriends = async function() {
  const Friendship = mongoose.model('Friendship');
  
  const friendships = await Friendship.find({
    $or: [
      { userId1: this._id, status: 'accepted' },
      { userId2: this._id, status: 'accepted' }
    ]
  });
  
  return friendships.map(friendship => {
    const friendId = friendship.userId1.equals(this._id) ? 
      friendship.userId2 : friendship.userId1;
    return {
      friendshipId: friendship._id,
      friendId,
      createdAt: friendship.createdAt,
      acceptedAt: friendship.acceptedAt
    };
  });
};

// 友達リクエスト取得メソッド
userSchema.methods.getFriendRequests = async function() {
  const Friendship = mongoose.model('Friendship');
  
  return await Friendship.find({
    userId2: this._id,
    status: 'pending'
  }).populate('userId1', 'displayName email elementAttribute');
};

// 送信済みリクエスト取得メソッド
userSchema.methods.getSentRequests = async function() {
  const Friendship = mongoose.model('Friendship');
  
  return await Friendship.find({
    userId1: this._id,
    requesterId: this._id,
    status: 'pending'
  }).populate('userId2', 'displayName email elementAttribute');
};

// カスタムバリデーション
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

// インデックスの設定
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ organizationId: 1, plan: 1 });
userSchema.index({ motivation: 1 });
userSchema.index({ leaveRisk: 1 });

/**
 * ユーザーモデル
 */
export const User = mongoose.model<IUserDocument>('User', userSchema);
```

## 3. Client（クライアント）

```typescript
// server/src/models/Client.ts
import mongoose, { Document, Schema } from 'mongoose';

/**
 * クライアントモデルのインターフェース
 */
export interface IClient {
  _id?: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  nameReading?: string;
  gender?: 'M' | 'F';
  birthdate?: Date;
  birthtime?: string;
  birthPlace?: string;
  phone?: string;
  email?: string;
  address?: string;
  memo?: string;
  
  // カスタムプロパティ
  customFields?: Record<string, any>;
  
  // 外部システム連携情報
  externalSources?: {
    [sourceKey: string]: string;
  };
  
  // 四柱推命情報
  birthplaceCoordinates?: {
    longitude: number;
    latitude: number;
  };
  localTimeOffset?: number;
  timeZone?: string;
  elementAttribute?: string;
  fourPillars?: {
    year: {
      gan: string;
      shi: string;
      element: string;
    };
    month: {
      gan: string;
      shi: string;
      element: string;
    };
    day: {
      gan: string;
      shi: string;
      element: string;
    };
    hour: {
      gan: string;
      shi: string;
      element: string;
    };
  };
  elementProfile?: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  kakukyoku?: {
    type: string;
    category: 'special' | 'normal';
    strength: 'strong' | 'weak' | 'neutral';
    description?: string;
  };
  yojin?: {
    tenGod: string;
    element: string;
    description?: string;
    supportElements?: string[];
  };
  personalityDescription?: string;
  
  // 内部管理用
  isFavorite: boolean;
  hasCompleteSajuProfile: boolean;
  lastVisitDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IClientDocument extends IClient, Document {
  getAppointments(): Promise<any[]>;
  getNotes(): Promise<any[]>;
}

/**
 * クライアントスキーマ定義
 */
const clientSchema = new Schema<IClientDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, '組織IDは必須です'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'クライアント名は必須です'],
      trim: true,
      index: true
    },
    nameReading: {
      type: String,
      trim: true
    },
    gender: {
      type: String,
      enum: {
        values: ['M', 'F'],
        message: '{VALUE}は有効な性別ではありません'
      }
    },
    birthdate: {
      type: Date
    },
    birthtime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '時間はHH:MM形式で入力してください']
    },
    birthPlace: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      index: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        '有効なメールアドレスを入力してください'
      ],
      index: true
    },
    address: {
      type: String,
      trim: true
    },
    memo: {
      type: String,
      trim: true
    },
    
    // カスタムプロパティ
    customFields: {
      type: Map,
      of: Schema.Types.Mixed
    },
    
    // 外部システム連携情報
    externalSources: {
      type: Map,
      of: String
    },
    
    // 四柱推命情報
    birthplaceCoordinates: {
      longitude: {
        type: Number,
        min: [-180, '経度は-180度以上である必要があります'],
        max: [180, '経度は180度以下である必要があります']
      },
      latitude: {
        type: Number,
        min: [-90, '緯度は-90度以上である必要があります'],
        max: [90, '緯度は90度以下である必要があります']
      }
    },
    localTimeOffset: {
      type: Number
    },
    timeZone: {
      type: String,
      trim: true
    },
    elementAttribute: {
      type: String,
      enum: {
        values: ['wood', 'fire', 'earth', 'metal', 'water'],
        message: '{VALUE}は有効な五行属性ではありません'
      }
    },
    fourPillars: {
      year: {
        gan: String,
        shi: String,
        element: String
      },
      month: {
        gan: String,
        shi: String,
        element: String
      },
      day: {
        gan: String,
        shi: String,
        element: String
      },
      hour: {
        gan: String,
        shi: String,
        element: String
      }
    },
    elementProfile: {
      wood: Number,
      fire: Number,
      earth: Number,
      metal: Number,
      water: Number
    },
    kakukyoku: {
      type: {
        type: String,
        trim: true
      },
      category: {
        type: String,
        enum: ['special', 'normal']
      },
      strength: {
        type: String,
        enum: ['strong', 'weak', 'neutral']
      },
      description: String
    },
    yojin: {
      tenGod: String,
      element: String,
      description: String,
      supportElements: [String]
    },
    personalityDescription: String,
    
    // 内部管理用
    isFavorite: {
      type: Boolean,
      default: false,
      index: true
    },
    hasCompleteSajuProfile: {
      type: Boolean,
      default: false,
      index: true
    },
    lastVisitDate: {
      type: Date,
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// 予約取得メソッド
clientSchema.methods.getAppointments = async function() {
  const Appointment = mongoose.model('Appointment');
  
  return await Appointment.find({
    clientId: this._id
  }).sort({ appointmentDate: -1, startTime: 1 });
};

// メモ取得メソッド
clientSchema.methods.getNotes = async function() {
  const ClientNote = mongoose.model('ClientNote');
  
  return await ClientNote.find({
    clientId: this._id
  }).sort({ createdAt: -1 });
};

// インデックスの設定
clientSchema.index({ organizationId: 1, name: 1 });
clientSchema.index({ organizationId: 1, phone: 1 });
clientSchema.index({ organizationId: 1, email: 1 });
clientSchema.index({ organizationId: 1, isFavorite: 1 });
clientSchema.index({ organizationId: 1, hasCompleteSajuProfile: 1 });
clientSchema.index({ organizationId: 1, lastVisitDate: -1 });

/**
 * クライアントモデル
 */
export const Client = mongoose.model<IClientDocument>('Client', clientSchema);
```

## 4. BeautyClientChat（クライアントチャット）

```typescript
// server/src/models/BeautyClientChat.ts
import mongoose, { Document, Schema } from 'mongoose';

/**
 * クライアントチャットメッセージのインターフェース
 */
export interface IBeautyClientChatMessage {
  _id?: mongoose.Types.ObjectId;
  sender: 'stylist' | 'assistant';
  senderId?: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  additionalContext?: {
    visitPurpose?: string;
    clientConcerns?: string[];
    seasonalEvent?: string;
    hairCondition?: string;
    dayPillar?: {
      heavenlyStem: string;
      earthlyBranch: string;
      hiddenStems: string[];
      energyDescription: string;
    };
  };
}

/**
 * クライアントチャットのインターフェース
 */
export interface IBeautyClientChat {
  _id?: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  lastMessageAt: Date;
  tokenCount: number;
  aiModel: string;
  contextData: {
    sajuProfile?: {
      fourPillars: {
        yearPillar: { stem: string; branch: string; hiddenStems?: string[] };
        monthPillar: { stem: string; branch: string; hiddenStems?: string[] };
        dayPillar: { stem: string; branch: string; hiddenStems?: string[] };
        hourPillar: { stem: string; branch: string; hiddenStems?: string[] };
      };
      kakukyoku?: {
        type: string;
        category: string;
        strength: string;
        description: string;
      };
      yojin?: {
        tenGod: string;
        element: string;
        description: string;
        supportElements: string[];
      };
      elementProfile: {
        wood: number;
        fire: number;
        earth: number;
        metal: number;
        water: number;
        mainElement: string;
        secondaryElement?: string;
      };
    };
    clientProfile?: {
      name: string;
      gender: 'M' | 'F';
      birthdate: string;
      birthtime?: string;
      preferences?: string[];
      hairType?: string;
      skinTone?: string;
    };
    visitHistory?: Array<{
      date: string;
      serviceType: string;
      stylistId: string;
      stylistName: string;
      notes?: string;
    }>;
    additionalNotes?: string[];
  };
  messages: IBeautyClientChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IBeautyClientChatDocument extends IBeautyClientChat, Document {
  addMessage(message: Partial<IBeautyClientChatMessage>): Promise<IBeautyClientChatMessage>;
  getLatestMessages(limit?: number): IBeautyClientChatMessage[];
  getTotalTokenUsage(): number;
}

/**
 * クライアントチャットメッセージのスキーマ
 */
const beautyChatMessageSchema = new Schema<IBeautyClientChatMessage>({
  sender: {
    type: String,
    enum: ['stylist', 'assistant'],
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tokenUsage: {
    prompt: Number,
    completion: Number,
    total: Number
  },
  additionalContext: {
    visitPurpose: String,
    clientConcerns: [String],
    seasonalEvent: String,
    hairCondition: String,
    dayPillar: {
      heavenlyStem: String,
      earthlyBranch: String,
      hiddenStems: [String],
      energyDescription: String
    }
  }
}, { _id: true });

/**
 * クライアントチャットスキーマ定義
 */
const beautyClientChatSchema = new Schema<IBeautyClientChatDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, '組織IDは必須です'],
      index: true
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'クライアントIDは必須です'],
      index: true
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    tokenCount: {
      type: Number,
      default: 0
    },
    aiModel: {
      type: String,
      default: 'gpt-4o'
    },
    contextData: {
      sajuProfile: {
        fourPillars: {
          yearPillar: { 
            stem: String, 
            branch: String, 
            hiddenStems: [String] 
          },
          monthPillar: { 
            stem: String, 
            branch: String, 
            hiddenStems: [String] 
          },
          dayPillar: { 
            stem: String, 
            branch: String, 
            hiddenStems: [String] 
          },
          hourPillar: { 
            stem: String, 
            branch: String, 
            hiddenStems: [String] 
          }
        },
        kakukyoku: {
          type: String,
          category: String,
          strength: String,
          description: String
        },
        yojin: {
          tenGod: String,
          element: String,
          description: String,
          supportElements: [String]
        },
        elementProfile: {
          wood: Number,
          fire: Number,
          earth: Number,
          metal: Number,
          water: Number,
          mainElement: String,
          secondaryElement: String
        }
      },
      clientProfile: {
        name: String,
        gender: {
          type: String,
          enum: ['M', 'F']
        },
        birthdate: String,
        birthtime: String,
        preferences: [String],
        hairType: String,
        skinTone: String
      },
      visitHistory: [{
        date: String,
        serviceType: String,
        stylistId: String,
        stylistName: String,
        notes: String
      }],
      additionalNotes: [String]
    },
    messages: [beautyChatMessageSchema]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// メッセージ追加メソッド
beautyClientChatSchema.methods.addMessage = async function(message: Partial<IBeautyClientChatMessage>) {
  this.messages.push(message);
  this.lastMessageAt = new Date();
  
  // トークン使用量を更新
  if (message.tokenUsage && message.tokenUsage.total) {
    this.tokenCount += message.tokenUsage.total;
  }
  
  await this.save();
  return this.messages[this.messages.length - 1];
};

// 最新メッセージ取得メソッド
beautyClientChatSchema.methods.getLatestMessages = function(limit = 10) {
  return this.messages
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
};

// トークン使用量合計取得メソッド
beautyClientChatSchema.methods.getTotalTokenUsage = function() {
  return this.tokenCount;
};

// インデックスの設定
beautyClientChatSchema.index({ organizationId: 1, clientId: 1 }, { unique: true });
beautyClientChatSchema.index({ clientId: 1, lastMessageAt: -1 });
beautyClientChatSchema.index({ organizationId: 1, lastMessageAt: -1 });

/**
 * クライアントチャットモデル
 */
export const BeautyClientChat = mongoose.model<IBeautyClientChatDocument>(
  'BeautyClientChat', 
  beautyClientChatSchema
);
```

## 5. Appointment（予約）

```typescript
// server/src/models/Appointment.ts
import mongoose, { Document, Schema } from 'mongoose';

/**
 * 予約モデルのインターフェース
 */
export interface IAppointment {
  _id?: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  stylistId: mongoose.Types.ObjectId;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  services: string[];
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show';
  notes: string;
  source: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  externalIds: {
    calendarEventId?: string;
    hotpepperBookingId?: string;
    otherSystemId?: string;
  };
  lastSyncTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IAppointmentDocument extends IAppointment, Document {}

/**
 * 予約スキーマ定義
 */
const appointmentSchema = new Schema<IAppointmentDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, '組織IDは必須です'],
      index: true
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'クライアントIDは必須です'],
      index: true
    },
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'スタイリストIDは必須です'],
      index: true
    },
    appointmentDate: {
      type: Date,
      required: [true, '予約日は必須です'],
      index: true
    },
    startTime: {
      type: String,
      required: [true, '開始時間は必須です'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '時間はHH:MM形式で入力してください']
    },
    endTime: {
      type: String,
      required: [true, '終了時間は必須です'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '時間はHH:MM形式で入力してください']
    },
    duration: {
      type: Number,
      required: [true, '所要時間は必須です'],
      min: [5, '所要時間は5分以上である必要があります'],
      max: [480, '所要時間は480分以下である必要があります']
    },
    services: {
      type: [String],
      required: [true, 'サービス内容は必須です'],
      validate: {
        validator: function(v: string[]) {
          return v.length > 0;
        },
        message: '少なくとも1つのサービスを指定してください'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'pending', 'cancelled', 'completed', 'no_show'],
        message: '{VALUE}は有効な予約ステータスではありません'
      },
      required: [true, 'ステータスは必須です'],
      default: 'confirmed',
      index: true
    },
    notes: {
      type: String,
      trim: true
    },
    source: {
      type: String,
      trim: true,
      default: '手動'
    },
    timeSlot: {
      type: String,
      enum: {
        values: ['morning', 'afternoon', 'evening'],
        message: '{VALUE}は有効な時間帯区分ではありません'
      },
      required: [true, '時間帯区分は必須です']
    },
    externalIds: {
      calendarEventId: String,
      hotpepperBookingId: String,
      otherSystemId: String
    },
    lastSyncTime: {
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// 時間帯区分の自動設定
appointmentSchema.pre('save', function(next) {
  const startHour = parseInt(this.startTime.split(':')[0]);
  
  if (startHour < 12) {
    this.timeSlot = 'morning';
  } else if (startHour < 17) {
    this.timeSlot = 'afternoon';
  } else {
    this.timeSlot = 'evening';
  }
  
  next();
});

// クライアントのlastVisitDate更新
appointmentSchema.post('save', async function() {
  if (this.status === 'completed') {
    try {
      const Client = mongoose.model('Client');
      const today = new Date();
      
      // クライアントの最終来店日を更新（完了した予約のみ）
      await Client.findByIdAndUpdate(
        this.clientId,
        { 
          $set: { 
            lastVisitDate: today 
          } 
        },
        { 
          new: true 
        }
      );
    } catch (error) {
      console.error('クライアントの最終来店日更新エラー:', error);
    }
  }
});

// インデックスの設定
appointmentSchema.index({ organizationId: 1, appointmentDate: 1 });
appointmentSchema.index({ organizationId: 1, stylistId: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, status: 1 });
appointmentSchema.index({ 'externalIds.calendarEventId': 1 });

/**
 * 予約モデル
 */
export const Appointment = mongoose.model<IAppointmentDocument>('Appointment', appointmentSchema);
```

これらのスキーマ実装例を参考に、他のモデルも同様に実装してください。各モデルは、`server/src/models/`ディレクトリに配置し、`index.ts`ファイルからエクスポートすることで、アプリケーション全体から利用できるようにします。