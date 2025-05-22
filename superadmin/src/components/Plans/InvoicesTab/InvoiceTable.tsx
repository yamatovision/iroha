import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MailIcon from '@mui/icons-material/Mail';
import BlockIcon from '@mui/icons-material/Block';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

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
 * 請求書テーブルのProps
 */
interface InvoiceTableProps {
  invoices: Invoice[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewInvoice: (invoice: Invoice) => void;
  onSendReminder: (invoice: Invoice) => void;
  onSuspendAccess: (invoice: Invoice) => void;
}

/**
 * 請求書テーブルコンポーネント
 */
const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onViewInvoice,
  onSendReminder,
  onSuspendAccess
}) => {
  /**
   * ページ変更ハンドラ
   */
  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  /**
   * ページサイズ変更ハンドラ
   */
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPageSizeChange(parseInt(event.target.value, 10));
  };

  /**
   * 請求書のステータスに応じたChipを返す
   */
  const getStatusChip = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return <Chip label="支払い済み" color="success" size="small" />;
      case InvoiceStatus.OPEN:
        return <Chip label="未払い" color="primary" size="small" />;
      case InvoiceStatus.PAST_DUE:
        return <Chip label="支払い遅延" color="error" size="small" />;
      case InvoiceStatus.DRAFT:
        return <Chip label="下書き" color="default" size="small" />;
      case InvoiceStatus.VOID:
        return <Chip label="無効" color="default" size="small" variant="outlined" />;
      case InvoiceStatus.UNCOLLECTIBLE:
        return <Chip label="回収不能" color="error" size="small" variant="outlined" />;
      default:
        return <Chip label={status} color="default" size="small" />;
    }
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
   * 支払い期限が過ぎているか
   */
  const isPastDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return due < now;
  };

  return (
    <Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>請求書番号</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>組織</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>金額</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>請求日</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>支払期限</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>ステータス</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  請求書がありません
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    bgcolor:
                      invoice.status === 'past_due' || 
                      (invoice.status === 'open' && isPastDue(invoice.dueDate))
                        ? 'error.light'
                        : 'inherit'
                  }}
                >
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.organizationName}</TableCell>
                  <TableCell>{formatAmount(invoice.amount, invoice.currency)}</TableCell>
                  <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>{getStatusChip(invoice.status)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      {/* 詳細ボタン */}
                      <Tooltip title="詳細を表示">
                        <IconButton
                          size="small"
                          onClick={() => onViewInvoice(invoice)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* 支払い催促ボタン（未払いまたは支払い遅延のみ） */}
                      {(invoice.status === 'open' || invoice.status === 'past_due') && (
                        <Tooltip title="支払い催促">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onSendReminder(invoice)}
                          >
                            <MailIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* アクセス停止ボタン（支払い遅延のみ） */}
                      {(invoice.status === 'past_due' || 
                        (invoice.status === 'open' && isPastDue(invoice.dueDate))) && (
                        <Tooltip title="アクセス停止">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onSuspendAccess(invoice)}
                          >
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* PDF表示ボタン */}
                      <Tooltip title="PDFを表示">
                        <IconButton
                          size="small"
                        >
                          <PictureAsPdfIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="表示件数:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} / ${count !== -1 ? count : `${to}以上`}`
        }
      />
    </Box>
  );
};

export default InvoiceTable;