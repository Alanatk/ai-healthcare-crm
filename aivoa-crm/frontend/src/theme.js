import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main: '#0D9488', // Teal
      light: '#2DD4BF',
      dark: '#0F766E',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6366F1', // Indigo
      light: '#818CF8',
      dark: '#4F46E5',
      contrastText: '#ffffff',
    },
    background: {
      default: mode === 'dark' ? '#0B0F19' : '#F8FAFC',
      paper: mode === 'dark' ? '#111827' : '#ffffff',
      gradient: mode === 'dark' 
        ? 'linear-gradient(135deg, #0B0F19 0%, #111827 100%)'
        : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
    },
    text: {
      primary: mode === 'dark' ? '#F3F4F6' : '#1F2937',
      secondary: mode === 'dark' ? '#9CA3AF' : '#4B5563',
    },
    divider: mode === 'dark' ? '#1F2937' : '#E5E7EB',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2.5rem',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 20px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.15)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: mode === 'dark' 
            ? '0 10px 30px -10px rgba(0, 0, 0, 0.7)' 
            : '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0D9488',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '2px',
          },
        },
      },
    },
  },
});

export const getTheme = (mode) => createTheme(getDesignTokens(mode));
export default getTheme;
