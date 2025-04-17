import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';
import fortuneService from '../../services/fortune.service';
import { IFortune } from '../../../../shared';
import './styles.css';

// Chart.jsのコンポーネントを登録
Chart.register(DoughnutController, ArcElement, Tooltip);

interface FortuneCardProps {
  fortune: IFortune;
}

const FortuneCard: React.FC<FortuneCardProps> = ({ fortune }) => {
  const theme = useTheme();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  // 五行に基づいた色を取得
  const elementColors = fortuneService.getElementColors(fortune.dayPillar.heavenlyStem);
  
  // 天干地支と陰陽の情報を取得
  const polarity = fortuneService.getStemPolarity(fortune.dayPillar.heavenlyStem);
  const element = fortuneService.getStemElement(fortune.dayPillar.heavenlyStem);
  const dayPillarText = `${element}の${polarity} (${fortune.dayPillar.heavenlyStem}${fortune.dayPillar.earthlyBranch})`;

  useEffect(() => {
    if (chartRef.current) {
      // 既存のチャートがあれば破棄
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      // 新しいチャートを作成
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            datasets: [{
              data: [fortune.score, 100 - fortune.score],
              backgroundColor: [
                elementColors.main,
                elementColors.bg,
              ],
              borderWidth: 0,
            }]
          },
          options: {
            cutout: '75%',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: false
              }
            },
            animation: {
              animateRotate: true,
              animateScale: true,
              duration: 2000,
              easing: 'easeOutQuart'
            }
          }
        });
      }
    }
    
    // コンポーネントのアンマウント時にチャートを破棄
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [fortune.score, elementColors]);
  
  return (
    <>
      {/* 運勢ヘッダーセクション */}
      <Paper
        elevation={3}
        sx={{
          background: `linear-gradient(135deg, ${elementColors.main}, ${elementColors.dark})`,
          borderRadius: 3,
          padding: 2.5,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            width: '140%',
            height: '140%',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            opacity: 0.1,
            zIndex: 0
          }
        }}
      >
        <Typography 
          variant="h6" 
          component="div"
          sx={{ 
            fontWeight: 500, 
            mb: 1.5, 
            position: 'relative', 
            zIndex: 1 
          }}
        >
          今日の運勢
        </Typography>
        
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: '30px',
            fontWeight: 500,
            fontSize: '0.95rem',
            mt: 1,
            backdropFilter: 'blur(5px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <Box 
            component="span" 
            sx={{ 
              mr: 0.75, 
              display: 'flex', 
              alignItems: 'center',
              '& svg': {
                width: 16,
                height: 16
              }
            }}
          >
            {element === '木' && (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
              </svg>
            )}
            {element === '火' && (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5H14.5Z" />
              </svg>
            )}
            {element === '土' && (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8,14L6.5,17H17.5L16,14H8M16,8H8L6,12H18L16,8M4,20H20C20.55,20 21,19.55 21,19V18C21,17.45 20.55,17 20,17H4C3.45,17 3,17.45 3,18V19C3,19.55 3.45,20 4,20M4,13H20C20.55,13 21,12.55 21,12V11C21,10.45 20.55,10 20,10H4C3.45,10 3,10.45 3,11V12C3,12.55 3.45,13 4,13M4,6H20C20.55,6 21,5.55 21,5V4C21,3.45 20.55,3 20,3H4C3.45,3 3,3.45 3,4V5C3,5.55 3.45,6 4,6Z" />
              </svg>
            )}
            {element === '金' && (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
              </svg>
            )}
            {element === '水' && (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,20A6,6 0 0,1 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14A6,6 0 0,1 12,20Z" />
              </svg>
            )}
          </Box>
          {dayPillarText}
        </Box>
      </Paper>
      
      {/* スコアチャートセクション */}
      <Paper
        elevation={1}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          padding: 2.5,
          backgroundColor: elementColors.bg,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderTop: `1px solid ${elementColors.main}20`,
          marginTop: '-8px',
          mb: 3
        }}
      >
        <Box
          sx={{
            width: 200,
            height: 200,
            position: 'relative',
            filter: `drop-shadow(0 8px 16px ${elementColors.main}40)`
          }}
        >
          <canvas ref={chartRef} />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}
          >
            <Typography
              variant="h2"
              component="div"
              sx={{
                fontSize: '3.5rem',
                fontWeight: 700,
                color: elementColors.main,
                lineHeight: 1
              }}
            >
              {fortune.score}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1rem',
                color: theme.palette.text.primary,
                marginTop: 1,
                fontWeight: 500
              }}
            >
              命式との相性
            </Typography>
          </Box>
        </Box>
      </Paper>
    </>
  );
};

export default FortuneCard;