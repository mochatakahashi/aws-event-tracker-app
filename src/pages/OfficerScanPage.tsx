import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { getEvents } from '../services/eventService';
import { checkIn, getPeople, getRegistration, getRegistrationsByEvent } from '../services/registrationService';
import { approveStamp, createStamp, getSessionsByEvent, getStampsByAttendee } from '../services/sessionService';
import { notifyInApp } from '../services/notificationService';
import { affiliation, memberLabel } from '../utils/people';
import { parsePass } from '../utils/pass';
import QrScanner from '../components/QrScanner';
import type { AppEvent } from '../types/event';
import type { Person, Registration } from '../types/attendee';
import type { Session, Stamp } from '../types/session';

interface Scanned {
  reg: Registration;
  person?: Person;
  event?: AppEvent;
  stampSessions: Session[];
  stamps: Stamp[];
  justCheckedIn?: boolean;
}

const manilaTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }) : '';

const initials = (name = '?') =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const isLive = (s: Session, now = Date.now()) =>
  Boolean(s.startTime && s.endTime) && new Date(s.startTime).getTime() <= now && new Date(s.endTime).getTime() >= now;

/** Sessions happening now first, then by start time. */
const orderSessions = (list: Session[]) =>
  [...list].sort((a, b) => Number(isLive(b)) - Number(isLive(a)) || (a.startTime || '').localeCompare(b.startTime || ''));

/** Pick the event at the door: one happening now, the selected one, or the next upcoming. */
function defaultEvent(events: AppEvent[], selected?: string): string {
  const now = Date.now();
  const live = events.find((e) => new Date(e.startAt).getTime() <= now && new Date(e.endAt).getTime() >= now);
  if (live) return live.id;
  if (selected && events.some((e) => e.id === selected)) return selected;
  const next = [...events]
    .filter((e) => new Date(e.endAt).getTime() >= now)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))[0];
  return next?.id ?? events[0]?.id ?? '';
}

export default function OfficerScanPage() {
  const { user } = useAuth();
  const { selectedEvent } = useEvent();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [events, setEvents] = useState<AppEvent[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [doorEventId, setDoorEventId] = useState('');
  const [eventRegs, setEventRegs] = useState<Registration[]>([]);
  const [search, setSearch] = useState('');

  const [scanned, setScanned] = useState<Scanned | null>(null);
  const [looking, setLooking] = useState(false);
  const [working, setWorking] = useState(false);
  const [stampBusy, setStampBusy] = useState<string | null>(null);
  const [stampJustApproved, setStampJustApproved] = useState<string | null>(null);
  const [error, setError] = useState('');
  const lastCode = useRef<{ text: string; at: number }>({ text: '', at: 0 });

  const isStaff = user?.role === 'officer' || user?.role === 'admin';
  const wide = useMediaQuery(useTheme().breakpoints.up('lg'));

  useEffect(() => {
    if (user && !isStaff) navigate('/home', { replace: true });
  }, [user, isStaff, navigate]);

  useEffect(() => {
    Promise.all([getEvents(), getPeople()])
      .then(([evts, ppl]) => {
        const open = evts.filter((e) => e.status !== 'cancelled');
        setEvents(open);
        setPeople(ppl);
        setDoorEventId((cur) => cur || defaultEvent(open, selectedEvent?.id));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load events.'));
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (!doorEventId) return;
    getRegistrationsByEvent(doorEventId)
      .then(setEventRegs)
      .catch(() => setEventRegs([]));
  }, [doorEventId, scanned?.reg.checkedIn]);

  const open = useCallback(
    async (registrationId: string) => {
      setLooking(true);
      setError('');
      try {
        const reg = await getRegistration(registrationId);
        if (!reg) {
          setScanned(null);
          setError('This pass was not found. The registration may have been cancelled.');
          return;
        }
        const [ppl, sessions, stamps] = await Promise.all([
          people.length ? Promise.resolve(people) : getPeople(),
          getSessionsByEvent(reg.eventId).catch(() => [] as Session[]),
          getStampsByAttendee(reg.personId).catch(() => [] as Stamp[]),
        ]);
        const stampSessions = sessions.filter((s) => s.requiresStamp);
        const ids = new Set(sessions.map((s) => s.id));
        setScanned({
          reg,
          person: ppl.find((p) => p.id === reg.personId),
          event: events.find((e) => e.id === reg.eventId) ?? (await getEvents()).find((e) => e.id === reg.eventId),
          stampSessions,
          stamps: stamps.filter((s) => ids.has(s.sessionId)),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not open this pass.');
      } finally {
        setLooking(false);
      }
    },
    [people, events],
  );

  // Opened from a QR link with the phone's own camera app
  useEffect(() => {
    const pass = params.get('pass');
    if (pass && isStaff) {
      void open(pass);
      setParams({}, { replace: true });
    }
  }, [params, isStaff, open, setParams]);

  function onScan(text: string) {
    const now = Date.now();
    if (text === lastCode.current.text && now - lastCode.current.at < 2500) return;
    lastCode.current = { text, at: now };
    const id = parsePass(text);
    if (!id) {
      setError('That QR code is not an AWS SBG-APC event pass.');
      return;
    }
    if ('vibrate' in navigator) navigator.vibrate?.(60);
    void open(id);
  }

  async function handleCheckIn() {
    if (!scanned || !user) return;
    setWorking(true);
    setError('');
    try {
      const { registration, alreadyCheckedIn } = await checkIn(scanned.reg.id, user.personId);
      setScanned({ ...scanned, reg: registration, justCheckedIn: !alreadyCheckedIn });
      if (!alreadyCheckedIn) {
        void notifyInApp({
          personIds: [registration.personId],
          kind: 'checked-in',
          title: `You're checked in to ${scanned.event?.title ?? 'the event'}`,
          message: 'Welcome! Your certificate of participation is ready to download from your event pass.',
          link: `/pass?event=${registration.eventId}`,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-in failed. Try again.');
    } finally {
      setWorking(false);
    }
  }

  async function handleApproveStamp(session: Session) {
    if (!scanned || !user) return;
    setStampBusy(session.id);
    setError('');
    try {
      const existing = scanned.stamps.find((x) => x.sessionId === session.id);
      const pending =
        existing ?? (await createStamp({ sessionId: session.id, attendeeId: scanned.reg.personId, status: 'pending' }));
      const approved = await approveStamp(pending.id, user.personId);
      setScanned((cur) =>
        cur && { ...cur, stamps: [...cur.stamps.filter((x) => x.sessionId !== session.id), approved] },
      );
      setStampJustApproved(session.id);
      void notifyInApp({
        personIds: [scanned.reg.personId],
        kind: 'stamp-approved',
        title: 'Stamp collected! ⭐',
        message: `Your stamp for "${session.title}" was approved by ${user.name}.`,
        link: '/achievements',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not approve the stamp. Try again.');
    } finally {
      setStampBusy(null);
    }
  }

  function scanNext() {
    setScanned(null);
    setError('');
    setStampJustApproved(null);
    lastCode.current = { text: '', at: 0 };
  }

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const q = search.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return [];
    return eventRegs
      .filter((r) => {
        const p = peopleById.get(r.personId);
        return [p?.name, p?.email, p?.studentId, p?.organization].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      })
      .slice(0, 8);
  }, [q, eventRegs, peopleById]);

  const checkedCount = eventRegs.filter((r) => r.checkedIn).length;
  const doorEvent = events.find((e) => e.id === doorEventId);

  const result = scanned && (
    <Paper
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: '20px',
        border: `2px solid ${scanned.reg.checkedIn ? brand.success : alpha(brand.primary, 0.25)}`,
      }}
    >
      {scanned.event && doorEventId && scanned.event.id !== doorEventId && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This pass is for <strong>{scanned.event.title}</strong>, not {doorEvent?.title}.
        </Alert>
      )}
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={scanned.person?.avatarUrl || undefined} sx={{ width: 64, height: 64, fontSize: '1.4rem' }}>
          {initials(scanned.person?.name)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {scanned.person?.name ?? 'Unknown attendee'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {scanned.person ? [memberLabel(scanned.person), affiliation(scanned.person)].filter(Boolean).join(' · ') : scanned.reg.personId}
          </Typography>
          {scanned.person?.email && (
            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
              {scanned.person.email}
            </Typography>
          )}
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
        {scanned.event && <Chip size="small" label={scanned.event.title} sx={{ fontWeight: 600 }} />}
        <Chip size="small" variant="outlined" label={`RSVP: ${scanned.reg.rsvp}`} sx={{ textTransform: 'capitalize' }} />
      </Stack>

      {/* Stamp passport */}
      <Box sx={{ mt: 2.5, p: 2, borderRadius: '14px', bgcolor: alpha(brand.primary, 0.04) }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <StarsRoundedIcon sx={{ color: brand.primary }} fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Stamp passport
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {scanned.stamps.filter((s) => s.status === 'approved').length} of {scanned.stampSessions.length} stamps
          </Typography>
        </Stack>
        {scanned.stampSessions.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            This event has no stamp activities.
          </Typography>
        ) : (
          <>
            <LinearProgress
              variant="determinate"
              value={(100 * scanned.stamps.filter((s) => s.status === 'approved').length) / scanned.stampSessions.length}
              sx={{ height: 6, borderRadius: 3, mb: 1.25 }}
            />
            <Stack spacing={0.75}>
              {orderSessions(scanned.stampSessions).map((s) => {
                const st = scanned.stamps.find((x) => x.sessionId === s.id);
                const approved = st?.status === 'approved';
                const live = isLive(s);
                return (
                  <Stack
                    key={s.id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      p: 1,
                      pl: 1.25,
                      borderRadius: '10px',
                      bgcolor: approved ? alpha(brand.success, 0.08) : '#fff',
                      border: `1px solid ${live && !approved ? alpha(brand.primary, 0.45) : alpha(brand.primary, 0.1)}`,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                        {s.title}
                      </Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {[manilaTime(s.startTime), s.room].filter(Boolean).join(' · ')}
                        </Typography>
                        {live && <Chip size="small" color="primary" label="Now" sx={{ height: 18, fontSize: '0.65rem' }} />}
                        {st?.status === 'pending' && (
                          <Chip size="small" color="warning" label="Requested" sx={{ height: 18, fontSize: '0.65rem' }} />
                        )}
                      </Stack>
                    </Box>
                    {approved ? (
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: brand.success, flexShrink: 0 }}>
                        <CheckCircleRoundedIcon fontSize="small" />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {st?.approvedBy === user?.personId && stampJustApproved === s.id ? 'Approved!' : 'Approved'}
                        </Typography>
                      </Stack>
                    ) : (
                      <Button
                        size="small"
                        variant={live ? 'contained' : 'outlined'}
                        startIcon={stampBusy === s.id ? <CircularProgress size={14} color="inherit" /> : <StarsRoundedIcon />}
                        disabled={Boolean(stampBusy)}
                        onClick={() => handleApproveStamp(s)}
                        sx={{ flexShrink: 0, borderRadius: '10px', whiteSpace: 'nowrap' }}
                      >
                        Approve stamp
                      </Button>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </>
        )}
      </Box>

      {/* Check-in */}
      <Box sx={{ mt: 2.5 }}>
        {scanned.reg.checkedIn ? (
          <Alert
            icon={<CheckCircleRoundedIcon fontSize="inherit" />}
            severity="success"
            sx={{ mb: 1.5, fontWeight: 600 }}
          >
            {scanned.justCheckedIn ? 'Checked in' : 'Already checked in'}
            {manilaTime(scanned.reg.checkedInAt) && ` at ${manilaTime(scanned.reg.checkedInAt)}`}
            {scanned.reg.checkedInBy && !scanned.justCheckedIn
              ? ` by ${peopleById.get(scanned.reg.checkedInBy)?.name ?? 'an officer'}`
              : ''}
            {scanned.reg.certificateId && ` · Certificate ${scanned.reg.certificateId}`}
          </Alert>
        ) : (
          <Button
            fullWidth
            size="large"
            variant="contained"
            color="success"
            startIcon={working ? <CircularProgress size={18} color="inherit" /> : <HowToRegRoundedIcon />}
            onClick={handleCheckIn}
            disabled={working}
            sx={{ py: 1.5, borderRadius: '14px', fontWeight: 800, fontSize: '1.05rem', mb: 1.5 }}
          >
            {working ? 'Checking in…' : 'Check in'}
          </Button>
        )}
        <Button fullWidth variant="outlined" startIcon={<QrCodeScannerRoundedIcon />} onClick={scanNext} sx={{ borderRadius: '14px' }}>
          Scan next
        </Button>
      </Box>
    </Paper>
  );

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/officer')} sx={{ mb: 1 }}>
        Officer Dashboard
      </Button>
      <Typography variant="h1" sx={{ mb: 0.5 }}>
        Check-in Scanner
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Scan an attendee’s QR pass to check them in or approve the stamp for the session they just finished.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2.5 }}>
        <TextField
          select
          size="small"
          label="Event at the door"
          value={doorEventId}
          onChange={(e) => setDoorEventId(e.target.value)}
          sx={{ minWidth: { sm: 340 } }}
        >
          {events.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.title}
            </MenuItem>
          ))}
        </TextField>
        {doorEvent && (
          <Chip
            color="success"
            variant="outlined"
            label={`${checkedCount} of ${eventRegs.filter((r) => r.rsvp !== 'declined').length} checked in`}
            sx={{ fontWeight: 700, alignSelf: { xs: 'flex-start', sm: 'center' } }}
          />
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' }, gap: 3, alignItems: 'start' }}>
        <Box>
          {/* On phones the result replaces the camera so it's visible without scrolling */}
          <Box sx={{ display: !wide && scanned ? 'none' : 'block', position: 'relative' }}>
            <QrScanner onResult={onScan} paused={Boolean(scanned) || looking} />
            {looking && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bgcolor: alpha('#000', 0.4), borderRadius: '20px' }}>
                <CircularProgress sx={{ color: '#fff' }} />
              </Box>
            )}
          </Box>
          {!wide && result}

          {/* Manual fallback */}
          <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: '16px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Can’t scan? Find the attendee
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Name, email, or student ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            {q && (
              <List dense disablePadding sx={{ mt: 1 }}>
                {matches.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    No one registered for this event matches “{search.trim()}”.
                  </Typography>
                ) : (
                  matches.map((r) => {
                    const p = peopleById.get(r.personId);
                    return (
                      <ListItemButton
                        key={r.id}
                        onClick={() => {
                          setSearch('');
                          void open(r.id);
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        <ListItemAvatar>
                          <Avatar src={p?.avatarUrl || undefined} sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                            {initials(p?.name)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={p?.name ?? r.personId} secondary={p?.email} />
                        {r.checkedIn && <CheckCircleRoundedIcon color="success" fontSize="small" />}
                      </ListItemButton>
                    );
                  })
                )}
              </List>
            )}
          </Paper>
        </Box>

        {wide && (
        <Box>
          {result || (
            <Paper
              variant="outlined"
              sx={{ p: 4, borderRadius: '20px', textAlign: 'center', color: 'text.secondary', borderStyle: 'dashed' }}
            >
              <QrCodeScannerRoundedIcon sx={{ fontSize: 48, opacity: 0.4 }} />
              <Typography sx={{ mt: 1 }}>Scan a pass to see the attendee here.</Typography>
            </Paper>
          )}
        </Box>
        )}
      </Box>
    </Box>
  );
}
