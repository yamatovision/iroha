import mongoose, { Document, Schema } from 'mongoose';

/**
 * チーム目標モデルのインターフェース
 */
export interface ITeamGoal {
  teamId: mongoose.Types.ObjectId;
  content: string;
  deadline?: Date;
  status?: 'not_started' | 'in_progress' | 'at_risk' | 'completed';
  progress?: number;
  collaborators?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface ITeamGoalDocument extends ITeamGoal, Document {}

/**
 * チーム目標スキーマ定義
 */
const teamGoalSchema = new Schema<ITeamGoalDocument>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'チームIDは必須です']
    },
    content: {
      type: String,
      required: [true, '目標内容は必須です'],
      trim: true,
      minlength: [5, '目標内容は5文字以上である必要があります'],
      maxlength: [500, '目標内容は500文字以下である必要があります']
    },
    deadline: {
      type: Date
    },
    status: {
      type: String,
      enum: {
        values: ['not_started', 'in_progress', 'at_risk', 'completed'],
        message: '{VALUE}は有効な目標状態ではありません'
      },
      default: 'not_started'
    },
    progress: {
      type: Number,
      min: [0, '進捗は0%以上である必要があります'],
      max: [100, '進捗は100%以下である必要があります'],
      default: 0
    },
    collaborators: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定
teamGoalSchema.index({ teamId: 1 });
teamGoalSchema.index({ deadline: 1 });
teamGoalSchema.index({ status: 1 });

/**
 * チーム目標モデル
 */
export const TeamGoal = mongoose.model<ITeamGoalDocument>('TeamGoal', teamGoalSchema);