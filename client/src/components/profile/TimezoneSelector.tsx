import React from 'react';
import { Autocomplete, TextField, Box, Typography, Tooltip } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';

// 主要タイムゾーンのリスト
const TIMEZONES = [
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Bangkok',
  'Asia/Ho_Chi_Minh',
  'Asia/Jakarta',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/Moscow',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland'
];

interface TimezoneSelectorProps {
  value: string | null;
  onChange: (timezone: string | null) => void;
  error?: string;
}

const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({ value, onChange, error }) => {
  return (
    <Box>
      <Autocomplete
        options={TIMEZONES}
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        freeSolo
        renderInput={(params) => (
          <TextField
            {...params}
            label="タイムゾーン"
            error={!!error}
            helperText={error || "タイムゾーンを選択（例: Asia/Tokyo）"}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <PublicIcon color="action" sx={{ ml: 0.5, mr: -0.5 }} />
              ),
            }}
          />
        )}
      />
      {value && (
        <Tooltip title="タイムゾーンは四柱推命の計算に影響します。正確なタイムゾーンを選択することで、より精密な結果が得られます。">
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              mt: 1, 
              display: 'block',
              fontSize: '0.7rem',
              fontStyle: 'italic',
              cursor: 'help'
            }}
          >
            選択中: {value}
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
};

export default TimezoneSelector;