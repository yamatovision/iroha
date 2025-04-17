import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, CircularProgress, Button, Paper } from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import FavoriteIcon from '@mui/icons-material/Favorite';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import teamService from '../../services/team.service';
import TeamList from '../../components/team/TeamList';
import TeamMembersList from '../../components/team/TeamMembersList';
import TeamGoalForm from '../../components/team/TeamGoalForm';
import { ITeam } from '../../../../shared/index';
import { useAuth } from '../../contexts/AuthContext';

/**
 * チーム管理ページ
 */
const Team: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [currentTeam, setCurrentTeam] = useState<ITeam | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTeamSelector, setShowTeamSelector] = useState<boolean>(false);

  // チーム情報の取得
  useEffect(() => {
    const fetchTeamData = async () => {
      console.log("URLパラメータのteamId:", teamId);
      
      if (!teamId) {
        // チームIDがない場合はチーム選択画面を表示
        console.log("チームID未指定: チーム選択画面を表示");
        setShowTeamSelector(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`チームID: ${teamId} の情報を取得中...`);
        const team = await teamService.getTeamById(teamId);
        console.log("取得成功:", team);
        setCurrentTeam(team);
        setShowTeamSelector(false);
        setError(null);
      } catch (err) {
        console.error(`Failed to fetch team data for team ${teamId}:`, err);
        setError('チーム情報の取得に失敗しました。後でもう一度お試しください。');
        setShowTeamSelector(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  // コンテキストからアクティブチーム設定関数を取得
  const { setActiveTeamId } = useAuth();

  // チーム選択時の処理
  const handleTeamSelect = (team: ITeam) => {
    console.log('チーム選択:', team.id, team.name);
    setCurrentTeam(team);
    
    // 選択されたチームをアクティブチームとして保存
    setActiveTeamId(team.id);
    
    const teamPath = `/team/${team.id}`;
    console.log('遷移先:', teamPath);
    navigate(teamPath);
    setShowTeamSelector(false);
  };

  // タブの切り替え
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (showTeamSelector || !currentTeam) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>チーム管理</Typography>
        <Typography variant="body2" gutterBottom sx={{ color: 'text.secondary', mb: 3 }}>
          チームを選択するか、新しいチームを作成して四柱推命に基づくチーム管理を始めましょう。
        </Typography>
        <TeamList onSelectTeam={handleTeamSelect} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()} 
          sx={{ mt: 2 }}
        >
          再読み込み
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        bgcolor: 'primary.main',
        color: 'white',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6">{currentTeam.name}</Typography>
        <Button 
          variant="outlined" 
          color="inherit" 
          size="small" 
          onClick={() => setShowTeamSelector(true)}
        >
          チーム変更
        </Button>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="チーム管理" icon={<GroupWorkIcon />} iconPosition="start" />
          <Tab label="経営者ダッシュボード" icon={<PeopleAltIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {/* チーム相性ページへのリンク */}
      <Paper 
        sx={{ 
          m: 3, 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: 'primary.light',
          color: 'white',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Box display="flex" alignItems="center">
          <FavoriteIcon sx={{ mr: 1 }} />
          <Typography variant="h6">チームメンバーの相性を確認</Typography>
        </Box>
        <Button 
          variant="contained" 
          color="secondary"
          component={Link}
          to={`/team/${currentTeam.id}/aisyou`}
          sx={{ fontWeight: 'bold' }}
        >
          相性分析ページへ
        </Button>
      </Paper>
      
      <Box sx={{ p: 3 }}>
        {activeTab === 0 && (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>チーム目標設定</Typography>
              <TeamGoalForm teamId={currentTeam.id} />
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>メンバー管理</Typography>
              <TeamMembersList teamId={currentTeam.id} />
            </Paper>
          </>
        )}
        
        {activeTab === 1 && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>経営者ダッシュボード</Typography>
            <Typography>この機能は開発中です。今後のアップデートをお待ちください。</Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default Team;