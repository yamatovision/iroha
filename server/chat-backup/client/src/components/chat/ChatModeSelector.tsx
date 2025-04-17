import React from 'react';
import { Box, Chip, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { 
  Person, 
  People, 
  Flag, 
  ArrowBack, 
  MoreVert, 
  DeleteSweep, 
  Save
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { ChatMode } from '../../../../shared';

// スタイル設定
const ModeContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.primary.light,
  borderBottom: `1px solid ${theme.palette.divider}`,
  overflowX: 'auto',
  whiteSpace: 'nowrap',
  '&::-webkit-scrollbar': {
    display: 'none'
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  fontWeight: 500,
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
  // メニューの状態管理
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  
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

  return (
    <>
      <ModeContainer>
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
          <StyledChip
            icon={<Person />}
            label="運勢相談"
            color={currentMode === ChatMode.PERSONAL ? 'primary' : 'default'}
            variant={currentMode === ChatMode.PERSONAL ? 'filled' : 'outlined'}
            onClick={() => onModeChange(ChatMode.PERSONAL)}
            clickable
          />
          
          <StyledChip
            icon={<People />}
            label="相性相談"
            color={currentMode === ChatMode.TEAM_MEMBER ? 'primary' : 'default'}
            variant={currentMode === ChatMode.TEAM_MEMBER ? 'filled' : 'outlined'}
            onClick={() => onModeChange(ChatMode.TEAM_MEMBER)}
            clickable
          />
          
          <StyledChip
            icon={<Flag />}
            label="目標相談"
            color={currentMode === ChatMode.TEAM_GOAL ? 'primary' : 'default'}
            variant={currentMode === ChatMode.TEAM_GOAL ? 'filled' : 'outlined'}
            onClick={() => onModeChange(ChatMode.TEAM_GOAL)}
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