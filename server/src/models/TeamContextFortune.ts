import mongoose, { Document } from 'mongoose';

export interface ITeamContextFortune {
  userId: mongoose.Types.ObjectId | string;
  teamId: mongoose.Types.ObjectId | string;
  date: Date;
  dayPillarId: mongoose.Types.ObjectId | string;
  teamGoalId?: mongoose.Types.ObjectId | string;
  score: number;
  teamContextAdvice: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeamContextFortuneDocument extends ITeamContextFortune, Document {}

const teamContextFortuneSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  dayPillarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DayPillar',
    required: true
  },
  teamGoalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamGoal'
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 70
  },
  teamContextAdvice: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 複合インデックスの追加（ユーザーID + チームID + 日付）
teamContextFortuneSchema.index({ userId: 1, teamId: 1, date: 1 }, { unique: true });

export const TeamContextFortune = mongoose.model<ITeamContextFortuneDocument>('TeamContextFortune', teamContextFortuneSchema);