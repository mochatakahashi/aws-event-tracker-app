import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { useBoardData } from '../hooks/useBoardData';
import { affiliation, memberLabel, officerTitle } from '../utils/people';
import { BADGES, type BadgeId } from '../utils/badges';
import type { EarnedOfficerBadge } from '../utils/officerBadges';
import { ATTENDEE_POINTS, OFFICER_POINTS, attendeeBoard, officerBoard } from '../utils/leaderboard';
import type { Person } from '../types/attendee';

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = ['#F5B301', '#9CA3AF', '#CD7F32'];

type Board = 'attendees' | 'officers';

interface Row {
  personId: string;
  points: number;
  rank: number;
  /** Small stats shown under the name, e.g. "3 stamps · 1 check-in". */
  stats: string[];
  badges?: BadgeId[];
  officerBadges?: EarnedOfficerBadge[];
  /** 0–1 progress bar (passport completion for one event, or tasks done). */
  progress?: number;
  progressLabel?: string;
}

const initials = (name = '?') =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function OfficerBadgeRow({ badges }: { badges: EarnedOfficerBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <Stack direction="row" spacing={0.25} sx={{ fontSize: 15, lineHeight: 1 }}>
      {badges.map((b) => (
        <Tooltip key={b.badge.id} title={`${b.badge.name}${b.count > 1 ? ` ×${b.count}` : ''} — ${b.events.join(', ') || b.badge.description}`}>
          <Box component="span" role="img" aria-label={b.badge.name}>
            {b.badge.emoji}
          </Box>
        </Tooltip>
      ))}
    </Stack>
  );
}

