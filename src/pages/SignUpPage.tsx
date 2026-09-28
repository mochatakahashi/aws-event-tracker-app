import { useState, type FormEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import GoogleIcon from '@mui/icons-material/Google';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';

export default function SignUpPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Mock signup — in production this would call a backend
    setSuccess(true);
    setTimeout(() => {
      navigate('/login');
    }, 2000);
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

      <Typography variant="h2" sx={{ mb: 0.5, fontWeight: 700 }}>
        Create Account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Join AWS SBG-APC Event Tracker
      </Typography>

      <Paper
        elevation={3}
        sx={{ p: 3.5, width: '100%', maxWidth: 400 }}
        component="form"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Google sign-up */}
        <Button
          variant="outlined"
          fullWidth
          startIcon={<GoogleIcon />}
          sx={{
            py: 1.3,
            borderColor: alpha(brand.textSecondary, 0.3),
            color: brand.textPrimary,
            fontWeight: 500,
            '&:hover': {
              borderColor: brand.primary,
              backgroundColor: alpha(brand.primary, 0.03),
            },
          }}
        >
          Continue with Google
        </Button>

        <Divider sx={{ my: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            or
          </Typography>
        </Divider>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Account created! Redirecting to login…
          </Alert>
        )}

        <TextField
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
          required
          autoFocus
        />
        <TextField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Student ID (optional)"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          fullWidth
          margin="normal"
          placeholder="e.g. APC-2024-001"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          required
          helperText="At least 6 characters"
        />
        <TextField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          margin="normal"
          required
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={success}
          sx={{ mt: 2, py: 1.4, fontSize: '1rem' }}
        >
          Create Account
        </Button>

        <Typography
          variant="body2"
          sx={{ mt: 2.5, textAlign: 'center', color: brand.textSecondary }}
        >
          Already have an account?{' '}
          <Link
            component={RouterLink}
            to="/login"
            sx={{ color: brand.primary, fontWeight: 600 }}
          >
            Sign In
          </Link>
        </Typography>
      </Paper>

      <Link
        component={RouterLink}
        to="/"
        variant="body2"
        sx={{ mt: 3, color: brand.textSecondary }}
      >
        ← Back to home
      </Link>
    </Box>
  );
}
