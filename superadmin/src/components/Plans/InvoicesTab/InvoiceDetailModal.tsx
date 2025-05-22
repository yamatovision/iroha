import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import EventIcon from '@mui/icons-material/Event';
import PaymentIcon from '@mui/icons-material/Payment';
import BusinessIcon from '@mui/icons-material/Business';

/**
 * 請求書のステータス
 */
enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
  PAST_DUE = 'past_due'
}

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
  status: InvoiceStatus;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
}

/**
 * 請求書詳細モーダルのProps
 */
interface InvoiceDetailModalProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

/**
 * 請求書詳細モーダルコンポーネント
 */
const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ open, onClose, invoice }) => {
  /**
   * 請求書のステータスに応じたChipを返す
   */
  const getStatusChip = (status?: InvoiceStatus) => {
    if (!status) return null;
    
    switch (status) {
      case InvoiceStatus.PAID:
        return <Chip label="支払い済み" color="success" />;
      case InvoiceStatus.OPEN:
        return <Chip label="未払い" color="primary" />;
      case InvoiceStatus.PAST_DUE:
        return <Chip label="支払い遅延" color="error" />;
      case InvoiceStatus.DRAFT:
        return <Chip label="下書き" color="default" />;
      case InvoiceStatus.VOID:
        return <Chip label="無効" color="default" variant="outlined" />;
      case InvoiceStatus.UNCOLLECTIBLE:
        return <Chip label="回収不能" color="error" variant="outlined" />;
      default:
        return <Chip label={status} color="default" />;
    }
  };

  /**
   * 日付をフォーマット
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  /**
   * 金額をフォーマット
   */
  const formatAmount = (amount?: number, currency?: string) => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency || 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  /**
   * サンプル請求内容（実際はAPIから取得）
   */
  const sampleItems = [
    {
      description: '月額プラン - ビジネス',
      quantity: 1,
      unitPrice: invoice?.amount || 0,
      amount: invoice?.amount || 0
    }
  ];

  /**
   * PDFをダウンロード
   */
  const handleDownloadPdf = () => {
    // PDFダウンロードロジック
    console.log('Download PDF for invoice', invoice?.id);
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">請求書詳細: {invoice.invoiceNumber}</Typography>
          <IconButton aria-label="close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* 上部情報 */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                組織情報
              </Typography>
            </Box>
            <Typography variant="body1">{invoice.organizationName}</Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {invoice.organizationId}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PaymentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    請求情報
                  </Typography>
                </Box>
                <Typography variant="body2">
                  <strong>請求額:</strong> {formatAmount(invoice.amount, invoice.currency)}
                </Typography>
                <Typography variant="body2">
                  <strong>ステータス:</strong> {getStatusChip(invoice.status)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* 日付情報 */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                日付情報
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              請求日
            </Typography>
            <Typography variant="body1">
              {formatDate(invoice.createdAt)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              請求期間
            </Typography>
            <Typography variant="body1">
              {formatDate(invoice.billingPeriodStart)} 〜 {formatDate(invoice.billingPeriodEnd)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              支払期限
            </Typography>
            <Typography 
              variant="body1" 
              color={
                invoice.status === 'open' && new Date(invoice.dueDate) < new Date() 
                  ? 'error.main' 
                  : 'text.primary'
              }
              fontWeight={
                invoice.status === 'open' && new Date(invoice.dueDate) < new Date() 
                  ? 'bold' 
                  : 'normal'
              }
            >
              {formatDate(invoice.dueDate)}
            </Typography>
          </Grid>

          {/* 請求内容 */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              請求内容
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>項目</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>数量</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>単価</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>金額</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(invoice.items || sampleItems).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{formatAmount(item.unitPrice, invoice.currency)}</TableCell>
                      <TableCell align="right">{formatAmount(item.amount, invoice.currency)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                      合計:
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatAmount(invoice.amount, invoice.currency)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* メモ */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              メモ
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="body2" color="text.secondary">
                サブスクリプションの請求書です。
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Box>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPdf}
          >
            PDFをダウンロード
          </Button>
        </Box>
        <Box>
          <Button onClick={onClose} color="primary">
            閉じる
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceDetailModal;