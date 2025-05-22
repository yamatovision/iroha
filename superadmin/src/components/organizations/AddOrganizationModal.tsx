import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  Avatar,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PaymentsIcon from '@mui/icons-material/Payments';
import { CreateOrganizationRequest } from '../../../shared/index';

interface Plan {
  _id: string;
  name: string;
  price: number;
}

interface AddOrganizationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOrganizationRequest) => Promise<void>;
  plans: Plan[];
  isLoading?: boolean;
}

const AddOrganizationModal: React.FC<AddOrganizationModalProps> = ({
  open,
  onClose,
  onSubmit,
  plans = [],
  isLoading = false,
}) => {
  const initialState: CreateOrganizationRequest = {
    name: '',
    address: '',
    contactInfo: {
      phone: '',
      email: '',
      website: '',
    },
    initialOwner: {
      name: '',
      email: '',
      password: '',
    },
    plan: '',
    trialDays: 30,
  };

  const [formData, setFormData] = useState<CreateOrganizationRequest>(initialState);
  const [autoUpgrade, setAutoUpgrade] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof CreateOrganizationRequest],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    // エラーをクリア
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleAutoUpgradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoUpgrade(e.target.checked);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // 必須項目のチェック
    if (!formData.name.trim()) {
      newErrors['name'] = '組織名は必須です';
    }
    
    if (!formData.initialOwner.name.trim()) {
      newErrors['initialOwner.name'] = 'オーナー名は必須です';
    }
    
    if (!formData.initialOwner.email.trim()) {
      newErrors['initialOwner.email'] = 'メールアドレスは必須です';
    } else if (!/\S+@\S+\.\S+/.test(formData.initialOwner.email)) {
      newErrors['initialOwner.email'] = '有効なメールアドレスを入力してください';
    }
    
    if (!formData.initialOwner.password.trim()) {
      newErrors['initialOwner.password'] = 'パスワードは必須です';
    } else if (formData.initialOwner.password.length < 8) {
      newErrors['initialOwner.password'] = 'パスワードは8文字以上必要です';
    }
    
    if (!formData.plan) {
      newErrors['plan'] = 'プランを選択してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      await onSubmit(formData);
      handleReset();
    } catch (error) {
      console.error('組織作成エラー:', error);
    }
  };

  const handleReset = () => {
    setFormData(initialState);
    setAutoUpgrade(false);
    setErrors({});
  };

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
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">新規組織登録</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>
          組織を作成すると、指定された管理者メールアドレス宛に招待メールが自動送信されます。初期管理者は組織内のスタイリスト管理などを行うことができます。
        </Alert>

        {/* 組織基本情報 */}
        <Typography variant="subtitle1" fontWeight={500} gutterBottom>基本情報</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="組織名"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors['name']}
              helperText={errors['name']}
              placeholder="例：美容室さくら"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="電話番号"
              name="contactInfo.phone"
              value={formData.contactInfo?.phone || ''}
              onChange={handleChange}
              placeholder="例：03-1234-5678"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="メールアドレス"
              name="contactInfo.email"
              value={formData.contactInfo?.email || ''}
              onChange={handleChange}
              placeholder="例：contact@salon.example.com"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="住所"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              placeholder="例：東京都新宿区新宿3-1-13"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="ウェブサイト"
              name="contactInfo.website"
              value={formData.contactInfo?.website || ''}
              onChange={handleChange}
              placeholder="例：https://salon.example.com"
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        {/* 初期オーナー設定 */}
        <Box sx={{ 
          p: 2, 
          mb: 3, 
          backgroundColor: '#f0f4ff', 
          borderRadius: 2 
        }}>
          <Typography 
            variant="subtitle1" 
            fontWeight={500} 
            color="#3f51b5" 
            sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
          >
            <AdminPanelSettingsIcon sx={{ mr: 1 }} />
            初期オーナー設定（Owner権限）
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            この初期オーナーは組織のオーナー権限(Owner)を持ち、スタイリストの追加や削除、課金情報の管理、Admin権限の付与など、組織内の全ての管理機能にアクセスできます。Ownerは組織の存続に関わる重要な決定権を持ちます。
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="オーナー名"
                name="initialOwner.name"
                value={formData.initialOwner.name}
                onChange={handleChange}
                error={!!errors['initialOwner.name']}
                helperText={errors['initialOwner.name']}
                placeholder="例：田中 太郎"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="オーナーメールアドレス"
                name="initialOwner.email"
                value={formData.initialOwner.email}
                onChange={handleChange}
                error={!!errors['initialOwner.email']}
                helperText={errors['initialOwner.email']}
                placeholder="例：owner@example.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="パスワード"
                name="initialOwner.password"
                type="password"
                value={formData.initialOwner.password}
                onChange={handleChange}
                error={!!errors['initialOwner.password']}
                helperText={errors['initialOwner.password']}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={true} 
                    disabled 
                  />
                }
                label={
                  <Typography variant="body2" color="#3f51b5">
                    オーナー権限を付与（<strong>必須</strong>: 組織の所有者として最高権限を持ちます）
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </Box>
        
        {/* サブスクリプション設定 */}
        <Box sx={{ 
          p: 2, 
          mb: 3, 
          backgroundColor: '#fef8e8', 
          borderRadius: 2 
        }}>
          <Typography 
            variant="subtitle1" 
            fontWeight={500} 
            color="#f57c00" 
            sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
          >
            <PaymentsIcon sx={{ mr: 1 }} />
            サブスクリプション設定
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors['plan']}>
                <InputLabel>サブスクリプションプラン</InputLabel>
                <Select
                  name="plan"
                  value={formData.plan}
                  label="サブスクリプションプラン *"
                  onChange={handleSelectChange as any}
                >
                  <MenuItem value="">選択してください</MenuItem>
                  {plans.map((plan) => (
                    <MenuItem key={plan._id} value={plan._id}>
                      {plan.name} (¥{plan.price.toLocaleString()}/月)
                    </MenuItem>
                  ))}
                </Select>
                {errors['plan'] && (
                  <Typography variant="caption" color="error">
                    {errors['plan']}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="トライアル期間（日数）"
                name="trialDays"
                type="number"
                value={formData.trialDays || 30}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 0, max: 90 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={autoUpgrade} 
                    onChange={handleAutoUpgradeChange} 
                  />
                }
                label="トライアル終了後、自動的にスタンダードプランに移行する"
              />
            </Grid>
          </Grid>
        </Box>
        
        <TextField
          fullWidth
          label="備考"
          name="notes"
          multiline
          rows={3}
          placeholder="備考やメモを入力..."
        />
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleReset} 
          color="inherit" 
          disabled={isLoading}
        >
          リセット
        </Button>
        <Button 
          onClick={onClose} 
          color="inherit" 
          disabled={isLoading}
        >
          キャンセル
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isLoading}
        >
          {isLoading ? '処理中...' : '組織を作成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddOrganizationModal;