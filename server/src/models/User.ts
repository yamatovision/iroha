import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * ユーザーモデルのインターフェース
 */
export interface IUser {
  _id?: mongoose.Types.ObjectId;  // MongoDB ObjectID
  email: string;
  password: string;
  displayName: string;
  role: 'SuperAdmin' | 'Admin' | 'User';
  organizationId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  jobTitle?: string;
  teamRole?: string;                // チーム内での役割（デザイナー、エンジニアなど）
  motivation?: number;              // モチベーションスコア（0-100）
  leaveRisk?: 'none' | 'low' | 'medium' | 'high';  // 離職リスク
  
  // JWT認証関連
  refreshToken?: string;            // JWTリフレッシュトークン
  tokenVersion?: number;            // リフレッシュトークンの無効化に使用するバージョン
  lastLogin?: Date;                 // 最終ログイン日時
  
  // Firebase関連フィールドは移行完了により削除しました
  
  // 基本的な誕生情報
  birthDate?: Date;                 // 生年月日
  birthTime?: string;               // 出生時間（HH:MM形式）
  birthPlace?: string;              // 出生地
  gender?: 'M' | 'F';               // 性別
  birthplaceCoordinates?: {         // 出生地の座標
    longitude: number;
    latitude: number;
  };
  localTimeOffset?: number;         // 地方時オフセット（分単位）
  // 国際対応拡張情報
  timeZone?: string;                // タイムゾーン識別子（例：'Asia/Tokyo'）
  extendedLocation?: {              // 拡張されたロケーション情報
    name?: string;                  // 都市名
    country?: string;               // 国名
    coordinates: {                  // 座標（必須）
      longitude: number;
      latitude: number;
    };
    timeZone?: string;              // タイムゾーン識別子
  };
  
  // 個人目標
  goal?: string;                    // ユーザーの設定した目標
  
  // 四柱推命情報
  elementAttribute?: 'wood' | 'fire' | 'earth' | 'metal' | 'water';  // 五行属性
  dayMaster?: string;               // 日主
  fourPillars?: {                   // 四柱（年月日時）
    year: {
      heavenlyStem: string;         // 天干
      earthlyBranch: string;        // 地支
      heavenlyStemTenGod?: string;  // 天干十神
      earthlyBranchTenGod?: string; // 地支十神
      hiddenStems?: string[];       // 隠れ干
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
  elementProfile?: {               // 五行バランス
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  // 格局（気質タイプ）情報
  kakukyoku?: {                     // 格局情報
    type: string;                   // 例: '従旺格', '建禄格'など
    category: 'special' | 'normal'; // 特別格局か普通格局か
    strength: 'strong' | 'weak' | 'neutral'; // 身強か身弱か中和か
    description?: string;           // 格局の説明
  };
  yojin?: {                         // 用神情報
    tenGod: string;                 // 十神表記: 例 '比肩', '食神'
    element: string;                // 五行表記: 例 'wood', 'fire'
    description?: string;           // 用神の説明
    supportElements?: string[];     // 用神をサポートする五行
    kijin?: {                       // 喜神情報（用神を助ける要素）
      tenGod: string;               // 十神表記
      element: string;              // 五行表記
      description?: string;         // 説明
    };
    kijin2?: {                      // 忌神情報（避けるべき要素）
      tenGod: string;               // 十神表記
      element: string;              // 五行表記
      description?: string;         // 説明
    };
    kyujin?: {                      // 仇神情報（強く避けるべき要素）
      tenGod: string;               // 十神表記
      element: string;              // 五行表記
      description?: string;         // 説明
    };
  };
  personalityDescription?: string;  // 性格特性の説明
  careerAptitude?: string;          // 職業適性の説明
  
  // sajuProfileIdフィールドは削除しました（MongoDB ObjectID標準化の一環として）
  plan: 'elite' | 'lite';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * ユーザースキーマ定義
 */
const userSchema = new Schema<IUserDocument>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true // 自動生成
    },
    // UIDフィールドは移行完了により削除しました
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
        values: ['SuperAdmin', 'Admin', 'User'],
        message: '{VALUE}は有効な権限ではありません'
      },
      required: [true, '権限は必須です'],
      default: 'User',
      index: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      // 必須ではなくする
      index: true
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      // 必須ではなくする
      index: true
    },
    jobTitle: {
      type: String,
      trim: true
    },
    teamRole: {
      type: String,
      trim: true,
      maxlength: [50, 'チーム内の役割は50文字以下である必要があります']
    },
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
    
    // 個人目標
    goal: {
      type: String,
      trim: true,
      maxlength: [1000, '目標は1000文字以下である必要があります']
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
    // FirebaseUIDフィールドは移行完了により削除しました
    
    // レガシーフィールドは削除しました
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
    console.log('パスワード比較:', {
      candidateLength: candidatePassword.length,
      hashedLength: this.password?.length,
      hasHash: !!this.password,
      passwordType: typeof this.password
    });
    
    if (!this.password) {
      console.error('パスワードハッシュが存在しません');
      return false;
    }
    
    // パスワードのサニタイズ (万が一空白文字などが含まれている場合)
    const sanitizedCandidate = String(candidatePassword).trim();
    const sanitizedHash = String(this.password).trim();
    
    console.log('サニタイズ後:', {
      candidateLength: sanitizedCandidate.length,
      hashLength: sanitizedHash.length
    });
    
    // bcryptのハッシュ形式を確認（$2b$ または $2a$ で始まるはず）
    if (!sanitizedHash.startsWith('$2')) {
      console.error('パスワードハッシュが正しい形式ではありません');
      return false;
    }
    
    try {
      const result = await bcrypt.compare(sanitizedCandidate, sanitizedHash);
      console.log('bcrypt比較結果:', result);
      return result;
    } catch (bcryptError) {
      console.error('bcrypt比較エラー:', bcryptError);
      // バックアップとして通常の文字列比較（非常に危険、テスト用）
      if (process.env.NODE_ENV === 'development') {
        console.warn('警告：安全でないパスワード比較にフォールバックしています');
        return sanitizedCandidate === sanitizedHash;
      } else {
        throw bcryptError;
      }
    }
  } catch (error) {
    console.error('パスワード比較エラー:', error);
    throw error; // エラーを投げて上位で処理できるようにする
  }
};

// インデックスの設定
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ organizationId: 1, plan: 1 });
userSchema.index({ teamRole: 1 });
userSchema.index({ motivation: 1 });
userSchema.index({ leaveRisk: 1 });

/**
 * ユーザーモデル
 */
export const User = mongoose.model<IUserDocument>('User', userSchema);