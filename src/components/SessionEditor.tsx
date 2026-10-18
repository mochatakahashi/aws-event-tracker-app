import { useEffect, useState, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { createSession, updateSession, type SessionInput } from '../services/sessionService';
import { getSpeakers } from '../services/speakerService';
import type { AppEvent } from '../types/event';
import type { Session, SessionType } from '../types/session';
import type { Speaker } from '../types/speaker';

const TYPES: { value: SessionType; label: string }[] = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'talk', label: 'Talk' },
  { value: 'keynote', label: 'Keynote' },
  { value: 'panel', label: 'Panel' },
  { value: 'networking', label: 'Networking' },
  { value: 'break', label: 'Break' },
];

/** ISO → value for <input type="datetime-local"> in Manila time. */
function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Manila' }).replace(' ', 'T').slice(0, 16);
}

/** <input type="datetime-local"> value (Manila) → ISO with +08:00. */
function fromLocalInput(v: string): string {
  return v ? `${v}:00+08:00` : '';
}

/** Admin form to add a session to an event, or edit one. Inline (no pop-up). */
export default function SessionEditor({
  event,
  session,
  actorId,
  onSaved,
  onCancel,
}: {
  event: AppEvent;
  /** The session to edit; omitted to add a new one. */
  session?: Session;
  actorId: string;
  onSaved: (s: Session) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(session?.title ?? '');
  const [description, setDescription] = useState(session?.description ?? '');
  const [start, setStart] = useState(toLocalInput(session?.startTime ?? event.startAt));
  const [end, setEnd] = useState(
    toLocalInput(session?.endTime ?? (event.startAt ? new Date(new Date(event.startAt).getTime() + 3600e3).toISOString() : '')),
  );
  const [room, setRoom] = useState(session?.room ?? '');
  const [type, setType] = useState<SessionType>(session?.type ?? 'workshop');
  const [requiresStamp, setRequiresStamp] = useState(session?.requiresStamp ?? false);
  const [speakerIds, setSpeakerIds] = useState<string[]>(session?.speakerIds ?? []);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSpeakers()
      .then(setSpeakers)
      .catch(() => setSpeakers([]));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!title.trim()) return setError('Give the session a title.');
    if (!start || !end) return setError('Set when the session starts and ends.');
    if (fromLocalInput(end) <= fromLocalInput(start)) return setError('The session must end after it starts.');
    const input: SessionInput = {
      eventId: event.id,
      title: title.trim(),
      description: description.trim(),
      startTime: fromLocalInput(start),
      endTime: fromLocalInput(end),
      room: room.trim(),
      type,
      requiresStamp,
      speakerIds,
    };
    setSaving(true);
    try {
      const saved = session ? await updateSession(session.id, input, actorId) : await createSession(input, actorId);
      await onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the session.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper
      component="form"
      onSubmit={submit}
      variant="outlined"
      sx={{ p: 2, borderRadius: '14px', borderColor: alpha(brand.primary, 0.35), bgcolor: alpha(brand.primary, 0.02) }}
      data-testid="session-editor"
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
        {session ? `Edit “${session.title}”` : 'Add a session'}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
        <TextField size="small" label="Session title" value={title} onChange={(e) => setTitle(e.target.value)} required sx={{ gridColumn: { sm: '1 / -1' } }} />
        <TextField
          size="small"
          label="Starts (Manila time)"
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          size="small"
          label="Ends (Manila time)"
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField size="small" label="Room / location" value={room} onChange={(e) => setRoom(e.target.value)} />
        <TextField select size="small" label="Type" value={type} onChange={(e) => setType(e.target.value as SessionType)}>
          {TYPES.map((t) => (
            <MenuItem key={t.value} value={t.value}>
              {t.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Speakers"
          value={speakerIds}
          onChange={(e) => setSpeakerIds(typeof e.target.value === 'string' ? e.target.value.split(',') : (e.target.value as string[]))}
          SelectProps={{
            multiple: true,
            renderValue: (v) =>
              (v as string[]).map((id) => speakers.find((s) => s.id === id)?.name ?? id).join(', ') || 'None',
          }}
          sx={{ gridColumn: { sm: '1 / -1' } }}
        >
          {speakers.length === 0 && (
            <MenuItem value="" disabled>
              No speakers in the directory yet
            </MenuItem>
          )}
          {speakers.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
              {s.company ? ` — ${s.company}` : ''}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={2}
          sx={{ gridColumn: { sm: '1 / -1' } }}
        />
      </Box>
      <FormControlLabel
        sx={{ mt: 1 }}
        control={<Switch checked={requiresStamp} onChange={(e) => setRequiresStamp(e.target.checked)} />}
        label="⭐ Has a stamp (attendees collect a stamp for this session)"
      />
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1.5 }}>
        <Button onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? 'Saving…' : session ? 'Save session' : 'Add session'}
        </Button>
      </Stack>
    </Paper>
  );
}
