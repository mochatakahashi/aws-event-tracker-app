import { useMemo, useState, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { createTask, deleteTask, updateTask } from '../services/taskService';
import { notifyInApp } from '../services/notificationService';
import { notifyQuietly } from '../services/notifyService';
import {
  CAPTION_GUIDELINES_URL,
  PUBMAT_STAGES,
  PUBMAT_STAGE_LABELS,
  pubmatPeople,
  statusForStage,
  type OfficerTask,
  type Pubmat,
  type PubmatStage,
} from '../types/task';
import type { User } from '../types/auth';
import type { AppEvent } from '../types/event';
import { SUBCOMMITTEE_LABELS } from '../utils/people';
import TaskThread from './TaskThread';

const STAGE_COLOR: Record<PubmatStage, string> = {
  'not-started': '#9CA3AF',
  'in-progress': brand.warning,
  'for-review': '#3B82F6',
  approved: '#8B5CF6',
  posted: brand.success,
};

const ROLES: { key: keyof Pick<Pubmat, 'designeeIds' | 'captionWriterIds' | 'posterIds'>; label: string; verb: string }[] = [
  { key: 'designeeIds', label: 'Creatives designee', verb: 'design' },
  { key: 'captionWriterIds', label: 'Caption writer', verb: 'write the caption for' },
  { key: 'posterIds', label: 'Poster', verb: 'post' },
];

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }) : '';
const toDateInput = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) : '');

interface Props {
  items: OfficerTask[];
  officers: User[];
  events: AppEvent[];
  me: User;
  /** Admins add, assign and delete; officers update their own items. */
  isAdmin: boolean;
  onChange: (items: OfficerTask[]) => void;
}

