import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import SuperAdminRoute from './components/common/SuperAdminRoute';
import Login from './pages/Login';

// テーマ設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#f48fb1', // ピンク色
      light: '#ffc1e3',
      dark: '#bf5f82',
    },
    secondary: {
      main: '#90caf9', // 水色
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: [
      'Noto Sans JP',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// ダッシュボードのプレースホルダー（後で実装）
const Dashboard = () => <div>ダッシュボード（開発中）</div>;

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* 保護されたルート */}
      <Route
        path="/dashboard"
        element={
          <SuperAdminRoute>
            <Dashboard />
          </SuperAdminRoute>
        }
      />
      
      {/* トップページはダッシュボードにリダイレクト */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 未定義のルートはログインページにリダイレクト */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;