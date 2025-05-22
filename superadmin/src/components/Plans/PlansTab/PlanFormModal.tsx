import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Divider,
  IconButton,
  Chip,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FeatureListEditor from './FeatureListEditor';

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
 * モーダルのProps
 */
interface PlanFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (plan: Partial<Plan>) => void;
  plan: Plan | null;
}

/**
 * プラン作成・編集モーダルコンポーネント
 */
const PlanFormModal: React.FC<PlanFormModalProps> = ({ open, onClose, onSave, plan }) => {
  // フォームの状態
  const [formData, setFormData] = useState<Partial<Plan>>({
    name: '',
    description: '',
    price: 0,
    currency: 'JPY',
    interval: 'month',
    features: [],
    isActive: true,
    displayOrder: 0
  });

  // フォームエラーの状態
  const [errors, setErrors] = useState<Record<string, string>>({});

  // プランデータが変更されたときにフォームを初期化
  useEffect(() => {
    if (plan) {
      setFormData({
        ...plan
      });
    } else {
      // 新規作成時のデフォルト値
      setFormData({
        name: '',
        description: '',
        price: 0,
        currency: 'JPY',
        interval: 'month',
        features: [],
        isActive: true,
        displayOrder: 0
      });
    }
    // エラーをリセット
    setErrors({});
  }, [plan, open]);

  /**
   * フォーム入力値の変更ハンドラ
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (name) {
      let parsedValue = value;
      
      // 数値フィールドの処理
      if (name === 'price' || name === 'displayOrder') {
        parsedValue = Number(value) || 0;
      }
      
      setFormData({
        ...formData,
        [name]: parsedValue
      });
      
      // エラーをクリア
      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: ''
        });
      }
    }
  };

  /**
   * 機能リストの更新ハンドラ
   */
  const handleFeaturesChange = (features: string[]) => {
    setFormData({
      ...formData,
      features
    });
  };

  /**
   * フォームのバリデーション
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // 必須フィールドのチェック
    if (!formData.name?.trim()) {
      newErrors.name = 'プラン名は必須です';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = '説明は必須です';
    }
    
    // 価格のチェック
    if (typeof formData.price !== 'number' || formData.price < 0) {
      newErrors.price = '価格は0以上の数値で入力してください';
    }
    
    setErrors(newErrors);
    
    // エラーがなければtrue、あればfalseを返す
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 保存処理
   */
  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {plan ? 'プランを編集' : '新しいプランを作成'}
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* 基本情報 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              基本情報
            </Typography>
          </Grid>
          
          {/* プラン名 */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="プラン名"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          
          {/* 表示順序 */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="表示順序"
              name="displayOrder"
              type="number"
              value={formData.displayOrder || 0}
              onChange={handleChange}
              fullWidth
              InputProps={{
                inputProps: { min: 0 }
              }}
            />
          </Grid>
          
          {/* 説明 */}
          <Grid item xs={12}>
            <TextField
              label="説明"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              required
              error={!!errors.description}
              helperText={errors.description}
            />
          </Grid>
          
          {/* 価格情報 */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              価格設定
            </Typography>
          </Grid>
          
          {/* 価格 */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="価格"
              name="price"
              type="number"
              value={formData.price || 0}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.price}
              helperText={errors.price}
              InputProps={{
                startAdornment: formData.currency === 'JPY' ? (
                  <InputAdornment position="start">¥</InputAdornment>
                ) : (
                  <InputAdornment position="start">$</InputAdornment>
                ),
                inputProps: { min: 0 }
              }}
            />
          </Grid>
          
          {/* 通貨 */}
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel id="currency-label">通貨</InputLabel>
              <Select
                labelId="currency-label"
                name="currency"
                value={formData.currency || 'JPY'}
                onChange={handleChange}
                label="通貨"
              >
                <MenuItem value="JPY">JPY (日本円)</MenuItem>
                <MenuItem value="USD">USD (米ドル)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* 請求間隔 */}
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel id="interval-label">請求間隔</InputLabel>
              <Select
                labelId="interval-label"
                name="interval"
                value={formData.interval || 'month'}
                onChange={handleChange}
                label="請求間隔"
              >
                <MenuItem value="month">月次</MenuItem>
                <MenuItem value="year">年次</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* 機能リスト */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              機能リスト
            </Typography>
            <FeatureListEditor
              features={formData.features || []}
              onChange={handleFeaturesChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          キャンセル
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          {plan ? '更新' : '作成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlanFormModal;