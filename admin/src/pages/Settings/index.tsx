import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Card, 
  CardContent, 
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Pagination,
  Chip
} from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';
import { useNotification } from '../../contexts/NotificationContext';
import AdminService from '../../services/admin.service';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { FortuneUpdateLog, NotificationType } from '../../types';
import { ADMIN } from '@shared/index';

// タブパネルのプロパティ型
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// タブパネルコンポーネント
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // 管理者タブ用のステート
  // const [adminEmail, setAdminEmail] = useState('');
  // const [adminUsers, setAdminUsers] = useState<any[]>([]);
  // const [adminLoading, setAdminLoading] = useState(false);
  // const [adminPage, setAdminPage] = useState(1);
  // const [adminTotalPages, setAdminTotalPages] = useState(1);
  
  // 設定タブ用のステート
  const [updateTime, setUpdateTime] = useState('03:00');
  const [updateTimeLoading, setUpdateTimeLoading] = useState(false);
  const [apiLimit, setApiLimit] = useState('10000');
  const [apiLimitLoading, setApiLimitLoading] = useState(false);
  
  // 運勢更新ログ用のステート
  const [fortuneLogs, setFortuneLogs] = useState<FortuneUpdateLog[]>([]);
  const [fortuneLogsLoading, setFortuneLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsFilter, setLogsFilter] = useState('all');
  
  // 手動更新用のステート
  const [manualUpdateOpen, setManualUpdateOpen] = useState(false);
  const [manualUpdateLoading, setManualUpdateLoading] = useState(false);
  const [manualUpdateDate, setManualUpdateDate] = useState<string>('');
  
  // 日柱管理用のステート
  const [dayPillars, setDayPillars] = useState<any[]>([]);
  const [dayPillarsLoading, setDayPillarsLoading] = useState(false);
  const [dayPillarsPage, setDayPillarsPage] = useState(1);
  const [dayPillarsTotalPages, setDayPillarsTotalPages] = useState(1);
  
  // 日柱生成ログ用のステート
  const [dayPillarLogs, setDayPillarLogs] = useState<any[]>([]);
  const [dayPillarLogsLoading, setDayPillarLogsLoading] = useState(false);
  const [dayPillarLogsPage, setDayPillarLogsPage] = useState(1);
  const [dayPillarLogsTotalPages, setDayPillarLogsTotalPages] = useState(1);
  const [dayPillarLogsFilter, setDayPillarLogsFilter] = useState('all');
  
  // 手動日柱生成用のステート
  const [dayPillarGenerationOpen, setDayPillarGenerationOpen] = useState(false);
  const [dayPillarGenerationLoading, setDayPillarGenerationLoading] = useState(false);
  const [dayPillarGenerationDays, setDayPillarGenerationDays] = useState<number>(30);
  
  // 統計タブ用のステート
  const [dateRange, setDateRange] = useState('30');
  
  // 認証とコンテキスト
  const { showNotification } = useNotification();
  
  // 初期データの読み込み
  useEffect(() => {
    loadFortuneUpdateSetting();
    loadAdminUsers();
    loadFortuneLogs();
    loadDayPillars();
    loadDayPillarLogs();
  }, []);

  // タブ変更ハンドラー
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 管理者検索ハンドラー
  // const handleAdminSearch = () => {
  //   loadAdminUsers({ search: adminEmail });
  // };

  // 管理者一覧の読み込み
  const loadAdminUsers = async (_params: { page?: number, search?: string } = {}) => {
    // 管理者一覧の読み込み機能は将来の実装のために準備
    // 現在は使用されていません
  };

  // 管理者ページネーション変更ハンドラー
  // const handleAdminPageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
  //   setAdminPage(value);
  //   loadAdminUsers({ page: value });
  // };

  // 運勢更新設定の読み込み
  const loadFortuneUpdateSetting = async () => {
    try {
      setUpdateTimeLoading(true);
      
      // 実際のAPIリクエスト
      const response = await AdminService.getFortuneUpdateSettings();
      
      if (response.data && response.data.value) {
        setUpdateTime(response.data.value);
      }
    } catch (error) {
      console.error('運勢更新設定の取得に失敗しました:', error);
      showNotification(NotificationType.ERROR, '運勢更新設定の取得に失敗しました');
    } finally {
      setUpdateTimeLoading(false);
    }
  };

  // 運勢更新設定の更新ハンドラー
  const handleUpdateSetting = async (settingType: string) => {
    try {
      if (settingType === 'time') {
        setUpdateTimeLoading(true);
        
        // 時間フォーマットの検証
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(updateTime)) {
          showNotification(NotificationType.ERROR, '時間は「HH:MM」形式で指定してください（例: 03:00）');
          return;
        }
        
        // 実際のAPIリクエスト
        await AdminService.updateFortuneUpdateSettings(updateTime, '毎日の運勢更新実行時間');
        showNotification(NotificationType.SUCCESS, '運勢更新時間を更新しました');
      } else if (settingType === 'apiLimit') {
        setApiLimitLoading(true);
        
        // APIリクエストをシミュレート（実際のバックエンドAPIはまだ未実装）
        // TODO: 実際のバックエンドAPIが実装されたら、こちらを更新
        setTimeout(() => {
          showNotification(NotificationType.SUCCESS, 'API利用量上限を更新しました');
          setApiLimitLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error('設定の更新に失敗しました:', error);
      showNotification(NotificationType.ERROR, '設定の更新に失敗しました');
    } finally {
      if (settingType === 'time') {
        setUpdateTimeLoading(false);
      }
    }
  };

  // 運勢更新ログの読み込み
  const loadFortuneLogs = async (params: { page?: number, status?: string } = {}) => {
    try {
      setFortuneLogsLoading(true);
      
      // フィルター条件
      const status = params.status || (logsFilter !== 'all' ? logsFilter : undefined);
      
      // 実際のAPIリクエスト
      const response = await AdminService.getFortuneUpdateLogs({
        page: params.page || logsPage,
        limit: 5,
        status
      });
      
      if (response.data && response.data.logs) {
        setFortuneLogs(response.data.logs);
        setLogsTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('運勢更新ログの取得に失敗しました:', error);
      showNotification(NotificationType.ERROR, '運勢更新ログの取得に失敗しました');
    } finally {
      setFortuneLogsLoading(false);
    }
  };

  // 運勢更新ログのフィルター変更ハンドラー
  const handleLogsFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    setLogsFilter(value);
    setLogsPage(1);
    loadFortuneLogs({ page: 1, status: value !== 'all' ? value : undefined });
  };

  // 運勢更新ログのページネーション変更ハンドラー
  const handleLogsPageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setLogsPage(value);
    loadFortuneLogs({ page: value });
  };

  // 手動運勢更新ダイアログを開く
  const openManualUpdateDialog = () => {
    // 日本のローカル時間で今日の日付を取得（YYYY-MM-DD形式）
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    setManualUpdateDate(today);
    setManualUpdateOpen(true);
  };

  // 手動運勢更新を実行
  const handleRunManualUpdate = async () => {
    try {
      setManualUpdateLoading(true);
      
      // 日付の検証
      if (!manualUpdateDate) {
        showNotification(NotificationType.ERROR, '日付を指定してください');
        return;
      }
      
      // 実際のAPIリクエスト
      await AdminService.runFortuneUpdate({
        targetDate: new Date(manualUpdateDate)
      });
      
      setManualUpdateOpen(false);
      showNotification(NotificationType.SUCCESS, '運勢更新ジョブを開始しました');
      
      // ログ一覧を更新
      setTimeout(() => {
        loadFortuneLogs();
      }, 1000);
    } catch (error) {
      console.error('運勢更新の実行に失敗しました:', error);
      showNotification(NotificationType.ERROR, '運勢更新の実行に失敗しました');
    } finally {
      setManualUpdateLoading(false);
    }
  };

  // メンテナンス機能ハンドラー
  const handleMaintenance = (action: string) => {
    // TODO: 実際のメンテナンスロジックを実装
    showNotification(NotificationType.INFO, `${action}処理を開始しました`);
  };
  
  // 日柱情報一覧を取得
  const loadDayPillars = async (params: { page?: number, startDate?: string, endDate?: string } = {}) => {
    try {
      setDayPillarsLoading(true);
      
      // 実際のAPIリクエスト
      const response = await AdminService.getDayPillars({
        page: params.page || dayPillarsPage,
        limit: 10,
        startDate: params.startDate,
        endDate: params.endDate
      });
      
      if (response.data && response.data.dayPillars) {
        setDayPillars(response.data.dayPillars);
        setDayPillarsTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('日柱情報一覧の取得に失敗しました:', error);
      showNotification(NotificationType.ERROR, '日柱情報一覧の取得に失敗しました');
    } finally {
      setDayPillarsLoading(false);
    }
  };
  
  // 日柱情報ページネーション変更ハンドラー
  const handleDayPillarsPageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setDayPillarsPage(value);
    loadDayPillars({ page: value });
  };
  
  // 日柱生成ログ一覧を取得
  const loadDayPillarLogs = async (params: { page?: number, status?: string } = {}) => {
    try {
      setDayPillarLogsLoading(true);
      
      // フィルター条件
      const status = params.status || (dayPillarLogsFilter !== 'all' ? dayPillarLogsFilter : undefined);
      
      // 実際のAPIリクエスト
      const response = await AdminService.getDayPillarLogs({
        page: params.page || dayPillarLogsPage,
        limit: 5,
        status
      });
      
      if (response.data && response.data.logs) {
        setDayPillarLogs(response.data.logs);
        setDayPillarLogsTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('日柱生成ログの取得に失敗しました:', error);
      showNotification(NotificationType.ERROR, '日柱生成ログの取得に失敗しました');
    } finally {
      setDayPillarLogsLoading(false);
    }
  };
  
  // 日柱生成ログのフィルター変更ハンドラー
  const handleDayPillarLogsFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    setDayPillarLogsFilter(value);
    setDayPillarLogsPage(1);
    loadDayPillarLogs({ page: 1, status: value !== 'all' ? value : undefined });
  };
  
  // 日柱生成ログのページネーション変更ハンドラー
  const handleDayPillarLogsPageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setDayPillarLogsPage(value);
    loadDayPillarLogs({ page: value });
  };
  
  // 手動日柱生成ダイアログを開く
  const openDayPillarGenerationDialog = () => {
    setDayPillarGenerationDays(30);
    setDayPillarGenerationOpen(true);
  };
  
  // 手動日柱生成を実行
  const handleRunDayPillarGeneration = async () => {
    try {
      setDayPillarGenerationLoading(true);
      
      // 日数の検証
      if (dayPillarGenerationDays <= 0 || dayPillarGenerationDays > 365) {
        showNotification(NotificationType.ERROR, '生成日数は1～365の間で指定してください');
        return;
      }
      
      // APIエンドポイントとURLをコンソールに出力（デバッグ用）
      console.log('日柱生成APIエンドポイント:', ADMIN.RUN_DAY_PILLAR_GENERATION);
      
      try {
        // 実際のAPIリクエスト
        const response = await AdminService.runDayPillarGeneration(dayPillarGenerationDays);
        console.log('日柱生成API成功レスポンス:', response.data);
        
        setDayPillarGenerationOpen(false);
        showNotification(NotificationType.SUCCESS, '日柱生成ジョブを開始しました');
        
        // ログ一覧を更新
        setTimeout(() => {
          loadDayPillarLogs();
        }, 1000);
      } catch (apiError: any) {
        console.error('API呼び出しエラー:', apiError);
        console.error('エラーレスポンス:', apiError.response?.data);
        
        // より詳細なエラーメッセージを表示
        const errorMessage = apiError.response?.data?.message || '日柱生成の実行に失敗しました';
        showNotification(NotificationType.ERROR, errorMessage);
      }
    } catch (error) {
      console.error('日柱生成の実行中に例外が発生しました:', error);
      showNotification(NotificationType.ERROR, '日柱生成の実行に失敗しました');
    } finally {
      setDayPillarGenerationLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        システム管理
      </Typography>

      {/* タブ */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="システム設定" />
          <Tab label="利用統計" />
        </Tabs>
      </Box>
      
      {/* 手動運勢更新確認ダイアログ */}
      <ConfirmDialog
        open={manualUpdateOpen}
        title="運勢の手動更新"
        message={
          <Box>
            <Typography gutterBottom>
              指定日付の運勢データを手動で更新します。
            </Typography>
            <TextField
              fullWidth
              label="対象日付"
              type="date"
              value={manualUpdateDate}
              onChange={(e) => setManualUpdateDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              margin="normal"
              disabled={manualUpdateLoading}
            />
            {manualUpdateLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <LoadingIndicator message="処理中..." />
              </Box>
            )}
          </Box>
        }
        confirmLabel="実行"
        cancelLabel="キャンセル"
        severity="warning"
        onConfirm={handleRunManualUpdate}
        onCancel={() => setManualUpdateOpen(false)}
      />
      
      {/* 手動日柱生成確認ダイアログ */}
      <ConfirmDialog
        open={dayPillarGenerationOpen}
        title="日柱情報の手動生成"
        message={
          <Box>
            <Typography gutterBottom>
              未来の日付の日柱情報を手動で生成します。
            </Typography>
            <TextField
              fullWidth
              label="生成日数"
              type="number"
              value={dayPillarGenerationDays}
              onChange={(e) => setDayPillarGenerationDays(parseInt(e.target.value, 10))}
              InputLabelProps={{ shrink: true }}
              margin="normal"
              disabled={dayPillarGenerationLoading}
              inputProps={{ min: 1, max: 365 }}
              helperText="生成する未来の日数（1～365日）"
            />
            {dayPillarGenerationLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <LoadingIndicator message="処理中..." />
              </Box>
            )}
          </Box>
        }
        confirmLabel="実行"
        cancelLabel="キャンセル"
        severity="warning"
        onConfirm={handleRunDayPillarGeneration}
        onCancel={() => setDayPillarGenerationOpen(false)}
      />

      {/* システム設定タブ */}
      <TabPanel value={tabValue} index={0}>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              運勢更新設定
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8} md={6} lg={4}>
                <TextField
                  fullWidth
                  label="更新時間（毎日）"
                  type="time"
                  value={updateTime}
                  onChange={(e) => setUpdateTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={updateTimeLoading}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <Button 
                  variant="contained" 
                  onClick={() => handleUpdateSetting('time')}
                  fullWidth
                  disabled={updateTimeLoading}
                >
                  {updateTimeLoading ? '更新中...' : '更新'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              AI設定
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8} md={6} lg={4}>
                <TextField
                  fullWidth
                  label="API利用量上限（リクエスト/月）"
                  type="number"
                  value={apiLimit}
                  onChange={(e) => setApiLimit(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={apiLimitLoading}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <Button 
                  variant="contained" 
                  onClick={() => handleUpdateSetting('apiLimit')}
                  fullWidth
                  disabled={apiLimitLoading}
                >
                  {apiLimitLoading ? '保存中...' : '保存'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="primary">
                運勢更新ログ
              </Typography>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="logs-filter-label">ステータス</InputLabel>
                <Select
                  labelId="logs-filter-label"
                  value={logsFilter}
                  onChange={(e: any) => handleLogsFilterChange(e)}
                  label="ステータス"
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="scheduled">予定</MenuItem>
                  <MenuItem value="running">実行中</MenuItem>
                  <MenuItem value="completed">完了</MenuItem>
                  <MenuItem value="failed">失敗</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {fortuneLogsLoading ? (
              <LoadingIndicator />
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>日付</TableCell>
                        <TableCell>ステータス</TableCell>
                        <TableCell>開始時間</TableCell>
                        <TableCell>ユーザー数</TableCell>
                        <TableCell>成功/失敗</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fortuneLogs.length > 0 ? (
                        fortuneLogs.map((log) => (
                          <TableRow key={log._id}>
                            <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {log.status === 'completed' && <Chip key={`completed-${log._id}`} size="small" label="完了" color="success" />}
                              {log.status === 'scheduled' && <Chip key={`scheduled-${log._id}`} size="small" label="予定" color="info" />}
                              {log.status === 'running' && <Chip key={`running-${log._id}`} size="small" label="実行中" color="warning" />}
                              {log.status === 'failed' && <Chip key={`failed-${log._id}`} size="small" label="失敗" color="error" />}
                            </TableCell>
                            <TableCell>{new Date(log.startTime).toLocaleString()}</TableCell>
                            <TableCell>{log.totalUsers}</TableCell>
                            <TableCell>{log.successCount} / {log.failedCount}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">ログがありません</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {logsTotalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination 
                      count={logsTotalPages} 
                      page={logsPage} 
                      onChange={handleLogsPageChange} 
                      color="primary" 
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              システムメンテナンス
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={openManualUpdateDialog}
                startIcon={<UpdateIcon />}
              >
                運勢手動更新
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={openDayPillarGenerationDialog}
                startIcon={<UpdateIcon />}
              >
                日柱手動生成
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleMaintenance('backup')}
              >
                DBバックアップ
              </Button>
              <Button 
                variant="contained" 
                color="warning"
                onClick={() => handleMaintenance('cache')}
              >
                キャッシュ削除
              </Button>
              <Button 
                variant="contained" 
                color="error"
                onClick={() => handleMaintenance('chatHistory')}
              >
                AIチャット履歴全削除
              </Button>
            </Stack>
            
            {/* デバッグ用の直接APIエンドポイント表示（開発環境のみ） */}
            <Box sx={{ p: 2, border: '1px dashed #999', mb: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                デバッグ情報（開発用）
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                日柱生成API: {ADMIN.RUN_DAY_PILLAR_GENERATION}
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                color="secondary"
                onClick={async () => {
                  try {
                    const response = await AdminService.runDayPillarGeneration(5);
                    console.log('API直接実行結果:', response);
                    showNotification(NotificationType.SUCCESS, '直接API呼び出し成功');
                  } catch (error) {
                    console.error('API直接実行エラー:', error);
                    showNotification(NotificationType.ERROR, '直接API呼び出し失敗');
                  }
                }}
              >
                日柱APIテスト実行 (5日分)
              </Button>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="primary">
                日柱生成ログ
              </Typography>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="day-pillar-logs-filter-label">ステータス</InputLabel>
                <Select
                  labelId="day-pillar-logs-filter-label"
                  value={dayPillarLogsFilter}
                  onChange={(e: any) => handleDayPillarLogsFilterChange(e)}
                  label="ステータス"
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="scheduled">予定</MenuItem>
                  <MenuItem value="running">実行中</MenuItem>
                  <MenuItem value="completed">完了</MenuItem>
                  <MenuItem value="completed_with_errors">警告あり</MenuItem>
                  <MenuItem value="failed">失敗</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {dayPillarLogsLoading ? (
              <LoadingIndicator />
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>実行日時</TableCell>
                        <TableCell>ステータス</TableCell>
                        <TableCell>生成日数</TableCell>
                        <TableCell>成功/エラー</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dayPillarLogs.length > 0 ? (
                        dayPillarLogs.map((log) => (
                          <TableRow key={log._id}>
                            <TableCell>{new Date(log.startTime).toLocaleString()}</TableCell>
                            <TableCell>
                              {log.status === 'completed' && <Chip key={`completed-${log._id}`} size="small" label="完了" color="success" />}
                              {log.status === 'scheduled' && <Chip key={`scheduled-${log._id}`} size="small" label="予定" color="info" />}
                              {log.status === 'running' && <Chip key={`running-${log._id}`} size="small" label="実行中" color="warning" />}
                              {log.status === 'completed_with_errors' && <Chip key={`completed_with_errors-${log._id}`} size="small" label="警告あり" color="warning" />}
                              {log.status === 'failed' && <Chip key={`failed-${log._id}`} size="small" label="失敗" color="error" />}
                            </TableCell>
                            <TableCell>{log.params?.days || '-'}</TableCell>
                            <TableCell>
                              {log.result ? (
                                `${log.result.created || 0} / ${log.result.errors || 0}`
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">ログがありません</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {dayPillarLogsTotalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination 
                      count={dayPillarLogsTotalPages} 
                      page={dayPillarLogsPage} 
                      onChange={handleDayPillarLogsPageChange} 
                      color="primary" 
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              日柱情報一覧
            </Typography>
            
            {dayPillarsLoading ? (
              <LoadingIndicator />
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>日付</TableCell>
                        <TableCell>天干</TableCell>
                        <TableCell>地支</TableCell>
                        <TableCell>説明</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dayPillars.length > 0 ? (
                        dayPillars.map((pillar) => (
                          <TableRow key={pillar._id}>
                            <TableCell>{new Date(pillar.date).toLocaleDateString()}</TableCell>
                            <TableCell>{pillar.heavenlyStem}</TableCell>
                            <TableCell>{pillar.earthlyBranch}</TableCell>
                            <TableCell>{pillar.energyDescription || '-'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">日柱情報がありません</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {dayPillarsTotalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination 
                      count={dayPillarsTotalPages} 
                      page={dayPillarsPage} 
                      onChange={handleDayPillarsPageChange} 
                      color="primary" 
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* 利用統計タブ */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              データ期間
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <FormControl fullWidth>
                  <InputLabel id="date-range-label">期間</InputLabel>
                  <Select
                    labelId="date-range-label"
                    value={dateRange}
                    label="期間"
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <MenuItem value="7">過去7日</MenuItem>
                    <MenuItem value="30">過去30日</MenuItem>
                    <MenuItem value="90">過去90日</MenuItem>
                    <MenuItem value="365">過去1年</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              ユーザー統計
            </Typography>
            <Box 
              sx={{ 
                width: '100%', 
                height: 300, 
                bgcolor: 'grey.100', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed grey.400',
                mb: 3
              }}
            >
              ユーザー登録数グラフ
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4} key="total-users">
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      総ユーザー数
                    </Typography>
                    <Typography variant="h4" component="div" color="primary">
                      245
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4} key="active-users">
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      アクティブユーザー
                    </Typography>
                    <Typography variant="h4" component="div" color="primary">
                      187
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4} key="new-users">
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      新規ユーザー
                    </Typography>
                    <Typography variant="h4" component="div" color="primary">
                      28
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              AI利用統計
            </Typography>
            <Box 
              sx={{ 
                width: '100%', 
                height: 300, 
                bgcolor: 'grey.100', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed grey.400',
                mb: 3
              }}
            >
              AI利用量グラフ
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4} key="total-requests">
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      総リクエスト数
                    </Typography>
                    <Typography variant="h4" component="div" color="primary">
                      5,843
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4} key="avg-response-time">
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      平均レスポンス時間
                    </Typography>
                    <Typography variant="h4" component="div" color="primary">
                      1.2秒
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4} key="avg-usage-per-user">
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      1ユーザーあたりの平均利用回数
                    </Typography>
                    <Typography variant="h4" component="div" color="primary">
                      31.2回
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default Settings;