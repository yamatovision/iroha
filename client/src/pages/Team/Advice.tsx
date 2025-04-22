import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Box, Typography, Button, CircularProgress, Divider, Paper, 
  Card, IconButton, Tooltip, Chip, CardContent, CardActions, 
  ButtonGroup, useTheme, Modal, TextField
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FlagIcon from '@mui/icons-material/Flag';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { ITeam, ITeamContextFortune } from '../../../../shared';
import teamService from '../../services/team.service';
import fortuneService from '../../services/fortune.service';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import TeamContextFortuneCard from '../../components/fortune/TeamContextFortuneCard';
import TeamFortuneRanking from '../../components/fortune/TeamFortuneRanking';
import TeamMembersList from '../../components/team/TeamMembersList';
import TeamGoalForm from '../../components/team/TeamGoalForm';
import TeamList from '../../components/team/TeamList';

// 管理アクションバーコンポーネント
// 管理者アクションバーは削除 - Material-UI コンポーネントで実装した新しいバージョンを使用

// ヘッダーのチーム選択ドロップダウンコンポーネント
const TeamSelectorHeader: React.FC<{
  activeTeam: ITeam | null;
  teams: ITeam[];
  onTeamSelect: (teamId: string) => void;
  isAdmin: boolean;
  onOpenManagement: () => void;
  onCreateTeam: () => void; // 新規チーム作成モーダルを開く関数
}> = ({ activeTeam, teams, onTeamSelect, isAdmin, onOpenManagement, onCreateTeam }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  // ドロップダウンの表示切り替え
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  // チーム選択処理
  const handleTeamSelect = (teamId: string) => {
    onTeamSelect(teamId);
    setMenuOpen(false);
  };
  
  return (
    <div className="header" style={{
      // 単色の濃い紫に変更
      backgroundColor: '#5e35b1',
      color: 'white',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* チーム選択表示を改善 */}
        <div style={{ 
          marginRight: '12px', 
          fontWeight: 'bold', 
          fontSize: '1rem',
          color: 'white',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}>
          チーム:
        </div>
        <div 
          className="team-selector" 
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(103, 58, 183, 0.9)', // 濃い紫色の背景
            borderRadius: '10px',
            padding: '8px 16px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 3px 10px rgba(0,0,0,0.25)', // より強いシャドウ
          }}
          onClick={toggleMenu}
        >
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            {activeTeam?.iconInitial || activeTeam?.name?.charAt(0) || 'T'}
          </div>
          <span style={{
            margin: '0 8px',
            maxWidth: '150px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'white', // テキストを白色に
          }}>
            {activeTeam?.name || 'チームを選択'}
          </span>
          <span className="material-icons" style={{ fontSize: '20px', color: 'white' }}>arrow_drop_down</span>
        </div>
        
        {/* 管理ボタンを常に表示（デバッグ用） */}
        {true && (
          <button 
            style={{
              backgroundColor: 'rgba(103, 58, 183, 0.9)', // 紫色の背景
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '10px',
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              marginLeft: '12px',
              boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
              fontSize: '14px',
              fontWeight: '500',
            }}
            title="チーム管理"
            onClick={onOpenManagement}
          >
            <SettingsIcon style={{ fontSize: '18px', marginRight: '6px' }} />
            管理
          </button>
        )}
      </div>
      
      {/* チーム選択メニュー - 視認性向上版 */}
      {menuOpen && (
        <div 
          style={{
            position: 'absolute',
            top: '70px',
            left: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            width: '290px',
            zIndex: 110,
            overflow: 'hidden',
            animation: 'fadeInDown 0.3s ease forwards',
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ 
            padding: '12px 16px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#673ab7', // 紫色の背景
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white' // 白色のテキスト
          }}>
            チームを選択
          </div>
          
          {teams.map(team => (
            <div 
              key={team.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: '1px solid #e0e0e0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeTeam?.id === team.id ? 'rgba(103, 58, 183, 0.08)' : 'transparent',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => handleTeamSelect(team.id)}
            >
              {/* アクティブなチームのマーカー */}
              {activeTeam?.id === team.id && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  backgroundColor: '#673ab7',
                }}></div>
              )}
              
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: team.iconColor ? `var(--${team.iconColor})` : 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  marginRight: '14px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  fontSize: '16px',
                }}
              >
                {team.iconInitial || team.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: activeTeam?.id === team.id ? 'bold' : '500', 
                  fontSize: '0.95rem', 
                  marginBottom: '4px', 
                  color: activeTeam?.id === team.id ? '#673ab7' : 'var(--text-primary)' 
                }}>
                  {team.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                  <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>people</span>
                  メンバー
                </div>
              </div>
              
              {/* 現在選択中の表示 */}
              {activeTeam?.id === team.id && (
                <div style={{
                  backgroundColor: 'rgba(103, 58, 183, 0.1)',
                  color: '#673ab7',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  marginLeft: '8px',
                }}>
                  選択中
                </div>
              )}
            </div>
          ))}
          
          {/* 新規チーム作成ボタン */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px',
              backgroundColor: 'rgba(103, 58, 183, 0.05)',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              borderTop: '1px solid #eee',
              borderBottom: '1px solid #eee',
            }}
            onClick={() => {
              setMenuOpen(false);
              onCreateTeam(); // 親から渡された関数を呼び出す
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '14px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
              }}
            >
              <span className="material-icons">add</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500', fontSize: '0.95rem', color: 'var(--primary)' }}>
                新規チームを作成
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                新しいチームを作成します
              </div>
            </div>
          </div>

          {/* 閉じるボタン */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px',
              backgroundColor: '#fafafa',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onClick={() => {
              setMenuOpen(false);
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#f0f0f0',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <span className="material-icons">close</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500', fontSize: '0.95rem', color: '#666' }}>
                閉じる
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                チーム選択を閉じます
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        backgroundColor: 'rgba(103, 58, 183, 0.3)',
        padding: '8px 12px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        <span className="material-icons" style={{ 
          marginRight: '20px', 
          fontSize: '1.4rem',
          color: 'white',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>notifications</span>
        <span className="material-icons" style={{ 
          fontSize: '1.4rem',
          color: 'white',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>account_circle</span>
      </div>
    </div>
  );
};

/**
 * チームアドバイスページ
 * - チーム選択
 * - チーム目標達成アドバイス
 * - メンバー運勢ランキング
 * - チームメンバーリスト
 */
const TeamAdvice: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { userProfile } = useAuth();
  const { 
    teams, 
    activeTeamId, 
    setActiveTeamId, 
    activeTeam,
    hasTeamPermission,
    getUserTeamRole,
    refreshTeams
  } = useTeam();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamContextFortune, setTeamContextFortune] = useState<ITeamContextFortune | null>(null);
  const [hasTeamGoal, setHasTeamGoal] = useState(false);
  const [isTeamAdmin, setIsTeamAdmin] = useState(false);
  
  // モーダル状態
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [createTeamModalOpen, setCreateTeamModalOpen] = useState(false);
  
  // 新規チーム作成用の状態
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  // チームが選択されていない場合はチームハブに遷移
  useEffect(() => {
    if (!teamId && !activeTeamId) {
      navigate('/team');
    } else if (teamId && teamId !== activeTeamId) {
      // URLのチームIDとアクティブチームIDが異なる場合、アクティブチームIDを更新
      setActiveTeamId(teamId);
    }
  }, [teamId, activeTeamId, navigate, setActiveTeamId]);
  
  // ユーザーの権限チェック - 強制的にリフレッシュするよう修正
  useEffect(() => {
    const checkPermissions = async () => {
      if (!teamId) return;
      
      console.log(`[TeamAdvice] 権限チェック開始: チームID=${teamId}`);
      
      // チームデータをリフレッシュ (teamService内のキャッシュをクリア)
      await refreshTeams();
      
      // 管理者権限をチェック - 管理権限があるかどうか
      const hasManagePermission = await hasTeamPermission('manage_team', teamId);
      console.log(`[TeamAdvice] 管理権限チェック結果: ${hasManagePermission}`);
      
      // ユーザーロールも直接取得して確認
      const userRole = await getUserTeamRole(teamId);
      console.log(`[TeamAdvice] 詳細なユーザーロール情報:`, userRole);
      
      // 管理者かどうかを判断 - memberRoleが'admin'または'creator'ならtrue
      const isAdmin = userRole.memberRole === 'admin' || userRole.memberRole === 'creator';
      console.log(`[TeamAdvice] memberRoleからの管理者判定: ${isAdmin}`);
      
      // 最終的な管理者判定結果を設定
      setIsTeamAdmin(isAdmin || hasManagePermission);
      
      // チーム目標の有無をチェック
      try {
        const goal = await teamService.getTeamGoal(teamId);
        console.log(`[TeamAdvice] チーム目標取得結果:`, goal);
        const hasGoal = !!goal && !!goal.content;
        console.log(`[TeamAdvice] チーム目標の有無: ${hasGoal}`);
        setHasTeamGoal(hasGoal);
      } catch (err) {
        console.warn('[TeamAdvice] チーム目標取得エラー:', err);
        setHasTeamGoal(false);
      }

      // 実際の権限とUI状態を確認するための追加ログ
      console.log('[TeamAdvice] 権限確認まとめ:');
      console.log(`- チームID: ${teamId}`);
      console.log(`- 管理者権限(hasTeamPermission): ${hasManagePermission}`);
      console.log(`- 管理者権限(memberRole): ${isAdmin}`);
      console.log(`- 最終isTeamAdmin設定: ${isAdmin || hasManagePermission}`);
    };
    
    checkPermissions();
  }, [teamId, hasTeamPermission, getUserTeamRole, refreshTeams]);

  // チームコンテキスト運勢データの取得
  useEffect(() => {
    const fetchTeamContextFortune = async () => {
      if (!teamId) return;
      
      try {
        setLoading(true);
        const data = await fortuneService.getTeamContextFortune(teamId);
        
        // 成功フラグをチェック
        if (data && data.success === false) {
          // 未実装・開発中の場合はエラーではなく情報提供として扱う
          if (data.message) {
            console.log('チームコンテキスト運勢情報:', data.message);
          }
          setTeamContextFortune(null);
        } else if (data && data.teamContextFortune) {
          setTeamContextFortune(data.teamContextFortune);
        } else {
          setTeamContextFortune(data);
        }
        
        setError(null);
      } catch (err) {
        console.error('チームコンテキスト運勢取得エラー:', err);
        // エラーがあっても致命的ではないため、共通エラーはセットしない
        // チームコンテキスト運勢がないだけで他の機能は動作可能
        setTeamContextFortune(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamContextFortune();
  }, [teamId]);

  // チーム選択処理
  const handleTeamSelect = async (selectedTeamId: string) => {
    try {
      await setActiveTeamId(selectedTeamId);
      navigate(`/team/${selectedTeamId}/advice`);
    } catch (err) {
      console.error('チーム選択エラー:', err);
      setError('チームの選択中にエラーが発生しました。');
    }
  };

  // チーム管理画面に遷移
  const handleOpenManagement = () => {
    if (activeTeamId) {
      navigate(`/team/${activeTeamId}`);
    }
  };
  
  // メンバー追加モーダルを表示
  const handleAddMember = () => {
    if (activeTeamId) {
      navigate(`/team/${activeTeamId}?action=addMember`);
    }
  };
  
  // チーム目標設定モーダルを表示
  const handleSetGoal = () => {
    setGoalModalOpen(true);
  };
  
  // チーム目標設定モーダルを閉じる
  const handleCloseGoalModal = () => {
    setGoalModalOpen(false);
  };
  
  // チーム目標設定完了後の処理
  const handleGoalSaved = async () => {
    try {
      // チーム目標の有無を再チェック
      if (teamId) {
        const goal = await teamService.getTeamGoal(teamId);
        setHasTeamGoal(!!goal && !!goal.content);
      }
      
      // モーダルを閉じる
      setGoalModalOpen(false);
    } catch (err) {
      console.error('チーム目標確認エラー:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <TeamSelectorHeader
        activeTeam={activeTeam}
        teams={teams}
        onTeamSelect={handleTeamSelect}
        isAdmin={isTeamAdmin}
        onOpenManagement={handleOpenManagement}
        onCreateTeam={() => setCreateTeamModalOpen(true)} // 新規チーム作成モーダルを開く関数を渡す
      />

      {/* 管理者アクションバー - 権限のあるユーザーのみ表示（視認性向上のため上部に配置） */}
      {teamId && isTeamAdmin && (
        <Box
          sx={{
            backgroundColor: '#f0eafb', // 明確な紫色の背景
            padding: '16px',
            marginBottom: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: '0 0 12px 12px'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1, sm: 0 } }}>
              <Box
                sx={{
                  bgcolor: 'rgba(103, 58, 183, 0.1)',
                  color: '#673ab7',
                  p: 1,
                  borderRadius: '50%'
                }}
              >
                <SettingsIcon />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#333' }}>
                  チーム管理
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  チームの設定や管理を行えます
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SettingsIcon />}
                onClick={handleOpenManagement}
                sx={{ bgcolor: '#673ab7', color: 'white' }}
              >
                設定
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={handleAddMember}
                sx={{ bgcolor: '#673ab7', color: 'white' }}
              >
                招待
              </Button>
              
              <Button
                variant="contained"
                color={hasTeamGoal ? "primary" : "success"}
                startIcon={hasTeamGoal ? <EditIcon /> : <FlagIcon />}
                onClick={handleSetGoal}
                sx={{ 
                  bgcolor: hasTeamGoal ? '#673ab7' : '#2e7d32', 
                  color: 'white' 
                }}
              >
                {hasTeamGoal ? "目標編集" : "目標設定"}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* メインコンテンツ */}
      <div className="main-content" style={{ 
        flex: 1, 
        padding: '32px 24px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '32px'
      }}>
        {error && (
          <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
            <Typography color="error">{error}</Typography>
            <Button 
              component={Link} 
              to="/team" 
              startIcon={<ArrowBackIcon />}
              sx={{ mt: 2 }}
            >
              チームハブに戻る
            </Button>
          </Paper>
        )}

        {/* チーム目標セクション - 常に表示（編集は権限に応じて） */}
        <div className="section" style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          padding: '24px',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          marginBottom: '32px'
        }}>
          <div className="section-title" style={{
            fontSize: '1.3rem',
            fontWeight: 600,
            marginBottom: '16px',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            letterSpacing: '0.01em'
          }}>
            <span className="material-icons" style={{ marginRight: '12px', color: 'var(--primary-light)', fontSize: '1.5rem' }}>
              flag
            </span>
            チーム目標
          </div>
          
          <Divider sx={{ mb: 3 }} />
          
          {teamId && hasTeamGoal && (
            <Box sx={{ mb: 4, position: 'relative' }}>
              {/* 目標表示エリア */}
              <TeamGoalDisplay teamId={teamId} />
              
              {/* 管理者のみ編集ボタン表示 */}
              {isTeamAdmin && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleSetGoal}
                  sx={{ 
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    color: '#673ab7',
                    borderColor: '#673ab7',
                    '&:hover': {
                      borderColor: '#5e35b1',
                      backgroundColor: 'rgba(94, 53, 177, 0.04)'
                    }
                  }}
                >
                  編集
                </Button>
              )}
            </Box>
          )}
          
          {teamId && !hasTeamGoal && (
            <Box sx={{ 
              p: 3,
              backgroundColor: 'rgba(103, 58, 183, 0.05)',
              borderRadius: 2,
              textAlign: 'center',
              mb: 3
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#673ab7' }}>
                チーム目標が設定されていません
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                目標を設定すると、チーム全体の方向性が明確になり、運勢アドバイスも最適化されます。
              </Typography>
              
              {isTeamAdmin && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FlagIcon />}
                  onClick={handleSetGoal}
                  sx={{ bgcolor: '#673ab7' }}
                >
                  目標を設定する
                </Button>
              )}
              
              {!isTeamAdmin && (
                <Typography variant="caption" color="text.secondary">
                  チーム管理者に目標設定を依頼してください
                </Typography>
              )}
            </Box>
          )}
        </div>
        
        {/* チーム目標達成アドバイス */}
        {activeTeam && teamContextFortune && (
          <TeamContextFortuneCard 
            fortune={teamContextFortune} 
            teamName={activeTeam.name}
          />
        )}

        {/* チームメンバー運勢ランキング */}
        {teamId && (
          <Box sx={{ mt: 2 }}>
            <TeamFortuneRanking teamId={teamId} />
          </Box>
        )}

        {/* チームメンバーリスト */}
        <div className="section" style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          padding: '24px',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div className="section-title" style={{
            fontSize: '1.3rem',
            fontWeight: 600,
            marginBottom: '16px',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            letterSpacing: '0.01em'
          }}>
            <span className="material-icons" style={{ marginRight: '12px', color: 'var(--primary-light)', fontSize: '1.5rem' }}>
              group
            </span>
            チームメンバー
          </div>
          
          <Divider sx={{ mb: 3 }} />
          
          {teamId && (
            <TeamMembersList teamId={teamId} />
          )}
        </div>
      </div>

      {/* フローティングアクションボタン */}
      <div 
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(106, 27, 154, 0.25)',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 80,
        }}
        onClick={() => navigate('/chat')}
      >
        <span className="material-icons">chat</span>
      </div>

      {/* ナビゲーションバー用の余白 */}
      <div style={{ paddingBottom: '100px' }}></div>
      
      {/* 新規チーム作成モーダル */}
      <Modal
        open={createTeamModalOpen}
        onClose={() => setCreateTeamModalOpen(false)}
        aria-labelledby="create-team-modal-title"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: 600 },
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* モーダルヘッダー */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: '#673ab7',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" id="create-team-modal-title">
              新しいチームを作成
            </Typography>
            <IconButton 
              onClick={() => setCreateTeamModalOpen(false)} 
              size="small"
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* モーダルコンテンツ - チーム作成フォーム */}
          <Box sx={{ p: 3, overflow: 'auto', flexGrow: 1 }}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newTeamName.trim()) return;
              
              try {
                // チーム作成API呼び出し
                const createdTeam = await teamService.createTeam({
                  name: newTeamName.trim(),
                  goal: newTeamDescription.trim() || undefined,
                });
                
                // 成功処理
                setCreateTeamModalOpen(false);
                setNewTeamName('');
                setNewTeamDescription('');
                
                // チーム一覧を更新して新しいチームのページに遷移
                await refreshTeams();
                navigate(`/team/${createdTeam.id}/advice`);
              } catch (err) {
                console.error('チーム作成エラー:', err);
                // エラー処理（実際のアプリではエラーメッセージを表示するとよい）
              }
            }}>
              <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
                新しいチームの情報を入力してください
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  チーム名<Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
                </Typography>
                <TextField
                  fullWidth
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="新しいチーム名"
                  required
                  size="small"
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  チームの説明（オプション）
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="チームの目的や役割について説明"
                  size="small"
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setCreateTeamModalOpen(false);
                    setNewTeamName('');
                    setNewTeamDescription('');
                  }}
                >
                  キャンセル
                </Button>
                <Button 
                  variant="contained"
                  type="submit"
                  disabled={!newTeamName.trim()}
                  startIcon={<AddIcon />}
                  sx={{ bgcolor: '#673ab7' }}
                >
                  チームを作成
                </Button>
              </Box>
            </form>
          </Box>
        </Box>
      </Modal>
      
      {/* チーム目標設定モーダル */}
      <Modal
        open={goalModalOpen}
        onClose={handleCloseGoalModal}
        aria-labelledby="team-goal-modal-title"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 600 },
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* モーダルヘッダー */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: '#673ab7',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" id="team-goal-modal-title">
              チーム目標の設定
            </Typography>
            <IconButton 
              onClick={handleCloseGoalModal} 
              size="small"
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* モーダルコンテンツ */}
          <Box sx={{ p: 3, overflow: 'auto', flexGrow: 1 }}>
            {teamId && (
              <TeamGoalForm teamId={teamId} />
            )}
          </Box>
          
          {/* モーダルフッター */}
          <Box sx={{ 
            p: 2, 
            borderTop: 1, 
            borderColor: 'divider', 
            display: 'flex', 
            justifyContent: 'flex-end' 
          }}>
            <Button 
              onClick={handleGoalSaved} 
              variant="contained"
              sx={{ bgcolor: '#673ab7' }}
            >
              完了
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

