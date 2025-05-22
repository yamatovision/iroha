import React from 'react';
import { Box, useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// チャートデータの型
interface ChartData {
  month: string;
  tokens: number;
}

interface UsageChartProps {
  data: ChartData[];
}

/**
 * 使用量チャートコンポーネント
 */
const UsageChart: React.FC<UsageChartProps> = ({ data }) => {
  const theme = useTheme();

  // データがない場合
  if (!data || data.length === 0) {
    return <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>データがありません</Box>;
  }

  // 月表示用のフォーマット
  const formatMonth = (month: string) => {
    try {
      const [year, monthNum] = month.split('-');
      return `${year.slice(2)}年${parseInt(monthNum)}月`;
    } catch (e) {
      return month;
    }
  };

  // トークン数フォーマット
  const formatTokens = (tokens: number) => {
    return new Intl.NumberFormat('ja-JP').format(tokens);
  };

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fill: theme.palette.text.secondary }}
          />
          <YAxis 
            tickFormatter={formatTokens}
            tick={{ fill: theme.palette.text.secondary }}
          />
          <Tooltip 
            formatter={(value: any) => [
              `${formatTokens(value)} トークン`,
              'API使用量'
            ]}
            labelFormatter={formatMonth}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="tokens"
            name="API使用量（トークン）"
            stroke="#FF6B98"
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default UsageChart;