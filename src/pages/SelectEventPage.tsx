import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlaceIcon from '@mui/icons-material/Place';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { alpha } from '@mui/material/styles';
import { getEvents } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { brand } from '../theme/theme';
import type { AppEvent } from '../types/event';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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
  upcoming: { bg: '#DBEAFE', color: '#2563EB', label: 'Upcoming' },
  ongoing: { bg: '#FEF3C7', color: '#D97706', label: 'Ongoing' },
  completed: { bg: '#ECFDF5', color: '#059669', label: 'Finished' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
};

export default function SelectEventPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectEvent } = useEvent();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  function handleSelect(event: AppEvent) {
    selectEvent(event);
    navigate('/home');
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
        maxWidth: 600,
        mx: 'auto',
      }}
    >
      {/* Top Header Row with Back Button & Avatar */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/home')}
          sx={{
            color: brand.primary,
            fontWeight: 700,
            borderRadius: '20px',
            px: 2,
            py: 0.8,
            bgcolor: alpha(brand.primary, 0.08),
            '&:hover': {
              bgcolor: alpha(brand.primary, 0.15),
            },
          }}
        >
          Back
        </Button>
        <Avatar sx={{ width: 40, height: 40, fontSize: '0.9rem' }}>
          {initials}
        </Avatar>
      </Stack>

      <Typography
        variant="h1"
        sx={{
          fontWeight: 800,
          fontSize: { xs: '1.75rem', sm: '2.25rem' },
          mb: 3,
        }}
      >
        Select Event
      </Typography>

      {/* Event cards */}
      <Stack spacing={2}>
        {events.map((event) => {
          const st = statusConfig[event.status] ?? statusConfig.upcoming;
          return (
            <Card
              key={event.id}
              variant="outlined"
              sx={{
                transition: 'all 0.25s ease',
                '&:hover': {
                  borderColor: brand.primary,
                  boxShadow: `0 4px 20px ${alpha(brand.primary, 0.12)}`,
                },
              }}
            >
              <CardActionArea onClick={() => handleSelect(event)} sx={{ p: 0 }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1, pr: 1 }}>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: '1.1rem', sm: '1.25rem' },
                          mb: 1.5,
                          lineHeight: 1.3,
                        }}
                      >
                        {event.title}
                      </Typography>

                      <Stack spacing={0.8}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CalendarTodayIcon sx={{ fontSize: 16, color: brand.textSecondary }} />
                          <Typography variant="body2" sx={{ color: brand.primary, fontWeight: 500 }}>
                            {formatDate(event.startAt)} | {formatTime(event.startAt)}
                          </Typography>
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={1}>
                          <ArrowForwardIcon sx={{ fontSize: 14, color: brand.textSecondary, ml: 0.1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(event.endAt)} | {formatTime(event.endAt)}
                          </Typography>
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PlaceIcon sx={{ fontSize: 16, color: brand.textSecondary }} />
                          <Typography variant="body2" color="text.secondary">
                            {event.venue}
                          </Typography>
                        </Stack>
                      </Stack>

                      <Chip
                        label={st.label}
                        size="small"
                        sx={{
                          mt: 1.5,
                          backgroundColor: st.bg,
                          color: st.color,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    </Box>

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/${event.id}`);
                      }}
                      sx={{ color: brand.textSecondary, mt: 0.5 }}
                    >
                      <InfoOutlinedIcon />
                    </IconButton>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}
