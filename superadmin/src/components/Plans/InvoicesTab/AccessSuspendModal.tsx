import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BlockIcon from '@mui/icons-material/Block';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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
 * アクセス停止モーダルのProps
 */
interface AccessSuspendModalProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuspendAccess: (organizationId: string, reason: string) => void;
}

/**
 * アクセス停止モーダルコンポーネント
 */
const AccessSuspendModal: React.FC<AccessSuspendModalProps> = ({
  open,
  onClose,
  invoice,
  onSuspendAccess
}) => {
  // 停止理由タイプの状態
  const [reasonType, setReasonType] = useState<string>('payment');
  // カスタム理由の状態
  const [customReason, setCustomReason] = useState<string>('');
  // エラーの状態
  const [error, setError] = useState<string>('');

  /**
   * 停止理由タイプの変更ハンドラ
   */
  const handleReasonTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReasonType(event.target.value);
    if (error) setError('');
  };

  /**
   * カスタム理由の変更ハンドラ
   */
  const handleCustomReasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomReason(event.target.value);
    if (error) setError('');
  };

  /**
   * アクセス停止実行ハンドラ
   */
  const handleSuspendAccess = () => {
    if (!invoice) {
      setError('請求書情報がありません');
      return;
    }

    let reason = '';
    
    switch (reasonType) {
      case 'payment':
        reason = `支払い遅延: 請求書 ${invoice.invoiceNumber} の支払いが行われていないため`;
        break;
      case 'violation':
        reason = '利用規約違反';
        break;
      case 'custom':
        if (!customReason.trim()) {
          setError('停止理由を入力してください');
          return;
        }
        reason = customReason.trim();
        break;
      default:
        reason = '管理者による一時停止';
    }

    // 親コンポーネントの停止ハンドラを呼び出す
    onSuspendAccess(invoice.organizationId, reason);
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningAmberIcon color="error" sx={{ mr: 1 }} />
            <Typography variant="h6">組織のアクセスを停止</Typography>
          </Box>
          <IconButton aria-label="close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 3 }}>
          この操作により「{invoice.organizationName}」のサービスへのアクセスが停止されます。
          この組織のメンバーはログインできなくなりますのでご注意ください。
        </Alert>

        {/* 組織情報 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            組織情報
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                組織名
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {invoice.organizationName}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                組織ID
              </Typography>
              <Typography variant="body1">
                {invoice.organizationId}
              </Typography>
            </Box>
          </Box>
        </Box>

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
                color="error.main"
                fontWeight="bold"
              >
                {formatDate(invoice.dueDate)}
                {daysOverdue > 0 && ` (${daysOverdue}日超過)`}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 停止理由 */}
        <Box>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            停止理由
          </Typography>
          
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup
              aria-label="停止理由"
              name="reason-type"
              value={reasonType}
              onChange={handleReasonTypeChange}
            >
              <FormControlLabel 
                value="payment" 
                control={<Radio />} 
                label={`支払い遅延: 請求書 ${invoice.invoiceNumber} の支払いが行われていないため`} 
              />
              <FormControlLabel 
                value="violation" 
                control={<Radio />} 
                label="利用規約違反" 
              />
              <FormControlLabel 
                value="custom" 
                control={<Radio />} 
                label="その他の理由" 
              />
            </RadioGroup>
          </FormControl>
          
          {reasonType === 'custom' && (
            <TextField
              label="停止理由"
              value={customReason}
              onChange={handleCustomReasonChange}
              multiline
              rows={3}
              fullWidth
              required
              error={!!error && reasonType === 'custom'}
              helperText={error && reasonType === 'custom' ? error : ''}
              sx={{ mt: 2 }}
            />
          )}
          
          {!!error && reasonType !== 'custom' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            アクセス停止後、組織の管理者に通知メールが送信されます。
            支払いが完了した場合は、管理画面からアクセスを復元することができます。
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          キャンセル
        </Button>
        <Button 
          onClick={handleSuspendAccess} 
          color="error" 
          variant="contained"
          startIcon={<BlockIcon />}
        >
          アクセスを停止
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccessSuspendModal;