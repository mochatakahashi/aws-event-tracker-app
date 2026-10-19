import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddTaskIcon from '@mui/icons-material/AddTask';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { getStamps, getSessions } from '../services/sessionService';
import { getPeople, getRegistrationsByEvent } from '../services/registrationService';
import { deleteTask, getTasksForOfficer, proposeTask, updateTask } from '../services/taskService';
import { getUsers } from '../services/authService';
import { getEvents } from '../services/eventService';
import { notifyInApp } from '../services/notificationService';
import ContentTracker from '../components/ContentTracker';
import StampRequestsPanel from '../components/StampRequestsPanel';
import RegistrationRequestsPanel from '../components/RegistrationRequestsPanel';
import type { User, Committee } from '../types/auth';
import { COMMITTEES, COMMITTEE_LABELS, SUBCOMMITTEE_LABELS, officerTitle } from '../utils/people';
import { TASK_STATUS_LABELS, type OfficerTask, type TaskStatus } from '../types/task';
import type { AppEvent } from '../types/event';
import { canDo, staffEvents } from '../utils/eventStaff';
import { deskChanged } from '../hooks/useDeskCounts';
import { useAuth } from '../context/AuthContext';
import type { Stamp, Session } from '../types/session';
import type { Person, Registration } from '../types/attendee';
import TaskThread, { DeadlineChip } from '../components/TaskThread';
import SignoffPanel from '../components/SignoffPanel';

const when = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

export default function OfficerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<OfficerTask[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [regsByEvent, setRegsByEvent] = useState<Record<string, Registration[]>>({});
  const [error, setError] = useState('');
  const [officerUsers, setOfficerUsers] = useState<User[]>([]);

  // "Add my own task" form
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskEventId, setTaskEventId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('17:00');
  const [taskCommittee, setTaskCommittee] = useState<Committee | ''>('');
  const [savingTask, setSavingTask] = useState(false);
  const [taskNote, setTaskNote] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'officer') navigate('/home');
  }, [user, navigate]);

  // Events where I'm on the staff list, with the duties I have
  const dutyEvents = useMemo(
    () => staffEvents(user, events).filter((e) => e.status !== 'cancelled' && e.status !== 'accomplished'),
    [user, events],
  );
  const stampDutyEvents = useMemo(() => dutyEvents.filter((e) => canDo(user, e, 'stamps')), [user, dutyEvents]);
  const checkinDutyEvents = useMemo(() => dutyEvents.filter((e) => canDo(user, e, 'checkin')), [user, dutyEvents]);

  const load = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'officer')) return;
    try {
      const [stmps, sess, ppl, myTasks, evts, users] = await Promise.all([
        getStamps(),
        getSessions(),
        getPeople(),
        getTasksForOfficer(user.personId),
        getEvents(),
        getUsers().catch(() => [] as User[]),
      ]);
      setOfficerUsers(users.filter((u) => u.role === 'officer' || u.role === 'admin'));
      setStamps(stmps);
      setSessions(sess);
      setPeople(ppl);
      setTasks(myTasks);
      setEvents(evts);
      // Registrations of the events I work (stamp approvals need check-in status, check-in needs approvals)
      const mine = staffEvents(user, evts).filter((e) => e.status !== 'cancelled' && e.status !== 'accomplished');
      const lists = await Promise.all(mine.map((e) => getRegistrationsByEvent(e.id).catch(() => [] as Registration[])));
      setRegsByEvent(Object.fromEntries(mine.map((e, i) => [e.id, lists[i]])));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function refreshDuties() {
    await load();
    deskChanged();
  }

  async function setTaskStatus(task: OfficerTask, status: TaskStatus) {
    if (!user) return;
    try {
      const updated = await updateTask(task.id, { status }, user.personId);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the task.');
    }
  }

  async function removeTask(task: OfficerTask) {
    try {
      await deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove the task.');
    }
  }

  async function addOwnTask(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingTask(true);
    setError('');
    try {
      const dueAt = dueDate ? new Date(`${dueDate}T${dueTime || '17:00'}:00+08:00`).toISOString() : undefined;
      const committee = (taskCommittee || user.committee || undefined) as Committee | undefined;
      const task = await proposeTask(
        { title: title.trim(), description: description.trim() || undefined, eventId: taskEventId || undefined, dueAt, committee },
        user.personId,
        user.role === 'admin',
      );
      setTasks((prev) => [task, ...prev]);
      // Let the admins know there's a task to approve
      const adminIds = officerUsers.filter((u) => u.role === 'admin').map((u) => u.personId);
      if (task.approval === 'pending' && adminIds.length) {
        void notifyInApp({
          personIds: adminIds,
          kind: 'task-proposed',
          title: `${user.name} added a task: ${task.title}`,
          message: 'Approve or decline it in Officer Tasks.',
          link: '/admin/tasks',
        });
      }
      setTaskNote('Task added. It shows as “Waiting for approval” until an admin approves it.');
      setTitle('');
      setDescription('');
      setTaskEventId('');
      setDueDate('');
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the task.');
    } finally {
      setSavingTask(false);
    }
  }

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const plainTasks = tasks.filter((t) => t.kind !== 'pubmat');
  const myPubmats = tasks.filter((t) => t.kind === 'pubmat');
  const openCount = plainTasks.filter((t) => t.status !== 'done' && (!t.approval || t.approval === 'approved')).length;

  // Stamp requests at events where I'm on the stamp team
  const eventOfSession = new Map(sessions.map((s) => [s.id, s.eventId]));
  const stampsAt = (eventId: string) => stamps.filter((st) => eventOfSession.get(st.sessionId) === eventId);
  const pendingStampsAt = (eventId: string) => stampsAt(eventId).filter((st) => st.status === 'pending');
  const stampEventsWithRequests = stampDutyEvents.filter((e) => pendingStampsAt(e.id).length > 0);
  // Registrations waiting at events where I'm on the check-in team
  const pendingRegsAt = (eventId: string) => (regsByEvent[eventId] ?? []).filter((r) => r.rsvp === 'pending');

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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Event duties: only when an admin put me on an event's staff list */}
      {user?.role === 'officer' && dutyEvents.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }} data-testid="no-duties">
          You’re not on the stamp or check-in team for any upcoming event yet. When an admin adds you on the event page, your
          stamp and check-in requests show up here.
        </Alert>
      ) : (
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
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }} data-testid="my-duties">
                  {dutyEvents.map((e) => (
                    <Chip
                      key={e.id}
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/events/${e.id}`)}
                      label={`${e.title}: ${[canDo(user, e, 'checkin') && 'check-in', canDo(user, e, 'stamps') && 'stamps'].filter(Boolean).join(' + ')}`}
                    />
                  ))}
                </Stack>
              )}
            </Box>
            <Button variant="contained" startIcon={<QrCodeScannerRoundedIcon />} onClick={() => navigate('/officer/scan')}>
              Open Event Desk
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Requests for my duties — each shown only if I have that duty somewhere */}
      {(stampDutyEvents.length > 0 || checkinDutyEvents.length > 0) && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              lg: stampDutyEvents.length > 0 && checkinDutyEvents.length > 0 ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
            },
            gap: { xs: 0, lg: 4 },
            alignItems: 'start',
            mb: 2,
          }}
        >
          {stampDutyEvents.length > 0 && (
            <Box sx={{ mb: 3 }} data-testid="stamp-duty-section">
              <Typography variant="h3" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarsRoundedIcon sx={{ color: brand.primary }} /> Stamp requests
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                From events where you’re on the stamp team. Stamps are approved after the attendee is checked in.
              </Typography>
              {stampEventsWithRequests.length === 0 ? (
                <Typography color="text.secondary" data-testid="stamp-summary">
                  No pending stamp requests.
                </Typography>
              ) : (
                <Stack spacing={1.5} data-testid="stamp-summary">
                  {stampEventsWithRequests.map((ev) => {
                    const n = pendingStampsAt(ev.id).length;
                    return (
                      <Card key={ev.id} variant="outlined">
                        <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                            <Box sx={{ flex: 1, minWidth: 180 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{ev.title}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {n} stamp request{n === 1 ? '' : 's'} waiting
                              </Typography>
                            </Box>
                            <Button size="small" startIcon={<CheckCircleIcon />} onClick={() => navigate(`/officer/scan?tab=stamps&event=${ev.id}`)}>
                              Review in Event Desk
                            </Button>
                          </Stack>
                          {user && (
                            <StampRequestsPanel
                              event={ev}
                              sessions={sessions.filter((s) => s.eventId === ev.id)}
                              stamps={stampsAt(ev.id)}
                              regs={regsByEvent[ev.id] ?? []}
                              people={peopleById}
                              actor={user}
                              onChanged={refreshDuties}
                            />
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </Box>
          )}

          {checkinDutyEvents.length > 0 && (
            <Box sx={{ mb: 3 }} data-testid="checkin-duty-section">
              <Typography variant="h3" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HowToRegRoundedIcon sx={{ color: brand.success }} /> Registration & check-in
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                From events where you’re on the check-in team: approve registrations here, and check people in at the Event Desk.
              </Typography>
              <Stack spacing={1.5}>
                {checkinDutyEvents.map((ev) => {
                  const regs = regsByEvent[ev.id] ?? [];
                  const waiting = pendingRegsAt(ev.id);
                  const approved = regs.filter((r) => r.rsvp === 'approved').length;
                  const checked = regs.filter((r) => r.checkedIn).length;
                  return (
                    <Card key={ev.id} variant="outlined">
                      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: waiting.length ? 1.5 : 0 }}>
                          <Box sx={{ flex: 1, minWidth: 180 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{ev.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {waiting.length
                                ? `${waiting.length} registration${waiting.length === 1 ? '' : 's'} waiting for approval`
                                : 'No registrations waiting for approval'}{' '}
                              · {approved} approved · {checked} checked in
                            </Typography>
                          </Box>
                          <Button size="small" startIcon={<QrCodeScannerRoundedIcon />} onClick={() => navigate(`/officer/scan?event=${ev.id}`)}>
                            Check people in
                          </Button>
                        </Stack>
                        {waiting.length > 0 && user && (
                          <RegistrationRequestsPanel event={ev} regs={waiting} people={peopleById} actorId={user.personId} onChanged={refreshDuties} />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>
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

      {user?.role === 'officer' && <SignoffPanel viewer={user} />}

      {/* My tasks: from admins, plus ones I add (an admin approves them) */}
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
        <Typography variant="h3" sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <AssignmentIcon sx={{ color: brand.primary }} /> My Tasks
          {openCount > 0 && <Chip size="small" color="warning" label={`${openCount} open`} />}
        </Typography>
        {!adding && (
          <Button variant="outlined" size="small" startIcon={<AddTaskIcon />} onClick={() => setAdding(true)}>
            Add my own task
          </Button>
        )}
      </Stack>
      {taskNote && (
        <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setTaskNote('')}>
          {taskNote}
        </Alert>
      )}

      {adding && (
        <Card variant="outlined" sx={{ mb: 2.5, borderColor: alpha(brand.primary, 0.3) }}>
          <CardContent component="form" onSubmit={addOwnTask} data-testid="own-task-form">
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Add a task for yourself</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              An admin approves it first; then it’s on your board like any other task.
            </Typography>
            <Stack spacing={1.5}>
              <TextField label="Task" value={title} onChange={(e) => setTitle(e.target.value)} required size="small" inputProps={{ maxLength: 140 }} />
              <TextField
                label="Details (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                size="small"
                multiline
                minRows={2}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                <TextField select label="For event (optional)" value={taskEventId} onChange={(e) => setTaskEventId(e.target.value)} size="small">
                  <MenuItem value="">No specific event</MenuItem>
                  {events
                    .filter((ev) => ev.status !== 'cancelled' && ev.status !== 'accomplished')
                    .map((ev) => (
                      <MenuItem key={ev.id} value={ev.id}>{ev.title}</MenuItem>
                    ))}
                </TextField>
                <TextField
                  select
                  label="Committee"
                  value={taskCommittee || user?.committee || ''}
                  onChange={(e) => setTaskCommittee(e.target.value as Committee)}
                  size="small"
                >
                  <MenuItem value="">None</MenuItem>
                  {COMMITTEES.map((c) => (
                    <MenuItem key={c} value={c}>{COMMITTEE_LABELS[c]}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Deadline date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
                <TextField label="Time" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
              </Box>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={() => setAdding(false)}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={savingTask || !title.trim()}>
                  {savingTask ? 'Adding…' : 'Send for approval'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {plainTasks.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          No tasks yet.
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5, mb: 4, alignItems: 'start' }}>
          {[...plainTasks]
            .sort(
              (a, b) =>
                Number(a.status === 'done') - Number(b.status === 'done') ||
                Number(a.approval === 'declined') - Number(b.approval === 'declined'),
            )
            .map((task) => {
              const event = events.find((e) => e.id === task.eventId);
              const waiting = task.approval === 'pending';
              const declined = task.approval === 'declined';
              return (
                <Card
                  key={task.id}
                  variant="outlined"
                  data-testid={`task-${task.id}`}
                  sx={{
                    borderColor: declined
                      ? alpha(brand.error, 0.4)
                      : waiting
                        ? alpha(brand.warning, 0.6)
                        : task.status === 'done'
                          ? alpha(brand.success, 0.4)
                          : alpha(brand.primary, 0.25),
                    borderStyle: waiting ? 'dashed' : 'solid',
                    opacity: task.status === 'done' || declined ? 0.75 : 1,
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
                      {waiting ? (
                        <Chip size="small" color="warning" variant="outlined" label="Waiting for approval" />
                      ) : declined ? (
                        <Chip size="small" color="error" variant="outlined" label="Not approved" />
                      ) : (
                        <Chip
                          size="small"
                          color={task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'warning' : 'default'}
                          label={TASK_STATUS_LABELS[task.status]}
                        />
                      )}
                    </Stack>
                    {task.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                        {task.description}
                      </Typography>
                    )}
                    {declined && task.reviewNote && (
                      <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                        Admin’s note: {task.reviewNote}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      {task.proposedBy && <Chip size="small" variant="outlined" label="Added by you" />}
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
                          color={task.status !== 'done' && !waiting && !declined && new Date(task.dueAt) < new Date() ? 'error' : 'default'}
                          label={`Deadline ${when(task.dueAt)}`}
                        />
                      )}
                      {!waiting && !declined && <DeadlineChip task={task} />}
                      {task.assigneeIds.length > 1 && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`With ${task.assigneeIds
                            .filter((id) => id !== user?.personId)
                            .map((id) => people.find((p) => p.id === id)?.name || 'another officer')
                            .join(', ')}`}
                        />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                      {waiting || declined ? (
                        <Button size="small" color={declined ? 'inherit' : 'error'} onClick={() => void removeTask(task)}>
                          {declined ? 'Remove' : 'Withdraw'}
                        </Button>
                      ) : (
                        <>
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
                        </>
                      )}
                    </Stack>
                    {!waiting && !declined && user && (
                      <TaskThread
                        task={task}
                        me={user}
                        adminIds={officerUsers.filter((u) => u.role === 'admin').map((u) => u.personId)}
                        onChange={(updated) => setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </Box>
      )}
    </Box>
  );
}
