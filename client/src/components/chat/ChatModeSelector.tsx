import React, { useState } from 'react';
import { 
  Box, 
  Chip, 
  IconButton, 
  Tooltip, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Fab,
  Typography
} from '@mui/material';
import { 
  Person, 
  People, 
  Flag, 
  ArrowBack, 
  MoreVert, 
  DeleteSweep, 
  Save,
  Psychology,
  ExpandMore
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { ChatMode } from '../../../../shared';

// スタイル設定
const ModeContainer = styled(Box)(({ theme }) => ({
  display: 'none', // デフォルトでは表示しない
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  margin: theme.spacing(0, 2, 2, 2),
  boxShadow: '0 3px 10px rgba(156, 39, 176, 0.15)',
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 10,
  transition: 'transform 0.3s ease-in-out',
  transform: 'translateY(100%)',
  '&.visible': {
    transform: 'translateY(0)',
    display: 'flex',
  }
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  fontWeight: 500,
}));

const ModeIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0.5, 1.5),
  borderRadius: 20,
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(5px)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  position: 'absolute',
  bottom: 80,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1,
  '& .MuiTypography-root': {
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1rem',
    marginRight: 4,
  },
}));

// コンポーネントのプロパティ
interface ChatModeSelectorProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onBack?: () => void;
  onClearChat: () => void;
  onSaveChat?: () => void;
}

const ChatModeSelector: React.FC<ChatModeSelectorProps> = ({
  currentMode,
  onModeChange,
  onBack,
  onClearChat,
  onSaveChat
}) => {
  // 状態管理
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [modeSelectorVisible, setModeSelectorVisible] = useState(false);
  const isMenuOpen = Boolean(menuAnchorEl);
  
  // メニューハンドラー
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleClearChat = () => {
    handleMenuClose();
    onClearChat();
  };
  
  const handleSaveChat = () => {
    handleMenuClose();
    if (onSaveChat) {
      onSaveChat();
    }
  };
  
  // モード選択パネルの表示/非表示切り替え
  
  // モード選択を表示/非表示
  const toggleModeSelector = () => {
    setModeSelectorVisible(!modeSelectorVisible);
  };
  
  // 現在のモードに応じたアイコンを選択
  const getModeIcon = () => {
    switch (currentMode) {
      case ChatMode.PERSONAL:
        return <Person fontSize="small" />;
      case ChatMode.TEAM_MEMBER:
        return <People fontSize="small" />;
      case ChatMode.TEAM_GOAL:
        return <Flag fontSize="small" />;
      default:
        return <Person fontSize="small" />;
    }
  };
  
  // 現在のモードに応じたテキストを選択
  const getModeText = () => {
    switch (currentMode) {
      case ChatMode.PERSONAL:
        // 運勢相談モードは無効化中だが、初期表示のためのテキストは維持
        return "AI相談"; // 「運勢相談」から「AI相談」に変更
      case ChatMode.TEAM_MEMBER:
        return "相性相談";
      case ChatMode.TEAM_GOAL:
        return "目標相談";
      default:
        return "AI相談"; // デフォルトテキストも変更
    }
  };

  return (
    <>
      {/* 現在のモードを示すインジケーター */}
      <ModeIndicator onClick={toggleModeSelector}>
        {getModeIcon()}
        <Typography variant="caption" color="textPrimary">
          {getModeText()}
        </Typography>
        <ExpandMore fontSize="small" sx={{ ml: 0.5 }} />
      </ModeIndicator>
      
      {/* モード選択パネル（クリックで表示） */}
      <ModeContainer className={modeSelectorVisible ? 'visible' : ''}>
        {/* 戻るボタン */}
        {onBack && (
          <Tooltip title="戻る">
            <IconButton onClick={onBack} size="small" sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
          </Tooltip>
        )}
        
        {/* モード選択チップ */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexWrap: 'nowrap', overflowX: 'auto' }}>
          {/* 運勢相談モードは一時的に無効化
          <StyledChip
            icon={<Person />}
            label="運勢相談"
            color={currentMode === ChatMode.PERSONAL ? 'primary' : 'default'}
            variant={currentMode === ChatMode.PERSONAL ? 'filled' : 'outlined'}
            onClick={() => {
              onModeChange(ChatMode.PERSONAL);
              setModeSelectorVisible(false);
            }}
            clickable
          />
          */}
          
          <StyledChip
            icon={<People />}
            label="相性相談"
            color={currentMode === ChatMode.TEAM_MEMBER ? 'primary' : 'default'}
            variant={currentMode === ChatMode.TEAM_MEMBER ? 'filled' : 'outlined'}
            onClick={() => {
              onModeChange(ChatMode.TEAM_MEMBER);
              setModeSelectorVisible(false);
            }}
            clickable
          />
          
          <StyledChip
            icon={<Flag />}
            label="目標相談"
            color={currentMode === ChatMode.TEAM_GOAL ? 'primary' : 'default'}
            variant={currentMode === ChatMode.TEAM_GOAL ? 'filled' : 'outlined'}
            onClick={() => {
              onModeChange(ChatMode.TEAM_GOAL);
              setModeSelectorVisible(false);
            }}
            clickable
          />
        </Box>
        
        {/* メニューボタン */}
        <Tooltip title="オプション">
          <IconButton 
            onClick={handleMenuOpen}
            size="small"
            sx={{ ml: 1 }}
          >
            <MoreVert />
          </IconButton>
        </Tooltip>
      </ModeContainer>
      
      {/* SpeedDial代わりのFAB */}
      <Fab
        color="primary"
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' }, // モバイルのみ表示
        }}
        onClick={toggleModeSelector}
      >
        <Psychology />
      </Fab>
      
      {/* オプションメニュー */}
      <Menu
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {onSaveChat && (
          <MenuItem onClick={handleSaveChat}>
            <ListItemIcon>
              <Save fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="会話を保存" />
          </MenuItem>
        )}
        
        <MenuItem onClick={handleClearChat}>
          <ListItemIcon>
            <DeleteSweep fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="会話をクリア" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default ChatModeSelector;