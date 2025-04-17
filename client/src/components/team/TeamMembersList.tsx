import React, { useState, useEffect } from 'react';
import teamService from '../../services/team.service';
import MemberCardView from './MemberCardView';

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
  
  // 新規メンバー追加用の状態
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  
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

  // チームメンバー一覧を取得
  useEffect(() => {
    const fetchMembers = async () => {
      if (!teamId) return;
      
      try {
        setLoading(true);
        const data = await teamService.getTeamMembers(teamId);
        setMembers(data);
        setError(null);
      } catch (err) {
        console.error(`Failed to fetch team members for team ${teamId}:`, err);
        setError('メンバー一覧の取得に失敗しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [teamId]);

  // メンバー追加処理
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role) return;

    try {
      setLoading(true);
      await teamService.addTeamMember(teamId, {
        email,
        role,
        password: password || undefined,
        displayName: displayName || undefined
      });

      // 新しいメンバーリストを取得するか、結果から直接追加する
      const updatedMembers = await teamService.getTeamMembers(teamId);
      setMembers(updatedMembers);
      
      // フォームをリセット
      setEmail('');
      setRole('');
      setPassword('');
      setDisplayName('');
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      console.error(`Failed to add member to team ${teamId}:`, err);
      setError('メンバーの追加に失敗しました。メールアドレスが既に存在するか、入力情報が正しくありません。');
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

      {/* メンバー追加フォーム */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '16px' }}>メンバー追加</h3>
        
        {showAddForm ? (
          <form onSubmit={handleAddMember}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>メールアドレス</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--divider)' 
                  }}
                  placeholder="example@company.com"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>パスワード</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--divider)' 
                  }}
                  placeholder="未登録ユーザーの初期パスワード"
                />
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  未登録ユーザーを招待する場合は必須です。既存ユーザーの場合は空欄でOK。
                </small>
              </div>
              
              <div style={{ marginBottom: '16px', gridColumn: '1 / 3' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>役割</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--divider)' 
                  }}
                  placeholder="エンジニア、デザイナーなど"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>表示名（オプション）</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--divider)' 
                  }}
                  placeholder="未入力の場合はメールアドレスから自動生成"
                />
              </div>
              
            </div>
            
            <div style={{ textAlign: 'right', marginTop: '16px' }}>
              <button 
                type="button" 
                style={{ 
                  padding: '8px 16px', 
                  marginRight: '10px', 
                  backgroundColor: 'transparent',
                  border: '1px solid var(--divider)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => setShowAddForm(false)}
              >
                キャンセル
              </button>
              <button 
                type="submit" 
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#673ab7', // 明示的な紫色
                  color: '#ffffff',  // 明示的な白色 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // ボタン感を強調
                  fontSize: '15px',
                  fontWeight: 500
                }}
                disabled={loading}
              >
                <span style={{ fontSize: '18px', marginRight: '6px' }}>👤+</span>
                メンバー追加
              </button>
            </div>
          </form>
        ) : (
          <button 
            style={{ 
              width: '100%', 
              padding: '14px', 
              backgroundColor: '#673ab7', // 明示的な紫色
              color: '#ffffff',  // 明示的な白色
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 500,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)' // ボタン感を強調
            }}
            onClick={() => setShowAddForm(true)}
            disabled={loading}
          >
            <span style={{ marginRight: '8px', fontSize: '20px' }}>👤+</span>
            メンバーを追加する
          </button>
        )}
      </div>

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
          {members.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
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
                  <tr key={member.userId} style={{ borderBottom: '1px solid var(--divider)' }}>
                    <td style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
                      <div 
                        className={`member-avatar ${elementClasses[member.elementAttribute] || ''}`} 
                        style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%',
                          backgroundColor: member.elementAttribute ? `var(--element-${member.elementAttribute})` : 'var(--primary-color)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          marginRight: '12px'
                        }}
                      >
                        {member.displayName ? member.displayName.charAt(0) : '?'}
                      </div>
                      {member.displayName}
                    </td>
                    <td style={{ padding: '16px' }}>{member.role || '-'}</td>
                    <td style={{ padding: '16px' }}>
                      {member.elementAttribute && (
                        <span style={{ 
                          padding: '4px 12px', 
                          backgroundColor: elementLabels[member.elementAttribute]?.bg || 'var(--element-water-bg)', 
                          color: elementLabels[member.elementAttribute]?.color || 'var(--element-water-dark)', 
                          borderRadius: '12px', 
                          fontSize: '0.85rem' 
                        }}>
                          {elementLabels[member.elementAttribute]?.name || '水'}
                        </span>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
};

export default TeamMembersList;