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
import { approveUser, getUsers, rejectUser, updateUser } from '../services/authService';
import { getStamps } from '../services/sessionService';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/theme';
import type { User, UserRole } from '../types/auth';
import type { Stamp } from '../types/session';
import { AdminHeader, EmptyNote, StatRow, StatTile, formatDateTime } from '../components/AdminUi';
import { affiliation, memberLabel, officerTitle } from '../utils/people';

type Filter = 'all' | 'admin' | 'officer' | 'attendee' | 'rejected';

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

  async function run(personId: string, action: () => Promise<User>) {
    setBusyId(personId);
    setError('');
    try {
      replaceUser(await action());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
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
    const base = filter === 'rejected' ? declined : approved.filter((u) => filter === 'all' || u.role === filter);
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
      <AdminHeader title="Manage Accounts" subtitle="Approve new sign-ups and manage everyone's role." />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
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
        <Stack spacing={1.5} sx={{ mb: 4 }}>
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
                    <DetailLine label="Email" value={u.email || u.username} />
                    <DetailLine label="Personal email" value={u.personalEmail} />
                    <DetailLine label="Student ID" value={u.memberType !== 'outside' ? u.studentId : undefined} />
                    <DetailLine label="Organization" value={u.memberType === 'outside' ? u.organization : undefined} />
                    <DetailLine label="Signed up" value={u.createdAt ? formatDateTime(u.createdAt) : undefined} />
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1.5 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CloseIcon />}
                    disabled={busyId === u.personId}
                    onClick={() => user && run(u.personId, () => rejectUser(u.personId, user.personId))}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CheckIcon />}
                    disabled={busyId === u.personId}
                    onClick={() => user && run(u.personId, () => approveUser(u.personId, user.personId))}
                  >
                    {u.requestedRole === 'officer' ? 'Approve as Officer' : 'Approve'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
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
          <ToggleButton value="rejected">Declined ({declined.length})</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {visible.length === 0 ? (
        <EmptyNote>No accounts match.</EmptyNote>
      ) : (
        <Stack spacing={1.5}>
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
                    </Stack>
                  </Box>
                  {u.status === 'rejected' ? (
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={busyId === u.personId}
                      onClick={() => user && run(u.personId, () => approveUser(u.personId, user.personId))}
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
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
