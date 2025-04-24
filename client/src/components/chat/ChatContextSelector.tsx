import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Avatar,
  Typography,
  CircularProgress,
  styled
} from '@mui/material';
import { ContextType, IContextItem } from '../../../../shared';
import { chatService } from '../../services/chat.service';

// スタイル設定
const SelectorContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  bottom: 65, // 入力エリアの高さ + 余白
  left: 16,
  width: 280,
  maxWidth: 'calc(100% - 32px)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  borderRadius: 8,
  overflow: 'hidden',
  zIndex: 1200,
}));

const TabPanel = styled(Box)({
  maxHeight: 300,
  overflowY: 'auto',
});

const EmptyMessage = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const ContextTab = styled(Tab)(({ theme }) => ({
  minWidth: 'auto',
  flex: 1,
  fontWeight: 500,
  fontSize: '0.875rem',
}));

// コンポーネントのプロパティ
interface ChatContextSelectorProps {
  onSelectContext: (context: IContextItem) => void;
  onClose: () => void;
  activeContextIds: string[]; // 既に選択中のコンテキストID
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`context-tabpanel-${index}`}
      aria-labelledby={`context-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

const ChatContextSelector: React.FC<ChatContextSelectorProps> = ({
  onSelectContext,
  onClose,
  activeContextIds
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [availableContexts, setAvailableContexts] = useState<{
    self?: IContextItem;
    fortune?: IContextItem[];
    friends?: IContextItem[];
    teams?: IContextItem[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableContexts = async () => {
      try {
        setLoading(true);
        const contexts = await chatService.getAvailableContexts();
        setAvailableContexts(contexts);
      } catch (error: any) {
        console.error('Error fetching contexts:', error);
        setError(error.message || 'コンテキスト情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableContexts();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSelectContext = (context: IContextItem) => {
    onSelectContext(context);
    onClose();
  };

  // コンテキストアイテムがすでに選択されているかチェック
  const isContextSelected = (id: string) => {
    return activeContextIds.includes(id);
  };

  // タブに応じたコンテキストリストを取得
  const getContextsByTab = (): IContextItem[] => {
    switch (tabValue) {
      case 0: // 友達
        return availableContexts.friends || [];
      case 1: // 運勢
        return availableContexts.fortune || [];
      case 2: // チーム
        return availableContexts.teams || [];
      default:
        return [];
    }
  };

  // コンテキストタイプに基づいて背景色を取得
  const getColorByType = (type: ContextType): string => {
    switch (type) {
      case ContextType.SELF:
        return '#9c27b0'; // 紫色
      case ContextType.FRIEND:
        return '#2196f3'; // 青色
      case ContextType.FORTUNE:
        return '#ff9800'; // オレンジ色
      case ContextType.TEAM:
        return '#4caf50'; // 緑色
      case ContextType.TEAM_GOAL:
        return '#009688'; // ティール色
      default:
        return '#9e9e9e'; // グレー
    }
  };

  return (
    <SelectorContainer onClick={(e) => e.stopPropagation()}>
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        variant="fullWidth"
        textColor="primary"
        indicatorColor="primary"
      >
        <ContextTab label="友達" />
        <ContextTab label="運勢" />
        <ContextTab label="チーム" />
      </Tabs>

      <TabPanel>
        <CustomTabPanel value={tabValue} index={tabValue}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <EmptyMessage>
              <Typography variant="body2" color="error">{error}</Typography>
            </EmptyMessage>
          ) : (
            <List>
              {getContextsByTab().length > 0 ? (
                getContextsByTab().map((context) => (
                  <ListItem
                    button
                    key={context.id}
                    onClick={() => handleSelectContext(context)}
                    disabled={isContextSelected(context.id)}
                    sx={{
                      opacity: isContextSelected(context.id) ? 0.5 : 1,
                      '&:hover': {
                        backgroundColor: `${getColorByType(context.type)}10`,
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: getColorByType(context.type),
                          width: 36,
                          height: 36,
                        }}
                      >
                        <span className="material-icons">{context.iconType}</span>
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={context.name}
                      secondary={isContextSelected(context.id) ? '選択中' : null}
                    />
                  </ListItem>
                ))
              ) : (
                <EmptyMessage>
                  <Typography variant="body2">利用可能な項目がありません</Typography>
                </EmptyMessage>
              )}
            </List>
          )}
        </CustomTabPanel>
      </TabPanel>
    </SelectorContainer>
  );
};

export default ChatContextSelector;