import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Stack,
  IconButton,
  InputAdornment,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { brand } from '../theme/theme';
import { forgotPassword, resetPasswordWithCode } from '../services/authService';
import VerificationCodeField from './VerificationCodeField';

interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess: (email: string, message: string) => void;
}

export default function ForgotPasswordDialog({
  open,
  onClose,
  initialEmail = '',
  onSuccess,
}: ForgotPasswordDialogProps) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (open) {
      if (initialEmail && !email) setEmail(initialEmail);
      setError('');
      setInfo('');
    } else {
      // Reset state when closed
      setTimeout(() => {
        setStep('request');
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setInfo('');
      }, 300);
    }
  }, [open, initialEmail]);

  // Password requirements
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

  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await forgotPassword(cleanEmail);
      // The person types the code from the email: never filled in here
      setInfo(`${res.message}${res.localCode ? ` (Local test mode, no email: the code is ${res.localCode}.)` : ''}`);
      setCode('');
      setStep('reset');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset code. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanCode = code.trim();

    if (!cleanEmail) {
      setError('Email address is missing.');
      return;
    }
    if (!cleanCode) {
      setError('Please enter the 6-digit code received in your email.');
      return;
    }
    if (!allChecksPassed) {
      setError('Your new password must meet all security requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-type.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await resetPasswordWithCode(cleanEmail, cleanCode, newPassword);
      onSuccess(cleanEmail, 'Your password is changed. Sign in with your new password.');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please check your reset code or request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: { xs: 1, sm: 2 },
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.16)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(123, 45, 142, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: brand.primary,
            }}
          >
            {step === 'request' ? <LockResetRoundedIcon /> : <MarkEmailReadRoundedIcon />}
          </Box>
          <DialogTitle sx={{ p: 0, fontWeight: 700, fontSize: '1.2rem', color: brand.textPrimary }}>
            {step === 'request' ? 'Forgot Password?' : 'Enter Reset Code'}
          </DialogTitle>
        </Box>
        <IconButton onClick={onClose} disabled={loading} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 2, pt: 1.5, pb: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} role="alert">
            {error}
          </Alert>
        )}

        {info && step === 'reset' && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            {info}
          </Alert>
        )}

        {step === 'request' ? (
          <Box component="form" onSubmit={handleRequestCode} noValidate>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5 }}>
              Enter your registered email address (e.g. your <strong>@student.apc.edu.ph</strong> or personal email).
              We'll email you a 6-digit code to type on the next step.
            </Typography>

            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              autoFocus
              placeholder="you@student.apc.edu.ph"
              disabled={loading}
              sx={{ mb: 1 }}
            />
          </Box>
        ) : (
          <Box component="form" onSubmit={handleResetPassword} noValidate>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
              If an account uses <strong>{email}</strong>, we sent it a 6-digit code. Check your inbox and spam folder.
            </Typography>

            <VerificationCodeField value={code} onChange={setCode} />

            <TextField
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              margin="dense"
              disabled={loading}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1.5 }}
            />

            {/* Checklist */}
            <Box
              sx={{
                bgcolor: 'rgba(123, 45, 142, 0.04)',
                p: 1.25,
                borderRadius: 2,
                border: '1px solid rgba(123, 45, 142, 0.1)',
                mb: 1.5,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: brand.textSecondary, display: 'block', mb: 0.5 }}>
                Password Requirements:
              </Typography>
              <Stack spacing={0.3}>
                {checks.map((chk, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {chk.valid ? (
                      <CheckCircleRoundedIcon sx={{ fontSize: 14, color: '#2e7d32' }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color: chk.valid ? '#2e7d32' : 'text.secondary',
                        fontWeight: chk.valid ? 600 : 400,
                        fontSize: '0.75rem',
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
              disabled={loading}
              autoComplete="new-password"
              error={Boolean(confirmPassword && confirmPassword !== newPassword)}
              helperText={confirmPassword && confirmPassword !== newPassword ? 'Passwords do not match.' : ''}
              sx={{ mb: 1 }}
            />

            <Box sx={{ mt: 1, textAlign: 'right' }}>
              <Button
                size="small"
                onClick={() => handleRequestCode()}
                disabled={loading}
                sx={{ textTransform: 'none', color: brand.primary, fontSize: '0.8rem' }}
              >
                Didn't get the code? Resend email
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2, pt: 1 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        {step === 'request' ? (
          <Button
            onClick={() => handleRequestCode()}
            variant="contained"
            disabled={loading || !email.trim()}
            sx={{
              bgcolor: brand.primary,
              '&:hover': { bgcolor: brand.primaryDark },
              px: 3,
            }}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading ? 'Sending Code…' : 'Send Reset Code'}
          </Button>
        ) : (
          <Button
            onClick={handleResetPassword}
            variant="contained"
            disabled={loading || !code.trim() || !newPassword || !allChecksPassed}
            sx={{
              bgcolor: brand.primary,
              '&:hover': { bgcolor: brand.primaryDark },
              px: 3,
            }}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
