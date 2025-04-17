import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { SuperAdminRoute } from './components/common/SuperAdminRoute'
import LoadingIndicator from './components/common/LoadingIndicator'

// ページコンポーネント
import AdminLayout from './components/layout/AdminLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UsersManagement from './pages/UsersManagement'
import TeamsManagement from './pages/TeamsManagement'
import Settings from './pages/Settings'
import Stats from './pages/Stats'
import Unauthorized from './pages/Unauthorized'

// テーマ設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#673ab7', // 紫色
      light: '#9575cd',
      dark: '#4527a0',
    },
    secondary: {
      main: '#ff4081', // ピンク
      light: '#ff80ab',
      dark: '#c51162',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
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
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
      },
    },
  },
})

function App() {
  const { loading } = useAuth()

  if (loading) {
    // 読み込み中表示
    return <LoadingIndicator fullScreen message="システムをロードしています..." />
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <Routes>
        {/* 公開ルート */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 管理者保護ルート */}
        <Route element={<AdminLayout />}>
          <Route path="/" element={
            <SuperAdminRoute>
              <Dashboard />
            </SuperAdminRoute>
          } />
          
          <Route path="/users" element={
            <SuperAdminRoute>
              <UsersManagement />
            </SuperAdminRoute>
          } />
          
          <Route path="/teams" element={
            <SuperAdminRoute>
              <TeamsManagement />
            </SuperAdminRoute>
          } />
          
          <Route path="/settings" element={
            <SuperAdminRoute>
              <Settings />
            </SuperAdminRoute>
          } />
          
          <Route path="/stats" element={
            <SuperAdminRoute>
              <Stats />
            </SuperAdminRoute>
          } />

          {/* デフォルトルート */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </NotificationProvider>
    </ThemeProvider>
  )
}

export default App
