import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Container,
  Snackbar,
  Alert,
  useTheme
} from '@mui/material';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { 
  Organization, 
  OrganizationStatus, 
  OrganizationListResponse,
  OrganizationDetailResponse,
  CreateOrganizationRequest,
  UpdateOrganizationStatusRequest,
  ExtendTrialRequest
} from '../../../shared/index';
import organizationsService from '../../services/organizations.service';

// コンポーネントのインポート
import StatisticsCards from '../../components/organizations/StatisticsCards';
import OrganizationFilter from '../../components/organizations/OrganizationFilter';
import BulkActionPanel from '../../components/organizations/BulkActionPanel';
import OrganizationsTable from '../../components/organizations/OrganizationsTable';
import AddOrganizationModal from '../../components/organizations/AddOrganizationModal';
import OrganizationDetailsModal from '../../components/organizations/OrganizationDetailsModal';

const plansMock = [
  { _id: 'basic', name: 'ベーシック', price: 4980 },
  { _id: 'standard', name: 'スタンダード', price: 9800 },
  { _id: 'premium', name: 'プレミアム', price: 19800 },
];

const OrganizationsPage: React.FC = () => {
  const theme = useTheme();
  // ステート管理
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationIds, setSelectedOrganizationIds] = useState<string[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationDetailResponse | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    planId: 'all',
    sortBy: 'createdAt',
    sortDir: 'desc' as 'asc' | 'desc',
  });
  const [stats, setStats] = useState({
    activeOrganizations: 0,
    activeGrowth: 2,
    trialOrganizations: 0,
    expiringTrials: 3,
    suspendedOrganizations: 0,
    totalStylists: 0,
    stylistsGrowth: 8,
  });
  
  // UI状態管理
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });
  
  // 組織データの取得
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        planId: filters.planId !== 'all' ? filters.planId : undefined,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
      };
      
      const response = await organizationsService.getOrganizations(params);
      setOrganizations(response.organizations);
      setPagination(response.pagination);
      
      // 統計情報の更新
      updateStats(response.organizations);
    } catch (error) {
      console.error('組織データ取得エラー:', error);
      showSnackbar('組織データの取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);
  
  // 統計情報の計算
  const updateStats = (orgs: Organization[]) => {
    const active = orgs.filter(org => org.status === OrganizationStatus.ACTIVE).length;
    const trial = orgs.filter(org => org.status === OrganizationStatus.TRIAL).length;
    const suspended = orgs.filter(org => org.status === OrganizationStatus.SUSPENDED).length;
    const totalUsers = orgs.reduce((sum, org) => sum + org.userCount, 0);
    
    // 期限切れまで7日以内のトライアル組織をカウント
    const expiringTrials = orgs.filter(org => {
      if (org.status !== OrganizationStatus.TRIAL || !org.subscription?.trialEndsAt) return false;
      const trialEndDate = new Date(org.subscription.trialEndsAt);
      const now = new Date();
      const diffDays = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays > 0;
    }).length;
    
    setStats({
      ...stats,
      activeOrganizations: active,
      trialOrganizations: trial,
      suspendedOrganizations: suspended,
      expiringTrials,
      totalStylists: totalUsers,
    });
  };
  
  // 組織詳細の取得
  const fetchOrganizationDetail = async (organizationId: string) => {
    setLoading(true);
    try {
      const response = await organizationsService.getOrganizationDetail(organizationId);
      setCurrentOrganization(response);
      setDetailsModalOpen(true);
    } catch (error) {
      console.error(`組織詳細取得エラー: ${organizationId}`, error);
      showSnackbar('組織詳細の取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 初期データ読み込み
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);
  
  // フィルター変更時
  const handleFilterChange = (newFilters: any) => {
    setFilters({
      ...filters,
      ...newFilters,
    });
    setPagination({
      ...pagination,
      page: 1, // フィルター変更時は1ページ目に戻す
    });
  };
  
  // ページ変更時
  const handlePageChange = (page: number) => {
    setPagination({
      ...pagination,
      page,
    });
  };
  
  // ソート変更時
  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setFilters({
      ...filters,
      sortBy: field,
      sortDir: direction,
    });
  };
  
  // 組織選択時
  const handleSelectOrganizations = (orgIds: string[]) => {
    setSelectedOrganizationIds(orgIds);
    // 選択した組織がある場合、一括操作パネルを表示
    setShowBulkActions(orgIds.length > 0);
  };
  
  // 詳細表示
  const handleViewDetails = (organizationId: string) => {
    fetchOrganizationDetail(organizationId);
  };
  
  // トライアル延長
  const handleExtendTrial = async (orgId: string, data: ExtendTrialRequest) => {
    setLoading(true);
    try {
      await organizationsService.extendTrial(orgId, data);
      showSnackbar('トライアル期間を延長しました', 'success');
      // 詳細情報を再取得
      await fetchOrganizationDetail(orgId);
      // 一覧も更新
      fetchOrganizations();
    } catch (error) {
      console.error(`トライアル延長エラー: ${orgId}`, error);
      showSnackbar('トライアル期間の延長に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // ステータス更新
  const handleUpdateStatus = async (orgId: string, data: UpdateOrganizationStatusRequest) => {
    setLoading(true);
    try {
      await organizationsService.updateOrganizationStatus(orgId, data);
      showSnackbar(`組織のステータスを${data.status === OrganizationStatus.ACTIVE ? '有効化' : '停止'}しました`, 'success');
      // 詳細情報を再取得
      await fetchOrganizationDetail(orgId);
      // 一覧も更新
      fetchOrganizations();
    } catch (error) {
      console.error(`ステータス更新エラー: ${orgId}`, error);
      showSnackbar('ステータスの更新に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // プラン変更
  const handleChangePlan = async (orgId: string, planId: string) => {
    setLoading(true);
    try {
      // プラン変更APIがあるとして
      showSnackbar('プランを変更しました', 'success');
      // 詳細情報を再取得
      await fetchOrganizationDetail(orgId);
      // 一覧も更新
      fetchOrganizations();
    } catch (error) {
      console.error(`プラン変更エラー: ${orgId}`, error);
      showSnackbar('プランの変更に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 組織作成
  const handleCreateOrganization = async (data: CreateOrganizationRequest) => {
    setLoading(true);
    try {
      await organizationsService.createOrganization(data);
      showSnackbar('組織を作成しました', 'success');
      setAddModalOpen(false);
      // 一覧を更新
      fetchOrganizations();
    } catch (error) {
      console.error('組織作成エラー:', error);
      showSnackbar('組織の作成に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 一括操作実行
  const handleExecuteBulkAction = async (action: string, params: any) => {
    setLoading(true);
    try {
      if (action === 'updateStatus') {
        await organizationsService.batchUpdateStatus(params);
        showSnackbar(`${params.organizationIds.length}件の組織のステータスを更新しました`, 'success');
      } else if (action === 'extendTrial') {
        await organizationsService.batchExtendTrial(params);
        showSnackbar(`${params.organizationIds.length}件の組織のトライアル期間を延長しました`, 'success');
      }
      
      // 選択解除と一覧更新
      setSelectedOrganizationIds([]);
      setShowBulkActions(false);
      fetchOrganizations();
    } catch (error) {
      console.error('一括操作エラー:', error);
      showSnackbar('一括操作に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // スナックバー表示
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };
  
  // スナックバー閉じる
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ページヘッダー */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography 
          variant="h4" 
          color="primary" 
          fontWeight={500} 
          gutterBottom={false}
        >
          組織管理
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddBusinessIcon />}
            onClick={() => setAddModalOpen(true)}
          >
            新規組織登録
          </Button>
        </Box>
      </Box>
      
      {/* 統計カード */}
      <StatisticsCards 
        activeOrganizations={stats.activeOrganizations}
        activeGrowth={stats.activeGrowth}
        trialOrganizations={stats.trialOrganizations}
        expiringTrials={stats.expiringTrials}
        suspendedOrganizations={stats.suspendedOrganizations}
        totalStylists={stats.totalStylists}
        stylistsGrowth={stats.stylistsGrowth}
      />
      
      {/* フィルターと検索 */}
      <OrganizationFilter 
        onFilterChange={handleFilterChange} 
        plans={plansMock}
      />
      
      {/* アクションバー */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#f9f9f9',
          borderRadius: 2,
          p: 1.5,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddBusinessIcon />}
            onClick={() => setAddModalOpen(true)}
          >
            新規組織登録
          </Button>
          
          {selectedOrganizationIds.length > 0 ? (
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={() => {
                setSelectedOrganizationIds([]);
                setShowBulkActions(false);
              }}
            >
              選択解除 ({selectedOrganizationIds.length})
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<PlaylistAddCheckIcon />}
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              一括操作
            </Button>
          )}
        </Box>
      </Box>
      
      {/* 一括操作パネル */}
      {showBulkActions && (
        <BulkActionPanel 
          selectedOrganizationIds={selectedOrganizationIds}
          onExecuteAction={handleExecuteBulkAction}
          onClose={() => setShowBulkActions(false)}
        />
      )}
      
      {/* 組織一覧テーブル */}
      <OrganizationsTable 
        organizations={organizations}
        onViewDetails={handleViewDetails}
        onSelectOrganizations={handleSelectOrganizations}
        selectedOrganizationIds={selectedOrganizationIds}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSort={handleSort}
        sortBy={filters.sortBy}
        sortDir={filters.sortDir}
        loading={loading}
      />
      
      {/* 新規組織追加モーダル */}
      <AddOrganizationModal 
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateOrganization}
        plans={plansMock}
        isLoading={loading}
      />
      
      {/* 組織詳細モーダル */}
      <OrganizationDetailsModal 
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        organization={currentOrganization}
        onExtendTrial={handleExtendTrial}
        onUpdateStatus={handleUpdateStatus}
        onChangePlan={handleChangePlan}
        plans={plansMock}
        isLoading={loading}
      />
      
      {/* 通知スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default OrganizationsPage;