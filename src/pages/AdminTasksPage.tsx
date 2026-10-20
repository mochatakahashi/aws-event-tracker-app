import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AddTaskIcon from '@mui/icons-material/AddTask';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { getUsers } from '../services/authService';
import { getEvents } from '../services/eventService';
import { createTask, deleteTask, getTasks, updateTask } from '../services/taskService';
import { notifyQuietly } from '../services/notifyService';
import { notifyInApp } from '../services/notificationService';
import { brand } from '../theme/theme';
import type { User } from '../types/auth';
import type { AppEvent } from '../types/event';
import { TASK_STATUS_LABELS, deadlineInfo, isApprovedTask, type OfficerTask, type TaskStatus } from '../types/task';
import TaskRequestsPanel from '../components/TaskRequestsPanel';
import { AdminHeader, EmptyNote, StatRow, StatTile, formatDateTime } from '../components/AdminUi';
import {
  COMMITTEES,
  COMMITTEE_LABELS,
  SUBCOMMITTEE_LABELS,
  compareOfficers,
  officerTitle,
  subcommitteesOf,
} from '../utils/people';
import type { Committee, Subcommittee } from '../types/auth';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ContentTracker from '../components/ContentTracker';
import TaskThread, { DeadlineChip } from '../components/TaskThread';
import { canAssignTo, proposalInScope, taskInScope, taskScope } from '../utils/taskScope';

type Filter = 'open' | 'done' | 'all';

const STATUS_COLOR: Record<TaskStatus, 'default' | 'warning' | 'success'> = {
  todo: 'default',
  'in-progress': 'warning',
  done: 'success',
};

/**
 * Officer tasks by committee. Admins, the President and the VPs see every
 * committee; a committee's Director and Assistant Director see and manage
 * only their committee (at /officer/tasks). The server checks the same rules.
 */
