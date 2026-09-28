import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import { getEvent } from '../services/eventService';
import {
  getRegistrationsByPerson,
  cancelRegistration,
} from '../services/registrationService';
import type { AppEvent } from '../types/event';
import type { Registration } from '../types/attendee';
import { CategoryChip, StatusChip, RsvpChip } from '../components/EventChips';
import { formatDateRange } from '../utils/eventDisplay';
import { useAuth } from '../context/AuthContext';

interface Ticket {
  registration: Registration;
  event: AppEvent;
}

export default function MyRegistrationsPage() {
  const { user } = useAuth();
  const personId = user?.personId;
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!personId) {
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const regs = await getRegistrationsByPerson(personId);
    const resolved = await Promise.all(
      regs.map(async (registration) => {
        const event = await getEvent(registration.eventId);
        return event ? { registration, event } : null;
      }),
    );
    const valid = resolved.filter((t): t is Ticket => t !== null);
    valid.sort(
      (a, b) =>
        new Date(a.event.startAt).getTime() -
        new Date(b.event.startAt).getTime(),
    );
    setTickets(valid);
    setLoading(false);
  }, [personId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCancel(eventId: string) {
    if (!personId) return;
    setWorkingId(eventId);
    try {
      await cancelRegistration(eventId, personId);
      await load();
    } finally {
      setWorkingId(null);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        My Registrations
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Events you have registered for.
      </Typography>

      {tickets.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            You have not registered for any events yet.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/events')}>
            Browse Events
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {tickets.map(({ registration, event }) => (
            <Paper key={registration.id} sx={{ p: 2 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
                spacing={2}
              >
                <Box
                  sx={{ cursor: 'pointer', flexGrow: 1 }}
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
                    <CategoryChip category={event.category} />
                    <StatusChip status={event.status} />
                    <RsvpChip rsvp={registration.rsvp} />
                  </Stack>
                  <Typography variant="h3">{event.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateRange(event.startAt, event.endAt)} · {event.venue}
                  </Typography>
                </Box>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                />
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => handleCancel(event.id)}
                  disabled={workingId === event.id}
                >
                  Cancel
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
