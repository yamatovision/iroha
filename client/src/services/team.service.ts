import apiService from './api.service';
import { TEAM } from '../../../shared/index';
import { ITeam, TeamRequest, AddTeamMemberRequest } from '../../../shared/index';

/**
 * チームデータサービス
 * チーム管理に関連するAPIとの通信を担当
 */
class TeamService {
  private teamDataCache: Map<string, { data: any, expiration: Date }> = new Map();
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5分

  /**
   * チーム一覧を取得する
   * @returns チーム一覧
   */
  async getTeams(): Promise<ITeam[]> {
    try {
      const response = await apiService.get(TEAM.LIST_TEAMS);
      return response.data.teams;
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      throw error;
    }
  }
  
  /**
   * ユーザーの所属チーム一覧を取得する
   * 複数チームメンバーシップをサポート
   * @returns ユーザーが所属する全チーム一覧
   */
  async getUserTeams(): Promise<ITeam[]> {
    try {
      const cacheKey = 'userTeams';
      const cachedData = this.teamDataCache.get(cacheKey);
      
      // 有効なキャッシュが存在する場合はそれを返す
      if (cachedData && cachedData.expiration > new Date()) {
        console.log('キャッシュからユーザーチーム一覧を取得');
        return cachedData.data;
      }
      
      // APIからデータを取得
      const response = await apiService.get(TEAM.GET_USER_TEAMS);
      const teams = response.data.teams;
      
      // キャッシュに保存
      const expiration = new Date(new Date().getTime() + this.CACHE_DURATION_MS);
      this.teamDataCache.set(cacheKey, { data: teams, expiration });
      
      return teams;
    } catch (error) {
      console.error('Failed to fetch user teams:', error);
      throw error;
    }
  }

