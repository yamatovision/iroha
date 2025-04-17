import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  const { login, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ユーザーが既にログインしている場合の処理
  useEffect(() => {
    if (userProfile) {
      // ログイン成功後のリダイレクト処理
      const { from }: any = location.state || { from: { pathname: '/' } };
      navigate(from, { replace: true });
    }
  }, [userProfile, navigate, location]);

  // 成功状態が設定された後の遅延リダイレクト
  useEffect(() => {
    if (loginSuccess) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 基本的なバリデーション
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      console.log('ログイン成功フラグを設定します');
      setLoginSuccess(true);
    } catch (err: any) {
      console.error('ログインエラー:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'ログインに失敗しました。認証情報を確認してください。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
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
        <Typography component="h1" variant="h4" color="primary" gutterBottom>
          管理者ログイン
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={3}>
          DailyFortune SuperAdmin
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        {loginSuccess && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            ログインに成功しました。ダッシュボードにリダイレクトします...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="メールアドレス"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || loginSuccess}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="パスワード"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || loginSuccess}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading || loginSuccess}
          >
            {loading ? <CircularProgress size={24} /> : 'ログイン'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;