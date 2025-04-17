import React from 'react';
import { Paper, Box, Typography, Card, CardContent, Chip, Divider, useTheme } from '@mui/material';
import { ITeamContextFortune } from '../../../../shared';
import fortuneService from '../../services/fortune.service';
import './styles.css';

interface TeamContextFortuneCardProps {
  fortune: ITeamContextFortune;
  teamName: string;
}

const TeamContextFortuneCard: React.FC<TeamContextFortuneCardProps> = ({ fortune, teamName }) => {
  const theme = useTheme();
  
  // 天干の五行属性に基づく色を取得
  const colors = fortune.dayPillar ? 
    fortuneService.getElementColors(fortune.dayPillar.heavenlyStem) : 
    { main: 'var(--water-color)', light: 'var(--water-light)', bg: 'var(--water-bg)' };
  
  // 運勢スコアに基づくカテゴリを取得
  const scoreCategory = fortuneService.getScoreCategory(fortune.score);
  
  // スコアカテゴリに基づくラベルテキスト
  const scoreCategoryLabel = (() => {
    switch(scoreCategory) {
      case 'excellent': return '絶好調';
      case 'good': return '好調';
      case 'neutral': return '普通';
      case 'poor': return 'やや注意';
      case 'bad': return '要注意';
      default: return '普通';
    }
  })();
  
  // 日付のフォーマット
  const formattedDate = fortune.date ? 
    fortuneService.formatDate(fortune.date) : 
    fortuneService.formatDate(new Date());
  
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
          background: `linear-gradient(135deg, ${colors.main} 0%, ${colors.light} 100%)`,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Chip 
              label={`${teamName}チーム`}
              size="small"
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.25)', 
                color: '#fff',
                fontWeight: 'bold',
                px: 1
              }}
            />
            <Chip 
              label={scoreCategoryLabel}
              size="small"
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.25)', 
                color: '#fff',
                fontWeight: 'bold'
              }}
            />
          </Box>
          
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
            チームコンテキスト運勢
          </Typography>
          
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
      
      {/* スコア表示 */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: -3, 
          position: 'relative',
          zIndex: 5
        }}
      >
        <Box 
          sx={{ 
            width: 72, 
            height: 72, 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#fff',
            border: `3px solid ${colors.main}`,
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography 
            variant="h4" 
            component="span" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: '1.8rem',
              color: colors.main
            }}
          >
            {fortune.score}
          </Typography>
        </Box>
      </Box>
      
      {/* チームコンテキストアドバイス */}
      <CardContent sx={{ pt: 2, px: 3, pb: 1 }}>
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 500, 
            color: theme.palette.text.primary,
            mb: 2,
            lineHeight: 1.7
          }}
        >
          {fortune.teamContextAdvice}
        </Typography>
      </CardContent>
      
      {/* チーム協力ヒント */}
      <Box sx={{ px: 3, pb: 3 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 'bold', 
            color: theme.palette.primary.main,
            mb: 1.5
          }}
        >
          今日のチーム協力ポイント
        </Typography>
        
        {fortune.collaborationTips && fortune.collaborationTips.map((tip, index) => (
          <Card 
            key={index} 
            variant="outlined" 
            sx={{ 
              mb: 1, 
              borderRadius: 2,
              borderColor: 'rgba(0, 0, 0, 0.08)',
              backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent'
            }}
          >
            <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2">
                {tip}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Paper>
  );
};

export default TeamContextFortuneCard;