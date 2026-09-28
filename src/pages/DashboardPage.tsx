import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StarsIcon from '@mui/icons-material/Stars';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { alpha } from '@mui/material/styles';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { getSessionsByEvent } from '../services/sessionService';
import { brand } from '../theme/theme';
import type { Session } from '../types/session';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { selectedEvent } = useEvent();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedEvent) {
      setLoading(false);
      return;
    }
    getSessionsByEvent(selectedEvent.id)
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [selectedEvent]);

  if (!selectedEvent) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CalendarMonthIcon sx={{ fontSize: 64, color: alpha(brand.primary, 0.3), mb: 2 }} />
        <Typography variant="h2" gutterBottom>
          No event selected
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Choose an event to see your dashboard.
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

  const stampSessions = sessions.filter((s) => s.requiresStamp);
  // Mock: assume 1 stamp earned for demo
  const stampsEarned = 1;
  const totalStamps = stampSessions.length;
  const progress = totalStamps > 0 ? (stampsEarned / totalStamps) * 100 : 0;

  const upcomingSessions = sessions
    .filter((s) => s.status === 'not-started')
    .slice(0, 3);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Greeting */}
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        👋 Hey, {user?.name?.split(' ')[0]}!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Here's your overview for {selectedEvent.title}
      </Typography>

      {/* Stats Row */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Card
          sx={{
            flex: 1,
            background: brand.gradient,
            color: '#fff',
            '&:hover': { transform: 'none' },
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <BoltRoundedIcon sx={{ fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>
                SESSIONS
              </Typography>
            </Stack>
            <Typography variant="h2" sx={{ color: '#fff', fontWeight: 800 }}>
              {sessions.length}
            </Typography>
          </CardContent>
        </Card>

        {totalStamps > 0 && (
          <Card
            sx={{
              flex: 1,
              background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`,
              color: '#fff',
              '&:hover': { transform: 'none' },
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <StarsIcon sx={{ fontSize: 20 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>
                  STAMPS
                </Typography>
              </Stack>
              <Typography variant="h2" sx={{ color: '#fff', fontWeight: 800 }}>
                {stampsEarned}/{totalStamps}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>

      {/* Stamp Progress */}
      {totalStamps > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h5">Stamp Progress</Typography>
              <Chip
                label={`${Math.round(progress)}%`}
                size="small"
                sx={{
                  backgroundColor: alpha(brand.primary, 0.1),
                  color: brand.primary,
                  fontWeight: 700,
                }}
              />
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(brand.primary, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: brand.gradient,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Complete workshop activities to earn stamps. Officers will approve your completion.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
        <Card
          sx={{ flex: 1, cursor: 'pointer' }}
          onClick={() => navigate('/flow')}
        >
          <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
            <BoltRoundedIcon sx={{ color: brand.primary, fontSize: 28, mb: 0.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
              View Flow
            </Typography>
          </CardContent>
        </Card>
        <Card
          sx={{ flex: 1, cursor: 'pointer' }}
          onClick={() => navigate('/events')}
        >
          <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
            <CalendarMonthIcon sx={{ color: brand.primary, fontSize: 28, mb: 0.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
              All Events
            </Typography>
          </CardContent>
        </Card>
        <Card
          sx={{ flex: 1, cursor: 'pointer' }}
          onClick={() => navigate('/select-event')}
        >
          <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
            <ArrowForwardRoundedIcon sx={{ color: brand.primary, fontSize: 28, mb: 0.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
              Switch Event
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Upcoming Sessions */}
      <Typography variant="h3" sx={{ mb: 2 }}>
        Upcoming Sessions
      </Typography>
      {upcomingSessions.length === 0 ? (
        <Typography color="text.secondary">No upcoming sessions for this event.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {upcomingSessions.map((session) => (
            <Card
              key={session.id}
              variant="outlined"
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate(`/flow/session/${session.id}`)}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h5" sx={{ mb: 0.5 }}>
                  {session.title}
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {new Date(session.startTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    📍 {session.room}
                  </Typography>
                  {session.requiresStamp && (
                    <Chip
                      label="⭐ Stamp"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        backgroundColor: alpha(brand.warning, 0.15),
                        color: '#D97706',
                      }}
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
