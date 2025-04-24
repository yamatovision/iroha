import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import teamService from '../../services/team.service';
import MemberCardView from './MemberCardView';
import TeamMemberAddModal from './TeamMemberAddModal';
import { useTeam } from '../../contexts/TeamContext';
import { useAuth } from '../../contexts/AuthContext';
import { Box } from '@mui/material';
import { 
  Park as ParkIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  Landscape as LandscapeIcon,
  Star as StarIcon,
  WaterDrop as WaterDropIcon,
  ExitToApp as ExitToAppIcon
} from '@mui/icons-material';

type TeamMembersListProps = {
  teamId: string;
};

/**
 * チームメンバー一覧表示コンポーネント
 */
const TeamMembersList: React.FC<TeamMembersListProps> = ({ teamId }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // React Router のナビゲーション
  const navigate = useNavigate();
  
  // TeamContextを取得
  const { refreshTeams, hasTeamPermission } = useTeam();
  
  // AuthContextを取得
  const { userProfile } = useAuth();
  
  // チームメンバー追加モーダル用の状態
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  
  // 編集モーダル用の状態
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editMemberId, setEditMemberId] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editRole, setEditRole] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editElement, setEditElement] = useState<string>('');
  
  // メンバーカルテモーダル用の状態
  const [showCardModal, setShowCardModal] = useState<boolean>(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  // 属性アバタークラスのマッピング
  const elementClasses: Record<string, string> = {
    water: 'water-avatar',
    wood: 'wood-avatar',
    fire: 'fire-avatar',
    earth: 'earth-avatar',
    metal: 'metal-avatar'
  };
  
  // 属性表示用のマッピング
  const elementLabels: Record<string, { name: string, bg: string, color: string }> = {
    water: { name: '水', bg: 'var(--element-water-bg)', color: 'var(--element-water-dark)' },
    wood: { name: '木', bg: 'var(--element-wood-bg)', color: 'var(--element-wood-dark)' },
    fire: { name: '火', bg: 'var(--element-fire-bg)', color: 'var(--element-fire-dark)' },
    earth: { name: '土', bg: 'var(--element-earth-bg)', color: 'var(--element-earth-dark)' },
    metal: { name: '金', bg: 'var(--element-metal-bg)', color: 'var(--element-metal-dark)' }
  };

  // 権限状態
  const [canManageMembers, setCanManageMembers] = useState<boolean>(false);

  // チームメンバー一覧を取得
  useEffect(() => {
    const fetchMembers = async () => {
      if (!teamId) return;
      
      try {
        setLoading(true);
        // 権限チェック
        const hasManagePermission = await hasTeamPermission('manage_members', teamId);
        setCanManageMembers(hasManagePermission);
        
        try {
          // メンバーデータ取得前にキャッシュをクリア
          const apiService = (await import('../../services/api.service')).default;
          await apiService.clearCache(`/api/v1/teams/${teamId}/members`);
          console.log(`[TeamMembersList] メンバー一覧キャッシュをクリア: teamId=${teamId}`);
          
          // メンバーデータ取得
          const data = await teamService.getTeamMembers(teamId);
          
          if (!data || !Array.isArray(data)) {
            console.error(`[TeamMembersList] メンバーデータが正しい形式ではありません:`, data);
            setMembers([]);
            setError('メンバー一覧の取得に失敗しました。データ形式が不正です。');
            return;
          }
          
          console.log(`[TeamMembersList] チームメンバー取得成功: ${data.length}件`);
          setMembers(data);
          setError(null);
        } catch (memberError: any) {
          // チーム自体が存在しないか、アクセス権がない場合のエラー
          console.error(`Failed to fetch team members for team ${teamId}:`, memberError);
          if (memberError?.response?.status === 404) {
            // チームが存在しない場合はTeamContextを更新してリダイレクト
            try {
              console.log(`[TeamMembersList] チームが見つかりません。チーム一覧を更新します`);
              await refreshTeams();
              // ここには到達しないはず - リダイレクトされるため
            } catch (refreshError) {
              console.error('Failed to refresh teams after team not found error:', refreshError);
            }
          }
          setMembers([]);
          setError('メンバー一覧の取得に失敗しました。チームが削除されたか、アクセス権限がない可能性があります。');
        }
      } catch (err) {
        console.error(`Failed to check permissions for team ${teamId}:`, err);
        setError('権限の確認に失敗しました。後でもう一度お試しください。');
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [teamId, hasTeamPermission, refreshTeams]);

  // メンバー追加モーダルを表示
  const handleShowAddModal = () => {
    setShowAddModal(true);
  };
  
  // メンバー追加後の処理
  const handleMemberAdded = async () => {
    try {
      setLoading(true);
      // メンバーリストを更新
      const updatedMembers = await teamService.getTeamMembers(teamId);
      setMembers(updatedMembers);
      setError(null);
    } catch (err) {
      console.error(`Failed to fetch updated team members for team ${teamId}:`, err);
      setError('メンバーリストの更新に失敗しました。ページを再読み込みしてください。');
    } finally {
      setLoading(false);
    }
  };

  // メンバー編集処理
  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMemberId || !editRole) return;

    try {
      setLoading(true);
      await teamService.updateMemberRole(teamId, editMemberId, editRole);
      
      // TeamContextを更新
      await refreshTeams();
      
      // メンバーリストを更新
      const updatedMembers = await teamService.getTeamMembers(teamId);
      setMembers(updatedMembers);
      
      // モーダルを閉じる
      setShowEditModal(false);
      setError(null);
    } catch (err) {
      console.error(`Failed to update member ${editMemberId} in team ${teamId}:`, err);
      setError('メンバー情報の更新に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // メンバー削除処理
  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('このメンバーをチームから削除してもよろしいですか？')) {
      return;
    }

    try {
      setLoading(true);
      await teamService.removeTeamMember(teamId, userId);
      
      // TeamContextを更新
      await refreshTeams();
      
      // 削除したメンバーを除外
      setMembers(members.filter(member => member.userId !== userId));
      setError(null);
    } catch (err) {
      console.error(`Failed to remove member ${userId} from team ${teamId}:`, err);
      setError('メンバーの削除に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * チーム脱退処理
   */
  const handleLeaveTeam = async () => {
    if (!window.confirm('このチームから脱退してもよろしいですか？')) {
      return;
    }
    
    try {
      setLoading(true);
      await teamService.leaveTeam(teamId);
      
      // TeamContextを更新
      await refreshTeams();
      
      // チームハブに戻る
      navigate('/team');
      
    } catch (err) {
      console.error('チーム脱退エラー:', err);
      setError('チームの脱退に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // 編集モーダルを開く
  const openEditModal = (member: any) => {
    setEditMemberId(member.userId);
    setEditName(member.displayName);
    setEditRole(member.role || '');
    setEditEmail(member.email);
    setEditElement(member.elementAttribute || 'water');
    setShowEditModal(true);
  };
  
  // メンバーカルテモーダルを開く
  const openCardModal = (userId: string, member: any) => {
    // 五行属性があるかチェック
    if (!member.elementAttribute) {
      // 五行属性がない場合、エラーメッセージを表示
      alert('このメンバーは四柱推命プロフィールを登録していないため、カルテを生成することができません。');
      return;
    }
    
    // 五行属性がある場合は通常通りモーダルを表示
    setSelectedMemberId(userId);
    setShowCardModal(true);
  };

  return (
    <div className="team-members-container">
      {error && (
        <div className="error-message" style={{ color: 'var(--danger)', padding: '10px', margin: '10px 0', backgroundColor: 'rgba(244, 67, 54, 0.1)', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* メンバー追加ボタン - 権限のあるユーザーのみ表示 */}
      {canManageMembers && (
        <div className="card" style={{ 
          marginBottom: '24px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease'
        }}>
          <button 
            style={{ 
              width: '100%', 
              padding: '0', 
              backgroundColor: 'white',
              border: '1px dashed rgba(103, 58, 183, 0.5)', 
              borderRadius: '12px', 
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
            onClick={handleShowAddModal}
            disabled={loading}
          >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 16px',
            backgroundColor: 'rgba(103, 58, 183, 0.02)',
            transition: 'background-color 0.3s'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(103, 58, 183, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              color: '#673ab7',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              +
            </div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#673ab7',
              marginBottom: '4px'
            }}>
              メンバーを追加
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#666',
              maxWidth: '80%',
              textAlign: 'center'
            }}>
              友達リストから選択してメンバーを追加しましょう
            </div>
          </div>
        </button>
      </div>
      )}

      {/* メンバー一覧テーブル */}
      {loading && !showEditModal ? (
        <div className="loading-indicator" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid rgba(156, 39, 176, 0.3)', borderRadius: '50%', borderTopColor: 'var(--primary-color)', animation: 'spin 1s linear infinite' }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          {members && members.length > 0 ? (
            <div>
              {/* デスクトップ表示用テーブル: 中〜大画面のみで表示 */}
              <table className="desktop-table" style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                minWidth: '600px',
                display: 'none' // モバイルでは非表示
              }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--primary-light)', color: 'white' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderRadius: '8px 0 0 0' }}>名前</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>役割</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>五行属性</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>メールアドレス</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', borderRadius: '0 8px 0 0' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={`desktop-${member.userId}`} style={{ borderBottom: '1px solid var(--divider)' }}>
                      <td style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
                        <div 
                          className={`member-avatar ${elementClasses[member.elementAttribute] || ''}`} 
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%',
                            backgroundColor: member.elementAttribute 
                              ? `var(--${member.elementAttribute}-bg, ${
                                  member.elementAttribute === 'water' ? '#7d94a6' :
                                  member.elementAttribute === 'fire' ? '#e67373' :
                                  member.elementAttribute === 'wood' ? '#94b8eb' :
                                  member.elementAttribute === 'earth' ? '#f2d06b' :
                                  member.elementAttribute === 'metal' ? '#ffffff' : '#e0e0e0'
                                })` 
                              : '#e0e0e0',
                            color: 'black',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            marginRight: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            border: member.elementAttribute === 'metal' ? '1px solid #ccc' : 'none'
                          }}
                        >
                          {member.displayName ? member.displayName.charAt(0) : '?'}
                        </div>
                        {member.displayName}
                      </td>
                      <td style={{ padding: '16px' }}>{member.role || '-'}</td>
                      <td style={{ padding: '16px' }}>
                        {member.elementAttribute && (
                          <Box component="span" sx={{ 
                            px: 1.5, 
                            py: 0.5, 
                            borderRadius: 10,
                            bgcolor: member.elementAttribute === 'water' ? '#7d94a6' : 
                                    member.elementAttribute === 'fire' ? '#e67373' : 
                                    member.elementAttribute === 'wood' ? '#94b8eb' : 
                                    member.elementAttribute === 'earth' ? '#f2d06b' : 
                                    member.elementAttribute === 'metal' ? '#f5f5f5' : '#e0e0e0',
                            color: member.elementAttribute === 'water' ? '#ffffff' : '#000000',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            mr: 1,
                            border: member.elementAttribute === 'metal' ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}>
                            {member.elementAttribute === 'wood' && <ParkIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                            {member.elementAttribute === 'fire' && <LocalFireDepartmentIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                            {member.elementAttribute === 'earth' && <LandscapeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                            {member.elementAttribute === 'metal' && <StarIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                            {member.elementAttribute === 'water' && <WaterDropIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                            {elementLabels[member.elementAttribute]?.name || '水'}
                          </Box>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>{member.email}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button 
                          className="btn btn-outline btn-sm card-btn"
                          style={{ 
                            padding: '6px 12px', 
                            backgroundColor: 'transparent',
                            border: '1px solid #2196f3', // 青色
                            color: '#2196f3', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            marginRight: '8px',
                            fontSize: '14px'
                          }}
                          onClick={() => openCardModal(member.userId, member)}
                        >
                          <span style={{ fontSize: '16px', marginRight: '4px' }}>📋</span>
                          カルテ
                        </button>
                        
                        {/* 管理者権限のあるユーザーのみ表示 */}
                        {canManageMembers && (
                          <>
                            <button 
                              className="btn btn-outline btn-sm edit-member-btn"
                              style={{ 
                                padding: '6px 12px', 
                                backgroundColor: 'transparent',
                                border: '1px solid #673ab7', // 明示的な紫色
                                color: '#673ab7', // 明示的な紫色 
                                borderRadius: '8px', 
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                marginRight: '8px',
                                fontSize: '14px'
                              }}
                              onClick={() => openEditModal(member)}
                            >
                              <span style={{ fontSize: '16px', marginRight: '4px' }}>✏️</span>
                              編集
                            </button>
                            <button 
                              className="btn btn-outline btn-sm"
                              style={{ 
                                padding: '6px 12px', 
                                backgroundColor: 'transparent',
                                border: '1px solid #f44336', // 明示的な赤色
                                color: '#f44336', // 明示的な赤色
                                borderRadius: '8px', 
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                fontSize: '14px'
                              }}
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              <span style={{ fontSize: '16px', marginRight: '4px' }}>🗑️</span>
                              削除
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* モバイル表示用カードリスト: 小画面のみで表示 */}
              <div className="mobile-cards" style={{ display: 'block' }}>
                {members.map((member) => (
                  <div 
                    key={`mobile-${member.userId}`} 
                    style={{ 
                      border: '1px solid var(--divider)', 
                      borderRadius: '8px', 
                      padding: '16px', 
                      marginBottom: '16px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <div 
                        className={`member-avatar ${elementClasses[member.elementAttribute] || ''}`} 
                        style={{ 
                          width: '42px', 
                          height: '42px', 
                          borderRadius: '50%',
                          backgroundColor: member.elementAttribute 
                            ? `var(--${member.elementAttribute}-bg, ${
                                member.elementAttribute === 'water' ? '#7d94a6' :
                                member.elementAttribute === 'fire' ? '#e67373' :
                                member.elementAttribute === 'wood' ? '#94b8eb' :
                                member.elementAttribute === 'earth' ? '#f2d06b' :
                                member.elementAttribute === 'metal' ? '#ffffff' : '#e0e0e0'
                              })` 
                            : '#e0e0e0',
                          color: 'black',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          marginRight: '12px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          border: member.elementAttribute === 'metal' ? '1px solid #ccc' : 'none'
                        }}
                      >
                        {member.displayName ? member.displayName.charAt(0) : '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{member.displayName}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{member.role || '-'}</div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px', 
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}>
                        <div style={{ fontWeight: '500', minWidth: '90px' }}>五行属性:</div>
                        <div>
                          {member.elementAttribute && (
                            <Box component="span" sx={{ 
                              px: 1.5, 
                              py: 0.5, 
                              borderRadius: 10,
                              bgcolor: member.elementAttribute === 'water' ? '#7d94a6' : 
                                      member.elementAttribute === 'fire' ? '#e67373' : 
                                      member.elementAttribute === 'wood' ? '#94b8eb' : 
                                      member.elementAttribute === 'earth' ? '#f2d06b' : 
                                      member.elementAttribute === 'metal' ? '#f5f5f5' : '#e0e0e0',
                              color: member.elementAttribute === 'water' ? '#ffffff' : '#000000',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              border: member.elementAttribute === 'metal' ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}>
                              {member.elementAttribute === 'wood' && <ParkIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                              {member.elementAttribute === 'fire' && <LocalFireDepartmentIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                              {member.elementAttribute === 'earth' && <LandscapeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                              {member.elementAttribute === 'metal' && <StarIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                              {member.elementAttribute === 'water' && <WaterDropIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                              {elementLabels[member.elementAttribute]?.name || '水'}
                            </Box>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}>
                        <div style={{ fontWeight: '500', minWidth: '90px' }}>メール:</div>
                        <div style={{ wordBreak: 'break-word' }}>{member.email}</div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '8px'
                    }}>
                      <button 
                        style={{ 
                          flex: '1 0 auto',
                          minWidth: '80px',
                          padding: '8px 12px', 
                          backgroundColor: 'transparent',
                          border: '1px solid #2196f3',
                          color: '#2196f3', 
                          borderRadius: '8px', 
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px'
                        }}
                        onClick={() => openCardModal(member.userId, member)}
                      >
                        <span style={{ fontSize: '16px', marginRight: '4px' }}>📋</span>
                        カルテ
                      </button>
                      
                      {/* 自分自身の場合は脱退ボタンを表示（管理者でない場合） */}
                      {userProfile?.id === member.userId && !member.isAdmin && (
                        <button 
                          style={{ 
                            flex: '1 0 auto',
                            minWidth: '80px',
                            padding: '8px 12px', 
                            backgroundColor: 'transparent',
                            border: '1px solid #ff9800',
                            color: '#ff9800', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px'
                          }}
                          onClick={handleLeaveTeam}
                        >
                          <span style={{ fontSize: '16px', marginRight: '4px' }}>🚪</span>
                          脱退する
                        </button>
                      )}
                      
                      {/* 管理者権限のあるユーザーのみ表示 */}
                      {canManageMembers && userProfile?.id !== member.userId && (
                        <>
                          <button 
                            style={{ 
                              flex: '1 0 auto',
                              minWidth: '80px',
                              padding: '8px 12px', 
                              backgroundColor: 'transparent',
                              border: '1px solid #673ab7',
                              color: '#673ab7', 
                              borderRadius: '8px', 
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px'
                            }}
                            onClick={() => openEditModal(member)}
                          >
                            <span style={{ fontSize: '16px', marginRight: '4px' }}>✏️</span>
                            編集
                          </button>
                          <button 
                            style={{ 
                              flex: '1 0 auto',
                              minWidth: '80px',
                              padding: '8px 12px', 
                              backgroundColor: 'transparent',
                              border: '1px solid #f44336',
                              color: '#f44336', 
                              borderRadius: '8px', 
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px'
                            }}
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            <span style={{ fontSize: '16px', marginRight: '4px' }}>🗑️</span>
                            削除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* レスポンシブ切り替え用のスタイル */}
              <style>{`
                @media (min-width: 768px) {
                  .desktop-table { display: table !important; }
                  .mobile-cards { display: none !important; }
                }
              `}</style>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
              <p>まだメンバーがいません。「メンバーを追加する」ボタンからメンバーを追加してください。</p>
            </div>
          )}
        </div>
      )}

      {/* メンバー編集モーダル */}
      {showEditModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 500, color: 'var(--primary-dark)' }}>メンバー編集</h2>
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} 
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            <form id="member-edit-form" onSubmit={handleEditMember}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <div 
                  className={`member-avatar ${elementClasses[editElement] || 'water-avatar'}`} 
                  style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '50%',
                    backgroundColor: editElement ? `var(--element-${editElement})` : 'var(--primary-color)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    marginRight: '16px'
                  }}
                >
                  {editName ? editName.charAt(0) : '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>名前</label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      style={{ 
                        width: '100%', 
                        padding: '10px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--divider)' 
                      }}
                      disabled
                    />
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>役割</label>
                <input 
                  type="text" 
                  value={editRole} 
                  onChange={(e) => setEditRole(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--divider)' 
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>メールアドレス</label>
                <input 
                  type="email" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--divider)' 
                  }}
                  disabled
                />
              </div>
              
              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  style={{ 
                    padding: '10px 16px', 
                    backgroundColor: 'transparent',
                    border: '1px solid var(--primary-color)',
                    color: 'var(--primary-color)', 
                    borderRadius: '8px', 
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowEditModal(false)}
                >
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  style={{ 
                    padding: '10px 16px', 
                    backgroundColor: '#673ab7', // 明示的な紫色
                    color: '#ffffff', // 明示的な白色
                    border: 'none', 
                    borderRadius: '8px', 
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)' // ボタン感を強調
                  }}
                  disabled={loading || !editRole.trim()}
                >
                  <span style={{ marginRight: '6px', fontSize: '16px' }}>💾</span>
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* メンバーカルテモーダル */}
      {showCardModal && selectedMemberId && (
        <MemberCardView 
          teamId={teamId} 
          userId={selectedMemberId} 
          onClose={() => setShowCardModal(false)} 
          isDialog={true} 
        />
      )}
      
      {/* チームメンバー追加モーダル */}
      <TeamMemberAddModal
        teamId={teamId}
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onMemberAdded={handleMemberAdded}
      />
    </div>
  );
};

export default TeamMembersList;