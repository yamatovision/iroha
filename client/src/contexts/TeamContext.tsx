import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { ITeam } from '../../../shared/index';
import teamService from '../services/team.service';
import { useAuth } from './AuthContext';
import storageService from '../services/storage';
import apiService from '../services/api.service';

// 既知の無効なチームID
const INVALID_TEAM_IDS = ['6806c251ee9352d08ceba138'];

interface TeamMembershipInfo {
  isCreator: boolean;
  isAdmin: boolean;
  isMember: boolean;
  role: string;
  memberRole?: string;
}

interface TeamContextType {
  teams: ITeam[];
  activeTeamId: string | null;
  setActiveTeamId: (teamId: string | null) => Promise<void>;
  activeTeam: ITeam | null;
  isLoading: boolean;
  refreshTeams: () => Promise<void>;
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
  
  // キャッシュ用に最後に取得した役割情報を保持
  const roleCache = React.useRef<Map<string, {info: TeamMembershipInfo, timestamp: number}>>(new Map());
  // キャッシュの有効期間 (5分)
  const ROLE_CACHE_TTL = 5 * 60 * 1000;

  // アクティブチームIDの設定と永続化
  const setActiveTeamId = async (teamId: string | null) => {
    try {
      if (teamId === null) {
        // nullの場合はストレージから削除
        await storageService.remove('activeTeamId');
        setActiveTeamIdState(null);
      } else {
        // 有効なIDの場合は保存
        await storageService.set('activeTeamId', teamId);
        setActiveTeamIdState(teamId);
      }
      
      // チーム変更イベントを発火
      window.dispatchEvent(new CustomEvent('team-context-changed', { 
        detail: { teamId } 
      }));
    } catch (error) {
      console.error('アクティブチームID保存エラー:', error);
    }
  };

