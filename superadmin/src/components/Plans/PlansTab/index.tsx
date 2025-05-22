import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlanCard from './PlanCard';
import PlanFormModal from './PlanFormModal';
import useAdminApi from '../../../hooks/useAdminApi';

/**
 * プランのインターフェース
 */
interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * プラン管理タブコンポーネント
 * プランの一覧表示、作成、編集、削除を管理します
 */
const PlansTab: React.FC = () => {
  // 状態管理
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // APIフックの利用
  const { fetchData, postData, putData, deleteData } = useAdminApi();

  // 初期読み込み
  useEffect(() => {
    loadPlans();
  }, []);

  /**
   * プラン一覧の読み込み
   */
  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await fetchData('/admin/plans');
      setPlans(response.data || []);
      setError(null);
    } catch (error) {
      console.error('プラン取得エラー:', error);
      setError('プランの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  /**
   * プラン作成モーダルを開く
   */
  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setOpenModal(true);
  };

  /**
   * プラン編集モーダルを開く
   */
  const handleOpenEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setOpenModal(true);
  };

  /**
   * モーダルを閉じる
   */
  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingPlan(null);
  };

  /**
   * プランの保存処理（作成/更新）
   */
  const handleSavePlan = async (planData: Partial<Plan>) => {
    try {
      if (editingPlan) {
        // 既存プランの更新
        await putData(`/admin/plans/${editingPlan.id}`, planData);
        setSnackbar({
          open: true,
          message: 'プランを更新しました',
          severity: 'success'
        });
      } else {
        // 新規プランの作成
        await postData('/admin/plans', planData);
        setSnackbar({
          open: true,
          message: '新しいプランを作成しました',
          severity: 'success'
        });
      }
      // プラン一覧を再読み込み
      await loadPlans();
      handleCloseModal();
    } catch (error) {
      console.error('プラン保存エラー:', error);
      setSnackbar({
        open: true,
        message: 'プランの保存に失敗しました',
        severity: 'error'
      });
    }
  };

  /**
   * プランの削除処理
   */
  const handleDeletePlan = async (planId: string) => {
    try {
      await deleteData(`/admin/plans/${planId}`);
      setSnackbar({
        open: true,
        message: 'プランを削除しました',
        severity: 'success'
      });
      // プラン一覧を再読み込み
      await loadPlans();
    } catch (error) {
      console.error('プラン削除エラー:', error);
      setSnackbar({
        open: true,
        message: 'プランの削除に失敗しました',
        severity: 'error'
      });
    }
  };

  /**
   * プランのアクティブ状態を切り替え
   */
  const handleToggleActive = async (planId: string, isActive: boolean) => {
    try {
      await putData(`/admin/plans/${planId}/status`, { isActive });
      setSnackbar({
        open: true,
        message: isActive ? 'プランを有効化しました' : 'プランを無効化しました',
        severity: 'success'
      });
      // プラン一覧を再読み込み
      await loadPlans();
    } catch (error) {
      console.error('プラン状態更新エラー:', error);
      setSnackbar({
        open: true,
        message: 'プランの状態更新に失敗しました',
        severity: 'error'
      });
    }
  };

  /**
   * スナックバーを閉じる
   */
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" component="h2">
          プラン設定
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateModal}
        >
          新しいプランを作成
        </Button>
      </Box>

      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ローディング表示 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* プラン一覧 */}
          {plans.length === 0 ? (
            <Alert severity="info">
              プランがまだ登録されていません。「新しいプランを作成」ボタンをクリックして最初のプランを作成してください。
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {plans.map((plan) => (
                <Grid item xs={12} sm={6} md={4} key={plan.id}>
                  <PlanCard
                    plan={plan}
                    onEdit={() => handleOpenEditModal(plan)}
                    onDelete={() => handleDeletePlan(plan.id)}
                    onToggleActive={() => handleToggleActive(plan.id, !plan.isActive)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* プラン作成・編集モーダル */}
      <PlanFormModal
        open={openModal}
        onClose={handleCloseModal}
        onSave={handleSavePlan}
        plan={editingPlan}
      />

      {/* 通知用スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PlansTab;