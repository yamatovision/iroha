import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { ITeam } from '../../../shared/index';
import teamService from '../services/team.service';
import { useAuth } from './AuthContext';
import storageService from '../services/storage';

interface TeamMembershipInfo {
  isCreator: boolean;
  isAdmin: boolean;
  isMember: boolean;
  role: string;    // 職務役割
  memberRole?: string; // 権限ロール
}

interface TeamContextType {
  teams: ITeam[];
  activeTeamId: string | null;
  setActiveTeamId: (teamId: string) => Promise<void>;
  activeTeam: ITeam | null;
  isLoading: boolean;
  refreshTeams: () => Promise<void>;
  // 権限チェック関連
  getUserTeamRole: (teamId?: string) => Promise<TeamMembershipInfo>;
  hasTeamPermission: (action: string, teamId?: string) => Promise<boolean>;
}

export const TeamContext = createContext<TeamContextType>({
  teams: [],
  activeTeamId: null,
  setActiveTeamId: async () => {},
  activeTeam: null,
  isLoading: false,
  refreshTeams: async () => {},
  // 権限チェック関連のデフォルト値
  getUserTeamRole: async () => ({ 
    isCreator: false, 
    isAdmin: false, 
    isMember: false, 
    role: '' 
  }),
  hasTeamPermission: async () => false
});

