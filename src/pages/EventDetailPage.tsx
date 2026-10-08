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
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { alpha } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
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
import type { AppEvent } from '../types/event';
import type { Speaker } from '../types/speaker';
import type { Registration, RsvpStatus, Person } from '../types/attendee';
import { CategoryChip, StatusChip } from '../components/EventChips';
import { formatDateRange } from '../utils/eventDisplay';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/theme';

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

  const [event, setEvent] = useState<AppEvent | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [officers, setOfficers] = useState<Person[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [myReg, setMyReg] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [working, setWorking] = useState(false);
  const [newOfficerId, setNewOfficerId] = useState('');
  const [newOfficerRole, setNewOfficerRole] = useState('');
  const [showAllSpeakers, setShowAllSpeakers] = useState(false);
  const [allPeople, setAllPeople] = useState<Person[]>([]);

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
    setAllPeople(people);
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

  async function handleAddOfficer() {
    if (!id || !event || !newOfficerId.trim()) return;
    setWorking(true);
    try {
      const updatedOfficerIds = [...(event.officerIds || []), newOfficerId.trim()];
      const updatedRoles = { ...(event.officerRoles || {}), [newOfficerId.trim()]: newOfficerRole.trim() || 'Officer' };
      await updateEvent(id, { ...event, officerIds: updatedOfficerIds, officerRoles: updatedRoles });
      await load();
      setNewOfficerId('');
      setNewOfficerRole('');
    } catch (e) {
      console.error(e);
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
  const closed = event.status === 'completed' || event.status === 'cancelled';
  const canRegister = !closed && (!isFull || myReg !== null);

  const EVENT_COVER_IMAGES: Record<string, string> = {
    conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    meetup: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    workshop: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    hackathon: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    webinar: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
  };

  const heroImage =
    event.imageUrl || EVENT_COVER_IMAGES[event.category] || EVENT_COVER_IMAGES.conference;

  return (
    <Box sx={{ pb: 6 }}>
      {/* Top Hero Image Header (Matches "Inspired" mockup in Image 4 & 5) */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 220, sm: 300 },
          width: '100%',
          borderRadius: '15px',
          overflow: 'hidden',
          mb: 3,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        }}
      >
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              '&:hover': { bgcolor: '#fff' },
            }}
          >
            Event Details
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
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  '&:hover': { bgcolor: '#fff' },
                }}
              >
                Edit Event
              </Button>
            )}
            {user?.role !== 'admin' && (
              <IconButton
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  color: '#EF4444',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  '&:hover': { bgcolor: '#fff' },
                }}
              >
                <BookmarkBorderRoundedIcon />
              </IconButton>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Main Grid Content */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '15px' }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              <CategoryChip category={event.category} />
              <StatusChip status={event.status} />
            </Stack>

            <Typography variant="h1" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
              {event.title}
            </Typography>

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
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
              About Event
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-line', color: brand.textSecondary, lineHeight: 1.7 }}>
              {event.description}
            </Typography>

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

            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              Assigned Officers
            </Typography>

            <Box sx={{ mb: 3, p: 2, bgcolor: alpha(brand.primary, 0.04), borderRadius: '12px', border: '1px solid', borderColor: alpha(brand.primary, 0.1) }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                Assign an Officer
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <FormControl fullWidth size="small" sx={{ bgcolor: '#fff', borderRadius: 1 }}>
                  <Select
                    value={newOfficerId}
                    onChange={(e) => setNewOfficerId(e.target.value as string)}
                    disabled={working}
                    displayEmpty
                    sx={{ borderRadius: '8px', color: newOfficerId ? 'inherit' : 'text.secondary' }}
                  >
                    <MenuItem value="" disabled>Select Person</MenuItem>
                    {allPeople.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth size="small" sx={{ bgcolor: '#fff', borderRadius: 1 }}>
                  <Select
                    value={newOfficerRole}
                    onChange={(e) => setNewOfficerRole(e.target.value as string)}
                    disabled={working}
                    displayEmpty
                    sx={{ borderRadius: '8px', color: newOfficerRole ? 'inherit' : 'text.secondary' }}
                  >
                    <MenuItem value="" disabled>Select Role</MenuItem>
                    <MenuItem value="creatives">Creatives</MenuItem>
                    <MenuItem value="media">Media</MenuItem>
                    <MenuItem value="lead">Lead</MenuItem>
                    <MenuItem value="host">Host</MenuItem>
                    <MenuItem value="usher">Usher</MenuItem>
                    <MenuItem value="registration booth">Registration Booth</MenuItem>
                  </Select>
                </FormControl>

                <Button 
                  variant="contained" 
                  onClick={handleAddOfficer}
                  disabled={working || !newOfficerId.trim()}
                  sx={{ borderRadius: '8px', px: 3, fontWeight: 700, textTransform: 'none' }}
                >
                  Add
                </Button>
              </Stack>
            </Box>

            {officers.length === 0 ? (
              <Typography color="text.secondary">No officers assigned yet.</Typography>
            ) : (
              <List disablePadding>
                {officers.map((o) => (
                  <ListItem key={o.id} alignItems="flex-start" disableGutters sx={{ mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(brand.secondary, 0.1), color: brand.secondary }}>
                        {initials(o.name)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {o.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {event.officerRoles?.[o.id] || o.bio || 'Officer'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Registration Sidebar Panel */}
        {user?.role !== 'admin' && (
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: '15px', position: { md: 'sticky' }, top: 88 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              {myReg ? 'You are registered 🎉' : 'Event Registration'}
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
                <Typography color="text.secondary" variant="caption" sx={{ mb: 1, display: 'block' }}>
                  YOUR RSVP STATUS
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={myReg.rsvp}
                  onChange={(_e, val) => val && handleRegister(val as RsvpStatus)}
                  size="small"
                  sx={{ mb: 2, width: '100%' }}
                  disabled={working}
                >
                  <ToggleButton value="going" sx={{ flex: 1, fontWeight: 700 }}>Going</ToggleButton>
                  <ToggleButton value="interested" sx={{ flex: 1, fontWeight: 700 }}>Interested</ToggleButton>
                  <ToggleButton value="declined" sx={{ flex: 1 }}>Declined</ToggleButton>
                </ToggleButtonGroup>
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
              </>
            ) : (
              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => handleRegister('going')}
                  disabled={!canRegister || working}
                  sx={{ borderRadius: '24px', py: 1.2, fontWeight: 800 }}
                >
                  Register — I'm going
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => handleRegister('interested')}
                  disabled={!canRegister || working}
                  sx={{ borderRadius: '24px', py: 1.2, fontWeight: 700 }}
                >
                  I'm interested
                </Button>
              </Stack>
            )}
          </Paper>
        </Grid>
        )}
      </Grid>
    </Box>
  );
}
