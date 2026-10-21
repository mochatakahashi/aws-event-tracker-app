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
import { checkIn, getPeople, getRegistration, getRegistrationsByEvent, notifyCheckedIn, undoCheckIn } from '../services/registrationService';
import { approveStamp, createStamp, declineStamp, getSessionsByEvent, getStamps, getStampsByAttendee } from '../services/sessionService';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import StampRequestsPanel from '../components/StampRequestsPanel';
import EventAttendeesPanel from '../components/EventAttendeesPanel';
import { FoodDeskPanel, ScanFoodSection } from '../components/FoodDesk';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import { canDo, mayWorkEvents, staffEvents } from '../utils/eventStaff';
import { deskChanged, useDeskCounts } from '../hooks/useDeskCounts';
import { notifyInApp } from '../services/notificationService';
import { affiliation, memberLabel } from '../utils/people';
import { parsePass } from '../utils/pass';
import QrScanner from '../components/QrScanner';
import type { AppEvent } from '../types/event';
import type { Person, Registration } from '../types/attendee';
import type { Session, Stamp } from '../types/session';
import { imageSrc } from '../utils/imageUrl';

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
  const [info, setInfo] = useState('');
  useEffect(() => setInfo(''), [scanned?.reg.id]);
  const [loaded, setLoaded] = useState(false);
  const [deskSessions, setDeskSessions] = useState<Session[]>([]);
  const [deskStamps, setDeskStamps] = useState<Stamp[]>([]);
  const tabParam = params.get('tab');
  const [tab, setTab] = useState<'scan' | 'stamps' | 'attendees' | 'food'>(
    tabParam === 'stamps' || tabParam === 'attendees' || tabParam === 'food' ? tabParam : 'scan',
  );
  const lastCode = useRef<{ text: string; at: number }>({ text: '', at: 0 });

  const isStaff = mayWorkEvents(user);
  const desk = useDeskCounts(user);
  const wide = useMediaQuery(useTheme().breakpoints.up('lg'));

  useEffect(() => {
    if (user && !isStaff) navigate('/home', { replace: true });
  }, [user, isStaff, navigate]);

  useEffect(() => {
    Promise.all([getEvents(), getPeople()])
      .then(([evts, ppl]) => {
        // Officers only see events where they're on the staff list
        const open = staffEvents(user, evts.filter((e) => e.status !== 'cancelled'));
        setEvents(open);
        setPeople(ppl);
        const asked = params.get('event');
        setDoorEventId((cur) => cur || (asked && open.some((e) => e.id === asked) ? asked : defaultEvent(open, selectedEvent?.id)));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load events.'))
      .finally(() => setLoaded(true));
  }, [selectedEvent?.id, user]);

  /** Everything the desk shows for the selected event: registrations, sessions, stamps. */
  const refreshDesk = useCallback(async () => {
    if (!doorEventId) return;
    const [regs, sess, all] = await Promise.all([
      getRegistrationsByEvent(doorEventId).catch(() => [] as Registration[]),
      getSessionsByEvent(doorEventId).catch(() => [] as Session[]),
      getStamps().catch(() => [] as Stamp[]),
    ]);
    const ids = new Set(sess.map((x) => x.id));
    setEventRegs(regs);
    setDeskSessions(sess);
    setDeskStamps(all.filter((x) => ids.has(x.sessionId)));
    // Keep the menu badge in step with what the desk shows
    deskChanged();
  }, [doorEventId]);

  useEffect(() => {
    void refreshDesk();
    // New stamp requests and check-ins by other staff show up without reloading
    const t = window.setInterval(() => void refreshDesk(), 20000);
    return () => window.clearInterval(t);
  }, [refreshDesk, scanned?.reg.checkedIn]);

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
      setTab('scan');
      void open(pass);
      setParams({}, { replace: true });
      return;
    }
    // Links like ?tab=stamps&event=… (from the Officer Dashboard) while the desk is open
    const t = params.get('tab');
    if (t === 'scan' || t === 'stamps' || t === 'attendees' || t === 'food') setTab(t);
    const ev = params.get('event');
    if (ev && events.some((e) => e.id === ev)) setDoorEventId(ev);
  }, [params, isStaff, open, setParams, events]);

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

  // Checked in by mistake
  const [confirmUndo, setConfirmUndo] = useState(false);
  useEffect(() => setConfirmUndo(false), [scanned?.reg.id]);
  async function handleUndo() {
    if (!scanned || !user) return;
    setWorking(true);
    setError('');
    try {
      const { stampsTakenBack, ...registration } = await undoCheckIn(scanned.reg.id, user.personId);
      // Stamps given at this event went back to "asked" on the server: show that here too
      const ids = new Set(scanned.stampSessions.map((x) => x.id));
      const fresh = await getStampsByAttendee(registration.personId).catch(() => null);
      setScanned({
        ...scanned,
        reg: registration,
        justCheckedIn: false,
        stamps: fresh ? fresh.filter((x) => ids.has(x.sessionId)) : scanned.stamps.map((x) => ({ ...x, status: 'pending' as const })),
      });
      setConfirmUndo(false);
      setInfo(
        stampsTakenBack
          ? `Check-in undone. ${stampsTakenBack} stamp${stampsTakenBack === 1 ? '' : 's'} given here went back to “asked” (stamps need check-in).`
          : 'Check-in undone.',
      );
      void refreshDesk();
      deskChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not undo the check-in.');
    } finally {
      setWorking(false);
    }
  }

  async function handleCheckIn(confirmDeclined = false) {
    if (!scanned || !user) return;
    setWorking(true);
    setError('');
    setInfo('');
    try {
      const { registration, alreadyCheckedIn } = await checkIn(scanned.reg.id, user.personId, confirmDeclined);
      setScanned({ ...scanned, reg: registration, justCheckedIn: !alreadyCheckedIn });
      if (!alreadyCheckedIn) {
        void notifyCheckedIn(registration.personId, scanned.event, registration.eventId);
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
      const ask = () => createStamp({ sessionId: session.id, attendeeId: scanned.reg.personId, status: 'pending' });
      const pending = existing ?? (await ask());
      let approved: Stamp;
      try {
        approved = await approveStamp(pending.id, user.personId);
      } catch (err) {
        // Someone removed that request a moment ago: make it again and give it
        if (!existing || !(err instanceof Error) || !/removed|not found/i.test(err.message)) throw err;
        approved = await approveStamp((await ask()).id, user.personId);
      }
      setScanned((cur) =>
        cur && { ...cur, stamps: [...cur.stamps.filter((x) => x.sessionId !== session.id), approved] },
      );
      setStampJustApproved(session.id);
      void refreshDesk();
      void notifyInApp({
        personIds: [scanned.reg.personId],
        kind: 'stamp-approved',
        title: 'Stamp collected! ⭐',
        message: `You got the stamp for "${session.title}" from ${user.name}.`,
        link: '/achievements',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not give the stamp. Try again.');
    } finally {
      setStampBusy(null);
    }
  }

  // A stamp given by mistake: take it back (after a confirm) and tell the attendee
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  useEffect(() => setConfirmRemove(null), [scanned?.reg.id]);
  async function handleRemoveStamp(session: Session) {
    if (!scanned || !user) return;
    const st = scanned.stamps.find((x) => x.sessionId === session.id);
    if (!st) return;
    setStampBusy(session.id);
    setError('');
    try {
      await declineStamp(st.id, user.personId);
      setScanned((cur) => cur && { ...cur, stamps: cur.stamps.filter((x) => x.id !== st.id) });
      setConfirmRemove(null);
      setStampJustApproved(null);
      void refreshDesk();
      void notifyInApp({
        personIds: [scanned.reg.personId],
        kind: 'stamp-declined',
        title: `Stamp removed: ${session.title}`,
        message: `${user.name} removed the stamp for "${session.title}" (given by mistake). Ask the stamp team if you think this is wrong.`,
        link: '/achievements',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove the stamp. Try again.');
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
  // Without a search, list everyone registered (not checked in first) so staff can just tap a name
  const matches = useMemo(() => {
    const going = eventRegs.filter((r) => r.rsvp !== 'declined');
    const found = q
      ? going.filter((r) => {
          const p = peopleById.get(r.personId);
          return [p?.name, p?.email, p?.studentId, p?.organization].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
        })
      : going;
    return [...found].sort(
      (a, b) =>
        Number(a.checkedIn) - Number(b.checkedIn) ||
        (peopleById.get(a.personId)?.name ?? '').localeCompare(peopleById.get(b.personId)?.name ?? ''),
    );
  }, [q, eventRegs, peopleById]);

  const checkedCount = eventRegs.filter((r) => r.checkedIn).length;
  const pendingCount = deskStamps.filter((x) => x.status === 'pending').length;
  const doorEvent = events.find((e) => e.id === doorEventId);
  // Tabs follow your duties at the selected event (admins: all)
  const deskMayStamp = canDo(user, doorEvent, 'stamps');
  const deskMayCheckIn = canDo(user, doorEvent, 'checkin');
  const deskMayFood = Boolean(doorEvent?.food?.enabled) && canDo(user, doorEvent, 'food');
  const shownTab =
    (tab === 'stamps' && !deskMayStamp) || (tab === 'attendees' && !deskMayCheckIn) || (tab === 'food' && !deskMayFood) ? 'scan' : tab;

  const mayCheckIn = canDo(user, scanned?.event, 'checkin');
  const mayStamp = canDo(user, scanned?.event, 'stamps');
  const mayFood = Boolean(scanned?.event?.food?.enabled) && canDo(user, scanned?.event, 'food');

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
        <Avatar src={imageSrc(scanned.person?.avatarUrl)} sx={{ width: 64, height: 64, fontSize: '1.4rem' }}>
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
        <Chip
          size="small"
          variant="outlined"
          color={scanned.reg.rsvp === 'approved' ? 'success' : scanned.reg.rsvp === 'declined' ? 'error' : 'warning'}
          label={scanned.reg.rsvp === 'approved' ? 'Registration accepted' : scanned.reg.rsvp === 'declined' ? 'Registration declined' : 'Waiting for acceptance'}
        />
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
                          <Chip size="small" color="warning" label="Asked for a stamp" sx={{ height: 18, fontSize: '0.65rem' }} />
                        )}
                      </Stack>
                    </Box>
                    {approved && confirmRemove === s.id ? (
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }} data-testid={`remove-stamp-confirm-${s.id}`}>
                        <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>
                          Remove this stamp?
                        </Typography>
                        <Button size="small" onClick={() => setConfirmRemove(null)} disabled={Boolean(stampBusy)}>
                          Keep
                        </Button>
                        <Button size="small" color="error" variant="contained" onClick={() => void handleRemoveStamp(s)} disabled={Boolean(stampBusy)} sx={{ backgroundImage: 'none' }}>
                          Remove
                        </Button>
                      </Stack>
                    ) : approved ? (
                      <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: brand.success }}>
                          <CheckCircleRoundedIcon fontSize="small" />
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {st?.approvedBy === user?.personId && stampJustApproved === s.id ? 'Stamp given!' : `Stamp given${st?.approvedAt ? ` ${manilaTime(st.approvedAt)}` : ''}`}
                          </Typography>
                        </Stack>
                        {mayStamp && (
                          <Button
                            size="small"
                            color="inherit"
                            onClick={() => setConfirmRemove(s.id)}
                            sx={{ p: 0, minWidth: 0, textTransform: 'none', fontSize: '0.72rem', color: 'text.secondary' }}
                            data-testid={`remove-stamp-${s.id}`}
                          >
                            Given by mistake? Remove stamp
                          </Button>
                        )}
                      </Stack>
                    ) : !mayStamp ? (
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {st?.status === 'pending' ? 'Waiting for the stamp team' : 'Not claimed'}
                      </Typography>
                    ) : !scanned.reg.checkedIn ? (
                      <Typography variant="caption" color="warning.main" sx={{ flexShrink: 0, fontWeight: 600 }}>
                        Check in first
                      </Typography>
                    ) : (
                      <Button
                        size="small"
                        variant={live ? 'contained' : 'outlined'}
                        startIcon={stampBusy === s.id ? <CircularProgress size={14} color="inherit" /> : <StarsRoundedIcon />}
                        disabled={Boolean(stampBusy)}
                        onClick={() => handleApproveStamp(s)}
                        sx={{ flexShrink: 0, borderRadius: '10px', whiteSpace: 'nowrap' }}
                      >
                        Give stamp
                      </Button>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </>
        )}
      </Box>

      {/* Food stubs (food team and admins) */}
      {mayFood && user && scanned.event && (
        <ScanFoodSection
          event={scanned.event}
          personId={scanned.reg.personId}
          actorId={user.personId}
          refreshKey={`${scanned.reg.id}:${scanned.reg.checkedIn ? 1 : 0}`}
          nameOf={(id) => peopleById.get(id)?.name}
        />
      )}

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
        ) : null}
        {scanned.reg.checkedIn && mayCheckIn && (
          confirmUndo ? (
            <Alert
              severity="warning"
              sx={{ mb: 1.5 }}
              data-testid="undo-checkin-confirm"
              action={
                <Stack direction="row" spacing={0.5}>
                  <Button color="inherit" size="small" onClick={() => setConfirmUndo(false)} disabled={working}>
                    Keep
                  </Button>
                  <Button color="error" size="small" variant="contained" onClick={() => void handleUndo()} disabled={working} sx={{ backgroundImage: 'none' }}>
                    Undo
                  </Button>
                </Stack>
              }
            >
              Undo {peopleById.get(scanned.reg.personId)?.name?.split(' ')[0] ?? 'their'} check-in? Their pass goes back to not checked in.
            </Alert>
          ) : (
            <Button size="small" color="inherit" onClick={() => setConfirmUndo(true)} sx={{ mb: 1, textTransform: 'none' }} data-testid="undo-checkin">
              Checked in by mistake? Undo check-in
            </Button>
          )
        )}
        {scanned.reg.checkedIn ? null : !mayCheckIn && mayFood ? null : !mayCheckIn ? (
          <Alert severity="info" sx={{ mb: 1.5 }} data-testid="not-checkin-team">
            You’re not on the check-in team for this event, so you can’t check people in here.
          </Alert>
        ) : (
          <Button
            fullWidth
            size="large"
            variant="contained"
            color="success"
            startIcon={working ? <CircularProgress size={18} color="inherit" /> : <HowToRegRoundedIcon />}
            onClick={() => void handleCheckIn(scanned.reg.rsvp === 'declined')}
            disabled={working}
            sx={{ py: 1.5, borderRadius: '14px', fontWeight: 800, fontSize: '1.05rem', mb: 1.5 }}
          >
            {working ? 'Checking in…' : scanned.reg.rsvp === 'declined' ? 'Check in anyway' : 'Check in'}
          </Button>
        )}
        {!scanned.reg.checkedIn && mayCheckIn && scanned.reg.rsvp === 'declined' && (
          <Alert severity="warning" sx={{ mb: 1.5 }} data-testid="declined-warning">
            This registration was <b>declined</b>. Only check them in if they should be at this event; it will accept the registration.
          </Alert>
        )}
        {info && (
          <Alert severity="info" sx={{ mb: 1.5 }} onClose={() => setInfo('')} data-testid="desk-info">
            {info}
          </Alert>
        )}
        <Button fullWidth variant="outlined" startIcon={<QrCodeScannerRoundedIcon />} onClick={scanNext} sx={{ borderRadius: '14px' }}>
          Scan next
        </Button>
      </Box>
    </Paper>
  );

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(user?.role === 'officer' ? '/officer' : '/home')}
        sx={{ mb: 1 }}
      >
        {user?.role === 'admin' ? 'Admin Dashboard' : user?.role === 'officer' ? 'Officer Dashboard' : 'Dashboard'}
      </Button>
      <Typography variant="h1" sx={{ mb: 0.5 }}>
        Event Desk
      </Typography>
      {/* How the desk works, in order */}
      <Box
        data-testid="desk-steps"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          gap: 1,
          mb: 2.5,
        }}
      >
        {[
          { n: 1, title: 'Accept registrations', text: 'Before the event, in the Attendees tab.' },
          { n: 2, title: 'Check in at the door', text: 'Scan the pass. This also accepts them.' },
          { n: 3, title: 'Give stamps', text: 'After each session. Remove one given by mistake.' },
        ].map((st) => (
          <Stack
            key={st.n}
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{ p: 1.25, borderRadius: '12px', bgcolor: alpha(brand.primary, 0.05), border: `1px solid ${alpha(brand.primary, 0.12)}` }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                background: brand.gradient,
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.85rem',
              }}
            >
              {st.n}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                {st.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {st.text}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2.5 }}>
        <TextField
          select
          size="small"
          label="Event"
          value={doorEventId}
          onChange={(e) => setDoorEventId(e.target.value)}
          sx={{ minWidth: { sm: 340 } }}
        >
          {events.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.title}
              {desk.pendingByEvent[e.id] ? ` · ${desk.pendingByEvent[e.id]} stamp request${desk.pendingByEvent[e.id] === 1 ? '' : 's'}` : ''}
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

      {loaded && events.length === 0 && user?.role !== 'admin' && (
        <Alert severity="warning" sx={{ mb: 2 }} data-testid="no-staff-events">
          You’re not on the staff list of any event yet. An admin can tick you for “Give stamps” or “Check people in” on
          the event page.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stamp requests waiting at other events (the menu badge counts every event you work) */}
      {doorEvent && events.some((e) => e.id !== doorEventId && desk.pendingByEvent[e.id]) && (
        <Alert severity="info" sx={{ mb: 2 }} data-testid="other-event-requests">
          Stamp requests are also waiting at{' '}
          {events
            .filter((e) => e.id !== doorEventId && desk.pendingByEvent[e.id])
            .map((e, i, arr) => (
              <span key={e.id}>
                <Button
                  size="small"
                  onClick={() => {
                    setDoorEventId(e.id);
                    setTab('stamps');
                  }}
                  sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline', fontWeight: 700, textTransform: 'none' }}
                >
                  {e.title} ({desk.pendingByEvent[e.id]})
                </Button>
                {i < arr.length - 1 ? ', ' : ''}
              </span>
            ))}
          .
        </Alert>
      )}

      {doorEvent && (
        <Tabs
          value={shownTab}
          onChange={(_e, v) => setTab(v)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ mb: 2.5, borderBottom: `1px solid ${alpha(brand.primary, 0.12)}` }}
        >
          <Tab value="scan" icon={<QrCodeScannerRoundedIcon />} iconPosition="start" label="Scan" />
          {deskMayStamp && (
          <Tab
            value="stamps"
            icon={<StarsRoundedIcon />}
            iconPosition="start"
            label={
              <Badge color="error" badgeContent={pendingCount} sx={{ '& .MuiBadge-badge': { right: -12 } }}>
                Stamp requests
              </Badge>
            }
            sx={{ pr: pendingCount ? 3 : 2 }}
          />
          )}
          {deskMayCheckIn && (
            <Tab value="attendees" icon={<HowToRegRoundedIcon />} iconPosition="start" label={`Attendees ${checkedCount}/${eventRegs.filter((r) => r.rsvp !== 'declined').length}`} />
          )}
          {deskMayFood && <Tab value="food" icon={<RestaurantRoundedIcon />} iconPosition="start" label="Food" data-testid="desk-food-tab" />}
        </Tabs>
      )}

      {doorEvent && shownTab === 'stamps' && user && (
        <StampRequestsPanel
          event={doorEvent}
          sessions={deskSessions}
          stamps={deskStamps}
          regs={eventRegs}
          people={peopleById}
          actor={user}
          onChanged={refreshDesk}
        />
      )}
      {doorEvent && shownTab === 'food' && user && (
        <FoodDeskPanel event={doorEvent} actorId={user.personId} onScan={() => setTab('scan')} nameOf={(id) => peopleById.get(id)?.name} />
      )}
      {doorEvent && shownTab === 'attendees' && user && (
        <EventAttendeesPanel
          event={doorEvent}
          sessions={deskSessions}
          stamps={deskStamps}
          regs={eventRegs}
          people={peopleById}
          actor={user}
          onOpen={(id) => {
            setTab('scan');
            void open(id);
          }}
          onChanged={refreshDesk}
        />
      )}

      <Box sx={{ display: shownTab === 'scan' || !doorEvent ? 'grid' : 'none', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1fr)' }, gap: 3, alignItems: 'start' }}>
        <Box>
          {/* On phones the result replaces the camera so it's visible without scrolling */}
          <Box sx={{ display: !wide && scanned ? 'none' : 'block', position: 'relative' }}>
            {shownTab === 'scan' && <QrScanner onResult={onScan} paused={Boolean(scanned) || looking} />}
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
            {!q && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {matches.length
                  ? `Registered (${matches.length}) - tap a name. Not checked in yet are listed first.`
                  : 'No one has registered for this event yet.'}
              </Typography>
            )}
            {(q || matches.length > 0) && (
              <List dense disablePadding sx={{ mt: 1, maxHeight: 360, overflowY: 'auto' }} data-testid="find-attendee-list">
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
                          <Avatar src={imageSrc(p?.avatarUrl)} sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
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
