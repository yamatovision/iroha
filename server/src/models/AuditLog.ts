import mongoose, { Document, Schema } from 'mongoose';

/**
 * 監査ログモデルのインターフェース
 */
export interface IAuditLog {
  category: string;
  action: string;
  data: Record<string, any>;
  userId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
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
    category: {
      type: String,
      required: [true, 'カテゴリは必須です'],
      index: true
    },
    action: {
      type: String,
      required: [true, 'アクションは必須です'],
      index: true
    },
    data: {
      type: Schema.Types.Mixed,
      default: {}
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    versionKey: false
  }
);

// 複合インデックスの設定
auditLogSchema.index({ category: 1, action: 1 });
auditLogSchema.index({ organizationId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

/**
 * 監査ログモデル
 */
export const AuditLog = mongoose.model<IAuditLogDocument>('AuditLog', auditLogSchema);