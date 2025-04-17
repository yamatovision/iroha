import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, Avatar, LinearProgress, Chip, Divider, Skeleton, useTheme } from '@mui/material';
import { WaterDrop, Whatshot, Park, Public, Diamond, EmojiEvents } from '@mui/icons-material';
import fortuneService from '../../services/fortune.service';
import { useAuth } from '../../contexts/AuthContext';
import './styles.css';

interface TeamFortuneRankingProps {
  teamId: string;
  date?: string;
}

// 五行属性のアイコンマッピング
const elementIcons: { [key: string]: React.ReactNode } = {
  water: <WaterDrop />,
  fire: <Whatshot />,
  wood: <Park />,
  earth: <Public />,
  metal: <Diamond />
};

const TeamFortuneRanking: React.FC<TeamFortuneRankingProps> = ({ teamId, date }) => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rankingData, setRankingData] = useState<{
    ranking: Array<{
      userId: string;
      displayName: string;
      jobTitle?: string;
      elementAttribute?: string;
      score: number;
    }>;
    userRank?: number;
  } | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      if (!teamId) return;

      try {
        setLoading(true);
        const data = await fortuneService.getTeamFortuneRanking(teamId);
        setRankingData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch team fortune ranking:', err);
        setError('チーム運勢ランキングの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [teamId, date]);

  // スコアカテゴリに基づく色を取得
  const getScoreColor = (score: number): string => {
    const category = fortuneService.getScoreCategory(score);
    switch (category) {
      case 'excellent': return 'var(--excellent-color, #4caf50)';
      case 'good': return 'var(--good-color, #8bc34a)';
      case 'neutral': return 'var(--neutral-color, #ffc107)';
      case 'poor': return 'var(--poor-color, #ff9800)';
      case 'bad': return 'var(--bad-color, #f44336)';
      default: return 'var(--neutral-color, #ffc107)';
    }
  };

  // 五行属性に基づく色を取得
  const getElementColor = (element?: string): string => {
    if (!element) return 'var(--water-color)';
    
    switch (element) {
      case 'water': return 'var(--water-color)';
      case 'fire': return 'var(--fire-color)';
      case 'wood': return 'var(--wood-color)';
      case 'earth': return 'var(--earth-color)';
      case 'metal': return 'var(--metal-color)';
      default: return 'var(--water-color)';
    }
  };

  // 五行属性のアイコンを取得
  const getElementIcon = (element?: string) => {
    if (!element) return elementIcons.water;
    return elementIcons[element] || elementIcons.water;
  };

  // 順位に応じたバッジテキストと色を取得
  const getRankBadge = (rank: number): { text: string, color: string } => {
    if (rank === 1) return { text: '1st', color: 'gold' };
    if (rank === 2) return { text: '2nd', color: 'silver' };
    if (rank === 3) return { text: '3rd', color: 'peru' };
    return { text: `${rank}th`, color: 'var(--primary-light)' };
  };

  // 日付のフォーマット
  const formattedDate = date ? 
    fortuneService.formatDate(date) : 
    fortuneService.formatDate(new Date());

  const renderSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {[...Array(5)].map((_, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ width: '100%' }}>
            <Skeleton variant="text" sx={{ width: '60%' }} />
            <Skeleton variant="rectangular" width="100%" height={10} />
          </Box>
          <Skeleton variant="circular" width={40} height={40} sx={{ ml: 2 }} />
        </Box>
      ))}
    </Box>
  );

  if (loading) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 0,
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          overflow: 'hidden',
          position: 'relative',
          mb: 3,
          maxWidth: '600px',
          mx: 'auto'
        }}
      >
        <Box
          sx={{
            p: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
            チーム運勢ランキング
          </Typography>
          <Typography variant="body2">
            {formattedDate}
          </Typography>
        </Box>
        {renderSkeleton()}
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          mb: 3,
          maxWidth: '600px',
          mx: 'auto'
        }}
      >
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Typography variant="body2">
          後ほど再度お試しください。
        </Typography>
      </Paper>
    );
  }

  if (!rankingData || rankingData.ranking.length === 0) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          mb: 3,
          maxWidth: '600px',
          mx: 'auto'
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          ランキングデータがありません
        </Typography>
        <Typography variant="body2">
          チームメンバーの運勢データが不足しているか、まだ生成されていません。
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 0,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        overflow: 'hidden',
        position: 'relative',
        mb: 3,
        maxWidth: '600px',
        mx: 'auto'
      }}
      className="animate-on-load"
    >
      {/* ヘッダー部分 */}
      <Box
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <EmojiEvents sx={{ mr: 1 }} /> チーム運勢ランキング
            </Typography>
            {rankingData.userRank && (
              <Chip 
                label={`あなたの順位: ${rankingData.userRank}位`}
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.25)', 
                  color: '#fff',
                  fontWeight: 'bold'
                }}
              />
            )}
          </Box>
          
          <Typography variant="body2">
            {formattedDate}
          </Typography>
        </Box>
        
        {/* 背景装飾 */}
        <Box 
          sx={{ 
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            zIndex: 1
          }} 
        />
        
        <Box 
          sx={{ 
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            zIndex: 1
          }} 
        />
      </Box>
      
      {/* ランキングリスト */}
      <Box sx={{ pt: 2, px: 3, pb: 3 }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 'bold', 
            color: theme.palette.text.secondary,
            mb: 2
          }}
        >
          本日のチームメンバー運勢ランキング
        </Typography>
        
        {rankingData.ranking.map((member, index) => {
          const rank = index + 1;
          const rankBadge = getRankBadge(rank);
          const isCurrentUser = userProfile?.id === member.userId;
          const elementColor = getElementColor(member.elementAttribute);
          const scoreColor = getScoreColor(member.score);
          
          return (
            <Box
              key={member.userId}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                p: 2,
                borderRadius: 2,
                backgroundColor: isCurrentUser ? 'rgba(103, 58, 183, 0.05)' : 'transparent',
                border: isCurrentUser ? '1px solid rgba(103, 58, 183, 0.2)' : '1px solid rgba(0, 0, 0, 0.05)',
                position: 'relative',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              {/* 順位バッジ */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -10,
                  left: -10,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: rankBadge.color,
                  color: rank > 3 ? 'white' : 'black',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  zIndex: 2
                }}
              >
                {rank}
              </Box>
              
              {/* アバター */}
              <Avatar
                sx={{
                  mr: 2,
                  bgcolor: elementColor,
                  width: 40,
                  height: 40,
                  color: '#fff',
                  fontWeight: 'bold'
                }}
              >
                {member.displayName?.charAt(0) || '?'}
              </Avatar>
              
              {/* メンバー情報 */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: isCurrentUser ? 'bold' : 'medium' }}>
                    {member.displayName}
                    {isCurrentUser && (
                      <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: theme.palette.primary.main }}>
                        (あなた)
                      </span>
                    )}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {member.elementAttribute && (
                    <Chip
                      icon={getElementIcon(member.elementAttribute) as React.ReactElement}
                      label={member.elementAttribute.toUpperCase()}
                      size="small"
                      sx={{
                        bgcolor: `${elementColor}20`,
                        color: elementColor,
                        mr: 1,
                        height: 24,
                        '& .MuiChip-icon': { color: elementColor, fontSize: '0.9rem' }
                      }}
                    />
                  )}
                  
                  {member.jobTitle && (
                    <Typography variant="caption" color="text.secondary">
                      {member.jobTitle}
                    </Typography>
                  )}
                </Box>
                
                {/* スコアバー */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={member.score}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(0, 0, 0, 0.05)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: scoreColor,
                          borderRadius: 4
                        }
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      color: scoreColor
                    }}
                  >
                    {member.score}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
          運勢スコアは四柱推命に基づく本日の運勢値です。ランキングは自動的に更新されます。
        </Typography>
      </Box>
    </Paper>
  );
};

export default TeamFortuneRanking;