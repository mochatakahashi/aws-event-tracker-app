import { createTheme, alpha } from '@mui/material/styles';

/**
 * AWS SBG-APC Event Tracker theme.
 * Purple/violet palette inspired by the AWS Student Builder Group – Asia Pacific College logo.
 */

// ─── Design Tokens ───────────────────────────────────────────────────────────
export const brand = {
  primary: '#7B2D8E',
  primaryLight: '#A855C8',
  primaryDark: '#4A1259',
  primaryDarker: '#2D0A3E',
  secondary: '#E8D5F5',
  accent: '#C084FC',
  background: '#F8F4FC',
  surface: '#FFFFFF',
  textPrimary: '#1A0A2E',
  textSecondary: '#6B5B7B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  gradient: 'linear-gradient(135deg, #7B2D8E 0%, #A855C8 50%, #C084FC 100%)',
  gradientDark: 'linear-gradient(135deg, #2D0A3E 0%, #4A1259 50%, #7B2D8E 100%)',
  gradientSubtle: 'linear-gradient(135deg, #F8F4FC 0%, #E8D5F5 100%)',
} as const;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand.primary,
      light: brand.primaryLight,
      dark: brand.primaryDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brand.secondary,
      dark: '#C9A6E0',
      contrastText: brand.textPrimary,
    },
    info: {
      main: brand.primary,
    },
    warning: {
      main: brand.warning,
    },
    error: {
      main: brand.error,
    },
    success: {
      main: brand.success,
    },
    background: {
      default: brand.background,
      paper: brand.surface,
    },
    text: {
      primary: brand.textPrimary,
      secondary: brand.textSecondary,
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    h4: { fontSize: '1.1rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600 },
    caption: { fontSize: '0.75rem', color: brand.textSecondary },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha(brand.primary, 0.3)} transparent`,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.95rem',
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          background: brand.gradient,
          '&:hover': {
            background: brand.gradientDark,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 20px ${alpha(brand.primary, 0.4)}`,
          },
        },
        outlined: {
          borderColor: brand.primary,
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            backgroundColor: alpha(brand.primary, 0.05),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 15,
          border: `1px solid ${alpha(brand.primary, 0.08)}`,
          transition: 'all 0.25s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 30px ${alpha(brand.primary, 0.12)}`,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 15,
        },
        elevation1: {
          boxShadow: `0 2px 12px ${alpha(brand.primary, 0.06)}`,
        },
        elevation3: {
          boxShadow: `0 4px 24px ${alpha(brand.primary, 0.1)}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: brand.primary,
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: brand.gradientDark,
          boxShadow: `0 2px 20px ${alpha(brand.primaryDarker, 0.3)}`,
          borderRadius: 0,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: brand.surface,
          borderTop: `1px solid ${alpha(brand.primary, 0.1)}`,
          height: 64,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: brand.textSecondary,
          '&.Mui-selected': {
            color: brand.primary,
          },
          minWidth: 'auto',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          background: brand.gradient,
          fontWeight: 600,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: alpha(brand.primary, 0.1),
            color: brand.primary,
            '&:hover': {
              backgroundColor: alpha(brand.primary, 0.15),
            },
            '& .MuiListItemIcon-root': {
              color: brand.primary,
            },
          },
        },
      },
    },
  },
});

export default theme;
