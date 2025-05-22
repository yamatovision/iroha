import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  Grid,
  Chip,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tab,
  Tabs,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import PaymentsIcon from '@mui/icons-material/Payments';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import PasswordIcon from '@mui/icons-material/Password';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HistoryIcon from '@mui/icons-material/History';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { OrganizationDetailResponse, OrganizationStatus, ExtendTrialRequest, UpdateOrganizationStatusRequest } from '../../../shared/index';
import OrganizationStatusBadge from './OrganizationStatusBadge';
import { format, differenceInDays, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';

// タブパネルコンポーネント
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`organization-tabpanel-${index}`}
      aria-labelledby={`organization-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
};

interface OrganizationDetailsModalProps {
  open: boolean;
  onClose: () => void;
  organization?: OrganizationDetailResponse | null;
  onExtendTrial: (orgId: string, data: ExtendTrialRequest) => Promise<void>;
  onUpdateStatus: (orgId: string, data: UpdateOrganizationStatusRequest) => Promise<void>;
  onChangePlan: (orgId: string, planId: string) => Promise<void>;
  plans: Array<{ _id: string; name: string; price?: number }>;
  isLoading?: boolean;
}

const OrganizationDetailsModal: React.FC<OrganizationDetailsModalProps> = ({
  open,
  onClose,
  organization,
  onExtendTrial,
  onUpdateStatus,
  onChangePlan,
  plans = [],
  isLoading = false,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [trialDays, setTrialDays] = useState(14);
  
  // タブ変更ハンドラ
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // トライアル期間計算
  const calculateTrialInfo = () => {
    if (!organization?.subscription?.trialEndsAt) return null;
    
    const trialEndDate = new Date(organization.subscription.trialEndsAt);
    const now = new Date();
    const daysLeft = differenceInDays(trialEndDate, now);
    
    return {
      endDate: trialEndDate,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
      isExpiring: daysLeft <= 7 && daysLeft > 0,
      isExpired: daysLeft <= 0,
    };
  };

  const trialInfo = calculateTrialInfo();

  // トライアル延長
  const handleExtendTrial = async () => {
    if (!organization) return;
    
    try {
      await onExtendTrial(organization._id, {
        days: trialDays,
        notifyOwner: true,
      });
    } catch (error) {
      console.error('トライアル延長エラー:', error);
    }
  };

  // ステータス更新
  const handleUpdateStatus = async (status: OrganizationStatus) => {
    if (!organization) return;
    
    try {
      await onUpdateStatus(organization._id, {
        status,
        notifyOwner: true,
      });
    } catch (error) {
      console.error('ステータス更新エラー:', error);
    }
  };

  // プラン変更
  const handleChangePlan = async () => {
    if (!organization || !selectedPlan) return;
    
    try {
      await onChangePlan(organization._id, selectedPlan);
      setSelectedPlan('');
    } catch (error) {
      console.error('プラン変更エラー:', error);
    }
  };

  if (!organization) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{organization.name} - 詳細</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* 組織ヘッダー */}
        <Box 
          display="flex" 
          alignItems="center" 
          mb={2.5} 
          pb={2} 
          borderBottom={`1px solid ${theme.palette.divider}`}
        >
          <Avatar
            alt={organization.name}
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              organization.name
            )}&background=random&size=80`}
            sx={{ width: 80, height: 80, mr: 2, borderRadius: 2 }}
          />
          <Box flex={1}>
            <Typography variant="h5" gutterBottom>
              {organization.name}
            </Typography>
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={1.5}>
              <OrganizationStatusBadge 
                status={organization.status} 
                trialDaysLeft={trialInfo?.daysLeft}
              />
              <Typography variant="body2" color="text.secondary">
                ID: {organization._id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                登録日: {format(new Date(organization.createdAt), 'yyyy年M月d日', { locale: ja })}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* タブナビゲーション */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="organization detail tabs"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="基本情報" />
            <Tab label="サブスクリプション" />
            <Tab label="管理ユーザー" />
            <Tab label="サポート履歴" />
          </Tabs>
        </Box>
        
        {/* 基本情報タブ */}
        <TabPanel value={tabValue} index={0}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  color: theme.palette.primary.main
                }}
              >
                <BusinessIcon sx={{ mr: 1 }} />
                基本情報
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    連絡先情報
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">住所</Typography>
                    <Typography variant="body2">
                      {organization.address || '未設定'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">電話番号</Typography>
                    <Typography variant="body2">
                      {organization.contactInfo?.phone || '未設定'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">メールアドレス</Typography>
                    <Typography variant="body2">
                      {organization.contactInfo?.email || '未設定'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">ウェブサイト</Typography>
                    <Typography variant="body2">
                      {organization.contactInfo?.website ? (
                        <Link href={organization.contactInfo.website} target="_blank" color="primary">
                          {organization.contactInfo.website}
                        </Link>
                      ) : '未設定'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    利用状況
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">スタイリスト数</Typography>
                    <Typography variant="body2">
                      {organization.statistics.userCount}名
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">クライアント数</Typography>
                    <Typography variant="body2">
                      {organization.statistics.clientCount}名
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">アクティブユーザー</Typography>
                    <Typography variant="body2">
                      {organization.statistics.activeUserCount}名
                      <Typography 
                        component="span" 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ ml: 1 }}
                      >
                        ({Math.round((organization.statistics.activeUserCount / organization.statistics.userCount) * 100) || 0}%)
                      </Typography>
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>
        
        {/* サブスクリプションタブ */}
        <TabPanel value={tabValue} index={1}>
          <Box 
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}
          >
            <Typography 
              variant="subtitle1" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: theme.palette.primary.main
              }}
            >
              <PaymentsIcon sx={{ mr: 1 }} />
              サブスクリプション
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="success"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleUpdateStatus(OrganizationStatus.ACTIVE)}
                disabled={organization.status === OrganizationStatus.ACTIVE || isLoading}
              >
                有効化
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<BlockIcon />}
                onClick={() => handleUpdateStatus(OrganizationStatus.SUSPENDED)}
                disabled={organization.status === OrganizationStatus.SUSPENDED || isLoading}
              >
                停止
              </Button>
            </Box>
          </Box>
          
          <Card 
            variant="outlined" 
            sx={{ 
              mb: 3, 
              backgroundColor: theme.palette.grey[50]
            }}
          >
            <CardContent>
              <Box 
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1.5
                }}
              >
                <Typography variant="h6">
                  {organization.plan?.name || 'プラン未設定'}
                </Typography>
                <OrganizationStatusBadge 
                  status={organization.status} 
                  trialDaysLeft={trialInfo?.daysLeft}
                />
              </Box>
              
              {organization.subscription && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    {organization.status === OrganizationStatus.TRIAL ? (
                      <>
                        トライアル期間: {format(new Date(organization.subscription.startDate), 'yyyy年M月d日', { locale: ja })} 〜 {format(new Date(organization.subscription.trialEndsAt || organization.subscription.currentPeriodEnd), 'yyyy年M月d日', { locale: ja })}
                      </>
                    ) : (
                      <>
                        契約期間: {format(new Date(organization.subscription.startDate), 'yyyy年M月d日', { locale: ja })} 〜 {format(new Date(organization.subscription.currentPeriodEnd), 'yyyy年M月d日', { locale: ja })}
                      </>
                    )}
                  </Typography>
                  
                  {trialInfo?.isExpiring && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        color: theme.palette.warning.main,
                        my: 1
                      }}
                    >
                      <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />
                      トライアル期限が近づいています。
                    </Typography>
                  )}
                  
                  {organization.status === OrganizationStatus.TRIAL && (
                    <Typography variant="body2" color="text.secondary">
                      トライアル終了後は<strong>自動的にスタンダードプラン</strong>に移行します。
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                プラン変更
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>プラン</InputLabel>
                  <Select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    label="プラン"
                  >
                    <MenuItem value="">選択してください</MenuItem>
                    {plans.map((plan) => (
                      <MenuItem 
                        key={plan._id} 
                        value={plan._id}
                        disabled={plan._id === organization.plan?._id}
                      >
                        {plan.name}{plan.price ? ` (¥${plan.price.toLocaleString()}/月)` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleChangePlan}
                  disabled={!selectedPlan || isLoading}
                >
                  変更
                </Button>
              </Box>
            </Grid>
            
            {organization.status === OrganizationStatus.TRIAL && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  トライアル延長
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>延長日数</InputLabel>
                    <Select
                      value={trialDays}
                      onChange={(e) => setTrialDays(Number(e.target.value))}
                      label="延長日数"
                    >
                      <MenuItem value={7}>7日間</MenuItem>
                      <MenuItem value={14}>14日間</MenuItem>
                      <MenuItem value={30}>30日間</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={handleExtendTrial}
                    disabled={isLoading}
                  >
                    延長
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        {/* 管理ユーザータブ */}
        <TabPanel value={tabValue} index={2}>
          <Box 
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}
          >
            <Typography 
              variant="subtitle1" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: theme.palette.primary.main
              }}
            >
              <AdminPanelSettingsIcon sx={{ mr: 1 }} />
              組織オーナー（Owner権限）
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PasswordIcon />}
                disabled={isLoading}
              >
                パスワードリセット
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<PersonAddIcon />}
                disabled={isLoading}
              >
                オーナー変更
              </Button>
            </Box>
          </Box>
          
          {organization.owner ? (
            <Card variant="outlined" sx={{ mb: 3, backgroundColor: theme.palette.grey[50] }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    alt={organization.owner.name}
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      organization.owner.name
                    )}&background=random&size=40`}
                    sx={{ mr: 1.5 }}
                  />
                  <Box>
                    <Typography variant="subtitle1">{organization.owner.name}</Typography>
                    <Typography variant="body2" color="text.secondary">オーナー</Typography>
                  </Box>
                  <Chip
                    label="Owner権限"
                    size="small"
                    sx={{
                      ml: 'auto',
                      backgroundColor: theme.palette.error.light,
                      color: theme.palette.error.main,
                      fontWeight: 500
                    }}
                  />
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      メールアドレス
                    </Typography>
                    <Typography variant="body2">
                      {organization.owner.email}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      ユーザーID
                    </Typography>
                    <Typography variant="body2">
                      {organization.owner._id}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Typography color="text.secondary" variant="body1" sx={{ my: 2 }}>
              オーナー情報はまだ設定されていません。
            </Typography>
          )}
          
          <Typography variant="subtitle1" sx={{ mt: 4, mb: 2 }}>
            管理者ユーザー
          </Typography>
          
          {organization.adminUsers?.length > 0 ? (
            <List>
              {organization.adminUsers.map((admin) => (
                <ListItem 
                  key={admin._id}
                  sx={{ 
                    border: `1px solid ${theme.palette.divider}`, 
                    borderRadius: 1,
                    mb: 1 
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      alt={admin.name}
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        admin.name
                      )}&background=random&size=40`}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={admin.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {admin.email}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" color="text.secondary">
                          {admin.role}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={admin.role === 'owner' ? 'Owner' : 'Admin'}
                      size="small"
                      color={admin.role === 'owner' ? 'error' : 'primary'}
                      sx={{ fontWeight: 500 }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" variant="body2">
              管理者ユーザーが登録されていません。
            </Typography>
          )}
        </TabPanel>
        
        {/* サポート履歴タブ */}
        <TabPanel value={tabValue} index={3}>
          <Box 
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}
          >
            <Typography 
              variant="subtitle1" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: theme.palette.primary.main
              }}
            >
              <HelpOutlineIcon sx={{ mr: 1 }} />
              サポート履歴
            </Typography>
            
            <Button
              variant="contained"
              size="small"
              disabled={isLoading}
            >
              新規サポートチケット
            </Button>
          </Box>
          
          {/* サンプルのサポート履歴表示 */}
          <List>
            <ListItem 
              sx={{ 
                backgroundColor: theme.palette.grey[50], 
                borderRadius: 1,
                mb: 2
              }}
            >
              <Box width="100%">
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center" 
                  mb={1}
                >
                  <Typography variant="subtitle2">アカウント設定について</Typography>
                  <Chip
                    label="解決済み"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  gutterBottom
                  display="block"
                >
                  2025年4月25日 14:23 - 担当: 山田 太郎
                </Typography>
                <Typography variant="body2">
                  管理者アカウントの追加方法についての問い合わせ。メール招待の手順を説明し、解決しました。
                </Typography>
              </Box>
            </ListItem>
            
            <ListItem 
              sx={{ 
                backgroundColor: theme.palette.grey[50], 
                borderRadius: 1,
                mb: 2
              }}
            >
              <Box width="100%">
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center" 
                  mb={1}
                >
                  <Typography variant="subtitle2">カレンダー連携について</Typography>
                  <Chip
                    label="対応中"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                </Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  gutterBottom
                  display="block"
                >
                  2025年4月26日 09:45 - 担当: 佐藤 花子
                </Typography>
                <Typography variant="body2">
                  Google カレンダーとの連携方法について質問。APIの認証設定方法を説明中です。
                </Typography>
              </Box>
            </ListItem>
          </List>
          
          <Box textAlign="center" mt={2}>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              size="small"
            >
              全ての履歴を表示 (5件)
            </Button>
          </Box>
        </TabPanel>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizationDetailsModal;