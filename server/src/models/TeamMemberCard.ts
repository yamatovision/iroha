import mongoose, { Document, Schema } from 'mongoose';

/**
 * チームメンバーカルテモデルのインターフェース
 */
export interface ITeamMemberCard {
  teamId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // MongoDBのObjectID
  cardContent: string; // マークダウン形式のAI生成コンテンツ
  version: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface ITeamMemberCardDocument extends ITeamMemberCard, Document {}

/**
 * チームメンバーカルテスキーマ定義
 */
const teamMemberCardSchema = new Schema<ITeamMemberCardDocument>(
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
    cardContent: {
      type: String,
      required: [true, 'カルテの内容は必須です'],
    },
    version: {
      type: Number,
      default: 1
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定
teamMemberCardSchema.index({ teamId: 1, userId: 1 }, { unique: true });
teamMemberCardSchema.index({ userId: 1 });
teamMemberCardSchema.index({ lastUpdated: -1 });

/**
 * チームメンバーカルテモデル
 */
export const TeamMemberCard = mongoose.model<ITeamMemberCardDocument>('TeamMemberCard', teamMemberCardSchema);