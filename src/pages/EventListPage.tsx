import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { getEvents } from '../services/eventService';
import { getRegistrationsByEvent } from '../services/registrationService';
import {
  EVENT_MODALITIES,
  EVENT_STATUSES,
  type AppEvent,
  type EventModality,
  type EventStatus,
} from '../types/event';
import { ModalityChip, StatusChip, TagChip } from '../components/EventChips';
import { capitalize, formatDateTime } from '../utils/eventDisplay';

interface EventWithCount extends AppEvent {
  registered: number;
}

function spotsLabel(event: EventWithCount): string {
  if (event.capacity === 0) return `${event.registered} going`;
  const left = event.capacity - event.registered;
  if (left <= 0) return 'Full';
  return `${left} of ${event.capacity} left`;
}

export default function EventListPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [modality, setModality] = useState<EventModality | 'all'>('all');
  const [status, setStatus] = useState<EventStatus | 'all'>('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getEvents()
      .then(async (data) => {
        const withCounts = await Promise.all(
          data.map(async (e) => ({
            ...e,
            registered: (await getRegistrationsByEvent(e.id)).length,
          })),
        );
        if (active) setEvents(withCounts);
      })
      .catch((err: unknown) => {
        if (active)
          setError(err instanceof Error ? err.message : 'Failed to load events.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events.filter((e) => {
      if (modality !== 'all' && e.modality !== modality) return false;
      if (status !== 'all' && e.status !== status) return false;
      if (term) {
        const haystack = [e.title, e.description, e.venue]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [events, search, modality, status]);

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Browse Events
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Discover onsite, hybrid, and virtual events from AWS SBG-APC.
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
        >
          <TextField
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
            placeholder="Search title, description, venue…"
          />
          <TextField
            select
            label="Modality"
            value={modality}
            onChange={(e) => setModality(e.target.value as EventModality | 'all')}
            size="small"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All modalities</MenuItem>
            {EVENT_MODALITIES.map((m) => (
              <MenuItem key={m} value={m}>
                {capitalize(m)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as EventStatus | 'all')}
            size="small"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All statuses</MenuItem>
            {EVENT_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {capitalize(s)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table aria-label="events table">
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Modality</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>When</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Availability</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 4 }}
                    >
                      No events match your filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((event) => (
                  <TableRow
                    key={event.id}
                    hover
                    onClick={() => navigate(`/events/${event.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{event.title}</TableCell>
                    <TableCell>
                      <ModalityChip modality={event.modality} />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={event.status} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {event.tags.map((tag) => (
                          <TagChip key={tag} tag={tag} />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>{formatDateTime(event.startAt)}</TableCell>
                    <TableCell>{event.venue}</TableCell>
                    <TableCell>{spotsLabel(event)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
