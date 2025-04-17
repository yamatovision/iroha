import mongoose, { Document, Schema } from 'mongoose';

/**
 * システム設定モデルのインターフェース
 */
export interface ISystemSetting {
  organizationId?: mongoose.Types.ObjectId;
  key: string;
  value: string;
  description: string;
  updatedAt: Date;
  updatedBy: string | mongoose.Types.ObjectId; // FirebaseのUIDまたはMongoDBのObjectID
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface ISystemSettingDocument extends ISystemSetting, Document {}

/**
 * システム設定スキーマ定義
 */
const systemSettingSchema = new Schema<ISystemSettingDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization'
    },
    key: {
      type: String,
      required: [true, '設定キーは必須です'],
      trim: true
    },
    value: {
      type: String,
      required: [true, '設定値は必須です']
    },
    description: {
      type: String,
      required: [true, '説明は必須です']
    },
    updatedBy: {
      type: Schema.Types.Mixed, // FirebaseのUIDを直接格納できるように変更
      required: [true, '更新者IDは必須です']
    }
  },
  {
    timestamps: {
      createdAt: false,
      updatedAt: true
    },
    versionKey: false
  }
);

// インデックスの設定
systemSettingSchema.index({ key: 1, organizationId: 1 }, { unique: true });
systemSettingSchema.index({ organizationId: 1 });

/**
 * システム設定モデル
 */
export const SystemSetting = mongoose.model<ISystemSettingDocument>('SystemSetting', systemSettingSchema);