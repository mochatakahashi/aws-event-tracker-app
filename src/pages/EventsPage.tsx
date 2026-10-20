import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import IconButton from '@mui/material/IconButton';
import ShareEventButton from '../components/ShareEventButton';
import CircularProgress from '@mui/material/CircularProgress';
import PlaceIcon from '@mui/icons-material/PlaceRounded';
import AccessTimeIcon from '@mui/icons-material/AccessTimeRounded';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import { useSavedEvents } from '../hooks/useSavedEvents';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import { alpha } from '@mui/material/styles';
import { getEvents } from '../services/eventService';
import { getSessions } from '../services/sessionService';
import { getAllRegistrations } from '../services/registrationService';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/theme';
import { TagChip } from '../components/EventChips';
import type { AppEvent } from '../types/event';

function formatMonthDay(iso: string): { month: string; day: string } {
  const d = new Date(iso);
  const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'Asia/Manila' }).toUpperCase();
  const day = d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'Asia/Manila' });
  return { month, day };
}

function formatTimeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' });
}

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  upcoming: { bg: '#EDE9FE', color: '#7C3AED', label: 'Upcoming' },
  ongoing: { bg: '#FEF3C7', color: '#D97706', label: 'Ongoing' },
  accomplished: { bg: '#ECFDF5', color: '#059669', label: 'Accomplished' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
};

const modalityConfig: Record<string, { bg: string; color: string }> = {
  onsite: { bg: '#DBEAFE', color: '#2563EB' },
  hybrid: { bg: '#FDE68A', color: '#92400E' },
  virtual: { bg: '#E0E7FF', color: '#4338CA' },
};

interface EventWithCount extends AppEvent {
  registered: number;
}

