import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import teamService from '../../services/team.service';
import { ITeam } from '../../../../shared/index';
import TeamList from '../../components/team/TeamList';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import LoadingIndicator from '../../components/common/LoadingIndicator';

/**
 * チームハブ画面
 * ユーザーが所属する全チームを表示し、チーム切り替えや新規作成を行う
 */
const TeamHub: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // TeamContextから情報を取得
  const { activeTeamId, setActiveTeamId, refreshTeams } = useTeam();

  // チーム一覧を取得
  useEffect(() => {
    const fetchTeams = async () => {
      if (!auth.userProfile) return;
      
      try {
        setLoading(true);
        const fetchedTeams = await teamService.getUserTeams();
        setTeams(fetchedTeams);
        
        // チームがある場合は、最初のチームをアクティブに設定
        if (fetchedTeams.length > 0 && !activeTeamId) {
          await setActiveTeamId(fetchedTeams[0].id);
        }
        
        // 以前の自動リダイレクトは削除
        // チームハブページを明示的に表示して、新規チーム作成機能を使えるようにする
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch teams:', err);
        setError('チーム一覧の取得に失敗しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [auth.userProfile, activeTeamId, setActiveTeamId]);

  // チーム選択ハンドラー
  const handleTeamSelect = async (team: ITeam) => {
    try {
      await setActiveTeamId(team.id);
      
      // チームアドバイスページに遷移
      navigate(`/team/${team.id}/advice`);
    } catch (err) {
      console.error('チーム選択エラー:', err);
      setError('チームの選択中にエラーが発生しました。');
    }
  };

  // チーム作成ハンドラー
  const handleTeamCreated = async (newTeam: ITeam) => {
    try {
      setTeams(prevTeams => [...prevTeams, newTeam]);
      await setActiveTeamId(newTeam.id);
      
      // 新しく作成したチームのアドバイスページに遷移
      navigate(`/team/${newTeam.id}/advice`);
    } catch (err) {
      console.error('チーム作成後のエラー:', err);
      setError('チームの作成後の処理中にエラーが発生しました。');
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="team-hub-container">
      <div style={{ 
        padding: '20px', 
        maxWidth: '800px', 
        margin: '0 auto' 
      }}>
        <div style={{ 
          marginBottom: '24px', 
          borderBottom: '1px solid var(--divider)',
          paddingBottom: '12px'
        }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            margin: '0 0 8px 0' 
          }}>
            チーム管理
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            margin: 0,
            fontSize: '0.95rem'
          }}>
            チームの作成や管理をします
          </p>
        </div>

        {error && (
          <div style={{ 
            color: 'var(--danger)', 
            padding: '12px', 
            margin: '0 0 16px', 
            backgroundColor: 'rgba(244, 67, 54, 0.1)', 
            borderRadius: '8px' 
          }}>
            {error}
          </div>
        )}

        {/* チームリスト */}
        <TeamList 
          teams={teams} 
          activeTeamId={activeTeamId} 
          onSelectTeam={handleTeamSelect} 
          onTeamCreated={handleTeamCreated}
        />

        <div style={{ 
          marginTop: '32px', 
          padding: '20px', 
          backgroundColor: 'rgba(103, 58, 183, 0.05)', 
          borderRadius: '12px',
          border: '1px solid rgba(103, 58, 183, 0.15)'
        }}>
          <h2 style={{ 
            fontSize: '1.1rem', 
            fontWeight: 600, 
            margin: '0 0 12px 0',
            color: 'var(--primary-color)'
          }}>
            チームを追加する
          </h2>
          <ul style={{ 
            margin: '0', 
            padding: '0 0 0 20px',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            lineHeight: '1.5'
          }}>
            <li>複数のチームを作成して管理できます</li>
            <li>各チームごとに独自の目標と運勢アドバイスが受けられます</li>
            <li>友達リストから簡単にメンバーを招待できます</li>
            <li>チームメンバー間の相性も確認できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TeamHub;