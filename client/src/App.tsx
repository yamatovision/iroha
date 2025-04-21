// React 17以降ではJSXでReactのインポートが不要
// import React from 'react'
import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import RequireSajuProfile from './components/common/RequireSajuProfile'
import LoadingIndicator from './components/common/LoadingIndicator'
import AppExitHandler from './components/common/AppExitHandler'
import ErrorBoundary from './components/common/ErrorBoundary'
import sessionManager from './services/auth/session-manager.service'
import deepLinkHandler from './utils/deep-link-handler'
import { ScreenOrientation } from '@capacitor/screen-orientation'

// ページコンポーネント
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Login/Register'
import ForgotPassword from './pages/Login/ForgotPassword'
import Profile from './pages/Profile'
import Fortune from './pages/Fortune'
import Chat from './pages/Chat'
import Team from './pages/Team'
import AisyouPage from './pages/Team/Aisyou'
import FriendList from './pages/Friend'
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
      default: '#fff',
      paper: '#f5f5f5',
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

// JWT移行モーダルは削除しました

function App() {
  const { loading, userProfile } = useAuth()
  const location = useLocation();
  const navigate = useNavigate();

  // セッションマネージャーの初期化
  useEffect(() => {
    const initSessionManager = async () => {
      try {
        await sessionManager.initialize();
        console.log('App: セッションマネージャー初期化完了');
      } catch (error) {
        console.error('App: セッションマネージャー初期化エラー:', error);
      }
    };
    
    initSessionManager();
    
    // クリーンアップ時の処理
    return () => {
      const cleanup = async () => {
        try {
          await sessionManager.cleanup();
          console.log('App: セッションマネージャークリーンアップ完了');
        } catch (error) {
          console.error('App: セッションマネージャークリーンアップエラー:', error);
        }
      };
      
      cleanup();
    };
  }, []);
  
  // 画面遷移を監視して履歴スタックを更新
  useEffect(() => {
    // 現在のパスを履歴スタックに追加
    sessionManager.addToHistoryStack(location.pathname);
  }, [location.pathname]);
  
  // ディープリンク処理の初期化
  useEffect(() => {
    const initDeepLinks = async () => {
      try {
        // 画面方向を縦向きに固定
        try {
          await ScreenOrientation.lock({ orientation: 'portrait' });
          console.log('App: 画面方向を縦向きに固定');
        } catch (orientationError) {
          console.warn('App: 画面方向設定エラー:', orientationError);
          // エラーがあっても続行
        }
        
        // ディープリンクハンドラーの初期化
        deepLinkHandler.initialize();
        
        // ルートの登録
        deepLinkHandler.registerRoute('fortune', () => {
          navigate('/fortune');
        });
        
        deepLinkHandler.registerRoute('team', (params) => {
          const teamId = params.get('id');
          if (teamId) {
            navigate(`/team/${teamId}`);
          } else {
            navigate('/team');
          }
        });
        
        deepLinkHandler.registerRoute('chat', () => {
          navigate('/chat');
        });
        
        deepLinkHandler.registerRoute('profile', () => {
          navigate('/profile');
        });
        
        // 友達ルート - どちらの形式でもアクセスできるように両方対応
        deepLinkHandler.registerRoute('friends', () => {
          navigate('/friend');  // 単数形のルートに統一
        });
        
        deepLinkHandler.registerRoute('friend', () => {
          navigate('/friend');
        });
        
        deepLinkHandler.registerRoute('compatibility', (params) => {
          const friendId = params.get('id');
          if (friendId) {
            navigate(`/compatibility/${friendId}`);
          } else {
            navigate('/friend');  // /friendsから/friendに修正
          }
        });
        
        console.log('App: ディープリンク処理の初期化完了');
      } catch (error) {
        console.error('App: ディープリンク初期化エラー:', error);
      }
    };
    
    initDeepLinks();
  }, [navigate]);
  
  if (loading) {
    // 読み込み中表示
    return <LoadingIndicator message="アプリを読み込み中..." fullScreen size="large" />
  }

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* アプリ終了処理ハンドラー */}
        <AppExitHandler />
        
        <Routes>
          {/* 公開ルート */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* 保護されたルート */}
          <Route element={<Layout />}>
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
              <Route path="/fortune" element={
                <ProtectedRoute>
                  <RequireSajuProfile>
                    <Fortune />
                  </RequireSajuProfile>
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/team" element={
                <ProtectedRoute>
                  <Team />
                </ProtectedRoute>
              } />
              <Route path="/team/:teamId" element={
                <ProtectedRoute>
                  <Team />
                </ProtectedRoute>
              } />
              <Route path="/team/:teamId/aisyou" element={
                <ProtectedRoute>
                  <RequireSajuProfile>
                    <AisyouPage />
                  </RequireSajuProfile>
                </ProtectedRoute>
              } />
              {/* 友達一覧ページ - /friend パスのみに統一 */}
              <Route path="/friend" element={
                <ProtectedRoute>
                  <FriendList />
                </ProtectedRoute>
              } />
              {/* /friends へのアクセスを /friend にリダイレクト */}
              <Route path="/friends" element={<Navigate to="/friend" replace />} />
              {/* 相性診断ページ - 友達リストページへリダイレクト */}
              <Route path="/compatibility/:friendId" element={
                <Navigate to="/friend" replace />
              } />
              {/* 自分のチームの相性ページへのリダイレクト用ルート */}
              <Route path="/myteam" element={
                <ProtectedRoute>
                  {userProfile?.teamId ? 
                    <Navigate to={`/team/${userProfile.teamId}/aisyou`} replace /> : 
                    <Navigate to="/team" replace />
                  }
                </ProtectedRoute>
              } />
              
              {/* 管理者ルート - 削除済み */}

              {/* デフォルトルート */}
              <Route path="/" element={<Navigate to="/fortune" replace />} />
              {/* ワイルドカードルートは / へリダイレクト */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App