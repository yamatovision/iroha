import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

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
 * プランカードのProps
 */
interface PlanCardProps {
  plan: Plan;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

/**
 * プランカードコンポーネント
 * 個々のプランの詳細を表示し、編集・削除・アクティブ化などの操作を提供します
 */
const PlanCard: React.FC<PlanCardProps> = ({ plan, onEdit, onDelete, onToggleActive }) => {
  // 削除確認ダイアログの状態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  /**
   * 削除確認ダイアログを開く
   */
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  /**
   * 削除確認ダイアログを閉じる
   */
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  /**
   * 削除を確定して実行
   */
  const handleConfirmDelete = () => {
    setDeleteDialogOpen(false);
    onDelete();
  };

  /**
   * 価格をフォーマット
   */
  const formatPrice = (price: number, currency: string, interval: string) => {
    const formatter = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency || 'JPY',
      minimumFractionDigits: 0
    });
    
    return `${formatter.format(price)}/${interval === 'month' ? '月' : '年'}`;
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: plan.isActive ? 1 : 0.7,
        transition: 'all 0.3s ease'
      }}
    >
      {/* アクティブ状態表示 */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 12, 
          right: 12,
        }}
      >
        <Chip
          label={plan.isActive ? 'アクティブ' : '非アクティブ'}
          color={plan.isActive ? 'success' : 'default'}
          size="small"
        />
      </Box>

      {/* プラン名と価格 */}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography 
          variant="h5" 
          component="h3" 
          gutterBottom
          sx={{ fontWeight: 600, mb: 1 }}
        >
          {plan.name}
        </Typography>

        <Typography 
          variant="h4" 
          color="primary" 
          sx={{ mb: 2, fontWeight: 500 }}
        >
          {formatPrice(plan.price, plan.currency, plan.interval)}
        </Typography>

        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 3 }}
        >
          {plan.description}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* 機能リスト */}
        <List dense disablePadding>
          {plan.features.map((feature, index) => (
            <ListItem key={index} disablePadding sx={{ mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={feature} />
            </ListItem>
          ))}
        </List>
      </CardContent>

      {/* アクション */}
      <CardActions sx={{ justifyContent: 'space-between', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box>
          <IconButton 
            color="primary" 
            aria-label="編集" 
            onClick={onEdit}
            title="プランを編集"
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            color="error" 
            aria-label="削除" 
            onClick={handleOpenDeleteDialog}
            title="プランを削除"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
        <IconButton 
          color={plan.isActive ? 'success' : 'default'}
          aria-label={plan.isActive ? 'プランを無効化' : 'プランを有効化'}
          onClick={onToggleActive}
          title={plan.isActive ? 'プランを無効化' : 'プランを有効化'}
        >
          {plan.isActive ? <ToggleOnIcon fontSize="large" /> : <ToggleOffIcon fontSize="large" />}
        </IconButton>
      </CardActions>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>
          プランの削除を確認
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            プラン「{plan.name}」を削除してもよろしいですか？
            現在このプランを利用している組織がある場合、削除できません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            キャンセル
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default PlanCard;