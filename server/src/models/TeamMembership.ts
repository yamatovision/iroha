import mongoose, { Document, Schema } from 'mongoose';

/**
 * チームメンバーシップモデルのインターフェース
 */
export interface ITeamMembership {
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  role: string;
  isAdmin: boolean;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface ITeamMembershipDocument extends ITeamMembership, Document {}

/**
 * チームメンバーシップスキーマ定義
 */
const teamMembershipSchema = new Schema<ITeamMembershipDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ユーザーIDは必須です']
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'チームIDは必須です']
    },
    role: {
      type: String,
      trim: true,
      maxlength: [50, 'チーム内の役割は50文字以下である必要があります'],
      default: ''
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// 複合ユニーク制約 (同一ユーザーが同一チームに複数回所属することはできない)
teamMembershipSchema.index({ userId: 1, teamId: 1 }, { unique: true });

// 効率的な検索のためのインデックス
teamMembershipSchema.index({ teamId: 1 });
teamMembershipSchema.index({ userId: 1 });
teamMembershipSchema.index({ isAdmin: 1 });

/**
 * チームメンバーシップモデル
 */
export const TeamMembership = mongoose.model<ITeamMembershipDocument>('TeamMembership', teamMembershipSchema);