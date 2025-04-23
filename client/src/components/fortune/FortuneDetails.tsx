import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { IFortune } from '../../../../shared';
import fortuneService from '../../services/fortune.service';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { useAuth } from '../../contexts/AuthContext';

interface FortuneDetailsProps {
  fortune: IFortune;
}

const FortuneDetails: React.FC<FortuneDetailsProps> = ({ fortune }) => {
  // 認証コンテキストからユーザー情報を取得
  const { userProfile } = useAuth();
  
  // 五行に基づいた色を取得
  const elementColors = fortuneService.getElementColors(fortune.dayPillar.heavenlyStem);
  
  // 四柱推命占いタイトル用の情報を生成
  const element = fortuneService.getStemElement(fortune.dayPillar.heavenlyStem);
  const polarity = fortuneService.getStemPolarity(fortune.dayPillar.heavenlyStem);
  const dayPillarText = `${fortune.dayPillar.heavenlyStem}${fortune.dayPillar.earthlyBranch}日`;
  
  // ユーザー名を取得（認証情報から取得、なければ「ゲスト」）
  const userName = userProfile?.displayName || "ゲスト";
  
  // 各セクションを抽出するヘルパー関数
  const extractSections = (advice: string) => {
    // 各セクションを正規表現で抽出
    const todayFortuneRegex = /## 今日のあなたの運気\s*\n([\s\S]*?)(?=\n##|$)/;
    const personalGoalRegex = /## 個人目標へのアドバイス\s*\n([\s\S]*?)(?=\n##|$)/;
    const wisdomRegex = /## 今日の名言\s*\n([\s\S]*?)(?=\n##|$)/;
    const otherSectionsRegex = /## (?!今日のあなたの運気|個人目標へのアドバイス|今日の名言)(.*?)\s*\n([\s\S]*?)(?=\n##|$)/g;
    
    // 各セクションのコンテンツを取得
    const todayFortuneMatch = advice.match(todayFortuneRegex);
    const personalGoalMatch = advice.match(personalGoalRegex);
    const wisdomMatch = advice.match(wisdomRegex);
    
    // 結果オブジェクト
    const sections = {
      todayFortune: todayFortuneMatch ? todayFortuneMatch[1].trim() : '',
      personalGoal: personalGoalMatch ? personalGoalMatch[1].trim() : '',
      wisdom: wisdomMatch ? wisdomMatch[1].trim() : '',
      otherSections: [] as {title: string, content: string}[]
    };
    
    // その他のセクションを取得
    let otherMatch;
    while ((otherMatch = otherSectionsRegex.exec(advice)) !== null) {
      sections.otherSections.push({
        title: otherMatch[1].trim(),
        content: otherMatch[2].trim()
      });
    }
    
    return sections;
  };
  
  // すべてのセクションを抽出
  const sections = extractSections(fortune.advice);
  
  // メインのアドバイスセクションを準備（表示順を変更）
  let mainAdvice = fortune.advice;
  
  return (
    <Paper
      elevation={1}
      sx={{
        padding: 3,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        boxShadow: '0 3px 8px rgba(156, 39, 176, 0.1)'
      }}
    >
      {/* 四柱推命占いタイトル */}
      <Typography
        variant="h6"
        component="h1"
        sx={{
          fontWeight: 600,
          color: 'primary.main', // 紫色
          mb: 3,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          textAlign: 'center'
        }}
      >
        四柱推命占い - {userName}さんの運勢 ({dayPillarText})
      </Typography>
    
      {/* セクションを順序通りに表示 */}
      <Box className="markdown-content">
        {/* 今日のあなたの運気 - 最初に表示 */}
        {sections.todayFortune && (
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="h6" 
              component="h2" 
              sx={{ 
                fontWeight: 600, 
                color: elementColors.main,
                mb: 2
              }}
            >
              今日のあなたの運気
            </Typography>
            <Typography 
              variant="body1" 
              component="p" 
              sx={{ 
                mb: 2,
                lineHeight: 1.7,
                fontSize: '1.05rem'
              }}
            >
              {sections.todayFortune}
            </Typography>
          </Box>
        )}

        {/* 個人目標へのアドバイス - 2番目に表示 */}
        {sections.personalGoal && (
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="h6" 
              component="h2" 
              sx={{ 
                fontWeight: 600, 
                color: elementColors.main,
                mb: 2
              }}
            >
              個人目標へのアドバイス
            </Typography>
            <Typography 
              variant="body1" 
              component="p" 
              sx={{ 
                mb: 2,
                lineHeight: 1.7,
                fontSize: '1.05rem'
              }}
            >
              {sections.personalGoal}
            </Typography>
          </Box>
        )}

        {/* 今日の名言 - 3番目に表示 */}
        {sections.wisdom && (
          <Box
            sx={{
              mb: 3,
              pb: 3,
              borderBottom: '1px dashed',
              borderColor: 'divider',
              position: 'relative',
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 600,
                color: elementColors.main,
                mb: 2,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              今日の名言
            </Typography>
            
            <Box sx={{ display: 'flex', position: 'relative' }}>
              <FormatQuoteIcon 
                sx={{ 
                  color: elementColors.light,
                  fontSize: '2rem',
                  position: 'absolute',
                  left: -5,
                  top: -10,
                  opacity: 0.7,
                  transform: 'rotate(180deg)'
                }} 
              />
              
              <Box sx={{ ml: 4 }}>
                <Typography 
                  variant="body1" 
                  component="p" 
                  sx={{ 
                    fontWeight: 500,
                    lineHeight: 1.7,
                    fontSize: '1.05rem',
                    fontStyle: 'italic'
                  }}
                >
                  {sections.wisdom}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* その他のセクション - 最後に表示 */}
        {sections.otherSections.map((section, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography 
              variant="h6" 
              component="h2" 
              sx={{ 
                fontWeight: 600, 
                color: elementColors.main,
                mb: 2
              }}
            >
              {section.title}
            </Typography>
            <Typography 
              variant="body1" 
              component="p" 
              sx={{ 
                mb: 2,
                lineHeight: 1.7,
                fontSize: '1.05rem'
              }}
            >
              {section.content}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default FortuneDetails;