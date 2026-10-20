import { useEffect, useState, type FormEvent } from 'react';
import PasswordField from '../components/PasswordField';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import LockResetIcon from '@mui/icons-material/LockReset';
import { brand } from '../theme/theme';
import EventOrganizerLogo from '../components/EventOrganizerLogo';
import PasswordChecklist from '../components/PasswordChecklist';
import VerificationCodeField from '../components/VerificationCodeField';
import { requestPasswordCode, resetPasswordWithCode, type CodeSent } from '../services/authService';
import { passwordError } from '../utils/people';

/**
 * Forgot password: (1) the email you sign in with → a 6-digit code is emailed,
 * (2) type the code and a new password. Same message whether or not the account exists.
 */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [sent, setSent] = useState<CodeSent | null>(null);
  const [sending, setSending] = useState(false);
  const [wait, setWait] = useState(0);
  const [code, setCode] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    if (!login.trim()) return setError('Enter the email you sign in with.');
    setSending(true);
    setError('');
    try {
      setSent(await requestPasswordCode({ login: login.trim() }));
      setCode('');
      setWait(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code.');
    } finally {
      setSending(false);
    }
  }

  async function reset(e: FormEvent) {
    e.preventDefault();
    const problem =
      (code.length !== 6 ? 'Type the 6-digit code from your email.' : null) ||
      passwordError(next) ||
      (next !== confirm ? 'The new passwords do not match.' : null);
    if (problem) return setError(problem);
    setSaving(true);
    setError('');
    try {
      await resetPasswordWithCode(login, code, next);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset the password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', px: 2, py: { xs: 3, sm: 6 } }}>
      <Box sx={{ maxWidth: 480, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <EventOrganizerLogo size="medium" showSubtitle />
        </Box>
        <Paper sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '20px' }} data-testid="forgot-password">
          <Typography variant="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LockResetIcon sx={{ color: brand.primary }} /> Reset your password
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          )}
          {done ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                Your password is changed. Sign in with your new password.
              </Alert>
              <Button variant="contained" onClick={() => navigate('/login', { replace: true })}>
                Go to sign in
              </Button>
            </>
          ) : !sent ? (
            <Box component="form" onSubmit={(e) => void sendCode(e)}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Enter the email you sign in with. We'll email you a 6-digit code to type on the next step.
              </Typography>
              <TextField
                label="Email address"
                type="email"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                fullWidth
                size="small"
                margin="dense"
                autoComplete="username"
                required
              />
              <Button type="submit" variant="contained" disabled={sending} sx={{ mt: 1 }}>
                {sending ? 'Sending…' : 'Email me a code'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={(e) => void reset(e)} autoComplete="off">
              <Alert severity="info" sx={{ mb: 1 }}>
                {sent.message || 'If an account uses that email, a 6-digit code is on its way.'}
                {sent.localCode ? ` (Local test mode, no email: the code is ${sent.localCode}.)` : ''}
              </Alert>
              <VerificationCodeField value={code} onChange={setCode} />
              <Button size="small" onClick={() => void sendCode()} disabled={sending || wait > 0} sx={{ mb: 0.5 }}>
                {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
              </Button>
              <PasswordField
                label="New password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                fullWidth
                size="small"
                margin="dense"
                autoComplete="new-password"
                required
              />
              <PasswordChecklist password={next} />
              <PasswordField
                label="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                fullWidth
                size="small"
                margin="dense"
                autoComplete="new-password"
                required
                error={Boolean(confirm) && confirm !== next}
                helperText={confirm && confirm !== next ? 'Does not match' : ' '}
              />
              <Button type="submit" variant="contained" disabled={saving || code.length !== 6 || !next || !confirm}>
                {saving ? 'Saving…' : 'Reset password'}
              </Button>
              <Button sx={{ ml: 1 }} onClick={() => setSent(null)} disabled={saving}>
                Use another email
              </Button>
            </Box>
          )}
        </Paper>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <Link component={RouterLink} to="/login">
            Back to sign in
          </Link>
          {' · '}
          <Typography component="span" variant="body2" color="text.secondary">
            No access to that email? Ask an AWS SBG-APC admin for a temporary password.
          </Typography>
        </Typography>
      </Box>
    </Box>
  );
}
