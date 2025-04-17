import { useState, FormEvent, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Divider, 
  Avatar, 
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import { Email, Lock, Psychology } from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // トークン期限切れ時のメッセージを表示
  useEffect(() => {
    // クエリパラメータを確認
    const params = new URLSearchParams(location.search);
    const expired = params.get('expired');
    
    if (expired === 'true') {
      setError('セッションの有効期限が切れたか、トークンの不一致が発生しました。再度ログインしてください。');
    }
    
    // 既にログイン済みの場合はリダイレクト
    if (currentUser) {
      navigate('/fortune');
    }
  }, [currentUser, navigate, location.search]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
    
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }
    
    // メールアドレスの検証
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/fortune'); // ログイン成功後のリダイレクト
    } catch (err: any) {
      console.error('ログインエラー:', err);
      if (err.code === 'auth/user-not-found') {
        setError('ユーザーが見つかりません');
      } else if (err.code === 'auth/wrong-password') {
        setError('パスワードが正しくありません');
      } else if (err.code === 'auth/invalid-credential') {
        setError('ログイン情報が無効です');
      } else {
        setError('ログインに失敗しました。再度お試しください');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fcf7ff 0%, #f6edff 100%)',
        py: 3
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 4,
            boxShadow: '0 3px 8px rgba(156, 39, 176, 0.1)',
            p: { xs: 3, sm: 5 },
            backdropFilter: 'blur(10px)',
            width: '100%'
          }}
        >
          {/* ヘッダー */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                  boxShadow: '0 4px 10px rgba(156, 39, 176, 0.25)'
                }}
              >
                <Psychology sx={{ fontSize: 40 }} />
              </Avatar>
            </Box>
            <Typography variant="h4" color="primary.dark" fontWeight={500}>
              DailyFortune
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              経営者向け人材管理ツール
            </Typography>
          </Box>

          {/* エラーメッセージ */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* ログインフォーム */}
          <Box component="form" onSubmit={handleSubmit}>
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.9)'
                }
              }}
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.9)'
                }
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                boxShadow: '0 4px 10px rgba(156, 39, 176, 0.25)',
                '&:hover': {
                  boxShadow: '0 6px 15px rgba(156, 39, 176, 0.35)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'ログイン'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link to="/forgot-password" style={{ 
                color: '#9c27b0', 
                textDecoration: 'none',
                fontSize: '0.95rem',
              }}>
                パスワードをお忘れですか？
              </Link>
            </Box>
          </Box>

          {/* 区切り線 */}
          <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
            <Divider sx={{ flexGrow: 1, bgcolor: '#e6e0eb' }} />
            <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
              または
            </Typography>
            <Divider sx={{ flexGrow: 1, bgcolor: '#e6e0eb' }} />
          </Box>

          {/* フッター */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              アカウントをお持ちでない場合
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Link to="/register" style={{ 
                color: '#9c27b0', 
                textDecoration: 'none',
                fontWeight: 500
              }}>
                新規登録
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;