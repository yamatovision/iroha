import mongoose, { Document, Schema } from 'mongoose';

/**
 * バッチ処理エラーのインターフェース
 */
export interface IBatchJobError {
  itemId?: mongoose.Types.ObjectId;
  message: string;
  stack?: string;
}

/**
 * バッチ処理ログモデルのインターフェース
 */
export interface IBatchJobLog {
  jobType: 'daily_fortune_update' | 'subscription_check' | 'backup' | 'day-pillar-generator';
  status: 'started' | 'running' | 'completed' | 'completed_with_errors' | 'failed';
  startTime: Date;
  endTime?: Date;
  totalItems: number;
  processedItems: number;
  errorItems: number;
  errorList: IBatchJobError[]; // errors -> errorList に名前変更
  details?: Record<string, any>;
  params?: Record<string, any>; // 追加パラメータ
  scheduledBy?: string; // スケジューラーによる実行かを示す
  result?: Record<string, any>; // 実行結果
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IBatchJobLogDocument extends IBatchJobLog, Document {}

/**
 * バッチ処理エラースキーマ定義
 */
const batchJobErrorSchema = new Schema<IBatchJobError>(
  {
    itemId: {
      type: Schema.Types.ObjectId
    },
    message: {
      type: String,
      required: [true, 'エラーメッセージは必須です']
    },
    stack: {
      type: String
    }
  },
  {
    _id: false // サブドキュメントにIDを付与しない
  }
);

/**
 * バッチ処理ログスキーマ定義
 */
const batchJobLogSchema = new Schema<IBatchJobLogDocument>(
  {
    jobType: {
      type: String,
      enum: {
        values: ['daily_fortune_update', 'subscription_check', 'backup', 'day-pillar-generator'],
        message: '{VALUE}は有効なジョブタイプではありません'
      },
      required: [true, 'ジョブタイプは必須です']
    },
    status: {
      type: String,
      enum: {
        values: ['started', 'running', 'completed', 'completed_with_errors', 'failed'],
        message: '{VALUE}は有効なステータスではありません'
      },
      required: [true, 'ステータスは必須です']
    },
    params: {
      type: Schema.Types.Mixed,
      default: {}
    },
    scheduledBy: {
      type: String
    },
    result: {
      type: Schema.Types.Mixed
    },
    startTime: {
      type: Date,
      required: [true, '開始時間は必須です'],
      default: Date.now
    },
    endTime: {
      type: Date
    },
    totalItems: {
      type: Number,
      required: [true, '合計アイテム数は必須です'],
      default: 0,
      min: [0, '合計アイテム数は0以上である必要があります']
    },
    processedItems: {
      type: Number,
      required: [true, '処理済みアイテム数は必須です'],
      default: 0,
      min: [0, '処理済みアイテム数は0以上である必要があります']
    },
    errorItems: {
      type: Number,
      required: [true, 'エラーアイテム数は必須です'],
      default: 0,
      min: [0, 'エラーアイテム数は0以上である必要があります']
    },
    errorList: {
      type: [batchJobErrorSchema],
      default: []
    },
    details: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定
batchJobLogSchema.index({ jobType: 1 });
batchJobLogSchema.index({ status: 1 });
batchJobLogSchema.index({ startTime: -1 });
batchJobLogSchema.index({ jobType: 1, startTime: -1 });

/**
 * バッチ処理ログモデル
 */
export const BatchJobLog = mongoose.model<IBatchJobLogDocument>('BatchJobLog', batchJobLogSchema);