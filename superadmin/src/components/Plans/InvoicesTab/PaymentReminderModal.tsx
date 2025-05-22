import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Divider,
  Alert,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

/**
 * 請求書のインターフェース
 */
interface Invoice {
  id: string;
  organizationId: string;
  organizationName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

/**
 * 支払い催促モーダルのProps
 */
interface PaymentReminderModalProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSendReminder: (invoiceId: string, message: string) => void;
}

/**
 * 支払い催促モーダルコンポーネント
 */
const PaymentReminderModal: React.FC<PaymentReminderModalProps> = ({
  open,
  onClose,
  invoice,
  onSendReminder
}) => {
  // 催促メッセージの状態
  const [reminderMessage, setReminderMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 請求書が変更されたときにフォームをリセット
  useEffect(() => {
    if (open && invoice) {
      // 支払い遅延日数に応じたデフォルトメッセージを設定
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let defaultMessage = '';
      if (diffDays > 0) {
        defaultMessage = `${invoice.organizationName} 様\n\n請求書(${invoice.invoiceNumber})の支払期限が${diffDays}日過ぎております。お早めにお支払いをお願いいたします。\n\nご不明な点がございましたら、お気軽にお問い合わせください。`;
      } else {
        defaultMessage = `${invoice.organizationName} 様\n\n請求書(${invoice.invoiceNumber})の支払期限が近づいております。期限内のお支払いをお願いいたします。\n\nご不明な点がございましたら、お気軽にお問い合わせください。`;
      }
      
      setReminderMessage(defaultMessage);
      setError('');
    }
  }, [open, invoice]);

  /**
   * メッセージ変更ハンドラ
   */
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReminderMessage(e.target.value);
    if (error) setError('');
  };

  /**
   * 催促メール送信ハンドラ
   */
  const handleSendReminder = () => {
    if (!reminderMessage.trim()) {
      setError('メッセージを入力してください');
      return;
    }

    if (!invoice) {
      setError('請求書情報がありません');
      return;
    }

    // 親コンポーネントの送信ハンドラを呼び出す
    onSendReminder(invoice.id, reminderMessage);
  };

  /**
   * 支払期限からの経過日数を計算
   */
  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    
    // 時間を0:00:00に設定して日付のみで比較
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  /**
   * 金額をフォーマット
   */
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency || 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  /**
   * 日付をフォーマット
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (!invoice) return null;

  const daysOverdue = getDaysOverdue(invoice.dueDate);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">支払い催促メール送信</Typography>
          <IconButton aria-label="close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* 請求書情報 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            請求書情報
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                請求書番号
              </Typography>
              <Typography variant="body1">
                {invoice.invoiceNumber}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                組織
              </Typography>
              <Typography variant="body1">
                {invoice.organizationName}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                金額
              </Typography>
              <Typography variant="body1">
                {formatAmount(invoice.amount, invoice.currency)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                支払期限
              </Typography>
              <Typography 
                variant="body1" 
                color={daysOverdue > 0 ? 'error.main' : 'text.primary'}
                fontWeight={daysOverdue > 0 ? 'bold' : 'normal'}
              >
                {formatDate(invoice.dueDate)}
                {daysOverdue > 0 && ` (${daysOverdue}日超過)`}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 支払い催促メッセージ */}
        <Box>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            催促メッセージ
          </Typography>
          
          {daysOverdue > 14 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              支払い期限を14日以上超過しています。アクセス停止も検討してください。
            </Alert>
          )}
          
          <TextField
            label="催促メッセージ"
            value={reminderMessage}
            onChange={handleMessageChange}
            multiline
            rows={8}
            fullWidth
            required
            error={!!error}
            helperText={error}
            InputProps={{
              sx: { fontFamily: 'monospace' }
            }}
          />
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            このメッセージは組織の請求担当者に送信されます。
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          キャンセル
        </Button>
        <Button 
          onClick={handleSendReminder} 
          color="primary" 
          variant="contained"
          startIcon={<MailOutlineIcon />}
        >
          催促メールを送信
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentReminderModal;