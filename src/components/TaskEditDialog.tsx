import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import Alert from '@mui/material/Alert';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { Committee, Subcommittee, User } from '../types/auth';
import type { AppEvent } from '../types/event';
import type { OfficerTask } from '../types/task';
import { updateTask } from '../services/taskService';
import { DateField, TimeField } from './Pickers';
import { notifyInApp } from '../services/notificationService';
import { notifyQuietly } from '../services/notifyService';
import { COMMITTEE_LABELS, SUBCOMMITTEE_LABELS, officerTitle, subcommitteesOf } from '../utils/people';

const toDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) : '');
const toTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' }) : '17:00';
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/**
 * Edit a task after it was assigned: name, details, committee, officers,
 * whole org or an event, and the deadline. The officers on it are notified
 * when the deadline moves or they are added.
 */
export default function TaskEditDialog({
  task,
  officers,
  events,
  committees,
  lockCommittee,
  actorId,
  onClose,
  onSaved,
}: {
  task: OfficerTask | null;
  /** Officers this person may assign. */
  officers: User[];
  events: AppEvent[];
  committees: Committee[];
  /** Directors / Assistant Directors keep their one committee. */
  lockCommittee?: boolean;
  actorId: string;
  onClose: () => void;
  onSaved: (t: OfficerTask) => void;
}) {
  const phone = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [committee, setCommittee] = useState<Committee | ''>('');
  const [subcommittee, setSubcommittee] = useState<Subcommittee | ''>('');
  const [assignees, setAssignees] = useState<User[]>([]);
  const [forWhat, setForWhat] = useState<'org' | 'event'>('org');
  const [eventId, setEventId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('17:00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description || '');
    setCommittee(task.committee || '');
    setSubcommittee(task.subcommittee || '');
    setAssignees(officers.filter((o) => task.assigneeIds.includes(o.personId)));
    setForWhat(task.eventId ? 'event' : 'org');
    setEventId(task.eventId || '');
    setDueDate(toDate(task.dueAt));
    setDueTime(toTime(task.dueAt));
    setError('');
  }, [task, officers]);

  if (!task) return null;
  // People already on the task stay listed even if they aren't in the picker (e.g. another committee)
  const keep = task.assigneeIds.filter((id) => !officers.some((o) => o.personId === id));

  async function save() {
    if (!task) return;
    setError('');
    if (!title.trim()) return setError('The task needs a name.');
    if (assignees.length + keep.length === 0) return setError('Assign at least one officer.');
    if (!dueDate) return setError('Pick a deadline.');
    if (forWhat === 'event' && !eventId) return setError('Pick the event.');
    const dueAt = new Date(`${dueDate}T${dueTime || '23:59'}:00+08:00`).toISOString();
    const assigneeIds = [...keep, ...assignees.map((a) => a.personId)];
    setBusy(true);
    try {
      const updated = await updateTask(
        task.id,
        {
          title: title.trim(),
          description: description.trim(),
          committee: committee || undefined,
          subcommittee: committee && subcommittee ? subcommittee : undefined,
          assigneeIds,
          eventId: forWhat === 'event' ? eventId : '',
          dueAt,
        },
        actorId,
      );
      // Tell the officers what changed
      const added = assigneeIds.filter((id) => !task.assigneeIds.includes(id));
      const stayed = assigneeIds.filter((id) => task.assigneeIds.includes(id));
      const moved = task.dueAt !== dueAt;
      if (added.length) {
        void notifyInApp({ personIds: added, kind: 'task-assigned', title: `New task: ${updated.title}`, message: `Deadline ${when(dueAt)}.`, link: '/officer' });
        // Email only the officers just added
        void notifyQuietly({ type: 'task-assigned', taskId: updated.id, personIds: added });
      }
      const changed = moved || title.trim() !== task.title || description.trim() !== (task.description || '');
      if (stayed.length && changed) {
        void notifyInApp({
          personIds: stayed,
          kind: 'task-assigned',
          title: moved ? `Deadline moved: ${updated.title}` : `Task updated: ${updated.title}`,
          message: moved ? `New deadline ${when(dueAt)}.` : 'The details were updated. Open it to see what changed.',
          link: '/officer',
        });
      }
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the task.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={phone} aria-labelledby="task-edit-title">
      <DialogTitle id="task-edit-title" sx={{ textTransform: 'none', letterSpacing: 0, fontWeight: 800 }}>
        Edit task
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5} data-testid="task-edit-form">
          <TextField size="small" label="Task" value={title} onChange={(e) => setTitle(e.target.value)} required inputProps={{ maxLength: 200 }} />
          <TextField size="small" label="Details" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} inputProps={{ maxLength: 2000 }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              select
              size="small"
              label="Committee"
              value={committee}
              disabled={lockCommittee}
              onChange={(e) => {
                setCommittee(e.target.value as Committee | '');
                setSubcommittee('');
              }}
              fullWidth
            >
              {!lockCommittee && committees.length > 1 && <MenuItem value="">Any committee</MenuItem>}
              {committees.map((c) => (
                <MenuItem key={c} value={c}>
                  {COMMITTEE_LABELS[c]}
                </MenuItem>
              ))}
            </TextField>
            {subcommitteesOf(committee || undefined).length > 0 && (
              <TextField select size="small" label="Sub-committee" value={subcommittee} onChange={(e) => setSubcommittee(e.target.value as Subcommittee | '')} fullWidth>
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
            options={officers}
            value={assignees}
            onChange={(_e, v) => setAssignees(v)}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.personId === b.personId}
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
            renderInput={(params) => <TextField {...params} size="small" label="Assigned officers" />}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              This task is for
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              fullWidth
              value={forWhat}
              onChange={(_e, v: 'org' | 'event' | null) => v && setForWhat(v)}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600 } }}
            >
              <ToggleButton value="org">Whole org</ToggleButton>
              <ToggleButton value="event">An event</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {forWhat === 'event' && (
            <TextField select size="small" label="Event" value={eventId} onChange={(e) => setEventId(e.target.value)} required>
              {events.map((ev) => (
                <MenuItem key={ev.id} value={ev.id}>
                  {ev.title}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Stack direction="row" spacing={1.5}>
            <DateField label="Deadline" value={dueDate} onChange={setDueDate} required testId="edit-due-date" />
            <TimeField label="Time" value={dueTime} onChange={setDueTime} testId="edit-due-time" sx={{ minWidth: { sm: 160 } }} />
          </Stack>
          {task.dueAt && toDate(task.dueAt) !== dueDate && (
            <Typography variant="caption" color="text.secondary">
              Was {when(task.dueAt)}. The officers on it get a notification about the new deadline.
            </Typography>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void save()} disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
