import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import PlansTab from './PlansTab';
import InvoicesTab from './InvoicesTab';
import SimulationTab from './SimulationTab';

/**
 * タブパネルの基本コンポーネント
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-plans-tabpanel-${index}`}
      aria-labelledby={`admin-plans-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

/**
 * タブのaccessibility属性を生成
 */
function a11yProps(index: number) {
  return {
    id: `admin-plans-tab-${index}`,
    'aria-controls': `admin-plans-tabpanel-${index}`,
  };
}

/**
 * スーパー管理者用のプラン管理メインコンポーネント
 * プラン設定、請求管理、収益シミュレーションの各タブを管理します
 */
const SuperAdminPlansPage: React.FC = () => {
  // 現在選択されているタブの状態
  const [tabValue, setTabValue] = useState(0);

  // タブ変更ハンドラー
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          課金・プラン管理
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          プランの設定、請求書の管理、および収益シミュレーションを行います
        </Typography>
      </Paper>

      <Paper elevation={2}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="課金・プラン管理タブ"
            sx={{
              '& .MuiTab-root': {
                fontSize: '1rem',
                fontWeight: 500,
                py: 2,
              },
            }}
          >
            <Tab label="プラン設定" {...a11yProps(0)} />
            <Tab label="請求管理" {...a11yProps(1)} />
            <Tab label="収益シミュレーション" {...a11yProps(2)} />
          </Tabs>
        </Box>

        {/* プラン設定タブ */}
        <TabPanel value={tabValue} index={0}>
          <PlansTab />
        </TabPanel>

        {/* 請求管理タブ */}
        <TabPanel value={tabValue} index={1}>
          <InvoicesTab />
        </TabPanel>

        {/* 収益シミュレーションタブ */}
        <TabPanel value={tabValue} index={2}>
          <SimulationTab />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SuperAdminPlansPage;