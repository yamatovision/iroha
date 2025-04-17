import ApiService from './api.service';
import { ADMIN } from '@shared/index';
import { AxiosResponse } from 'axios';

/**
 * 管理者APIサービス
 * 管理者用APIエンドポイントとの通信を行うクラス
 */
class AdminService {
  /**
   * ユーザー一覧を取得
   */
  public async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    plan?: string;
    search?: string;
  } = {}): Promise<AxiosResponse<any>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.role) queryParams.append('role', params.role);
    if (params.plan) queryParams.append('plan', params.plan);
    if (params.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const url = `${ADMIN.MANAGE_ADMINS}${queryString ? `?${queryString}` : ''}`;
    
    return ApiService.get(url);
  }

  /**
   * 管理者を追加
   */
  public async addAdmin(email: string, password?: string, displayName?: string, role?: string, plan?: string): Promise<AxiosResponse<any>> {
    return ApiService.post(ADMIN.ADD_ADMIN, { 
      email,
      password,
      displayName,
      role,
      plan
    });
  }

  /**
   * 管理者を削除
   */
  public async removeAdmin(userId: string): Promise<AxiosResponse<any>> {
    return ApiService.delete(ADMIN.REMOVE_ADMIN(userId));
  }

  /**
   * 管理者権限を更新
   */
  public async updateAdminRole(userId: string, role: string): Promise<AxiosResponse<any>> {
    return ApiService.put(ADMIN.UPDATE_ADMIN_ROLE(userId), { role });
  }

  /**
   * ユーザー権限を更新
   */
  public async updateUserRole(userId: string, role: string): Promise<AxiosResponse<any>> {
    return ApiService.put(`${ADMIN.MANAGE_ADMINS}/${userId}/role`, { role });
  }

  /**
   * ユーザープランを更新
   */
  public async updateUserPlan(userId: string, plan: string): Promise<AxiosResponse<any>> {
    return ApiService.put(`${ADMIN.MANAGE_ADMINS}/${userId}/plan`, { plan });
  }

  /**
   * 運勢更新設定を取得
   */
  public async getFortuneUpdateSettings(): Promise<AxiosResponse<any>> {
    return ApiService.get(`${ADMIN.SYSTEM_SETTINGS}/fortune-update`);
  }

  /**
   * 運勢更新設定を更新
   */
  public async updateFortuneUpdateSettings(value: string, description?: string): Promise<AxiosResponse<any>> {
    return ApiService.put(`${ADMIN.SYSTEM_SETTINGS}/fortune-update`, { value, description });
  }

  /**
   * 運勢更新ログ一覧を取得
   */
  public async getFortuneUpdateLogs(params: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<AxiosResponse<any>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = `${ADMIN.SYSTEM_SETTINGS}/fortune-updates/logs${queryString ? `?${queryString}` : ''}`;
    
    return ApiService.get(url);
  }

  /**
   * 運勢更新ログ詳細を取得
   */
  public async getFortuneUpdateLogDetail(logId: string): Promise<AxiosResponse<any>> {
    return ApiService.get(`${ADMIN.SYSTEM_SETTINGS}/fortune-updates/logs/${logId}`);
  }

  /**
   * 手動で運勢更新を実行
   */
  public async runFortuneUpdate(params: {
    targetDate?: Date;
    targetUserIds?: string[];
  } = {}): Promise<AxiosResponse<any>> {
    return ApiService.post(`${ADMIN.SYSTEM_SETTINGS}/fortune-updates/manual-run`, params);
  }

  /**
   * システム統計を取得
   */
  public async getSystemStats(period: string = '30'): Promise<AxiosResponse<any>> {
    return ApiService.get(`${ADMIN.STATS}?period=${period}`);
  }

  /**
   * 日柱情報一覧を取得
   */
  public async getDayPillars(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<AxiosResponse<any>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = `${ADMIN.GET_DAY_PILLARS}${queryString ? `?${queryString}` : ''}`;
    
    return ApiService.get(url);
  }

  /**
   * 日柱生成ログ一覧を取得
   */
  public async getDayPillarLogs(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<AxiosResponse<any>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const url = `${ADMIN.GET_DAY_PILLAR_LOGS}${queryString ? `?${queryString}` : ''}`;
    
    return ApiService.get(url);
  }

  /**
   * 日柱生成ログ詳細を取得
   */
  public async getDayPillarLogDetail(logId: string): Promise<AxiosResponse<any>> {
    return ApiService.get(ADMIN.GET_DAY_PILLAR_LOG_DETAIL(logId));
  }

  /**
   * 手動で日柱生成を実行
   */
  public async runDayPillarGeneration(days: number = 30): Promise<AxiosResponse<any>> {
    return ApiService.post(ADMIN.RUN_DAY_PILLAR_GENERATION, { days });
  }
}

// シングルトンインスタンスをエクスポート
export default new AdminService();