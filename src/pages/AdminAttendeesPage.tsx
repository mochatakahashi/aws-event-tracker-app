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
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Collapse from '@mui/material/Collapse';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { getEvents } from '../services/eventService';
import { getUsers } from '../services/authService';
import { getAllRegistrations, toggleCheckIn } from '../services/registrationService';
import { getSessions, getStamps } from '../services/sessionService';
import { brand } from '../theme/theme';
import type { AppEvent } from '../types/event';
import type { User } from '../types/auth';
import type { Registration } from '../types/attendee';
import type { Session, Stamp } from '../types/session';
import { AdminHeader, EmptyNote, StatRow, StatTile, formatDateTime } from '../components/AdminUi';
import { downloadExcel, safeFileName, toDate, type ExcelValue } from '../utils/excelExport';
import { memberLabel } from '../utils/people';

/** Columns about the person that every export starts with. */
const PERSON_HEADERS = ['Last Name', 'First Name', 'M.I.', 'Full Name', 'Email', 'Member Type', 'Student ID', 'School / Organization'];

function personCells(p: User | undefined, fallbackId: string): ExcelValue[] {
  if (!p) return ['', '', '', `Unknown (${fallbackId})`, '', '', '', ''];
  return [
    p.lastName || '',
    p.firstName || '',
    p.middleInitial || '',
    p.name,
    p.email || p.username,
    memberLabel(p),
    p.memberType === 'outside' ? '' : p.studentId || '',
    p.memberType === 'outside' ? p.organization || '' : 'Asia Pacific College',
  ];
}

function byLastName(a?: User, b?: User) {
  return (a?.lastName || a?.name || '').localeCompare(b?.lastName || b?.name || '');
}

