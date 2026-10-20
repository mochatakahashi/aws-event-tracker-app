import { useEffect, useState, type FormEvent } from 'react';
import PasswordField from './PasswordField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import { useAuth } from '../context/AuthContext';
import { changePassword, requestPasswordCode, type CodeSent } from '../services/authService';
import { passwordError } from '../utils/people';
import PasswordChecklist from './PasswordChecklist';
import VerificationCodeField from './VerificationCodeField';

/**
 * Change your password in two steps: (1) email me a code, (2) the code, the
 * current password and the new one. The code has to be typed in.
 */
export default function ChangePasswordForm({
  currentLabel = 'Current password',
  onDone,
}: {
  currentLabel?: string;
  onDone?: () => void;
}) {
  const { user, setCurrentUser } = useAuth();
  const [sent, setSent] = useState<CodeSent | null>(null);
  const [sending, setSending] = useState(false);
  const [wait, setWait] = useState(0);
  const [code, setCode] = useState('');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // "Send again" waits a minute
  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  async function sendCode() {
    if (!user) return;
    setSending(true);
    setMsg(null);
    try {
      const res = await requestPasswordCode({ personId: user.personId });
      setSent(res);
      setCode('');
      setWait(60);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not send the code.' });
    } finally {
      setSending(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const problem =
      (code.length !== 6 ? 'Type the 6-digit code from your email.' : null) ||
      passwordError(next) ||
      (next !== confirm ? 'The new passwords do not match.' : null);
    if (problem) {
      setMsg({ ok: false, text: problem });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await changePassword(user.personId, current, next, code);
      setCurrentUser({ ...user, mustChangePassword: false });
      setMsg({ ok: true, text: 'Password changed. Use your new password next time you sign in.' });
      setSent(null);
      setCode('');
      setCurrent('');
      setNext('');
      setConfirm('');
      onDone?.();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not change the password.' });
    } finally {
      setSaving(false);
    }
  }

  if (!sent) {
    return (
      <Box sx={{ maxWidth: 420 }} data-testid="password-step-code">
        {msg && (
          <Alert severity={msg.ok ? 'success' : 'error'} sx={{ mb: 1 }}>
            {msg.text}
          </Alert>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          For your security, we'll email you a 6-digit code first. You'll type it here with your {currentLabel.toLowerCase()} and your new password.
        </Typography>
        <Button variant="contained" startIcon={<MarkEmailReadRoundedIcon />} onClick={() => void sendCode()} disabled={sending}>
          {sending ? 'Sending…' : 'Email me a code'}
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={submit} sx={{ maxWidth: 420 }} autoComplete="off" data-testid="password-step-change">
      {msg && (
        <Alert severity={msg.ok ? 'success' : 'error'} sx={{ mb: 1 }}>
          {msg.text}
        </Alert>
      )}
      <Alert severity="info" sx={{ mb: 1 }}>
        {sent.to?.length ? `We sent a code to ${sent.to.join(' and ')}.` : 'We sent a code to your email.'}
        {sent.localCode ? ` (Local test mode, no email: the code is ${sent.localCode}.)` : ''}
      </Alert>
      <VerificationCodeField value={code} onChange={setCode} />
      <Button size="small" onClick={() => void sendCode()} disabled={sending || wait > 0} sx={{ mb: 0.5 }}>
        {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
      </Button>
      <PasswordField
        label={currentLabel}
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        fullWidth
        size="small"
        margin="dense"
        autoComplete="current-password"
        required
      />
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
      <Button type="submit" variant="contained" disabled={saving || code.length !== 6 || !current || !next || !confirm} sx={{ mt: 0.5 }}>
        {saving ? 'Saving…' : 'Save new password'}
      </Button>
    </Box>
  );
}
