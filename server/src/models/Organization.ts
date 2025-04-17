import mongoose, { Document, Schema } from 'mongoose';

/**
 * 組織モデルのインターフェース
 */
export interface IOrganization {
  name: string;
  superAdminId: mongoose.Types.ObjectId;
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
    superAdminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'スーパー管理者IDは必須です'],
      index: true
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
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定（複合インデックスのみ）
organizationSchema.index({ 'subscriptionPlan.isActive': 1 });

/**
 * 組織モデル
 */
export const Organization = mongoose.model<IOrganizationDocument>('Organization', organizationSchema);