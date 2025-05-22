import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { OrganizationStatus } from '../../../shared/index';

interface StatusBadgeProps {
  status: OrganizationStatus;
  trialDaysLeft?: number;
}

export const OrganizationStatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  trialDaysLeft
}) => {
  let color: ChipProps['color'] = 'default';
  let label = status;

  switch (status) {
    case OrganizationStatus.ACTIVE:
      color = 'success';
      label = 'アクティブ';
      break;
    case OrganizationStatus.TRIAL:
      color = 'warning';
      label = trialDaysLeft
        ? `トライアル (あと${trialDaysLeft}日)`
        : 'トライアル';
      break;
    case OrganizationStatus.SUSPENDED:
      color = 'error';
      label = '停止中';
      break;
    case OrganizationStatus.DELETED:
      color = 'default';
      label = '削除済み';
      break;
  }

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      sx={{
        fontWeight: 500,
        minWidth: '80px'
      }}
    />
  );
};

export default OrganizationStatusBadge;