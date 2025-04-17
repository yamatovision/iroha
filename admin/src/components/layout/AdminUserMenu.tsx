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
import LogoutIcon from '@mui/icons-material/Logout'

const AdminUserMenu = () => {
  const { userProfile, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
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
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
            {userProfile ? getInitials(userProfile.displayName) : 'SA'}
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
          <Typography variant="caption" color="secondary">
            スーパー管理者
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          ログアウト
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default AdminUserMenu