/**
 * チーム目標表示コンポーネント
 */
const TeamGoalDisplay: React.FC<{ teamId: string }> = ({ teamId }) => {
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTeamGoal = async () => {
      if (!teamId) return;
      
      try {
        setLoading(true);
        const goalData = await teamService.getTeamGoal(teamId);
        setGoal(goalData);
        setError(null);
      } catch (err) {
        console.error('チーム目標取得エラー:', err);
        setError('目標の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamGoal();
  }, [teamId]);
  
  if (loading) {
    return <CircularProgress size={24} />;
  }
  
  if (error || !goal) {
    return (
      <Typography color="error">
        {error || '目標が見つかりません。'}
      </Typography>
    );
  }
  
  // 期限の日付フォーマット
  const formattedDeadline = goal.deadline 
    ? new Date(goal.deadline).toLocaleDateString('ja-JP', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : null;
  
  return (
    <Box sx={{ position: 'relative' }}>
      <Typography 
        variant="h6" 
        component="div"
        sx={{ 
          mb: 1,
          color: 'text.primary',
          fontWeight: 500
        }}
      >
        {goal.content}
      </Typography>
      
      {formattedDeadline && (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: 'text.secondary',
            mb: 2
          }}
        >
          <EventIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
          <Typography variant="body2">
            目標期限: {formattedDeadline}
          </Typography>
        </Box>
      )}
      
      {goal.progress !== undefined && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 0.5
          }}>
            <Typography variant="body2" color="text.secondary">
              進捗状況
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="primary">
              {goal.progress}%
            </Typography>
          </Box>
          <Box 
            sx={{ 
              height: 8, 
              width: '100%', 
              bgcolor: 'rgba(103, 58, 183, 0.1)',
              borderRadius: 4,
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${goal.progress}%`,
                bgcolor: '#673ab7',
                borderRadius: 4,
                transition: 'width 0.3s ease'
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TeamAdvice;