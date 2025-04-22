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
import apiService from '../../services/api.service';
import { TEAM } from '../../../../shared';

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
    let intervalId: NodeJS.Timeout;
    
    const fetchMemberCard = async () => {
      try {
        setLoading(true);
        // 初回はキャッシュありで取得
        const data = await teamService.getMemberCard(teamId, userId, false);
        
        // カルテ生成中の場合
        if (data.isGenerating) {
          setGenerating(true);
          console.log('カルテ生成中状態を検出しました - ポーリングを開始します');
          
          // カルテが生成されるまで5秒ごとにポーリング
          intervalId = setInterval(async () => {
            try {
              console.log('カルテ生成状況を確認中...');
              // ポーリング時はキャッシュを無効化して最新データを取得
              const updatedData = await teamService.getMemberCard(teamId, userId, true);
              
              // 生成完了した場合
              if (!updatedData.isGenerating) {
                console.log('カルテ生成が完了しました:', updatedData);
                setCardData(updatedData);
                setGenerating(false);
                setLoading(false);
                clearInterval(intervalId);
              } else {
                console.log('カルテはまだ生成中です');
              }
            } catch (pollingErr) {
              console.error('カルテポーリング中のエラー:', pollingErr);
              // エラーが発生しても即座に停止せず、次のポーリングを待つ
            }
          }, 5000);
        } else {
          console.log('カルテはすでに生成されています:', data);
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
      // 最初にキャッシュをクリアしてから取得開始
      const clearCacheAndFetch = async () => {
        try {
          await apiService.clearCache(TEAM.GET_MEMBER_CARD(teamId, userId));
          await fetchMemberCard();
        } catch (error) {
          console.error('キャッシュクリア中にエラーが発生しました:', error);
          await fetchMemberCard();
        }
      };
      
      clearCacheAndFetch();
    }
    
    // コンポーネントのアンマウント時にインターバルをクリア
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('ポーリングを停止しました');
      }
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

    if (error && !isDialog) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
            メンバーカルテを表示できません。メンバーが四柱推命プロフィールを登録していない可能性があります。
          </Typography>
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
          <Typography variant="body2" sx={{ mt: 2 }}>
            メンバーの四柱推命プロフィールが登録されていない可能性があります。
          </Typography>
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
          {error && !loading && !generating && (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography color="error">
                {error}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
                メンバーカルテを表示できません。メンバーが四柱推命プロフィールを登録していない可能性があります。
              </Typography>
              <Button
                variant="contained"
                onClick={onClose}
              >
                閉じる
              </Button>
            </Box>
          )}
          {!error && renderContent()}
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