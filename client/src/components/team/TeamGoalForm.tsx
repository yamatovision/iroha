import React, { useState, useEffect } from 'react';
import teamService from '../../services/team.service';

type TeamGoalFormProps = {
  teamId: string;
};

/**
 * チーム目標設定フォームコンポーネント
 */
const TeamGoalForm: React.FC<TeamGoalFormProps> = ({ teamId }) => {
  const [goal, setGoal] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [currentGoal, setCurrentGoal] = useState<any>(null);

  // 既存のチーム目標を取得
  useEffect(() => {
    const fetchTeamGoal = async () => {
      if (!teamId) return;

      try {
        setLoading(true);
        const goalData = await teamService.getTeamGoal(teamId);
        
        if (goalData) {
          setCurrentGoal(goalData);
          setGoal(goalData.content || '');
          
          // 期限がある場合は日付フォーマット (YYYY-MM-DD) に変換
          if (goalData.deadline) {
            const date = new Date(goalData.deadline);
            setDeadline(date.toISOString().split('T')[0]);
          } else {
            setDeadline('');
          }
        }
        
        setError(null);
      } catch (err) {
        console.error(`Failed to fetch team goal for team ${teamId}:`, err);
        setError('チーム目標の取得に失敗しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamGoal();
  }, [teamId]);

  // 目標設定・更新処理
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    try {
      setLoading(true);
      
      // 日付オブジェクトへの変換（期限が設定されている場合）
      const deadlineDate = deadline ? new Date(deadline) : undefined;
      
      // 目標の保存
      await teamService.setTeamGoal(teamId, goal.trim(), deadlineDate);
      
      // 更新成功メッセージを表示
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // 最新のゴール情報を再取得
      const updatedGoal = await teamService.getTeamGoal(teamId);
      setCurrentGoal(updatedGoal);
      
      setError(null);
    } catch (err) {
      console.error(`Failed to save team goal for team ${teamId}:`, err);
      setError('チーム目標の保存に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="team-goal-form">
      {error && (
        <div className="error-message" style={{ color: 'var(--danger)', padding: '10px', margin: '10px 0', backgroundColor: 'rgba(244, 67, 54, 0.1)', borderRadius: '8px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message" style={{ color: 'var(--success)', padding: '10px', margin: '10px 0', backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px' }}>
          チーム目標を保存しました！
        </div>
      )}
      
      {/* 現在の目標表示（ある場合） */}
      {currentGoal && !loading && (
        <div style={{ marginBottom: '20px', backgroundColor: 'var(--primary-light)', padding: '15px', borderRadius: '8px', color: 'white' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 500 }}>現在の目標:</h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 400 }}>{currentGoal.content}</p>
          {currentGoal.deadline && (
            <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
              <span className="material-icons" style={{ fontSize: '1rem', marginRight: '4px' }}>event</span>
              期限: {new Date(currentGoal.deadline).toLocaleDateString('ja-JP')}
            </div>
          )}
          
          {currentGoal.progress !== undefined && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>進捗状況</span>
                <span>{currentGoal.progress}%</span>
              </div>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    backgroundColor: 'white', 
                    height: '100%', 
                    width: `${currentGoal.progress}%`, 
                    borderRadius: '4px',
                    transition: 'width 0.3s ease' 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
          目標は期限を決めると効果的です。明確な数値目標を含めましょう。
        </p>
      </div>
      
      <form onSubmit={handleSaveGoal}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>チーム目標</label>
          <textarea 
            value={goal} 
            onChange={(e) => setGoal(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid var(--divider)', 
              minHeight: '100px',
              resize: 'vertical'
            }}
            placeholder="四半期売上目標（1200万円）の達成と顧客満足度90%の維持"
            required
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>目標期限</label>
          <input 
            type="date" 
            value={deadline} 
            onChange={(e) => setDeadline(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid var(--divider)' 
            }}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            type="button" 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#f5f5f5',
              border: '1px solid #d0d0d0',
              color: '#666', 
              borderRadius: '8px', 
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              minWidth: '120px',
              height: '42px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => {
              // フォームをリセット（既存の目標がある場合はその値に戻す）
              if (currentGoal) {
                setGoal(currentGoal.content || '');
                if (currentGoal.deadline) {
                  const date = new Date(currentGoal.deadline);
                  setDeadline(date.toISOString().split('T')[0]);
                } else {
                  setDeadline('');
                }
              } else {
                setGoal('');
                setDeadline('');
              }
            }}
          >
            キャンセル
          </button>
          <button 
            type="submit" 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#5e35b1', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(94,53,177,0.3)',
              minWidth: '120px',
              height: '42px',
              transition: 'all 0.2s ease'
            }}
            disabled={loading || !goal.trim()}
          >
            <span className="material-icons" style={{ marginRight: '8px' }}>save</span>
            保存
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamGoalForm;