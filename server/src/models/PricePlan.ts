import mongoose, { Document, Schema } from 'mongoose';

/**
 * 料金プランモデルのインターフェース
 */
export interface IPricePlan {
  name: string;
  code: 'elite' | 'lite';
  price: number;
  userType: 'Admin' | 'User';
  features: {
    aiModel: 'sonnet' | 'haiku';
    allowTeamCreation: boolean;
    maxChatsPerDay?: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IPricePlanDocument extends IPricePlan, Document {}

/**
 * 料金プランスキーマ定義
 */
const pricePlanSchema = new Schema<IPricePlanDocument>(
  {
    name: {
      type: String,
      required: [true, 'プラン名は必須です'],
      trim: true
    },
    code: {
      type: String,
      enum: {
        values: ['elite', 'lite'],
        message: '{VALUE}は有効なプランコードではありません'
      },
      required: [true, 'プランコードは必須です'],
      unique: true,
      index: true
    },
    price: {
      type: Number,
      required: [true, '価格は必須です'],
      min: [0, '価格は0以上である必要があります']
    },
    userType: {
      type: String,
      enum: {
        values: ['Admin', 'User'],
        message: '{VALUE}は有効なユーザータイプではありません'
      },
      required: [true, 'ユーザータイプは必須です']
    },
    features: {
      aiModel: {
        type: String,
        enum: {
          values: ['sonnet', 'haiku'],
          message: '{VALUE}は有効なAIモデルではありません'
        },
        required: [true, 'AIモデルは必須です']
      },
      allowTeamCreation: {
        type: Boolean,
        required: [true, 'チーム作成権限は必須です']
      },
      maxChatsPerDay: {
        type: Number,
        min: [0, '1日あたりの最大チャット数は0以上である必要があります']
      }
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

// インデックスの設定（スキーマで直接定義されていないフィールドのみ）
pricePlanSchema.index({ userType: 1 });

/**
 * 料金プランモデル
 */
export const PricePlan = mongoose.model<IPricePlanDocument>('PricePlan', pricePlanSchema);