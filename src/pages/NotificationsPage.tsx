import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventIcon from '@mui/icons-material/Event';
import InfoIcon from '@mui/icons-material/Info';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';

interface Notification {
  id: string;
  type: 'announcement' | 'event' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    type: 'announcement',
    title: '🎉 Welcome to AWS Cloud Day APC 2026!',
    message: 'We\'re excited to have you! Check the Flow tab for the full session schedule.',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 'n-2',
    type: 'event',
    title: 'Workshop starts in 30 minutes',
    message: '"Deploy Your First App on AWS" begins at 10:30 AM in Workshop Room A. Don\'t forget your laptop!',
    time: '30 min ago',
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
    type: 'event',
    title: 'Hackathon registration open',
    message: 'Day 2 hackathon spots are filling up fast! Register now through the Flow tab.',
    time: '1 day ago',
    read: true,
  },
];

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  announcement: { icon: <CampaignIcon />, color: brand.primary },
  event: { icon: <EventIcon />, color: brand.warning },
  info: { icon: <InfoIcon />, color: brand.success },
};

export default function NotificationsPage() {
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read);
  const read = MOCK_NOTIFICATIONS.filter((n) => n.read);

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
              const config = typeConfig[notif.type];
              return (
                <Card
                  key={notif.id}
                  sx={{
                    borderLeft: `4px solid ${config.color}`,
                    backgroundColor: alpha(brand.primary, 0.02),
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

      {/* Read */}
      {read.length > 0 && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ color: brand.textSecondary, mb: 1.5, fontSize: '0.75rem' }}>
            EARLIER
          </Typography>
          <Stack spacing={1.5}>
            {read.map((notif) => {
              const config = typeConfig[notif.type];
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
