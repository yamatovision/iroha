import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton
} from '@mui/material';
import { Close as CloseIcon, WaterDrop, Whatshot, Park, Public, Diamond } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import teamService from '../../services/team.service';

// 五行属性のアイコンマッピング
const elementIcons: { [key: string]: React.ReactNode } = {
  water: <WaterDrop />,
  fire: <Whatshot />,
  wood: <Park />,
  earth: <Public />,
  metal: <Diamond />
};

// 五行属性の色マッピング
const elementColors: { [key: string]: string } = {
  water: '#1e88e5',
  fire: '#e53935',
  wood: '#43a047',
  earth: '#ff8f00',
  metal: '#fdd835'
};

interface MemberCardViewProps {
  teamId: string;
  userId: string;
  onClose?: () => void;
  isDialog?: boolean;
}

const MemberCardView: React.FC<MemberCardViewProps> = ({ teamId, userId, onClose, isDialog = false }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<any>(null);

  useEffect(() => {
    const fetchMemberCard = async () => {
      try {
        setLoading(true);
        const data = await teamService.getMemberCard(teamId, userId);
        
        // カルテ生成中の場合
        if (data.isGenerating) {
          setGenerating(true);
          
          // カルテが生成されるまで5秒ごとにポーリング
          const intervalId = setInterval(async () => {
            try {
              console.log('カルテ生成状況を確認中...');
              const updatedData = await teamService.getMemberCard(teamId, userId);
              
              // 生成完了した場合
              if (!updatedData.isGenerating) {
                setCardData(updatedData);
                setGenerating(false);
                setLoading(false);
                clearInterval(intervalId);
              }
            } catch (pollingErr) {
              console.error('カルテポーリング中のエラー:', pollingErr);
              // エラーが発生しても即座に停止せず、次のポーリングを待つ
            }
          }, 5000);
          
          // コンポーネントのクリーンアップ時にインターバルをクリア
          return () => clearInterval(intervalId);
        } else {
          setCardData(data);
          setGenerating(false);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch member card:', err);
        setError('メンバーカルテの取得に失敗しました');
      } finally {
        if (!generating) {
          setLoading(false);
        }
      }
    };

    if (teamId && userId) {
      fetchMemberCard();
    }
    
    // コンポーネントのアンマウント時にクリーンアップ
    return () => {
      // このスコープの外でインターバルが設定されてる場合は、ここでは何もしない
    };
  }, [teamId, userId]);

  const renderContent = () => {
    if (loading && !generating) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (generating) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6">カルテを生成中です</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            AIが四柱推命データに基づいてカルテを生成しています。
            このプロセスには数分かかることがあります。
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()} 
            sx={{ mt: 2 }}
          >
            再試行
          </Button>
        </Box>
      );
    }

    if (!cardData) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>データが見つかりません</Typography>
        </Box>
      );
    }

    // 基本プロファイル情報
    const { userInfo, cardContent, lastUpdated } = cardData;
    const element = userInfo.mainElement || 'water';
    const elementColor = elementColors[element] || '#1e88e5';
    const elementIcon = elementIcons[element] || <WaterDrop />;

    return (
      <Box>
        {/* プロフィールヘッダー */}
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: `${elementColor}20`, 
            borderRadius: isDialog ? 0 : '4px 4px 0 0',
            display: 'flex',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Box 
            sx={{ 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              bgcolor: elementColor,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              mr: 2
            }}
          >
            {userInfo.avatarInitial}
          </Box>
          <Box>
            <Typography variant="h6">{userInfo.displayName}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                icon={elementIcon as any} 
                label={element.toUpperCase()} 
                size="small" 
                sx={{ 
                  bgcolor: elementColor, 
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' }
                }} 
              />
              <Typography variant="body2">{userInfo.role}</Typography>
            </Box>
          </Box>
        </Box>

        {/* カルテ内容（マークダウン） */}
        <Box sx={{ p: 2 }}>
          <ReactMarkdown className="markdown-content">
            {cardContent}
          </ReactMarkdown>
        </Box>
        
        {/* 更新日時 */}
        <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Typography variant="caption" color="text.secondary">
            最終更新: {new Date(lastUpdated).toLocaleString('ja-JP')}
          </Typography>
        </Box>
      </Box>
    );
  };

  // ダイアログとして表示する場合
  if (isDialog) {
    return (
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          メンバーカルテ
          {onClose && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {renderContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>閉じる</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // 通常のコンポーネントとして表示する場合
  return (
    <Paper elevation={2}>
      {renderContent()}
    </Paper>
  );
};

export default MemberCardView;