import React, { useState } from 'react';
import { Paper, Grid, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { OrganizationStatus } from '../../../shared/index';

interface OrganizationFilterProps {
  onFilterChange: (filters: {
    search: string;
    status: string;
    planId: string;
    sortBy: string;
  }) => void;
  plans: Array<{ _id: string; name: string }>;
}

const OrganizationFilter: React.FC<OrganizationFilterProps> = ({
  onFilterChange,
  plans = [],
}) => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    planId: 'all',
    sortBy: 'created_desc',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    const updatedFilters = {
      ...filters,
      [name as string]: value,
    };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    const updatedFilters = {
      ...filters,
      [name as string]: value,
    };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }} elevation={1}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            fullWidth
            name="search"
            placeholder="組織名で検索..."
            value={filters.search}
            onChange={handleChange}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="status-label">ステータス</InputLabel>
            <Select
              labelId="status-label"
              name="status"
              value={filters.status}
              label="ステータス"
              onChange={handleSelectChange}
            >
              <MenuItem value="all">すべて</MenuItem>
              <MenuItem value={OrganizationStatus.ACTIVE}>アクティブ</MenuItem>
              <MenuItem value={OrganizationStatus.TRIAL}>トライアル</MenuItem>
              <MenuItem value="payment_needed">支払い待ち</MenuItem>
              <MenuItem value={OrganizationStatus.SUSPENDED}>停止中</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="plan-label">プラン</InputLabel>
            <Select
              labelId="plan-label"
              name="planId"
              value={filters.planId}
              label="プラン"
              onChange={handleSelectChange}
            >
              <MenuItem value="all">すべて</MenuItem>
              {plans.map((plan) => (
                <MenuItem key={plan._id} value={plan._id}>
                  {plan.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="sort-label">並び順</InputLabel>
            <Select
              labelId="sort-label"
              name="sortBy"
              value={filters.sortBy}
              label="並び順"
              onChange={handleSelectChange}
            >
              <MenuItem value="created_desc">登録日（新しい順）</MenuItem>
              <MenuItem value="created_asc">登録日（古い順）</MenuItem>
              <MenuItem value="name_asc">組織名（昇順）</MenuItem>
              <MenuItem value="name_desc">組織名（降順）</MenuItem>
              <MenuItem value="users_desc">スタイリスト数（多い順）</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default OrganizationFilter;