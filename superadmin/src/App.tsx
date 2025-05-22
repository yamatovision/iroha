import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import SuperAdminRoute from './components/common/SuperAdminRoute';
import Login from './pages/Login';
import Organizations from './pages/Organizations';
import beautyTheme from './theme';

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
      
      <Route
        path="/organizations"
        element={
          <SuperAdminRoute>
            <Organizations />
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
    <ThemeProvider theme={beautyTheme}>
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