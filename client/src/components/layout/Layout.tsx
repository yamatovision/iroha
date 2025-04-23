import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate } from 'react-router-dom'
import NavigationMenu from './NavigationMenu'
import UserMenu from './UserMenu'
import { NetworkStatusIndicator } from '../network'

// ドロワーの幅
const drawerWidth = 240

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    flexGrow: 1,
    padding: theme.spacing(2),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    [theme.breakpoints.up('sm')]: {
      marginLeft: 0,
      padding: theme.spacing(3), // デスクトップでは余白を大きく
    },
    // iOSのセーフエリア対応と下部ナビゲーション用の余白
    paddingBottom: 'calc(68px + env(safe-area-inset-bottom, 8px))',
  }),
)

const ResponsiveDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
  [theme.breakpoints.up('md')]: {
    position: 'relative',
  },
}))

// ナビゲーションバー用スタイル（すべての画面サイズで表示）
const BottomNavigation = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'space-around',
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  paddingTop: theme.spacing(0.5), // 上部パディング
  paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 4px)', // セーフエリア + 追加パディング
  zIndex: theme.zIndex.appBar,
  boxShadow: '0 -2px 5px rgba(0,0,0,0.05)', // 軽い影を追加
  // 高さを固定からセーフエリアを考慮した可変に変更
  minHeight: '60px', // 最小高さを保証
  // デスクトップでも表示するために以下のメディアクエリを削除
  // [theme.breakpoints.up('md')]: {
  //   display: 'none',
  // },
}))

// ページタイトルの取得関数
const getPageTitle = (pathname: string): string => {
  if (pathname === '/') return 'デイリー運勢'
  if (pathname === '/profile') return 'プロフィール設定'
  if (pathname === '/team') return 'チーム'
  if (pathname === '/chat') return 'AI相談'
  if (pathname === '/admin') return '管理'
  if (pathname === '/fortune') return '運勢詳細'
  if (pathname === '/friend' || pathname === '/friends') return '友達'
  return 'DailyFortune'
}

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  const pageTitle = getPageTitle(location.pathname)
  const showBackButton = location.pathname !== '/'

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const goBack = () => {
    navigate(-1)
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      flexDirection: 'column',
      bgcolor: 'background.default',
      background: 'linear-gradient(135deg, #fcf7ff 0%, #f6edff 100%)',
    }}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(120deg, #9c27b0, #7b1fa2)',
          boxShadow: '0 2px 15px rgba(0,0,0,0.15)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          // セーフエリア対応 - よりコンパクトに
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: '48px', sm: '56px' }, // 高さを縮小
            paddingTop: { xs: '4px', sm: '0px' }, // 上部余白を縮小
            paddingBottom: { xs: '4px', sm: '0px' }, // 下部余白も縮小
          }}
        >
          {showBackButton ? (
            <IconButton
              color="inherit"
              aria-label="back"
              edge="start"
              onClick={goBack}
              sx={{ mr: 1.5, p: 1 }} // パディングを小さく
            >
              <ArrowBackIcon fontSize="small" /> {/* アイコンサイズを小さく */}
            </IconButton>
          ) : (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1.5, p: 1, display: { md: 'block' } }} // パディングを小さく
            >
              <MenuIcon fontSize="small" /> {/* アイコンサイズを小さく */}
            </IconButton>
          )}
          <Typography 
            variant="subtitle1" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 400,
              fontSize: { xs: '0.95rem', sm: '1.1rem' } // フォントサイズを調整
            }}
          >
            {pageTitle}
          </Typography>
          <UserMenu />
        </Toolbar>
      </AppBar>
      
      {/* モバイル用ドロワー - 必要な場合だけ表示 */}
      <ResponsiveDrawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
      >
        <Toolbar />
        <Divider />
        <NavigationMenu onNavigate={() => setMobileOpen(false)} />
      </ResponsiveDrawer>
      
      <Box sx={{ display: 'flex', flex: 1 }}>
        <Main>
          {/* スペーサーの高さを縮小してコンテンツをより上に表示 */}
          <Box sx={{ 
            height: { 
              xs: 'calc(48px + 4px + env(safe-area-inset-top, 0px))', // 縮小: コンパクトなツールバー + 最小余白 + セーフエリア
              sm: '56px' // デスクトップも縮小
            } 
          }} />
          <Outlet />
          {/* 下部スペースは Main コンポーネントの paddingBottom で対応するため削除 */}
        </Main>
      </Box>
      
      {/* ネットワーク状態通知 */}
      <NetworkStatusIndicator mode="snackbar" />
      
      {/* 下部ナビゲーション - すべての画面サイズで表示 */}
      <BottomNavigation>
        <NavigationMenu layout="bottom" />
      </BottomNavigation>
    </Box>
  )
}

export default Layout
