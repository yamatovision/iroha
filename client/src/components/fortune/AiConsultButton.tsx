import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AiConsultButton: React.FC = () => {
  const navigate = useNavigate();

  const handleConsult = () => {
    navigate('/chat');
  };

  return (
    <Box
      sx={{
        mt: 4,
        textAlign: 'center',
        mb: 4
      }}
    >
      <Button
        variant="contained"
        color="primary"
        onClick={handleConsult}
        className="pulse"
        sx={{
          py: 1.5,
          px: 3,
          borderRadius: '30px',
          fontSize: '1rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          boxShadow: '0 4px 16px rgba(106, 27, 154, 0.25)',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 8px 24px rgba(106, 27, 154, 0.35)'
          }
        }}
      >
        <Box
          component="span"
          className="material-icons"
          sx={{
            fontSize: '1.3rem',
            mr: 1
          }}
        >
          psychology
        </Box>
        AIアシスタントに相談する
      </Button>
      <Typography
        variant="caption"
        component="p"
        sx={{
          mt: 1.5,
          color: 'text.secondary',
          maxWidth: '400px',
          mx: 'auto'
        }}
      >
        今日の五行エネルギーをどう活かすか、AIがパーソナライズされたアドバイスを提供します
      </Typography>
    </Box>
  );
};

export default AiConsultButton;