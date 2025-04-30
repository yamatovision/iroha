import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingIndicatorProps {
  message?: string;
}

/**
 * ローディング表示コンポーネント
 */
const LoadingIndicator = ({ message = 'ロード中...' }: LoadingIndicatorProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3,
        bgcolor: 'background.default'
      }}
    >
      <CircularProgress size={48} color="primary" />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mt: 2, textAlign: 'center' }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingIndicator;