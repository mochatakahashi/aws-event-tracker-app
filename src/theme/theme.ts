import { createTheme } from '@mui/material/styles';

/**
 * Shared application theme. Uses an AWS-console-inspired blue palette with
 * semantic colors that map to event severity (info/warning/critical).
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0972d3', // AWS console blue
    },
    secondary: {
      main: '#232f3e', // AWS squid ink
    },
    info: {
      main: '#0972d3',
    },
    warning: {
      main: '#f89406',
    },
    error: {
      main: '#d13212', // maps to "critical" severity
    },
    success: {
      main: '#037f0c',
    },
    background: {
      default: '#f2f3f3',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily:
      '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 600 },
    h2: { fontSize: '1.5rem', fontWeight: 600 },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    button: { textTransform: 'none' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
});

export default theme;
