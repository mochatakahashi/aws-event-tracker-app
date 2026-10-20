import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import type { FixField, User } from '../types/auth';
import { requestFix, updateUser } from '../services/authService';
import { notifyInApp } from '../services/notificationService';
import { notifyQuietly } from '../services/notifyService';
import { FIX_FIELD_LABELS, STUDENT_ID_ERROR, isValidStudentId } from '../utils/people';
import StudentIdField from './StudentIdField';

const isOutside = (u: User) => (u.memberType ?? (u.signupType === 'outside' ? 'outside' : 'apc')) === 'outside';

/** Admin: correct someone's name, student ID / organization and emails directly. */
export function EditAccountDialog({
  user,
  actorId,
  onClose,
  onSaved,
}: {
  user: User | null;
  actorId: string;
  onClose: () => void;
  onSaved: (u: User) => void;
}) {
  const [f, setF] = useState({ firstName: '', middleInitial: '', lastName: '', studentId: '', organization: '', email: '', personalEmail: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const parts = (user.name || '').split(' ');
    setF({
      firstName: user.firstName ?? parts[0] ?? '',
      middleInitial: user.middleInitial ?? '',
      lastName: user.lastName ?? parts.slice(1).join(' '),
      studentId: user.studentId ?? '',
      organization: user.organization ?? '',
      email: user.email ?? '',
      personalEmail: user.personalEmail ?? '',
    });
    setError('');
  }, [user]);

  if (!user) return null;
  const outside = isOutside(user);

  async function save() {
    if (!user) return;
    setError('');
    const changes: Parameters<typeof updateUser>[1] = {};
    const put = <K extends keyof typeof f>(k: K, target: keyof User = k as keyof User) => {
      const v = f[k].trim();
      if (v !== String(user[target] ?? '')) (changes as Record<string, string>)[target] = v;
    };
    put('firstName');
    put('middleInitial');
    put('lastName');
    put('email');
    put('personalEmail');
    if (outside) put('organization');
    else {
      put('studentId');
      if ('studentId' in changes && !isValidStudentId(f.studentId)) {
        setError(STUDENT_ID_ERROR);
        return;
      }
    }
    if (!Object.keys(changes).length) {
      onClose();
      return;
    }
    setBusy(true);
    try {
      onSaved(await updateUser(user.personId, changes, actorId));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="edit-account-title">
      <DialogTitle id="edit-account-title" sx={{ textTransform: 'none', letterSpacing: 0, fontWeight: 800 }}>
        Edit details: {user.name}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5} data-testid="edit-account-form">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField size="small" label="First name" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} fullWidth />
            <TextField size="small" label="M.I." value={f.middleInitial} onChange={(e) => setF({ ...f, middleInitial: e.target.value })} sx={{ maxWidth: { sm: 80 } }} inputProps={{ maxLength: 2 }} />
            <TextField size="small" label="Last name" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} fullWidth />
          </Stack>
          {outside ? (
            <TextField size="small" label="School / organization" value={f.organization} onChange={(e) => setF({ ...f, organization: e.target.value })} />
          ) : (
            <StudentIdField size="small" label="Student ID" value={f.studentId} onChange={(v) => setF({ ...f, studentId: v })} />
          )}
          <TextField
            size="small"
            label="Email (used to sign in)"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            helperText={f.email.trim().toLowerCase() !== (user.email ?? '').toLowerCase() ? 'They will sign in with the new email.' : ' '}
          />
          <TextField size="small" label="Personal email (optional)" value={f.personalEmail} onChange={(e) => setF({ ...f, personalEmail: e.target.value })} />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void save()} disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Admin: ask the person to fix details themselves (notification + email + a banner until they do). */
export function FixRequestDialog({
  user,
  actorId,
  onClose,
  onSaved,
}: {
  user: User | null;
  actorId: string;
  onClose: () => void;
  onSaved: (u: User, note: string) => void;
}) {
  const [fields, setFields] = useState<FixField[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setFields(user.fixRequest?.fields ?? (!isOutside(user) && !isValidStudentId(user.studentId) ? ['studentId'] : []));
    setNote(user.fixRequest?.note ?? '');
    setError('');
  }, [user]);

  if (!user) return null;
  const options: FixField[] = isOutside(user)
    ? ['name', 'organization', 'personalEmail', 'photo', 'other']
    : ['name', 'studentId', 'personalEmail', 'photo', 'other'];

  async function send(cancel = false) {
    if (!user) return;
    if (!cancel && fields.length === 0) {
      setError('Tick at least one thing to fix.');
      return;
    }
    if (!cancel && fields.includes('other') && !note.trim()) {
      setError('Say what else needs fixing in the note.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const updated = await requestFix(user.personId, cancel ? [] : fields, note, actorId);
      let mailNote = '';
      if (!cancel) {
        const list = fields.map((x) => FIX_FIELD_LABELS[x]).join(', ');
        void notifyInApp({
          personIds: [user.personId],
          kind: 'profile-fix',
          title: 'Please update your profile',
          message: `An admin asked you to fix: ${list}.${note.trim() ? ` Note: ${note.trim()}` : ''}`,
          link: '/profile?edit=1',
        });
        mailNote = (await notifyQuietly({ type: 'fix-request', personId: user.personId })) || '';
      }
      onSaved(updated, mailNote);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="fix-request-title">
      <DialogTitle id="fix-request-title" sx={{ textTransform: 'none', letterSpacing: 0, fontWeight: 800 }}>
        Ask {user.firstName || user.name} to fix their profile
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          They get a notification and an email, and see a reminder at the top of the app until they save the fixes. Their
          account keeps working.
        </Typography>
        <Stack data-testid="fix-request-form">
          {options.map((o) => (
            <FormControlLabel
              key={o}
              control={
                <Checkbox
                  size="small"
                  checked={fields.includes(o)}
                  onChange={() => setFields((cur) => (cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]))}
                />
              }
              label={
                o === 'studentId' && !isValidStudentId(user.studentId)
                  ? `${FIX_FIELD_LABELS[o]} (now "${user.studentId || 'empty'}", should look like 2026-140242)`
                  : FIX_FIELD_LABELS[o]
              }
            />
          ))}
          <TextField
            size="small"
            label="Note (optional)"
            placeholder="e.g. Please use your full last name as on your school ID."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
            inputProps={{ maxLength: 500 }}
            sx={{ mt: 1 }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {user.fixRequest && (
          <Button color="inherit" onClick={() => void send(true)} disabled={busy} sx={{ mr: 'auto' }}>
            Cancel the request
          </Button>
        )}
        <Button onClick={onClose} disabled={busy}>
          Close
        </Button>
        <Button variant="contained" onClick={() => void send()} disabled={busy}>
          {busy ? 'Sending…' : user.fixRequest ? 'Update and send again' : 'Send request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
