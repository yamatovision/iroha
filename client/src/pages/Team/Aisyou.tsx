import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  CircularProgress,
  Grid,
  Avatar,
  Button,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import teamService from '../../services/team.service';
import fortuneService from '../../services/fortune.service';
import styled from '@emotion/styled';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

// スタイル付きコンポーネント
const StyledRankingCard = styled(Paper)`
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

const StyledMemberCard = styled(Card)`
  transition: transform 0.2s, box-shadow 0.2s;
  margin: 0.5rem;
  border-radius: 12px;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
`;

// TypeScriptの型を修正
const ElementAvatar = styled(Avatar)(
  (props: { element: string }) => ({
    backgroundColor: elementColors[props.element as keyof typeof elementColors] || '#757575',
    marginRight: '1rem',
    width: '48px',
    height: '48px'
  })
);

const RankBadge = styled('div')(
  (props: { rank: number }) => ({
    backgroundColor: props.rank === 1 
      ? '#FFD700' // 金色 
      : props.rank === 2 
        ? '#C0C0C0' // 銀色
        : props.rank === 3 
          ? '#CD7F32' // 銅色
          : '#E0E0E0', // その他
    color: props.rank <= 3 ? '#000' : '#666',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    marginRight: '0.5rem'
  })
);

const CompatibilityScore = styled('div')(
  (props: { score: number }) => ({
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: props.score >= 80 
      ? '#4CAF50' // 高い相性
      : props.score >= 60 
        ? '#8BC34A' // 良い相性
        : props.score >= 40 
          ? '#FFC107' // 普通
          : props.score >= 20 
            ? '#FF9800' // あまり良くない
            : '#F44336', // 低い相性
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.2rem'
  })
);

const RelationshipChip = styled(Chip)(
  (props: { relationshipType: string }) => ({
    backgroundColor: props.relationshipType === 'mutual_generation' 
      ? '#4CAF50'
      : props.relationshipType === 'mutual_restriction' 
        ? '#F44336'
        : '#9E9E9E',
    color: 'white',
    fontWeight: 'bold',
    margin: '0.5rem 0'
  })
);

/**
 * チーム相性ページ
 */
const AisyouPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { userProfile, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [compatibility, setCompatibility] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  // コンテキストからアクティブチーム設定関数を取得
  const { setActiveTeamId } = useAuth();
  
  // 初期データの読み込み
  useEffect(() => {
    const fetchData = async () => {
      if (!teamId) {
        // チームIDがない場合は即座にチーム一覧ページにリダイレクト
        navigate('/team');
        return;
      }
      
      // 現在表示しているチームをアクティブチームとして設定 (管理者用)
      if (isAdmin || isSuperAdmin) {
        setActiveTeamId(teamId);
      }

      try {
        setLoading(true);
        // 並列でデータを取得
        const [teamData, rankingData, membersData] = await Promise.all([
          teamService.getTeamById(teamId),
          fortuneService.getTeamFortuneRanking(teamId),
          teamService.getTeamMembers(teamId)
        ]);

        console.log('チームデータ:', teamData);
        console.log('ランキングデータ:', rankingData);
        console.log('メンバーデータ:', membersData);

        // チームデータが存在しない場合（APIからnullまたは空のオブジェクトが返された場合）
        if (!teamData || !teamData.id) {
          // チーム一覧ページに即座にリダイレクト
          navigate('/team');
          return;
        }

        // メンバーデータのyojinオブジェクト構造を適切に処理
        const processedMembers = Array.isArray(membersData) ? membersData.map(member => {
          if (member && member.yojin && typeof member.yojin === 'object') {
            // yojinオブジェクトが正しい構造を持っているか確認し、修正
            return {
              ...member,
              yojin: {
                tenGod: member.yojin.tenGod || '',
                element: member.yojin.element || '',
                description: member.yojin.description || '',
                supportElements: Array.isArray(member.yojin.supportElements) ? 
                  member.yojin.supportElements : [],
                kijin: member.yojin.kijin || {},
                kijin2: member.yojin.kijin2 || {},
                kyujin: member.yojin.kyujin || {}
              }
            };
          }
          return member;
        }) : [];

        setTeam(teamData);
        // APIレスポンス構造に合わせて修正
        setRanking(rankingData.data?.ranking || []);
        setMembers(processedMembers || []);
        setError(null);
      } catch (error) {
        console.error('データ取得エラー:', error);
        // API取得エラーが発生した場合も即座にリダイレクト
        navigate('/team');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId, navigate, isAdmin, isSuperAdmin, setActiveTeamId]);

  // 相性詳細ダイアログを開く
  const handleOpenCompatibility = async (member: any) => {
    if (!userProfile || !teamId || !userProfile.id || !member.userId) {
      console.error('相性取得エラー:', { userProfile, teamId, memberId: member.userId });
      setError('ユーザー情報が不足しているため、相性を取得できません');
      return;
    }
    
    setSelectedMember(member);
    setDialogOpen(true);
    setDialogLoading(true);
    
    try {
      console.log('相性取得開始:', { 
        teamId, 
        userId: userProfile.id, 
        memberId: member.userId 
      });
      
      // 選択されたメンバーと現在のユーザーの相性を取得
      const compatibilityData = await teamService.getMemberCompatibility(
        teamId, 
        userProfile.id, // MongoDBのObjectID
        member.userId
      );
      console.log('相性データ:', compatibilityData);
      
      // 相性データ内のyojinオブジェクト構造を修正
      const processedCompatibility = compatibilityData ? {
        ...compatibilityData,
        users: Array.isArray(compatibilityData.users) ? compatibilityData.users.map((u: any) => {
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
      } : null;
      
      setCompatibility(processedCompatibility);
    } catch (error) {
      console.error('相性詳細取得エラー:', error);
      setError('メンバー間の相性詳細の取得に失敗しました');
    } finally {
      setDialogLoading(false);
    }
  };

  // 相性詳細ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMember(null);
    setCompatibility(null);
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box my={4}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button 
              component={Link} 
              to={`/team/${teamId}`} 
              startIcon={<ArrowBackIcon />}
              sx={{ ml: 2 }}
            >
              チームページに戻る
            </Button>
          </Alert>
        )}
        
        <Box display="flex" alignItems="center" mb={3}>
          {isAdmin && (
            <Button 
              component={Link} 
              to={`/team/${teamId}`} 
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              チーム管理
            </Button>
          )}
          <Typography variant="h4" component="h1">
            チーム相性分析
          </Typography>
        </Box>
        
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          {team?.name || 'チーム名'}のメンバー運勢・相性
        </Typography>
      </Box>

      {/* 運勢ランキングセクション */}
      <StyledRankingCard>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          今日の運勢ランキング
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          毎日3:00に更新されます
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        {ranking && ranking.length > 0 ? (
          <Box>
            {ranking.map((item, index) => (
              <Box 
                key={item.userId || index} 
                display="flex" 
                alignItems="center" 
                p={1}
                mb={1}
                sx={{ 
                  backgroundColor: (userProfile && item.userId === userProfile.id) ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
                  borderRadius: '8px'
                }}
              >
                <RankBadge rank={index + 1}>{index + 1}</RankBadge>
                <ElementAvatar element={item.elementAttribute || 'unknown'}>
                  {item.displayName?.charAt(0) || '?'}
                </ElementAvatar>
                <Box flexGrow={1}>
                  <Typography variant="body1">
                    {item.displayName}
                    {userProfile && item.userId === userProfile.id && (
                      <Chip 
                        label="あなた" 
                        size="small" 
                        color="primary" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {item.jobTitle || '役職未設定'}
                  </Typography>
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: item.score >= 80 ? '#4CAF50' : 
                           item.score >= 60 ? '#8BC34A' :
                           item.score >= 40 ? '#FFC107' :
                           item.score >= 20 ? '#FF9800' : '#F44336'
                  }}
                >
                  {item.score || 0}点
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body1" align="center" sx={{ my: 2 }}>
            ランキングデータがありません
          </Typography>
        )}
      </StyledRankingCard>

      {/* チームメンバーリストセクション */}
      <Box my={4}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          チームメンバーリスト
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          メンバーカードをクリックして相性を確認できます
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {members && members.length > 0 ? members.map((member) => (
            <Grid item xs={12} sm={6} md={4} key={member.userId}>
              <StyledMemberCard>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <ElementAvatar element={member.elementAttribute || 'unknown'}>
                      {member.displayName?.charAt(0) || '?'}
                    </ElementAvatar>
                    <Box>
                      <Typography variant="h6">
                        {member.displayName}
                        {userProfile && member.userId === userProfile.id && (
                          <Chip 
                            label="あなた" 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {member.role || '役職未設定'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    五行属性: {member.elementAttribute ? (
                      <Chip 
                        label={member.elementAttribute === 'wood' ? '木' :
                               member.elementAttribute === 'fire' ? '火' :
                               member.elementAttribute === 'earth' ? '土' :
                               member.elementAttribute === 'metal' ? '金' :
                               member.elementAttribute === 'water' ? '水' : '不明'}
                        size="small"
                        sx={{ 
                          backgroundColor: elementColors[member.elementAttribute as keyof typeof elementColors] || '#757575',
                          color: 'white'
                        }}
                      />
                    ) : '未設定'}
                  </Typography>
                  
                  {userProfile && member.userId !== userProfile.id && (
                    <Button 
                      variant="outlined" 
                      fullWidth
                      onClick={() => handleOpenCompatibility(member)}
                      sx={{ mt: 1 }}
                    >
                      相性を見る
                    </Button>
                  )}
                </CardContent>
              </StyledMemberCard>
            </Grid>
          )) : (
            <Grid item xs={12}>
              <Typography variant="body1" align="center">
                メンバーデータがありません
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
      
      {/* 相性詳細ダイアログ */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {userProfile?.displayName || 'あなた'} と {selectedMember?.displayName || 'メンバー'} の相性
        </DialogTitle>
        
        <DialogContent dividers>
          {dialogLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : compatibility ? (
            <Box component="div">
              {/* 相性スコアと概要 */}
              <Box display="flex" alignItems="center" mb={3}>
                <CompatibilityScore score={compatibility.score || 0}>
                  {compatibility.score || 0}
                </CompatibilityScore>
                <Box ml={2}>
                  <RelationshipChip 
                    label={compatibility.relationshipType || 
                           (compatibility.relationship ? 
                             relationshipLabels[compatibility.relationship as keyof typeof relationshipLabels] : 
                             '関係性不明')}
                    relationshipType={compatibility.relationship || 'neutral'}
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
              
              {/* 詳細説明（テキストをセクションに分割して表示） */}
              {compatibility.detailDescription && (
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
          ) : (
            <Typography variant="body1" align="center">
              相性データが見つかりませんでした
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AisyouPage;