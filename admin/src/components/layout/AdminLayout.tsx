import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { styled, useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AdminMenu from './AdminMenu'
import AdminUserMenu from './AdminUserMenu'

// ドロワーの幅
const drawerWidth = 240

// open プロパティを持つメインコンテンツ用インターフェース
interface MainProps {
  open?: boolean;
  theme?: any;
}

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<MainProps>(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
      marginLeft: 0,
    },
  }),
)

// open プロパティを持つAppBar用インターフェース
interface AppBarProps {
  open?: boolean;
  theme?: any;
}

// カスタムAppBarコンポーネント
const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(
  ({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }),
)

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}))

const AdminLayout = () => {
  const theme = useTheme()
  const [open, setOpen] = useState(true)

  const handleDrawerOpen = () => {
    setOpen(true)
  }

  const handleDrawerClose = () => {
    setOpen(false)
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            DailyFortune 管理者サイト
          </Typography>
          <AdminUserMenu />
        </Toolbar>
      </AppBarStyled>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <AdminMenu />
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  )
}

export default AdminLayout
