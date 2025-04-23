import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, Avatar, LinearProgress, Chip, Divider, Skeleton, useTheme } from '@mui/material';
import { WaterDrop, Whatshot, Park, Public, Diamond, EmojiEvents, Star as StarIcon } from '@mui/icons-material';
import fortuneService from '../../services/fortune.service';
import { useAuth } from '../../contexts/AuthContext';
import './styles.css';

interface TeamFortuneRankingProps {
  teamId: string;
  date?: string;
}

// 簡略化したTeamFortuneRankingコンポーネント
const TeamFortuneRanking: React.FC<TeamFortuneRankingProps> = ({ teamId, date }) => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rankingData, setRankingData] = useState<any>(null);

  // 日付のフォーマット
  const formattedDate = date ? 
    fortuneService.formatDate(date) : 
    fortuneService.formatDate(new Date());

  // 五行属性のアイコンマッピング
  const elementIcons: { [key: string]: React.ReactNode } = {
    water: <WaterDrop />,
    fire: <Whatshot />,
    wood: <Park />,
    earth: <Public />,
    metal: <Diamond />
  };

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
      case 'water': return '#7d94a6'; // 水（黒/紺系）
      case 'fire': return '#e67373'; // 火（赤系）
      case 'wood': return '#94b8eb'; // 木（青/緑系）
      case 'earth': return '#f2d06b'; // 土（黄系）
      case 'metal': return '#f5f5f5'; // 金（薄いグレー系に変更）
      default: return '#7d94a6';
    }
  };

  // 五行属性のテキスト色を取得
  const getElementTextColor = (element?: string): string => {
    if (element === 'water') return '#ffffff';
    return '#000000';
  };

  // 五行属性のアイコンを取得
  const getElementIcon = (element?: string) => {
    if (!element) return elementIcons.water;
    return elementIcons[element] || elementIcons.water;
  };

  // ランキングデータを取得
  useEffect(() => {
    const fetchRanking = async () => {
      if (!teamId) return;

      try {
        setLoading(true);
        const data = await fortuneService.getTeamFortuneRanking(teamId);
        setRankingData(data);
        setError(null);
      } catch (err) {
        console.error('TeamFortuneRanking: データ取得エラー', err);
        setError('ランキングデータを取得できませんでした');
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [teamId, date]);

  // ローディング中の表示
  if (loading) {
    return (
      <div className="section" style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        padding: '24px',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        marginBottom: '32px'
      }}>
        <div className="section-title" style={{
          fontSize: '1.3rem',
          fontWeight: 600,
          marginBottom: '16px',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          letterSpacing: '0.01em'
        }}>
          <span className="material-icons" style={{ marginRight: '12px', color: 'var(--primary-light)', fontSize: '1.5rem' }}>
            leaderboard
          </span>
          メンバー運勢ランキング
        </div>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ p: 2 }}>
          {[...Array(3)].map((_, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ width: '100%' }}>
                <Skeleton variant="text" sx={{ width: '60%' }} />
                <Skeleton variant="rectangular" width="100%" height={10} />
              </Box>
            </Box>
          ))}
        </Box>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="section" style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        padding: '24px',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        marginBottom: '32px'
      }}>
        <div className="section-title" style={{
          fontSize: '1.3rem',
          fontWeight: 600,
          marginBottom: '16px',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          letterSpacing: '0.01em'
        }}>
          <span className="material-icons" style={{ marginRight: '12px', color: 'var(--primary-light)', fontSize: '1.5rem' }}>
            leaderboard
          </span>
          メンバー運勢ランキング
        </div>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Typography variant="body2">
            後ほど再度お試しください。
          </Typography>
        </Box>
      </div>
    );
  }

  // ランキングデータが存在しない場合はモックデータを使用
  const mockRanking = [
    { userId: '1', displayName: 'テストユーザー1', score: 85, elementAttribute: 'fire', isCurrentUser: true },
    { userId: '2', displayName: 'テストユーザー2', score: 75, elementAttribute: 'water', isCurrentUser: false }
  ];

  // 実際のデータかモックデータを使用
  const ranking = (rankingData && rankingData.data && rankingData.data.ranking && rankingData.data.ranking.length > 0) 
    ? rankingData.data.ranking 
    : mockRanking;

  return (
    <div className="section" style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      padding: '24px',
      overflow: 'hidden',
      position: 'relative',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      marginBottom: '32px'
    }}>
      <div className="section-title" style={{
        fontSize: '1.3rem',
        fontWeight: 600,
        marginBottom: '16px',
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        letterSpacing: '0.01em'
      }}>
        <span className="material-icons" style={{ marginRight: '12px', color: 'var(--primary-light)', fontSize: '1.5rem' }}>
          leaderboard
        </span>
        メンバー運勢ランキング
      </div>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 'medium' }}>
          {formattedDate}の運勢ランキング
        </Typography>
        
        {ranking.map((member: any, index: number) => {
          const rank = index + 1;
          const isCurrentUser = userProfile?.id === member.userId;
          const elementColor = getElementColor(member.elementAttribute);
          const scoreColor = getScoreColor(member.score);
          
          return (
            <Box
              key={member.userId || index}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                p: 2,
                borderRadius: 2,
                backgroundColor: isCurrentUser ? 'rgba(103, 58, 183, 0.05)' : 'transparent',
                border: isCurrentUser ? '1px solid rgba(103, 58, 183, 0.2)' : '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* ランク表示 */}
              <Box
                sx={{
                  minWidth: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  color: rank <= 3 ? theme.palette.primary.main : theme.palette.text.secondary
                }}
              >
                {rank}
              </Box>
              
              {/* アバター */}
              <Avatar
                sx={{
                  bgcolor: elementColor,
                  color: getElementTextColor(member.elementAttribute),
                  mr: 2,
                  border: member.elementAttribute === 'metal' ? '1px solid rgba(0, 0, 0, 0.1)' : 'none'
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
                
                {/* 属性表示 */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {member.elementAttribute && member.elementAttribute === 'metal' ? (
                    <Box component="span" sx={{ 
                      px: 1.5, 
                      py: 0.5, 
                      borderRadius: 10,
                      bgcolor: '#f5f5f5',
                      color: '#000000',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      mr: 1,
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}>
                      <StarIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem', color: '#000000' }} />
                      金
                    </Box>
                  ) : (
                    <Chip
                      icon={getElementIcon(member.elementAttribute) as React.ReactElement}
                      label={member.elementAttribute === 'water' ? '水' : 
                              member.elementAttribute === 'fire' ? '火' : 
                              member.elementAttribute === 'wood' ? '木' : 
                              member.elementAttribute === 'earth' ? '土' : 
                              member.elementAttribute.toUpperCase()}
                      size="small"
                      sx={{
                        bgcolor: getElementColor(member.elementAttribute),
                        color: getElementTextColor(member.elementAttribute),
                        mr: 1,
                        height: 24,
                        border: 'none',
                        '& .MuiChip-icon': { 
                          color: member.elementAttribute === 'water' ? '#ffffff' : '#000000' 
                        }
                      }}
                    />
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
          運勢スコアは四柱推命に基づく本日の運勢値です。ランキングは日々更新されます。
        </Typography>
      </Box>
    </div>
  );
};

export default TeamFortuneRanking;