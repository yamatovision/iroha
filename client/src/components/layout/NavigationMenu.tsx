import { useAuth } from '../../contexts/AuthContext'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import { useTheme } from '@mui/material/styles'
import HomeIcon from '@mui/icons-material/Home'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import ChatIcon from '@mui/icons-material/Chat'
import FavoriteIcon from '@mui/icons-material/Favorite'
import GroupsIcon from '@mui/icons-material/Groups'
import PeopleIcon from '@mui/icons-material/People'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { NetworkStatusIndicator } from '../network'

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
  const { isAdmin, isSuperAdmin, userProfile, activeTeamId, loading: authLoading } = useAuth()
  const location = useLocation()
  const theme = useTheme()
  // const navigate = useNavigate()

  // ユーザーが所属しているチームへの直接リンクを作成
  const userTeamId = userProfile?.teamId || '';
  
  // 使用するチームID (通常ユーザーは自分のチーム、管理者はアクティブチームか自分のチーム)
  const targetTeamId = (isAdmin || isSuperAdmin) ? 
                        (activeTeamId || userTeamId) : 
                        userTeamId;
  
  // ダイレクトリンク - 全ユーザー共通でチームアドバイスページへ直接アクセス
  const directTeamPath = targetTeamId ? 
                        `/team/${targetTeamId}/advice` : 
                        '/team-hub'; // チームIDがない場合はチームハブへ（新規チーム作成用）

  // 基本メニュー項目
  const baseMenuItems: MenuItem[] = [
    { text: 'ホーム', icon: <HomeIcon />, path: '/' },
    { text: 'AI相談', icon: <ChatIcon />, path: '/chat' },
    { text: '設定', icon: <AccountCircleIcon />, path: '/profile' },
  ]

  // チームメニュー項目 - ダイレクトリンクに変更
  const teamMenuItem: MenuItem = { 
    text: 'チーム', 
    icon: <GroupsIcon />, 
    path: directTeamPath, // '/team/{teamId}/advice' または '/team-hub'
    disabled: false, // チームハブは常に有効
    disabledCheck: false // TypeScriptエラー回避用
  }
  
  // 友達メニュー項目
  const friendsMenuItem: MenuItem = {
    text: '友達',
    icon: <PeopleIcon />,
    path: '/friend'  // /friendsから/friendに修正してルート定義と一致させる
  }
  
  // 最終的なメニュー項目（権限に応じて構築）
  const menuItems: MenuItem[] = [...baseMenuItems]
  
  // 友達ページは常に追加
  menuItems.splice(1, 0, friendsMenuItem)
  
  // 一般ユーザーの場合はチームメンバーシップがあればチームに相性ページへのリンクを追加
  // 管理者の場合はチーム管理ページへのリンクを追加
  console.log("NavigationMenu isAdmin:", isAdmin, "isSuperAdmin:", isSuperAdmin, "userTeamId:", userTeamId);
  if (userTeamId || isAdmin || isSuperAdmin) {
    // 友達ページの後に挿入
    menuItems.splice(2, 0, teamMenuItem)
  }

  // 管理者メニュー項目 - チームリスト選択ページに遷移する
  const adminMenuItems: MenuItem[] = [
    { text: '管理', icon: <AdminPanelSettingsIcon />, path: '/team-hub' },
  ]

  // 現在のパスがメニュー項目と一致するかチェック
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  // 認証データロード中のスケルトン表示（ボトムナビゲーション）
  if (authLoading && layout === 'bottom') {
    return (
      <>
        {[1, 2, 3, 4].map((item) => (
          <Box
            key={item}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 1,
              minWidth: 0,
              flex: 1,
            }}
          >
            <Skeleton variant="circular" width={24} height={24} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={40} height={20} />
          </Box>
        ))}
      </>
    );
  }

  // 認証データロード中のスケルトン表示（サイドバー）
  if (authLoading && layout === 'sidebar') {
    return (
      <List>
        {[1, 2, 3, 4].map((item) => (
          <ListItem key={item} disablePadding>
            <ListItemButton disabled>
              <ListItemIcon>
                <Skeleton variant="circular" width={24} height={24} />
              </ListItemIcon>
              <ListItemText primary={<Skeleton width={100} />} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    );
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
                // アクティブアイテムを少し大きく表示
                transform: isActive(item.path) ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.2s ease',
                '& .MuiSvgIcon-root': {
                  fontSize: '1.4rem', // アイコンサイズ拡大
                }
              }}
            >
              {item.icon}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem', // フォントサイズを少し小さく
                fontWeight: isActive(item.path) ? '600' : '400', // アクティブはより太く
                whiteSpace: 'nowrap',
                opacity: isActive(item.path) ? 1 : 0.8, // 非アクティブは少し薄く
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
                // アクティブアイテムを少し大きく表示
                transform: isActive(adminItem.path) ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.2s ease',
                '& .MuiSvgIcon-root': {
                  fontSize: '1.4rem', // アイコンサイズ拡大
                }
              }}
            >
              {adminItem.icon}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem', // フォントサイズを少し小さく
                fontWeight: isActive(adminItem.path) ? '600' : '400', // アクティブはより太く
                whiteSpace: 'nowrap',
                opacity: isActive(adminItem.path) ? 1 : 0.8, // 非アクティブは少し薄く
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
      
      {/* ネットワーク状態インジケータ */}
      <Box sx={{ mt: 'auto', p: 1 }}>
        <ListItem>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  ネットワーク状態
                </Typography>
                <NetworkStatusIndicator mode="badge" />
              </Box>
            }
          />
        </ListItem>
      </Box>
    </>
  )
}

export default NavigationMenu
