import mongoose, { Document, Schema } from 'mongoose';

/**
 * アラートモデルのインターフェース
 */
export interface IAlert {
  teamId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'motivation_low' | 'leave_risk';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IAlertDocument extends IAlert, Document {}

/**
 * アラートスキーマ定義
 */
const alertSchema = new Schema<IAlertDocument>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'チームIDは必須です']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ユーザーIDは必須です']
    },
    type: {
      type: String,
      enum: {
        values: ['motivation_low', 'leave_risk'],
        message: '{VALUE}は有効なアラートタイプではありません'
      },
      required: [true, 'アラートタイプは必須です']
    },
    severity: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '{VALUE}は有効な重要度ではありません'
      },
      required: [true, '重要度は必須です']
    },
    description: {
      type: String,
      required: [true, 'アラート説明は必須です']
    },
    suggestion: {
      type: String,
      required: [true, '対応案は必須です']
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定
alertSchema.index({ teamId: 1 });
alertSchema.index({ userId: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ isRead: 1 });
alertSchema.index({ createdAt: -1 });

/**
 * アラートモデル
 */
export const Alert = mongoose.model<IAlertDocument>('Alert', alertSchema);