  // ユーザーの所属チーム一覧を取得し、アクティブチームを設定
  const fetchTeams = async () => {
    if (!auth.userProfile) {
      setTeams([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // ロールキャッシュをクリア
      roleCache.current.clear();
      
      // キャッシュを無効化
      teamService.invalidateTeamCache('userTeams');
      
      // 無効なチームIDのキャッシュをクリア
      for (const invalidId of INVALID_TEAM_IDS) {
        await apiService.clearCache(`/api/v1/teams/${invalidId}/members`);
        await apiService.clearCache(`/api/v1/fortune/team/${invalidId}/context`);
        await apiService.clearCache(`/api/v1/fortune/team/${invalidId}/ranking`);
        await apiService.clearCache(`/api/v1/teams/${invalidId}/goal`);
      }
      
      // 最新のチーム一覧を取得
      let userTeams = await teamService.getUserTeams();
      
      // チームが見つからない場合
      if (!userTeams || userTeams.length === 0) {
        setTeams([]);
        await setActiveTeamId(null);
        setIsLoading(false);
        return;
      }
      
      // チームの優先順位付け
      if (auth.userProfile?.id) {
        userTeams = userTeams.sort((a, b) => {
          // 管理者チームを優先
          const userIsAdminOfA = a.adminId === auth.userProfile?.id;
          const userIsAdminOfB = b.adminId === auth.userProfile?.id;
          
          if (userIsAdminOfA && !userIsAdminOfB) return -1;
          if (!userIsAdminOfA && userIsAdminOfB) return 1;
          
          // 次に新しいチームを優先
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
      }
      
      // チームをステートに設定
      setTeams(userTeams);
      
      // 有効なチームIDリストを作成
      const validTeamIds = userTeams.map(team => team.id);
      
      // 現在のアクティブチームIDをチェック
      const savedTeamId = await storageService.get('activeTeamId');
      
      // 無効なチームIDかBLACKLISTにあるIDの場合は最初のチームを使用
      if (!savedTeamId || 
          !validTeamIds.includes(savedTeamId) || 
          INVALID_TEAM_IDS.includes(savedTeamId)) {
        const defaultTeamId = userTeams[0].id;
        await setActiveTeamId(defaultTeamId);
      } else {
        // 有効なIDならstateに設定
        setActiveTeamIdState(savedTeamId);
      }
    } catch (error) {
      console.error('チーム一覧取得エラー:', error);
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 初期化処理
  useEffect(() => {
    const initialize = async () => {
      try {
        // キャッシュをクリアして最新のチーム一覧を取得
        await fetchTeams();
      } catch (error) {
        console.error('TeamContext初期化エラー:', error);
      }
    };
    
    initialize();
  }, [auth.userProfile?.id]);

  // ユーザーのチーム内の役割情報を取得
  const getUserTeamRole = async (teamId?: string): Promise<TeamMembershipInfo> => {
    try {
      const targetTeamId = teamId || activeTeamId;
      
      if (!targetTeamId || !auth.userProfile?.id) {
        return { isCreator: false, isAdmin: false, isMember: false, role: '' };
      }
      
      // キャッシュをチェック
      const cacheKey = `${targetTeamId}`;
      const now = Date.now();
      const cachedRole = roleCache.current.get(cacheKey);
      
      // キャッシュが有効期間内なら使用
      if (cachedRole && (now - cachedRole.timestamp) < ROLE_CACHE_TTL) {
        return cachedRole.info;
      }
      
      // チームメンバー情報を取得
      const members = await teamService.getTeamMembers(targetTeamId);
      
      if (!members || members.length === 0) {
        const noMemberInfo = { isCreator: false, isAdmin: false, isMember: false, role: '' };
        roleCache.current.set(cacheKey, {info: noMemberInfo, timestamp: now});
        return noMemberInfo;
      }
      
      const userMembership = members.find(member => member.userId === auth.userProfile?.id);
      
      if (!userMembership) {
        const noMemberInfo = { isCreator: false, isAdmin: false, isMember: false, role: '' };
        roleCache.current.set(cacheKey, {info: noMemberInfo, timestamp: now});
        return noMemberInfo;
      }
      
      // チーム情報を取得
      const team = await teamService.getTeamById(targetTeamId);
      const isCreator = team && team.adminId === auth.userProfile?.id;

      // メンバーロールの決定
      const memberRole = 
        userMembership.memberRole === 'admin' ? 'admin' :
        userMembership.memberRole === 'creator' ? 'creator' :
        isCreator ? 'creator' : 
        userMembership.isAdmin ? 'admin' : 'member';
      
      const roleInfo = {
        isCreator,
        isAdmin: userMembership.isAdmin || false,
        isMember: true,
        role: userMembership.role || '',
        memberRole: memberRole
      };
      
      // 結果をキャッシュ
      roleCache.current.set(cacheKey, {info: roleInfo, timestamp: now});
      
      return roleInfo;
    } catch (error) {
      console.error('チーム役割情報取得エラー:', error);
      return { isCreator: false, isAdmin: false, isMember: false, role: '' };
    }
  };
  
  // 特定のアクション権限があるかどうかをチェック
  const hasTeamPermission = async (action: string, teamId?: string): Promise<boolean> => {
    const userRole = await getUserTeamRole(teamId);
    
    // メンバーロールの決定
    const memberRole = userRole.memberRole || 
      (userRole.isCreator ? 'creator' : userRole.isAdmin ? 'admin' : 'member');
    
    // クリエイターは全ての権限を持つ
    if (memberRole === 'creator') {
      return true;
    }
    
    // アクションに基づく権限チェック
    switch (action) {
      // 閲覧系アクション（すべてのメンバーに許可）
      case 'view_team':
      case 'view_members':
      case 'view_team_fortune':
      case 'view_team_goal':
        return userRole.isMember;
        
      // 管理系アクション（管理者以上）
      case 'add_member':
      case 'remove_member':
      case 'update_member_role':
      case 'set_team_goal':
      case 'manage_team':
      case 'edit_team_info':
        return memberRole === 'admin' || memberRole === 'creator';
        
      // クリエイターのみの操作
      case 'delete_team':
      case 'advanced_team_admin':
        return memberRole === 'creator';
        
      // デフォルトはメンバーシップがあればOK
      default:
        return userRole.isMember;
    }
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