import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import CircularProgress from '@mui/material/CircularProgress';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { alpha } from '@mui/material/styles';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { getSessionsByEvent, getStampsByAttendee } from '../services/sessionService';
import { brand } from '../theme/theme';
import EventStampCard from '../components/EventStampCard';
import EngagementScoreCard from '../components/EngagementScoreCard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { selectedEvent } = useEvent();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedEvent) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getSessionsByEvent(selectedEvent.id),
      user?.personId ? getStampsByAttendee(user.personId) : Promise.resolve([]),
    ])
      .then(([sess, stmps]) => {
        setSessions(sess);
        setStamps(stmps);
      })
      .finally(() => setLoading(false));
  }, [selectedEvent, user?.personId]);

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
      {/* Admin Panel Link */}
      {user?.role === 'admin' ? (
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Card 
            variant="outlined" 
            sx={{ 
              borderColor: alpha(brand.primary, 0.3),
              bgcolor: alpha(brand.primary, 0.02)
            }}
          >
            <CardActionArea onClick={() => navigate('/admin')} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: alpha(brand.primary, 0.1),
                  color: brand.primary,
                  display: 'flex'
                }}>
                  <AdminPanelSettingsIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" color="primary" sx={{ mb: 0.2 }}>
                    Manage Accounts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approve roles & view users
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>

          <Card 
            variant="outlined" 
            sx={{ 
              borderColor: alpha(brand.primary, 0.3),
              bgcolor: alpha(brand.primary, 0.02)
            }}
          >
            <CardActionArea onClick={() => navigate('/events')} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: alpha(brand.primary, 0.1),
                  color: brand.primary,
                  display: 'flex'
                }}>
                  <CalendarMonthIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" color="primary" sx={{ mb: 0.2 }}>
                    Edit Events
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create, update, or delete events
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Stack>
      ) : (
        <>
          {/* Engagement Score & Activity Gauge Widget */}
          <EngagementScoreCard sessions={sessions} stamps={stamps} />

          {/* Attendee Event Stamp Card */}
          <EventStampCard />
        </>
      )}

    </Box>
  );
}
