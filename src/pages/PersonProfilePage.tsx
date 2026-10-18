import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useBoardData } from '../hooks/useBoardData';
import { updateProfile } from '../services/authService';
import { notifyInApp } from '../services/notificationService';
import { affiliation, memberLabel, officerTitle } from '../utils/people';
import { BADGES } from '../utils/badges';
import { officerBadgesFor } from '../utils/officerBadges';
import { attendeeBoard } from '../utils/leaderboard';
import SocialLinksRow from '../components/SocialLinksRow';

const initials = (name = '?') =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <Box sx={{ flex: 1, minWidth: 90, p: 1.5, borderRadius: '14px', bgcolor: alpha(brand.primary, 0.05), textAlign: 'center' }}>
      <Typography variant="h3" sx={{ fontWeight: 800, color: brand.primary }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

/** Someone's profile summary — opened from their QR code or your connections. */
export default function PersonProfilePage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useBoardData();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const person = data?.people.find((p) => p.id === id);
  const row = useMemo(() => (data ? attendeeBoard(data).find((r) => r.personId === id) : undefined), [data, id]);
  const attended = useMemo(
    () =>
      data
        ? data.registrations
            .filter((r) => r.personId === id && r.checkedIn)
            .map((r) => data.events.find((e) => e.id === r.eventId))
            .filter(Boolean)
        : [],
    [data, id],
  );
  const volunteered = useMemo(
    () => (data ? data.events.filter((e) => (e.officerIds || []).includes(id)) : []),
    [data, id],
  );

  const isMe = user?.personId === id;
  const connected = Boolean(user?.connections?.includes(id));

  async function toggleConnection() {
    if (!user || !person) return;
    setBusy(true);
    setMsg('');
    try {
      const next = connected ? (user.connections || []).filter((x) => x !== id) : [...(user.connections || []), id];
      const updated = await updateProfile(user.personId, { connections: next });
      setCurrentUser(updated);
      if (!connected) {
        setMsg(`${person.name} was added to your connections.`);
        void notifyInApp({
          personIds: [id],
          kind: 'announcement',
          title: `${user.name} added you as a connection`,
          message: 'Open their profile to see their achievements and add them back.',
          link: `/people/${user.personId}`,
        });
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not update your connections.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!person) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h2" gutterBottom>
          Profile not found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {error || 'This QR code or link is not an active AWS SBG-APC account.'}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/connect')}>
          Back to Connect
        </Button>
      </Box>
    );
  }

  const badges = row?.badges ?? [];
  const officerBadges = person.role === 'officer' && data ? officerBadgesFor(person, data) : [];

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/connect')} sx={{ mb: 1 }}>
        Connect
      </Button>
      <Paper sx={{ borderRadius: '20px', overflow: 'hidden', mb: 2.5 }}>
        <Box sx={{ height: 90, background: brand.gradient }} />
        <Box sx={{ px: { xs: 2.5, sm: 3 }, pb: 3 }}>
          <Avatar
            src={person.avatarUrl || undefined}
            sx={{ width: 88, height: 88, fontSize: '1.9rem', border: '4px solid #fff', mt: -5.5, mb: 1 }}
          >
            {initials(person.name)}
          </Avatar>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={1.5}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h2" sx={{ fontWeight: 800 }}>
                {person.name}
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                <Chip size="small" color="primary" label={memberLabel(person)} />
                {person.role === 'officer' && <Chip size="small" variant="outlined" label={officerTitle(person)} />}
                {affiliation(person) !== '—' && <Chip size="small" variant="outlined" label={affiliation(person)} />}
              </Stack>
            </Box>
            {!isMe && user && (
              <Button
                variant={connected ? 'outlined' : 'contained'}
                startIcon={connected ? <HowToRegRoundedIcon /> : <PersonAddAlt1RoundedIcon />}
                onClick={toggleConnection}
                disabled={busy}
                sx={{ flexShrink: 0 }}
              >
                {connected ? 'Connected' : 'Add connection'}
              </Button>
            )}
          </Stack>
          {msg && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setMsg('')}>
              {msg}
            </Alert>
          )}
          {person.bio && (
            <Typography sx={{ mt: 2, whiteSpace: 'pre-line', color: 'text.secondary' }}>{person.bio}</Typography>
          )}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <SocialLinksRow socials={person.socials} empty={`${person.name.split(' ')[0]} hasn't added social links yet.`} />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: '20px' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5 }}>
          Achievements
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          <Stat value={row?.stamps ?? 0} label="stamps" />
          <Stat value={row?.workshops ?? 0} label="workshops" />
          <Stat value={attended.length} label="events attended" />
          {person.role === 'officer' && <Stat value={volunteered.length} label="events volunteered" />}
        </Stack>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
          Badges · {badges.length}/{BADGES.length}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5, mb: 2 }}>
          {BADGES.map((b) => {
            const earned = badges.includes(b.id);
            return (
              <Tooltip key={b.id} title={b.description}>
                <Chip
                  label={`${b.emoji} ${b.name}`}
                  variant={earned ? 'filled' : 'outlined'}
                  color={earned ? 'success' : 'default'}
                  sx={{ opacity: earned ? 1 : 0.45 }}
                />
              </Tooltip>
            );
          })}
        </Stack>
        {person.role === 'officer' && (
          <>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              Officer badges · {officerBadges.reduce((n, b) => n + b.count, 0)}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5, mb: 2 }} data-testid="profile-officer-badges">
              {officerBadges.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  None yet.
                </Typography>
              ) : (
                officerBadges.map((b) => (
                  <Tooltip key={b.badge.id} title={b.events.length ? b.events.join(', ') : b.badge.description}>
                    <Chip
                      label={`${b.badge.emoji} ${b.badge.name}${b.count > 1 ? ` ×${b.count}` : ''}`}
                      color={b.badge.awarded ? 'primary' : 'success'}
                    />
                  </Tooltip>
                ))
              )}
            </Stack>
          </>
        )}
        {attended.length > 0 && (
          <>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              Events attended
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
              {attended.map((e) => (
                <Chip key={e!.id} size="small" label={e!.title} onClick={() => navigate(`/events/${e!.id}`)} />
              ))}
            </Stack>
          </>
        )}
      </Paper>
    </Box>
  );
}
