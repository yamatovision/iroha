import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Divider,
  Paper,
  CircularProgress,
  styled
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { ContextType, IContextItem } from '../../../../shared';
import { chatService } from '../../services/chat.service';

// スタイル設定
const DetailSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  backgroundColor: '#f9f9f9',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
  fontWeight: 500,
  '& .material-icons': {
    marginRight: theme.spacing(1),
    fontSize: '1.2rem',
  },
}));

const DetailItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  margin: theme.spacing(0.5, 0),
}));

const DetailLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  minWidth: 100,
  color: theme.palette.text.primary,
}));

const DetailValue = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// コンポーネントのプロパティ
interface ChatContextDisplayProps {
  open: boolean;
  onClose: () => void;
  contexts: IContextItem[];
}

const ChatContextDisplay: React.FC<ChatContextDisplayProps> = ({
  open,
  onClose,
  contexts
}) => {
  const [detailedContexts, setDetailedContexts] = useState<IContextItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && contexts.length > 0) {
      const fetchDetails = async () => {
        try {
          setLoading(true);
          
          // 現在のすべてのコンテキストについて詳細情報を取得
          const detailPromises = contexts.map(async (context) => {
            try {
              // 自己情報は既に詳細情報が含まれていることが多いのでそのまま使用
              if (context.type === ContextType.SELF && context.payload) {
                return context;
              }
              
              // それ以外のコンテキストは詳細を取得
              const detailedContext = await chatService.getContextDetail(context.type, context.id);
              return detailedContext;
            } catch (error) {
              console.warn(`Failed to fetch details for context ${context.id}:`, error);
              // エラー時は元のコンテキスト情報をそのまま使用
              return context;
            }
          });
          
          const results = await Promise.all(detailPromises);
          setDetailedContexts(results);
        } catch (error: any) {
          console.error('Error fetching context details:', error);
          setError(error.message || 'コンテキスト詳細の取得に失敗しました');
        } finally {
          setLoading(false);
        }
      };
      
      fetchDetails();
    }
  }, [open, contexts]);

  // コンテキストタイプに基づいて色を取得
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

  // コンテキストタイプに基づいて表示タイトルを取得
  const getContextTypeTitle = (type: ContextType): string => {
    switch (type) {
      case ContextType.SELF:
        return 'ユーザー情報';
      case ContextType.FRIEND:
        return '友達情報';
      case ContextType.FORTUNE:
        return '運勢情報';
      case ContextType.TEAM:
        return 'チーム情報';
      case ContextType.TEAM_GOAL:
        return 'チーム目標';
      default:
        return 'その他情報';
    }
  };
  
  // ペイロードの内容に基づいて詳細情報をレンダリング
  const renderContextDetails = (context: IContextItem) => {
    const payload = context.payload || {};
    
    switch (context.type) {
      case ContextType.SELF:
        return (
          <>
            <DetailItem>
              <DetailLabel variant="body2">名前：</DetailLabel>
              <DetailValue variant="body2">{payload.displayName || '不明'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel variant="body2">五行属性：</DetailLabel>
              <DetailValue variant="body2">{payload.elementAttribute || '不明'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel variant="body2">日主：</DetailLabel>
              <DetailValue variant="body2">{payload.dayMaster || '不明'}</DetailValue>
            </DetailItem>
            {payload.kakukyoku && (
              <DetailItem>
                <DetailLabel variant="body2">格局：</DetailLabel>
                <DetailValue variant="body2">
                  {payload.kakukyoku.type || '不明'} 
                  ({payload.kakukyoku.strength === 'strong' ? '身強' : 
                    payload.kakukyoku.strength === 'weak' ? '身弱' : '中和'})
                </DetailValue>
              </DetailItem>
            )}
            {payload.yojin && (
              <DetailItem>
                <DetailLabel variant="body2">用神：</DetailLabel>
                <DetailValue variant="body2">
                  {payload.yojin.tenGod || '不明'} ({payload.yojin.element || '不明'})
                </DetailValue>
              </DetailItem>
            )}
          </>
        );
        
      case ContextType.FRIEND:
        return (
          <>
            <DetailItem>
              <DetailLabel variant="body2">名前：</DetailLabel>
              <DetailValue variant="body2">{payload.displayName || context.name || '不明'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel variant="body2">五行属性：</DetailLabel>
              <DetailValue variant="body2">{payload.elementAttribute || '不明'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel variant="body2">日主：</DetailLabel>
              <DetailValue variant="body2">{payload.dayMaster || '不明'}</DetailValue>
            </DetailItem>
            {payload.jobTitle && (
              <DetailItem>
                <DetailLabel variant="body2">役割：</DetailLabel>
                <DetailValue variant="body2">{payload.jobTitle}</DetailValue>
              </DetailItem>
            )}
          </>
        );
        
      case ContextType.FORTUNE:
        return (
          <>
            <DetailItem>
              <DetailLabel variant="body2">日付：</DetailLabel>
              <DetailValue variant="body2">
                {payload.date ? new Date(payload.date).toLocaleDateString('ja-JP') : '今日'}
              </DetailValue>
            </DetailItem>
            {payload.dayPillar && (
              <DetailItem>
                <DetailLabel variant="body2">日柱：</DetailLabel>
                <DetailValue variant="body2">
                  {payload.dayPillar.heavenlyStem}{payload.dayPillar.earthlyBranch}
                </DetailValue>
              </DetailItem>
            )}
            {payload.score !== undefined && (
              <DetailItem>
                <DetailLabel variant="body2">運勢スコア：</DetailLabel>
                <DetailValue variant="body2">{payload.score}/100</DetailValue>
              </DetailItem>
            )}
            {payload.luckyItems && (
              <>
                <DetailItem>
                  <DetailLabel variant="body2">ラッキーカラー：</DetailLabel>
                  <DetailValue variant="body2">{payload.luckyItems.color || '不明'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel variant="body2">ラッキーアイテム：</DetailLabel>
                  <DetailValue variant="body2">{payload.luckyItems.item || '不明'}</DetailValue>
                </DetailItem>
              </>
            )}
          </>
        );
        
      case ContextType.TEAM:
      case ContextType.TEAM_GOAL:
        return (
          <>
            <DetailItem>
              <DetailLabel variant="body2">チーム名：</DetailLabel>
              <DetailValue variant="body2">{payload.name || context.name || '不明'}</DetailValue>
            </DetailItem>
            {payload.description && (
              <DetailItem>
                <DetailLabel variant="body2">説明：</DetailLabel>
                <DetailValue variant="body2">{payload.description}</DetailValue>
              </DetailItem>
            )}
            {payload.goal && (
              <DetailItem>
                <DetailLabel variant="body2">目標：</DetailLabel>
                <DetailValue variant="body2">{payload.goal}</DetailValue>
              </DetailItem>
            )}
            {payload.memberCount !== undefined && (
              <DetailItem>
                <DetailLabel variant="body2">メンバー数：</DetailLabel>
                <DetailValue variant="body2">{payload.memberCount}人</DetailValue>
              </DetailItem>
            )}
          </>
        );
        
      default:
        return (
          <DetailItem>
            <DetailValue variant="body2">詳細情報がありません</DetailValue>
          </DetailItem>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <Typography variant="h6">現在のコンテキスト情報</Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : (
          <>
            {detailedContexts.map((context, index) => (
              <DetailSection key={`${context.type}-${context.id}`} elevation={0}>
                <SectionTitle variant="subtitle1" color={getColorByType(context.type)}>
                  <span className="material-icons">{context.iconType}</span>
                  {getContextTypeTitle(context.type)}: {context.name}
                </SectionTitle>
                <Divider sx={{ mb: 1.5 }} />
                {renderContextDetails(context)}
              </DetailSection>
            ))}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChatContextDisplay;