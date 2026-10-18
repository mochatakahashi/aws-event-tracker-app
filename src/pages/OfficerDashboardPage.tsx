import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getStamps, getSessions } from '../services/sessionService';
import { getPeople } from '../services/registrationService';
import { getTasksForOfficer, updateTask } from '../services/taskService';
import { getUsers } from '../services/authService';
import ContentTracker from '../components/ContentTracker';
import type { User } from '../types/auth';
import { COMMITTEE_LABELS, SUBCOMMITTEE_LABELS } from '../utils/people';
import { getEvents } from '../services/eventService';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { TASK_STATUS_LABELS, type OfficerTask, type TaskStatus } from '../types/task';
import type { AppEvent } from '../types/event';
import { officerTitle } from '../utils/people';
import { canDo, staffEvents } from '../utils/eventStaff';
import { useAuth } from '../context/AuthContext';
import type { Stamp, Session } from '../types/session';
import type { Person } from '../types/attendee';

export default function OfficerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [pendingStamps, setPendingStamps] = useState<Stamp[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<OfficerTask[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [error, setError] = useState('');
  const [officerUsers, setOfficerUsers] = useState<User[]>([]);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'officer') {
      navigate('/home');
      return;
    }

    Promise.all([
      getStamps(),
      getSessions(),
      getPeople(),
      user?.personId ? getTasksForOfficer(user.personId) : Promise.resolve([]),
      getEvents(),
      getUsers().catch(() => [] as User[]),
    ])
      .then(([stmps, sess, ppl, myTasks, evts, users]) => {
        setOfficerUsers(users.filter((u) => u.role === 'officer' || u.role === 'admin'));
        setPendingStamps(stmps.filter(s => s.status === 'pending'));
        setSessions(sess);
        setPeople(ppl);
        setTasks(myTasks);
        setEvents(evts);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your dashboard.'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  async function setTaskStatus(task: OfficerTask, status: TaskStatus) {
    if (!user) return;
    try {
      const updated = await updateTask(task.id, { status }, user.personId);
      setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the task.');
    }
  }

  const plainTasks = tasks.filter(t => t.kind !== 'pubmat');
  const myPubmats = tasks.filter(t => t.kind === 'pubmat');
  // Only stamp requests for events where you're on the stamp team
  const eventOfSession = new Map(sessions.map(s => [s.id, events.find(e => e.id === s.eventId)]));
  const myStampRequests = pendingStamps.filter(st => canDo(user, eventOfSession.get(st.sessionId), 'stamps'));
  const myDutyEvents = staffEvents(user, events).filter(e => e.status !== 'cancelled' && e.status !== 'accomplished');

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        Officer Dashboard
      </Typography>
      {user?.role === 'officer' && (
        <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mb: 3 }}>
          {officerTitle(user)}
        </Typography>
      )}

      <Card
        variant="outlined"
        sx={{ mb: 3, borderRadius: '16px', borderColor: alpha(brand.primary, 0.25), background: alpha(brand.primary, 0.03) }}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', '&:last-child': { pb: 2 } }}>
          <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: alpha(brand.primary, 0.1), color: brand.primary, display: 'flex' }}>
            <QrCodeScannerRoundedIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Event Desk</Typography>
            <Typography variant="body2" color="text.secondary">
              Check people in with the QR scanner, approve their stamps after check-in, and see who’s here — all in one place.
            </Typography>
            {user?.role === 'officer' && (
              myDutyEvents.length === 0 ? (
                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }} data-testid="no-duties">
                  You’re not on the stamp or check-in team for any upcoming event yet. An admin adds you on the event page.
                </Typography>
              ) : (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }} data-testid="my-duties">
                  {myDutyEvents.map(e => (
                    <Chip
                      key={e.id}
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/events/${e.id}`)}
                      label={`${e.title}: ${[canDo(user, e, 'checkin') && 'check-in', canDo(user, e, 'stamps') && 'stamps'].filter(Boolean).join(' + ')}`}
                    />
                  ))}
                </Stack>
              )
            )}
          </Box>
          <Button variant="contained" startIcon={<QrCodeScannerRoundedIcon />} onClick={() => navigate('/officer/scan')}>
            Open Event Desk
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {myPubmats.length > 0 && user && (
        <Box sx={{ mb: 4 }}>
          <ContentTracker
            items={myPubmats}
            officers={officerUsers}
            events={events}
            me={user}
            isAdmin={false}
            onChange={(next) => setTasks([...plainTasks, ...next])}
          />
        </Box>
      )}

      {/* Laptop: tasks and stamp requests side by side */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' }, gap: { xs: 0, lg: 4 }, alignItems: 'start' }}>
      <Box>
      {/* Tasks assigned by an admin */}
      <Typography variant="h3" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentIcon sx={{ color: brand.primary }} /> My Tasks
        {plainTasks.filter(t => t.status !== 'done').length > 0 && (
          <Chip size="small" color="warning" label={`${plainTasks.filter(t => t.status !== 'done').length} open`} />
        )}
      </Typography>
      {plainTasks.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          No tasks assigned to you yet.
        </Typography>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 4 }}>
          {[...plainTasks]
            .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))
            .map(task => {
              const event = events.find(e => e.id === task.eventId);
              return (
                <Card
                  key={task.id}
                  variant="outlined"
                  sx={{
                    borderColor: task.status === 'done' ? alpha(brand.success, 0.4) : alpha(brand.primary, 0.25),
                    opacity: task.status === 'done' ? 0.75 : 1,
                  }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}
                      >
                        {task.title}
                      </Typography>
                      <Chip
                        size="small"
                        color={task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'warning' : 'default'}
                        label={TASK_STATUS_LABELS[task.status]}
                      />
                    </Stack>
                    {task.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                        {task.description}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      {task.committee && (
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={`${COMMITTEE_LABELS[task.committee]}${task.subcommittee ? ` · ${SUBCOMMITTEE_LABELS[task.subcommittee]}` : ''}`}
                        />
                      )}
                      {event && <Chip size="small" variant="outlined" label={event.title} />}
                      {task.dueAt && (
                        <Chip
                          size="small"
                          variant="outlined"
                          color={task.status !== 'done' && new Date(task.dueAt) < new Date() ? 'error' : 'default'}
                          label={`Deadline ${new Date(task.dueAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
                        />
                      )}
                      {task.assigneeIds.length > 1 && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`With ${task.assigneeIds
                            .filter(id => id !== user?.personId)
                            .map(id => people.find(p => p.id === id)?.name || 'another officer')
                            .join(', ')}`}
                        />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                      {task.status === 'todo' && (
                        <Button size="small" variant="outlined" onClick={() => setTaskStatus(task, 'in-progress')}>
                          Start
                        </Button>
                      )}
                      {task.status !== 'done' ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => setTaskStatus(task, 'done')}
                        >
                          Mark done
                        </Button>
                      ) : (
                        <Button size="small" onClick={() => setTaskStatus(task, 'todo')}>
                          Reopen
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
        </Stack>
      )}

      </Box>
      <Box>
      <Typography variant="h3" sx={{ mb: 1 }}>
        Stamp requests
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Stamps are approved in the Event Desk, after the attendee is checked in.
      </Typography>

      {myStampRequests.length === 0 ? (
        <Typography color="text.secondary">No pending stamp requests.</Typography>
      ) : (
        <Stack spacing={1.5} data-testid="stamp-summary">
          {[...new Set(myStampRequests.map(st => eventOfSession.get(st.sessionId)?.id))].map(eid => {
            const ev = events.find(e => e.id === eid);
            const n = myStampRequests.filter(st => eventOfSession.get(st.sessionId)?.id === eid).length;
            return (
              <Card key={eid ?? 'none'} variant="outlined">
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', '&:last-child': { pb: 2 } }}>
                  <Box sx={{ flex: 1, minWidth: 180 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{ev?.title ?? 'Event'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {n} stamp request{n === 1 ? '' : 's'} waiting
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => navigate(`/officer/scan?tab=stamps&event=${eid}`)}
                  >
                    Review in Event Desk
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
      </Box>
      </Box>
    </Box>
  );
}
