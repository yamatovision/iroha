import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Snackbar, 
  Alert, 
  AlertColor,
  SnackbarCloseReason
} from '@mui/material';
import { NotificationType, NotificationMessage } from '../types';

// 通知コンテキストの型
interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, duration?: number) => void;
  hideNotification: () => void;
}

// コンテキスト作成
const NotificationContext = createContext<NotificationContextType | null>(null);

// プロバイダーの型
interface NotificationProviderProps {
  children: ReactNode;
}

// 通知プロバイダーコンポーネント
export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationMessage>({
    type: NotificationType.INFO,
    message: '',
    duration: 5000
  });

  // 通知を表示
  const showNotification = (
    type: NotificationType,
    message: string,
    duration: number = 5000
  ) => {
    setNotification({ type, message, duration });
    setOpen(true);
  };

  // 通知を非表示
  const hideNotification = () => {
    setOpen(false);
  };

  // 閉じるイベントハンドラ
  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    hideNotification();
  };

  // アラートの色を取得
  const getSeverity = (type: NotificationType): AlertColor => {
    switch (type) {
      case NotificationType.SUCCESS:
        return 'success';
      case NotificationType.ERROR:
        return 'error';
      case NotificationType.WARNING:
        return 'warning';
      case NotificationType.INFO:
      default:
        return 'info';
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={notification.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={getSeverity(notification.type)}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

// 通知フックを作成
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};