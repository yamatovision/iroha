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
    },
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
  padding: theme.spacing(1, 0),
  zIndex: theme.zIndex.appBar,
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <Toolbar>
          {showBackButton ? (
            <IconButton
              color="inherit"
              aria-label="back"
              edge="start"
              onClick={goBack}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          ) : (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'block' } }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 400 }}>
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
          <Toolbar /> {/* アプリバーの高さ分のスペーサー */}
          <Outlet />
          <Box sx={{ height: '64px' }} /> {/* すべての画面サイズで下部ナビゲーション用スペース */}
        </Main>
      </Box>
      
      {/* 下部ナビゲーション - すべての画面サイズで表示 */}
      <BottomNavigation>
        <NavigationMenu layout="bottom" />
      </BottomNavigation>
    </Box>
  )
}

export default Layout