export const useTeam = () => useContext(TeamContext);

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [activeTeamId, setActiveTeamIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const auth = useAuth();
  // useAuth()から取得したユーザー情報を使用

  // ユーザーの所属チーム一覧を取得
  const fetchTeams = async () => {
    if (!auth.userProfile) {
      setTeams([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const userTeams = await teamService.getUserTeams();
      setTeams(userTeams);
      
      // アクティブチームが未設定か、所属チームに存在しない場合は最初のチームをアクティブに
      if (!activeTeamId || !userTeams.some(team => team.id === activeTeamId)) {
        const defaultTeamId = userTeams.length > 0 ? userTeams[0].id : null;
        if (defaultTeamId) {
          await setActiveTeamId(defaultTeamId);
        }
      }
    } catch (error) {
      console.error('チーム一覧取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // アクティブチームIDの設定と永続化
  const setActiveTeamId = async (teamId: string) => {
    try {
      await storageService.set('activeTeamId', teamId);
      setActiveTeamIdState(teamId);
      
      // チーム変更イベントを発火
      window.dispatchEvent(new CustomEvent('team-context-changed', { 
        detail: { teamId } 
      }));
      
      console.log(`アクティブチームIDを設定: ${teamId}`);
    } catch (error) {
      console.error('アクティブチームID保存エラー:', error);
    }
  };

  // 初期化処理
  useEffect(() => {
    const initialize = async () => {
      try {
        // 保存されたアクティブチームIDの読み込み
        const savedTeamId = await storageService.get('activeTeamId');
        if (savedTeamId) {
          setActiveTeamIdState(savedTeamId);
        }
        
        await fetchTeams();
      } catch (error) {
        console.error('TeamContext初期化エラー:', error);
      }
    };
    
    initialize();
  }, [auth.userProfile?.id]);  // auth.userProfile?.idが変更された時に再実行

  // ユーザーのチーム内の役割情報を取得 - 直接APIを呼び出してキャッシュの問題を回避
  const getUserTeamRole = async (teamId?: string): Promise<TeamMembershipInfo> => {
    try {
      const targetTeamId = teamId || activeTeamId;
      
      if (!targetTeamId || !auth.userProfile?.id) {
        return { isCreator: false, isAdmin: false, isMember: false, role: '' };
      }
      
      console.log(`[TeamContext] チームメンバー情報取得を開始: teamId=${targetTeamId}, userId=${auth.userProfile?.id}`);
      
      // キャッシュを無視して直接APIを呼び出し（teamService内部キャッシュをクリア）
      teamService.invalidateTeamCache(targetTeamId);
      teamService.invalidateTeamCache('userTeams');
      
      // チームメンバー情報を取得
      const members = await teamService.getTeamMembers(targetTeamId);
      console.log(`[TeamContext] チームメンバー一覧取得完了:`, members);
      
      const userMembership = members.find(member => member.userId === auth.userProfile?.id);
      console.log(`[TeamContext] ユーザーのメンバーシップ情報:`, userMembership);
      
      if (!userMembership) {
        return { isCreator: false, isAdmin: false, isMember: false, role: '' };
      }
      
      // チーム情報を取得してcreatorかどうか確認（こちらも直接API呼び出し）
      const team = await teamService.getTeamById(targetTeamId);
      console.log(`[TeamContext] チーム情報:`, team);
      
      const isCreator = team && team.adminId === auth.userProfile?.id;

      // MongoDB上のmemberRoleが有効になるように優先度を変更
      const memberRole = 
        userMembership.memberRole === 'admin' ? 'admin' :
        userMembership.memberRole === 'creator' ? 'creator' :
        isCreator ? 'creator' : 
        userMembership.isAdmin ? 'admin' : 'member';
      
      console.log(`[TeamContext] 計算された最終的なmemberRole: ${memberRole}`);
      
      return {
        isCreator,
        isAdmin: userMembership.isAdmin || false,
        isMember: true,
        role: userMembership.role || '',
        memberRole: memberRole
      };
    } catch (error) {
      console.error('チーム役割情報取得エラー:', error);
      return { isCreator: false, isAdmin: false, isMember: false, role: '' };
    }
  };
  
  // 特定のアクション権限があるかどうかをチェック
  const hasTeamPermission = async (action: string, teamId?: string): Promise<boolean> => {
    console.log(`[TeamContext] 権限チェック開始: アクション=${action}, チームID=${teamId}`);
    
    const userRole = await getUserTeamRole(teamId);
    console.log(`[TeamContext] ユーザー役割情報:`, userRole);
    
    // memberRoleに基づいて権限チェック
    const memberRole = userRole.memberRole || 
      (userRole.isCreator ? 'creator' : userRole.isAdmin ? 'admin' : 'member');
    
    console.log(`[TeamContext] 計算されたメンバーロール: ${memberRole}`);
    
    // クリエイターは全ての権限を持つ
    if (memberRole === 'creator') {
      console.log(`[TeamContext] クリエイター権限により許可`);
      return true;
    }
    
    // アクションに基づく権限マトリックス
    let hasPermission = false;
    
    switch (action) {
      // 閲覧系アクション（すべてのメンバーに許可）
      case 'view_team':
      case 'view_members':
      case 'view_team_fortune':
      case 'view_team_goal':
        hasPermission = userRole.isMember;
        console.log(`[TeamContext] 閲覧系アクション: ${hasPermission ? '許可' : '拒否'}`);
        break;
        
      // 管理系アクション（管理者以上）
      case 'add_member':
      case 'remove_member':
      case 'update_member_role':
      case 'set_team_goal':
      case 'manage_team':
        hasPermission = memberRole === 'admin' || memberRole === 'creator';
        console.log(`[TeamContext] 管理系アクション: ${hasPermission ? '許可' : '拒否'} (memberRole=${memberRole})`);
        break;
        
      // チーム情報編集（管理者以上）
      case 'edit_team_info':
        hasPermission = memberRole === 'admin' || memberRole === 'creator';
        console.log(`[TeamContext] チーム情報編集: ${hasPermission ? '許可' : '拒否'}`);
        break;
        
      // チーム削除はクリエイターのみ
      case 'delete_team':
        hasPermission = memberRole === 'creator';
        console.log(`[TeamContext] チーム削除: ${hasPermission ? '許可' : '拒否'}`);
        break;
        
      // 高度な管理機能（クリエイターのみ）
      case 'advanced_team_admin':
        hasPermission = memberRole === 'creator';
        console.log(`[TeamContext] 高度な管理機能: ${hasPermission ? '許可' : '拒否'}`);
        break;
        
      // デフォルトはメンバーシップがあればOK
      default:
        hasPermission = userRole.isMember;
        console.log(`[TeamContext] デフォルトアクション: ${hasPermission ? '許可' : '拒否'}`);
        break;
    }
    
    console.log(`[TeamContext] 権限チェック結果: ${hasPermission ? '許可' : '拒否'}`);
    return hasPermission;
  };

  // アクティブチームの計算
  const activeTeam = teams.find(team => team.id === activeTeamId) || null;

  const value = {
    teams,
    activeTeamId,
    setActiveTeamId,
    activeTeam,
    isLoading,
    refreshTeams: fetchTeams,
    getUserTeamRole,
    hasTeamPermission
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
};