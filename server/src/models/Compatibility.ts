import mongoose, { Document, Schema } from 'mongoose';

/**
 * 拡張相性詳細のインターフェース
 */
export interface IEnhancedCompatibilityDetails {
  yinYangBalance: number;
  strengthBalance: number;
  dayBranchRelationship: {
    score: number;
    relationship: string;
  };
  usefulGods: number;
  dayGanCombination: {
    score: number;
    isGangou: boolean;
  };
  relationshipType: string;
}

/**
 * 相性モデルのインターフェース
 */
export interface ICompatibility {
  user1Id: string;
  user2Id: string;
  compatibilityScore: number;
  relationship: 'mutual_generation' | 'mutual_restriction' | 'neutral' | 'enhanced';
  relationshipType?: '相生' | '相克' | '中和' | '理想的パートナー' | '良好な協力関係' | '安定した関係' | '刺激的な関係' | '要注意の関係' | '一般的な関係';
  user1Element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  user2Element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  detailDescription: string;
  teamInsight?: string;
  collaborationTips?: string[];
  enhancedDetails?: IEnhancedCompatibilityDetails;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface ICompatibilityDocument extends ICompatibility, Document {}

/**
 * 相性スキーマ定義
 */
const compatibilitySchema = new Schema<ICompatibilityDocument>(
  {
    user1Id: {
      type: String,
      ref: 'User',
      required: [true, 'ユーザー1IDは必須です']
    },
    user2Id: {
      type: String,
      ref: 'User',
      required: [true, 'ユーザー2IDは必須です']
    },
    compatibilityScore: {
      type: Number,
      required: [true, '相性スコアは必須です'],
      min: [0, '相性スコアは0以上である必要があります'],
      max: [100, '相性スコアは100以下である必要があります']
    },
    relationship: {
      type: String,
      enum: {
        values: ['mutual_generation', 'mutual_restriction', 'neutral', 'enhanced'],
        message: '{VALUE}は有効な関係タイプではありません'
      },
      required: [true, '関係タイプは必須です']
    },
    relationshipType: {
      type: String,
      enum: {
        values: ['相生', '相克', '中和', '理想的パートナー', '良好な協力関係', '安定した関係', '刺激的な関係', '要注意の関係', '一般的な関係'],
        message: '{VALUE}は有効な関係表示名ではありません'
      }
    },
    user1Element: {
      type: String,
      enum: {
        values: ['wood', 'fire', 'earth', 'metal', 'water'],
        message: '{VALUE}は有効な五行属性ではありません'
      },
      required: [true, 'ユーザー1の五行属性は必須です']
    },
    user2Element: {
      type: String,
      enum: {
        values: ['wood', 'fire', 'earth', 'metal', 'water'],
        message: '{VALUE}は有効な五行属性ではありません'
      },
      required: [true, 'ユーザー2の五行属性は必須です']
    },
    detailDescription: {
      type: String,
      required: [true, '相性の詳細説明は必須です']
    },
    teamInsight: {
      type: String
    },
    collaborationTips: {
      type: [String]
    },
    enhancedDetails: {
      yinYangBalance: Number,
      strengthBalance: Number,
      dayBranchRelationship: {
        score: Number,
        relationship: String
      },
      usefulGods: Number,
      dayGanCombination: {
        score: Number,
        isGangou: Boolean
      },
      relationshipType: String
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// データ保存前の処理
compatibilitySchema.pre('save', function(next) {
  // ユーザーIDを常に小さい方が最初に来るように設定
  if (this.user1Id > this.user2Id) {
    // user1IdとuserY2Idを入れ替え
    const tempId = this.user1Id;
    this.user1Id = this.user2Id;
    this.user2Id = tempId;
    
    // 属性も入れ替え
    const tempElement = this.user1Element;
    this.user1Element = this.user2Element;
    this.user2Element = tempElement;
  }

  // relationshipTypeが設定されていない場合、relationshipから自動設定
  if (!this.relationshipType) {
    switch (this.relationship) {
      case 'mutual_generation':
        this.relationshipType = '相生';
        break;
      case 'mutual_restriction':
        this.relationshipType = '相克';
        break;
      case 'neutral':
        this.relationshipType = '中和';
        break;
    }
  }
  
  next();
});

// インデックスの設定
compatibilitySchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });
compatibilitySchema.index({ user1Id: 1 });
compatibilitySchema.index({ user2Id: 1 });
compatibilitySchema.index({ compatibilityScore: -1 });

/**
 * 相性モデル
 */
export const Compatibility = mongoose.model<ICompatibilityDocument>('Compatibility', compatibilitySchema);