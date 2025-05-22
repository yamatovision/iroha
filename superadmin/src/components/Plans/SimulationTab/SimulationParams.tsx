import React from 'react';
import {
  Box,
  Typography,
  Slider,
  TextField,
  InputAdornment,
  Grid,
  Tooltip,
  IconButton,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface SimulationParamsProps {
  params: {
    tokenPrice: number;
    monthlySubscription: number;
    tokenAllocation: number;
    averageSessionSize: number;
    exchangeRate: number;
    targetProfitMargin: number;
  };
  onChange: (param: string, value: number) => void;
}

/**
 * シミュレーションパラメータ調整コンポーネント
 */
const SimulationParams: React.FC<SimulationParamsProps> = ({ params, onChange }) => {
  // 数値入力ハンドラー - 文字列を数値に変換
  const handleNumberInputChange = (param: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onChange(param, numValue);
    }
  };

  // スライダーの入力ハンドラー
  const handleSliderChange = (param: string, value: number | number[]) => {
    onChange(param, value as number);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* トークン価格 */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              APIトークン単価 (USD)
            </Typography>
            <Tooltip title="1トークンあたりの料金（ドル）。Claude AI APIの場合は約0.02ドル">
              <IconButton size="small" sx={{ ml: 1 }}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            value={params.tokenPrice}
            onChange={(e) => handleNumberInputChange('tokenPrice', e.target.value)}
            type="number"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              inputProps: { min: 0.001, max: 0.1, step: 0.001 }
            }}
          />
          <Slider
            value={params.tokenPrice}
            onChange={(_, value) => handleSliderChange('tokenPrice', value)}
            min={0.001}
            max={0.1}
            step={0.001}
            marks={[
              { value: 0.001, label: '$0.001' },
              { value: 0.02, label: '$0.02' },
              { value: 0.05, label: '$0.05' },
              { value: 0.1, label: '$0.1' },
            ]}
            sx={{ mt: 2 }}
          />
        </Grid>

        {/* 月額サブスクリプション */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              月額サブスクリプション料金
            </Typography>
            <Tooltip title="組織ごとの月額料金（円）">
              <IconButton size="small" sx={{ ml: 1 }}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            value={params.monthlySubscription}
            onChange={(e) => handleNumberInputChange('monthlySubscription', e.target.value)}
            type="number"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">¥</InputAdornment>,
              inputProps: { min: 0, max: 100000, step: 100 }
            }}
          />
          <Slider
            value={params.monthlySubscription}
            onChange={(_, value) => handleSliderChange('monthlySubscription', value)}
            min={0}
            max={50000}
            step={1000}
            marks={[
              { value: 0, label: '¥0' },
              { value: 9800, label: '¥9,800' },
              { value: 29800, label: '¥29,800' },
              { value: 50000, label: '¥50,000' },
            ]}
            sx={{ mt: 2 }}
          />
        </Grid>

        {/* トークン配布量 */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              月間トークン配布量
            </Typography>
            <Tooltip title="1組織あたりの月間トークン配布量">
              <IconButton size="small" sx={{ ml: 1 }}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            value={params.tokenAllocation}
            onChange={(e) => handleNumberInputChange('tokenAllocation', e.target.value)}
            type="number"
            size="small"
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">tokens</InputAdornment>,
              inputProps: { min: 100, max: 10000, step: 50 }
            }}
          />
          <Slider
            value={params.tokenAllocation}
            onChange={(_, value) => handleSliderChange('tokenAllocation', value)}
            min={100}
            max={5000}
            step={100}
            marks={[
              { value: 100, label: '100' },
              { value: 1000, label: '1,000' },
              { value: 2500, label: '2,500' },
              { value: 5000, label: '5,000' },
            ]}
            sx={{ mt: 2 }}
          />
        </Grid>

        {/* 平均セッションサイズ */}
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            平均セッションサイズ
          </Typography>
          <TextField
            value={params.averageSessionSize}
            onChange={(e) => handleNumberInputChange('averageSessionSize', e.target.value)}
            type="number"
            size="small"
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">K tokens</InputAdornment>,
              inputProps: { min: 1, max: 50, step: 0.5 }
            }}
          />
        </Grid>

        {/* 為替レート */}
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            為替レート（円/ドル）
          </Typography>
          <TextField
            value={params.exchangeRate}
            onChange={(e) => handleNumberInputChange('exchangeRate', e.target.value)}
            type="number"
            size="small"
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">円/$</InputAdornment>,
              inputProps: { min: 100, max: 200, step: 1 }
            }}
          />
        </Grid>

        {/* 目標利益率 */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              目標利益率
            </Typography>
            <Tooltip title="売上に対する希望利益率（%）">
              <IconButton size="small" sx={{ ml: 1 }}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            value={params.targetProfitMargin}
            onChange={(e) => handleNumberInputChange('targetProfitMargin', e.target.value)}
            type="number"
            size="small"
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
              inputProps: { min: 0, max: 100, step: 1 }
            }}
          />
          <Slider
            value={params.targetProfitMargin}
            onChange={(_, value) => handleSliderChange('targetProfitMargin', value)}
            min={0}
            max={100}
            step={5}
            marks={[
              { value: 0, label: '0%' },
              { value: 30, label: '30%' },
              { value: 50, label: '50%' },
              { value: 100, label: '100%' },
            ]}
            sx={{ mt: 2 }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimulationParams;