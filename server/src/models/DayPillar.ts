import mongoose, { Document, Schema } from 'mongoose';

/**
 * 日柱モデルのインターフェース
 */
export interface IDayPillar {
  date: Date;
  heavenlyStem: string;
  earthlyBranch: string;
  hiddenStems: string[];
  energyDescription: string;
  createdAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IDayPillarDocument extends IDayPillar, Document {}

/**
 * 日柱スキーマ定義
 */
const dayPillarSchema = new Schema<IDayPillarDocument>(
  {
    date: {
      type: Date,
      required: [true, '日付は必須です'],
      unique: true,
      index: true
    },
    heavenlyStem: {
      type: String,
      required: [true, '天干は必須です'],
      trim: true
    },
    earthlyBranch: {
      type: String,
      required: [true, '地支は必須です'],
      trim: true
    },
    hiddenStems: {
      type: [String],
      default: []
    },
    energyDescription: {
      type: String,
      required: [true, 'エネルギーの説明は必須です']
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// createdAtのみを保持し、updatedAtは不要
dayPillarSchema.set('timestamps', { 
  createdAt: true,
  updatedAt: false
});

// インデックスの設定（複合インデックスのみ）
dayPillarSchema.index({ heavenlyStem: 1, earthlyBranch: 1 });

/**
 * 日柱モデル
 */
export const DayPillar = mongoose.model<IDayPillarDocument>('DayPillar', dayPillarSchema);