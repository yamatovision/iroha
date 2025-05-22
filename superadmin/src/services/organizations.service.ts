import api from './api.service';
import { API_BASE_PATH } from '../../../shared/index';

// SuperAdmin用の組織管理APIパス
export const SUPERADMIN = {
  ORGANIZATIONS: `${API_BASE_PATH}/superadmin/organizations`,
  ORGANIZATION_DETAIL: (id: string) => `${API_BASE_PATH}/superadmin/organizations/${id}`,
  ORGANIZATION_STATUS: (id: string) => `${API_BASE_PATH}/superadmin/organizations/${id}/status`,
  ORGANIZATION_OWNER: (id: string) => `${API_BASE_PATH}/superadmin/organizations/${id}/owner`,
  ORGANIZATION_PLAN: (id: string) => `${API_BASE_PATH}/superadmin/organizations/${id}/plan`,
  EXTEND_TRIAL: (id: string) => `${API_BASE_PATH}/superadmin/organizations/${id}/extend-trial`,
  PAYMENT_STATUS: (id: string) => `${API_BASE_PATH}/superadmin/organizations/${id}/payment-status`,
  RESTORE_ACCESS: (id: string) => `${API_BASE_PATH}/superadmin/organizations/${id}/restore-access`,
  PAYMENT_REMINDER: (id: string) => `${API_BASE_PATH}/superadmin/organizations/${id}/payment-reminder`,
  MEMBERS: (id: string) => `${API_BASE_PATH}/superadmin/organizations/${id}/members`,
  BATCH_STATUS: `${API_BASE_PATH}/superadmin/batch/organizations/status`,
  BATCH_EXTEND_TRIAL: `${API_BASE_PATH}/superadmin/batch/organizations/extend-trial`,
};

// 組織一覧取得
export const getOrganizations = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  planId?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}) => {
  try {
    const response = await api.get(SUPERADMIN.ORGANIZATIONS, params);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    throw error;
  }
};

// 組織詳細取得
export const getOrganizationDetail = async (organizationId: string) => {
  try {
    const response = await api.get(SUPERADMIN.ORGANIZATION_DETAIL(organizationId));
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch organization detail for ID ${organizationId}:`, error);
    throw error;
  }
};

// 組織作成
export const createOrganization = async (organizationData: {
  name: string;
  address?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  initialOwner: {
    name: string;
    email: string;
    password: string;
  };
  plan: string;
  trialDays?: number;
}) => {
  try {
    const response = await api.post(SUPERADMIN.ORGANIZATIONS, organizationData);
    return response.data;
  } catch (error) {
    console.error('Failed to create organization:', error);
    throw error;
  }
};

// 組織更新
export const updateOrganization = async (
  organizationId: string,
  organizationData: {
    name?: string;
    address?: string;
    contactInfo?: {
      phone?: string;
      email?: string;
      website?: string;
    };
  }
) => {
  try {
    const response = await api.put(SUPERADMIN.ORGANIZATION_DETAIL(organizationId), organizationData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update organization with ID ${organizationId}:`, error);
    throw error;
  }
};

// 組織ステータス変更
export const updateOrganizationStatus = async (
  organizationId: string,
  statusData: {
    status: 'active' | 'trial' | 'suspended';
    reason?: string;
    notifyOwner?: boolean;
  }
) => {
  try {
    const response = await api.put(SUPERADMIN.ORGANIZATION_STATUS(organizationId), statusData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update status for organization with ID ${organizationId}:`, error);
    throw error;
  }
};

// 組織オーナー取得
export const getOrganizationOwner = async (organizationId: string) => {
  try {
    const response = await api.get(SUPERADMIN.ORGANIZATION_OWNER(organizationId));
    return response.data;
  } catch (error) {
    console.error(`Failed to get owner for organization with ID ${organizationId}:`, error);
    throw error;
  }
};

// 組織オーナー変更
export const changeOrganizationOwner = async (
  organizationId: string,
  ownerData: {
    userId: string;
    notifyPreviousOwner?: boolean;
    notifyNewOwner?: boolean;
  }
) => {
  try {
    const response = await api.put(SUPERADMIN.ORGANIZATION_OWNER(organizationId), ownerData);
    return response.data;
  } catch (error) {
    console.error(`Failed to change owner for organization with ID ${organizationId}:`, error);
    throw error;
  }
};

// 組織オーナー作成
export const createOrganizationOwner = async (
  organizationId: string,
  ownerData: {
    name: string;
    email: string;
    password: string;
    sendInvitation?: boolean;
  }
) => {
  try {
    const response = await api.post(SUPERADMIN.ORGANIZATION_OWNER(organizationId), ownerData);
    return response.data;
  } catch (error) {
    console.error(`Failed to create owner for organization with ID ${organizationId}:`, error);
    throw error;
  }
};

// プラン変更
export const changeOrganizationPlan = async (
  organizationId: string,
  planData: {
    planId: string;
    effectiveDate?: string;
    notifyOwner?: boolean;
  }
) => {
  try {
    const response = await api.put(SUPERADMIN.ORGANIZATION_PLAN(organizationId), planData);
    return response.data;
  } catch (error) {
    console.error(`Failed to change plan for organization with ID ${organizationId}:`, error);
    throw error;
  }
};

// トライアル延長
export const extendTrial = async (
  organizationId: string,
  trialData: {
    days: number;
    reason?: string;
    notifyOwner?: boolean;
  }
) => {
  try {
    const response = await api.post(SUPERADMIN.EXTEND_TRIAL(organizationId), trialData);
    return response.data;
  } catch (error) {
    console.error(`Failed to extend trial for organization with ID ${organizationId}:`, error);
    throw error;
  }
};

// 一括ステータス更新
export const batchUpdateStatus = async (data: {
  organizationIds: string[];
  status: 'active' | 'suspended';
  reason?: string;
  notifyOwners?: boolean;
}) => {
  try {
    const response = await api.put(SUPERADMIN.BATCH_STATUS, data);
    return response.data;
  } catch (error) {
    console.error('Failed to perform batch status update:', error);
    throw error;
  }
};

// 一括トライアル延長
export const batchExtendTrial = async (data: {
  organizationIds: string[];
  days: number;
  reason?: string;
  notifyOwners?: boolean;
}) => {
  try {
    const response = await api.post(SUPERADMIN.BATCH_EXTEND_TRIAL, data);
    return response.data;
  } catch (error) {
    console.error('Failed to perform batch trial extension:', error);
    throw error;
  }
};

const organizationsService = {
  getOrganizations,
  getOrganizationDetail,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
  getOrganizationOwner,
  changeOrganizationOwner,
  createOrganizationOwner,
  changeOrganizationPlan,
  extendTrial,
  batchUpdateStatus,
  batchExtendTrial
};

export default organizationsService;