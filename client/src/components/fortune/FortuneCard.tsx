import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';
import ParkIcon from '@mui/icons-material/Park';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LandscapeIcon from '@mui/icons-material/Landscape';
import StarIcon from '@mui/icons-material/Star';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
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
  const element = fortuneService.getStemElement(fortune.dayPillar.heavenlyStem);
  const polarity = fortuneService.getStemPolarity(fortune.dayPillar.heavenlyStem);
  const dayPillarText = `${element}の${polarity} (${fortune.dayPillar.heavenlyStem}${fortune.dayPillar.earthlyBranch})`;
  
  // 五行に対応した背景色
  const getElementBgColor = (element: string): string => {
    switch(element) {
      case '木': return '#94b8eb'; // 青/緑系
      case '火': return '#e67373'; // 赤系
      case '土': return '#f2d06b'; // 黄系
      case '金': return '#ffffff'; // 白系
      case '水': return '#7d94a6'; // 紺系
      default: return '#94b8eb';
    }
  };
  
  // 五行に対応したテキスト色（水の場合は白、それ以外は黒）
  const getElementTextColor = (element: string): string => {
    return element === '水' ? '#ffffff' : '#000000';
  };
  
  // 五行に対応したアイコン
  const getElementIcon = (element: string) => {
    switch(element) {
      case '木': return <ParkIcon sx={{ mr: 0.75, fontSize: 18 }} />;
      case '火': return <LocalFireDepartmentIcon sx={{ mr: 0.75, fontSize: 18 }} />;
      case '土': return <LandscapeIcon sx={{ mr: 0.75, fontSize: 18 }} />;
      case '金': return <StarIcon sx={{ mr: 0.75, fontSize: 18 }} />;
      case '水': return <WaterDropIcon sx={{ mr: 0.75, fontSize: 18 }} />;
      default: return <ParkIcon sx={{ mr: 0.75, fontSize: 18 }} />;
    }
  };
  
  // スタイル定義（五行に基づいて動的に変更）
  const bgColor = getElementBgColor(element);
  const textColor = getElementTextColor(element);
  const isMetalElement = element === '金';
  
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
                // スコア部分の色
                isMetalElement ? theme.palette.primary.main : // 金の日はそのまま紫
                element === '木' ? '#4f77c3' : // 木の日は濃い青/緑系
                element === '火' ? '#c73434' : // 火の日は濃い赤系
                element === '土' ? '#d4a92a' : // 土の日は濃い黄系
                element === '水' ? '#4a5d71' : // 水の日は濃い紺系
                textColor, // デフォルト
                
                // 未使用部分の色（背景とのコントラストを強くする）
                isMetalElement ? '#f5f5f5' : 
                element === '木' ? '#e6eefa' : // 木の日はとても明るい青系
                element === '火' ? '#ffe9e9' : // 火の日はとても明るい赤系
                element === '土' ? '#fff8e0' : // 土の日はとても明るい黄系
                element === '水' ? '#dfe7f0' : // 水の日はとても明るい紺系
                '#f0f0f0' // 明るい灰色
              ],
              borderWidth: isMetalElement ? 0 : 1,
              borderColor: [
                // スコア部分の境界線
                isMetalElement ? theme.palette.primary.main : // 金の日はそのまま紫
                element === '木' ? '#4f77c3' : // 木の日
                element === '火' ? '#c73434' : // 火の日
                element === '土' ? '#d4a92a' : // 土の日
                element === '水' ? '#4a5d71' : // 水の日
                textColor, // デフォルト
                
                // 未使用部分の境界線
                isMetalElement ? '#dedede' : 
                element === '木' ? '#b0c5e8' : // 木の日
                element === '火' ? '#e8b0b0' : // 火の日
                element === '土' ? '#e8d4b0' : // 土の日
                element === '水' ? '#b0c5d4' : // 水の日
                '#dedede' // 灰色
              ],
              borderRadius: 0,
            }]
          },
          options: {
            cutout: '70%',
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
            // ホバー効果を完全に無効化
            hover: {
              mode: undefined
            },
            // アーク要素のスタイルをカスタマイズ
            elements: {
              arc: {
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.4)', // より明確な境界線
                hoverBorderColor: 'rgba(255,255,255,0.4)', // ホバー時も同じ
                hoverBackgroundColor: undefined, // ホバー時も背景色を変えない
              }
            },
            animation: {
              animateRotate: true,
              animateScale: false,
              duration: 1000,
              easing: 'easeOutCirc'
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
  }, [fortune.score, isMetalElement, textColor, theme.palette.primary.main]);
  
  return (
    <>
      {/* 運勢ヘッダーセクション - 金の場合は特別なスタイリング */}
      <Paper
        elevation={3}
        sx={{
          backgroundColor: bgColor,
          borderRadius: 3,
          padding: 2.5,
          color: textColor,
          position: 'relative',
          overflow: 'hidden',
          border: isMetalElement ? `1px solid ${theme.palette.primary.main}` : 'none',
          '&::before': !isMetalElement ? {
            content: '""',
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            width: '140%',
            height: '140%',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            opacity: 0.1,
            zIndex: 0
          } : {}
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
          今日の運気
        </Typography>
        
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            bgcolor: isMetalElement ? 'transparent' : 'rgba(255, 255, 255, 0.15)',
            border: isMetalElement 
              ? `1px solid ${theme.palette.primary.main}` 
              : '1px solid rgba(255, 255, 255, 0.3)',
            color: textColor,
            px: 2,
            py: 1,
            borderRadius: '30px',
            fontWeight: 500,
            fontSize: '0.95rem',
            mt: 1,
            backdropFilter: 'blur(5px)',
            boxShadow: isMetalElement ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          {getElementIcon(element)}
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
          backgroundColor: isMetalElement ? '#ffffff' : 
                           element === '木' ? '#c0d5f7' : // 木の日は明るい青色に変更
                           element === '火' ? '#ffdada' : // 火の日は明るい赤色に変更
                           element === '土' ? '#fff3cd' : // 土の日は明るい黄色に変更
                           element === '水' ? '#a5b9c9' : // 水の日は明るい青灰色に変更
                           '#f0f0f0', // デフォルトは明るい灰色
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderTop: isMetalElement 
            ? `1px solid ${theme.palette.primary.main}` 
            : `1px solid ${bgColor}40`,
          marginTop: '-8px',
          mb: 3,
          border: isMetalElement ? `1px solid ${theme.palette.primary.main}` : 'none',
          ...(isMetalElement && { borderTop: 'none' })
        }}
      >
        <Box
          sx={{
            width: 180,
            height: 180,
            position: 'relative',
            filter: 'none',
            margin: '0 auto'
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
                color: isMetalElement ? theme.palette.primary.main : textColor,
                lineHeight: 1
              }}
            >
              {fortune.score}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                color: isMetalElement ? 'rgba(0, 0, 0, 0.7)' : (element === '水' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
                mt: 0.5,
                display: 'block'
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