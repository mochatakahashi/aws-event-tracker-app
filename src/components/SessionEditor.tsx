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
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { createSession, updateSession, type SessionInput } from '../services/sessionService';
import { getSpeakers, createSpeaker } from '../services/speakerService';
import { getEvents } from '../services/eventService';
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
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  // Picked speakers: directory entries, or plain names typed in (created on save).
  const [chosen, setChosen] = useState<Array<Speaker | string>>([]);
  // Which event the session belongs to (lets an admin move a session that's under the wrong event)
  const [eventId, setEventId] = useState(session?.eventId ?? event.id);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSpeakers()
      .then((list) => {
        setSpeakers(list);
        const ids = session?.speakerIds ?? [];
        setChosen(ids.map((id) => list.find((sp) => sp.id === id)).filter((sp): sp is Speaker => Boolean(sp)));
      })
      .catch(() => setSpeakers([]));
    if (session) getEvents().then(setEvents).catch(() => setEvents([]));
  }, []);

  async function submit(e?: FormEvent | KeyboardEvent) {
    e?.preventDefault();
    setError('');
    if (!title.trim()) return setError('Give the session a title.');
    if (!start || !end) return setError('Set when the session starts and ends.');
    if (fromLocalInput(end) <= fromLocalInput(start)) return setError('The session must end after it starts.');
    setSaving(true);
    let speakerIds: string[];
    try {
      speakerIds = [];
      const resolved: Speaker[] = [];
      for (const c of chosen) {
        const sp = typeof c !== 'string' ? c : await createSpeaker({ name: c, headline: '', company: '', bio: '' });
        resolved.push(sp);
        speakerIds.push(sp.id);
      }
      // Remember the new ones so a retry doesn't create them twice.
      if (resolved.some((sp) => !speakers.some((x) => x.id === sp.id))) {
        setSpeakers((prev) => [...prev, ...resolved.filter((sp) => !prev.some((x) => x.id === sp.id))]);
        setChosen(resolved);
      }
      // Keep speakers the list couldn't show (e.g. directory failed to load).
      for (const id of session?.speakerIds ?? []) {
        if (!speakers.some((sp) => sp.id === id) && !speakerIds.includes(id)) speakerIds.push(id);
      }
    } catch (err) {
      setSaving(false);
      return setError(err instanceof Error ? `Could not add the new speaker: ${err.message}` : 'Could not add the new speaker.');
    }
    const input: SessionInput = {
      eventId,
      title: title.trim(),
      description: description.trim(),
      startTime: fromLocalInput(start),
      endTime: fromLocalInput(end),
      room: room.trim(),
      type,
      requiresStamp,
      speakerIds,
    };
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
    // Not a <form>: this editor also sits inside the Edit event form, and forms can't be nested
    <Paper
      component="div"
      role="group"
      aria-label="Session"
      onKeyDown={(e) => {
        // Enter in a one-line field saves the session (not the surrounding event form)
        const t = e.target as HTMLElement;
        if (e.key === 'Enter' && t.tagName === 'INPUT' && (t as HTMLInputElement).type !== 'checkbox' && !t.getAttribute('aria-autocomplete')) {
          e.preventDefault();
          e.stopPropagation();
          void submit();
        }
      }}
      variant="outlined"
      sx={{ p: 2, borderRadius: '14px', borderColor: alpha(brand.primary, 0.35), bgcolor: alpha(brand.primary, 0.02) }}
      data-testid="session-editor"
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
        {session ? `Edit “${session.title}”` : 'Add a session'}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
        <TextField size="small" label="Session title" value={title} onChange={(e) => setTitle(e.target.value)} required sx={{ gridColumn: { sm: '1 / -1' } }} />
        {session && events.length > 0 && (
          <TextField
            select
            size="small"
            label="Event"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            helperText={eventId !== event.id ? 'Saving moves this session (and its stamps) to that event.' : 'Under the wrong event? Pick the right one.'}
            sx={{ gridColumn: { sm: '1 / -1' } }}
          >
            {events.map((ev) => (
              <MenuItem key={ev.id} value={ev.id}>
                {ev.title}
              </MenuItem>
            ))}
          </TextField>
        )}
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
        <Autocomplete
          multiple
          freeSolo
          size="small"
          options={speakers}
          value={chosen}
          filterSelectedOptions
          getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
          isOptionEqualToValue={(a, b) => typeof a !== 'string' && typeof b !== 'string' && a.id === b.id}
          onChange={(_, next) => {
            // Typed names that match someone in the directory use that speaker.
            const cleaned: Array<Speaker | string> = [];
            for (const item of next) {
              if (typeof item === 'string') {
                const name = item.trim();
                if (!name) continue;
                const match = speakers.find((sp) => sp.name.trim().toLowerCase() === name.toLowerCase());
                const pick = match ?? name;
                if (!cleaned.some((c) => (typeof c === 'string' ? c : c.name).toLowerCase() === name.toLowerCase())) cleaned.push(pick);
              } else if (!cleaned.some((c) => typeof c !== 'string' && c.id === item.id)) {
                cleaned.push(item);
              }
            }
            setChosen(cleaned);
          }}
          renderOption={(props, o) => (
            <li {...props} key={typeof o === 'string' ? o : o.id}>
              {typeof o === 'string' ? o : `${o.name}${o.company ? ` - ${o.company}` : ''}`}
            </li>
          )}
          renderTags={(value, getTagProps) =>
            value.map((o, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              const isNew = typeof o === 'string';
              return (
                <Chip
                  key={key}
                  size="small"
                  label={isNew ? `${o} (new)` : o.name}
                  color={isNew ? 'secondary' : 'default'}
                  {...tagProps}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Speakers"
              placeholder={chosen.length ? '' : 'Pick or type a name, then press Enter'}
              helperText="Type a name and press Enter to add someone new. You can add their details later in Speakers."
              inputProps={{ ...params.inputProps, 'data-testid': 'session-speakers-input' }}
            />
          )}
          sx={{ gridColumn: { sm: '1 / -1' } }}
        />
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
        <Button type="button" variant="contained" disabled={saving} onClick={() => void submit()}>
          {saving ? 'Saving…' : session ? 'Save session' : 'Add session'}
        </Button>
      </Stack>
    </Paper>
  );
}
