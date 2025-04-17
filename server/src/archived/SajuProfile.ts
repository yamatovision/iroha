import mongoose, { Document, Schema } from 'mongoose';

/**
 * 地理座標インターフェース
 */
export interface IGeoCoordinates {
  longitude: number; // 経度（東経プラス、西経マイナス）
  latitude: number;  // 緯度（北緯プラス、南緯マイナス）
}

/**
 * 四柱推命プロフィールモデルのインターフェース
 */
export interface ISajuProfile {
  userId: string; // Firebase Auth UID or MongoDB ObjectId
  birthdate: Date;
  birthtime: string;
  birthplace: string;
  gender: 'M' | 'F'; // 性別（M=男性, F=女性）
  birthplaceCoordinates?: IGeoCoordinates; // 出生地の座標情報
  localTimeOffset?: number; // 地方時オフセット（分単位）
  elementAttribute: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  dayMaster: string;
  pillars: {
    year: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod: string;
      earthlyBranchTenGod: string;
      hiddenStems: string[];
    };
    month: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod: string;
      earthlyBranchTenGod: string;
      hiddenStems: string[];
    };
    day: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod: string;
      earthlyBranchTenGod: string;
      hiddenStems: string[];
    };
    time: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod: string;
      earthlyBranchTenGod: string;
      hiddenStems: string[];
    };
  };
  personalityDescription: string;
  careerDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface ISajuProfileDocument extends ISajuProfile, Document {}

/**
 * 四柱推命プロフィールスキーマ定義
 */
const sajuProfileSchema = new Schema<ISajuProfileDocument>(
  {
    userId: {
      type: String, // Firebase Auth UIDまたはMongoDBのObjectIdを文字列として保存
      ref: 'User',
      required: [true, 'ユーザーIDは必須です'],
      unique: true,
      index: true
    },
    birthdate: {
      type: Date,
      required: [true, '生年月日は必須です']
    },
    birthtime: {
      type: String,
      required: [true, '生まれた時間は必須です'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '時間はHH:MM形式で入力してください']
    },
    birthplace: {
      type: String,
      required: [true, '出生地は必須です'],
      trim: true
    },
    gender: {
      type: String,
      enum: ['M', 'F'],
      required: [true, '性別は必須です'],
      default: 'M'
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
      default: 0,
      description: '地方時オフセット（分単位）'
    },
    elementAttribute: {
      type: String,
      enum: {
        values: ['wood', 'fire', 'earth', 'metal', 'water'],
        message: '{VALUE}は有効な五行属性ではありません'
      },
      required: [true, '五行属性は必須です'],
      index: true
    },
    dayMaster: {
      type: String,
      required: [true, '日主は必須です'],
      trim: true
    },
    pillars: {
      year: {
        heavenlyStem: {
          type: String,
          required: [true, '年柱の天干は必須です'],
          trim: true
        },
        earthlyBranch: {
          type: String,
          required: [true, '年柱の地支は必須です'],
          trim: true
        },
        heavenlyStemTenGod: {
          type: String,
          required: [true, '年柱の天干十神は必須です'],
          trim: true
        },
        earthlyBranchTenGod: {
          type: String,
          required: [true, '年柱の地支十神は必須です'],
          trim: true
        },
        hiddenStems: {
          type: [String],
          default: []
        }
      },
      month: {
        heavenlyStem: {
          type: String,
          required: [true, '月柱の天干は必須です'],
          trim: true
        },
        earthlyBranch: {
          type: String,
          required: [true, '月柱の地支は必須です'],
          trim: true
        },
        heavenlyStemTenGod: {
          type: String,
          required: [true, '月柱の天干十神は必須です'],
          trim: true
        },
        earthlyBranchTenGod: {
          type: String,
          required: [true, '月柱の地支十神は必須です'],
          trim: true
        },
        hiddenStems: {
          type: [String],
          default: []
        }
      },
      day: {
        heavenlyStem: {
          type: String,
          required: [true, '日柱の天干は必須です'],
          trim: true
        },
        earthlyBranch: {
          type: String,
          required: [true, '日柱の地支は必須です'],
          trim: true
        },
        heavenlyStemTenGod: {
          type: String,
          required: [true, '日柱の天干十神は必須です'],
          trim: true
        },
        earthlyBranchTenGod: {
          type: String,
          required: [true, '日柱の地支十神は必須です'],
          trim: true
        },
        hiddenStems: {
          type: [String],
          default: []
        }
      },
      time: {
        heavenlyStem: {
          type: String,
          required: [true, '時柱の天干は必須です'],
          trim: true
        },
        earthlyBranch: {
          type: String,
          required: [true, '時柱の地支は必須です'],
          trim: true
        },
        heavenlyStemTenGod: {
          type: String,
          required: [true, '時柱の天干十神は必須です'],
          trim: true
        },
        earthlyBranchTenGod: {
          type: String,
          required: [true, '時柱の地支十神は必須です'],
          trim: true
        },
        hiddenStems: {
          type: [String],
          default: []
        }
      }
    },
    personalityDescription: {
      type: String,
      required: [true, '性格特性の説明は必須です']
    },
    careerDescription: {
      type: String,
      required: [true, '仕事とキャリアの適性は必須です']
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定（複合インデックスが必要な場合）
// 現在は単一フィールドのみのため、スキーマで直接定義済み

/**
 * 四柱推命プロフィールモデル
 */
export const SajuProfile = mongoose.model<ISajuProfileDocument>('SajuProfile', sajuProfileSchema);