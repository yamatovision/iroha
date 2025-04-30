import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Container,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // エラーは認証コンテキストで処理されるので何もしない
    }
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f7fa'
    }}>
      <Paper
        elevation={3}
        sx={{ 
          width: '100%', 
          maxWidth: 400, 
          py: 4,
          px: 3,
          borderRadius: 2
        }}
      >
        <Typography variant="h4" component="h1" align="center" sx={{ mb: 3, fontWeight: 600 }}>
          iroha SuperAdmin
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          システム管理者専用ログイン
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="メールアドレス"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            variant="outlined"
            autoComplete="email"
            autoFocus
            disabled={loading}
            required
          />

          <TextField
            label="パスワード"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            variant="outlined"
            autoComplete="current-password"
            disabled={loading}
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5, color: '#ffffff' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                ログイン中...
              </>
            ) : (
              'ログイン'
            )}
          </Button>
        </form>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
          © {new Date().getFullYear()} iroha SuperAdmin
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login;