/** Marketing Content Tracker - the pubmat sheet, inside the app. */
export default function ContentTracker({ items, officers, events, me, isAdmin, onChange }: Props) {
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  // New pubmat form
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [eventId, setEventId] = useState('');
  const [postDate, setPostDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [people, setPeople] = useState<Record<string, User[]>>({ designeeIds: [], captionWriterIds: [], posterIds: [] });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const nameOf = (id: string) => officers.find((o) => o.personId === id)?.name || 'Unknown';
  const eventTitle = (id?: string) => events.find((e) => e.id === id)?.title;

  // Marketing officers first in the pickers
  const sortedOfficers = useMemo(
    () => [...officers].sort((a, b) => Number(b.committee === 'marketing') - Number(a.committee === 'marketing')),
    [officers],
  );
  const usedEvents = useMemo(
    () => events.filter((e) => items.some((i) => i.eventId === e.id)),
    [events, items],
  );
  const visible = items
    .filter((i) => eventFilter === 'all' || i.eventId === eventFilter || (eventFilter === 'none' && !i.eventId))
    .sort((a, b) => (a.pubmat?.postDate || '9999').localeCompare(b.pubmat?.postDate || '9999'));

  function announce(task: OfficerTask, personIds?: string[]) {
    const p = task.pubmat;
    if (!p) return;
    for (const role of ROLES) {
      const targets = p[role.key].filter((id) => !personIds || personIds.includes(id));
      if (targets.length === 0) continue;
      void notifyInApp({
        personIds: targets,
        kind: 'task-assigned',
        title: `Pubmat: ${task.title}`,
        message: `You're the ${role.label.toLowerCase()} - please ${role.verb} this pubmat${p.postDate ? ` (post date ${fmtDate(p.postDate)})` : ''}.`,
        link: '/officer',
      });
    }
    void notifyQuietly({ type: 'task-assigned', taskId: task.id, personIds });
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const pubmat: Pubmat = {
        details: details.trim() || undefined,
        designeeIds: people.designeeIds.map((u) => u.personId),
        captionWriterIds: people.captionWriterIds.map((u) => u.personId),
        posterIds: people.posterIds.map((u) => u.personId),
        stage: 'not-started',
        postDate: postDate ? new Date(`${postDate}T09:00:00+08:00`).toISOString() : undefined,
        notes: notes.trim() || undefined,
      };
      const task = await createTask({
        title: title.trim(),
        description: details.trim() || undefined,
        eventId: eventId || undefined,
        assigneeIds: pubmatPeople(pubmat),
        status: 'todo',
        dueAt: deadline ? new Date(`${deadline}T23:59:00+08:00`).toISOString() : undefined,
        committee: 'marketing',
        subcommittee: 'creatives',
        kind: 'pubmat',
        pubmat,
        createdBy: me.personId,
      });
      onChange([task, ...items]);
      announce(task);
      setNote(`Added "${task.title}"${task.assigneeIds.length ? ' and notified the assigned officers' : ''}.`);
      setTitle('');
      setDetails('');
      setPostDate('');
      setDeadline('');
      setNotes('');
      setPeople({ designeeIds: [], captionWriterIds: [], posterIds: [] });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the pubmat.');
    } finally {
      setSaving(false);
    }
  }

  async function patch(task: OfficerTask, changes: Partial<Pubmat>) {
    if (!task.pubmat) return;
    const next = { ...task.pubmat, ...changes };
    const added = pubmatPeople(next).filter((id) => !task.assigneeIds.includes(id));
    try {
      const updated = await updateTask(
        task.id,
        { pubmat: next, assigneeIds: pubmatPeople(next), status: statusForStage(next.stage) },
        me.personId,
      );
      onChange(items.map((t) => (t.id === updated.id ? updated : t)));
      if (added.length) announce(updated, added);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the change.');
    }
  }

  async function remove(task: OfficerTask) {
    try {
      await deleteTask(task.id, me.personId);
      onChange(items.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the pubmat.');
    }
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            Content Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pubmats for Marketing - {SUBCOMMITTEE_LABELS.creatives} designs, caption writers and posters.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<DescriptionOutlinedIcon />}
            endIcon={<OpenInNewRoundedIcon fontSize="small" />}
            href={CAPTION_GUIDELINES_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Caption guidelines
          </Button>
          {isAdmin && !showForm && (
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setShowForm(true)}>
              Add pubmat
            </Button>
          )}
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {note && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNote('')}>
          {note}
        </Alert>
      )}

      {isAdmin && (
        <Collapse in={showForm}>
          <Paper component="form" onSubmit={add} variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: '16px' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              New pubmat
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, columnGap: 1.5 }}>
              <TextField size="small" margin="dense" label="Content" placeholder="Pubmat 1: Teaser" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <TextField select size="small" margin="dense" label="Event" value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <MenuItem value="">No specific event</MenuItem>
                {events.map((ev) => (
                  <MenuItem key={ev.id} value={ev.id}>
                    {ev.title}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              size="small"
              margin="dense"
              label="Details / reference post"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(3, minmax(0, 1fr))' }, columnGap: 1.5 }}>
              {ROLES.map((role) => (
                <Autocomplete
                  key={role.key}
                  multiple
                  size="small"
                  options={sortedOfficers}
                  groupBy={(o) => (o.committee === 'marketing' ? 'Marketing' : 'Other officers')}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(a, b) => a.personId === b.personId}
                  value={people[role.key]}
                  onChange={(_e, v) => setPeople((p) => ({ ...p, [role.key]: v }))}
                  renderInput={(params) => <TextField {...params} margin="dense" label={role.label} />}
                />
              ))}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '1fr 1fr 2fr' }, columnGap: 1.5 }}>
              <TextField size="small" margin="dense" type="date" label="Post date" value={postDate} onChange={(e) => setPostDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField size="small" margin="dense" type="date" label="Draft deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField size="small" margin="dense" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Box>
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1.5 }}>
              <Button onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving || !title.trim()}>
                {saving ? 'Adding…' : 'Add & notify'}
              </Button>
            </Stack>
          </Paper>
        </Collapse>
      )}

      {/* Event "sheets" */}
      {usedEvents.length > 0 && (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          <Chip label={`All (${items.length})`} color={eventFilter === 'all' ? 'primary' : 'default'} onClick={() => setEventFilter('all')} />
          {usedEvents.map((ev) => (
            <Chip
              key={ev.id}
              label={`${ev.title} (${items.filter((i) => i.eventId === ev.id).length})`}
              color={eventFilter === ev.id ? 'primary' : 'default'}
              onClick={() => setEventFilter(ev.id)}
            />
          ))}
        </Stack>
      )}

      {visible.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: '16px', borderStyle: 'dashed', color: 'text.secondary' }}>
          {isAdmin ? 'No pubmats yet. Add the first one above.' : 'No pubmats are assigned to you right now.'}
        </Paper>
      ) : (
        <Stack spacing={1.25}>
          {visible.map((t) => {
            const p = t.pubmat!;
            const mine = pubmatPeople(p).includes(me.personId);
            const canEdit = isAdmin || mine;
            return (
              <Paper
                key={t.id}
                variant="outlined"
                sx={{ p: 2, borderRadius: '14px', borderLeft: `5px solid ${STAGE_COLOR[p.stage]}` }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'flex-start' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        {t.title}
                      </Typography>
                      {eventTitle(t.eventId) && <Chip size="small" variant="outlined" label={eventTitle(t.eventId)} />}
                    </Stack>
                    {p.details && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                        {p.details}
                      </Typography>
                    )}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1, mt: 1.25 }}>
                      {ROLES.map((role) =>
                        isAdmin ? (
                          <Autocomplete
                            key={role.key}
                            multiple
                            size="small"
                            options={sortedOfficers}
                            groupBy={(o) => (o.committee === 'marketing' ? 'Marketing' : 'Other officers')}
                            getOptionLabel={(o) => o.name}
                            isOptionEqualToValue={(a, b) => a.personId === b.personId}
                            value={officers.filter((o) => p[role.key].includes(o.personId))}
                            onChange={(_e, v) => void patch(t, { [role.key]: v.map((u) => u.personId) })}
                            renderInput={(params) => <TextField {...params} label={role.label} />}
                          />
                        ) : (
                          <Box key={role.key}>
                            <Typography variant="caption" color="text.secondary">
                              {role.label}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: p[role.key].includes(me.personId) ? 800 : 500 }}>
                              {p[role.key].length ? p[role.key].map(nameOf).join(', ') : '-'}
                              {p[role.key].includes(me.personId) && ' (you)'}
                            </Typography>
                          </Box>
                        ),
                      )}
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1, mt: 1 }}>
                      <TextField
                        size="small"
                        label="File / link"
                        placeholder="https://www.canva.com/…"
                        defaultValue={p.fileLink || ''}
                        disabled={!canEdit}
                        onBlur={(e) => e.target.value.trim() !== (p.fileLink || '') && void patch(t, { fileLink: e.target.value.trim() || undefined })}
                        InputProps={{
                          endAdornment: p.fileLink ? (
                            <Tooltip title="Open">
                              <IconButton size="small" component="a" href={p.fileLink} target="_blank" rel="noopener noreferrer">
                                <OpenInNewRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : undefined,
                        }}
                      />
                      <TextField
                        size="small"
                        label="Notes"
                        defaultValue={p.notes || ''}
                        disabled={!canEdit}
                        onBlur={(e) => e.target.value.trim() !== (p.notes || '') && void patch(t, { notes: e.target.value.trim() || undefined })}
                      />
                    </Box>
                  </Box>
                  <Stack spacing={1} sx={{ minWidth: { md: 200 } }}>
                    <TextField
                      select
                      size="small"
                      label="Status"
                      value={p.stage}
                      disabled={!canEdit}
                      onChange={(e) => void patch(t, { stage: e.target.value as PubmatStage })}
                      sx={{ '& .MuiSelect-select': { color: STAGE_COLOR[p.stage], fontWeight: 700 } }}
                    >
                      {PUBMAT_STAGES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {PUBMAT_STAGE_LABELS[s]}
                        </MenuItem>
                      ))}
                    </TextField>
                    {isAdmin ? (
                      <TextField
                        size="small"
                        type="date"
                        label="Post date"
                        InputLabelProps={{ shrink: true }}
                        value={toDateInput(p.postDate)}
                        onChange={(e) =>
                          void patch(t, { postDate: e.target.value ? new Date(`${e.target.value}T09:00:00+08:00`).toISOString() : undefined })
                        }
                      />
                    ) : (
                      <Typography variant="body2">
                        <strong>Post date:</strong> {fmtDate(p.postDate) || '-'}
                      </Typography>
                    )}
                    {t.dueAt && (
                      <Typography variant="caption" color={new Date(t.dueAt) < new Date() && p.stage !== 'posted' ? 'error' : 'text.secondary'}>
                        Draft deadline: {fmtDate(t.dueAt)}
                      </Typography>
                    )}
                    {isAdmin && (
                      <Box sx={{ textAlign: 'right' }}>
                        <Tooltip title="Delete pubmat">
                          <IconButton size="small" aria-label={`Delete ${t.title}`} onClick={() => remove(t)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Stack>
                </Stack>
                {mine && !isAdmin && (
                  <Box sx={{ mt: 1, p: 1, borderRadius: 2, bgcolor: alpha(brand.primary, 0.05) }}>
                    <Typography variant="caption">
                      Writing the caption? Follow the{' '}
                      <Link href={CAPTION_GUIDELINES_URL} target="_blank" rel="noopener noreferrer">
                        caption guidelines
                      </Link>
                      .
                    </Typography>
                  </Box>
                )}
                {(isAdmin || mine) && (
                  <TaskThread
                    task={t}
                    me={me}
                    adminIds={officers.filter((o) => o.role === 'admin').map((o) => o.personId)}
                    onChange={(updated) => onChange(items.map((x) => (x.id === updated.id ? updated : x)))}
                  />
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
