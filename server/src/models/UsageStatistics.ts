import mongoose, { Document, Schema } from 'mongoose';

/**
 * 利用統計モデルのインターフェース
 */
export interface IUsageStatistics {
  organizationId: mongoose.Types.ObjectId;
  type: 'user' | 'ai';
  date: Date;
  metrics: {
    totalUsers?: number;
    activeUsers?: number;
    newUsers?: number;
    aiRequests?: number;
    averageResponseTime?: number;
    haikusUsed?: number;
    sonnetsUsed?: number;
  };
  createdAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IUsageStatisticsDocument extends IUsageStatistics, Document {}

/**
 * 利用統計スキーマ定義
 */
const usageStatisticsSchema = new Schema<IUsageStatisticsDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, '組織IDは必須です']
    },
    type: {
      type: String,
      enum: {
        values: ['user', 'ai'],
        message: '{VALUE}は有効な統計タイプではありません'
      },
      required: [true, '統計タイプは必須です']
    },
    date: {
      type: Date,
      required: [true, '日付は必須です']
    },
    metrics: {
      totalUsers: Number,
      activeUsers: Number,
      newUsers: Number,
      aiRequests: Number,
      averageResponseTime: Number,
      haikusUsed: Number,
      sonnetsUsed: Number
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
usageStatisticsSchema.index({ organizationId: 1, date: 1 });
usageStatisticsSchema.index({ organizationId: 1, type: 1 });
usageStatisticsSchema.index({ date: 1 });

/**
 * 利用統計モデル
 */
export const UsageStatistics = mongoose.model<IUsageStatisticsDocument>('UsageStatistics', usageStatisticsSchema);