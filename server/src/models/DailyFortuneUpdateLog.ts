import mongoose, { Document, Schema } from 'mongoose';

/**
 * 運勢更新エラー情報のインターフェース
 */
export interface IUpdateError {
  userId?: string | mongoose.Types.ObjectId; // FirebaseのUIDまたはMongoDB ObjectID
  message: string;
  stack?: string;
}

/**
 * 運勢更新ログのベースインターフェース
 */
export interface IDailyFortuneUpdateLogBase {
  date: Date;  // 更新実行日
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  totalUsers: number;  // 更新対象ユーザー数
  successCount: number;  // 成功数
  failedCount: number;  // 失敗数
  isAutomaticRetry: boolean;  // 自動リトライかどうか
  retryCount?: number;  // リトライ回数
  lastRetryAt?: Date;  // 最終リトライ日時
  createdBy: string | mongoose.Types.ObjectId;  // 作成者ID（Firebase UIDまたはMongoDB ObjectID）
  updateErrors?: IUpdateError[];  // エラー情報 (errors名を変更)
}

/**
 * 運勢更新ログモデルのインターフェース
 */
export interface IDailyFortuneUpdateLog extends IDailyFortuneUpdateLogBase {}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IDailyFortuneUpdateLogDocument extends IDailyFortuneUpdateLog, Document {
  createdAt: Date;
  updatedAt: Date;
  processingTimeMs: number | null;
  successRate: number;
  isRunning(): boolean;
  hasFailed(): boolean;
}

/**
 * 運勢更新ログスキーマ定義
 */
const dailyFortuneUpdateLogSchema = new Schema<IDailyFortuneUpdateLogDocument>(
  {
    date: {
      type: Date,
      required: [true, '更新実行日は必須です'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'running', 'completed', 'failed'],
        message: '{VALUE} は有効なステータスではありません'
      },
      required: [true, 'ステータスは必須です'],
      index: true
    },
    startTime: {
      type: Date,
      required: [true, '開始時間は必須です']
    },
    endTime: {
      type: Date
    },
    totalUsers: {
      type: Number,
      required: [true, '対象ユーザー数は必須です'],
      min: [0, '対象ユーザー数は0以上である必要があります']
    },
    successCount: {
      type: Number,
      required: [true, '成功数は必須です'],
      default: 0,
      min: [0, '成功数は0以上である必要があります']
    },
    failedCount: {
      type: Number,
      required: [true, '失敗数は必須です'],
      default: 0,
      min: [0, '失敗数は0以上である必要があります']
    },
    updateErrors: [
      {
        userId: {
          type: Schema.Types.Mixed, // FirebaseのUIDまたはMongoDB ObjectID
        },
        message: {
          type: String,
          required: [true, 'エラーメッセージは必須です']
        },
        stack: String
      }
    ],
    isAutomaticRetry: {
      type: Boolean,
      required: [true, '自動リトライフラグは必須です'],
      default: false
    },
    retryCount: {
      type: Number,
      default: 0,
      min: [0, 'リトライ回数は0以上である必要があります']
    },
    lastRetryAt: {
      type: Date
    },
    createdBy: {
      type: Schema.Types.Mixed, // FirebaseのUIDを直接格納できるように変更
      required: [true, '作成者は必須です']
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定
dailyFortuneUpdateLogSchema.index({ date: 1 });
dailyFortuneUpdateLogSchema.index({ status: 1 });
dailyFortuneUpdateLogSchema.index({ isAutomaticRetry: 1, status: 1 });

// 仮想フィールド: 処理時間（ミリ秒）
dailyFortuneUpdateLogSchema.virtual('processingTimeMs').get(function() {
  if (this.endTime && this.startTime) {
    return this.endTime.getTime() - this.startTime.getTime();
  }
  return null;
});

// 仮想フィールド: 成功率（パーセント）
dailyFortuneUpdateLogSchema.virtual('successRate').get(function() {
  if (this.totalUsers === 0) return 0;
  return (this.successCount / this.totalUsers) * 100;
});

/**
 * 実行中かどうかを判定するメソッド
 */
dailyFortuneUpdateLogSchema.methods.isRunning = function(): boolean {
  return this.status === 'scheduled' || this.status === 'running';
};

/**
 * 失敗したかどうかを判定するメソッド
 */
dailyFortuneUpdateLogSchema.methods.hasFailed = function(): boolean {
  return this.status === 'failed' || (this.status === 'completed' && this.failedCount > 0);
};

/**
 * 運勢更新ログモデル
 */
export const DailyFortuneUpdateLog = mongoose.model<IDailyFortuneUpdateLogDocument>(
  'DailyFortuneUpdateLog', 
  dailyFortuneUpdateLogSchema
);