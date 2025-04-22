import React, { useState, useEffect } from 'react';
import teamService from '../../services/team.service';
import { ITeam } from '../../../../shared/index';
import LoadingIndicator from '../common/LoadingIndicator';

type TeamListProps = {
  teams?: ITeam[];
  activeTeamId?: string | null;
  onSelectTeam?: (team: ITeam) => void;
  onTeamCreated?: (team: ITeam) => void;
  fetchTeamsOnMount?: boolean;
};

/**
 * チーム一覧を表示するコンポーネント
 * - チームハブ画面で使用する場合は外部からteamsを渡す
 * - 単独で使用する場合はfetchTeamsOnMount=trueで内部でチーム一覧を取得
 */
const TeamList: React.FC<TeamListProps> = ({ 
  teams: externalTeams, 
  activeTeamId,
  onSelectTeam,
  onTeamCreated,
  fetchTeamsOnMount = false
}) => {
  const [teams, setTeams] = useState<ITeam[]>(externalTeams || []);
  const [loading, setLoading] = useState<boolean>(fetchTeamsOnMount);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamDescription, setNewTeamDescription] = useState<string>('');

  // チームカラーのマッピング
  const teamColors = {
    primary: { bg: 'var(--primary-light)', color: 'white' },
    water: { bg: 'var(--element-water)', color: 'white' },
    wood: { bg: 'var(--element-wood)', color: 'white' },
    fire: { bg: 'var(--element-fire)', color: 'white' },
    earth: { bg: 'var(--element-earth)', color: 'white' },
    metal: { bg: 'var(--element-metal)', color: 'white' },
  };

  // 外部からteamsを受け取る場合
  useEffect(() => {
    if (externalTeams) {
      setTeams(externalTeams);
    }
  }, [externalTeams]);

  // 内部でチーム一覧を取得する場合
  useEffect(() => {
    const fetchTeams = async () => {
      if (!fetchTeamsOnMount) return;
      
      try {
        setLoading(true);
        const fetchedTeams = await teamService.getTeams();
        setTeams(fetchedTeams);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch teams:', err);
        setError('チーム一覧の取得に失敗しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [fetchTeamsOnMount]);

  // 新しいチームを作成
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      setLoading(true);
      const createdTeam = await teamService.createTeam({
        name: newTeamName.trim(),
        goal: newTeamDescription.trim() || undefined,
      });

      // 外部のコールバックがある場合は呼び出す
      if (onTeamCreated) {
        onTeamCreated(createdTeam);
      } else {
        // なければ内部状態を更新
        setTeams([...teams, createdTeam]);
      }
      
      setNewTeamName('');
      setNewTeamDescription('');
      setShowCreateModal(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create team:', err);
      setError('チームの作成に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // チーム選択ハンドラー
  const handleTeamSelect = (team: ITeam) => {
    if (onSelectTeam) {
      onSelectTeam(team);
    }
  };

  if (loading && !showCreateModal) {
    return <LoadingIndicator />;
  }

  return (
    <div className="team-list-container">
      {error && (
        <div className="error-message" style={{ color: 'var(--danger)', padding: '10px', margin: '10px 0', backgroundColor: 'rgba(244, 67, 54, 0.1)', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {teams.length === 0 ? (
        // Empty State - チームが存在しない場合
        <div style={{ 
          padding: '30px 20px', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          backgroundColor: 'rgba(103, 58, 183, 0.05)',
          borderRadius: '12px',
          border: '1px dashed rgba(103, 58, 183, 0.2)'
        }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(103, 58, 183, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '24px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
              チーム
            </span>
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              チームがまだありません
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', maxWidth: '300px' }}>
              新しいチームを作成して、メンバーと一緒に目標達成を目指しましょう！
            </p>
          </div>
          <button
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              backgroundColor: '#673ab7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              fontSize: '16px'
            }}
            onClick={() => setShowCreateModal(true)}
          >
            <span style={{ marginRight: '8px', fontWeight: 'bold' }}>+</span>
            新しいチームを作成
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px 8px', color: 'var(--text-primary)' }}>
              所属チーム一覧
            </h3>
          </div>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {teams.map(team => (
              <li
                key={team.id}
                style={{
                  padding: '16px 20px',
                  margin: '0 0 10px 0',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  backgroundColor: activeTeamId === team.id ? 'rgba(103, 58, 183, 0.08)' : 'white',
                  border: activeTeamId === team.id ? '1px solid rgba(103, 58, 183, 0.3)' : '1px solid rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTeamId === team.id ? '0 2px 8px rgba(103, 58, 183, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}
                onClick={() => handleTeamSelect(team)}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: team.iconColor ? teamColors[team.iconColor as keyof typeof teamColors]?.bg : 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '18px'
                  }}
                >
                  {team.iconInitial || team.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>{team.name}</div>
                  {team.description && (
                    <div style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '0.85rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '220px'
                    }}>
                      {team.description}
                    </div>
                  )}
                </div>
                {activeTeamId === team.id && (
                  <div style={{ 
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    marginLeft: '8px'
                  }}>
                    現在選択中
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div style={{ padding: '16px 0', borderTop: '1px solid var(--divider)', marginTop: '16px' }}>
            <button
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#673ab7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                fontSize: '16px'
              }}
              onClick={() => setShowCreateModal(true)}
            >
              <span style={{ marginRight: '8px', fontWeight: 'bold' }}>+</span>
              新しいチームを作成
            </button>
          </div>
        </>
      )}

      {/* チーム作成モーダル */}
      {showCreateModal && (
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
              maxWidth: '430px',
              width: '90%',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: 'var(--primary-dark)' }}>新しいチームを作成</h2>
              <button 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#666',
                  transition: 'background-color 0.2s',
                  marginRight: '-8px'
                }}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#555' }}>
                  チーム名<span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--divider)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  placeholder="新しいチーム名"
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#555' }}>
                  チームの説明（オプション）
                </label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--divider)',
                    fontSize: '1rem',
                    minHeight: '100px',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  placeholder="チームの目的や役割について説明"
                />
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'flex-end',
                marginTop: '24px',
                borderTop: '1px solid var(--divider)',
                paddingTop: '20px'
              }}>
                <button
                  type="button"
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: '1px solid var(--primary-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--primary-color)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '15px'
                  }}
                  onClick={() => setShowCreateModal(false)}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#673ab7',
                    color: '#ffffff',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    fontSize: '15px'
                  }}
                  disabled={!newTeamName.trim() || loading}
                >
                  <span style={{ marginRight: '8px', fontSize: '16px' }}>✓</span>
                  チームを作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamList;