import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Modal, 
  CircularProgress, 
  Avatar, 
  Chip, 
  Paper, 
  Divider,
  Button 
} from '@mui/material';
import LoadingOverlay from '../common/LoadingOverlay';
import { useAuth } from '../../contexts/AuthContext';
import friendService from '../../services/friend.service';

// 五行属性の色マッピング
const elementColors = {
  wood: '#4CAF50', // 緑色
  fire: '#F44336', // 赤色
  earth: '#FF9800', // オレンジ色
  metal: '#FFD700', // ゴールド色
  water: '#2196F3'  // 青色
};

// 相性タイプのラベルマッピング
const relationshipLabels = {
  'mutual_generation': '相生',
  'mutual_restriction': '相克',
  'neutral': '中和'
};

// スタイル付きコンポーネントの代わりに通常のスタイル
const CompatibilityScore = ({ score }: { score: number }) => {
  const getColor = () => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FFC107';
    if (score >= 20) return '#FF9800';
    return '#F44336';
  };

  return (
    <Box
      sx={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: getColor(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1.2rem'
      }}
    >
      {score || 0}
    </Box>
  );
};

interface CompatibilityModalProps {
  open: boolean;
  onClose: () => void;
  friendId?: string;
  friendData?: any;
  useEnhancedAlgorithm?: boolean; // 拡張アルゴリズムを使用するかどうか
}