export default function AdminTasksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const scope = taskScope(user);
  // Directors / Assistant Directors lead one committee; VPs lead three; admins and the President all
  const limited = Array.isArray(scope);
  const myCommittees: Committee[] = limited ? scope : COMMITTEES;
  const single = limited && scope.length === 1 ? scope[0] : null;

  const [officers, setOfficers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [tasks, setTasks] = useState<OfficerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('open');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // New task form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState('');
  const [assignees, setAssignees] = useState<User[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('17:00');
  const [committee, setCommittee] = useState<Committee | ''>(single ?? '');
  const [subcommittee, setSubcommittee] = useState<Subcommittee | ''>('');

  // Committee board
  const [tab, setTab] = useState<'all' | Committee>(single ?? 'all');
  const [subFilter, setSubFilter] = useState<Subcommittee | ''>('');
  const [marketingView, setMarketingView] = useState<'tasks' | 'content'>('tasks');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (!scope) {
      navigate('/home');
      return;
    }
    Promise.all([getUsers(), getEvents(), getTasks()])
      .then(([u, e, t]) => {
        setAllUsers(u);
        // Committee leads assign only to their committee's officers
        setOfficers(u.filter((x) => canAssignTo(scope, x)).sort(compareOfficers));
        setEvents(e);
        setTasks(t);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load tasks.'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const nameOf = (id?: string | null) => allUsers.find((u) => u.personId === id)?.name || id || '';
  const eventTitle = (id?: string) => events.find((e) => e.id === id)?.title;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setSaved('');
    try {
      const task = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        eventId: eventId || undefined,
        assigneeIds: assignees.map((a) => a.personId),
        status: 'todo',
        dueAt: dueDate ? new Date(`${dueDate}T${dueTime || '23:59'}:00+08:00`).toISOString() : undefined,
        committee: committee || undefined,
        subcommittee: committee && subcommittee ? subcommittee : undefined,
        kind: 'task',
        createdBy: user.personId,
      });
      setTasks((prev) => [task, ...prev]);
      const forEvent = events.find((e) => e.id === task.eventId);
      void notifyInApp({
        personIds: task.assigneeIds,
        kind: 'task-assigned',
        title: `New task: ${task.title}`,
        message: [
          task.committee ? `${COMMITTEE_LABELS[task.committee]}${task.subcommittee ? ` · ${SUBCOMMITTEE_LABELS[task.subcommittee]}` : ''}.` : '',
          forEvent ? `For ${forEvent.title}.` : '',
          task.dueAt
            ? `Deadline ${new Date(task.dueAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })}.`
            : '',
        ]
          .filter(Boolean)
          .join(' ') || 'Open your Officer Dashboard to see the details.',
        link: '/officer',
      });
      const emailNote = await notifyQuietly({ type: 'task-assigned', taskId: task.id });
      setSaved(`Task assigned to ${assignees.map((a) => a.name).join(', ')}.${emailNote ? ` ${emailNote}` : ''}`);
      setTitle('');
      setDescription('');
      setEventId('');
      setAssignees([]);
      setDueDate('');
      setSubcommittee('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the task.');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(task: OfficerTask, status: TaskStatus) {
    if (!user) return;
    try {
      const updated = await updateTask(task.id, { status }, user.personId);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the task.');
    }
  }

  async function remove(task: OfficerTask) {
    setConfirmDelete(null);
    try {
      await deleteTask(task.id, user!.personId);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the task.');
    }
  }

  // Only what this person leads: every committee, or their own
  const personOf = (id: string) => allUsers.find((u) => u.personId === id);
  const mine = useMemo(() => tasks.filter((t) => taskInScope(t, scope, personOf)), [tasks, allUsers, scope]); // eslint-disable-line react-hooks/exhaustive-deps
  // Officer-added tasks wait in "Tasks officers added" until approved
  const plainTasks = useMemo(() => mine.filter((t) => t.kind !== 'pubmat' && isApprovedTask(t)), [mine]);
  const taskRequests = useMemo(
    () => tasks.filter((t) => t.approval === 'pending' && proposalInScope(t, scope, personOf)),
    [tasks, allUsers, scope], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const pubmats = useMemo(() => mine.filter((t) => t.kind === 'pubmat'), [mine]);
  const visibleCommittees = myCommittees;
  const inTab = useMemo(
    () =>
      plainTasks.filter(
        (t) => (tab === 'all' || t.committee === tab) && (!subFilter || t.subcommittee === subFilter),
      ),
    [plainTasks, tab, subFilter],
  );
  const visible = useMemo(
    () => inTab.filter((t) => (filter === 'all' ? true : filter === 'done' ? t.status === 'done' : t.status !== 'done')),
    [inTab, filter],
  );
  // Officers of the chosen committee first in the picker
  const formCommittee = committee || (tab !== 'all' ? tab : '');
  const pickerOfficers = useMemo(
    () =>
      [...officers].sort(
        (a, b) =>
          Number(b.committee === formCommittee && !!formCommittee) - Number(a.committee === formCommittee && !!formCommittee) ||
          compareOfficers(a, b),
      ),
    [officers, formCommittee],
  );

  function selectTab(next: 'all' | Committee) {
    setTab(next);
    setSubFilter('');
    setCommittee(next === 'all' ? '' : next);
    setSubcommittee('');
  }

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <AdminHeader
        back={user?.role === 'admin' ? undefined : { label: 'Officer Dashboard', to: '/officer' }}
        title={single ? `${COMMITTEE_LABELS[single]} committee tasks` : limited ? 'Committee tasks' : user?.role === 'admin' ? 'Officer Tasks' : 'Committee tasks'}
        subtitle={
          limited
            ? `You assign and monitor tasks for ${single ? `your committee's officers` : myCommittees.map((c) => COMMITTEE_LABELS[c]).join(', ')} and approve the tasks they add. Your tasks go live right away.`
            : 'Assign tasks by committee. Officers see them on their Officer Dashboard and get notified.'
        }
      />

      {user && (
        <TaskRequestsPanel
          requests={taskRequests}
          users={allUsers}
          events={events}
          actorId={user.personId}
          onReviewed={(updated) => setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
        />
      )}

      <Tabs
        value={tab}
        onChange={(_e, v) => selectTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {!single && <Tab value="all" label={`All (${plainTasks.filter((t) => t.status !== 'done').length} open)`} />}
        {visibleCommittees.map((c) => (
          <Tab key={c} value={c} label={COMMITTEE_LABELS[c]} />
        ))}
      </Tabs>
      {tab !== 'all' && (subcommitteesOf(tab).length > 0 || tab === 'marketing') && (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {tab === 'marketing' && (
            <ToggleButtonGroup
              size="small"
              exclusive
              value={marketingView}
              onChange={(_e, v) => v && setMarketingView(v)}
              sx={{ mr: 1 }}
            >
              <ToggleButton value="tasks">Tasks</ToggleButton>
              <ToggleButton value="content">Content Tracker ({pubmats.filter((p) => p.status !== 'done').length})</ToggleButton>
            </ToggleButtonGroup>
          )}
          {!(tab === 'marketing' && marketingView === 'content') && (
            <>
              <Chip label="All sub-committees" color={!subFilter ? 'primary' : 'default'} onClick={() => setSubFilter('')} />
              {subcommitteesOf(tab).map((sc) => (
                <Chip
                  key={sc}
                  label={SUBCOMMITTEE_LABELS[sc]}
                  color={subFilter === sc ? 'primary' : 'default'}
                  onClick={() => {
                    setSubFilter(sc);
                    setSubcommittee(sc);
                  }}
                />
              ))}
            </>
          )}
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {!(tab === 'marketing' && marketingView === 'content') && (
      <StatRow>
        <StatTile label="To do" value={inTab.filter((t) => t.status === 'todo').length} />
        <StatTile label="In progress" value={inTab.filter((t) => t.status === 'in-progress').length} color={brand.warning} />
        <StatTile label="Done" value={inTab.filter((t) => t.status === 'done').length} color={brand.success} />
        <StatTile label="Done on time" value={inTab.filter((t) => deadlineInfo(t).label === 'Done on time').length} color={brand.success} />
        <StatTile label="Overdue / late" value={inTab.filter((t) => deadlineInfo(t).tone === 'late').length} color={brand.error} />
      </StatRow>
      )}

      {tab === 'marketing' && marketingView === 'content' && user ? (
        <ContentTracker
          items={pubmats}
          officers={officers}
          events={events}
          me={user}
          isAdmin
          onChange={(next) => setTasks([...tasks.filter((t) => t.kind !== 'pubmat'), ...next, ...tasks.filter((t) => t.kind === 'pubmat' && !pubmats.some((p) => p.id === t.id))])}
        />
      ) : (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 5fr) minmax(0, 7fr)' },
          gap: { xs: 0, lg: 4 },
          alignItems: 'start',
        }}
      >
      {/* New task (inline form) */}
      <Card variant="outlined" sx={{ mb: 4, borderColor: alpha(brand.primary, 0.3), position: { lg: 'sticky' }, top: { lg: 24 } }}>
        <CardContent component="form" onSubmit={handleCreate}>
          <Typography variant="h3" sx={{ mb: 1.5 }}>
            Assign a task
          </Typography>
          {saved && (
            <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setSaved('')}>
              {saved}
            </Alert>
          )}
          <Stack spacing={1.5}>
            <TextField
              label="Task"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              size="small"
              placeholder="e.g. Prepare registration booth materials"
            />
            <TextField
              label="Details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              size="small"
              multiline
              minRows={2}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                select
                label="Committee"
                disabled={Boolean(single)}
                required={limited}
                value={committee}
                onChange={(e) => {
                  setCommittee(e.target.value as Committee | '');
                  setSubcommittee('');
                }}
                size="small"
                fullWidth
              >
                {!limited && <MenuItem value="">Any / whole org</MenuItem>}
                {visibleCommittees.map((c) => (
                  <MenuItem key={c} value={c}>
                    {COMMITTEE_LABELS[c]}
                  </MenuItem>
                ))}
              </TextField>
              {subcommitteesOf(committee || undefined).length > 0 && (
                <TextField
                  select
                  label="Sub-committee"
                  value={subcommittee}
                  onChange={(e) => setSubcommittee(e.target.value as Subcommittee | '')}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">Whole committee</MenuItem>
                  {subcommitteesOf(committee || undefined).map((sc) => (
                    <MenuItem key={sc} value={sc}>
                      {SUBCOMMITTEE_LABELS[sc]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Stack>
            <Autocomplete
              multiple
              options={pickerOfficers}
              value={assignees}
              onChange={(_e, v) => setAssignees(v)}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(a, b) => a.personId === b.personId}
              groupBy={(o) =>
                formCommittee && o.committee === formCommittee
                  ? `${COMMITTEE_LABELS[formCommittee]} committee`
                  : formCommittee
                    ? 'Other officers'
                    : officerTitle(o).split(' - ')[0]
              }
              renderOption={(props, o) => (
                <li {...props} key={o.personId}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {o.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {officerTitle(o)}
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label="Assign to officers" size="small" placeholder={assignees.length ? '' : 'Pick one or more'} />
              )}
              noOptionsText="No officers yet"
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                select
                label="Event (optional)"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                size="small"
                fullWidth
              >
                <MenuItem value="">No specific event</MenuItem>
                {events.map((ev) => (
                  <MenuItem key={ev.id} value={ev.id}>
                    {ev.title}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Deadline"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 130 }}
              />
            </Stack>
            <Box>
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddTaskIcon />}
                disabled={saving || !title.trim() || assignees.length === 0 || !dueDate || (limited && !committee)}
                sx={{ background: brand.gradient }}
              >
                {saving ? 'Assigning…' : 'Assign task'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Task list */}
      <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 1.5 }}>
        <Typography variant="h3">Tasks</Typography>
        <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_e, v: Filter | null) => v && setFilter(v)}>
          <ToggleButton value="open">Open</ToggleButton>
          <ToggleButton value="done">Done</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {visible.length === 0 ? (
        <EmptyNote>{filter === 'done' ? 'No finished tasks yet.' : 'No open tasks.'}</EmptyNote>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.25 }}>
          {visible.map((t) => (
            <Card key={t.id} variant="outlined">
              <CardContent sx={{ py: '14px !important' }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}
                    >
                      {t.title}
                    </Typography>
                    {t.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, whiteSpace: 'pre-line' }}>
                        {t.description}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      {t.assigneeIds.map((id) => (
                        <Chip key={id} size="small" label={nameOf(id)} />
                      ))}
                      {t.committee && (
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={`${COMMITTEE_LABELS[t.committee]}${t.subcommittee ? ` · ${SUBCOMMITTEE_LABELS[t.subcommittee]}` : ''}`}
                        />
                      )}
                      {t.eventId && <Chip size="small" variant="outlined" label={eventTitle(t.eventId) || t.eventId} />}
                      {t.dueAt && (
                        <Chip
                          size="small"
                          variant="outlined"
                          color={t.status !== 'done' && new Date(t.dueAt) < new Date() ? 'error' : 'default'}
                          label={`Deadline ${formatDateTime(t.dueAt)}`}
                        />
                      )}
                      <DeadlineChip task={t} />
                    </Stack>
                    {t.status === 'done' && t.completedAt && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                        Done {formatDateTime(t.completedAt)}
                        {t.completedBy ? ` by ${nameOf(t.completedBy)}` : ''}
                      </Typography>
                    )}
                    {user && (
                      <TaskThread
                        task={t}
                        me={user}
                        onChange={(updated) => setTasks((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
                      />
                    )}
                  </Box>
                  <Stack alignItems="flex-end" spacing={0.5}>
                    <TextField
                      select
                      size="small"
                      value={t.status}
                      onChange={(e) => changeStatus(t, e.target.value as TaskStatus)}
                      sx={{ minWidth: 128 }}
                      SelectProps={{
                        renderValue: (v) => (
                          <Chip size="small" color={STATUS_COLOR[v as TaskStatus]} label={TASK_STATUS_LABELS[v as TaskStatus]} />
                        ),
                      }}
                    >
                      {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
                        <MenuItem key={s} value={s}>
                          {TASK_STATUS_LABELS[s]}
                        </MenuItem>
                      ))}
                    </TextField>
                    {confirmDelete === t.id ? (
                      <Stack direction="row" spacing={0.5}>
                        <Button size="small" onClick={() => setConfirmDelete(null)}>
                          Keep
                        </Button>
                        <Button size="small" color="error" variant="contained" onClick={() => remove(t)}>
                          Delete
                        </Button>
                      </Stack>
                    ) : (
                      <Tooltip title="Delete task">
                        <IconButton size="small" onClick={() => setConfirmDelete(t.id)} aria-label="Delete task">
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      </Box>
      </Box>
      )}
    </Box>
  );
}
