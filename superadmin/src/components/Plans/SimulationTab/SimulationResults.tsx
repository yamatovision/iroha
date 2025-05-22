import React from 'react';
import {
  Box,
  Typography,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface SimulationResultsProps {
  results: {
    recommendedTokenAllocation: number;
    estimatedProfit: number;
    profitMargin: number;
    costPerUser: number;
    monthlyRevenue: number;
    monthlyCost: number;
    breakdownByPlan: Array<{
      plan: string;
      profit: number;
      cost: number;
      revenue: number;
    }>;
  };
}

// 数値のフォーマット
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};

// 割合のフォーマット
const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * シミュレーション結果表示コンポーネント
 */
const SimulationResults: React.FC<SimulationResultsProps> = ({ results }) => {
  // 利益率に基づく色の決定
  const getProfitColor = (profit: number): string => {
    if (profit >= 50) return '#4caf50';
    if (profit >= 30) return '#8bc34a';
    if (profit >= 20) return '#ffc107';
    if (profit >= 10) return '#ff9800';
    return '#f44336';
  };

  const profitColor = getProfitColor(results.profitMargin);

  return (
    <Box>
      {/* 主要指標 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 推奨トークン配布量 */}
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, backgroundColor: '#fff0f5', border: '1px solid #ffccd5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EmojiEventsIcon sx={{ color: '#FF6B98', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold" color="#FF6B98">
                推奨トークン配布量
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
              {results.recommendedTokenAllocation} トークン
            </Typography>
            <Typography variant="body2" color="text.secondary">
              推奨月間配布トークン数/組織
            </Typography>
          </Paper>
        </Grid>

        {/* 推定利益 */}
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              推定月間利益
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
              {formatCurrency(results.estimatedProfit)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Chip 
                label={formatPercent(results.profitMargin)}
                size="small"
                sx={{ 
                  bgcolor: profitColor, 
                  color: 'white', 
                  fontWeight: 'bold',
                  mr: 1
                }}
              />
              <Typography variant="body2" color="text.secondary">
                利益率
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* コスト内訳 */}
      <Typography variant="h6" gutterBottom>
        月間収支概要
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              月間売上
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatCurrency(results.monthlyRevenue)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              月間コスト
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="error.main">
              {formatCurrency(results.monthlyCost)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              ユーザーあたりコスト
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatCurrency(results.costPerUser)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 収益とコストの比率 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          収益率: {formatPercent(results.profitMargin)}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={results.profitMargin}
          sx={{ 
            height: 10, 
            borderRadius: 5,
            backgroundColor: '#ffccd5',
            '& .MuiLinearProgress-bar': {
              backgroundColor: profitColor,
            }
          }}
        />
      </Box>

      {/* プラン別内訳 */}
      <Typography variant="h6" gutterBottom>
        プラン別収支内訳
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>プラン</TableCell>
              <TableCell align="right">売上</TableCell>
              <TableCell align="right">コスト</TableCell>
              <TableCell align="right">利益</TableCell>
              <TableCell align="right">利益率</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.breakdownByPlan.map((row, index) => {
              const planProfitMargin = (row.profit / row.revenue) * 100;
              return (
                <TableRow key={index}>
                  <TableCell component="th" scope="row">
                    <Typography fontWeight="medium">{row.plan}</Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>
                    {formatCurrency(row.cost)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'success.main' }}>
                    {formatCurrency(row.profit)}
                  </TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={formatPercent(planProfitMargin)}
                      size="small"
                      sx={{ 
                        bgcolor: getProfitColor(planProfitMargin), 
                        color: 'white',
                        fontWeight: 'medium',
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SimulationResults;