import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  Chip,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { brand } from '../theme/theme';
import { resetPasswordWithCode } from '../services/authService';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlEmail = searchParams.get('email') || '';
  const urlToken = searchParams.get('token') || searchParams.get('code') || '';

  const [email, setEmail] = useState(urlEmail);
  const [code, setCode] = useState(urlToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password requirement checklist
  const checks = useMemo(() => {
    return [
      { label: 'At least 6 characters', valid: newPassword.length >= 6 },
      { label: 'One uppercase letter (A–Z)', valid: /[A-Z]/.test(newPassword) },
      { label: 'One lowercase letter (a–z)', valid: /[a-z]/.test(newPassword) },
      { label: 'One number (0–9)', valid: /[0-9]/.test(newPassword) },
      { label: 'One special symbol (e.g. ! @ # $ %)', valid: /[^A-Za-z0-9\s]/.test(newPassword) },
    ];
  }, [newPassword]);

  const allChecksPassed = checks.every((c) => c.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const cleanCode = code.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!cleanCode) {
      setError('Please enter the 6-digit reset code from your email.');
      return;
    }
    if (!allChecksPassed) {
      setError('Please ensure your new password meets all the security requirements below.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordWithCode(cleanEmail, cleanCode, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: {
            message: 'Password successfully reset! You can now sign in with your new password.',
            prefilledEmail: cleanEmail,
          },
        });
      }, 2500);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please check your reset code or request a new one.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        background: `radial-gradient(circle at 10% 20%, rgba(123, 45, 142, 0.08) 0%, transparent 40%),
                     radial-gradient(circle at 90% 80%, rgba(168, 85, 200, 0.08) 0%, transparent 40%),
                     #F8F4FC`,
      }}
    >
      <Card
        elevation={0}
        sx={{
          maxWidth: 480,
          width: '100%',
          borderRadius: 4,
          border: '1px solid #E8D5F5',
          boxShadow: '0 12px 32px -8px rgba(123, 45, 142, 0.12)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #7B2D8E 0%, #A855C8 100%)',
            color: '#fff',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
            }}
          >
            <LockResetRoundedIcon sx={{ fontSize: 32, color: '#fff' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
            Reset Your Password
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Choose a new secure password for your AWS SBG-APC account
          </Typography>
        </Box>

        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          {success ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircleRoundedIcon sx={{ fontSize: 64, color: '#2e7d32', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: brand.textPrimary, mb: 1 }}>
                Password Reset Successful!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your password has been updated. Redirecting you to sign in...
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                fullWidth
                sx={{
                  py: 1.2,
                  bgcolor: brand.primary,
                  '&:hover': { bgcolor: brand.primaryDark },
                }}
              >
                Sign In Now
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} role="alert">
                  {error}
                </Alert>
              )}

              {urlToken && (
                <Chip
                  color="success"
                  size="small"
                  label="Reset link verified from email"
                  sx={{ mb: 2, fontWeight: 600 }}
                />
              )}

              <TextField
                label="Registered Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="dense"
                autoComplete="email"
                placeholder="you@student.apc.edu.ph"
                disabled={Boolean(urlEmail)}
                helperText={urlEmail ? 'Email locked from reset link' : ''}
                sx={{ mb: 2 }}
              />

              <TextField
                label="6-Digit Reset Code or Link Token"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                fullWidth
                margin="dense"
                placeholder="e.g. 849201"
                disabled={Boolean(urlToken)}
                helperText={urlToken ? 'Code verified from your email link' : 'Enter the 6-digit code received in your email'}
                sx={{ mb: 2.5 }}
              />

              <TextField
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                margin="dense"
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1.5 }}
              />

              {/* Password strength checklist */}
              <Box
                sx={{
                  bgcolor: 'rgba(123, 45, 142, 0.04)',
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid rgba(123, 45, 142, 0.1)',
                  mb: 2,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: brand.textSecondary, display: 'block', mb: 0.5 }}>
                  Password Requirements:
                </Typography>
                <Stack spacing={0.5}>
                  {checks.map((chk, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {chk.valid ? (
                        <CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
                      ) : (
                        <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: chk.valid ? '#2e7d32' : 'text.secondary',
                          fontWeight: chk.valid ? 600 : 400,
                        }}
                      >
                        {chk.label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <TextField
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                margin="dense"
                autoComplete="new-password"
                error={Boolean(confirmPassword && confirmPassword !== newPassword)}
                helperText={
                  confirmPassword && confirmPassword !== newPassword ? 'Passwords do not match.' : ''
                }
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={submitting}
                sx={{
                  py: 1.4,
                  fontSize: '1rem',
                  fontWeight: 600,
                  bgcolor: brand.primary,
                  '&:hover': { bgcolor: brand.primaryDark },
                }}
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {submitting ? 'Resetting Password…' : 'Save New Password'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  startIcon={<ArrowBackRoundedIcon />}
                  sx={{ color: brand.primary, textTransform: 'none', fontWeight: 600 }}
                >
                  Back to Sign In
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
