import mongoose, { Document, Schema } from 'mongoose';

/**
 * チームメンバーロール定義
 */
export enum TeamMemberRole {
  CREATOR = 'creator',   // チーム作成者（最高権限）
  ADMIN = 'admin',       // 管理者（一部権限）
  MEMBER = 'member'      // 一般メンバー
}

/**
 * チームメンバーシップモデルのインターフェース
 */
export interface ITeamMembership {
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  role: string;                      // 職務役割（例：エンジニア、マーケター）
  memberRole?: TeamMemberRole;       // メンバー権限ロール（creator, admin, member）
  isAdmin: boolean;                  // 後方互換性のため維持
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
    memberRole: {
      type: String,
      enum: Object.values(TeamMemberRole),
      default: TeamMemberRole.MEMBER
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