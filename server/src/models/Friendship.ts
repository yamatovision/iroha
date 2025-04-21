import mongoose, { Document, Schema } from 'mongoose';

/**
 * 友達関係モデルのインターフェース
 */
export interface IFriendship {
  userId1: mongoose.Types.ObjectId;
  userId2: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  requesterId: mongoose.Types.ObjectId;
  compatibilityScore?: number;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IFriendshipDocument extends IFriendship, Document {}

/**
 * 友達関係スキーマ定義
 */
const friendshipSchema = new Schema<IFriendshipDocument>(
  {
    userId1: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ユーザーID1は必須です']
    },
    userId2: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ユーザーID2は必須です']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected'],
        message: '{VALUE}は有効な友達関係ステータスではありません'
      },
      default: 'pending',
      required: [true, 'ステータスは必須です']
    },
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'リクエスト送信者IDは必須です']
    },
    compatibilityScore: {
      type: Number,
      min: [0, '相性スコアは0%以上である必要があります'],
      max: [100, '相性スコアは100%以下である必要があります']
    },
    acceptedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// 複合ユニーク制約 (userId1とuserId2のペアは一意)
friendshipSchema.index({ userId1: 1, userId2: 1 }, { unique: true });

// 効率的な検索のためのインデックス
friendshipSchema.index({ userId1: 1, status: 1 });
friendshipSchema.index({ userId2: 1, status: 1 });
friendshipSchema.index({ requesterId: 1, status: 1 });

/**
 * 友達関係モデル
 */
export const Friendship = mongoose.model<IFriendshipDocument>('Friendship', friendshipSchema);