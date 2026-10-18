import { useState, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../services/authService';
import { passwordError } from '../utils/people';
import PasswordChecklist from './PasswordChecklist';

/** Current + new + confirm password, with the live rules checklist. */
export default function ChangePasswordForm({
  currentLabel = 'Current password',
  onDone,
}: {
  currentLabel?: string;
  onDone?: () => void;
}) {
  const { user, setCurrentUser } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const problem = passwordError(next) || (next !== confirm ? 'The new passwords do not match.' : null);
    if (problem) {
      setMsg({ ok: false, text: problem });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await changePassword(user.personId, current, next);
      setCurrentUser({ ...user, mustChangePassword: false });
      setMsg({ ok: true, text: 'Password changed. Use your new password next time you sign in.' });
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

  return (
    <Box component="form" onSubmit={submit} sx={{ maxWidth: 420 }}>
      {msg && (
        <Alert severity={msg.ok ? 'success' : 'error'} sx={{ mb: 1 }}>
          {msg.text}
        </Alert>
      )}
      <TextField
        label={currentLabel}
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        fullWidth
        size="small"
        margin="dense"
        autoComplete="current-password"
        required
      />
      <TextField
        label="New password"
        type="password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        fullWidth
        size="small"
        margin="dense"
        autoComplete="new-password"
        required
      />
      <PasswordChecklist password={next} />
      <TextField
        label="Confirm new password"
        type="password"
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
      <Button type="submit" variant="contained" disabled={saving || !current || !next || !confirm} sx={{ mt: 0.5 }}>
        {saving ? 'Saving…' : 'Save new password'}
      </Button>
    </Box>
  );
}
