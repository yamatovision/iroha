import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  SelectChangeEvent
} from '@mui/material';
import { OrganizationStatus } from '../../../shared/index';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';

interface BulkActionPanelProps {
  selectedOrganizationIds: string[];
  onExecuteAction: (action: string, params: any) => Promise<void>;
  onClose: () => void;
}

const BulkActionPanel: React.FC<BulkActionPanelProps> = ({
  selectedOrganizationIds,
  onExecuteAction,
  onClose,
}) => {
  const [action, setAction] = useState('');
  const [status, setStatus] = useState(OrganizationStatus.ACTIVE);
  const [trialDays, setTrialDays] = useState(14);
  const [reason, setReason] = useState('');
  const [notifyOwners, setNotifyOwners] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleActionChange = (event: SelectChangeEvent) => {
    setAction(event.target.value);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatus(event.target.value as OrganizationStatus);
  };

  const handleTrialDaysChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTrialDays(Number(event.target.value));
  };

  const handleReasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReason(event.target.value);
  };

  const handleNotifyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotifyOwners(event.target.checked);
  };

  const handleExecute = () => {
    setConfirmOpen(true);
  };

  const handleConfirmExecute = async () => {
    setConfirmOpen(false);
    setIsLoading(true);
    
    try {
      if (action === 'activate' || action === 'suspend') {
        await onExecuteAction('updateStatus', {
          organizationIds: selectedOrganizationIds,
          status: action === 'activate' ? OrganizationStatus.ACTIVE : OrganizationStatus.SUSPENDED,
          reason,
          notifyOwners
        });
      } else if (action === 'extend_trial') {
        await onExecuteAction('extendTrial', {
          organizationIds: selectedOrganizationIds,
          days: trialDays,
          reason,
          notifyOwners
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getActionText = () => {
    switch (action) {
      case 'activate':
        return '有効化';
      case 'suspend':
        return '一時停止';
      case 'extend_trial':
        return `トライアル延長 (${trialDays}日)`;
      default:
        return '操作';
    }
  };

  const getConfirmMessage = () => {
    const orgCount = selectedOrganizationIds.length;
    
    switch (action) {
      case 'activate':
        return `選択した ${orgCount} 件の組織を有効化します。よろしいですか？`;
      case 'suspend':
        return `選択した ${orgCount} 件の組織を一時停止します。この操作によりユーザーは一時的にサービスを利用できなくなります。よろしいですか？`;
      case 'extend_trial':
        return `選択した ${orgCount} 件の組織のトライアル期間を ${trialDays} 日間延長します。よろしいですか？`;
      default:
        return `選択した ${orgCount} 件の組織に対して操作を実行します。よろしいですか？`;
    }
  };

  const isExecuteDisabled = !action || 
    (action === 'extend_trial' && (!trialDays || trialDays <= 0));

  return (
    <>
      <Paper 
        sx={{ 
          p: 2, 
          mb: 2, 
          borderRadius: 2,
          backgroundColor: "#f9fafe"
        }} 
        elevation={1}
      >
        <Typography 
          variant="subtitle2" 
          color="primary" 
          sx={{ 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center' 
          }}
        >
          <PlaylistAddCheckIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          一括操作 ({selectedOrganizationIds.length}件選択中)
        </Typography>
        
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>操作を選択</InputLabel>
              <Select
                value={action}
                onChange={handleActionChange}
                label="操作を選択"
              >
                <MenuItem value="">操作を選択...</MenuItem>
                <MenuItem value="activate">有効化</MenuItem>
                <MenuItem value="suspend">一時停止</MenuItem>
                <MenuItem value="extend_trial">トライアル延長</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {action === 'extend_trial' && (
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="日数"
                type="number"
                fullWidth
                value={trialDays}
                onChange={handleTrialDaysChange}
                size="small"
                inputProps={{ min: 1, max: 90 }}
              />
            </Grid>
          )}
          
          <Grid item xs={12} sm={6} md={action === 'extend_trial' ? 2 : 4}>
            <TextField
              label="理由 (任意)"
              fullWidth
              value={reason}
              onChange={handleReasonChange}
              size="small"
              placeholder="操作の理由を入力..."
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<PlayArrowIcon />}
              onClick={handleExecute}
              disabled={isExecuteDisabled || isLoading}
            >
              実行
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              startIcon={<CloseIcon />}
              onClick={onClose}
            >
              閉じる
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 確認ダイアログ */}
      <Dialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>
          {getActionText()}の確認
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {getConfirmMessage()}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={handleConfirmExecute} 
            color="primary" 
            variant="contained"
            autoFocus
          >
            実行する
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkActionPanel;