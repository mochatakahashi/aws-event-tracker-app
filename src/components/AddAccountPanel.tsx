import { useState, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { createAccount } from '../services/authService';
import { ACCOUNT_TYPE_LABELS, generateTempPassword } from '../utils/people';
import type { AccountType, User, UserRole } from '../types/auth';
import OfficerRoleFields, { type OfficerRoleValue } from './OfficerRoleFields';
import PasswordChecklist from './PasswordChecklist';

const EMPTY_ROLE: OfficerRoleValue = { officerPosition: '', committee: '', subcommittee: '' };

/** Admin form: create an approved account and hand over the email + temporary password. */
export default function AddAccountPanel({
  actorId,
  onCreated,
  onClose,
}: {
  actorId: string;
  onCreated: (user: User) => void;
  onClose: () => void;
}) {
  const [accountType, setAccountType] = useState<AccountType>('apc-student');
  const [role, setRole] = useState<UserRole>('attendee');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [organization, setOrganization] = useState('');
  const [officer, setOfficer] = useState<OfficerRoleValue>(EMPTY_ROLE);
  const [password, setPassword] = useState(generateTempPassword);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ user: User; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const isOfficer = accountType === 'officer';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const user = await createAccount(
        {
          accountType,
          role: isOfficer ? 'officer' : role,
          firstName,
          middleInitial: middleInitial || undefined,
          lastName,
          email,
          personalEmail: isOfficer ? personalEmail || undefined : undefined,
          studentId: accountType === 'outside' ? undefined : studentId,
          organization: accountType === 'outside' ? organization : undefined,
          officerPosition: isOfficer ? officer.officerPosition || undefined : undefined,
          committee: isOfficer ? officer.committee || undefined : undefined,
          subcommittee: isOfficer ? officer.subcommittee || undefined : undefined,
          password,
        },
        actorId,
      );
      setCreated({ user, password });
      onCreated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account.');
    } finally {
      setSaving(false);
    }
  }

  const handover = created
    ? `AWS SBG-APC Event Tracker\nSign in: ${window.location.origin}${window.location.pathname}#/login\nEmail: ${created.user.email}\nTemporary password: ${created.password}\nYou'll be asked to set your own password the first time you sign in.`
    : '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(handover);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the text is selectable */
    }
  }

  function reset() {
    setCreated(null);
    setFirstName('');
    setMiddleInitial('');
    setLastName('');
    setEmail('');
    setPersonalEmail('');
    setStudentId('');
    setOrganization('');
    setOfficer(EMPTY_ROLE);
    setPassword(generateTempPassword());
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: '16px', mb: 3, borderColor: alpha(brand.primary, 0.3) }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Add an account
        </Typography>
        <Button size="small" onClick={onClose}>
          Close
        </Button>
      </Stack>

      {created ? (
        <Box>
          <Alert severity="success" sx={{ mb: 1.5 }}>
            Account created for <strong>{created.user.name}</strong>. Share these details — they'll set their own
            password at first sign-in.
          </Alert>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(brand.primary, 0.05),
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              userSelect: 'all',
            }}
          >
            {handover}
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Button variant="contained" startIcon={<ContentCopyRoundedIcon />} onClick={copy}>
              {copied ? 'Copied!' : 'Copy login details'}
            </Button>
            <Button onClick={reset}>Add another</Button>
          </Stack>
        </Box>
      ) : (
        <Box component="form" onSubmit={submit}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={accountType}
            onChange={(_e, v: AccountType | null) => v && setAccountType(v)}
            sx={{ mb: 1, flexWrap: 'wrap' }}
          >
            {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
              <ToggleButton key={t} value={t}>
                {ACCOUNT_TYPE_LABELS[t]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: '1fr 90px 1fr' }, columnGap: 1.5 }}>
            <TextField size="small" margin="dense" label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <TextField size="small" margin="dense" label="M.I." value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value)} />
            <TextField size="small" margin="dense" label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, columnGap: 1.5 }}>
            <TextField
              size="small"
              margin="dense"
              label={accountType === 'outside' ? 'Email' : 'APC email'}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {accountType === 'outside' ? (
              <TextField size="small" margin="dense" label="School / organization" value={organization} onChange={(e) => setOrganization(e.target.value)} required />
            ) : (
              <TextField size="small" margin="dense" label="APC student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
            )}
            {isOfficer && (
              <TextField size="small" margin="dense" label="Personal email (optional)" value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} />
            )}
            {!isOfficer && (
              <TextField select size="small" margin="dense" label="Role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                <MenuItem value="attendee">Attendee</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            )}
          </Box>
          {isOfficer && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' }, columnGap: 1.5 }}>
              <OfficerRoleFields value={officer} onChange={setOfficer} size="small" />
            </Box>
          )}
          <TextField
            size="small"
            margin="dense"
            label="Temporary password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            InputProps={{
              sx: { fontFamily: 'monospace' },
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Generate a new one">
                    <IconButton size="small" onClick={() => setPassword(generateTempPassword())} aria-label="Generate password">
                      <AutorenewRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
          <PasswordChecklist password={password} />
          {error && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {error}
            </Alert>
          )}
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1.5 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Creating…' : 'Create account'}
            </Button>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
