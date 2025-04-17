import mongoose, { Document, Schema } from 'mongoose';

/**
 * ユーザー目標モデルのインターフェース
 */
export interface IUserGoal {
  userId: mongoose.Types.ObjectId;
  type: 'career' | 'team' | 'personal';
  content: string;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IUserGoalDocument extends IUserGoal, Document {}

/**
 * ユーザー目標スキーマ定義
 */
const userGoalSchema = new Schema<IUserGoalDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ユーザーIDは必須です']
    },
    type: {
      type: String,
      enum: {
        values: ['career', 'team', 'personal'],
        message: '{VALUE}は有効な目標タイプではありません'
      },
      required: [true, '目標タイプは必須です']
    },
    content: {
      type: String,
      required: [true, '目標内容は必須です'],
      trim: true,
      minlength: [5, '目標内容は5文字以上である必要があります'],
      maxlength: [500, '目標内容は500文字以下である必要があります']
    },
    deadline: {
      type: Date,
      required: [true, '目標期限は必須です']
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定
userGoalSchema.index({ userId: 1 });
userGoalSchema.index({ userId: 1, type: 1 });
userGoalSchema.index({ deadline: 1 });

/**
 * ユーザー目標モデル
 */
export const UserGoal = mongoose.model<IUserGoalDocument>('UserGoal', userGoalSchema);