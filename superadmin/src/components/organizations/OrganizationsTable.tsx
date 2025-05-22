import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TableSortLabel,
  IconButton,
  Button,
  Typography,
  Box,
  Avatar,
  Tooltip,
  Pagination,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Organization } from '../../../shared/index';
import OrganizationStatusBadge from './OrganizationStatusBadge';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface OrganizationsTableProps {
  organizations: Organization[];
  onViewDetails: (organizationId: string) => void;
  onSelectOrganizations: (orgIds: string[]) => void;
  selectedOrganizationIds: string[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  loading?: boolean;
}

// トライアル日数計算関数
const calculateTrialDaysLeft = (trialEndDate: string | null): number | null => {
  if (!trialEndDate) return null;
  
  const end = new Date(trialEndDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

const OrganizationsTable: React.FC<OrganizationsTableProps> = ({
  organizations,
  onViewDetails,
  onSelectOrganizations,
  selectedOrganizationIds,
  pagination,
  onPageChange,
  onSort,
  sortBy = 'createdAt',
  sortDir = 'desc',
  loading = false,
}) => {
  // ヘッダーのチェックボックス状態管理
  const [selectAll, setSelectAll] = useState(false);

  // 選択処理
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    
    if (checked) {
      onSelectOrganizations(organizations.map(org => org._id));
    } else {
      onSelectOrganizations([]);
    }
  };

  const handleSelectOne = (orgId: string) => {
    const selectedIndex = selectedOrganizationIds.indexOf(orgId);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedOrganizationIds, orgId];
    } else {
      newSelected = selectedOrganizationIds.filter(id => id !== orgId);
    }

    onSelectOrganizations(newSelected);
  };

  // ページネーション処理
  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    onPageChange(page);
  };

  // ソート処理
  const handleSort = (field: string) => {
    const isAsc = sortBy === field && sortDir === 'asc';
    onSort(field, isAsc ? 'desc' : 'asc');
  };

  // ソート方向取得
  const getSortDirection = (field: string): 'asc' | 'desc' | false => {
    return sortBy === field ? (sortDir as 'asc' | 'desc') : false;
  };

  // カラム定義
  const columns = [
    { id: 'name', label: '組織名', sortable: true },
    { id: 'owner', label: '初期管理者', sortable: false },
    { id: 'plan', label: 'プラン', sortable: false },
    { id: 'userCount', label: 'スタイリスト数', sortable: true },
    { id: 'createdAt', label: '登録日', sortable: true },
    { id: 'status', label: 'ステータス', sortable: true },
    { id: 'actions', label: 'アクション', sortable: false },
  ];

  return (
    <>
      <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectAll}
                  onChange={handleSelectAll}
                  indeterminate={
                    selectedOrganizationIds.length > 0 &&
                    selectedOrganizationIds.length < organizations.length
                  }
                />
              </TableCell>
              <TableCell></TableCell>
              {columns.map((column) => (
                <TableCell key={column.id}>
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={getSortDirection(column.id) || 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">読み込み中...</Typography>
                </TableCell>
              </TableRow>
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">組織が見つかりません</Typography>
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => {
                const isSelected = selectedOrganizationIds.includes(org._id);
                const trialDaysLeft = org.subscription?.trialEndsAt
                  ? calculateTrialDaysLeft(org.subscription.trialEndsAt)
                  : null;

                return (
                  <TableRow
                    key={org._id}
                    selected={isSelected}
                    hover
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: '#f9fafe',
                      },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectOne(org._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Avatar
                        alt={org.name}
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          org.name
                        )}&background=random&size=48`}
                        sx={{ width: 40, height: 40 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {org.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {org.owner ? (
                        <Typography variant="body2">{org.owner.name}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          未設定
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {org.plan ? (
                        <Typography variant="body2">{org.plan.name}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          未設定
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{org.userCount}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(org.createdAt), 'yyyy/MM/dd', { locale: ja })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <OrganizationStatusBadge
                        status={org.status}
                        trialDaysLeft={trialDaysLeft || undefined}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" justifyContent="center">
                        <Tooltip title="詳細を表示">
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => onViewDetails(org._id)}
                            sx={{ fontSize: 12, py: 0.5, px: 1 }}
                          >
                            詳細
                          </Button>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ページネーション */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="body2" color="text.secondary">
          {pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1}-
          {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
        </Typography>
        <Pagination
          count={pagination.pages}
          page={pagination.page}
          onChange={handlePageChange}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>
    </>
  );
};

export default OrganizationsTable;