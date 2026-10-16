import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { getEvents } from '../services/eventService';
import { getSessions, getStamps } from '../services/sessionService';
import { getPeople } from '../services/registrationService';
import { affiliation, memberLabel } from '../utils/people';
import { BADGES, badgesFor, buildLeaderboard, type BadgeId } from '../utils/badges';
import type { AppEvent } from '../types/event';
import type { Person } from '../types/attendee';
import type { Session, Stamp } from '../types/session';

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = ['#F5B301', '#9CA3AF', '#CD7F32'];

const initials = (name = '?') =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

function BadgeRow({ ids, size = 'small' }: { ids: BadgeId[]; size?: 'small' | 'medium' }) {
  return (
    <Stack direction="row" spacing={0.25} sx={{ fontSize: size === 'small' ? 16 : 20, lineHeight: 1 }}>
      {BADGES.filter((b) => ids.includes(b.id)).map((b) => (
        <Tooltip key={b.id} title={`${b.name} — ${b.description}`}>
          <Box component="span" role="img" aria-label={b.name}>
            {b.emoji}
          </Box>
        </Tooltip>
      ))}
    </Stack>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { selectedEvent } = useEvent();
  const navigate = useNavigate();
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [eventId, setEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getStamps(), getSessions(), getEvents(), getPeople()])
      .then(([st, se, ev, pe]) => {
        setStamps(st);
        setSessions(se);
        setPeople(pe);
        const withStamps = ev.filter((e) => se.some((s) => s.eventId === e.id && s.requiresStamp));
        setEvents(withStamps);
        setEventId(selectedEvent && withStamps.some((e) => e.id === selectedEvent.id) ? selectedEvent.id : 'all');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the leaderboard.'))
      .finally(() => setLoading(false));
  }, [selectedEvent]);

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const admins = useMemo(() => new Set(people.filter((p) => p.role === 'admin').map((p) => p.id)), [people]);
  const rows = useMemo(
    () =>
      buildLeaderboard(stamps, sessions, { eventId: eventId === 'all' ? undefined : eventId, excludeIds: admins })
        // Only people who still have an approved account
        .filter((r) => peopleById.has(r.personId)),
    [stamps, sessions, eventId, admins, peopleById],
  );

  const totalStampSessions = useMemo(
    () => (eventId === 'all' ? null : sessions.filter((s) => s.eventId === eventId && s.requiresStamp).length),
    [sessions, eventId],
  );
  const me = rows.find((r) => r.personId === user?.personId);
  const myBadges = user ? badgesFor(user.personId, stamps, sessions) : [];
  const showMine = user && user.role !== 'admin';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const podium = rows.slice(0, 3);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'flex-end' }} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsRoundedIcon sx={{ color: '#F5B301', fontSize: 34 }} /> Builder Leaderboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Top builders by approved stamps and completed workshops.
          </Typography>
        </Box>
        <TextField
          select
          size="small"
          label="Event"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          sx={{ minWidth: { sm: 300 } }}
        >
          <MenuItem value="all">All events</MenuItem>
          {events.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.title}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: showMine ? 'minmax(0, 1fr) 340px' : '1fr' }, gap: 3, alignItems: 'start' }}>
        <Box sx={{ minWidth: 0 }}>
          {rows.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: '20px', borderStyle: 'dashed', color: 'text.secondary' }}>
              <EmojiEventsRoundedIcon sx={{ fontSize: 48, opacity: 0.35 }} />
              <Typography sx={{ mt: 1 }}>No approved stamps yet. Be the first on the board!</Typography>
              <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/achievements')}>
                Collect stamps
              </Button>
            </Paper>
          ) : (
            <>
              {/* Podium */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, mb: 3 }}>
                {podium.map((r) => {
                  const p = peopleById.get(r.personId);
                  const place = Math.min(r.rank, 3) - 1;
                  const mine = r.personId === user?.personId;
                  return (
                    <Paper
                      key={r.personId}
                      sx={{
                        p: 2.5,
                        borderRadius: '20px',
                        textAlign: 'center',
                        border: `2px solid ${alpha(MEDAL_COLORS[place], 0.6)}`,
                        background: `linear-gradient(180deg, ${alpha(MEDAL_COLORS[place], 0.12)} 0%, transparent 70%)`,
                        outline: mine ? `3px solid ${alpha(brand.primary, 0.35)}` : 'none',
                      }}
                    >
                      <Typography sx={{ fontSize: 30, lineHeight: 1 }} aria-label={`Rank ${r.rank}`}>
                        {MEDALS[place]}
                      </Typography>
                      <Avatar src={p?.avatarUrl || undefined} sx={{ width: 56, height: 56, mx: 'auto', my: 1 }}>
                        {initials(p?.name)}
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }} noWrap>
                        {p?.name}
                        {mine && ' (you)'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                        {p ? affiliation(p) || memberLabel(p) : ''}
                      </Typography>
                      <Typography variant="h3" sx={{ mt: 1, fontWeight: 800, color: brand.primary }}>
                        {r.stamps}
                        <Typography component="span" variant="body2" color="text.secondary">
                          {' '}
                          stamp{r.stamps === 1 ? '' : 's'}
                        </Typography>
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                        <BadgeRow ids={r.badges} />
                      </Box>
                    </Paper>
                  );
                })}
              </Box>

              {/* Full ranking */}
              <Paper sx={{ borderRadius: '20px', overflow: 'hidden' }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '28px minmax(0, 1fr) 56px', sm: '32px minmax(0, 1fr) 60px 84px' },
                    columnGap: 1.5,
                    px: 2,
                    py: 1,
                    bgcolor: alpha(brand.primary, 0.05),
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  <span>#</span>
                  <span>Builder</span>
                  <Box component="span" sx={{ textAlign: 'right' }}>
                    Stamps
                  </Box>
                  <Box component="span" sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                    Workshops
                  </Box>
                </Box>
                {rows.map((r) => {
                  const p = peopleById.get(r.personId);
                  const mine = r.personId === user?.personId;
                  return (
                    <Box
                      key={r.personId}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '28px minmax(0, 1fr) 56px', sm: '32px minmax(0, 1fr) 60px 84px' },
                    columnGap: 1.5,
                        alignItems: 'center',
                        px: 2,
                        py: 1.25,
                        borderTop: `1px solid ${alpha(brand.primary, 0.08)}`,
                        bgcolor: mine ? alpha(brand.primary, 0.07) : 'transparent',
                      }}
                    >
                      <Typography sx={{ fontWeight: 800, color: r.rank <= 3 ? MEDAL_COLORS[r.rank - 1] : 'text.secondary' }}>
                        {r.rank}
                      </Typography>
                      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                        <Avatar src={p?.avatarUrl || undefined} sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                          {initials(p?.name)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: mine ? 800 : 600 }} noWrap>
                            {p?.name}
                            {mine && ' (you)'}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <BadgeRow ids={r.badges} />
                            <Typography variant="caption" color="text.secondary" sx={{ display: { sm: 'none' } }} noWrap>
                              {r.workshops} workshop{r.workshops === 1 ? '' : 's'}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                      <Typography sx={{ textAlign: 'right', fontWeight: 800 }}>
                        {r.stamps}
                        {totalStampSessions ? (
                          <Typography component="span" variant="caption" color="text.secondary">
                            /{totalStampSessions}
                          </Typography>
                        ) : null}
                      </Typography>
                      <Typography sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }} color="text.secondary">
                        {r.workshops}
                      </Typography>
                    </Box>
                  );
                })}
              </Paper>
            </>
          )}
        </Box>

        {/* My standing and badges */}
        {showMine && (
          <Paper sx={{ p: 2.5, borderRadius: '20px', position: { lg: 'sticky' }, top: 24 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              Your standing
            </Typography>
            {me ? (
              <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h2" sx={{ fontWeight: 800, color: brand.primary }}>
                    #{me.rank}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    of {rows.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h2" sx={{ fontWeight: 800 }}>
                    {me.stamps}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    stamps
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h2" sx={{ fontWeight: 800 }}>
                    {me.workshops}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    workshops
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You're not on the board{eventId === 'all' ? '' : ' for this event'} yet — get a stamp approved to join.
              </Typography>
            )}
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              My badges · {myBadges.length}/{BADGES.length}
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {BADGES.map((b) => {
                const earned = myBadges.includes(b.id);
                return (
                  <Stack
                    key={b.id}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{
                      p: 1.25,
                      borderRadius: '12px',
                      bgcolor: earned ? alpha(brand.success, 0.08) : alpha('#000', 0.03),
                      opacity: earned ? 1 : 0.55,
                    }}
                  >
                    <Box sx={{ fontSize: 24, filter: earned ? 'none' : 'grayscale(1)' }} aria-hidden>
                      {b.emoji}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {b.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {b.description}
                      </Typography>
                    </Box>
                    {earned && <Chip size="small" color="success" label="Earned" />}
                  </Stack>
                );
              })}
            </Stack>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
