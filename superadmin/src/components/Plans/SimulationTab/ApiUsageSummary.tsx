import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';

// APIデータの型
interface ApiUsageData {
  totalTokens: number;
  averageTokensPerOrganization: number;
  organizationCount: number;
  tokenUsageByPlan: Array<{ plan: string; tokens: number }>;
}

interface ApiUsageSummaryProps {
  data: ApiUsageData | null;
}

// スタイル付きカード
const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6],
  },
}));

// 数値のフォーマット
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ja-JP').format(num);
};

/**
 * API使用量サマリーコンポーネント
 */
const ApiUsageSummary: React.FC<ApiUsageSummaryProps> = ({ data }) => {
  if (!data) {
    return <Typography color="text.secondary">データがありません</Typography>;
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* 総トークン消費量 */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                総トークン消費量
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {formatNumber(data.totalTokens)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                現在までの総消費トークン数
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        {/* 組織あたり平均 */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                組織あたり平均
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {formatNumber(data.averageTokensPerOrganization)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                1組織あたりの月間平均トークン
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        {/* アクティブ組織数 */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                アクティブ組織数
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {formatNumber(data.organizationCount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                現在のアクティブ組織数
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        {/* 合計売上（予測） */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                合計売上（予測）
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                ¥{formatNumber(data.organizationCount * 9800)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                月間予測売上（標準プラン基準）
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* プラン別トークン使用量 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
        プラン別トークン使用量
      </Typography>
      <Grid container spacing={2}>
        {data.tokenUsageByPlan.map((item, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">{item.plan}プラン</Typography>
                <Typography variant="h6">{formatNumber(item.tokens)}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ApiUsageSummary;