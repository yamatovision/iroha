import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fcf7ff 0%, #f6edff 100%)',
        py: 3
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: 'center',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'error.light', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 3
            }}
          >
            <LockOutlined sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          
          <Typography variant="h4" component="h1" gutterBottom color="error">
            アクセス権限がありません
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            このページにアクセスするための権限がありません。
            管理者に連絡するか、ログインページに戻って別のアカウントでログインしてください。
          </Typography>
          
          <Box>
            <Button
              variant="contained"
              color="primary"
              sx={{ 
                mr: 2,
                py: 1,
                px: 3,
                borderRadius: 2,
                textTransform: 'none'
              }}
              onClick={() => navigate('/')}
            >
              ホームに戻る
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              sx={{ 
                py: 1,
                px: 3,
                borderRadius: 2,
                textTransform: 'none'
              }}
              onClick={() => navigate('/login')}
            >
              ログインページへ
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Unauthorized;