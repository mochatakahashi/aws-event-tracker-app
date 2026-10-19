import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import IconButton from '@mui/material/IconButton';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import Tooltip from '@mui/material/Tooltip';
import { useSavedEvents } from '../hooks/useSavedEvents';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { alpha } from '@mui/material/styles';
import { getEvent, updateEvent } from '../services/eventService';
import { getSpeakersByIds } from '../services/speakerService';
import {
  getRegistrationsByEvent,
  findRegistration,
  registerForEvent,
  cancelRegistration,
  getPeopleByIds,
  getPeople,
} from '../services/registrationService';
import { compareOfficers } from '../utils/people';
import type { AppEvent } from '../types/event';
import type { Speaker } from '../types/speaker';
import type { Registration, Person } from '../types/attendee';
import { ModalityChip, RsvpChip, StatusChip, TagChip } from '../components/EventChips';
import AddToCalendarButton from '../components/AddToCalendarButton';
import CertificateButton from '../components/CertificateButton';
import RecentUploadsShelf from '../components/RecentUploadsShelf';
import InlinePass from '../components/InlinePass';
import EventStaffPanel from '../components/EventStaffPanel';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import SessionsSection from '../components/SessionsSection';
import EventStampCard from '../components/EventStampCard';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { formatDateRange } from '../utils/eventDisplay';
import { useAuth } from '../context/AuthContext';
import { brand, PARTNER } from '../theme/theme';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const personId = user?.personId;
  const { isSaved, toggle } = useSavedEvents();

  const [event, setEvent] = useState<AppEvent | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [officers, setOfficers] = useState<Person[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [myReg, setMyReg] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [working, setWorking] = useState(false);
  const [showAllSpeakers, setShowAllSpeakers] = useState(false);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [regError, setRegError] = useState('');

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
    const [lineup, team, regs, mine, people] = await Promise.all([
      getSpeakersByIds(data.speakerIds),
      getPeopleByIds(data.officerIds || []),
      getRegistrationsByEvent(id),
      personId ? findRegistration(id, personId) : Promise.resolve(null),
      getPeople(),
    ]);
    setSpeakers(lineup);
    setOfficers(team);
    setRegistrations(regs);
    setMyReg(mine);
    // Officers (hierarchy order), then co-organizer staff — matching this event's co-organizers first
    const partners = people
      .filter((p) => p.role === 'attendee' && p.partnerOrg)
      .sort(
        (a, b) =>
          Number(!(data.coOrganizers ?? []).includes(a.partnerOrg ?? '')) - Number(!(data.coOrganizers ?? []).includes(b.partnerOrg ?? '')) ||
          a.name.localeCompare(b.name),
      );
    setAllPeople([...people.filter((p) => p.role === 'officer' || p.role === 'admin').sort(compareOfficers), ...partners]);
    setLoading(false);
  }, [id, personId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRegister() {
    if (!id || !personId) return;
    setWorking(true);
    try {
      await registerForEvent(id, personId);
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
    setRegError('');
    try {
      await cancelRegistration(id, personId);
      const regs = await getRegistrationsByEvent(id);
      setRegistrations(regs);
      setMyReg(null);
    } catch (e) {
      setRegError(e instanceof Error ? e.message : 'Could not cancel the registration.');
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound || !event) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h2" gutterBottom>
          Event not found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          The event you are looking for does not exist or was removed.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/events')}>
          Back to Events
        </Button>
      </Box>
    );
  }

  const spotsLeft = event.capacity === 0 ? null : event.capacity - registrations.length;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const closed = event.status === 'accomplished' || event.status === 'cancelled';
  const canRegister = !closed && (!isFull || myReg !== null);

  const heroImage = event.imageUrl || '';

  return (
    <Box sx={{ pb: 6 }}>
      {/* Top Hero Image Header */}
      <Box
        sx={{
          position: 'relative',
          height: heroImage ? { xs: 220, sm: 300 } : { xs: 160, sm: 200 },
          width: '100%',
          borderRadius: '15px',
          overflow: 'hidden',
          mb: 3,
          bgcolor: alpha(brand.primary, 0.05),
          border: heroImage ? 'none' : '1px solid',
          borderColor: alpha(brand.primary, 0.12),
          boxShadow: heroImage ? '0 8px 30px rgba(0,0,0,0.15)' : 'none',
        }}
      >
        {heroImage ? (
          <>
            <Box
              component="img"
              src={heroImage}
              alt={event.title}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.6) 100%)',
              }}
            />
          </>
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.8,
              color: 'text.secondary',
            }}
          >
            <ImageNotSupportedOutlinedIcon sx={{ fontSize: 38, opacity: 0.4 }} />
            <Typography
              variant="caption"
              sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.72rem', opacity: 0.75 }}
            >
              No image
            </Typography>
          </Box>
        )}

        {/* Overlay Navigation Bar */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ position: 'absolute', top: 16, left: 16, right: 16 }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/events')}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              color: brand.textPrimary,
              fontWeight: 700,
              borderRadius: '20px',
              px: 2,
              py: 0.8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              textTransform: 'none',
              '&:hover': { bgcolor: '#fff' },
            }}
          >
            Back
          </Button>

          <Stack direction="row" spacing={1} alignItems="center">
            {user?.role === 'admin' && (
              <Button
                onClick={() => navigate(`/admin/events/${id}/edit`)}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  color: brand.primary,
                  fontWeight: 700,
                  borderRadius: '20px',
                  px: 2,
                  py: 0.8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#fff' },
                }}
              >
                Edit Event
              </Button>
            )}
            {user?.role !== 'admin' && (
              <Tooltip title={isSaved(event.id) ? 'Saved — tap to remove' : 'Save event'}>
              <IconButton
                onClick={() => void toggle(event.id)}
                aria-label={isSaved(event.id) ? 'Remove from saved' : 'Save event'}
                aria-pressed={isSaved(event.id)}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  color: '#EF4444',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': { bgcolor: '#fff' },
                }}
              >
                {isSaved(event.id) ? <BookmarkRoundedIcon /> : <BookmarkBorderRoundedIcon />}
              </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Main Grid Content */}
      <Grid container spacing={3}>
        {/* Admins have no registration panel, so the details use the full width */}
        <Grid size={{ xs: 12, md: user?.role === 'admin' || user?.role === 'adviser' ? 12 : 8 }}>
          <Paper sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '15px' }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
              <ModalityChip modality={event.modality} />
              <StatusChip status={event.status} />
              {event.tags.map((tag) => (
                <TagChip key={tag} tag={tag} />
              ))}
            </Stack>

            <Typography variant="h1" sx={{ fontWeight: 800, mb: event.coOrganizers?.length ? 1 : 2, lineHeight: 1.2 }}>
              {event.title}
            </Typography>
            {!!event.coOrganizers?.length && (
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }} data-testid="co-organizers">
                <HandshakeOutlinedIcon sx={{ fontSize: 18, color: PARTNER }} />
                <Typography variant="body2" color="text.secondary">
                  Co-organized by AWS SBG-APC and <strong>{event.coOrganizers.join(', ')}</strong>
                </Typography>
              </Stack>
            )}

            {/* Structured Info Cards (Inspired by reference mockup in Image 4) */}
            <Stack spacing={2} sx={{ my: 3 }}>
              {/* Date & Time Row */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    bgcolor: alpha(brand.primary, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CalendarMonthRoundedIcon sx={{ color: brand.primary, fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {formatDateRange(event.startAt, event.endAt)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Event Schedule
                  </Typography>
                </Box>
              </Stack>

              {/* Venue Row */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    bgcolor: alpha(brand.primary, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PlaceRoundedIcon sx={{ color: brand.primary, fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {event.venue}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Venue Location
                  </Typography>
                </Box>
              </Stack>

              {/* Host / Organizer Row moved below */}
              {event.status !== 'cancelled' && (
                <Box>
                  <AddToCalendarButton event={event} size="small" />
                </Box>
              )}
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
              About Event
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-line', color: brand.textSecondary, lineHeight: 1.7 }}>
              {event.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <SessionsSection event={event} refreshKey={`${myReg?.id ?? ''}:${myReg?.rsvp ?? ''}`} isAdmin={user?.role === 'admin'} />

            {/* Your stamp passport for this event (registered, event not over, has stamps) */}
            {myReg && myReg.rsvp !== 'declined' && event.status !== 'accomplished' && event.status !== 'cancelled' && (
              <Box sx={{ mt: 3, '&:empty': { display: 'none' } }} data-testid="event-passport">
                <EventStampCard event={event} title="YOUR STAMP PASSPORT" hideWhenEmpty />
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              Speakers Lineup
            </Typography>
            {speakers.length === 0 ? (
              <Typography color="text.secondary">No speakers announced yet.</Typography>
            ) : (
              <List disablePadding>
                {(showAllSpeakers ? speakers : speakers.slice(0, 2)).map((s) => (
                  <ListItem key={s.id} alignItems="flex-start" disableGutters sx={{ mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar src={s.avatarUrl || undefined} sx={{ width: 44, height: 44 }}>
                        {initials(s.name)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {s.name}
                          </Typography>
                          {s.linkedInUrl && (
                            <Link href={s.linkedInUrl} target="_blank" rel="noopener noreferrer">
                              <LinkedInIcon fontSize="small" sx={{ color: '#0A66C2' }} />
                            </Link>
                          )}
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {[s.headline, s.company].filter(Boolean).join(' · ')}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {s.bio}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {speakers.length > 2 && (
              <Button
                fullWidth
                endIcon={<ArrowForwardRoundedIcon sx={{ transform: showAllSpeakers ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />}
                onClick={() => setShowAllSpeakers(!showAllSpeakers)}
                sx={{
                  mt: 2,
                  bgcolor: '#f2e5f7',
                  color: '#1a1a1a',
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  py: 1,
                  '&:hover': { bgcolor: '#e6d0ef' }
                }}
              >
                {showAllSpeakers ? 'See less' : 'See more'}
              </Button>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Event Photos & Recent Uploads (admins only) */}
            {user?.role === 'admin' && (
            <Box sx={{ mb: 4 }}>
              <RecentUploadsShelf
                currentUrl={event.imageUrl}
                onSelect={(url) => {
                  if (user?.role === 'admin') {
                    updateEvent(event.id, { imageUrl: url }).then((updated) => setEvent(updated));
                  }
                }}
                eventId={event.id}
                title="Event Photos & Recent Uploads"
              />
            </Box>
            )}

            {/* Organizer Card */}
            <Box
              sx={{
                bgcolor: '#D8B4E2',
                borderRadius: '16px',
                p: 3,
                mb: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: '#B282C9',
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a1a1a' }}>
                    AWS Student Builder Group - APC
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5C3D75', fontWeight: 600 }}>
                    Organizer
                  </Typography>
                </Box>
              </Stack>
              
              <Box
                sx={{
                  bgcolor: '#fff',
                  borderRadius: '12px',
                  py: 0.8,
                  px: 1.5,
                  display: 'flex',
                  alignSelf: 'flex-start',
                }}
              >
                <Stack direction="row" spacing={1}>
                  <IconButton
                    size="small"
                    component="a"
                    href="https://www.instagram.com/awssbgapc"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: '#E1306C', width: 28, height: 28 }}
                  >
                    <InstagramIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    component="a"
                    href="https://www.facebook.com/awssbgapc"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: '#1877F2', width: 28, height: 28 }}
                  >
                    <FacebookIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    component="a"
                    href="https://www.linkedin.com/company/awssbgapc/"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: '#0A66C2', width: 28, height: 28 }}
                  >
                    <LinkedInIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    component="a"
                    href="https://tiktok.com/@awssbgapc"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: '#010101', width: 28, height: 28 }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
                    </svg>
                  </IconButton>
                  <IconButton
                    size="small"
                    component="a"
                    href="mailto:aws.apcofficial@gmail.com"
                    sx={{ color: '#EF4444', width: 28, height: 28 }}
                  >
                    <EmailRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Stack>
              </Box>
            </Box>

            <EventStaffPanel
              event={event}
              team={officers}
              candidates={allPeople}
              actor={user}
              onChange={async (updated) => {
                setEvent(updated);
                setOfficers(await getPeopleByIds(updated.officerIds || []));
              }}
            />
          </Paper>
        </Grid>

        {/* Registration Sidebar Panel (not for admins or the adviser — view only) */}
        {user?.role !== 'admin' && user?.role !== 'adviser' && (
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: '15px', position: { md: 'sticky' }, top: 88 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              {!myReg
                ? 'Event Registration'
                : myReg.rsvp === 'approved'
                  ? 'You are registered 🎉'
                  : myReg.rsvp === 'pending'
                    ? 'Registration sent ⏳'
                    : 'Registration declined'}
            </Typography>

            {closed && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
                This event is {event.status}. Registration is closed.
              </Alert>
            )}
            {!closed && isFull && !myReg && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px' }}>
                This event is full.
              </Alert>
            )}

            {myReg ? (
              <>
                {myReg.checkedIn && (
                  <Alert icon={<CheckCircleRoundedIcon fontSize="inherit" />} severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
                    You're checked in. Enjoy the event!
                  </Alert>
                )}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700 }}>
                    REGISTRATION STATUS
                  </Typography>
                  <RsvpChip rsvp={myReg.rsvp} />
                </Stack>
                {myReg.rsvp === 'pending' && !myReg.checkedIn && (
                  <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
                    An officer will review your registration. You'll be notified once it's approved, and your event pass
                    will appear here.
                  </Alert>
                )}
                {myReg.rsvp === 'declined' && (
                  <Alert
                    severity="warning"
                    sx={{ mb: 2, borderRadius: '12px' }}
                    action={
                      !closed && (
                        <Button color="inherit" size="small" onClick={() => void handleRegister()} disabled={working}>
                          Ask again
                        </Button>
                      )
                    }
                  >
                    Your registration for this event was declined.
                  </Alert>
                )}
                <Stack spacing={1} sx={{ mb: 2.5 }}>
                  {(myReg.rsvp === 'approved' || myReg.checkedIn) && (
                    <InlinePass registration={myReg} onOpen={() => navigate(`/pass?event=${event.id}`)} />
                  )}
                  {!closed && myReg.rsvp !== 'declined' && <AddToCalendarButton event={event} fullWidth />}
                </Stack>
                {personId && myReg.rsvp !== 'declined' && (
                  <Box sx={{ mb: 2.5 }}>
                    <CertificateButton registration={myReg} personId={personId} event={event} />
                  </Box>
                )}
                {regError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
                    {regError}
                  </Alert>
                )}
                {myReg.checkedIn ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} data-testid="no-cancel">
                    You're checked in, so this registration can no longer be cancelled.
                  </Typography>
                ) : (
                  <Button
                    fullWidth
                    color="error"
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={working}
                    sx={{ borderRadius: '12px' }}
                  >
                    Cancel Registration
                  </Button>
                )}
              </>
            ) : (
              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => void handleRegister()}
                  disabled={!canRegister || working}
                  sx={{ borderRadius: '24px', py: 1.2, fontWeight: 800 }}
                >
                  Register — I'm going
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                  An officer reviews each registration; you'll be notified when it's approved.
                </Typography>
              </Stack>
            )}
          </Paper>
        </Grid>
        )}
      </Grid>
    </Box>
  );
}
