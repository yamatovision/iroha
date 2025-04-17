import { Box, Typography, Grid, Paper } from '@mui/material';

const Dashboard = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        SuperAdmin ダッシュボード
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              組織数
            </Typography>
            <Typography variant="h3" color="primary">
              0
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              アクティブなサブスクリプション
            </Typography>
            <Typography variant="h3" color="primary">
              0
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              総ユーザー数
            </Typography>
            <Typography variant="h3" color="primary">
              0
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              システムステータス
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                システムは正常に稼働中です。
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;