import mongoose, { Document, Schema } from 'mongoose';

/**
 * サブスクリプションステータス列挙型
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  SUSPENDED = 'suspended' // payment-webhook.controller.tsで使用
}

/**
 * サブスクリプションモデルのインターフェース
 */
export interface ISubscription {
  organizationId: mongoose.Types.ObjectId;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
  planId?: string; // payment-webhook.controller.tsで使用
  quantity: number;
  totalAmount: number;
  currency: string;
  paymentMethodId?: string;
  adminCount: number;
  userCount: number;
  lastInvoiceId?: string;
  startDate?: Date; // payment-webhook.controller.tsで使用
  nextBillingDate?: Date; // payment-webhook.controller.tsで使用
  metadata?: any; // payment-webhook.controller.tsで使用
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface ISubscriptionDocument extends ISubscription, Document {}

/**
 * サブスクリプションスキーマ定義
 */
const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, '組織IDは必須です'],
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: {
        values: Object.values(SubscriptionStatus),
        message: '{VALUE}は有効なサブスクリプションステータスではありません'
      },
      required: [true, 'ステータスは必須です'],
      default: SubscriptionStatus.INCOMPLETE,
      index: true
    },
    currentPeriodStart: {
      type: Date,
      required: [true, '期間開始日は必須です'],
      default: Date.now
    },
    currentPeriodEnd: {
      type: Date,
      required: [true, '期間終了日は必須です'],
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
      index: true
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    priceId: {
      type: String,
      required: [true, '料金プランIDは必須です']
    },
    quantity: {
      type: Number,
      required: [true, 'ユーザー数は必須です'],
      min: [1, 'ユーザー数は1以上である必要があります']
    },
    totalAmount: {
      type: Number,
      required: [true, '合計金額は必須です'],
      min: [0, '合計金額は0以上である必要があります']
    },
    currency: {
      type: String,
      required: [true, '通貨は必須です'],
      default: 'JPY'
    },
    paymentMethodId: {
      type: String
    },
    adminCount: {
      type: Number,
      required: [true, '管理者数は必須です'],
      min: [0, '管理者数は0以上である必要があります'],
      default: 0
    },
    userCount: {
      type: Number,
      required: [true, 'ユーザー数は必須です'],
      min: [0, 'ユーザー数は0以上である必要があります'],
      default: 0
    },
    lastInvoiceId: {
      type: String
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定（現在は全て単一フィールドのため、スキーマで直接定義済み）

/**
 * サブスクリプションモデル
 */
export const Subscription = mongoose.model<ISubscriptionDocument>('Subscription', subscriptionSchema);