import { IUser, ISystemSetting } from '@shared/index';

/**
 * ユーザー一覧レスポンス
 */
export interface UsersListResponse {
  users: IUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * 運勢更新設定レスポンス
 */
export interface FortuneUpdateSettingResponse extends ISystemSetting {}

/**
 * 運勢更新ログレスポンス
 */
export interface FortuneUpdateLog {
  _id: string;
  date: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  totalUsers: number;
  successCount: number;
  failedCount: number;
  isAutomaticRetry: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 日柱情報
 */
export interface DayPillar {
  _id: string;
  date: string;
  heavenlyStem: string;
  earthlyBranch: string;
  hiddenStems?: string[];
  energyDescription?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * バッチジョブログ
 */
export interface BatchJobLog {
  _id: string;
  jobType: string;
  status: 'scheduled' | 'running' | 'completed' | 'completed_with_errors' | 'failed';
  startTime: string;
  endTime?: string;
  params?: Record<string, any>;
  totalItems?: number;
  processedItems?: number;
  errorItems?: number;
  result?: any;
  scheduledBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 運勢更新ログ一覧レスポンス
 */
export interface FortuneUpdateLogsResponse {
  logs: FortuneUpdateLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * 運勢更新実行レスポンス
 */
export interface RunFortuneUpdateResponse {
  message: string;
  jobId: string;
  startTime: string;
  status: string;
}

/**
 * 日柱情報一覧レスポンス
 */
export interface DayPillarsResponse {
  dayPillars: DayPillar[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * 日柱生成ログ一覧レスポンス
 */
export interface DayPillarLogsResponse {
  logs: BatchJobLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * 日柱生成実行レスポンス
 */
export interface RunDayPillarGenerationResponse {
  message: string;
  jobId: string;
  startTime: string;
  status: string;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  message: string;
  errors?: any;
}