export default function AdminAttendeesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedEvent } = useEvent();

  const [events, setEvents] = useState<AppEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [eventId, setEventId] = useState('');
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [openSession, setOpenSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/home');
      return;
    }
    Promise.all([getEvents(), getUsers(), getAllRegistrations(), getSessions(), getStamps()])
      .then(([evts, usrs, regs, sess, stmps]) => {
        setEvents(evts);
        setUsers(usrs);
        setRegistrations(regs);
        setSessions(sess);
        setStamps(stmps);
        const withStamps = evts.find((e) => sess.some((s) => s.eventId === e.id && s.requiresStamp));
        setEventId(selectedEvent?.id && evts.some((e) => e.id === selectedEvent.id) ? selectedEvent.id : withStamps?.id || evts[0]?.id || '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load data.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const event = events.find((e) => e.id === eventId);
  const userById = useMemo(() => new Map(users.map((u) => [u.personId, u])), [users]);
  const userName = (id?: string) => (id ? userById.get(id)?.name || id : '');

  const eventRegs = useMemo(
    () => registrations.filter((r) => r.eventId === eventId).sort((a, b) => byLastName(userById.get(a.personId), userById.get(b.personId))),
    [registrations, eventId, userById],
  );
  const eventSessions = useMemo(
    () => sessions.filter((s) => s.eventId === eventId).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [sessions, eventId],
  );
  const stampSessions = eventSessions.filter((s) => s.requiresStamp);
  const sessionIds = new Set(stampSessions.map((s) => s.id));
  const eventStamps = stamps.filter((s) => sessionIds.has(s.sessionId));
  const approvedStamps = eventStamps.filter((s) => s.status === 'approved');

  /** personId → (sessionId → stamp) for approved stamps in this event. */
  const doneBy = useMemo(() => {
    const map = new Map<string, Map<string, Stamp>>();
    for (const s of approvedStamps) {
      if (!map.has(s.attendeeId)) map.set(s.attendeeId, new Map());
      map.get(s.attendeeId)!.set(s.sessionId, s);
    }
    return map;
  }, [approvedStamps]);

  const finisherIds = [...doneBy.entries()]
    .filter(([, done]) => stampSessions.length > 0 && done.size === stampSessions.length)
    .map(([id]) => id)
    .sort((a, b) => byLastName(userById.get(a), userById.get(b)));

  const q = search.trim().toLowerCase();
  const matches = (p?: User) =>
    !q ||
    [p?.name, p?.email, p?.studentId, p?.organization].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));

  async function handleToggleCheckIn(reg: Registration) {
    try {
      const updated = await toggleCheckIn(reg.id, user?.personId);
      setRegistrations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update check-in.');
    }
  }

  async function exportAttendees() {
    if (!event) return;
    setExporting(true);
    try {
      await downloadExcel(`${safeFileName(event.title)}-attendees`, [
        {
          name: 'Attendees',
          headers: [...PERSON_HEADERS, 'RSVP', 'Checked In', 'Registered At', `Stamps (${stampSessions.length} required)`],
          rows: eventRegs.map((r) => [
            ...personCells(userById.get(r.personId), r.personId),
            r.rsvp,
            r.checkedIn ? 'Yes' : 'No',
            toDate(r.registeredAt),
            doneBy.get(r.personId)?.size ?? 0,
          ]),
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setExporting(false);
    }
  }

  async function exportStamps() {
    if (!event) return;
    setExporting(true);
    try {
      const people = [...doneBy.keys()].sort((a, b) => byLastName(userById.get(a), userById.get(b)));
      await downloadExcel(`${safeFileName(event.title)}-stamp-finishers`, [
        {
          name: 'Summary',
          headers: [...PERSON_HEADERS, ...stampSessions.map((s) => s.title), 'Sessions Completed', 'Finished All'],
          rows: people.map((id) => {
            const done = doneBy.get(id)!;
            return [
              ...personCells(userById.get(id), id),
              ...stampSessions.map((s) => toDate(done.get(s.id)?.approvedAt) ?? (done.has(s.id) ? 'Completed' : '')),
              `${done.size}/${stampSessions.length}`,
              done.size === stampSessions.length ? 'Yes' : 'No',
            ];
          }),
        },
        {
          name: 'Finished All Sessions',
          headers: [...PERSON_HEADERS, 'Last Stamp Approved'],
          rows: finisherIds.map((id) => {
            const last = [...doneBy.get(id)!.values()].map((s) => s.approvedAt || '').sort().pop();
            return [...personCells(userById.get(id), id), toDate(last)];
          }),
        },
        ...stampSessions.map((s) => ({
          name: s.title,
          headers: [...PERSON_HEADERS, 'Approved At', 'Approved By'],
          rows: approvedStamps
            .filter((st) => st.sessionId === s.id)
            .sort((a, b) => byLastName(userById.get(a.attendeeId), userById.get(b.attendeeId)))
            .map((st) => [...personCells(userById.get(st.attendeeId), st.attendeeId), toDate(st.approvedAt), userName(st.approvedBy)]),
        })),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <AdminHeader
        title="Attendees & Achievements"
        subtitle="Who registered, who checked in, and who finished each session's stamp."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TextField
        select
        fullWidth
        size="small"
        label="Event"
        value={eventId}
        onChange={(e) => {
          setEventId(e.target.value);
          setOpenSession(null);
        }}
        sx={{ mb: 2, bgcolor: 'background.paper' }}
      >
        {events.map((e) => (
          <MenuItem key={e.id} value={e.id}>
            {e.title}
          </MenuItem>
        ))}
      </TextField>

      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v)}
        variant="fullWidth"
        sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<HowToRegIcon />} iconPosition="start" label="Attendees" sx={{ minHeight: 48 }} />
        <Tab icon={<EmojiEventsRoundedIcon />} iconPosition="start" label="Stamps & Finishers" sx={{ minHeight: 48 }} />
      </Tabs>

      {tab === 0 ? (
        <>
          <StatRow>
            <StatTile label="Registered" value={eventRegs.length} />
            <StatTile label="Checked in" value={eventRegs.filter((r) => r.checkedIn).length} color={brand.success} />
            <StatTile
              label="APC / Outside"
              value={`${eventRegs.filter((r) => userById.get(r.personId)?.memberType !== 'outside').length} / ${
                eventRegs.filter((r) => userById.get(r.personId)?.memberType === 'outside').length
              }`}
              color={brand.primaryLight}
            />
            <StatTile label="Pending approval" value={eventRegs.filter((r) => r.rsvp === 'pending').length} color={brand.warning} />
          </StatRow>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search name, email, student ID, organization…"
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
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportAttendees}
              disabled={exporting || eventRegs.length === 0}
              sx={{ background: brand.gradient, whiteSpace: 'nowrap' }}
            >
              Download Excel
            </Button>
          </Stack>

          {eventRegs.length === 0 ? (
            <EmptyNote>No one has registered for this event yet.</EmptyNote>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5, alignItems: 'start' }}>
              {eventRegs
                .filter((r) => matches(userById.get(r.personId)))
                .map((r) => {
                  const p = userById.get(r.personId);
                  const done = doneBy.get(r.personId)?.size ?? 0;
                  return (
                    <Card key={r.id} variant="outlined">
                      <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', py: '12px !important' }}>
                        <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                            {p?.name || r.personId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                            {p?.email || p?.username} ·{' '}
                            {p?.memberType === 'outside' ? p.organization || 'Outside' : p?.studentId || 'APC'}
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                            <Chip size="small" label={p ? memberLabel(p) : 'Unknown'} />
                            <Chip size="small" variant="outlined" label={`Status: ${r.rsvp}`} />
                            {stampSessions.length > 0 && (
                              <Chip
                                size="small"
                                variant="outlined"
                                color={done === stampSessions.length ? 'success' : 'default'}
                                label={`Stamps ${done}/${stampSessions.length}`}
                              />
                            )}
                          </Stack>
                        </Box>
                        <Button
                          size="small"
                          variant={r.checkedIn ? 'contained' : 'outlined'}
                          color={r.checkedIn ? 'success' : 'primary'}
                          onClick={() => handleToggleCheckIn(r)}
                          sx={{ minWidth: 118 }}
                        >
                          {r.checkedIn ? 'Checked in' : 'Check in'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
            </Box>
          )}
        </>
      ) : (
        <>
          <StatRow>
            <StatTile label="Stamp sessions" value={stampSessions.length} />
            <StatTile label="Approved stamps" value={approvedStamps.length} color={brand.success} />
            <StatTile label="Waiting for approval" value={eventStamps.filter((s) => s.status === 'pending').length} color={brand.warning} />
            <StatTile label="Finished all sessions" value={finisherIds.length} color={brand.primaryLight} />
          </StatRow>

          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportStamps}
              disabled={exporting || approvedStamps.length === 0}
              sx={{ background: brand.gradient }}
            >
              Download Excel for profs
            </Button>
          </Stack>

          {stampSessions.length === 0 ? (
            <EmptyNote>This event has no sessions that need a stamp.</EmptyNote>
          ) : (
            <>
              <Stack spacing={1.25} sx={{ mb: 3 }}>
                {stampSessions.map((s) => {
                  const approved = approvedStamps
                    .filter((st) => st.sessionId === s.id)
                    .sort((a, b) => byLastName(userById.get(a.attendeeId), userById.get(b.attendeeId)));
                  const pendingCount = eventStamps.filter((st) => st.sessionId === s.id && st.status === 'pending').length;
                  const base = Math.max(eventRegs.length, approved.length, 1);
                  const open = openSession === s.id;
                  return (
                    <Card key={s.id} variant="outlined">
                      <CardContent sx={{ py: '14px !important' }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          onClick={() => setOpenSession(open ? null : s.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {s.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {approved.length} finished · {pendingCount} waiting for approval
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, (approved.length / base) * 100)}
                              sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: alpha(brand.primary, 0.08) }}
                            />
                          </Box>
                          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </Stack>
                        <Collapse in={open} unmountOnExit>
                          <Box sx={{ mt: 1.5 }}>
                            {approved.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                No approved stamps yet.
                              </Typography>
                            ) : (
                              <Stack spacing={0.75}>
                                {approved.filter((st) => matches(userById.get(st.attendeeId))).map((st) => {
                                  const p = userById.get(st.attendeeId);
                                  return (
                                    <Box
                                      key={st.id}
                                      sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(brand.success, 0.06), display: 'flex', flexWrap: 'wrap', gap: 1 }}
                                    >
                                      <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                          {p?.name || st.attendeeId}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                          {p?.memberType === 'outside' ? p.organization : p?.studentId} · {p?.email || p?.username}
                                        </Typography>
                                      </Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                        {formatDateTime(st.approvedAt)}
                                        {st.approvedBy ? ` · by ${userName(st.approvedBy)}` : ''}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                              </Stack>
                            )}
                          </Box>
                        </Collapse>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>

              <Typography variant="h3" sx={{ mb: 1.5 }}>
                Finished all sessions ({finisherIds.length})
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="Search finishers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 1.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              {finisherIds.length === 0 ? (
                <EmptyNote>No one has finished every stamp session yet.</EmptyNote>
              ) : (
                <Stack spacing={1}>
                  {finisherIds
                    .filter((id) => matches(userById.get(id)))
                    .map((id) => {
                      const p = userById.get(id);
                      return (
                        <Card key={id} variant="outlined" sx={{ borderColor: alpha(brand.success, 0.4) }}>
                          <CardContent sx={{ py: '10px !important', display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <EmojiEventsRoundedIcon sx={{ color: brand.success }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                                {p?.name || id}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                {p ? memberLabel(p) : ''} · {p?.memberType === 'outside' ? p.organization : p?.studentId} · {p?.email || p?.username}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                </Stack>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}
