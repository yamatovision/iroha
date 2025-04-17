import apiService from './api.service';
import { TEAM } from '../../../shared/index';
import { ITeam, TeamRequest, AddTeamMemberRequest } from '../../../shared/index';

/**
 * チームデータサービス
 * チーム管理に関連するAPIとの通信を担当
 */
class TeamService {
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
      const response = await apiService.get(TEAM.GET_TEAM_MEMBERS(teamId));
      return response.data.members;
    } catch (error) {
      console.error(`Failed to fetch team members for team ${teamId}:`, error);
      throw error;
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
   * チーム目標を設定する
   * @param teamId チームID
   * @param goal 目標内容
   * @param deadline 目標期限 (オプション)
   * @returns 設定結果
   */
  async setTeamGoal(teamId: string, goal: string, deadline?: Date): Promise<any> {
    try {
      const response = await apiService.post(TEAM.SET_TEAM_GOAL(teamId), { content: goal, deadline });
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
   * @returns メンバーカルテ情報
   */
  async getMemberCard(teamId: string, userId: string): Promise<any> {
    try {
      const response = await apiService.get(TEAM.GET_MEMBER_CARD(teamId, userId));
      return response.data;
    } catch (error) {
      console.error(`Failed to get member card for user ${userId} in team ${teamId}:`, error);
      throw error;
    }
  }
}

export default new TeamService();