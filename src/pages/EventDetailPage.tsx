import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import Avatar from '@mui/material/Avatar';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import PlaceIcon from '@mui/icons-material/Place';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { getEvent } from '../services/eventService';
import { getSpeakersByIds } from '../services/speakerService';
import {
  getRegistrationsByEvent,
  findRegistration,
  registerForEvent,
  cancelRegistration,
} from '../services/registrationService';
import type { AppEvent } from '../types/event';
import type { Speaker } from '../types/speaker';
import type { Registration, RsvpStatus } from '../types/attendee';
import { CategoryChip, StatusChip } from '../components/EventChips';
import { formatDateRange } from '../utils/eventDisplay';
import { useAuth } from '../context/AuthContext';

function InfoRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
      {icon}
      <Typography color="text.primary">{children}</Typography>
    </Stack>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const personId = user?.personId;

  const [event, setEvent] = useState<AppEvent | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [myReg, setMyReg] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await getEvent(id);
    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setEvent(data);
    const [lineup, regs, mine] = await Promise.all([
      getSpeakersByIds(data.speakerIds),
      getRegistrationsByEvent(id),
      personId ? findRegistration(id, personId) : Promise.resolve(null),
    ]);
    setSpeakers(lineup);
    setRegistrations(regs);
    setMyReg(mine);
    setLoading(false);
  }, [id, personId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRegister(rsvp: RsvpStatus) {
    if (!id || !personId) return;
    setWorking(true);
    try {
      await registerForEvent(id, personId, rsvp);
      const [regs, mine] = await Promise.all([
        getRegistrationsByEvent(id),
        findRegistration(id, personId),
      ]);
      setRegistrations(regs);
      setMyReg(mine);
    } finally {
      setWorking(false);
    }
  }

  async function handleCancel() {
    if (!id || !personId) return;
    setWorking(true);
    try {
      await cancelRegistration(id, personId);
      const regs = await getRegistrationsByEvent(id);
      setRegistrations(regs);
      setMyReg(null);
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound || !event) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h2" gutterBottom>
          Event not found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          The event you are looking for does not exist or was removed.
        </Typography>
        <Button variant="contained" component={RouterLink} to="/events">
          Back to Events
        </Button>
      </Box>
    );
  }

  const spotsLeft =
    event.capacity === 0 ? null : event.capacity - registrations.length;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const closed = event.status === 'completed' || event.status === 'cancelled';
  const canRegister = !closed && (!isFull || myReg !== null);

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        component={RouterLink}
        to="/events"
        sx={{ mb: 2 }}
      >
        Back to Events
      </Button>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <CategoryChip category={event.category} />
              <StatusChip status={event.status} />
            </Stack>
            <Typography variant="h1" gutterBottom>
              {event.title}
            </Typography>

            <Stack spacing={1} sx={{ my: 2 }}>
              <InfoRow icon={<ScheduleIcon fontSize="small" />}>
                {formatDateRange(event.startAt, event.endAt)}
              </InfoRow>
              <InfoRow icon={<PlaceIcon fontSize="small" />}>
                {event.venue}
              </InfoRow>
              <InfoRow icon={<EventSeatIcon fontSize="small" />}>
                {event.capacity === 0
                  ? `${registrations.length} registered`
                  : `${registrations.length} registered · ${
                      spotsLeft && spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'
                    }`}
              </InfoRow>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h3" gutterBottom>
              About this event
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-line' }}>
              {event.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h3" gutterBottom>
              Speakers
            </Typography>
            {speakers.length === 0 ? (
              <Typography color="text.secondary">
                No speakers announced yet.
              </Typography>
            ) : (
              <List>
                {speakers.map((s) => (
                  <ListItem key={s.id} alignItems="flex-start" disableGutters>
                    <ListItemAvatar>
                      <Avatar src={s.avatarUrl || undefined}>
                        {initials(s.name)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          <span>{s.name}</span>
                          {s.linkedInUrl && (
                            <Link
                              href={s.linkedInUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ display: 'inline-flex', alignItems: 'center' }}
                              aria-label={`${s.name} on LinkedIn`}
                            >
                              <LinkedInIcon fontSize="small" />
                            </Link>
                          )}
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {[s.headline, s.company].filter(Boolean).join(' · ')}
                          </Typography>
                          <Typography variant="body2">{s.bio}</Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Registration panel */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, position: { md: 'sticky' }, top: 88 }}>
            <Typography variant="h3" gutterBottom>
              {myReg ? 'You are registered' : 'Register'}
            </Typography>

            {closed && (
              <Alert severity="info" sx={{ mb: 2 }}>
                This event is {event.status}. Registration is closed.
              </Alert>
            )}
            {!closed && isFull && !myReg && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This event is full.
              </Alert>
            )}

            {myReg ? (
              <>
                <Typography color="text.secondary" gutterBottom>
                  Your RSVP
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={myReg.rsvp}
                  onChange={(_e, val) => val && handleRegister(val as RsvpStatus)}
                  size="small"
                  sx={{ mb: 2, flexWrap: 'wrap' }}
                  disabled={working}
                  aria-label="rsvp"
                >
                  <ToggleButton value="going">Going</ToggleButton>
                  <ToggleButton value="interested">Interested</ToggleButton>
                  <ToggleButton value="declined">Declined</ToggleButton>
                </ToggleButtonGroup>
                <Button
                  fullWidth
                  color="error"
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={working}
                >
                  Cancel registration
                </Button>
              </>
            ) : (
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleRegister('going')}
                  disabled={!canRegister || working}
                >
                  Register — I'm going
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleRegister('interested')}
                  disabled={!canRegister || working}
                >
                  I'm interested
                </Button>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
