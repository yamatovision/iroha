import mongoose, { Document, Schema } from 'mongoose';

/**
 * 請求書アイテムのインターフェース
 */
export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/**
 * 請求書モデルのインターフェース
 */
export interface IInvoice {
  organizationId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
  paidAt?: Date;
  items: IInvoiceItem[];
  paymentMethodId?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IInvoiceDocument extends IInvoice, Document {}

/**
 * 請求書アイテムスキーマ定義
 */
const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: {
      type: String,
      required: [true, '説明は必須です'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, '数量は必須です'],
      min: [1, '数量は1以上である必要があります']
    },
    unitPrice: {
      type: Number,
      required: [true, '単価は必須です'],
      min: [0, '単価は0以上である必要があります']
    },
    amount: {
      type: Number,
      required: [true, '金額は必須です'],
      min: [0, '金額は0以上である必要があります']
    }
  },
  {
    _id: false // サブドキュメントにIDを付与しない
  }
);

/**
 * 請求書スキーマ定義
 */
const invoiceSchema = new Schema<IInvoiceDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, '組織IDは必須です'],
      index: true
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      required: [true, 'サブスクリプションIDは必須です']
    },
    invoiceNumber: {
      type: String,
      required: [true, '請求書番号は必須です'],
      unique: true,
      index: true
    },
    amount: {
      type: Number,
      required: [true, '合計金額は必須です'],
      min: [0, '合計金額は0以上である必要があります']
    },
    currency: {
      type: String,
      required: [true, '通貨は必須です'],
      default: 'JPY'
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'open', 'paid', 'void', 'uncollectible'],
        message: '{VALUE}は有効な請求書ステータスではありません'
      },
      required: [true, 'ステータスは必須です'],
      default: 'draft',
      index: true
    },
    billingPeriodStart: {
      type: Date,
      required: [true, '請求期間開始日は必須です']
    },
    billingPeriodEnd: {
      type: Date,
      required: [true, '請求期間終了日は必須です']
    },
    dueDate: {
      type: Date,
      required: [true, '支払期限は必須です'],
      index: true
    },
    paidAt: {
      type: Date
    },
    items: {
      type: [invoiceItemSchema],
      required: [true, '請求項目は最低1つ必要です'],
      validate: {
        validator: function(items: IInvoiceItem[]) {
          return items && items.length > 0;
        },
        message: '請求項目は最低1つ必要です'
      }
    },
    paymentMethodId: {
      type: String
    },
    receiptUrl: {
      type: String
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定（複合インデックスのみ）
invoiceSchema.index({ billingPeriodStart: 1, billingPeriodEnd: 1 });

/**
 * 請求書モデル
 */
export const Invoice = mongoose.model<IInvoiceDocument>('Invoice', invoiceSchema);