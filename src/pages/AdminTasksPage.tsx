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
import { TASK_STATUS_LABELS, type OfficerTask, type TaskStatus } from '../types/task';
import { AdminHeader, EmptyNote, StatRow, StatTile, formatDate, formatDateTime } from '../components/AdminUi';
import { compareOfficers, officerTitle } from '../utils/people';

type Filter = 'open' | 'done' | 'all';

const STATUS_COLOR: Record<TaskStatus, 'default' | 'warning' | 'success'> = {
  todo: 'default',
  'in-progress': 'warning',
  done: 'success',
};

export default function AdminTasksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/home');
      return;
    }
    Promise.all([getUsers(), getEvents(), getTasks()])
      .then(([u, e, t]) => {
        setAllUsers(u);
        setOfficers(u.filter((x) => x.role === 'officer' && (!x.status || x.status === 'approved')).sort(compareOfficers));
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
        dueAt: dueDate ? new Date(`${dueDate}T23:59:00`).toISOString() : undefined,
        createdBy: user.personId,
      });
      setTasks((prev) => [task, ...prev]);
      const forEvent = events.find((e) => e.id === task.eventId);
      void notifyInApp({
        personIds: task.assigneeIds,
        kind: 'task-assigned',
        title: `New task: ${task.title}`,
        message: [forEvent ? `For ${forEvent.title}.` : '', task.dueAt ? `Due ${new Date(task.dueAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' })}.` : '']
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
      await deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the task.');
    }
  }

  const visible = useMemo(
    () =>
      tasks.filter((t) => (filter === 'all' ? true : filter === 'done' ? t.status === 'done' : t.status !== 'done')),
    [tasks, filter],
  );

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <AdminHeader title="Officer Tasks" subtitle="Assign tasks to officers. They see them on their Officer Dashboard." />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <StatRow>
        <StatTile label="To do" value={tasks.filter((t) => t.status === 'todo').length} />
        <StatTile label="In progress" value={tasks.filter((t) => t.status === 'in-progress').length} color={brand.warning} />
        <StatTile label="Done" value={tasks.filter((t) => t.status === 'done').length} color={brand.success} />
      </StatRow>

      {/* Laptop: form on the left, task list on the right */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 5fr) minmax(0, 7fr)' },
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
            <Autocomplete
              multiple
              options={officers}
              value={assignees}
              onChange={(_e, v) => setAssignees(v)}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(a, b) => a.personId === b.personId}
              groupBy={(o) => officerTitle(o).split(' — ')[0]}
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
              <TextField
                label="Due date (optional)"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: { sm: 200 } }}
              />
            </Stack>
            <Box>
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddTaskIcon />}
                disabled={saving || !title.trim() || assignees.length === 0}
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
                      {t.eventId && <Chip size="small" variant="outlined" label={eventTitle(t.eventId) || t.eventId} />}
                      {t.dueAt && <Chip size="small" variant="outlined" label={`Due ${formatDate(t.dueAt)}`} />}
                    </Stack>
                    {t.status === 'done' && t.completedAt && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                        Done {formatDateTime(t.completedAt)}
                        {t.completedBy ? ` by ${nameOf(t.completedBy)}` : ''}
                      </Typography>
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
    </Box>
  );
}
