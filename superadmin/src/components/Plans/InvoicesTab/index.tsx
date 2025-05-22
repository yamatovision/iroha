import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Button,
  Snackbar
} from '@mui/material';
import PaymentStatusSummary from './PaymentStatusSummary';
import InvoiceTable from './InvoiceTable';
import InvoiceDetailModal from './InvoiceDetailModal';
import PaymentReminderModal from './PaymentReminderModal';
import AccessSuspendModal from './AccessSuspendModal';
import useAdminApi from '../../../hooks/useAdminApi';

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
}

/**
 * 請求管理タブコンポーネント
 */
const InvoicesTab: React.FC = () => {
  // 状態管理
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStats, setPaymentStats] = useState<{
    total: number;
    paid: number;
    open: number;
    overdue: number;
    suspended: number;
  }>({
    total: 0,
    paid: 0,
    open: 0,
    overdue: 0,
    suspended: 0
  });

  // モーダル状態
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [reminderModalOpen, setReminderModalOpen] = useState<boolean>(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState<boolean>(false);

  // 通知状態
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // APIフックの利用
  const { fetchData, postData } = useAdminApi();

  // 初期データ読み込み
  useEffect(() => {
    loadInvoices();
    loadPaymentStats();
  }, [page, pageSize]);

  /**
   * 請求書一覧を読み込む
   */
  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetchData(`/admin/invoices?page=${page + 1}&limit=${pageSize}`);
      setInvoices(response.data || []);
      setTotalCount(response.total || 0);
      setError(null);
    } catch (error) {
      console.error('請求書取得エラー:', error);
      setError('請求書の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 支払い状態のサマリーを読み込む
   */
  const loadPaymentStats = async () => {
    try {
      const response = await fetchData('/admin/payment/stats');
      setPaymentStats(response.data || {
        total: 0,
        paid: 0,
        open: 0,
        overdue: 0,
        suspended: 0
      });
    } catch (error) {
      console.error('支払い状態サマリー取得エラー:', error);
    }
  };

  /**
   * ページ変更ハンドラ
   */
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  /**
   * ページサイズ変更ハンドラ
   */
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0);
  };

  /**
   * 請求書の詳細を表示
   */
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailModalOpen(true);
  };

  /**
   * 支払い催促モーダルを開く
   */
  const handleOpenReminderModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setReminderModalOpen(true);
  };

  /**
   * アクセス停止モーダルを開く
   */
  const handleOpenSuspendModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSuspendModalOpen(true);
  };

  /**
   * 支払い催促メールを送信
   */
  const handleSendReminder = async (invoiceId: string, message: string) => {
    try {
      await postData(`/admin/invoices/${invoiceId}/remind`, { message });
      setReminderModalOpen(false);
      setSnackbar({
        open: true,
        message: '支払い催促メールが送信されました',
        severity: 'success'
      });
    } catch (error) {
      console.error('支払い催促メール送信エラー:', error);
      setSnackbar({
        open: true,
        message: '支払い催促メールの送信に失敗しました',
        severity: 'error'
      });
    }
  };

  /**
   * 組織のアクセスを停止
   */
  const handleSuspendAccess = async (organizationId: string, reason: string) => {
    try {
      await postData(`/admin/organizations/${organizationId}/suspend`, { reason });
      setSuspendModalOpen(false);
      await loadPaymentStats(); // 支払い状態サマリーを更新
      setSnackbar({
        open: true,
        message: '組織のアクセスが停止されました',
        severity: 'success'
      });
    } catch (error) {
      console.error('アクセス停止エラー:', error);
      setSnackbar({
        open: true,
        message: '組織のアクセス停止に失敗しました',
        severity: 'error'
      });
    }
  };

  /**
   * 一括支払い状態チェックを実行
   */
  const handleBatchCheck = async () => {
    try {
      setLoading(true);
      const response = await postData('/admin/payment/batch-check', {});
      setSnackbar({
        open: true,
        message: `支払い状態チェック完了: ${response.data.suspended} 件停止、${response.data.restored} 件復元されました`,
        severity: 'success'
      });
      await loadInvoices();
      await loadPaymentStats();
    } catch (error) {
      console.error('一括支払い状態チェックエラー:', error);
      setSnackbar({
        open: true,
        message: '支払い状態チェックに失敗しました',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * スナックバーを閉じる
   */
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 支払い状態サマリー */}
      <PaymentStatusSummary stats={paymentStats} onBatchCheck={handleBatchCheck} />

      {/* 請求書テーブル */}
      <Paper sx={{ mt: 3, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">請求書一覧</Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <InvoiceTable
            invoices={invoices}
            totalCount={totalCount}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onViewInvoice={handleViewInvoice}
            onSendReminder={handleOpenReminderModal}
            onSuspendAccess={handleOpenSuspendModal}
          />
        )}
      </Paper>

      {/* 請求書詳細モーダル */}
      <InvoiceDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        invoice={selectedInvoice}
      />

      {/* 支払い催促モーダル */}
      <PaymentReminderModal
        open={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        invoice={selectedInvoice}
        onSendReminder={handleSendReminder}
      />

      {/* アクセス停止モーダル */}
      <AccessSuspendModal
        open={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        invoice={selectedInvoice}
        onSuspendAccess={handleSuspendAccess}
      />

      {/* 通知用スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InvoicesTab;