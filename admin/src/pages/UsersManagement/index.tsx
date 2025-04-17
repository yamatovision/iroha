import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';
import AdminService from '../../services/admin.service';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const UsersManagement = () => {
  // ユーザー一覧ステート
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // ユーザー編集ステート
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editUserRole, setEditUserRole] = useState('');
  const [editUserPlan, setEditUserPlan] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // 削除ダイアログステート
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState('');
  // const [deleteLoading, setDeleteLoading] = useState(false);

  // 通知コンテキスト
  const { showNotification } = useNotification();

  // 新規ユーザー追加用の状態
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [newUserRole, setNewUserRole] = useState('User');
  const [newUserPlan, setNewUserPlan] = useState('lite');
  const [addLoading, setAddLoading] = useState(false);

  // 初期データ読み込み
  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, planFilter]);

  // ユーザー一覧の読み込み
  const loadUsers = async (params: { search?: string, page?: number } = {}) => {
    try {
      setLoading(true);
      
      // 検索パラメータの設定
      const searchParam = params.search || searchTerm;
      const pageParam = params.page || page;
      const roleParam = roleFilter !== 'all' ? roleFilter : undefined;
      const planParam = planFilter !== 'all' ? planFilter : undefined;
      
      // APIリクエスト
      const response = await AdminService.getUsers({
        page: pageParam,
        limit: 10,
        role: roleParam,
        plan: planParam,
        search: searchParam
      });
      
      if (response.data && response.data.users) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('ユーザー一覧の取得に失敗しました:', error);
      showNotification(NotificationType.ERROR, 'ユーザー一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 検索ハンドラー
  const handleSearch = () => {
    setPage(1);
    loadUsers({ search: searchTerm, page: 1 });
  };

  // ページネーション変更ハンドラー
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // ロールフィルター変更ハンドラー
  const handleRoleFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    setRoleFilter(value);
    setPage(1);
  };

  // プランフィルター変更ハンドラー
  const handlePlanFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    setPlanFilter(value);
    setPage(1);
  };

  // 編集ダイアログを開く
  const openEditDialog = (user: any) => {
    // user.id または user._id を使用し、どちらもなければ操作をキャンセル
    const userId = user.id || user._id;
    if (!userId) {
      showNotification(NotificationType.ERROR, 'ユーザーIDが取得できませんでした');
      return;
    }
    
    setEditUserId(userId);
    setEditUserRole(user.role);
    setEditUserPlan(user.plan || 'lite');
    setEditDialogOpen(true);
  };

  // ユーザー権限更新とプラン更新はダイアログの更新ボタンのクリックハンドラーに統合されています

  // 削除ダイアログを開く
  const openDeleteDialog = (user: any) => {
    // user.id または user._id を使用し、どちらもなければ操作をキャンセル
    const userId = user.id || user._id;
    if (!userId) {
      showNotification(NotificationType.ERROR, 'ユーザーIDが取得できませんでした');
      return;
    }
    
    setDeleteUserId(userId);
    setDeleteUserName(user.displayName || user.email);
    setDeleteDialogOpen(true);
  };

  // ユーザー削除
  const deleteUser = async () => {
    if (!deleteUserId) return;
    
    try {
      // APIリクエスト
      await AdminService.removeAdmin(deleteUserId);
      
      showNotification(NotificationType.SUCCESS, 'ユーザーを削除しました');
      setDeleteDialogOpen(false);
      
      // ユーザー一覧を更新
      loadUsers();
    } catch (error) {
      console.error('ユーザーの削除に失敗しました:', error);
      showNotification(NotificationType.ERROR, 'ユーザーの削除に失敗しました');
    }
  };

  // ロールに基づいたチップの色を取得
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super_admin':
      case 'superadmin':
        return 'secondary';
      case 'admin':
        return 'primary';
      default:
        return 'default';
    }
  };

  // プランに基づいたチップの色を取得
  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'elite':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        ユーザー管理
      </Typography>

      {/* 検索・フィルターカード */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={12} md={4}>
              <TextField
                fullWidth
                label="ユーザー検索"
                variant="outlined"
                placeholder="名前またはメールアドレス"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel id="role-filter-label">権限</InputLabel>
                <Select
                  labelId="role-filter-label"
                  value={roleFilter}
                  label="権限"
                  onChange={(e: any) => handleRoleFilterChange(e)}
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="User">一般ユーザー</MenuItem>
                  <MenuItem value="Admin">管理者</MenuItem>
                  <MenuItem value="SuperAdmin">スーパー管理者</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel id="plan-filter-label">プラン</InputLabel>
                <Select
                  labelId="plan-filter-label"
                  value={planFilter}
                  label="プラン"
                  onChange={(e: any) => handlePlanFilterChange(e)}
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="lite">ライト</MenuItem>
                  <MenuItem value="elite">エリート</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                fullWidth
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : '検索'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={12} md={2}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
                fullWidth
              >
                新規追加
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ユーザー一覧 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            ユーザー一覧
          </Typography>
          
          {loading ? (
            <LoadingIndicator />
          ) : (
            <>
              <TableContainer component={Paper} sx={{ my: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>名前</TableCell>
                      <TableCell>メールアドレス</TableCell>
                      <TableCell>権限</TableCell>
                      <TableCell>プラン</TableCell>
                      <TableCell>アクション</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length > 0 ? 
                      users.map(user => {
                        // 確実に一意のキーを生成
                        const rowKey = `user-row-${user.id || user._id || user.email}`;
                        return (
                          <TableRow key={rowKey}>
                            <TableCell>{user.displayName || '-'}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={
                                  user.role === 'super_admin' || user.role === 'SuperAdmin' ? 'スーパー管理者' : 
                                  user.role === 'admin' || user.role === 'Admin' ? '管理者' : 
                                  '一般ユーザー'
                                }
                                color={getRoleColor(user.role) as any}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={user.plan === 'elite' ? 'エリート' : 'ライト'}
                                color={getPlanColor(user.plan) as any}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => openEditDialog(user)}
                                  title="編集"
                                >
                                  <EditIcon />
                                </IconButton>
                                {' '}
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => openDeleteDialog(user)}
                                  title="削除"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    : 
                      <TableRow key="no-users">
                        <TableCell colSpan={5} align="center">
                          ユーザーが見つかりません
                        </TableCell>
                      </TableRow>
                    }
                  </TableBody>
                </Table>
              </TableContainer>
              
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !editLoading && setEditDialogOpen(false)}
        aria-labelledby="edit-dialog-title"
      >
        <DialogTitle id="edit-dialog-title">
          ユーザー情報の編集
        </DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="role-label">権限</InputLabel>
              <Select
                labelId="role-label"
                value={editUserRole}
                label="権限"
                onChange={(e) => setEditUserRole(e.target.value)}
                disabled={editLoading}
              >
                <MenuItem value="User">一般ユーザー</MenuItem>
                <MenuItem value="Admin">管理者</MenuItem>
                <MenuItem value="SuperAdmin">スーパー管理者</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="plan-label">プラン</InputLabel>
              <Select
                labelId="plan-label"
                value={editUserPlan}
                label="プラン"
                onChange={(e) => setEditUserPlan(e.target.value)}
                disabled={editLoading}
              >
                <MenuItem value="lite">ライト</MenuItem>
                <MenuItem value="elite">エリート</MenuItem>
              </Select>
            </FormControl>

            {editLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialogOpen(false)}
            disabled={editLoading}
          >
            キャンセル
          </Button>
          <Button
            onClick={async () => {
              setEditLoading(true);
              try {
                // 権限の更新
                await AdminService.updateUserRole(editUserId!, editUserRole);
                
                // プランの更新
                await AdminService.updateUserPlan(editUserId!, editUserPlan);
                
                showNotification(NotificationType.SUCCESS, 'ユーザー情報を更新しました');
                setEditDialogOpen(false);
                
                // ユーザー一覧を更新
                loadUsers();
              } catch (error) {
                console.error('ユーザー情報の更新に失敗しました:', error);
                showNotification(NotificationType.ERROR, 'ユーザー情報の更新に失敗しました');
              } finally {
                setEditLoading(false);
              }
            }}
            color="primary"
            disabled={editLoading}
            variant="contained"
          >
            更新
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="ユーザーの削除"
        message={`${deleteUserName} を削除しますか？この操作は元に戻せません。`}
        confirmLabel="削除"
        cancelLabel="キャンセル"
        severity="error"
        onConfirm={deleteUser}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* 新規ユーザー追加ダイアログ */}
      <Dialog
        open={addDialogOpen}
        onClose={() => !addLoading && setAddDialogOpen(false)}
        aria-labelledby="add-user-dialog-title"
      >
        <DialogTitle id="add-user-dialog-title">
          新規ユーザーの追加
        </DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, mt: 2 }}>
            <TextField
              fullWidth
              label="メールアドレス"
              variant="outlined"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              disabled={addLoading}
              margin="normal"
              required
              type="email"
            />
            
            <TextField
              fullWidth
              label="パスワード"
              variant="outlined"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              disabled={addLoading}
              margin="normal"
              required
              type="password"
            />
            
            <TextField
              fullWidth
              label="表示名"
              variant="outlined"
              value={newUserDisplayName}
              onChange={(e) => setNewUserDisplayName(e.target.value)}
              disabled={addLoading}
              margin="normal"
              required
            />
            
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel id="new-role-label">権限</InputLabel>
              <Select
                labelId="new-role-label"
                value={newUserRole}
                label="権限"
                onChange={(e) => setNewUserRole(e.target.value)}
                disabled={addLoading}
              >
                <MenuItem value="User">一般ユーザー</MenuItem>
                <MenuItem value="Admin">管理者</MenuItem>
                <MenuItem value="SuperAdmin">スーパー管理者</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="new-plan-label">プラン</InputLabel>
              <Select
                labelId="new-plan-label"
                value={newUserPlan}
                label="プラン"
                onChange={(e) => setNewUserPlan(e.target.value)}
                disabled={addLoading}
              >
                <MenuItem value="lite">ライト</MenuItem>
                <MenuItem value="elite">エリート</MenuItem>
              </Select>
            </FormControl>

            {addLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAddDialogOpen(false)}
            disabled={addLoading}
          >
            キャンセル
          </Button>
          <Button
            onClick={async () => {
              if (!newUserEmail) {
                showNotification(NotificationType.ERROR, 'メールアドレスを入力してください');
                return;
              }
              
              if (!newUserPassword) {
                showNotification(NotificationType.ERROR, 'パスワードを入力してください');
                return;
              }
              
              if (!newUserDisplayName) {
                showNotification(NotificationType.ERROR, '表示名を入力してください');
                return;
              }
              
              setAddLoading(true);
              try {
                // APIリクエスト
                await AdminService.addAdmin(
                  newUserEmail,
                  newUserPassword,
                  newUserDisplayName,
                  newUserRole,
                  newUserPlan
                );
                
                showNotification(NotificationType.SUCCESS, 'ユーザーを追加しました');
                setAddDialogOpen(false);
                
                // 入力フィールドをリセット
                setNewUserEmail('');
                setNewUserPassword('');
                setNewUserDisplayName('');
                setNewUserRole('User');
                setNewUserPlan('lite');
                
                // ユーザー一覧を更新
                loadUsers();
              } catch (error) {
                console.error('ユーザーの追加に失敗しました:', error);
                showNotification(NotificationType.ERROR, 'ユーザーの追加に失敗しました');
              } finally {
                setAddLoading(false);
              }
            }}
            color="primary"
            disabled={addLoading || !newUserEmail || !newUserPassword || !newUserDisplayName}
            variant="contained"
          >
            追加
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersManagement;