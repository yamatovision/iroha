import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { IFortune } from '../../../../shared';
import fortuneService from '../../services/fortune.service';

// アイコンのマッピング
interface IconMapping {
  [key: string]: string;
}

const iconMapping: IconMapping = {
  color: 'checkroom',
  item: 'restaurant',
  drink: 'local_cafe'
};

interface LuckyItemsProps {
  fortune: IFortune;
}

const LuckyItems: React.FC<LuckyItemsProps> = ({ fortune }) => {
  // 五行に基づいた色を取得
  const elementColors = fortuneService.getElementColors(fortune.dayPillar.heavenlyStem);
  
  return (
    <Paper
      elevation={1}
      sx={{
        backgroundColor: elementColors.bg,
        borderRadius: 3,
        padding: 2.5,
        marginBottom: 3,
        boxShadow: `0 4px 12px ${elementColors.main}20`
      }}
    >
      <Typography
        variant="h6"
        component="div"
        sx={{
          color: elementColors.main,
          marginBottom: 2,
          display: 'flex',
          alignItems: 'center',
          fontWeight: 600
        }}
      >
        <Box 
          component="span" 
          className="material-icons" 
          sx={{ 
            marginRight: 1,
            fontSize: '1.2rem'
          }}
        >
          auto_awesome
        </Box>
        今日のラッキーポイント
      </Typography>
      
      <Grid container spacing={2}>
        {Object.entries(fortune.luckyItems).map(([key, value]) => (
          <Grid item xs={4} key={key}>
            <Box
              sx={{
                backgroundColor: 'white',
                padding: 1.5,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              <Typography
                variant="caption"
                component="div"
                sx={{
                  color: 'text.secondary',
                  marginBottom: 1
                }}
              >
                {key === 'color' ? 'ラッキーファッション' : 
                  key === 'item' ? 'ラッキーフード' : 'ラッキードリンク'}
              </Typography>
              <Box
                component="span"
                className="material-icons"
                sx={{
                  fontSize: '1.8rem',
                  marginBottom: 1,
                  color: elementColors.main
                }}
              >
                {iconMapping[key]}
              </Box>
              <Typography
                variant="body2"
                component="div"
                sx={{
                  fontWeight: 500,
                  textAlign: 'center'
                }}
              >
                {value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default LuckyItems;