import React from 'react';
import { Box, Typography, Grid, Paper, Tooltip } from '@mui/material';
import { ISajuProfile, Element } from '@shared/index';
import sajuProfileService from '../../services/saju-profile.service';

// 天干地支の型定義
type PillarKey = 'year' | 'month' | 'day' | 'hour';

// 拡張された四柱情報の型定義
interface ExtendedPillar {
  heavenlyStem: string;
  earthlyBranch: string;
  heavenlyStemTenGod?: string;
  earthlyBranchTenGod?: string;
  hiddenStems?: string[];
}

interface ExtendedFourPillars {
  year: ExtendedPillar;
  month: ExtendedPillar;
  day: ExtendedPillar;
  hour: ExtendedPillar;
}

interface SajuElementBlocksProps {
  profile: ISajuProfile;
}

const SajuElementBlocks: React.FC<SajuElementBlocksProps> = ({ profile }) => {
  // 五行マッピング
  const getStemElement = (stem: string): string => {
    const mapping: Record<string, string> = {
      '甲': Element.WOOD, '乙': Element.WOOD,
      '丙': Element.FIRE, '丁': Element.FIRE,
      '戊': Element.EARTH, '己': Element.EARTH,
      '庚': Element.METAL, '辛': Element.METAL,
      '壬': Element.WATER, '癸': Element.WATER
    };
    return mapping[stem] || Element.EARTH;
  };

  const getBranchElement = (branch: string): string => {
    const mapping: Record<string, string> = {
      '子': Element.WATER, '丑': Element.EARTH,
      '寅': Element.WOOD, '卯': Element.WOOD,
      '辰': Element.EARTH, '巳': Element.FIRE,
      '午': Element.FIRE, '未': Element.EARTH,
      '申': Element.METAL, '酉': Element.METAL,
      '戌': Element.EARTH, '亥': Element.WATER
    };
    return mapping[branch] || Element.EARTH;
  };

  // 四柱情報の取得と拡張
  const defaultPillars: ExtendedFourPillars = {
    year: { heavenlyStem: '?', earthlyBranch: '?' },
    month: { heavenlyStem: '?', earthlyBranch: '?' },
    day: { heavenlyStem: '?', earthlyBranch: '?' },
    hour: { heavenlyStem: '?', earthlyBranch: '?' }
  };

  // 安全に型を確認しながら結合
  const pillars: ExtendedFourPillars = {
    year: { ...defaultPillars.year, ...profile.fourPillars?.year },
    month: { ...defaultPillars.month, ...profile.fourPillars?.month },
    day: { ...defaultPillars.day, ...profile.fourPillars?.day },
    hour: { ...defaultPillars.hour, ...profile.fourPillars?.hour }
  };

  // 干支の漢字名
  const pillarNames: Record<PillarKey, string> = {
    year: '年柱',
    month: '月柱',
    day: '日柱',
    hour: '時柱'
  };

  const stemNames: Record<PillarKey, string> = {
    year: '年干',
    month: '月干',
    day: '日干',
    hour: '時干'
  };

  const branchNames: Record<PillarKey, string> = {
    year: '年支',
    month: '月支',
    day: '日支',
    hour: '時支'
  };

  return (
    <Box sx={{ my: 2 }}>
      {/* ヘッダー部分 */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        {(['hour', 'day', 'month', 'year'] as PillarKey[]).map((pillar, index) => (
          <Grid item xs={3} key={`header-${index}`}>
            <Typography 
              align="center" 
              variant="subtitle2" 
              sx={{ 
                color: pillar === 'day' ? 'primary.main' : 'text.secondary',
                fontWeight: pillar === 'day' ? 'bold' : 'normal',
              }}
            >
              {pillarNames[pillar]}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* 天干ブロック */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {(['hour', 'day', 'month', 'year'] as PillarKey[]).map((pillar, index) => {
          const stem = pillars[pillar].heavenlyStem || '?';
          const element = getStemElement(stem);
          
          return (
            <Grid item xs={3} key={`stem-${index}`}>
              <Tooltip 
                title={
                  <>
                    <Typography variant="body2">
                      <strong>{stemNames[pillar]}:</strong> {stem}
                    </Typography>
                    <Typography variant="body2">
                      <strong>五行属性:</strong> {sajuProfileService.translateElementToJapanese(element)}
                    </Typography>
                    {pillars[pillar].heavenlyStemTenGod && (
                      <Typography variant="body2">
                        <strong>十神:</strong> {pillars[pillar].heavenlyStemTenGod}
                      </Typography>
                    )}
                  </>
                }
                arrow
              >
                <Paper 
                  sx={{
                    height: 80,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: sajuProfileService.getElementBackground(element),
                    color: sajuProfileService.getElementColor(element),
                    border: element === 'metal' ? '2px solid #000000' : (pillar === 'day' ? '2px solid' : '1px solid'), 
                    borderColor: element === 'metal' ? '#000000' : (pillar === 'day' ? 'primary.main' : 'divider'),
                    borderRadius: 2,
                    position: 'relative',
                    boxShadow: pillar === 'day' ? '0 0 5px rgba(156, 39, 176, 0.3)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold',
                      mb: 1
                    }}
                  >
                    {stem}
                  </Typography>
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      fontSize: '0.6rem',
                      opacity: 0.8
                    }}
                  >
                    {sajuProfileService.translateElementToJapanese(element)}
                  </Typography>
                </Paper>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>

      {/* 地支ブロック */}
      <Grid container spacing={1}>
        {(['hour', 'day', 'month', 'year'] as PillarKey[]).map((pillar, index) => {
          const branch = pillars[pillar].earthlyBranch || '?';
          const element = getBranchElement(branch);
          
          return (
            <Grid item xs={3} key={`branch-${index}`}>
              <Tooltip 
                title={
                  <>
                    <Typography variant="body2">
                      <strong>{branchNames[pillar]}:</strong> {branch}
                    </Typography>
                    <Typography variant="body2">
                      <strong>五行属性:</strong> {sajuProfileService.translateElementToJapanese(element)}
                    </Typography>
                    {pillars[pillar].earthlyBranchTenGod && (
                      <Typography variant="body2">
                        <strong>十神:</strong> {pillars[pillar].earthlyBranchTenGod}
                      </Typography>
                    )}
                    {pillars[pillar].hiddenStems && pillars[pillar].hiddenStems.length > 0 && (
                      <Typography variant="body2">
                        <strong>蔵干:</strong> {pillars[pillar].hiddenStems.join(', ')}
                      </Typography>
                    )}
                  </>
                }
                arrow
              >
                <Paper 
                  sx={{
                    height: 80,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: sajuProfileService.getElementBackground(element),
                    color: sajuProfileService.getElementColor(element),
                    border: element === 'metal' ? '2px solid #000000' : (pillar === 'day' ? '2px solid' : '1px solid'), 
                    borderColor: element === 'metal' ? '#000000' : (pillar === 'day' ? 'primary.main' : 'divider'),
                    borderRadius: 2,
                    position: 'relative',
                    boxShadow: pillar === 'day' ? '0 0 5px rgba(156, 39, 176, 0.3)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold',
                      mb: 1
                    }}
                  >
                    {branch}
                  </Typography>
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      fontSize: '0.6rem',
                      opacity: 0.8
                    }}
                  >
                    {sajuProfileService.translateElementToJapanese(element)}
                  </Typography>
                </Paper>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>

      {/* 十神関係表示 */}
      <Grid container spacing={1} sx={{ mt: 0.5 }}>
        {(['hour', 'day', 'month', 'year'] as PillarKey[]).map((pillar, index) => (
          <Grid item xs={3} key={`tengod-${index}`}>
            <Typography 
              align="center" 
              variant="body2" 
              sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
            >
              {pillars[pillar].heavenlyStemTenGod || ''}
            </Typography>
            <Typography 
              align="center" 
              variant="body2" 
              sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
            >
              {pillars[pillar].earthlyBranchTenGod || ''}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* 五行バランス表示 */}
      {profile.elementProfile && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5 }}>
            五行バランス
          </Typography>
          
          {/* すべての要素の合計値を先に計算 */}
          {(() => {
            // 五行要素のリスト（型安全に）
            const elements = [Element.WOOD, Element.FIRE, Element.EARTH, Element.METAL, Element.WATER];
            
            // すべての要素の合計値を計算
            const totalElements = elements.reduce((sum, el) => {
              return sum + (profile.elementProfile?.[el] || 0);
            }, 0);
            
            return (
              <>
                <Grid container spacing={1}>
                  {elements.map((element) => {
                    // 要素の計数値を取得
                    const count = profile.elementProfile?.[element] || 0;
                    
                    // 合計が0の場合は均等に表示、それ以外は相対的な割合で表示
                    const maxCount = Math.max(totalElements, 8); // 最大値を想定、または合計値がそれより大きい場合
                    const percentage = totalElements === 0 
                      ? 20 // 均等に20%ずつ表示（データがない場合）
                      : Math.min((count / maxCount) * 100, 100);
              
                    return (
                      <Grid item xs={2.4} key={element}>
                        <Tooltip
                          title={`${sajuProfileService.translateElementToJapanese(element)}: ${count}個`}
                          arrow
                        >
                          <Box 
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center'
                            }}
                          >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'medium',
                                color: count > 0 ? sajuProfileService.getElementColor(element) : 'text.secondary'
                              }}
                            >
                              {sajuProfileService.translateElementToJapanese(element)}
                            </Typography>
                            
                            <Box 
                              sx={{
                                width: '100%',
                                height: 24,
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                borderRadius: 2,
                                mt: 0.5,
                                position: 'relative',
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider'
                              }}
                            >
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  height: '100%',
                                  width: `${percentage}%`,
                                  backgroundColor: count > 0 || totalElements === 0 
                                    ? sajuProfileService.getElementBackground(element)
                                    : 'rgba(0,0,0,0.03)', // 0の場合は非常に薄いグレー
                                  borderRight: percentage < 100 ? '1px solid' : 'none',
                                  borderColor: 'divider',
                                  transition: 'width 0.5s'
                                }}
                              />
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 1
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 'bold',
                                    color: count > 0 ? sajuProfileService.getElementColor(element) : 'text.secondary'
                                  }}
                                >
                                  {count}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Tooltip>
                      </Grid>
                    );
                  })}
                </Grid>
                
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                    ※ 数値は四柱八字に含まれる各五行の数を表しています
                  </Typography>
                  {totalElements === 0 && (
                    <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                      五行バランスの計算データが利用できません
                    </Typography>
                  )}
                </Box>
              </>
            );
          })()}
        </Box>
      )}
    </Box>
  );
};

export default SajuElementBlocks;