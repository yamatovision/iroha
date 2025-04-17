import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Box, Typography } from '@mui/material';

interface Team {
  id: string;
  name: string;
}

interface TeamSelectorDropdownProps {
  teams: Team[];
  selectedTeamId: string | null;
  onChange: (teamId: string | null) => void;
  label?: string;
  disabled?: boolean;
}

const TeamSelectorDropdown: React.FC<TeamSelectorDropdownProps> = ({
  teams,
  selectedTeamId,
  onChange,
  label = 'チーム選択',
  disabled = false
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onChange(value === 'null' ? null : value);
  };

  // チーム選択肢がない場合
  if (!teams || teams.length === 0) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          所属チームがありません
        </Typography>
      </Box>
    );
  }

  return (
    <FormControl 
      fullWidth 
      variant="outlined" 
      sx={{ mb: 2, maxWidth: 300 }}
      size="small"
      disabled={disabled}
    >
      <InputLabel id="team-selector-label">{label}</InputLabel>
      <Select
        labelId="team-selector-label"
        id="team-selector"
        value={selectedTeamId || 'null'}
        onChange={handleChange}
        label={label}
      >
        <MenuItem value="null">個人運勢</MenuItem>
        {teams.map((team) => (
          <MenuItem key={team.id} value={team.id}>
            {team.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TeamSelectorDropdown;