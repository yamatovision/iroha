import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Slider,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SyncIcon from '@mui/icons-material/Sync';
import ApiUsageSummary from './ApiUsageSummary';
import UsageChart from './UsageChart';
import SimulationParams from './SimulationParams';
import SimulationResults from './SimulationResults';
import useAdminApi from '../../../hooks/useAdminApi';

/**
 * シミュレーションタブのメインコンポーネント
 */
const SimulationTab: React.FC = () => {
  // 状態管理
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiUsageData, setApiUsageData] = useState<any>(null);
  const [simulationParams, setSimulationParams] = useState({
    tokenPrice: 0.02,
    monthlySubscription: 9800,
    tokenAllocation: 1000,
    averageSessionSize: 5,
    exchangeRate: 150,
    targetProfitMargin: 40
  });
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // APIフック
  const { fetchData, postData } = useAdminApi();

  // 初期データ読み込み
  useEffect(() => {
    loadApiUsageData();
  }, []);

  /**
   * API使用量データを読み込む
   */
  const loadApiUsageData = async () => {
    setLoading(true);
    try {
      const response = await fetchData('/admin/analytics/api-usage');
      setApiUsageData(response.data || {
        totalTokens: 1500000,
        averageTokensPerOrganization: 15000,
        organizationCount: 100,
        tokenUsageByPlan: [
          { plan: 'Basic', tokens: 300000 },
          { plan: 'Standard', tokens: 500000 },
          { plan: 'Premium', tokens: 700000 }
        ],
        tokenUsageByMonth: [
          { month: '2025-01', tokens: 800000 },
          { month: '2025-02', tokens: 1000000 },
          { month: '2025-03', tokens: 1200000 },
          { month: '2025-04', tokens: 1500000 }
        ]
      });
      setError(null);
    } catch (error) {
      console.error('API使用量データ取得エラー:', error);
      setError('データの読み込みに失敗しました');
      // テスト用のダミーデータをセット
      setApiUsageData({
        totalTokens: 1500000,
        averageTokensPerOrganization: 15000,
        organizationCount: 100,
        tokenUsageByPlan: [
          { plan: 'Basic', tokens: 300000 },
          { plan: 'Standard', tokens: 500000 },
          { plan: 'Premium', tokens: 700000 }
        ],
        tokenUsageByMonth: [
          { month: '2025-01', tokens: 800000 },
          { month: '2025-02', tokens: 1000000 },
          { month: '2025-03', tokens: 1200000 },
          { month: '2025-04', tokens: 1500000 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * パラメータ変更ハンドラ
   */
  const handleParamChange = (param: string, value: number) => {
    setSimulationParams({
      ...simulationParams,
      [param]: value
    });
  };

  /**
   * シミュレーション実行ハンドラ
   */
  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const response = await postData('/admin/analytics/simulate', simulationParams);
      setSimulationResults(response.data || {
        recommendedTokenAllocation: 950,
        estimatedProfit: 392000,
        profitMargin: 42.3,
        costPerUser: 5670,
        monthlyRevenue: 980000,
        monthlyCost: 588000,
        breakdownByPlan: [
          { plan: 'Basic', profit: 98000, cost: 60000, revenue: 158000 },
          { plan: 'Standard', profit: 147000, cost: 196000, revenue: 343000 },
          { plan: 'Premium', profit: 147000, cost: 332000, revenue: 479000 }
        ]
      });
    } catch (error) {
      console.error('シミュレーションエラー:', error);
      setError('シミュレーションの実行に失敗しました');
      // テスト用のダミーデータをセット
      setSimulationResults({
        recommendedTokenAllocation: 950,
        estimatedProfit: 392000,
        profitMargin: 42.3,
        costPerUser: 5670,
        monthlyRevenue: 980000,
        monthlyCost: 588000,
        breakdownByPlan: [
          { plan: 'Basic', profit: 98000, cost: 60000, revenue: 158000 },
          { plan: 'Standard', profit: 147000, cost: 196000, revenue: 343000 },
          { plan: 'Premium', profit: 147000, cost: 332000, revenue: 479000 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* API使用量サマリー */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">API使用量サマリー</Typography>
          <Button
            startIcon={<SyncIcon />}
            onClick={loadApiUsageData}
            disabled={loading}
          >
            更新
          </Button>
        </Box>

        {loading && !apiUsageData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ApiUsageSummary data={apiUsageData} />
        )}
      </Paper>

      {/* シミュレーション */}
      <Grid container spacing={3}>
        {/* パラメータ設定 */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              シミュレーションパラメータ
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <SimulationParams
              params={simulationParams}
              onChange={handleParamChange}
            />
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={handleRunSimulation}
                disabled={loading}
                size="large"
              >
                シミュレーション実行
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* 結果表示 */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              シミュレーション結果
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              simulationResults ? (
                <SimulationResults results={simulationResults} />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography color="text.secondary">
                    パラメータを設定して「シミュレーション実行」をクリックしてください
                  </Typography>
                </Box>
              )
            )}
          </Paper>
        </Grid>

        {/* 使用量グラフ */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              API使用量トレンド
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {loading && !apiUsageData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <UsageChart data={apiUsageData?.tokenUsageByMonth || []} />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimulationTab;