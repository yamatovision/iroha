import mongoose, { Document, Schema } from 'mongoose';

/**
 * チャットメッセージのインターフェース
 */
export interface IChatMessage {
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

/**
 * チャット履歴モデルのインターフェース
 */
export interface IChatHistory {
  userId: mongoose.Types.ObjectId;
  chatType: 'personal' | 'team_member' | 'team_goal';
  relatedInfo?: {
    teamMemberId?: mongoose.Types.ObjectId;
    teamGoalId?: mongoose.Types.ObjectId;
  };
  messages: IChatMessage[];
  tokenCount: number;
  contextData: Record<string, any>;
  aiModel: 'sonnet' | 'haiku';
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IChatHistoryDocument extends IChatHistory, Document {}

/**
 * チャットメッセージスキーマ定義
 */
const chatMessageSchema = new Schema<IChatMessage>(
  {
    sender: {
      type: String,
      enum: {
        values: ['user', 'ai'],
        message: '{VALUE}は有効な送信者ではありません'
      },
      required: [true, '送信者は必須です']
    },
    content: {
      type: String,
      required: [true, 'メッセージ内容は必須です']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false // サブドキュメントにIDを付与しない
  }
);

/**
 * チャット履歴スキーマ定義
 */
const chatHistorySchema = new Schema<IChatHistoryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ユーザーIDは必須です']
    },
    chatType: {
      type: String,
      enum: {
        values: ['personal', 'team_member', 'team_goal'],
        message: '{VALUE}は有効なチャットタイプではありません'
      },
      required: [true, 'チャットタイプは必須です']
    },
    relatedInfo: {
      teamMemberId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      teamGoalId: {
        type: Schema.Types.ObjectId,
        ref: 'TeamGoal'
      }
    },
    messages: {
      type: [chatMessageSchema],
      default: []
    },
    tokenCount: {
      type: Number,
      default: 0,
      min: [0, 'トークン数は0以上である必要があります']
    },
    contextData: {
      type: Schema.Types.Mixed,
      default: {}
    },
    aiModel: {
      type: String,
      enum: {
        values: ['sonnet', 'haiku'],
        message: '{VALUE}は有効なAIモデルではありません'
      },
      required: [true, 'AIモデルは必須です']
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// バリデーション - チャットタイプに応じた関連情報の検証
chatHistorySchema.pre('validate', function(next) {
  // チームメンバーチャットの検証
  if (this.chatType === 'team_member') {
    // relatedInfoが存在しないか、teamMemberIdがない場合
    if (!this.relatedInfo || !this.relatedInfo.teamMemberId) {
      return next(new Error('チームメンバーチャットにはチームメンバーIDが必要です'));
    }
  }
  
  // チーム目標チャットの検証
  if (this.chatType === 'team_goal') {
    // relatedInfoが存在しないか、teamGoalIdがない場合
    if (!this.relatedInfo || !this.relatedInfo.teamGoalId) {
      return next(new Error('チーム目標チャットにはチーム目標IDが必要です'));
    }
  }
  
  // バリデーション通過
  next();
});

// インデックスの設定
chatHistorySchema.index({ userId: 1 });
chatHistorySchema.index({ userId: 1, chatType: 1 });
chatHistorySchema.index({ lastMessageAt: -1 });
chatHistorySchema.index({ tokenCount: 1 });
chatHistorySchema.index({ 'relatedInfo.teamMemberId': 1 });
chatHistorySchema.index({ 'relatedInfo.teamGoalId': 1 });

/**
 * チャット履歴モデル
 */
export const ChatHistory = mongoose.model<IChatHistoryDocument>('ChatHistory', chatHistorySchema);