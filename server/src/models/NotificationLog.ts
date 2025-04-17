import mongoose, { Document, Schema } from 'mongoose';

/**
 * 通知ログモデルのインターフェース
 */
export interface INotificationLog {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'payment_failed' | 'subscription_expiring' | 'system_alert';
  channel: 'email' | 'in_app';
  status: 'pending' | 'sent' | 'failed' | 'read';
  subject: string;
  content: string;
  metadata?: Record<string, any>;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface INotificationLogDocument extends INotificationLog, Document {}

/**
 * 通知ログスキーマ定義
 */
const notificationLogSchema = new Schema<INotificationLogDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, '組織IDは必須です']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ユーザーIDは必須です']
    },
    type: {
      type: String,
      enum: {
        values: ['payment_failed', 'subscription_expiring', 'system_alert'],
        message: '{VALUE}は有効な通知タイプではありません'
      },
      required: [true, '通知タイプは必須です']
    },
    channel: {
      type: String,
      enum: {
        values: ['email', 'in_app'],
        message: '{VALUE}は有効な通知チャネルではありません'
      },
      required: [true, '通知チャネルは必須です']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'sent', 'failed', 'read'],
        message: '{VALUE}は有効な通知ステータスではありません'
      },
      required: [true, '通知ステータスは必須です'],
      default: 'pending'
    },
    subject: {
      type: String,
      required: [true, '件名は必須です'],
      trim: true
    },
    content: {
      type: String,
      required: [true, '内容は必須です']
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    sentAt: {
      type: Date
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定
notificationLogSchema.index({ organizationId: 1 });
notificationLogSchema.index({ userId: 1 });
notificationLogSchema.index({ type: 1 });
notificationLogSchema.index({ status: 1 });
notificationLogSchema.index({ createdAt: -1 });
notificationLogSchema.index({ userId: 1, status: 1 });

/**
 * 通知ログモデル
 */
export const NotificationLog = mongoose.model<INotificationLogDocument>('NotificationLog', notificationLogSchema);