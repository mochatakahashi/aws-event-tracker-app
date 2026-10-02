import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import CardActionArea from '@mui/material/CardActionArea';
import { alpha } from '@mui/material/styles';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { getSessionsByEvent, getStampsByAttendee } from '../services/sessionService';
import { getEvents } from '../services/eventService';
import { brand } from '../theme/theme';
import type { Session } from '../types/session';
import type { Stamp } from '../types/session';
import type { AppEvent } from '../types/event';
import EventStampCard from '../components/EventStampCard';

export default function AchievementsPage() {
  const navigate = useNavigate();
  const { selectedEvent } = useEvent();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [allEvents, setAllEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const promises: Promise<unknown>[] = [getEvents()];

    if (selectedEvent) {
      promises.push(getSessionsByEvent(selectedEvent.id));
    }
    if (user?.personId) {
      promises.push(getStampsByAttendee(user.personId));
    }

    Promise.all(promises)
      .then((results) => {
        setAllEvents(results[0] as AppEvent[]);
        if (selectedEvent && results.length > 1) setSessions(results[1] as Session[]);
        if (user?.personId && results.length > 2) setStamps(results[2] as Stamp[]);
        if (!selectedEvent && user?.personId && results.length > 1) setStamps(results[1] as Stamp[]);
      })
      .finally(() => setLoading(false));
  }, [selectedEvent, user?.personId]);

  // Completed events (past events the user has stamps for)
  const attendedEvents = useMemo(() => {
    const completedEventIds = new Set(
      allEvents.filter((e) => e.status === 'completed').map((e) => e.id),
    );
    // For now, show completed events as "attended" (in a real app we'd check registration)
    return allEvents.filter((e) => completedEventIds.has(e.id));
  }, [allEvents]);

  // Stats
  const stampSessionCount = sessions.filter((s) => s.requiresStamp).length;
  const completedStamps = stamps.filter((s) => s.status === 'approved').length;
  const totalStamps = stamps.length;

  if (!selectedEvent) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <EmojiEventsRoundedIcon sx={{ fontSize: 72, color: alpha(brand.primary, 0.3), mb: 2 }} />
        <Typography variant="h2" gutterBottom>
          My Achievements
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Select an event to view your stamps and achievements.
        </Typography>
        <CardActionArea
          onClick={() => navigate('/select-event')}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 3,
            py: 1.5,
            borderRadius: 3,
            background: brand.gradient,
            color: '#fff',
            fontWeight: 600,
          }}
        >
          Select Event <ArrowForwardRoundedIcon />
        </CardActionArea>
      </Box>
    );
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
      {/* Page Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <EmojiEventsRoundedIcon sx={{ color: brand.primary, fontSize: 28 }} />
            <Typography variant="h2" sx={{ fontWeight: 700 }}>
              MY ACHIEVEMENTS
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Track your stamps, sessions attended, and event milestones.
          </Typography>
        </Box>
      </Stack>

      {/* Stats Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1.5,
          mt: 3,
          mb: 3,
        }}
      >
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            border: `1.5px solid ${alpha('#8B5CF6', 0.2)}`,
            background: `linear-gradient(135deg, ${alpha('#8B5CF6', 0.06)} 0%, ${alpha('#8B5CF6', 0.02)} 100%)`,
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#8B5CF6', fontSize: { xs: '1.6rem', sm: '2rem' } }}>
              {completedStamps}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: brand.textSecondary, fontSize: '0.65rem' }}>
              STAMPS EARNED
            </Typography>
          </CardContent>
        </Card>

        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            border: `1.5px solid ${alpha('#F59E0B', 0.2)}`,
            background: `linear-gradient(135deg, ${alpha('#F59E0B', 0.06)} 0%, ${alpha('#F59E0B', 0.02)} 100%)`,
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#F59E0B', fontSize: { xs: '1.6rem', sm: '2rem' } }}>
              {totalStamps - completedStamps}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: brand.textSecondary, fontSize: '0.65rem' }}>
              PENDING
            </Typography>
          </CardContent>
        </Card>

        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            border: `1.5px solid ${alpha('#10B981', 0.2)}`,
            background: `linear-gradient(135deg, ${alpha('#10B981', 0.06)} 0%, ${alpha('#10B981', 0.02)} 100%)`,
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#10B981', fontSize: { xs: '1.6rem', sm: '2rem' } }}>
              {attendedEvents.length}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: brand.textSecondary, fontSize: '0.65rem' }}>
              EVENTS ATTENDED
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Current Event Stamp Progress */}
      {stampSessionCount > 0 && (
        <Card
          variant="outlined"
          sx={{
            mb: 3,
            borderRadius: 3,
            border: `1.5px solid ${alpha(brand.primary, 0.15)}`,
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <WorkspacePremiumRoundedIcon sx={{ color: brand.primary, fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                Current Event Progress
              </Typography>
              <Chip
                label={`${completedStamps}/${stampSessionCount}`}
                size="small"
                sx={{
                  backgroundColor: alpha(brand.primary, 0.1),
                  color: brand.primary,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                }}
              />
            </Stack>
            <LinearProgress
              variant="determinate"
              value={stampSessionCount > 0 ? (completedStamps / stampSessionCount) * 100 : 0}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: alpha(brand.primary, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  background: completedStamps === stampSessionCount
                    ? 'linear-gradient(90deg, #10B981, #34D399)'
                    : brand.gradient,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.8, display: 'block' }}>
              {completedStamps === stampSessionCount
                ? '🎉 Congratulations! You completed all stamps for this event!'
                : `${stampSessionCount - completedStamps} more stamp${stampSessionCount - completedStamps > 1 ? 's' : ''} to go!`}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Stamp Passport Card */}
      <EventStampCard title="STAMP PASSPORT" />

      {/* Attended Events Section */}
      {attendedEvents.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="h6"
            sx={{ color: brand.primary, fontSize: '0.75rem', mb: 2, letterSpacing: '0.05em' }}
          >
            ATTENDED EVENTS
          </Typography>
          <Stack spacing={1.5}>
            {attendedEvents.map((event) => (
              <Card
                key={event.id}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 16px ${alpha(brand.primary, 0.12)}`,
                  },
                }}
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${alpha('#10B981', 0.15)} 0%, ${alpha('#10B981', 0.05)} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircleRoundedIcon sx={{ color: '#10B981', fontSize: 24 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h5" noWrap sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {event.title}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CalendarMonthIcon sx={{ fontSize: 14, color: brand.textSecondary }} />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(event.startAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Typography>
                        <Chip
                          label={event.category}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            backgroundColor: alpha(brand.primary, 0.08),
                            color: brand.primary,
                          }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
