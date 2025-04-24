import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Box, Typography, Button, CircularProgress, Divider, Paper, 
  Card, IconButton, Tooltip, Chip, CardContent, CardActions, 
  ButtonGroup, useTheme, Modal, TextField, Menu, MenuItem
} from '@mui/material';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FlagIcon from '@mui/icons-material/Flag';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import DeleteIcon from '@mui/icons-material/Delete';
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
import apiService from '../../services/api.service';
import { TEAM } from '../../../../shared';

// 管理アクションバーコンポーネント
// 管理者アクションバーは削除 - Material-UI コンポーネントで実装した新しいバージョンを使用

// ヘッダーのチーム選択ドロップダウンコンポーネント (シンプル化版)
const TeamSelectorHeader: React.FC<{
  activeTeam: ITeam | null;
  teams: ITeam[];
  onTeamSelect: (teamId: string) => void;
  isAdmin: boolean;
  onOpenManagement: () => void;
  onCreateTeam: () => void; // 新規チーム作成モーダルを開く関数
}> = ({ activeTeam, teams, onTeamSelect, onCreateTeam, isAdmin, onOpenManagement }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminMenuAnchor, setAdminMenuAnchor] = useState<null | HTMLElement>(null);
  const adminMenuOpen = Boolean(adminMenuAnchor);
  const navigate = useNavigate();
  
  // ドロップダウンの表示切り替え
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  // チーム選択処理
  const handleTeamSelect = (teamId: string) => {
    onTeamSelect(teamId);
    setMenuOpen(false);
  };
  
  // TeamContextのrefreshTeams関数を取得
  const { refreshTeams } = useTeam();
  
  // チーム削除ハンドラー
  const handleDeleteTeam = async () => {
    if (!activeTeam) return;
    
    // 確認ダイアログ
    if (!window.confirm(`チーム「${activeTeam.name}」を削除してもよろしいですか？\nこの操作は元に戻せません。`)) {
      return;
    }
    
    try {
      // メニューを閉じる
      setAdminMenuAnchor(null);
      
      // チーム削除
      await teamService.deleteTeam(activeTeam.id);
      
      // リストを更新してチームハブに戻る
      await refreshTeams();
      navigate('/team');
    } catch (err) {
      console.error('チーム削除エラー:', err);
      alert('チームの削除に失敗しました。');
    }
  };

  return (
    <Box sx={{
      backgroundColor: '#5e35b1',
      color: 'white',
      padding: { xs: '12px 16px', sm: '16px 24px' },
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center', // 中央揃え
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      {/* チーム選択コンテナ (中央寄せ) */}
      <Box sx={{
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '300px',
        width: '100%',
        position: 'relative'
      }}>
        {/* チーム名ラベル (完全に非表示) */}
        <Typography 
          sx={{ 
            fontWeight: 'bold', 
            fontSize: '1rem',
            color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            display: 'none',
            mr: 1.5
          }}
        >
          チーム:
        </Typography>
        
        {/* チーム選択ドロップダウン */}
        <Box 
          className="team-selector" 
          sx={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(103, 58, 183, 0.9)', 
            borderRadius: '10px',
            padding: { xs: '10px 16px', sm: '10px 20px' },
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
            '&:hover': {
              background: 'rgba(103, 58, 183, 1)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }
          }}
          onClick={toggleMenu}
        >
          <Box sx={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '10px',
            fontSize: '15px',
            fontWeight: 'bold',
          }}>
            {activeTeam?.iconInitial || activeTeam?.name?.charAt(0) || 'T'}
          </Box>
          <Typography sx={{
            maxWidth: { xs: '180px', sm: '220px' },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: { xs: '0.95rem', sm: '1.05rem' },
            fontWeight: '600',
            color: 'white',
          }}>
            {activeTeam?.name || 'チームを選択'}
          </Typography>
          <Box 
            component="span" 
            className="material-icons" 
            sx={{ 
              ml: 1,
              fontSize: '24px', 
              color: 'white' 
            }}
          >
            arrow_drop_down
          </Box>
        </Box>
        
        {/* 管理者メニューボタン */}
        {isAdmin && activeTeam && (
          <Box sx={{
            position: 'absolute',
            right: '-140px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}>
            <Tooltip title="チーム管理">
              <IconButton
                onClick={(event) => setAdminMenuAnchor(event.currentTarget)}
                sx={{ color: 'white' }}
                aria-controls={adminMenuOpen ? 'admin-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={adminMenuOpen ? 'true' : undefined}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            
            {/* 管理者メニュー */}
            <Menu
              id="admin-menu"
              anchorEl={adminMenuAnchor}
              open={adminMenuOpen}
              onClose={() => setAdminMenuAnchor(null)}
              MenuListProps={{
                'aria-labelledby': 'admin-menu-button',
              }}
            >
              <MenuItem onClick={handleDeleteTeam}>
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                チームを削除
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>
      
      {/* チーム選択メニュー - 視認性向上版 */}
      {menuOpen && (
        <Box 
          sx={{
            position: 'absolute',
            top: { xs: '55px', sm: '65px' },
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            width: { xs: '90%', sm: '320px' },
            maxWidth: '400px',
            zIndex: 110,
            overflow: 'hidden',
            animation: 'fadeInDown 0.3s ease forwards',
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <Box sx={{ 
            padding: '14px 18px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#673ab7',
            fontSize: '15px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            チームを選択
          </Box>
          
          {teams.map(team => (
            <Box 
              key={team.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                borderBottom: '1px solid #e0e0e0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeTeam?.id === team.id ? 'rgba(103, 58, 183, 0.08)' : 'transparent',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  backgroundColor: 'rgba(103, 58, 183, 0.05)'
                }
              }}
              onClick={() => handleTeamSelect(team.id)}
            >
              {/* アクティブなチームのマーカー */}
              {activeTeam?.id === team.id && (
                <Box sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  backgroundColor: '#673ab7',
                }}></Box>
              )}
              
              <Box
                sx={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: team.iconColor ? `var(--${team.iconColor})` : 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  marginRight: '16px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  fontSize: '18px',
                }}
              >
                {team.iconInitial || team.name.charAt(0)}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ 
                  fontWeight: activeTeam?.id === team.id ? 'bold' : '500', 
                  fontSize: '1rem', 
                  mb: 0.5, 
                  color: activeTeam?.id === team.id ? '#673ab7' : 'text.primary'
                }}>
                  {team.name}
                </Typography>
                <Box sx={{ 
                  fontSize: '0.8rem', 
                  color: 'text.secondary', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <Box component="span" className="material-icons" sx={{ fontSize: '14px', mr: 0.5 }}>people</Box>
                  メンバー
                </Box>
              </Box>
              
              {/* 現在選択中の表示 */}
              {activeTeam?.id === team.id && (
                <Box sx={{
                  backgroundColor: 'rgba(103, 58, 183, 0.1)',
                  color: '#673ab7',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  ml: 1,
                }}>
                  選択中
                </Box>
              )}
            </Box>
          ))}
          
          {/* 新規チーム作成ボタン */}
          <Box 
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: 'rgba(103, 58, 183, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderTop: '1px solid #eee',
              borderBottom: '1px solid #eee',
              '&:hover': {
                backgroundColor: 'rgba(103, 58, 183, 0.1)'
              }
            }}
            onClick={() => {
              setMenuOpen(false);
              onCreateTeam();
            }}
          >
            <Box
              sx={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                mr: 2,
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
              }}
            >
              <Box component="span" className="material-icons">add</Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: '500', fontSize: '0.95rem', color: 'primary.main' }}>
                新規チームを作成
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                新しいチームを作成します
              </Typography>
            </Box>
          </Box>

          {/* 閉じるボタン */}
          <Box 
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: '#fafafa',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#f0f0f0'
              }
            }}
            onClick={() => {
              setMenuOpen(false);
            }}
          >
            <Box
              sx={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#f0f0f0',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                mr: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <Box component="span" className="material-icons">close</Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: '500', fontSize: '0.95rem', color: '#666' }}>
                閉じる
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                チーム選択を閉じます
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
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
    const handleTeamSelection = async () => {
      if (!teamId && !activeTeamId) {
        navigate('/team');
      } else if (teamId && teamId !== activeTeamId) {
        // 重要: URL由来のチームIDが使用される前に、チームIDに関連するキャッシュをクリア
        console.log(`[TeamAdvice] チームIDが変更されました: ${activeTeamId} -> ${teamId}`);
        
        try {
          // すべてのチーム関連キャッシュをクリア
          console.log('[TeamAdvice] チーム関連のキャッシュをクリア');
          
          // チームメンバー関連のキャッシュをクリア
          await apiService.clearCache(`/api/v1/teams/${teamId}/members`);
          
          // チーム運勢関連のキャッシュをクリア
          await apiService.clearCache(`/api/v1/fortune/team/${teamId}/context`);
          await apiService.clearCache(`/api/v1/fortune/team/${teamId}/ranking`);
          
          // チーム目標関連のキャッシュをクリア
          await apiService.clearCache(`/api/v1/teams/${teamId}/goal`);
          
          // 古いチームIDのキャッシュも念のためクリア
          if (activeTeamId) {
            await apiService.clearCache(`/api/v1/teams/${activeTeamId}/members`);
            await apiService.clearCache(`/api/v1/fortune/team/${activeTeamId}/context`);
            await apiService.clearCache(`/api/v1/fortune/team/${activeTeamId}/ranking`);
            await apiService.clearCache(`/api/v1/teams/${activeTeamId}/goal`);
          }
          
          // 無効なチームID（6806c251ee9352d08ceba138）も念のためクリア
          await apiService.clearCache(`/api/v1/teams/6806c251ee9352d08ceba138/members`);
          await apiService.clearCache(`/api/v1/fortune/team/6806c251ee9352d08ceba138/context`);
          await apiService.clearCache(`/api/v1/fortune/team/6806c251ee9352d08ceba138/ranking`);
          await apiService.clearCache(`/api/v1/teams/6806c251ee9352d08ceba138/goal`);
          
          console.log('[TeamAdvice] キャッシュクリア完了、アクティブチームID更新');
        } catch (err) {
          console.error('[TeamAdvice] キャッシュクリア中にエラー:', err);
        }
        
        // URLのチームIDとアクティブチームIDが異なる場合、アクティブチームIDを更新
        setActiveTeamId(teamId);
      }
    };
    
    handleTeamSelection();
  }, [teamId, activeTeamId, navigate, setActiveTeamId]);
  
  // ユーザーの権限チェック - キャッシュを活用して不要な再取得を防止
  useEffect(() => {
    const checkPermissions = async () => {
      if (!teamId) return;
      
      console.log(`[TeamAdvice] 権限チェック開始: チームID=${teamId}`);
      
      try {
        // 管理者権限をチェック - 管理権限があるかどうか
        const hasManagePermission = await hasTeamPermission('manage_team', teamId);
        console.log(`[TeamAdvice] 管理権限チェック結果: ${hasManagePermission}`);
        
        // ユーザーロールも取得して確認 (キャッシュが利用される)
        const userRole = await getUserTeamRole(teamId);
        console.log(`[TeamAdvice] 詳細なユーザーロール情報:`, userRole);
        
        // 管理者かどうかを判断 - memberRoleが'admin'または'creator'ならtrue
        const isAdmin = userRole.memberRole === 'admin' || userRole.memberRole === 'creator';
        console.log(`[TeamAdvice] memberRoleからの管理者判定: ${isAdmin}`);
        
        // 最終的な管理者判定結果を設定
        setIsTeamAdmin(isAdmin || hasManagePermission);
        
        // チーム目標の有無をチェック - キャッシュのためにclearCacheを使わない
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
      } catch (error) {
        console.error('[TeamAdvice] 権限チェックエラー:', error);
      }
    };
    
    checkPermissions();
  }, [teamId, hasTeamPermission, getUserTeamRole]);

  // チームコンテキスト運勢データの取得
  useEffect(() => {
    const fetchTeamContextFortune = async () => {
      if (!teamId) return;
      
      console.log(`[TeamContextFortune] 🚀 運勢データ取得開始: teamId=${teamId}, userId=${userProfile?.id || '不明'}`);
      const startTime = Date.now();
      
      try {
        setLoading(true);
        
        // ダイレクトAPI呼び出しでデータを取得（キャッシュを完全に回避）
        console.log(`[TeamContextFortune] 🔄 API直接呼び出し: /api/v1/fortune/team/${teamId}/context`);
        
        // JWT認証トークンを取得（サービスから直接）
        // Note: トークンは実際にはapiServiceが内部で処理するので、
        // ここではキャッシュのみをクリアする
        console.log(`[TeamContextFortune] 🧹 キャッシュをクリアします: /api/v1/fortune/team/${teamId}/context`);
        await apiService.clearCache(`/api/v1/fortune/team/${teamId}/context`);
        
        // apiServiceを使用してデータ取得（キャッシュをスキップオプション付き）
        const response = await apiService.get(`/api/v1/fortune/team/${teamId}/context`, undefined, {
          skipCache: true,
          forceRefresh: true
        });
        
        // レスポンスボディの全体をログ出力（truncateなし）
        const data = response.data;
        const elapsedTime = Date.now() - startTime;
        
        console.log('[TeamContextFortune] 📦 生データ完全版:');
        console.log(JSON.stringify(data, null, 2));
        
        // 成功フラグをチェック
        if (data && data.success === false) {
          // 未実装・開発中の場合はエラーではなく情報提供として扱う
          if (data.message) {
            console.log(`[TeamContextFortune] ℹ️ 情報: ${data.message} (${elapsedTime}ms)`);
          }
          setTeamContextFortune(null);
        } else if (data && data.teamContextFortune) {
          console.log(`[TeamContextFortune] ✅ 既存データ取得成功: ID=${data.teamContextFortune._id || '不明'}, 日付=${new Date(data.teamContextFortune.date).toLocaleDateString()} (${elapsedTime}ms)`);
          
          // データの詳細な分析
          console.log('teamContextAdvice:', JSON.stringify(data.teamContextFortune.teamContextAdvice));
          console.log('collaborationTips:', JSON.stringify(data.teamContextFortune.collaborationTips));
          
          // 特に問題があるかもしれないプロパティをチェック
          const checkForNull = (obj: any, path = '') => {
            if (obj === null) {
              console.warn(`[TeamContextFortune] ⚠️ NULL値を検出: ${path}`);
              return;
            }
            if (typeof obj !== 'object') return;
            
            Object.entries(obj).forEach(([key, value]) => {
              const newPath = path ? `${path}.${key}` : key;
              if (value === null) {
                console.warn(`[TeamContextFortune] ⚠️ NULL値を検出: ${newPath}`);
              } else if (value === undefined) {
                console.warn(`[TeamContextFortune] ⚠️ undefined値を検出: ${newPath}`);
              } else if (typeof value === 'object') {
                checkForNull(value, newPath);
              }
            });
          };
          
          checkForNull(data.teamContextFortune);
          
          // 状態を更新
          setTeamContextFortune(data.teamContextFortune);
        } else if (data && data.isNewlyGenerated) {
          console.log(`[TeamContextFortune] 🆕 新規生成完了: ID=${data._id || '不明'}, 日付=${new Date(data.date).toLocaleDateString()} (${elapsedTime}ms)`);
          setTeamContextFortune(data);
        } else {
          console.log(`[TeamContextFortune] ℹ️ データ取得: (${elapsedTime}ms)`);
          setTeamContextFortune(data);
        }
        
        setError(null);
      } catch (err) {
        console.error(`[TeamContextFortune] ❌ 取得エラー: ${err}`, err);
        // エラーがあっても致命的ではないため、共通エラーはセットしない
        // チームコンテキスト運勢がないだけで他の機能は動作可能
        setTeamContextFortune(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamContextFortune();
  }, [teamId, userProfile?.id]);

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
        console.log('チーム目標設定完了 - データ再取得');
        
        // キャッシュの代わりにPRG (Post-Redirect-Get) パターンを使用
        // apiServiceのキャッシュをクリアせず、代わりに新しいリクエストを送信
        
        // 目標データを取得 (キャッシュの有効期限が短い場合は新しいデータが取得される)
        const goal = await teamService.getTeamGoal(teamId);
        console.log('チーム目標データ:', goal);
        
        // 目標の有無を更新
        const hasGoal = !!goal && !!goal.content;
        console.log(`チーム目標の有無を更新: ${hasGoal}`);
        setHasTeamGoal(hasGoal);
      }
      
      // モーダルを閉じる
      setGoalModalOpen(false);
    } catch (err) {
      console.error('チーム目標確認エラー:', err);
    }
  };

  if (loading) {
    return (
      <LoadingOverlay 
        isLoading={loading}
        variant="transparent"
        contentType="tips"
        message="チーム運勢を分析中..."
        category="team"
        opacity={0.75}
        showProgress={true}
        estimatedTime={12}
      >
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" />
      </LoadingOverlay>
    );
  }

  return (
    <Box className="app-container" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ヘッダー - シンプル化してチーム選択のみに */}
      <TeamSelectorHeader
        activeTeam={activeTeam}
        teams={teams}
        onTeamSelect={handleTeamSelect}
        isAdmin={isTeamAdmin}
        onOpenManagement={handleOpenManagement}
        onCreateTeam={() => setCreateTeamModalOpen(true)}
      />

      {/* 管理者アクションバーは削除 - 他の場所に同じ機能があるため */}

      {/* メインコンテンツ */}
      <Box className="main-content" sx={{ 
        flex: 1, 
        padding: { xs: '16px 12px', sm: '24px 20px', md: '32px 24px' }, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: { xs: '24px', sm: '28px', md: '32px' }
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
        <Box className="section" sx={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          padding: { xs: '16px', sm: '20px', md: '24px' },
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          marginBottom: { xs: '24px', sm: '28px', md: '32px' }
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: '16px'
          }}>
            <Box className="section-title" sx={{
              fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
              fontWeight: 600,
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              letterSpacing: '0.01em'
            }}>
              <Box 
                component="span" 
                className="material-icons" 
                sx={{ 
                  mr: { xs: 1, sm: 1.5 }, 
                  color: 'var(--primary-light)', 
                  fontSize: { xs: '1.3rem', sm: '1.5rem' } 
                }}
              >
                flag
              </Box>
              チーム目標
            </Box>
            
            {/* 管理者のみ編集ボタン表示 - 見出しの右側に配置 */}
            {isTeamAdmin && hasTeamGoal && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={handleSetGoal}
                sx={{ 
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
          
          <Divider sx={{ mb: 3 }} />
          
          {teamId && hasTeamGoal && (
            <Box sx={{ mb: 4 }}>
              {/* 目標表示エリア */}
              <TeamGoalDisplay teamId={teamId} />
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
        </Box>
        
        {/* チーム目標達成アドバイス */}
        {activeTeam && (
          <Box className="section" sx={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            padding: { xs: '16px', sm: '20px', md: '24px' },
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            marginBottom: { xs: '24px', sm: '28px', md: '32px' }
          }}>
            <Box className="section-title" sx={{
              fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
              fontWeight: 600,
              marginBottom: '16px',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              letterSpacing: '0.01em'
            }}>
              <Box 
                component="span" 
                className="material-icons" 
                sx={{ 
                  mr: { xs: 1, sm: 1.5 }, 
                  color: 'var(--primary-light)', 
                  fontSize: { xs: '1.3rem', sm: '1.5rem' } 
                }}
              >
                insights
              </Box>
              チームコンテキスト運勢
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {teamContextFortune ? (
              <>
                {/* 通常のカードは使わない（表示に問題があるため） */}
                {false && (
                  <TeamContextFortuneCard 
                    fortune={teamContextFortune as ITeamContextFortune} 
                    teamName={activeTeam?.name || 'チーム'}
                  />
                )}
                {/* 超シンプルな直接表示（通常カードは非表示） */}
                <Box sx={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                  padding: '0',
                  overflow: 'hidden',
                  margin: '8px 0 24px 0',
                  width: '100%'
                }}>
                  <Box sx={{
                    padding: { xs: '12px', sm: '16px' },
                    backgroundImage: 'linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: { xs: '16px', sm: '18px' },
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                    gap: { xs: 1, sm: 0 }
                  }}>
                    <Typography fontWeight="bold">チームコンテキスト運勢</Typography>
                    <Box sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: { xs: '2px 8px', sm: '4px 12px' },
                      borderRadius: '20px',
                      fontSize: { xs: '14px', sm: '16px' },
                      ml: { xs: 'auto', sm: 0 }
                    }}>スコア: {teamContextFortune.score}</Box>
                  </Box>
                
                  <Box sx={{
                    padding: { xs: '16px', sm: '20px', md: '24px' },
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6'
                  }}>
                    <Typography
                      sx={{
                        color: '#673ab7', 
                        fontSize: { xs: '18px', sm: '20px' }, 
                        mt: 0,
                        mb: { xs: 2, sm: 2.5 },
                        borderBottom: '2px solid #f0f0f0',
                        pb: { xs: 1, sm: 1.5 },
                        fontWeight: 'bold'
                      }}
                      component="h2"
                    >
                      本日のチーム運勢 - {activeTeam?.name || 'チーム'}
                    </Typography>
                    
                    <Typography
                      sx={{
                        color: '#666',
                        fontSize: { xs: '12px', sm: '14px' },
                        mb: { xs: 1.5, sm: 2.5 }
                      }}
                    >
                      {new Date(teamContextFortune.date).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </Typography>
                    
                    {/* チームコンテキスト運勢とチーム目標達成アドバイスの表示 */}
                    {teamContextFortune.teamContextAdvice && (
                      <Box sx={{marginBottom: '24px'}}>
                        {/* セクション1: チームコンテキストにおける運勢 */}
                        {(() => {
                          const text = teamContextFortune.teamContextAdvice;
                          const contextSection = text.split('## チームコンテキストにおける運勢');
                          if (contextSection.length > 1) {
                            const contextContent = contextSection[1].split('##')[0].trim();
                            if (contextContent) {
                              return (
                                <Box sx={{marginBottom: '20px'}}>
                                  <Typography 
                                    component="h3" 
                                    sx={{
                                      color: '#673ab7', 
                                      fontSize: { xs: '14px', sm: '16px' }, 
                                      marginBottom: '12px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    チームコンテキストにおける運勢:
                                  </Typography>
                                  <Box sx={{
                                    lineHeight: '1.7',
                                    fontSize: { xs: '13px', sm: '14px', md: '16px' }
                                  }}>{contextContent}</Box>
                                </Box>
                              );
                            }
                          }
                          return null;
                        })()}

                        {/* セクション2: チーム目標達成のための具体的アドバイス */}
                        {(() => {
                          const text = teamContextFortune.teamContextAdvice;
                          const goalSection = text.split('## チーム目標達成のための具体的アドバイス');
                          if (goalSection.length > 1) {
                            const goalContent = goalSection[1].split('##')[0].trim();
                            if (goalContent) {
                              return (
                                <Box sx={{marginBottom: '20px'}}>
                                  <Typography 
                                    component="h3" 
                                    sx={{
                                      color: '#673ab7', 
                                      fontSize: { xs: '14px', sm: '16px' }, 
                                      marginBottom: '12px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    チーム目標達成のためのアドバイス:
                                  </Typography>
                                  <Box sx={{
                                    lineHeight: '1.7',
                                    fontSize: { xs: '13px', sm: '14px', md: '16px' }
                                  }}>{goalContent}</Box>
                                </Box>
                              );
                            }
                          }
                          return null;
                        })()}
                      </Box>
                    )}
                    
                    {/* チーム内での役割発揮のポイントを表示（MarkDownから抽出） */}
                    {teamContextFortune.teamContextAdvice && teamContextFortune.collaborationTips && (
                      <Box sx={{
                        mt: { xs: 1, sm: 2 }, 
                        p: { xs: 2, sm: 2.5 }, 
                        backgroundColor: '#f5f0ff', 
                        borderRadius: '8px',
                        border: '1px solid #e9e3f5'
                      }}>
                        <Typography
                          component="h3"
                          sx={{
                            color: '#673ab7', 
                            fontSize: { xs: '14px', sm: '16px' }, 
                            mt: 0,
                            mb: { xs: 1, sm: 1.5 },
                            fontWeight: 'bold'
                          }}
                        >
                          今日のチーム協力アドバイス:
                        </Typography>
                        <Box sx={{ lineHeight: '1.7', fontSize: { xs: '13px', sm: '14px', md: '16px' } }}>
                          {/* コラボレーションヒントがある場合はそれを表示、なければマークダウンから「チーム内での役割発揮のポイント」セクションを抽出して表示 */}
                          {(() => {
                            if (Array.isArray(teamContextFortune.collaborationTips) && teamContextFortune.collaborationTips.length > 0) {
                              return teamContextFortune.collaborationTips.join('\n\n');
                            }
                            
                            const text = teamContextFortune.teamContextAdvice;
                            const roleSection = text.split('## チーム内での役割発揮のポイント');
                            if (roleSection.length > 1) {
                              // 次の見出しまたは文末までの内容を抽出
                              const content = roleSection[1].split('##')[0].trim();
                              return content;
                            } else {
                              // セクションが見つからない場合、全文を表示
                              return text;
                            }
                          })()}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                p: 3,
                backgroundColor: 'rgba(103, 58, 183, 0.05)',
                borderRadius: 2,
                textAlign: 'center',
                mb: 3
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#673ab7' }}>
                  チームコンテキスト運勢データが見つかりません
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                  現在、このチームのコンテキスト運勢データがありません。データが生成されるまでお待ちください。
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* チームメンバー運勢ランキング */}
        {teamId && (
          <TeamFortuneRanking teamId={teamId} />
        )}

        {/* チームメンバーリスト */}
        <Box className="section" sx={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          padding: { xs: '16px', sm: '20px', md: '24px' },
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <Box className="section-title" sx={{
            fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
            fontWeight: 600,
            marginBottom: '16px',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            letterSpacing: '0.01em'
          }}>
            <Box 
              component="span" 
              className="material-icons" 
              sx={{ 
                mr: { xs: 1, sm: 1.5 }, 
                color: 'var(--primary-light)', 
                fontSize: { xs: '1.3rem', sm: '1.5rem' } 
              }}
            >
              group
            </Box>
            チームメンバー
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {teamId && (
            <TeamMembersList teamId={teamId} />
          )}
        </Box>

        {/* チーム脱退ボタン（管理者ではない場合のみ表示） */}
        {teamId && !isTeamAdmin && (
          <Box sx={{ 
            mt: 4, 
            mb: 6, 
            display: 'flex', 
            justifyContent: 'center',
            borderTop: '1px solid #eee',
            paddingTop: 4
          }}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<ExitToAppIcon />}
              onClick={() => {
                if (window.confirm('このチームから脱退してもよろしいですか？')) {
                  teamService.leaveTeam(teamId)
                    .then(() => {
                      refreshTeams();
                      navigate('/team');
                    })
                    .catch(err => {
                      console.error('チーム脱退エラー:', err);
                      setError('チームの脱退に失敗しました。');
                    });
                }
              }}
            >
              チームから脱退する
            </Button>
          </Box>
        )}
      </Box>

      {/* フローティングアクションボタン */}
      <Box 
        sx={{
          position: 'fixed',
          bottom: { xs: '70px', sm: '80px' },
          right: { xs: '16px', sm: '24px' },
          width: { xs: '48px', sm: '56px' },
          height: { xs: '48px', sm: '56px' },
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
      </Box>

      {/* ナビゲーションバー用の余白 */}
      <Box sx={{ paddingBottom: { xs: '80px', sm: '100px' } }}></Box>
      
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
    </Box>
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
        
        // キャッシュを使用して取得（キャッシュクリアは行わない）
        const goalData = await teamService.getTeamGoal(teamId);
        console.log('TeamGoalDisplay: チーム目標データ取得:', goalData);
        
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
    return (
      <LoadingOverlay 
        isLoading={loading}
        variant="transparent"
        contentType="simple"
        message="チーム目標を読み込み中..."
        opacity={0.6}
      >
        <Box sx={{ height: '24px' }} />
      </LoadingOverlay>
    );
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