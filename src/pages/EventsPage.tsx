import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleIcon from '@mui/icons-material/People';
import { alpha } from '@mui/material/styles';
import { getEvents } from '../services/eventService';
import { getRegistrationsByEvent } from '../services/registrationService';
import { brand } from '../theme/theme';
import type { AppEvent } from '../types/event';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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
      <Typography variant="h1" sx={{ mb: 0.5 }}>
        Events
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        AWS Student Builder Group – Asia Pacific College
      </Typography>

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
        <Stack spacing={2}>
          {displayEvents.map((event) => {
            const st = statusConfig[event.status] ?? statusConfig.upcoming;
            return (
              <Card
                key={event.id}
                variant="outlined"
                sx={{
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: brand.primary,
                  },
                }}
              >
                <CardActionArea onClick={() => navigate(`/events/${event.id}`)}>
                  {/* Purple accent strip */}
                  <Box
                    sx={{
                      height: 4,
                      background: event.status === 'upcoming' ? brand.gradient : alpha(brand.textSecondary, 0.2),
                    }}
                  />
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" sx={{ mb: 1, lineHeight: 1.3 }}>
                          {event.title}
                        </Typography>

                        <Stack spacing={0.6} sx={{ mb: 1.5 }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <CalendarTodayIcon sx={{ fontSize: 15, color: brand.textSecondary }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              {formatDate(event.startAt)} · {formatTime(event.startAt)} – {formatTime(event.endAt)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <PlaceIcon sx={{ fontSize: 15, color: brand.textSecondary }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              {event.venue}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <PeopleIcon sx={{ fontSize: 15, color: brand.textSecondary }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              {event.registered} registered
                              {event.capacity > 0 ? ` · ${event.capacity - event.registered} spots left` : ''}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={st.label}
                            size="small"
                            sx={{
                              backgroundColor: st.bg,
                              color: st.color,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                          <Chip
                            label={event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', fontWeight: 500 }}
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
