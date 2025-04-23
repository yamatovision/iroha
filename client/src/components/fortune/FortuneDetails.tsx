import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { IFortune } from '../../../../shared';
import fortuneService from '../../services/fortune.service';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

interface FortuneDetailsProps {
  fortune: IFortune;
}

const FortuneDetails: React.FC<FortuneDetailsProps> = ({ fortune }) => {
  // 五行に基づいた色を取得
  const elementColors = fortuneService.getElementColors(fortune.dayPillar.heavenlyStem);
  
  // advice から「今日の名言」セクションを探して切り出すヘルパー関数
  const extractWisdomSection = (advice: string) => {
    const wisdomSectionRegex = /## 今日の名言\s*\n([\s\S]*?)(?=\n##|$)/;
    const match = advice.match(wisdomSectionRegex);
    
    if (match && match[1]) {
      // 名言セクションが見つかった場合、その内容を返す
      return match[1].trim();
    }
    
    return null;
  };
  
  // 名言セクションを切り出し、残りのアドバイスを取得
  const wisdomSection = extractWisdomSection(fortune.advice);
  let mainAdvice = fortune.advice;
  
  if (wisdomSection) {
    // 名言セクションをアドバイスから削除
    mainAdvice = fortune.advice.replace(/## 今日の名言[\s\S]*?(?=\n##|$)/, '');
  }
  
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
      {/* 今日の名言セクションがあれば特別なスタイルで表示 */}
      {wisdomSection && (
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
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
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
                      {children}
                    </Typography>
                  ),
                }}
              >
                {wisdomSection}
              </ReactMarkdown>
            </Box>
          </Box>
        </Box>
      )}

      {/* メインの運勢アドバイス */}
      <Box className="markdown-content">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <Typography 
                variant="h5" 
                component="h1" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'primary.dark',
                  mt: 3, 
                  mb: 2,
                  pb: 0.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                {children}
              </Typography>
            ),
            h2: ({ children }) => {
              // 「今日の名言」というh2は既に別の場所で表示するためスキップ
              if (children === '今日の名言') {
                return null;
              }
              return (
                <Typography 
                  variant="h6" 
                  component="h2" 
                  sx={{ 
                    fontWeight: 600, 
                    color: elementColors.main,
                    mt: 2.5, 
                    mb: 1.5 
                  }}
                >
                  {children}
                </Typography>
              );
            },
            p: ({ children }) => (
              <Typography 
                variant="body1" 
                component="p" 
                sx={{ 
                  mb: 2,
                  lineHeight: 1.7,
                  fontSize: '1.05rem'
                }}
              >
                {children}
              </Typography>
            ),
            ul: ({ children }) => (
              <Box 
                component="ul" 
                sx={{ 
                  pl: 4,
                  mb: 2 
                }}
              >
                {children}
              </Box>
            ),
            li: ({ children }) => (
              <Typography 
                component="li" 
                sx={{ 
                  mb: 1,
                  fontSize: '1.05rem'
                }}
              >
                {children}
              </Typography>
            ),
          }}
        >
          {mainAdvice}
        </ReactMarkdown>
      </Box>
    </Paper>
  );
};

export default FortuneDetails;