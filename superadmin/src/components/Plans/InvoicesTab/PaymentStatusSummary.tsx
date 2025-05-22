import React from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorIcon from '@mui/icons-material/Error';
import BlockIcon from '@mui/icons-material/Block';
import ReceiptIcon from '@mui/icons-material/Receipt';

/**
 * 支払い状態のProps
 */
interface PaymentStatusSummaryProps {
  stats: {
    total: number;
    paid: number;
    open: number;
    overdue: number;
    suspended: number;
  };
  onBatchCheck: () => void;
}

/**
 * 支払い状態サマリーコンポーネント
 * 請求書と支払い状態の全体像を表示します
 */
const PaymentStatusSummary: React.FC<PaymentStatusSummaryProps> = ({ stats, onBatchCheck }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">支払い状態サマリー</Typography>
        <Tooltip title="支払い状態を一括チェック">
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={onBatchCheck}
          >
            一括チェック
          </Button>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* 全体 */}
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              bgcolor: 'background.default'
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <ReceiptIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                請求書総数
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 支払い済み */}
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              bgcolor: 'success.light',
              '&:hover': { bgcolor: 'success.main', '& .MuiTypography-root': { color: 'white' } }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.dark', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="success.dark">
                {stats.paid}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                支払い済み
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 未払い */}
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              bgcolor: 'warning.light',
              '&:hover': { bgcolor: 'warning.main', '& .MuiTypography-root': { color: 'white' } }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <AccessTimeIcon sx={{ fontSize: 40, color: 'warning.dark', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="warning.dark">
                {stats.open}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                支払い待ち
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 期限切れ */}
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              bgcolor: 'error.light',
              '&:hover': { bgcolor: 'error.main', '& .MuiTypography-root': { color: 'white' } }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <ErrorIcon sx={{ fontSize: 40, color: 'error.dark', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="error.dark">
                {stats.overdue}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                支払い遅延
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* アクセス停止 */}
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              bgcolor: 'grey.200',
              '&:hover': { bgcolor: 'grey.300', '& .MuiTypography-root': { color: 'black' } }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <BlockIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.suspended}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                アクセス停止
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PaymentStatusSummary;