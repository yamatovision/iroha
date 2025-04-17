import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { IFortune } from '../../../../shared';
import fortuneService from '../../services/fortune.service';

interface FortuneDetailsProps {
  fortune: IFortune;
}

const FortuneDetails: React.FC<FortuneDetailsProps> = ({ fortune }) => {
  // 五行に基づいた色を取得
  const elementColors = fortuneService.getElementColors(fortune.dayPillar.heavenlyStem);
  
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
            h2: ({ children }) => (
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
            ),
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
          {fortune.advice}
        </ReactMarkdown>
      </Box>
    </Paper>
  );
};

export default FortuneDetails;