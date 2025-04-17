import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          アクセス権限がありません
        </Typography>
        
        <Typography variant="body1" sx={{ mt: 2, mb: 4, textAlign: 'center' }}>
          このページにアクセスするための権限がありません。<br />
          SuperAdmin管理サイトは、システム管理者のみがアクセスできます。
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/login')}
          >
            ログインページに戻る
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Unauthorized;