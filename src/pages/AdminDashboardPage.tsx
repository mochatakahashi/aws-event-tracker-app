import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { alpha } from '@mui/material/styles';
import { approveUser, deleteUser, getUsers, rejectUser, resetPassword, updateUser } from '../services/authService';
import AddAccountPanel from '../components/AddAccountPanel';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import LockResetIcon from '@mui/icons-material/LockReset';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import { notifyQuietly } from '../services/notifyService';
import { notifyInApp } from '../services/notificationService';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { getStamps } from '../services/sessionService';
import { useAuth } from '../context/AuthContext';
import { brand, PARTNER } from '../theme/theme';
import type { User, UserRole } from '../types/auth';
import type { Stamp } from '../types/session';
import { AdminHeader, EmptyNote, StatRow, StatTile, formatDateTime } from '../components/AdminUi';
import { ACCOUNT_TYPE_LABELS, affiliation, generateTempPassword, memberLabel, officerTitle } from '../utils/people';

/** What the person picked on the sign-up form, e.g. "Officer — Director — Marketing (Creatives)". */
function signedUpAs(u: User): string {
  const type = u.signupType ?? (u.requestedRole === 'officer' || u.officerPosition ? 'officer' : u.memberType === 'outside' ? 'outside' : 'apc-student');
  const base = ACCOUNT_TYPE_LABELS[type];
  return type === 'officer' && u.officerPosition ? `${base} — ${officerTitle(u)}` : base;
}

type Filter = 'all' | 'admin' | 'officer' | 'attendee' | 'partner' | 'rejected';