const CompatibilityModal: React.FC<CompatibilityModalProps> = ({ 
  open, 
  onClose, 
  friendId, 
  friendData,
  useEnhancedAlgorithm = false // デフォルトは基本診断
}) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [compatibility, setCompatibility] = useState<any>(null);
  
  useEffect(() => {
    if (!open) return;
    
    const fetchCompatibilityData = async () => {
      if (!userProfile) {
        setError('ユーザープロファイルが見つかりません');
        setLoading(false);
        return;
      }
      
      if (!friendId && !friendData?.userId) {
        setError('友達情報が不足しています');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // 友達IDを決定
        const targetFriendId = friendId || friendData?.userId;
        
        // 相性データを取得（常に拡張アルゴリズムを使用）
        console.log('拡張相性診断アルゴリズムを使用します');
        const data = await friendService.getEnhancedCompatibility(targetFriendId);
        console.log('取得した相性データ:', data);
        
        // データを整形（APIレスポンス構造に合わせて）
        // success: true, data: { score, relationshipType, ... } の形式に対応
        let processedData = null;
        
        if (data && data.success && data.data) {
          // 実際のデータはdata.dataにある
          const actualData = data.data;
          
          console.log('データ構造検証:', {
            hasScore: 'score' in actualData,
            hasRelationshipType: 'relationshipType' in actualData,
            hasUsers: Array.isArray(actualData.users),
            dataStructure: Object.keys(actualData)
          });
          
          // 実際のAPIレスポンス構造に準拠
          processedData = {
            // 基本データをそのまま使用
            ...actualData,
            // スコアは data.data.score にある
            score: actualData.score || 0,
            // 関係性タイプは data.data.relationshipType にある
            relationship: actualData.relationshipType || 'neutral',
            relationshipType: actualData.relationshipType || '中和',
            // 詳細説明は data.data.description にある
            description: actualData.description || '',
            // チーム内洞察は data.data.teamInsight にある
            teamInsight: actualData.teamInsight || '',
            // 協力のポイントは data.data.collaborationTips にある
            collaborationTips: actualData.collaborationTips || [],
            // ユーザー情報
            users: Array.isArray(actualData.users) ? actualData.users.map((u: any) => {
              if (u && u.yojin && typeof u.yojin === 'object') {
                return {
                  ...u,
                  yojin: {
                    tenGod: u.yojin.tenGod || '',
                    element: u.yojin.element || '',
                    description: u.yojin.description || '',
                    supportElements: Array.isArray(u.yojin.supportElements) ? 
                      u.yojin.supportElements : [],
                    kijin: u.yojin.kijin || {},
                    kijin2: u.yojin.kijin2 || {},
                    kyujin: u.yojin.kyujin || {}
                  }
                };
              }
              return u;
            }) : []
          };
        }
        
        setCompatibility(processedData);
        setError(null);
      } catch (err) {
        console.error('相性データの取得に失敗しました:', err);
        setError('相性データの取得に失敗しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompatibilityData();
  }, [open, userProfile, friendId, friendData]);
  
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="compatibility-modal-title"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '95%', sm: '500px' },
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        p: 3,
        overflow: 'auto'
      }}>
        <Typography 
          id="compatibility-modal-title" 
          variant="h6" 
          component="h2" 
          sx={{ 
            mb: 2, 
            fontWeight: 'bold',
            color: 'primary.dark'
          }}
        >
          相性診断結果
        </Typography>
        
        {loading ? (
          <LoadingOverlay 
            isLoading={loading}
            variant="transparent"
            contentType="tips"
            message="相性情報を分析中..."
            category="compatibility"
            opacity={0.7}
            showProgress={true}
            estimatedTime={8}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, opacity: 0.3 }}>
              <CircularProgress />
            </Box>
          </LoadingOverlay>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
            <Typography>{error}</Typography>
            <Button 
              variant="outlined" 
              onClick={onClose}
              sx={{ mt: 2 }}
            >
              閉じる
            </Button>
          </Box>
        ) : compatibility ? (
          <Box>
            {/* 相性スコアと概要 */}
            <Box display="flex" alignItems="center" mb={3}>
              <CompatibilityScore score={compatibility.score || 0} />
              <Box ml={2}>
                <Chip 
                  label={compatibility.relationshipType || '相性タイプ'}
                  sx={{
                    backgroundColor: compatibility.relationship === 'mutual_generation' || 
                                     compatibility.relationship === '相生'
                      ? '#4CAF50'
                      : compatibility.relationship === 'mutual_restriction' || 
                        compatibility.relationship === '相克'
                        ? '#F44336'
                        : '#9E9E9E',
                    color: 'white',
                    fontWeight: 'bold',
                    margin: '0.5rem 0'
                  }}
                />
                {compatibility.users && compatibility.users.length >= 2 && (
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {compatibility.users[0].displayName} ({
                      compatibility.users[0].element === 'wood' ? '木' :
                      compatibility.users[0].element === 'fire' ? '火' :
                      compatibility.users[0].element === 'earth' ? '土' :
                      compatibility.users[0].element === 'metal' ? '金' :
                      compatibility.users[0].element === 'water' ? '水' : '不明'
                    }) と {compatibility.users[1].displayName} ({
                      compatibility.users[1].element === 'wood' ? '木' :
                      compatibility.users[1].element === 'fire' ? '火' :
                      compatibility.users[1].element === 'earth' ? '土' :
                      compatibility.users[1].element === 'metal' ? '金' :
                      compatibility.users[1].element === 'water' ? '水' : '不明'
                    }) の相性です
                  </Typography>
                )}
              </Box>
            </Box>
            
            {/* 詳細説明の表示 */}
            <Box>
              {/* 基本説明 */}
              {compatibility.description && (
                <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                  <Typography variant="body1">{compatibility.description}</Typography>
                </Paper>
              )}
              
              {/* チーム内洞察 */}
              {compatibility.teamInsight && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    【チーム内での協力関係】
                  </Typography>
                  <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <Typography variant="body1">{compatibility.teamInsight}</Typography>
                  </Paper>
                </>
              )}
              
              {/* 協力のポイント */}
              {compatibility.collaborationTips && compatibility.collaborationTips.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    【協力のポイント】
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <ul>
                      {compatibility.collaborationTips.map((tip: string, i: number) => (
                        <li key={i}><Typography variant="body1">{tip}</Typography></li>
                      ))}
                    </ul>
                  </Box>
                </>
              )}
              
              {/* 拡張相性診断結果の詳細表示 */}
              {compatibility.enhancedDetails && (
                <>
                  <Divider sx={{ my: 3, borderColor: 'primary.light' }} />
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    【拡張相性診断の詳細】
                  </Typography>
                  
                  {/* 相性タイプ */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      関係性タイプ: 
                      <Chip 
                        label={compatibility.enhancedDetails.relationshipType || '一般的な関係'}
                        sx={{
                          ml: 1,
                          backgroundColor: 
                            compatibility.enhancedDetails.relationshipType === '理想的パートナー' || 
                            compatibility.enhancedDetails.relationshipType === '良好な協力関係' ? '#4CAF50' :
                            compatibility.enhancedDetails.relationshipType === '安定した関係' ? '#8BC34A' :
                            compatibility.enhancedDetails.relationshipType === '刺激的な関係' ? '#FFC107' :
                            compatibility.enhancedDetails.relationshipType === '要注意の関係' ? '#F44336' :
                            '#9E9E9E',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </Typography>
                  </Box>
                  
                  {/* 詳細スコア */}
                  <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      診断の詳細評価
                    </Typography>
                    
                    {/* 陰陽バランス */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ width: '180px' }}>
                        陰陽バランス:
                      </Typography>
                      <Box sx={{ 
                        height: '12px', 
                        width: '100%', 
                        bgcolor: '#e0e0e0', 
                        borderRadius: '6px',
                        position: 'relative' 
                      }}>
                        <Box sx={{ 
                          height: '100%',
                          width: `${compatibility.enhancedDetails.yinYangBalance}%`,
                          bgcolor: 
                            compatibility.enhancedDetails.yinYangBalance >= 80 ? '#4CAF50' :
                            compatibility.enhancedDetails.yinYangBalance >= 60 ? '#8BC34A' :
                            compatibility.enhancedDetails.yinYangBalance >= 40 ? '#FFC107' :
                            compatibility.enhancedDetails.yinYangBalance >= 20 ? '#FF9800' :
                            '#F44336',
                          borderRadius: '6px',
                        }} />
                      </Box>
                      <Typography variant="body2" sx={{ ml: 1, minWidth: '40px', textAlign: 'right' }}>
                        {compatibility.enhancedDetails.yinYangBalance}点
                      </Typography>
                    </Box>
                    
                    {/* 身強弱バランス */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ width: '180px' }}>
                        身強弱バランス:
                      </Typography>
                      <Box sx={{ 
                        height: '12px', 
                        width: '100%', 
                        bgcolor: '#e0e0e0', 
                        borderRadius: '6px',
                        position: 'relative' 
                      }}>
                        <Box sx={{ 
                          height: '100%',
                          width: `${compatibility.enhancedDetails.strengthBalance}%`,
                          bgcolor: 
                            compatibility.enhancedDetails.strengthBalance >= 80 ? '#4CAF50' :
                            compatibility.enhancedDetails.strengthBalance >= 60 ? '#8BC34A' :
                            compatibility.enhancedDetails.strengthBalance >= 40 ? '#FFC107' :
                            compatibility.enhancedDetails.strengthBalance >= 20 ? '#FF9800' :
                            '#F44336',
                          borderRadius: '6px',
                        }} />
                      </Box>
                      <Typography variant="body2" sx={{ ml: 1, minWidth: '40px', textAlign: 'right' }}>
                        {compatibility.enhancedDetails.strengthBalance}点
                      </Typography>
                    </Box>
                    
                    {/* 日支の関係 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ width: '180px' }}>
                        日支の関係 ({compatibility.enhancedDetails.dayBranchRelationship?.relationship || '通常'}):
                      </Typography>
                      <Box sx={{ 
                        height: '12px', 
                        width: '100%', 
                        bgcolor: '#e0e0e0', 
                        borderRadius: '6px',
                        position: 'relative' 
                      }}>
                        <Box sx={{ 
                          height: '100%',
                          width: `${compatibility.enhancedDetails.dayBranchRelationship?.score || 0}%`,
                          bgcolor: 
                            (compatibility.enhancedDetails.dayBranchRelationship?.score || 0) >= 80 ? '#4CAF50' :
                            (compatibility.enhancedDetails.dayBranchRelationship?.score || 0) >= 60 ? '#8BC34A' :
                            (compatibility.enhancedDetails.dayBranchRelationship?.score || 0) >= 40 ? '#FFC107' :
                            (compatibility.enhancedDetails.dayBranchRelationship?.score || 0) >= 20 ? '#FF9800' :
                            '#F44336',
                          borderRadius: '6px',
                        }} />
                      </Box>
                      <Typography variant="body2" sx={{ ml: 1, minWidth: '40px', textAlign: 'right' }}>
                        {compatibility.enhancedDetails.dayBranchRelationship?.score || 0}点
                      </Typography>
                    </Box>
                    
                    {/* 用神・喜神 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ width: '180px' }}>
                        用神・喜神の相性:
                      </Typography>
                      <Box sx={{ 
                        height: '12px', 
                        width: '100%', 
                        bgcolor: '#e0e0e0', 
                        borderRadius: '6px',
                        position: 'relative' 
                      }}>
                        <Box sx={{ 
                          height: '100%',
                          width: `${compatibility.enhancedDetails.usefulGods}%`,
                          bgcolor: 
                            compatibility.enhancedDetails.usefulGods >= 80 ? '#4CAF50' :
                            compatibility.enhancedDetails.usefulGods >= 60 ? '#8BC34A' :
                            compatibility.enhancedDetails.usefulGods >= 40 ? '#FFC107' :
                            compatibility.enhancedDetails.usefulGods >= 20 ? '#FF9800' :
                            '#F44336',
                          borderRadius: '6px',
                        }} />
                      </Box>
                      <Typography variant="body2" sx={{ ml: 1, minWidth: '40px', textAlign: 'right' }}>
                        {compatibility.enhancedDetails.usefulGods}点
                      </Typography>
                    </Box>
                    
                    {/* 日干の干合 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ width: '180px' }}>
                        日干の干合:
                      </Typography>
                      <Box sx={{ 
                        height: '12px', 
                        width: '100%', 
                        bgcolor: '#e0e0e0', 
                        borderRadius: '6px',
                        position: 'relative' 
                      }}>
                        <Box sx={{ 
                          height: '100%',
                          width: `${compatibility.enhancedDetails.dayGanCombination?.score || 0}%`,
                          bgcolor: 
                            (compatibility.enhancedDetails.dayGanCombination?.score || 0) >= 80 ? '#4CAF50' :
                            (compatibility.enhancedDetails.dayGanCombination?.score || 0) >= 60 ? '#8BC34A' :
                            (compatibility.enhancedDetails.dayGanCombination?.score || 0) >= 40 ? '#FFC107' :
                            (compatibility.enhancedDetails.dayGanCombination?.score || 0) >= 20 ? '#FF9800' :
                            '#F44336',
                          borderRadius: '6px',
                        }} />
                      </Box>
                      <Typography variant="body2" sx={{ ml: 1, minWidth: '40px', textAlign: 'right' }}>
                        {compatibility.enhancedDetails.dayGanCombination?.score || 0}点
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      この詳細情報は「陰陽・身強弱のバランス」「日支の関係」「用神・喜神の一致度」
                      「日干の干合」といった四柱推命の高度な要素に基づいて算出されています。
                    </Typography>
                  </Paper>
                </>
              )}
              
              {/* 従来の詳細説明形式もサポート - セクション分割された詳細表示 */}
              {compatibility.detailDescription && !compatibility.description && (
                <Box>
                  {/* 正規表現で各セクションを抽出して表示 */}
                  {compatibility.detailDescription.split(/【(.+?)】/).filter(Boolean).map((section: string, index: number) => {
                    if (index % 2 === 0) { // セクションタイトル
                      return (
                        <Typography variant="h6" gutterBottom key={`title-${index}`} sx={{ mt: 2 }}>
                          【{section}】
                        </Typography>
                      );
                    } else { // セクション内容
                      const content = section.trim();
                      
                      // 協力のポイントセクションは箇条書きとして処理
                      if (section.includes('協力のポイント')) {
                        const points = content.split(/・/).filter(Boolean);
                        return (
                          <Box key={`content-${index}`} sx={{ mb: 2 }}>
                            <ul>
                              {points.map((point: string, i: number) => (
                                <li key={i}><Typography variant="body1">{point.trim()}</Typography></li>
                              ))}
                            </ul>
                          </Box>
                        );
                      }
                      
                      // 通常のセクションはそのまま表示
                      return (
                        <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5', borderRadius: '8px' }} key={`content-${index}`}>
                          <Typography variant="body1">{content}</Typography>
                        </Paper>
                      );
                    }
                  })}
                </Box>
              )}
            </Box>
            
            {/* 閉じるボタン */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{ borderRadius: 5, px: 3 }}
              >
                閉じる
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>相性データが見つかりませんでした</Typography>
            <Button 
              variant="outlined" 
              onClick={onClose}
              sx={{ mt: 2 }}
            >
              閉じる
            </Button>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default CompatibilityModal;