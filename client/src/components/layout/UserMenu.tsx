import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import CircularProgress from '@mui/material/CircularProgress'
import LoadingIndicator from '../../components/common/LoadingIndicator'

const UserMenu = () => {
  const { userProfile, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      await logout()
      // 明示的にログイン画面に遷移
      navigate('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
      // エラーが発生した場合でも、ログイン画面に遷移
      navigate('/login')
    } finally {
      setLogoutLoading(false)
    }
  }

  const handleProfile = () => {
    navigate('/profile')
    handleClose()
  }

  // ユーザーの頭文字を生成
  const getInitials = (name: string) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
      : '?'
  }

  // 認証状態のロード中は小さなローディングアイコンを表示
  if (authLoading) {
    return (
      <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
        <LoadingIndicator size="small" />
      </Box>
    );
  }
  
  return (
    <Box>
      <Tooltip title="アカウント設定">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ ml: 2 }}
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {userProfile ? getInitials(userProfile.displayName) : '?'}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1">{userProfile?.displayName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {userProfile?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          プロフィール
        </MenuItem>
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          設定
        </MenuItem>
        
        <Divider />
        <MenuItem onClick={handleLogout} disabled={logoutLoading}>
          <ListItemIcon>
            {logoutLoading ? (
              <CircularProgress size={20} />
            ) : (
              <LogoutIcon fontSize="small" />
            )}
          </ListItemIcon>
          {logoutLoading ? 'ログアウト中...' : 'ログアウト'}
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default UserMenu