  /**
   * チーム詳細を取得する
   * @param teamId チームID
   * @returns チーム詳細情報
   */
  async getTeamById(teamId: string): Promise<ITeam> {
    try {
      const response = await apiService.get(TEAM.GET_TEAM(teamId));
      return response.data.team;
    } catch (error) {
      console.error(`Failed to fetch team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * 新しいチームを作成する
   * @param teamData チーム作成データ
   * @returns 作成されたチーム
   */
  async createTeam(teamData: TeamRequest): Promise<ITeam> {
    try {
      const response = await apiService.post(TEAM.CREATE_TEAM, teamData);
      return response.data.team;
    } catch (error) {
      console.error('Failed to create team:', error);
      throw error;
    }
  }

  /**
   * チーム情報を更新する
   * @param teamId チームID
   * @param teamData 更新データ
   * @returns 更新されたチーム
   */
  async updateTeam(teamId: string, teamData: Partial<TeamRequest>): Promise<ITeam> {
    try {
      const response = await apiService.put(TEAM.UPDATE_TEAM(teamId), teamData);
      return response.data.team;
    } catch (error) {
      console.error(`Failed to update team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * チームを削除する
   * @param teamId チームID
   * @returns 成功状態
   */
  async deleteTeam(teamId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiService.delete(TEAM.DELETE_TEAM(teamId));
      return response.data;
    } catch (error) {
      console.error(`Failed to delete team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * チームメンバー一覧を取得する
   * @param teamId チームID
   * @returns チームメンバー一覧
   */
  async getTeamMembers(teamId: string): Promise<any[]> {
    try {
      console.log(`[teamService] チームメンバー一覧取得開始: teamId=${teamId}`);
      
      // キャッシュをクリアして確実に最新データを取得
      await apiService.clearCache(TEAM.GET_TEAM_MEMBERS(teamId));
      
      const response = await apiService.get(TEAM.GET_TEAM_MEMBERS(teamId), undefined, {
        skipCache: true,
        forceRefresh: true
      });
      
      if (!response || !response.data) {
        console.error(`[teamService] チームメンバー取得エラー: レスポンスが空です teamId=${teamId}`);
        return [];
      }
      
      if (!response.data.members) {
        console.error(`[teamService] チームメンバー取得エラー: members配列がありません`, response.data);
        return [];
      }
      
      console.log(`[teamService] チームメンバー取得成功: ${response.data.members.length}件`);
      return response.data.members;
    } catch (error: any) {
      console.error(`[teamService] チームメンバー取得エラー (teamId=${teamId}):`, error);
      // APIエラーの詳細ログ
      if (error.response) {
        console.error(`[teamService] APIエラー詳細: status=${error.response.status}, data=`, error.response.data);
      }
      // エラーでも空配列を返して処理を継続可能にする
      return [];
    }
  }

  /**
   * チームにメンバーを追加する
   * @param teamId チームID
   * @param memberData メンバー追加データ
   * @returns 追加結果
   */
  async addTeamMember(teamId: string, memberData: AddTeamMemberRequest): Promise<any> {
    try {
      const response = await apiService.post(TEAM.ADD_TEAM_MEMBER(teamId), memberData);
      return response.data;
    } catch (error) {
      console.error(`Failed to add member to team ${teamId}:`, error);
      throw error;
    }
  }
  
  /**
   * 友達をチームメンバーとして追加する
   * @param teamId チームID
   * @param friendId 友達のユーザーID
   * @param role チーム内での役割
   * @returns 追加結果
   */
  /**
   * 友達をチームメンバーとして追加する
   * @param teamId チームID
   * @param friendId 友達のユーザーID
   * @param role チーム内での役割
   * @returns 追加結果
   */
  async addMemberFromFriend(teamId: string, friendId: string, role: string): Promise<any> {
    try {
      // ADD_MEMBER_FROM_FRIENDエンドポイントを使用してAPI呼び出し
      const response = await apiService.post(TEAM.ADD_MEMBER_FROM_FRIEND(teamId), {
        friendId,
        role
      });
      
      // キャッシュを無効化
      this.invalidateTeamCache(teamId);
      this.invalidateTeamCache('userTeams');
      
      return response.data;
    } catch (error) {
      console.error(`Failed to add friend ${friendId} to team ${teamId}:`, error);
      throw error;
    }
  }
  
  /**
   * チーム関連のキャッシュを無効化する
   * @param cacheKey キャッシュキー (teamId または 'userTeams')
   */
  invalidateTeamCache(cacheKey: string): void {
    // 指定したキーのキャッシュを削除
    this.teamDataCache.delete(cacheKey);
    
    // userTeamsキーの場合は全てのチーム関連キャッシュをクリア
    if (cacheKey === 'userTeams') {
      this.teamDataCache.clear();
    }
    
    console.log(`チームキャッシュを無効化: ${cacheKey}`);
  }

  /**
   * チームメンバーの役割を更新する
   * @param teamId チームID
   * @param userId ユーザーID
   * @param role 新しい役割
   * @returns 更新結果
   */
  async updateMemberRole(teamId: string, userId: string, role: string): Promise<any> {
    try {
      const response = await apiService.put(TEAM.UPDATE_TEAM_MEMBER_ROLE(teamId, userId), { role });
      return response.data;
    } catch (error) {
      console.error(`Failed to update role for user ${userId} in team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * チームからメンバーを削除する
   * @param teamId チームID
   * @param userId ユーザーID
   * @returns 削除結果
   */
  async removeTeamMember(teamId: string, userId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiService.delete(TEAM.REMOVE_TEAM_MEMBER(teamId, userId));
      return response.data;
    } catch (error) {
      console.error(`Failed to remove user ${userId} from team ${teamId}:`, error);
      throw error;
    }
  }
  
  /**
   * チームから脱退する（メンバー自身が実行）
   * @param teamId チームID
   * @returns 成功状態
   */
  async leaveTeam(teamId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiService.post(TEAM.LEAVE_TEAM(teamId));
      
      // キャッシュを無効化
      this.invalidateTeamCache(teamId);
      this.invalidateTeamCache('userTeams');
      
      return response.data;
    } catch (error) {
      console.error(`Failed to leave team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * チーム目標を設定する
   * @param teamId チームID
   * @param goal 目標内容
   * @param deadline 目標期限 (オプション)
   * @returns 設定結果
   */
  async setTeamGoal(teamId: string, goal: string, deadline?: Date): Promise<any> {
    try {
      const response = await apiService.post(TEAM.SET_TEAM_GOAL(teamId), { content: goal, deadline });
      
      // 重要: 関連するキャッシュを明示的に無効化
      await apiService.clearCache(TEAM.GET_TEAM_GOAL(teamId));
      
      // チーム自体のキャッシュも更新して確実に最新情報を反映
      await apiService.clearCache(TEAM.GET_TEAM(teamId));
      
      // キャッシュ操作を確認するログ
      console.log(`チーム目標設定後にキャッシュを無効化: ${TEAM.GET_TEAM_GOAL(teamId)}`);
      
      return response.data;
    } catch (error) {
      console.error(`Failed to set goal for team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * チーム目標を取得する
   * @param teamId チームID
   * @returns チーム目標情報
   */
  async getTeamGoal(teamId: string): Promise<any> {
    try {
      const response = await apiService.get(TEAM.GET_TEAM_GOAL(teamId));
      return response.data.goal;
    } catch (error) {
      console.error(`Failed to get goal for team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * チーム内の相性マトリックスを取得する
   * @param teamId チームID
   * @returns 相性マトリックスデータ
   */
  async getTeamCompatibility(teamId: string): Promise<any> {
    try {
      // 拡張相性診断APIを優先的に使用
      try {
        const response = await apiService.get(TEAM.GET_TEAM_ENHANCED_COMPATIBILITY(teamId));
        return response.data;
      } catch (enhancedError) {
        console.warn(`拡張相性診断APIでのエラー、標準APIにフォールバック:`, enhancedError);
        // エラーが発生した場合は標準APIにフォールバック
        const response = await apiService.get(TEAM.GET_TEAM_COMPATIBILITY(teamId));
        return response.data;
      }
    } catch (error) {
      console.error(`Failed to get compatibility matrix for team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * 特定のメンバー間の相性を取得する
   * @param teamId チームID
   * @param userId1 ユーザー1 ID
   * @param userId2 ユーザー2 ID
   * @returns 相性データ
   */
  async getMemberCompatibility(teamId: string, userId1: string, userId2: string): Promise<any> {
    try {
      // 拡張相性診断APIを優先的に使用
      try {
        const response = await apiService.get(TEAM.GET_MEMBER_ENHANCED_COMPATIBILITY(teamId, userId1, userId2));
        return response.data.compatibility;
      } catch (enhancedError) {
        console.warn(`拡張相性診断APIでのエラー、標準APIにフォールバック:`, enhancedError);
        // エラーが発生した場合は標準APIにフォールバック
        const response = await apiService.get(TEAM.GET_MEMBER_COMPATIBILITY(teamId, userId1, userId2));
        return response.data.compatibility;
      }
    } catch (error) {
      console.error(`Failed to get compatibility between users ${userId1} and ${userId2}:`, error);
      throw error;
    }
  }
  
  /**
   * メンバーカルテ情報を取得する
   * @param teamId チームID
   * @param userId ユーザーID
   * @param skipCache キャッシュをスキップするかどうか
   * @returns メンバーカルテ情報
   */
  async getMemberCard(teamId: string, userId: string, skipCache: boolean = false): Promise<any> {
    try {
      // カルテ生成中はキャッシュを使わないようにする
      const url = TEAM.GET_MEMBER_CARD(teamId, userId);
      
      if (skipCache) {
        // キャッシュをクリアしてから取得
        await apiService.clearCache(url);
        console.log(`メンバーカルテのキャッシュをクリア: ${url}`);
      }
      
      const response = await apiService.get(url, {}, { skipCache });
      return response.data;
    } catch (error) {
      console.error(`Failed to get member card for user ${userId} in team ${teamId}:`, error);
      throw error;
    }
  }
}

export default new TeamService();