/** Quick picks for the optional decline reason. */
const DECLINE_REASONS = [
  'Missing or incomplete name',
  'Wrong email address',
  'Not an APC email',
  'Wrong student ID',
  'Duplicate account',
];

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function DetailLine({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
      <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {label}:
      </Box>{' '}
      {value}
    </Typography>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [info, setInfo] = useState('');
  // Inline decline form (no dialogs)
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [resetFor, setResetFor] = useState<{ id: string; password: string; done?: boolean } | null>(null);
  /** Editing who is co-organizer staff (partner org) — attendee accounts only. */
  const [partnerFor, setPartnerFor] = useState<{ id: string; org: string } | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/home');
      return;
    }
    Promise.all([getUsers(), getStamps()])
      .then(([usersData, stampsData]) => {
        setUsers(usersData);
        setStamps(stampsData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load accounts.'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  function replaceUser(updated: User) {
    setUsers((prev) => prev.map((u) => (u.personId === updated.personId ? updated : u)));
  }

  async function run(personId: string, action: () => Promise<User>, emailAfter = false) {
    setBusyId(personId);
    setError('');
    setInfo('');
    try {
      const updated = await action();
      replaceUser(updated);
      if (emailAfter) {
        void notifyInApp(
          updated.status === 'rejected'
            ? {
                personIds: [personId],
                kind: 'account-declined',
                title: 'Your sign-up was declined',
                message: updated.rejectionReason ? `Reason: ${updated.rejectionReason}` : 'Please check your details and sign up again.',
              }
            : {
                personIds: [personId],
                kind: 'account-approved',
                title: 'Welcome! Your account is approved',
                message:
                  updated.role === 'officer'
                    ? 'You can now use your Officer Dashboard.'
                    : 'You can now register for events and collect stamps.',
                link: updated.role === 'officer' ? '/officer' : '/events',
              },
        );
        const status = await notifyQuietly({ type: 'account-reviewed', personId });
        if (status) setInfo(`${updated.name}: ${status}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(target: User) {
    if (!user) return;
    setBusyId(target.personId);
    setError('');
    try {
      await deleteUser(target.personId, user.personId);
      setUsers((prev) => prev.filter((u) => u.personId !== target.personId));
      setInfo(`Deleted ${target.name}'s account.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the account.');
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  }

  const pending = useMemo(
    () => users.filter((u) => u.status === 'pending').sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')),
    [users],
  );
  const approved = users.filter((u) => !u.status || u.status === 'approved');
  const declined = users.filter((u) => u.status === 'rejected');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base =
      filter === 'rejected'
        ? declined
        : approved.filter((u) => filter === 'all' || (filter === 'partner' ? u.role === 'attendee' && Boolean(u.partnerOrg) : u.role === filter));
    return base
      .filter(
        (u) =>
          !q ||
          [u.name, u.email, u.username, u.studentId, u.organization]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [approved, declined, filter, search]);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <AdminHeader
        title="Manage Accounts"
        subtitle="Approve new sign-ups, add accounts and manage everyone's role."
        actions={
          !showAdd && (
            <Button variant="contained" startIcon={<PersonAddAlt1RoundedIcon />} onClick={() => setShowAdd(true)}>
              Add account
            </Button>
          )
        }
      />

      {showAdd && user && (
        <AddAccountPanel
          actorId={user.personId}
          onCreated={(created) => setUsers((prev) => [...prev.filter((u) => u.personId !== created.personId), created])}
          onClose={() => setShowAdd(false)}
        />
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {info && (
        <Alert severity={/failed|No email sent/.test(info) ? 'warning' : 'success'} sx={{ mb: 2 }} onClose={() => setInfo('')}>
          {info}
        </Alert>
      )}

      <StatRow>
        <StatTile label="Waiting for approval" value={pending.length} color={brand.warning} />
        <StatTile label="Active accounts" value={approved.length} />
        <StatTile label="Officers" value={approved.filter((u) => u.role === 'officer').length} color={brand.primaryLight} />
        <StatTile
          label="Outside attendees"
          value={approved.filter((u) => u.memberType === 'outside').length}
          color={brand.success}
        />
      </StatRow>

      {/* Pending sign-ups */}
      <Typography variant="h3" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        Waiting for approval
        {pending.length > 0 && <Chip label={pending.length} color="warning" size="small" />}
      </Typography>
      {pending.length === 0 ? (
        <Box sx={{ mb: 4 }}>
          <EmptyNote>No sign-ups are waiting. New accounts show up here until you approve them.</EmptyNote>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5, alignItems: 'start', mb: 4 }}>
          {pending.map((u) => (
            <Card key={u.personId} variant="outlined" sx={{ borderColor: alpha(brand.warning, 0.6) }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar>
                    {initials(u.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {u.name}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ my: 0.75 }}>
                      <Chip size="small" label={memberLabel(u)} color={u.requestedRole === 'officer' ? 'primary' : 'default'} />
                      {u.requestedRole === 'officer' && <Chip size="small" variant="outlined" label={officerTitle(u)} />}
                    </Stack>
                    <DetailLine label="Signed up as" value={signedUpAs(u)} />
                    <DetailLine label="Email" value={u.email || u.username} />
                    <DetailLine label="Personal email" value={u.personalEmail} />
                    <DetailLine label="Student ID" value={u.memberType !== 'outside' ? u.studentId : undefined} />
                    <DetailLine label="Organization" value={u.memberType === 'outside' ? u.organization : undefined} />
                    <DetailLine label="Signed up" value={u.createdAt ? formatDateTime(u.createdAt) : undefined} />
                  </Box>
                </Stack>
                {decliningId === u.personId ? (
                  <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: alpha(brand.error, 0.04), border: '1px solid', borderColor: alpha(brand.error, 0.2) }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Reason for declining (optional)
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                      {DECLINE_REASONS.map((r) => (
                        <Chip
                          key={r}
                          size="small"
                          label={r}
                          variant={declineReason === r ? 'filled' : 'outlined'}
                          color={declineReason === r ? 'error' : 'default'}
                          onClick={() => setDeclineReason(declineReason === r ? '' : r)}
                        />
                      ))}
                    </Stack>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Or type a reason — it's shown to them and emailed"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      sx={{ bgcolor: 'background.paper' }}
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1.25 }}>
                      <Button onClick={() => setDecliningId(null)}>Cancel</Button>
                      <Button
                        variant="contained"
                        color="error"
                        disabled={busyId === u.personId}
                        onClick={() => {
                          if (!user) return;
                          const reason = declineReason;
                          setDecliningId(null);
                          void run(u.personId, () => rejectUser(u.personId, user.personId, reason), true);
                        }}
                      >
                        Decline sign-up
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1.5 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CloseIcon />}
                    disabled={busyId === u.personId}
                    onClick={() => {
                      setDecliningId(u.personId);
                      setDeclineReason('');
                    }}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CheckIcon />}
                    disabled={busyId === u.personId}
                    onClick={() => user && run(u.personId, () => approveUser(u.personId, user.personId), true)}
                  >
                    {u.requestedRole === 'officer' ? 'Approve as Officer' : 'Approve'}
                  </Button>
                </Stack>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* All accounts */}
      <Typography variant="h3" sx={{ mb: 1.5 }}>
        All accounts
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search name, email, student ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={filter}
          onChange={(_e, v: Filter | null) => v && setFilter(v)}
          sx={{ flexWrap: 'wrap' }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="admin">Admins</ToggleButton>
          <ToggleButton value="officer">Officers</ToggleButton>
          <ToggleButton value="attendee">Attendees</ToggleButton>
          <ToggleButton value="partner">Co-organizer staff</ToggleButton>
          <ToggleButton value="rejected">Declined ({declined.length})</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {visible.length === 0 ? (
        <EmptyNote>No accounts match.</EmptyNote>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5, alignItems: 'start' }}>
          {visible.map((u) => {
            const stampCount = stamps.filter((s) => s.attendeeId === u.personId && s.status === 'approved').length;
            return (
              <Card key={u.personId} variant="outlined">
                <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Avatar src={u.avatarUrl || undefined}>
                    {initials(u.name)}
                  </Avatar>
                  <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                      {u.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {u.email || u.username}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                      <Chip size="small" label={memberLabel(u)} />
                      {u.role === 'officer' && u.officerPosition && (
                        <Chip size="small" variant="outlined" label={officerTitle(u)} />
                      )}
                      {affiliation(u) !== '—' && <Chip size="small" variant="outlined" label={affiliation(u)} />}
                      {u.role === 'attendee' && <Chip size="small" variant="outlined" label={`${stampCount} stamps`} />}
                      {u.role === 'attendee' && u.partnerOrg && (
                        <Chip
                          size="small"
                          variant="outlined"
                          icon={<HandshakeOutlinedIcon style={{ color: PARTNER }} />}
                          sx={{ color: PARTNER, borderColor: PARTNER, fontWeight: 600 }}
                          label={`Co-organizer staff · ${u.partnerOrg}`}
                          data-testid={`partner-chip-${u.personId}`}
                        />
                      )}
                      {!!u.officerHistory?.length && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`Alumni officer ${u.officerHistory.map((t) => t.schoolYear).join(', ')}`}
                        />
                      )}
                    </Stack>
                    {(u.role !== 'admin' || u.signupType) && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {u.createdBy ? 'Added by an admin as ' : 'Signed up as '}
                        {signedUpAs(u)}
                      </Typography>
                    )}
                    {u.mustChangePassword && (
                      <Chip size="small" color="warning" variant="outlined" label="Temp password not changed yet" sx={{ mt: 0.5 }} />
                    )}
                    {resetFor?.id === u.personId && (
                      <Box sx={{ mt: 1, p: 1.25, borderRadius: 2, bgcolor: alpha(brand.primary, 0.05) }}>
                        {resetFor.done ? (
                          <Typography variant="body2">
                            New temporary password: <Box component="code" sx={{ fontWeight: 700, userSelect: 'all' }}>{resetFor.password}</Box>
                            <br />
                            Share it with {u.firstName || u.name}; they'll be asked to change it at sign-in.
                          </Typography>
                        ) : (
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                            <Typography variant="body2">
                              Set a temporary password <Box component="code" sx={{ fontWeight: 700 }}>{resetFor.password}</Box>?
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Button size="small" onClick={() => setResetFor(null)}>Cancel</Button>
                              <Button
                                size="small"
                                variant="contained"
                                disabled={busyId === u.personId}
                                onClick={() =>
                                  user &&
                                  run(u.personId, async () => {
                                    const updated = await resetPassword(u.personId, resetFor.password, user.personId);
                                    setResetFor({ ...resetFor, done: true });
                                    return updated;
                                  })
                                }
                              >
                                Reset password
                              </Button>
                            </Stack>
                          </Stack>
                        )}
                      </Box>
                    )}
                    {partnerFor?.id === u.personId && (
                      <Box sx={{ mt: 1, p: 1.25, borderRadius: 2, bgcolor: alpha(brand.primary, 0.05) }} data-testid={`partner-editor-${u.personId}`}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Co-organizer staff can be put on a co-organized event’s staff list for <strong>check-in</strong> or{' '}
                          <strong>stamps</strong> only — no officer tasks or other officer features.
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                          <TextField
                            size="small"
                            label="Partner org"
                            placeholder="e.g. GDSC APC"
                            value={partnerFor.org}
                            onChange={(e) => setPartnerFor({ ...partnerFor, org: e.target.value })}
                            inputProps={{ maxLength: 60 }}
                            sx={{ flex: 1, bgcolor: '#fff' }}
                          />
                          <Stack direction="row" spacing={1}>
                            <Button size="small" onClick={() => setPartnerFor(null)}>
                              Cancel
                            </Button>
                            {u.partnerOrg && (
                              <Button
                                size="small"
                                color="error"
                                disabled={busyId === u.personId}
                                onClick={() =>
                                  user &&
                                  run(u.personId, async () => {
                                    const updated = await updateUser(u.personId, { partnerOrg: null }, user.personId);
                                    setPartnerFor(null);
                                    return updated;
                                  })
                                }
                              >
                                Remove
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="contained"
                              disabled={busyId === u.personId || !partnerFor.org.trim()}
                              onClick={() =>
                                user &&
                                run(u.personId, async () => {
                                  const updated = await updateUser(u.personId, { partnerOrg: partnerFor.org.trim() }, user.personId);
                                  setPartnerFor(null);
                                  return updated;
                                })
                              }
                            >
                              Save
                            </Button>
                          </Stack>
                        </Stack>
                      </Box>
                    )}
                    {u.status === 'rejected' && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                        Declined{u.rejectionReason ? `: ${u.rejectionReason}` : ''}
                      </Typography>
                    )}
                  </Box>
                  {u.status === 'rejected' ? (
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={busyId === u.personId}
                      onClick={() => user && run(u.personId, () => approveUser(u.personId, user.personId), true)}
                    >
                      Approve after all
                    </Button>
                  ) : (
                    <TextField
                      select
                      size="small"
                      label="Role"
                      value={u.role}
                      disabled={u.personId === user?.personId || busyId === u.personId}
                      onChange={(e) =>
                        user &&
                        run(u.personId, () =>
                          updateUser(u.personId, { role: e.target.value as UserRole, requestedRole: null }, user.personId),
                        )
                      }
                      sx={{ minWidth: 130 }}
                    >
                      <MenuItem value="attendee">Attendee</MenuItem>
                      <MenuItem value="officer">Officer</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </TextField>
                  )}
                  {u.personId !== user?.personId &&
                    (confirmDeleteId === u.personId ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="caption" color="error">Delete permanently?</Typography>
                        <Button size="small" onClick={() => setConfirmDeleteId(null)}>Keep</Button>
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          disabled={busyId === u.personId}
                          onClick={() => handleDelete(u)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    ) : (
                      <>
                      {u.role === 'attendee' && u.status !== 'rejected' && (
                        <Tooltip title="Co-organizer staff">
                          <IconButton
                            size="small"
                            aria-label={`Co-organizer staff: ${u.name}`}
                            onClick={() => setPartnerFor({ id: u.personId, org: u.partnerOrg || '' })}
                          >
                            <HandshakeOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Reset password">
                        <IconButton
                          size="small"
                          aria-label={`Reset password for ${u.name}`}
                          onClick={() => setResetFor({ id: u.personId, password: generateTempPassword() })}
                        >
                          <LockResetIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete account">
                        <IconButton size="small" aria-label={`Delete ${u.name}`} onClick={() => setConfirmDeleteId(u.personId)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      </>
                    ))}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
