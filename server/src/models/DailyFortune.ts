import mongoose, { Document, Schema } from 'mongoose';

/**
 * デイリー運勢モデルのインターフェース
 */
export interface IDailyFortune {
  userId: mongoose.Types.ObjectId;  // MongoDB ObjectID
  date: Date;
  dayPillarId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId; // オプショナル - チームコンテキスト用
  teamGoalId?: mongoose.Types.ObjectId; // オプショナル - チーム目標参照用
  fortuneScore: number;
  advice: string;
  teamAdvice?: string; // チーム特化アドバイス（オプショナル）
  collaborationTips?: string[]; // チーム協力ヒント（オプショナル）
  luckyItems: {
    color: string;
    item: string;
    drink: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IDailyFortuneDocument extends IDailyFortune, Document {}

/**
 * デイリー運勢スキーマ定義
 */
const dailyFortuneSchema = new Schema<IDailyFortuneDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,  // ObjectID型
      ref: 'User',
      required: [true, 'ユーザーIDは必須です']
    },
    date: {
      type: Date,
      required: [true, '日付は必須です']
    },
    dayPillarId: {
      type: Schema.Types.ObjectId,
      ref: 'DayPillar',
      required: [true, '日柱IDは必須です']
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    teamGoalId: {
      type: Schema.Types.ObjectId,
      ref: 'TeamGoal'
    },
    fortuneScore: {
      type: Number,
      required: [true, '運勢スコアは必須です'],
      min: [0, '運勢スコアは0以上である必要があります'],
      max: [100, '運勢スコアは100以下である必要があります']
    },
    advice: {
      type: String,
      required: [true, 'アドバイスは必須です']
    },
    luckyItems: {
      color: {
        type: String,
        required: [true, 'ラッキーファッションは必須です'],
        trim: true
      },
      item: {
        type: String,
        required: [true, 'ラッキーフードは必須です'],
        trim: true
      },
      drink: {
        type: String,
        required: [true, 'ラッキードリンクは必須です'],
        trim: true
      }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定
dailyFortuneSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyFortuneSchema.index({ date: 1 });
dailyFortuneSchema.index({ fortuneScore: -1 });
// チーム関連の検索用インデックス
dailyFortuneSchema.index({ teamId: 1, date: 1 });
dailyFortuneSchema.index({ userId: 1, teamId: 1, date: 1 });

/**
 * デイリー運勢モデル
 */
export const DailyFortune = mongoose.model<IDailyFortuneDocument>('DailyFortune', dailyFortuneSchema);