import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventIcon from '@mui/icons-material/Event';
import InfoIcon from '@mui/icons-material/Info';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import { alpha, keyframes } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { getEvents } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import type { AppEvent } from '../types/event';

// ── Live pulse animation ──
const livePulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
`;

interface Notification {
  id: string;
  type: 'announcement' | 'event' | 'info' | 'live';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

/**
 * Compute a human-readable relative time description for an event.
 */
function getEventTimingLabel(event: AppEvent): { label: string; type: 'live' | 'soon' | 'upcoming' | 'past' } {
  const now = new Date();
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);

  if (now >= start && now <= end) {
    return { label: '🔴 HAPPENING NOW', type: 'live' };
  }

  const msUntilStart = start.getTime() - now.getTime();

  if (msUntilStart < 0) {
    // past
    const hoursAgo = Math.abs(msUntilStart) / (1000 * 60 * 60);
    if (hoursAgo < 1) return { label: `Ended ${Math.round(hoursAgo * 60)} min ago`, type: 'past' };
    if (hoursAgo < 24) return { label: `Ended ${Math.round(hoursAgo)} hours ago`, type: 'past' };
    return { label: `Ended ${Math.round(hoursAgo / 24)} days ago`, type: 'past' };
  }

  const minutes = msUntilStart / (1000 * 60);
  const hours = minutes / 60;
  const days = hours / 24;

  if (minutes <= 30) return { label: `⚡ Starting in ${Math.round(minutes)} min`, type: 'soon' };
  if (hours <= 2) return { label: `Starting in ${Math.round(minutes)} minutes`, type: 'soon' };
  if (hours <= 24) return { label: `Starting in ${Math.round(hours)} hours`, type: 'upcoming' };
  if (days <= 7) return { label: `Starting in ${Math.round(days)} days`, type: 'upcoming' };
  return { label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, type: 'upcoming' };
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    type: 'announcement',
    title: '🎉 Welcome to AWS Cloud Day APC 2026!',
    message: 'We\'re excited to have you! Check the Achievements tab for the full session schedule.',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 'n-3',
    type: 'info',
    title: 'Stamp collected! ⭐',
    message: 'Your stamp for the "Serverless API" workshop has been approved by an officer.',
    time: '1 hour ago',
    read: true,
  },
  {
    id: 'n-4',
    type: 'announcement',
    title: 'Lunch location changed',
    message: 'Lunch will be served at the 2nd Floor Cafeteria instead of the lobby. See you there!',
    time: '3 hours ago',
    read: true,
  },
  {
    id: 'n-5',
    type: 'info',
    title: 'Hackathon registration open',
    message: 'Day 2 hackathon spots are filling up fast! Register now through the Events tab.',
    time: '1 day ago',
    read: true,
  },
];

const ADMIN_MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'a-1',
    type: 'announcement',
    title: 'New User Registrations',
    message: 'You have 3 new user accounts pending role approval in the Admin Dashboard.',
    time: '10 mins ago',
    read: false,
  },
  {
    id: 'a-2',
    type: 'info',
    title: 'System Update',
    message: 'AWS Event Tracker v1.2 has been deployed. New event management features are now live.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 'a-3',
    type: 'event',
    title: 'Venue Capacity Warning',
    message: 'The "Serverless API" workshop is nearing maximum capacity (95/100).',
    time: '2 hours ago',
    read: true,
  },
];

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  announcement: { icon: <CampaignIcon />, color: brand.primary },
  event: { icon: <EventIcon />, color: brand.warning },
  info: { icon: <InfoIcon />, color: brand.success },
  live: { icon: <FiberManualRecordIcon />, color: '#EF4444' },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  // Build event-based notifications dynamically from event timing
  const eventNotifications: Notification[] = events
    .map((event) => {
      const timing = getEventTimingLabel(event);
      return {
        id: `event-${event.id}`,
        type: timing.type === 'live' ? 'live' as const : 'event' as const,
        title: timing.type === 'live'
          ? `🔴 ${event.title} — LIVE`
          : timing.type === 'soon'
          ? `⚡ ${event.title} — Starting Soon`
          : `📅 ${event.title}`,
        message: timing.type === 'live'
          ? `This event is happening right now at ${event.venue}! Join before it ends.`
          : timing.type === 'soon'
          ? `${timing.label}. Get ready — head to ${event.venue}.`
          : `${timing.label} at ${event.venue}. Don't miss it!`,
        time: timing.label,
        read: timing.type === 'past',
      };
    })
    .filter((n) => !n.read); // Only show unread / active event notifications

  let allNotifications: Notification[] = [];
  if (user?.role === 'admin') {
    allNotifications = [...ADMIN_MOCK_NOTIFICATIONS];
  } else {
    allNotifications = [...eventNotifications, ...MOCK_NOTIFICATIONS];
  }
  
  const unread = allNotifications.filter((n) => !n.read);
  const read = allNotifications.filter((n) => n.read);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h1">Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            Stay updated with event announcements
          </Typography>
        </Box>
        {unread.length > 0 && (
          <Chip
            label={`${unread.length} new`}
            size="small"
            sx={{
              backgroundColor: alpha(brand.primary, 0.1),
              color: brand.primary,
              fontWeight: 700,
            }}
          />
        )}
      </Stack>

      {/* Unread */}
      {unread.length > 0 && (
        <>
          <Typography variant="h6" sx={{ color: brand.primary, mb: 1.5, fontSize: '0.75rem' }}>
            NEW
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            {unread.map((notif) => {
              const isLive = notif.type === 'live';
              const config = typeConfig[notif.type] || typeConfig.event;
              return (
                <Card
                  key={notif.id}
                  sx={{
                    borderLeft: `4px solid ${config.color}`,
                    backgroundColor: isLive
                      ? alpha('#EF4444', 0.04)
                      : alpha(brand.primary, 0.02),
                    ...(isLive && {
                      border: `1.5px solid ${alpha('#EF4444', 0.3)}`,
                      borderLeft: `4px solid #EF4444`,
                    }),
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: alpha(config.color, 0.12),
                          color: config.color,
                          ...(isLive && {
                            animation: `${livePulse} 1.5s ease-in-out infinite`,
                          }),
                        }}
                      >
                        {config.icon}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.3 }}>
                          <Typography variant="h5" sx={{ fontSize: '0.9rem' }}>
                            {notif.title}
                          </Typography>
                          {isLive && (
                            <Chip
                              label="LIVE"
                              size="small"
                              icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#EF4444 !important' }} />}
                              sx={{
                                height: 22,
                                backgroundColor: alpha('#EF4444', 0.1),
                                color: '#EF4444',
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                animation: `${livePulse} 2s ease-in-out infinite`,
                              }}
                            />
                          )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, lineHeight: 1.5 }}>
                          {notif.message}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <AccessTimeFilledIcon sx={{ fontSize: 12, color: brand.textSecondary }} />
                          <Typography variant="caption" color="text.secondary">
                            {notif.time}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </>
      )}

      {/* Read */}
      {read.length > 0 && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ color: brand.textSecondary, mb: 1.5, fontSize: '0.75rem' }}>
            EARLIER
          </Typography>
          <Stack spacing={1.5}>
            {read.map((notif) => {
              const config = typeConfig[notif.type] || typeConfig.event;
              return (
                <Card key={notif.id} variant="outlined" sx={{ opacity: 0.75 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: alpha(config.color, 0.08),
                          color: config.color,
                        }}
                      >
                        {config.icon}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h5" sx={{ mb: 0.3, fontSize: '0.9rem' }}>
                          {notif.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, lineHeight: 1.5 }}>
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {notif.time}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </>
      )}
    </Box>
  );
}
