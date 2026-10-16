import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/theme';

interface LocationState {
  from?: { pathname: string };
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as LocationState)?.from?.pathname ?? '/home';

  function validate(): boolean {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) errors.username = 'Email is required.';
    if (!password) errors.password = 'Password is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({ username, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(180deg, ${brand.background} 0%, ${alpha(brand.secondary, 0.4)} 100%)`,
        p: 2,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 3,
          background: brand.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          boxShadow: `0 8px 30px ${alpha(brand.primary, 0.3)}`,
        }}
      >
        <BoltRoundedIcon sx={{ color: '#fff', fontSize: 36 }} />
      </Box>

      <Typography variant="h2" sx={{ mb: 3, fontWeight: 700 }}>
        Welcome back
      </Typography>

      <Paper
        elevation={3}
        sx={{ p: 3.5, width: '100%', maxWidth: 400 }}
        component="form"
        onSubmit={handleSubmit}
        noValidate
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {error}
          </Alert>
        )}

        <TextField
          label="Email address"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={Boolean(fieldErrors.username)}
          helperText={fieldErrors.username}
          fullWidth
          margin="normal"
          autoComplete="username"
          placeholder="you@student.apc.edu.ph"
          autoFocus
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password}
          fullWidth
          margin="normal"
          autoComplete="current-password"
        />

        <Box sx={{ textAlign: 'right', mt: 0.5, mb: 1 }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            sx={{ color: brand.primary, fontWeight: 500 }}
          >
            Forgot password?
          </Link>
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={submitting}
          sx={{ mt: 1, py: 1.4, fontSize: '1rem' }}
          startIcon={
            submitting ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </Button>

        <Typography
          variant="body2"
          sx={{ mt: 2.5, textAlign: 'center', color: brand.textSecondary }}
        >
          Don't have an account?{' '}
          <Link
            component={RouterLink}
            to="/signup"
            sx={{ color: brand.primary, fontWeight: 600 }}
          >
            Sign Up
          </Link>
        </Typography>
      </Paper>

      {/* Back to home */}
      <Link
        component={RouterLink}
        to="/"
        variant="body2"
        sx={{ mt: 3, color: brand.textSecondary }}
      >
        ← Back to home
      </Link>

      {/* Local development hint (never shown on the deployed app) */}
      {import.meta.env.DEV && import.meta.env.MODE !== 'test' && !import.meta.env.VITE_LOCAL_ADMIN_PASSWORD && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, maxWidth: 400, textAlign: 'center' }}>
          Local dev: to sign in as <strong>awsapc.admin</strong>, add <code>VITE_LOCAL_ADMIN_PASSWORD=…</code> to a{' '}
          <code>.env.local</code> file and restart <code>npm run dev</code>.
        </Typography>
      )}
    </Box>
  );
}
