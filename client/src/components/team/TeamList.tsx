import React, { useState, useEffect } from 'react';
import teamService from '../../services/team.service';
import { ITeam } from '../../../../shared/index';

type TeamListProps = {
  onSelectTeam?: (team: ITeam) => void;
};

/**
 * チーム一覧を表示するコンポーネント
 */
const TeamList: React.FC<TeamListProps> = ({ onSelectTeam }) => {
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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

  // チーム一覧を取得
  useEffect(() => {
    const fetchTeams = async () => {
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
  }, []);

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

      setTeams([...teams, createdTeam]);
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

  return (
    <div className="team-list-container">
      {error && (
        <div className="error-message" style={{ color: 'var(--danger)', padding: '10px', margin: '10px 0', backgroundColor: 'rgba(244, 67, 54, 0.1)', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {loading && !showCreateModal ? (
        <div className="loading-indicator" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid rgba(156, 39, 176, 0.3)', borderRadius: '50%', borderTopColor: 'var(--primary-color)', animation: 'spin 1s linear infinite' }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : teams.length === 0 ? (
        // Empty State - チームが存在しない場合
        <div style={{ 
          padding: '30px 20px', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px'
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
            {/* Material Iconsが利用できない場合に備えてテキストフォールバックも提供 */}
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
              backgroundColor: '#673ab7', // 明示的な紫色
              color: '#ffffff',          // 明示的な白色
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // ボタン感を強調
              fontSize: '16px'           // フォントサイズ明示
            }}
            onClick={() => setShowCreateModal(true)}
          >
            <span style={{ marginRight: '8px', fontWeight: 'bold' }}>+</span>
            新しいチームを作成
          </button>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {teams.map(team => (
            <li
              key={team.id}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--divider)',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => handleTeamSelect(team)}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: team.iconColor ? teamColors[team.iconColor as keyof typeof teamColors]?.bg : 'var(--primary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  color: 'white',
                  fontWeight: 500
                }}
              >
                {team.iconInitial || team.name.charAt(0)}
              </div>
              <div style={{ flex: 1, fontWeight: 500 }}>{team.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', marginRight: '4px' }}>👤</span>
                {/* メンバー数は実際のAPIレスポンスに合わせる */}
                {'?'}
              </div>
            </li>
          ))}
        </ul>
      )}

      {teams.length > 0 && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--divider)' }}>
          <button
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#673ab7', // 明示的な紫色
              color: '#ffffff',          // 明示的な白色
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // ボタン感を強調
              fontSize: '16px'           // フォントサイズ明示
            }}
            onClick={() => setShowCreateModal(true)}
          >
            <span style={{ marginRight: '8px', fontWeight: 'bold' }}>+</span>
            新しいチームを作成
          </button>
        </div>
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
              maxWidth: '400px',
              width: '90%',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 500 }}>新しいチームを作成</h2>
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>チーム名</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--divider)',
                    fontSize: '1rem'
                  }}
                  placeholder="新しいチーム名"
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>チームの説明（オプション）</label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--divider)',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="チームの目的や役割について説明"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--primary-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--primary-color)',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowCreateModal(false)}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#673ab7', // 明示的な紫色
                    color: '#ffffff',          // 明示的な白色
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // ボタン感を強調
                    fontSize: '15px'           // フォントサイズ明示
                  }}
                  disabled={!newTeamName.trim() || loading}
                >
                    ✓ チームを作成
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