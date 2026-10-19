import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import CardActionArea from '@mui/material/CardActionArea';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import FiberNewRoundedIcon from '@mui/icons-material/FiberNewRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import AdminHome from '../components/AdminHome';
import AdviserHome from '../components/AdviserHome';
import { getEvents } from '../services/eventService';
import { getRegistrationsByPerson } from '../services/registrationService';
import { getSessions, getSessionsByEvent, getStampsByAttendee } from '../services/sessionService';
import MyDutiesCard from '../components/MyDutiesCard';
import { isPartnerStaff } from '../utils/eventStaff';
import EventStampCard from '../components/EventStampCard';
import { getNotifications } from '../services/notificationService';
import { getTasksForOfficer } from '../services/taskService';
import { timeAgo } from '../utils/time';
import type { AppEvent } from '../types/event';
import type { Registration } from '../types/attendee';
import type { Session, Stamp } from '../types/session';
import type { AppNotification } from '../types/notification';
import type { OfficerTask } from '../types/task';
import AnnouncementsCard from '../components/AnnouncementsCard';
import AnnouncementBanner from '../components/AnnouncementBanner';

const TZ = 'Asia/Manila';
const dayTime = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-PH', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });

/** "in 3 days", "in 5 h", "tomorrow". */
function untilText(iso: string, now = Date.now()): string {
  const ms = new Date(iso).getTime() - now;
  const hours = Math.round(ms / 3600000);
  if (hours < 1) return 'starting soon';
  if (hours < 24) return `in ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}

function Section({ title, icon, action, children }: { title: string; icon: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: '20px', mb: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Box sx={{ color: brand.primary, display: 'flex' }}>{icon}</Box>
        <Typography variant="h4" sx={{ fontWeight: 800, flex: 1 }}>
          {title}
        </Typography>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

interface UpdateItem {
  id: string;
  at: string;
  title: string;
  text: string;
  link?: string;
  icon: ReactNode;
  unread?: boolean;
}

/** Attendee / officer home: what's happening now, your registrations, and the latest updates. */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { selectedEvent } = useEvent();
  const { user } = useAuth();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  // Events that have stamp activities (their passports show here while live or upcoming)
  const [stampEventIds, setStampEventIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    getSessions()
      .then((all) => setStampEventIds(new Set(all.filter((x) => x.requiresStamp).map((x) => x.eventId))))
      .catch(() => undefined);
  }, []);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [tasks, setTasks] = useState<OfficerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!user || isAdmin) return;
    let alive = true;
    Promise.all([
      getEvents(),
      getRegistrationsByPerson(user.personId),
      getNotifications(user.personId).catch(() => [] as AppNotification[]),
      selectedEvent ? getSessionsByEvent(selectedEvent.id).catch(() => [] as Session[]) : Promise.resolve([] as Session[]),
      getStampsByAttendee(user.personId).catch(() => [] as Stamp[]),
      user.role === 'officer' ? getTasksForOfficer(user.personId).catch(() => [] as OfficerTask[]) : Promise.resolve([] as OfficerTask[]),
    ])
      .then(([ev, rg, nt, se, st, tk]) => {
        if (!alive) return;
        setEvents(ev);
        setRegs(rg);
        setNotifs(nt);
        setSessions(se);
        setStamps(st);
        setTasks(tk);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user, isAdmin, selectedEvent]);

  const now = Date.now();
  const myRegs = useMemo(
    () =>
      regs
        .filter((r) => r.rsvp !== 'declined')
        .map((r) => ({ reg: r, event: events.find((e) => e.id === r.eventId) }))
        .filter((x): x is { reg: Registration; event: AppEvent } => Boolean(x.event))
        .sort((a, b) => a.event.startAt.localeCompare(b.event.startAt)),
    [regs, events],
  );
  const liveRegs = myRegs.filter((x) => x.event.status === 'ongoing');
  const nextRegs = myRegs.filter((x) => x.event.status === 'upcoming');
  const upcomingOpen = events.filter((e) => e.status === 'upcoming' && !regs.some((r) => r.eventId === e.id)).slice(0, 3);

  const updates: UpdateItem[] = useMemo(() => {
    const fromNotifs: UpdateItem[] = notifs.slice(0, 8).map((n) => ({
      id: n.id,
      at: n.createdAt,
      title: n.title,
      text: n.message,
      link: n.link,
      icon: <CampaignRoundedIcon fontSize="small" />,
      unread: !n.read,
    }));
    const twoWeeks = 14 * 24 * 3600 * 1000;
    const fromEvents: UpdateItem[] = events
      .filter((e) => e.createdAt && Date.now() - new Date(e.createdAt).getTime() < twoWeeks && e.status !== 'accomplished')
      .map((e) => ({
        id: `new-${e.id}`,
        at: e.createdAt!,
        title: `New event: ${e.title}`,
        text: `${dayTime(e.startAt)} · ${e.venue}`,
        link: `/events/${e.id}`,
        icon: <FiberNewRoundedIcon fontSize="small" />,
      }));
    return [...fromNotifs, ...fromEvents].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  }, [notifs, events]);

  // Selected event: sessions now / next and stamp progress
  const sessionNow = sessions.find((s) => new Date(s.startTime).getTime() <= now && now <= new Date(s.endTime).getTime());
  const sessionNext = sessions
    .filter((s) => new Date(s.startTime).getTime() > now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
  const stampSessions = sessions.filter((s) => s.requiresStamp);
  const myApproved = stamps.filter((s) => s.status === 'approved' && stampSessions.some((x) => x.id === s.sessionId)).length;

  const openTasks = tasks.filter((t) => t.status !== 'done');
  const nextDeadline = openTasks.filter((t) => t.dueAt).sort((a, b) => a.dueAt!.localeCompare(b.dueAt!))[0];

  if (isAdmin) return <AdminHome />;
  if (user?.role === 'adviser') return <AdviserHome />;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const today = new Date().toLocaleDateString('en-PH', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.25 }}>
        👋 Hey, {user?.firstName || user?.name?.split(' ')[0]}!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {today} · Here's what's happening at AWS SBG-APC
      </Typography>

      {/* New announcements stay at the top for 24 hours */}
      {user && <AnnouncementBanner viewer={user} />}
      {user && isPartnerStaff(user) && <MyDutiesCard user={user} />}
      {/* Earlier announcements */}
      {user && <AnnouncementsCard viewer={user} limit={3} />}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 3fr) minmax(0, 2fr)' }, gap: { xs: 0, lg: 3 }, alignItems: 'start' }}>
        <Box>
          {/* Happening now / next */}
          {liveRegs.length > 0 ? (
            liveRegs.map(({ event, reg }) => (
              <Paper
                key={event.id}
                sx={{ p: 2.5, borderRadius: '20px', mb: 2.5, color: '#fff', background: brand.gradient }}
              >
                <Chip label="● HAPPENING NOW" size="small" sx={{ bgcolor: '#EF4444', color: '#fff', fontWeight: 800, mb: 1 }} />
                <Typography variant="h3" sx={{ color: '#fff', fontWeight: 800 }}>
                  {event.title}
                </Typography>
                <Typography sx={{ color: alpha('#fff', 0.9), mt: 0.5 }}>
                  {reg.checkedIn
                    ? "You're checked in - enjoy the event!"
                    : reg.rsvp === 'pending'
                      ? `Your registration is waiting for approval - ask at the registration booth · ${event.venue}`
                      : `Show your event pass at the registration booth · ${event.venue}`}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/events/${event.id}`)}
                  sx={{
                    mt: 1.5,
                    bgcolor: '#fff',
                    backgroundImage: 'none',
                    color: brand.primary,
                    fontWeight: 800,
                    '&:hover': { bgcolor: alpha('#fff', 0.9), backgroundImage: 'none' },
                  }}
                  endIcon={<ArrowForwardRoundedIcon />}
                >
                  Open event
                </Button>
              </Paper>
            ))
          ) : nextRegs[0] ? (
            <Paper sx={{ p: 2.5, borderRadius: '20px', mb: 2.5, border: `2px solid ${alpha(brand.primary, 0.25)}` }}>
              <Typography variant="overline" sx={{ color: brand.primary, fontWeight: 800 }}>
                Up next for you · {untilText(nextRegs[0].event.startAt)}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                {nextRegs[0].event.title}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} sx={{ mt: 1, color: 'text.secondary' }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <ScheduleRoundedIcon fontSize="small" />
                  <Typography variant="body2">{dayTime(nextRegs[0].event.startAt)}</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PlaceRoundedIcon fontSize="small" />
                  <Typography variant="body2">{nextRegs[0].event.venue}</Typography>
                </Stack>
              </Stack>
              <Typography sx={{ mt: 1.5 }}>
                {nextRegs[0].reg.rsvp === 'pending'
                  ? 'Your registration is waiting for an officer’s approval. Your pass will appear on the event page once it’s approved.'
                  : `See you there, ${user?.firstName || user?.name?.split(' ')[0]}! 🎉 Your event pass is on the event page.`}
              </Typography>
              <Button sx={{ mt: 1 }} endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate(`/events/${nextRegs[0].event.id}`)}>
                Event details & pass
              </Button>
            </Paper>
          ) : (
            <Section title="Nothing scheduled yet" icon={<EventAvailableRoundedIcon />}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                You're not registered for any upcoming event. Register to get your event pass and reminders.
              </Typography>
              {upcomingOpen.map((e) => (
                <CardActionArea key={e.id} onClick={() => navigate(`/events/${e.id}`)} sx={{ p: 1.25, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {e.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dayTime(e.startAt)} · {e.venue}
                  </Typography>
                </CardActionArea>
              ))}
              <Button variant="contained" sx={{ mt: 1 }} onClick={() => navigate('/events')}>
                Browse events
              </Button>
            </Section>
          )}

          {/* At the selected event */}
          {selectedEvent && sessions.length > 0 && (
            <Section
              title={`At ${selectedEvent.title}`}
              icon={<StarsRoundedIcon />}
              action={
                <Button size="small" onClick={() => navigate(`/events/${selectedEvent.id}`)}>
                  Event
                </Button>
              }
            >
              <Stack spacing={1}>
                {sessionNow && (
                  <Typography variant="body2" component="div">
                    <Chip size="small" color="error" label="Now" sx={{ mr: 1 }} />
                    <strong>{sessionNow.title}</strong> · {sessionNow.room} · until {time(sessionNow.endTime)}
                  </Typography>
                )}
                {sessionNext && (
                  <Typography variant="body2" component="div">
                    <Chip size="small" label="Next" sx={{ mr: 1 }} />
                    <strong>{sessionNext.title}</strong> · {time(sessionNext.startTime)} · {sessionNext.room}
                  </Typography>
                )}
                {!sessionNow && !sessionNext && (
                  <Typography variant="body2" color="text.secondary">
                    {sessions.length === 0
                      ? 'This event is one program - no separate sessions.'
                      : 'All sessions are done for this event.'}
                  </Typography>
                )}
                {stampSessions.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Stamp passport · {myApproved} of {stampSessions.length}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(100 * myApproved) / stampSessions.length}
                      sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                    />
                  </Box>
                )}
              </Stack>
            </Section>
          )}

          {/* Stamp passports for your live / upcoming events that have stamps */}
          {[...liveRegs, ...nextRegs]
            .filter((x) => stampEventIds.has(x.event.id) && x.reg.rsvp !== 'declined')
            .slice(0, 2)
            .map((x) => (
              <Box key={x.event.id} data-testid={`dashboard-passport-${x.event.id}`}>
                <EventStampCard event={x.event} title="STAMP PASSPORT" hideWhenEmpty />
              </Box>
            ))}

          {/* Registrations summary */}
          {myRegs.length > 0 && (
            <Section title="Your registrations" icon={<EventAvailableRoundedIcon />}>
              <Stack spacing={1}>
                {myRegs.map(({ event, reg }) => (
                  <CardActionArea
                    key={reg.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${alpha(brand.primary, 0.1)}` }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                          {event.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          {dayTime(event.startAt)} · {event.venue}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        color={reg.checkedIn ? 'success' : event.status === 'accomplished' ? 'default' : 'primary'}
                        variant={reg.checkedIn ? 'filled' : 'outlined'}
                        label={
                          reg.checkedIn
                            ? 'Attended'
                            : event.status === 'accomplished'
                              ? 'Ended'
                              : reg.rsvp === 'pending'
                                ? 'Pending approval'
                                : reg.rsvp === 'declined'
                                  ? 'Declined'
                                  : 'Approved'
                        }
                      />
                    </Stack>
                  </CardActionArea>
                ))}
              </Stack>
            </Section>
          )}
        </Box>

        <Box>
          {/* Officer work */}
          {user?.role === 'officer' && (
            <Section
              title="Your work"
              icon={<AssignmentRoundedIcon />}
              action={
                <Button size="small" onClick={() => navigate('/officer')}>
                  Open
                </Button>
              }
            >
              <Typography variant="body2">
                <strong>{openTasks.length}</strong> open task{openTasks.length === 1 ? '' : 's'}
                {tasks.some((t) => t.kind === 'pubmat' && t.status !== 'done') &&
                  ` · ${tasks.filter((t) => t.kind === 'pubmat' && t.status !== 'done').length} pubmat(s)`}
              </Typography>
              {nextDeadline && (
                <Typography variant="body2" color={new Date(nextDeadline.dueAt!) < new Date() ? 'error' : 'text.secondary'}>
                  Next deadline: {nextDeadline.title} - {dayTime(nextDeadline.dueAt!)}
                </Typography>
              )}
            </Section>
          )}

          {/* Updates feed */}
          <Section
            title="Latest updates"
            icon={<CampaignRoundedIcon />}
            action={
              <Button size="small" onClick={() => navigate('/notifications')}>
                All
              </Button>
            }
          >
            {updates.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No news yet. Stamp approvals, assignments and new events will show up here.
              </Typography>
            ) : (
              <Stack spacing={0.5}>
                {updates.map((u) => (
                  <CardActionArea
                    key={u.id}
                    onClick={() => u.link && navigate(u.link)}
                    sx={{ p: 1, borderRadius: 2, bgcolor: u.unread ? alpha(brand.primary, 0.05) : 'transparent' }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="flex-start">
                      <Avatar sx={{ width: 30, height: 30, bgcolor: alpha(brand.primary, 0.1), color: brand.primary, backgroundImage: 'none' }}>
                        {u.icon}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: u.unread ? 800 : 600 }}>
                          {u.title}
                        </Typography>
                        {u.text && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {u.text}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.disabled">
                          {timeAgo(u.at)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardActionArea>
                ))}
              </Stack>
            )}
          </Section>
        </Box>
      </Box>
    </Box>
  );
}