export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const { saved, isSaved, toggle } = useSavedEvents();
  // Events with stamp activities (only those show the ⭐ Stamps badge)
  const [stampEvents, setStampEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    getSessions()
      .then((all) => setStampEvents(new Set(all.filter((x) => x.requiresStamp).map((x) => x.eventId))))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let alive = true;
    // Show the events right away; registration counts are filled in after
    // from ONE request. A failed count must never hide the event list
    // (one call per event used to time out on Vercel and leave it empty).
    getEvents()
      .then(async (data) => {
        if (!alive) return;
        setEvents(data.map((e) => ({ ...e, registered: 0 })));
        setLoading(false);
        const regs = await getAllRegistrations().catch(() => null);
        if (!alive || !regs) return;
        const counts = new Map<string, number>();
        for (const r of regs) if (r.rsvp !== 'declined') counts.set(r.eventId, (counts.get(r.eventId) ?? 0) + 1);
        setEvents(data.map((e) => ({ ...e, registered: counts.get(e.id) ?? 0 })));
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const upcoming = useMemo(
    () => events.filter((e) => e.status === 'upcoming' || e.status === 'ongoing'),
    [events],
  );
  const past = useMemo(
    () => events.filter((e) => e.status === 'accomplished' || e.status === 'cancelled'),
    [events],
  );

  const savedEvents = useMemo(() => events.filter((e) => saved.includes(e.id)), [events, saved]);
  const displayEvents = tab === 0 ? upcoming : tab === 1 ? past : savedEvents;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {user?.role === 'admin' && (
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h1" sx={{ mb: 0.5 }}>
            Events
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AWS Student Builder Group – Asia Pacific College
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {user?.role === 'admin' && (
            <Button
              variant="contained"
              size="small"
              sx={{ background: brand.gradient, borderRadius: 2 }}
              onClick={() => {
                navigate('/admin/events/new');
              }}
            >
              + Create Event
            </Button>
          )}
          {user?.role !== 'admin' && (
            <Chip
              icon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
              label="Switch Event"
              onClick={() => navigate('/select-event')}
              clickable
              sx={{
                fontWeight: 700,
                fontSize: '0.78rem',
                bgcolor: alpha(brand.primary, 0.1),
                color: brand.primary,
                border: `1px solid ${alpha(brand.primary, 0.25)}`,
                py: 1.8,
                px: 1,
                '&:hover': {
                  bgcolor: alpha(brand.primary, 0.18),
                },
              }}
            />
          )}
        </Box>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.95rem',
          },
          '& .Mui-selected': {
            color: brand.primary,
          },
          '& .MuiTabs-indicator': {
            backgroundColor: brand.primary,
            height: 3,
            borderRadius: 1.5,
          },
        }}
      >
        <Tab label={`Upcoming (${upcoming.length})`} />
        <Tab label={`Past (${past.length})`} />
        {user?.role !== 'admin' && <Tab label={`Saved (${savedEvents.length})`} />}
      </Tabs>

      {displayEvents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            {tab === 0 ? 'No upcoming events.' : tab === 1 ? 'No past events.' : 'Tap the bookmark on an event to save it here.'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: 'repeat(2, 1fr)',
            },
            gap: 2.5,
          }}
        >
          {displayEvents.map((event) => {
            const st = statusConfig[event.status] ?? statusConfig.upcoming;
            const md = modalityConfig[event.modality] ?? modalityConfig.onsite;
            const coverImage = event.imageUrl || '';
            const { month, day } = formatMonthDay(event.startAt);
            const eventTime = formatTimeOnly(event.startAt);

            return (
              <Box key={event.id} sx={{ display: 'flex', flexDirection: 'column' }}>
                <Card
                  variant="outlined"
                sx={{
                  position: 'relative',
                  borderRadius: '15px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 12px 28px ${alpha(brand.primary, 0.15)}`,
                    borderColor: brand.primary,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(`/events/${event.id}`)}
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', flex: 1 }}
                >
                  {/* Cover Image Header */}
                  <Box sx={{ position: 'relative', height: 160, width: '100%', overflow: 'hidden', bgcolor: alpha(brand.primary, 0.05) }}>
                    {coverImage ? (
                      <Box
                        component="img"
                        src={coverImage}
                        alt={event.title}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: event.status === 'accomplished' ? 'grayscale(0.4)' : 'none',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.5,
                          color: 'text.secondary',
                        }}
                      >
                        <ImageNotSupportedOutlinedIcon sx={{ fontSize: 32, opacity: 0.4 }} />
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.68rem', opacity: 0.7 }}
                        >
                          No image
                        </Typography>
                      </Box>
                    )}

                    {/* Date Badge Overlay (Top Left) */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        bgcolor: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(6px)',
                        borderRadius: '10px',
                        px: 1.2,
                        py: 0.5,
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        minWidth: 38,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          color: '#EF4444',
                          display: 'block',
                          fontSize: '0.8rem',
                          lineHeight: 1.1,
                        }}
                      >
                        {day}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          color: '#1A0A2E',
                          display: 'block',
                          fontSize: '0.6rem',
                          lineHeight: 1.1,
                        }}
                      >
                        {month}
                      </Typography>
                    </Box>


                  </Box>

                  {/* Card Body */}
                  <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', '&:last-child': { pb: 2 } }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        mb: 1,
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {event.title}
                    </Typography>

                    {/* Attendees/Registered Row */}
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.2 }}>
                      <AvatarGroup
                        max={3}
                        sx={{
                          '& .MuiAvatar-root': {
                            width: 22,
                            height: 22,
                            fontSize: '0.65rem',
                            border: '2px solid #fff',
                          },
                        }}
                      >
                        <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" />
                        <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" />
                        <Avatar src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" />
                      </AvatarGroup>
                      <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 700, fontSize: '0.75rem' }}>
                        {event.audience === 'officers'
                          ? 'Officers only'
                          : `${event.participantsEstimated ? 'Est. ' : ''}${event.participants} ${event.status === 'upcoming' ? 'Expected' : 'Attended'}`}
                      </Typography>
                    </Stack>

                    {/* Venue & Time Row */}
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
                      <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.75rem', mr: 1.5 }}>
                        {eventTime}
                      </Typography>
                      <PlaceIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
                      <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.75rem' }}>
                        {event.venue}
                      </Typography>
                    </Stack>

                    {/* Tags Row */}
                    <Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                      {event.tags.map((tag) => (
                        <TagChip key={tag} tag={tag} />
                      ))}
                    </Stack>

                    {/* Status & Modality Chip Row */}
                    <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                      <Chip
                        label={st.label}
                        size="small"
                        sx={{
                          backgroundColor: st.bg,
                          color: st.color,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                        }}
                      />
                      <Chip
                        label={event.modality.charAt(0).toUpperCase() + event.modality.slice(1)}
                        size="small"
                        sx={{
                          backgroundColor: md.bg,
                          color: md.color,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                      {stampEvents.has(event.id) && (
                        <Chip
                          label="⭐ Stamps"
                          size="small"
                          data-testid="stamps-badge"
                          sx={{ backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      )}
                    </Stack>
                  </CardContent>
                </CardActionArea>
                    {/* Share (next to the bookmark / edit icon) */}
                    <ShareEventButton
                      event={event}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 52,
                        bgcolor: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(6px)',
                        color: brand.primary,
                        width: 32,
                        height: 32,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        '&:hover': { bgcolor: '#fff' },
                      }}
                    />
                    {/* Bookmark or Edit Icon (Top Right) - outside the card's click area so it doesn't open the event */}
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(6px)',
                        color: user?.role === 'admin' ? brand.primary : '#EF4444',
                        width: 32,
                        height: 32,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        '&:hover': { bgcolor: '#fff' },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (user?.role === 'admin') {
                          navigate(`/admin/events/${event.id}/edit`);
                        } else {
                          void toggle(event.id);
                        }
                      }}
                      aria-label={user?.role === 'admin' ? 'Edit event' : isSaved(event.id) ? 'Remove from saved' : 'Save event'}
                      aria-pressed={user?.role === 'admin' ? undefined : isSaved(event.id)}
                    >
                      {user?.role === 'admin' ? (
                        <EditRoundedIcon sx={{ fontSize: 18 }} />
                      ) : isSaved(event.id) ? (
                        <BookmarkRoundedIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <BookmarkBorderRoundedIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
              </Card>

            </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
