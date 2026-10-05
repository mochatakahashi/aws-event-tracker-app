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
import CircularProgress from '@mui/material/CircularProgress';
import PlaceIcon from '@mui/icons-material/PlaceRounded';
import AccessTimeIcon from '@mui/icons-material/AccessTimeRounded';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { alpha } from '@mui/material/styles';
import { getEvents } from '../services/eventService';
import { getRegistrationsByEvent } from '../services/registrationService';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/theme';
import type { AppEvent } from '../types/event';

const EVENT_COVER_IMAGES: Record<string, string> = {
  conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  meetup: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
  workshop: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
  hackathon: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  webinar: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
};

function formatMonthDay(iso: string): { month: string; day: string } {
  const d = new Date(iso);
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate().toString();
  return { month, day };
}

function formatTimeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  upcoming: { bg: '#EDE9FE', color: '#7C3AED', label: 'Upcoming' },
  ongoing: { bg: '#FEF3C7', color: '#D97706', label: 'Ongoing' },
  completed: { bg: '#ECFDF5', color: '#059669', label: 'Finished' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
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

  useEffect(() => {
    getEvents()
      .then(async (data) => {
        const withCounts = await Promise.all(
          data.map(async (e) => ({
            ...e,
            registered: (await getRegistrationsByEvent(e.id)).length,
          })),
        );
        setEvents(withCounts);
      })
      .finally(() => setLoading(false));
  }, []);

  const upcoming = useMemo(
    () => events.filter((e) => e.status === 'upcoming' || e.status === 'ongoing'),
    [events],
  );
  const past = useMemo(
    () => events.filter((e) => e.status === 'completed' || e.status === 'cancelled'),
    [events],
  );

  const displayEvents = tab === 0 ? upcoming : past;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
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
      </Tabs>

      {displayEvents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            {tab === 0 ? 'No upcoming events.' : 'No past events.'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
            },
            gap: 2.5,
          }}
        >
          {displayEvents.map((event) => {
            const st = statusConfig[event.status] ?? statusConfig.upcoming;
            const coverImage = event.imageUrl || EVENT_COVER_IMAGES[event.category] || EVENT_COVER_IMAGES.conference;
            const { month, day } = formatMonthDay(event.startAt);
            const eventTime = formatTimeOnly(event.startAt);

            return (
              <Card
                key={event.id}
                variant="outlined"
                sx={{
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
                  <Box sx={{ position: 'relative', height: 160, width: '100%', overflow: 'hidden' }}>
                    <Box
                      component="img"
                      src={coverImage}
                      alt={event.title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: event.status === 'completed' ? 'grayscale(0.4)' : 'none',
                      }}
                    />

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

                    {/* Bookmark or Edit Icon (Top Right) */}
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
                        }
                      }}
                    >
                      {user?.role === 'admin' ? (
                        <EditRoundedIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <BookmarkBorderRoundedIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
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
                        +{event.registered} Going
                      </Typography>
                    </Stack>

                    {/* Venue & Time Row */}
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 2 }}>
                      <AccessTimeIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
                      <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.75rem', mr: 1.5 }}>
                        {eventTime}
                      </Typography>
                      <PlaceIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
                      <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.75rem' }}>
                        {event.venue}
                      </Typography>
                    </Stack>

                    {/* Status Chip Row */}
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
                        label={event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
