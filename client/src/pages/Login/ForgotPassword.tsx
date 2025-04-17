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
import { Email, Psychology } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }
    
    // メールアドレスの検証
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }
    
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      await resetPassword(email);
      setMessage('パスワードリセットのメールを送信しました。メールを確認してください。');
    } catch (err: any) {
      console.error('パスワードリセットエラー:', err);
      if (err.code === 'auth/user-not-found') {
        setError('このメールアドレスに登録されているユーザーが見つかりません');
      } else {
        setError('パスワードリセットに失敗しました。再度お試しください');
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
              パスワードリセット
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              登録メールアドレスを入力してください
            </Typography>
          </Box>

          {/* エラーメッセージ */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 成功メッセージ */}
          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {/* リセットフォーム */}
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'パスワードリセット'}
            </Button>
          </Box>

          {/* フッター */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Link to="/login" style={{ 
              color: '#9c27b0', 
              textDecoration: 'none',
              fontWeight: 500
            }}>
              ログインに戻る
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default ForgotPassword;