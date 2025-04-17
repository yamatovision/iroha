// エクスポート型定義
export * from './api.types';

// 通知タイプ
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

// 通知メッセージ
export interface NotificationMessage {
  type: NotificationType;
  message: string;
  duration?: number;
}