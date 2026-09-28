import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Autocomplete from '@mui/material/Autocomplete';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getEvent, createEvent, updateEvent } from '../services/eventService';
import {
  getSpeakers,
  createSpeaker,
  lookupLinkedInProfile,
} from '../services/speakerService';
import {
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  type EventCategory,
  type EventStatus,
} from '../types/event';
import type { Speaker } from '../types/speaker';
import { capitalize } from '../utils/eventDisplay';

interface FormState {
  title: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  startAt: string; // datetime-local value
  endAt: string; // datetime-local value
  venue: string;
  capacity: string; // kept as string for the input
  speakerIds: string[];
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  category: 'conference',
  status: 'upcoming',
  startAt: '',
  endAt: '',
  venue: '',
  capacity: '0',
  speakerIds: [],
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

/** Convert an ISO string to a value usable by <input type="datetime-local">. */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** Convert a datetime-local value back to an ISO string. */
function localInputToIso(local: string): string {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

export default function EventFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [linkedInBusy, setLinkedInBusy] = useState(false);
  const [linkedInError, setLinkedInError] = useState<string | null>(null);

  // Load speaker directory.
  useEffect(() => {
    let active = true;
    getSpeakers().then((data) => {
      if (active) setSpeakers(data);
    });
    return () => {
      active = false;
    };
  }, []);

  // In edit mode, load and prefill the event.
  useEffect(() => {
    if (!isEdit || !id) return;
    let active = true;
    setLoading(true);
    getEvent(id)
      .then((event) => {
        if (!active) return;
        if (!event) {
          setLoadError('Event not found.');
          return;
        }
        setForm({
          title: event.title,
          description: event.description,
          category: event.category,
          status: event.status,
          startAt: isoToLocalInput(event.startAt),
          endAt: isoToLocalInput(event.endAt),
          venue: event.venue,
          capacity: String(event.capacity),
          speakerIds: [...event.speakerIds],
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    if (!form.description.trim()) next.description = 'Description is required.';
    if (!form.venue.trim()) next.venue = 'Venue is required.';
    if (!form.startAt) next.startAt = 'Start date/time is required.';
    if (!form.endAt) next.endAt = 'End date/time is required.';
    if (
      form.startAt &&
      form.endAt &&
      new Date(form.endAt).getTime() < new Date(form.startAt).getTime()
    ) {
      next.endAt = 'End must be after start.';
    }
    const cap = Number(form.capacity);
    if (Number.isNaN(cap) || cap < 0) {
      next.capacity = 'Capacity must be 0 or more (0 = unlimited).';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleLinkedInImport() {
    setLinkedInError(null);
    setLinkedInBusy(true);
    try {
      const profile = await lookupLinkedInProfile(linkedInUrl);
      const created = await createSpeaker({ ...profile, linkedInUrl });
      setSpeakers((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      update('speakerIds', [...form.speakerIds, created.id]);
      setLinkedInUrl('');
    } catch (err) {
      setLinkedInError(
        err instanceof Error ? err.message : 'Could not import profile.',
      );
    } finally {
      setLinkedInBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      status: form.status,
      startAt: localInputToIso(form.startAt),
      endAt: localInputToIso(form.endAt),
      venue: form.venue.trim(),
      capacity: Number(form.capacity),
      speakerIds: form.speakerIds,
    };

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateEvent(id, payload);
        navigate(`/events/${id}`);
      } else {
        const created = await createEvent(payload);
        navigate(`/events/${created.id}`);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to save event.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h2" gutterBottom>
          {loadError}
        </Typography>
        <Button variant="contained" component={RouterLink} to="/events">
          Back to Events
        </Button>
      </Box>
    );
  }

  const selectedSpeakers = speakers.filter((s) =>
    form.speakerIds.includes(s.id),
  );

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        component={RouterLink}
        to={isEdit && id ? `/events/${id}` : '/events'}
        sx={{ mb: 2 }}
      >
        Cancel
      </Button>

      <Typography variant="h1" gutterBottom>
        {isEdit ? 'Edit Event' : 'New Event'}
      </Typography>

      <Paper
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ p: 3, maxWidth: 820 }}
      >
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              error={Boolean(errors.title)}
              helperText={errors.title}
              fullWidth
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              select
              label="Category"
              value={form.category}
              onChange={(e) =>
                update('category', e.target.value as EventCategory)
              }
              fullWidth
            >
              {EVENT_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {capitalize(c)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(e) => update('status', e.target.value as EventStatus)}
              fullWidth
            >
              {EVENT_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {capitalize(s)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Capacity"
              type="number"
              value={form.capacity}
              onChange={(e) => update('capacity', e.target.value)}
              error={Boolean(errors.capacity)}
              helperText={errors.capacity ?? '0 = unlimited'}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Starts"
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => update('startAt', e.target.value)}
              error={Boolean(errors.startAt)}
              helperText={errors.startAt}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Ends"
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => update('endAt', e.target.value)}
              error={Boolean(errors.endAt)}
              helperText={errors.endAt}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              label="Venue"
              value={form.venue}
              onChange={(e) => update('venue', e.target.value)}
              error={Boolean(errors.venue)}
              helperText={errors.venue}
              fullWidth
              required
              placeholder='e.g. "Main Hall" or "Online"'
            />
          </Grid>

          <Grid size={12}>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              error={Boolean(errors.description)}
              helperText={errors.description}
              fullWidth
              multiline
              minRows={3}
              required
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h3" gutterBottom>
          Speakers
        </Typography>
        <Autocomplete
          multiple
          options={speakers}
          getOptionLabel={(s) => s.name}
          value={selectedSpeakers}
          onChange={(_e, value) =>
            update(
              'speakerIds',
              value.map((s) => s.id),
            )
          }
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Assign speakers"
              placeholder="Search the speaker directory…"
            />
          )}
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Add a speaker from LinkedIn
          </Typography>
          {linkedInError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {linkedInError}
            </Alert>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label="LinkedIn profile URL"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
              size="small"
              fullWidth
              placeholder="https://www.linkedin.com/in/…"
            />
            <Button
              variant="outlined"
              onClick={handleLinkedInImport}
              disabled={!linkedInUrl.trim() || linkedInBusy}
              startIcon={
                linkedInBusy ? <CircularProgress size={18} /> : null
              }
              sx={{ whiteSpace: 'nowrap' }}
            >
              Import
            </Button>
          </Stack>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={
              submitting ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {isEdit ? 'Save Changes' : 'Create Event'}
          </Button>
          <Button
            component={RouterLink}
            to={isEdit && id ? `/events/${id}` : '/events'}
            disabled={submitting}
          >
            Cancel
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
