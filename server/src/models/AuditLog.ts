import mongoose, { Document, Schema } from 'mongoose';

/**
 * 監査ログモデルのインターフェース
 */
export interface IAuditLog {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'payment' | 'subscription_change';
  resourceType: 'user' | 'team' | 'subscription' | 'organization' | 'system_setting';
  resourceId?: mongoose.Types.ObjectId;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IAuditLogDocument extends IAuditLog, Document {}

/**
 * 監査ログスキーマ定義
 */
const auditLogSchema = new Schema<IAuditLogDocument>(
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
    action: {
      type: String,
      enum: {
        values: ['create', 'update', 'delete', 'login', 'logout', 'payment', 'subscription_change'],
        message: '{VALUE}は有効なアクションではありません'
      },
      required: [true, 'アクションは必須です']
    },
    resourceType: {
      type: String,
      enum: {
        values: ['user', 'team', 'subscription', 'organization', 'system_setting'],
        message: '{VALUE}は有効なリソースタイプではありません'
      },
      required: [true, 'リソースタイプは必須です']
    },
    resourceId: {
      type: Schema.Types.ObjectId
    },
    details: {
      type: Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false
    },
    versionKey: false
  }
);

// インデックスの設定
auditLogSchema.index({ organizationId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resourceType: 1 });
auditLogSchema.index({ resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });

/**
 * 監査ログモデル
 */
export const AuditLog = mongoose.model<IAuditLogDocument>('AuditLog', auditLogSchema);