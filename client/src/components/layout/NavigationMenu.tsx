import { useAuth } from '../../contexts/AuthContext'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import HomeIcon from '@mui/icons-material/Home'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import ChatIcon from '@mui/icons-material/Chat'
import FavoriteIcon from '@mui/icons-material/Favorite'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { Link as RouterLink, useLocation } from 'react-router-dom'

type NavigationMenuProps = {
  onNavigate?: () => void;
  layout?: 'sidebar' | 'bottom';
}

// メニュー項目の型定義
// すべてのメニュー項目のための統一された型
interface MenuItem {
  text: string;
  icon: JSX.Element;
  path: string;
  disabled?: boolean;
  disabledCheck?: boolean;
}


const NavigationMenu = ({ onNavigate, layout = 'sidebar' }: NavigationMenuProps) => {
  const { isAdmin, isSuperAdmin, userProfile, activeTeamId } = useAuth()
  const location = useLocation()
  const theme = useTheme()
  // const navigate = useNavigate()

  // ユーザーが所属しているチームへの直接リンクを作成
  const userTeamId = userProfile?.teamId || '';
  
  // 使用するチームID (通常ユーザーは自分のチーム、管理者はアクティブチームか自分のチーム)
  const targetTeamId = (isAdmin || isSuperAdmin) ? 
                        (activeTeamId || userTeamId) : 
                        userTeamId;
  
  // ダイレクトリンク - 全ユーザー共通で相性分析ページへ直接アクセス
  const directTeamPath = targetTeamId ? 
                        `/team/${targetTeamId}/aisyou` : 
                        '/myteam'; // チームIDがない場合はリダイレクト用ルートへ

  // 基本メニュー項目
  const baseMenuItems: MenuItem[] = [
    { text: 'ホーム', icon: <HomeIcon />, path: '/' },
    { text: 'AI相談', icon: <ChatIcon />, path: '/chat' },
    { text: '設定', icon: <AccountCircleIcon />, path: '/profile' },
  ]

  // チームメニュー項目 - 全ユーザー共通で相性ページへ直接
  const teamMenuItem: MenuItem = { 
    text: 'チーム', 
    icon: <FavoriteIcon />, 
    path: directTeamPath, 
    disabled: !targetTeamId, // チームIDがない場合のみ無効化
    disabledCheck: !targetTeamId // TypeScriptエラー回避用
  }
  
  // 最終的なメニュー項目（権限に応じて構築）
  const menuItems: MenuItem[] = [...baseMenuItems]
  
  // 一般ユーザーの場合はチームメンバーシップがあればチームに相性ページへのリンクを追加
  // 管理者の場合はチーム管理ページへのリンクを追加
  console.log("NavigationMenu isAdmin:", isAdmin, "isSuperAdmin:", isSuperAdmin, "userTeamId:", userTeamId);
  if (userTeamId || isAdmin || isSuperAdmin) {
    // ホームとAI相談の間に挿入
    menuItems.splice(1, 0, teamMenuItem)
  }

  // 管理者メニュー項目 - チームリスト選択ページに遷移する
  const adminMenuItems: MenuItem[] = [
    { text: '管理', icon: <AdminPanelSettingsIcon />, path: '/team' },
  ]

  // 現在のパスがメニュー項目と一致するかチェック
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  if (layout === 'bottom') {
    // ボトムナビゲーション用のアイテム
    // すべてのメニュー項目を表示
    const bottomNavItems = [...menuItems];
    
    // 管理者メニューの準備（管理者のみ）
    let adminItem = null;
    if (isAdmin || isSuperAdmin) {
      adminItem = adminMenuItems[0];
      // 設定メニューは常に表示
    }
    
    console.log("Bottom navigation items:", bottomNavItems.map(i => i.text));
    
    return (
      <>
        {bottomNavItems.map((item) => (
          <Box
            key={item.text}
            component={item.disabled ? 'div' : RouterLink} // 無効化されている場合はdivに
            to={!item.disabled ? item.path : undefined} // 無効化されている場合はtoを設定しない
            onClick={!item.disabled ? onNavigate : undefined} // 無効化されている場合はクリックイベントを設定しない
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: item.disabled ? 'text.disabled' : (isActive(item.path) ? 'primary.main' : 'text.secondary'),
              p: 1,
              minWidth: 0,
              flex: 1,
              opacity: item.disabled ? 0.5 : 1, // 無効化されている場合は半透明に
              cursor: item.disabled ? 'default' : 'pointer', // 無効化されている場合はカーソルをデフォルトに
              '&:hover': {
                color: item.disabled ? 'text.disabled' : 'primary.main',
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 0.5,
              }}
            >
              {item.icon}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                fontWeight: isActive(item.path) ? '500' : '400',
                whiteSpace: 'nowrap',
              }}
            >
              {item.text}
            </Typography>
          </Box>
        ))}
        
        {isAdmin && adminItem && (
          <Box
            component={RouterLink}
            to={adminItem.path}
            onClick={onNavigate}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: isActive(adminItem.path) ? 'primary.main' : 'text.secondary',
              p: 1,
              minWidth: 0,
              flex: 1,
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 0.5,
              }}
            >
              {adminItem.icon}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                fontWeight: isActive(adminItem.path) ? '500' : '400',
                whiteSpace: 'nowrap',
              }}
            >
              {adminItem.text}
            </Typography>
          </Box>
        )}
      </>
    )
  }

  // デスクトップ用のサイドナビゲーション
  return (
    <>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={item.disabled ? 'div' : RouterLink}
              to={!item.disabled ? item.path : undefined}
              onClick={!item.disabled ? onNavigate : undefined}
              selected={!item.disabled && isActive(item.path)}
              disabled={item.disabled}
              sx={{
                borderLeft: (!item.disabled && isActive(item.path)) ? `4px solid ${theme.palette.primary.main}` : 'none',
                opacity: item.disabled ? 0.5 : 1,
                cursor: item.disabled ? 'default' : 'pointer',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(156, 39, 176, 0.08)',
                }
              }}
            >
              <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 500 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {isAdmin && (
        <>
          <Divider />
          <List>
            {adminMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  component={RouterLink} 
                  to={item.path}
                  onClick={onNavigate}
                  selected={isActive(item.path)}
                  sx={{
                    borderLeft: isActive(item.path) ? `4px solid ${theme.palette.primary.main}` : 'none',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(156, 39, 176, 0.08)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 500 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </>
  )
}

export default NavigationMenu