function BadgeRow({ ids }: { ids: BadgeId[] }) {
  if (ids.length === 0) return null;
  return (
    <Stack direction="row" spacing={0.25} sx={{ fontSize: 15, lineHeight: 1 }}>
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
  const [params, setParams] = useSearchParams();
  const { data, error, loading } = useBoardData();
  const [eventId, setEventId] = useState<string>('all');
  const [showRules, setShowRules] = useState(false);
  const board: Board = params.get('board') === 'officers' ? 'officers' : 'attendees';

  // Admin-only: a monitoring view
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/achievements', { replace: true });
  }, [user, navigate]);

  const events = useMemo(() => (data?.events ?? []).filter((e) => e.status !== 'cancelled'), [data]);
  const peopleById = useMemo(() => new Map((data?.people ?? []).map((p) => [p.id, p])), [data]);
  const scope = eventId === 'all' ? undefined : eventId;

  const rows: Row[] = useMemo(() => {
    if (!data) return [];
    if (board === 'officers') {
      return officerBoard(data, scope).map((r) => ({
        personId: r.personId,
        points: r.points,
        rank: r.rank,
        stats: [
          plural(r.stampsApproved, 'stamp') + ' approved',
          plural(r.checkInsDone, 'check-in'),
          `${r.tasksDone}/${r.tasksAssigned} tasks done`,
          plural(r.eventsVolunteered, 'event'),
        ],
        officerBadges: r.badges,
        progress: r.tasksAssigned ? r.tasksDone / r.tasksAssigned : undefined,
        progressLabel: r.tasksAssigned ? 'Tasks done' : undefined,
      }));
    }
    const stampSessions = scope ? data.sessions.filter((s) => s.eventId === scope && s.requiresStamp).length : 0;
    return attendeeBoard(data, scope).map((r) => ({
      personId: r.personId,
      points: r.points,
      rank: r.rank,
      stats: [
        stampSessions ? `${r.stamps}/${stampSessions} stamps` : plural(r.stamps, 'stamp'),
        plural(r.workshops, 'workshop'),
        plural(r.checkIns, 'check-in'),
      ],
      badges: r.badges,
      progress: stampSessions ? Math.min(1, r.stamps / stampSessions) : undefined,
      progressLabel: stampSessions ? 'Passport' : undefined,
    }));
  }, [data, board, scope]);

  const me = rows.find((r) => r.personId === user?.personId);
  const subtitle = (p?: Person) =>
    !p ? '' : board === 'officers' ? officerTitle(p) : affiliation(p) || memberLabel(p);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const podium = rows.filter((r) => r.points > 0).slice(0, 3);

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'flex-end' }} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsRoundedIcon sx={{ color: '#F5B301', fontSize: 34 }} /> Builder Leaderboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor who's most active — rankings and progress of all attendees and officers.
          </Typography>
        </Box>
        <TextField
          select
          size="small"
          label="Event"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          sx={{ minWidth: { md: 300 } }}
        >
          <MenuItem value="all">All events</MenuItem>
          {events.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.title}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
        <Tabs
          value={board}
          onChange={(_e, v: Board) => setParams(v === 'officers' ? { board: 'officers' } : {}, { replace: true })}
        >
          <Tab value="attendees" label="Attendees" />
          <Tab value="officers" label="Officers" />
        </Tabs>
        <Button
          size="small"
          startIcon={<InfoOutlinedIcon />}
          onClick={() => setShowRules((v) => !v)}
          aria-label="How points work"
          sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            How points work
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            Points
          </Box>
        </Button>
      </Stack>

      <Collapse in={showRules}>
        <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: '14px' }}>
          {board === 'attendees' ? (
            <Typography variant="body2" color="text.secondary">
              <strong>Attendees:</strong> {ATTENDEE_POINTS.stamp} per approved stamp, +{ATTENDEE_POINTS.workshopBonus} if it's a
              workshop, {ATTENDEE_POINTS.checkIn} per event check-in, and {ATTENDEE_POINTS.badge} per badge (all-events view
              only). Officers who attend also appear here.
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              <strong>Officers:</strong> {OFFICER_POINTS.stampApproved} per stamp approved, {OFFICER_POINTS.checkInDone} per
              attendee checked in, {OFFICER_POINTS.taskDone} per task completed, {OFFICER_POINTS.eventVolunteered} per
              event worked, and {OFFICER_POINTS.badge} per officer badge (automatic or awarded by an admin; all-events view only).
            </Typography>
          )}
        </Paper>
      </Collapse>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {me && (
        <Alert
          icon={<EmojiEventsRoundedIcon fontSize="inherit" />}
          severity="info"
          sx={{ mb: 2.5, borderRadius: '14px' }}
          action={
            board === 'attendees' ? (
              <Button color="inherit" size="small" onClick={() => navigate('/achievements')} sx={{ whiteSpace: 'nowrap' }}>
                My badges
              </Button>
            ) : undefined
          }
        >
          You're <strong>#{me.rank}</strong> of {rows.length} {board === 'officers' ? 'officers' : 'attendees'} with{' '}
          <strong>{me.points} points</strong>.
        </Alert>
      )}

      {rows.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: '20px', borderStyle: 'dashed', color: 'text.secondary' }}>
          <Typography>{board === 'officers' ? 'No officers yet.' : 'No attendees yet.'}</Typography>
        </Paper>
      ) : (
        <>
          {/* Podium (only people who have points) */}
          {podium.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, mb: 3 }}>
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
                      {subtitle(p)}
                    </Typography>
                    <Typography variant="h3" sx={{ mt: 1, fontWeight: 800, color: brand.primary }}>
                      {r.points}
                      <Typography component="span" variant="body2" color="text.secondary">
                        {' '}
                        pts
                      </Typography>
                    </Typography>
                    {r.badges && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                        <BadgeRow ids={r.badges} />
                      </Box>
                    )}
                    {r.officerBadges && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                        <OfficerBadgeRow badges={r.officerBadges} />
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}

          {/* Full ranking — everyone, including 0 points */}
          <Paper sx={{ borderRadius: '20px', overflow: 'hidden' }}>
            {rows.map((r, i) => {
              const p = peopleById.get(r.personId);
              const mine = r.personId === user?.personId;
              return (
                <Stack
                  key={r.personId}
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderTop: i === 0 ? 'none' : `1px solid ${alpha(brand.primary, 0.08)}`,
                    bgcolor: mine ? alpha(brand.primary, 0.07) : 'transparent',
                  }}
                >
                  <Typography
                    sx={{
                      width: 28,
                      flexShrink: 0,
                      fontWeight: 800,
                      color: r.points > 0 && r.rank <= 3 ? MEDAL_COLORS[r.rank - 1] : 'text.secondary',
                    }}
                  >
                    {r.rank}
                  </Typography>
                  <Avatar src={p?.avatarUrl || undefined} sx={{ width: 36, height: 36, fontSize: '0.8rem', flexShrink: 0 }}>
                    {initials(p?.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: mine ? 800 : 600 }} noWrap>
                        {p?.name}
                        {mine && ' (you)'}
                      </Typography>
                      {r.badges && <BadgeRow ids={r.badges} />}
                      {r.officerBadges && <OfficerBadgeRow badges={r.officerBadges} />}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                      {[subtitle(p), ...r.stats].filter(Boolean).join(' · ')}
                    </Typography>
                    {r.progress !== undefined && (
                      <Tooltip title={`${r.progressLabel}: ${Math.round(r.progress * 100)}%`}>
                        <LinearProgress
                          variant="determinate"
                          value={r.progress * 100}
                          color={r.progress >= 1 ? 'success' : 'primary'}
                          sx={{ height: 5, borderRadius: 3, mt: 0.5, maxWidth: 260 }}
                          aria-label={r.progressLabel}
                        />
                      </Tooltip>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ fontWeight: 800, color: r.points > 0 ? brand.primary : 'text.secondary', lineHeight: 1.1 }}>
                      {r.points}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      pts
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Paper>
          {selectedEvent && eventId === 'all' && events.some((e) => e.id === selectedEvent.id) && (
            <Button size="small" sx={{ mt: 1.5 }} onClick={() => setEventId(selectedEvent.id)}>
              Show only {selectedEvent.title}
            </Button>
          )}
        </>
      )}
    </Box>
  );
}
