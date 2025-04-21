import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

/**
 * 招待リンクモデルのインターフェース
 */
export interface IInvitationLink {
  code: string;
  teamId?: mongoose.Types.ObjectId;
  inviterId: mongoose.Types.ObjectId;
  email: string;
  type: 'team' | 'friend';
  role?: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IInvitationLinkDocument extends IInvitationLink, Document {}

/**
 * 招待リンクスキーマ定義
 */
const invitationLinkSchema = new Schema<IInvitationLinkDocument>(
  {
    code: {
      type: String,
      required: [true, '招待コードは必須です'],
      unique: true,
      default: () => crypto.randomBytes(16).toString('hex')
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    inviterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '招待者IDは必須です']
    },
    email: {
      type: String,
      required: [true, 'メールアドレスは必須です'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        '有効なメールアドレスを入力してください'
      ]
    },
    type: {
      type: String,
      enum: {
        values: ['team', 'friend'],
        message: '{VALUE}は有効な招待タイプではありません'
      },
      required: [true, '招待タイプは必須です']
    },
    role: {
      type: String,
      trim: true,
      maxlength: [50, '役割は50文字以下である必要があります']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'expired'],
        message: '{VALUE}は有効なステータスではありません'
      },
      default: 'pending'
    },
    expiresAt: {
      type: Date,
      required: [true, '有効期限は必須です'],
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7日間有効
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定
invitationLinkSchema.index({ code: 1 }, { unique: true });
invitationLinkSchema.index({ inviterId: 1 });
invitationLinkSchema.index({ email: 1 });
invitationLinkSchema.index({ teamId: 1 });
invitationLinkSchema.index({ type: 1 });
invitationLinkSchema.index({ status: 1 });
invitationLinkSchema.index({ expiresAt: 1 });

/**
 * 招待リンクモデル
 */
export const InvitationLink = mongoose.model<IInvitationLinkDocument>('InvitationLink', invitationLinkSchema);