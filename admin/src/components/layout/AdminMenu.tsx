import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import DashboardIcon from '@mui/icons-material/Dashboard'
import GroupIcon from '@mui/icons-material/Group'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import { Link as RouterLink } from 'react-router-dom'

const AdminMenu = () => {
  const menuItems = [
    { text: 'ダッシュボード', icon: <DashboardIcon />, path: '/' },
    { text: 'ユーザー管理', icon: <PeopleIcon />, path: '/users' },
    { text: 'チーム管理', icon: <GroupIcon />, path: '/teams' },
    { text: 'システム設定', icon: <SettingsIcon />, path: '/settings' },
    { text: '統計情報', icon: <ShowChartIcon />, path: '/stats' },
  ]

  return (
    <>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={RouterLink} to={item.path}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  )
}

export default AdminMenu
