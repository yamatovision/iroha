import { useState, FormEvent } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Avatar, 
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import { Email, Lock, Person, Psychology } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!email || !password || !confirmPassword || !displayName) {
      setError('すべての項目を入力してください');
      return;
    }
    
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
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
      await register(email, password, displayName);
      navigate('/profile'); // 登録成功後のリダイレクト
    } catch (err: any) {
      console.error('登録エラー:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています');
      } else if (err.code === 'auth/invalid-email') {
        setError('無効なメールアドレスです');
      } else if (err.code === 'auth/weak-password') {
        setError('パスワードが弱すぎます');
      } else {
        setError('アカウント登録に失敗しました。再度お試しください');
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
              新規登録
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              アカウント情報を入力してください
            </Typography>
          </Box>

          {/* エラーメッセージ */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 登録フォーム */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="displayName"
              label="表示名"
              name="displayName"
              autoComplete="name"
              autoFocus
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
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
              id="email"
              label="メールアドレス"
              name="email"
              autoComplete="email"
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
              label="パスワード（6文字以上）"
              type="password"
              id="password"
              autoComplete="new-password"
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="パスワード（確認）"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? <CircularProgress size={24} color="inherit" /> : '登録する'}
            </Button>
          </Box>

          {/* フッター */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              既にアカウントをお持ちの方
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Link to="/login" style={{ 
                color: '#9c27b0', 
                textDecoration: 'none',
                fontWeight: 500
              }}>
                ログインする
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;