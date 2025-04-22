import React from 'react';
import { Paper, Box, Typography, Card, CardContent, Chip, Divider, useTheme } from '@mui/material';
import { ITeamContextFortune } from '../../../../shared';
import fortuneService from '../../services/fortune.service';
import './styles.css';

// マークダウン表示用ユーティリティ関数
const formatMarkdown = (text: string): React.ReactNode => {
  // 単純な改行とスタイル処理
  const lines = text.split('\n');
  return lines.map((line, index) => {
    // 見出し (# または ##)
    if (line.startsWith('# ')) {
      return <Typography key={index} variant="h5" sx={{ mt: 1, mb: 2, fontWeight: 'bold' }}>{line.substring(2)}</Typography>;
    } else if (line.startsWith('## ')) {
      return <Typography key={index} variant="h6" sx={{ mt: 1, mb: 1.5, fontWeight: 'bold' }}>{line.substring(3)}</Typography>;
    } else if (line.trim() === '') {
      return <Box key={index} sx={{ height: 16 }} />;
    } else {
      return <Typography key={index} variant="body1" paragraph>{line}</Typography>;
    }
  });
};

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
  
  // デバッグ用に全プロパティを表示
  console.log('[TeamContextFortuneCard] 受け取ったデータ:', JSON.stringify(fortune, null, 2));
  
  // 日付のフォーマット (日付がDate型でない場合は文字列からDateオブジェクトへ変換)
  const dateObj = fortune.date ? 
    (fortune.date instanceof Date ? fortune.date : new Date(fortune.date)) : 
    new Date();
    
  const formattedDate = fortuneService.formatDate(dateObj);
  
  // チームコンテキストアドバイスのテキストを取得 (リファクタリング後)
  const advice = fortune.teamContextAdvice || '';
  
  // デバッグログ
  console.log('teamContextAdvice:', JSON.stringify(advice));
  
  // リファクタリング: AIレスポンス全体を直接表示するように簡略化
  const fullAdvice = advice;
  
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
      
      {/* チームコンテキストアドバイス - 最もシンプルな表示 */}
      <CardContent sx={{ pt: 2, px: 3, pb: 1 }}>
        <div style={{ padding: '0', margin: '0 0 20px 0' }}>
          {/* マークダウンの見出しを手動で変換 */}
          {fullAdvice.split('\n').map((line, index) => {
            if (line.startsWith('# ')) {
              return (
                <h2 key={index} style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: '#673ab7' 
                }}>
                  {line.substring(2)}
                </h2>
              );
            } else if (line.startsWith('## ')) {
              return (
                <h3 key={index} style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold',
                  marginTop: '16px',
                  marginBottom: '12px',
                  color: '#9575cd' 
                }}>
                  {line.substring(3)}
                </h3>
              );
            } else if (line.trim() === '') {
              return <div key={index} style={{ height: '16px' }} />;
            } else {
              return (
                <p key={index} style={{ 
                  margin: '8px 0', 
                  lineHeight: '1.7',
                  fontSize: '1rem' 
                }}>
                  {line}
                </p>
              );
            }
          })}
        </div>
      </CardContent>
      
      {/* リファクタリング: 協力ヒントの表示をマークダウン表示に統合 */}
    </Paper>
  );
};

export default TeamContextFortuneCard;