import { createTheme } from '@mui/material/styles';

// 美姫命用テーマの作成
const beautyTheme = createTheme({
  palette: {
    primary: {
      main: '#FF6B98',
      light: '#FFC0D0',
      dark: '#CF4570',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#673AB7', // スーパー管理者向けの紫色
      light: '#D1C4E9',
      dark: '#512DA8',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    error: {
      main: '#F44336',
    },
    warning: {
      main: '#FFC107',
    },
    info: {
      main: '#90CAF9',
    },
    success: {
      main: '#66BB6A',
    },
    text: {
      primary: '#424242',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Roboto", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 400,
    },
    subtitle2: {
      fontWeight: 400,
    },
    body1: {
      fontWeight: 400,
    },
    body2: {
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        containedPrimary: {
          boxShadow: '0 2px 4px rgba(255, 107, 152, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(255, 107, 152, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          '&.Mui-selected': {
            color: '#FF6B98',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#FF6B98',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 500,
          backgroundColor: '#FAFAFA',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
        elevation2: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#FFC0D0',
        },
        barColorPrimary: {
          backgroundColor: '#FF6B98',
        },
      },
    },
  },
});

export default beautyTheme;