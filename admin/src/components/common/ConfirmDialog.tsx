import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: 'error' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 確認ダイアログコンポーネント
 * 危険な操作を行う前に確認を促すダイアログ
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = '確認',
  cancelLabel = 'キャンセル',
  severity = 'warning',
  onConfirm,
  onCancel
}) => {
  // 重要度に基づいてボタンの色を決定
  const getButtonColor = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        {typeof message === 'string' ? (
          <DialogContentText id="confirm-dialog-description">
            {message}
          </DialogContentText>
        ) : (
          <div id="confirm-dialog-description">
            {message}
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} color={getButtonColor()} autoFocus>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;