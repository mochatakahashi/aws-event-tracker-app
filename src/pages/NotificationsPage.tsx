import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventIcon from '@mui/icons-material/Event';
import VerifiedIcon from '@mui/icons-material/Verified';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import AssignmentIcon from '@mui/icons-material/Assignment';
import StarsIcon from '@mui/icons-material/Stars';
import BlockIcon from '@mui/icons-material/Block';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsOffOutlinedIcon from '@mui/icons-material/NotificationsOffOutlined';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { getEvents } from '../services/eventService';
import { getRegistrationsByPerson } from '../services/registrationService';
import {
  deleteNotification,
  getNotifications,
  markAllRead,
  markRead,
  NOTIFICATIONS_CHANGED,
} from '../services/notificationService';
import type { AppNotification, NotificationKind } from '../types/notification';
import type { AppEvent } from '../types/event';

const KIND: Record<NotificationKind, { icon: ReactNode; color: string }> = {
  'account-approved': { icon: <HowToRegIcon />, color: brand.success },
  'account-declined': { icon: <BlockIcon />, color: brand.error },
  'signup-pending': { icon: <PersonAddAlt1Icon />, color: brand.warning },
  'event-assigned': { icon: <EventIcon />, color: brand.primary },
  'task-assigned': { icon: <AssignmentIcon />, color: brand.primary },
  'stamp-approved': { icon: <StarsIcon />, color: brand.success },
  'stamp-declined': { icon: <BlockIcon />, color: brand.error },
  'checked-in': { icon: <VerifiedIcon />, color: brand.success },
  announcement: { icon: <CampaignIcon />, color: brand.primary },
};

/** "5 min ago", "3 h ago", "Oct 12". */
export function timeAgo(iso: string, now = Date.now()): string {
  const mins = Math.round((now - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
}

/** Events the person registered for that are live now or start within 24 hours. */
function liveOrSoon(events: AppEvent[], myEventIds: Set<string>) {
  const now = Date.now();
  return events
    .filter((e) => myEventIds.has(e.id) && e.status !== 'cancelled')
    .map((e) => {
      const start = new Date(e.startAt).getTime();
      const end = new Date(e.endAt).getTime();
      const live = now >= start && now <= end;
      const soon = !live && start > now && start - now <= 24 * 3600 * 1000;
      return { event: e, live, soon, hours: Math.max(1, Math.round((start - now) / 3600000)) };
    })
    .filter((x) => x.live || x.soon);
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [live, setLive] = useState<ReturnType<typeof liveOrSoon>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setItems(await getNotifications(user.personId));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
    window.addEventListener(NOTIFICATIONS_CHANGED, load);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, load);
  }, [load]);

  useEffect(() => {
    if (!user || user.role === 'admin') return;
    Promise.all([getEvents(), getRegistrationsByPerson(user.personId)])
      .then(([events, regs]) =>
        setLive(liveOrSoon(events, new Set(regs.filter((r) => r.rsvp !== 'declined').map((r) => r.eventId)))),
      )
      .catch(() => undefined);
  }, [user]);

  async function open(n: AppNotification) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      void markRead(n.id).catch(() => undefined);
    }
    if (n.link) navigate(n.link);
  }

  async function remove(n: AppNotification) {
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    await deleteNotification(n.id).catch(() => void load());
  }

  async function readAll() {
    if (!user) return;
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    await markAllRead(user.personId).catch(() => void load());
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const unread = items.filter((n) => !n.read);
  const earlier = items.filter((n) => n.read);

  const row = (n: AppNotification) => {
    const k = KIND[n.kind] ?? KIND.announcement;
    return (
      <Card
        key={n.id}
        variant="outlined"
        sx={{
          position: 'relative',
          borderLeft: `4px solid ${n.read ? alpha(k.color, 0.3) : k.color}`,
          bgcolor: n.read ? 'background.paper' : alpha(brand.primary, 0.03),
        }}
      >
        <CardActionArea onClick={() => open(n)} sx={{ p: 2, pr: 6 }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(k.color, 0.12), backgroundImage: 'none', color: k.color }}>{k.icon}</Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" sx={{ fontWeight: n.read ? 600 : 800 }}>
                  {n.title}
                </Typography>
                {!n.read && <FiberManualRecordIcon sx={{ fontSize: 10, color: brand.primary }} aria-label="unread" />}
              </Stack>
              {n.message && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, lineHeight: 1.5 }}>
                  {n.message}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {timeAgo(n.createdAt)}
              </Typography>
            </Box>
          </Stack>
        </CardActionArea>
        <IconButton
          size="small"
          aria-label="Remove notification"
          onClick={() => remove(n)}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Card>
    );
  };

  return (
    <Box sx={{ maxWidth: 820 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h1">Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            {unread.length > 0 ? `${unread.length} unread` : "You're all caught up"}
          </Typography>
        </Box>
        {unread.length > 0 && (
          <Button size="small" startIcon={<DoneAllIcon />} onClick={readAll} sx={{ flexShrink: 0 }}>
            Mark all as read
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {live.length > 0 && (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {live.map(({ event, live: isLive, hours }) => (
            <Card
              key={event.id}
              variant="outlined"
              sx={{ borderColor: alpha(isLive ? '#EF4444' : brand.warning, 0.5), bgcolor: alpha(isLive ? '#EF4444' : brand.warning, 0.04) }}
            >
              <CardActionArea onClick={() => navigate(`/events/${event.id}`)} sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip
                    size="small"
                    label={isLive ? 'LIVE' : `In ${hours} h`}
                    sx={{ fontWeight: 800, bgcolor: isLive ? '#EF4444' : brand.warning, color: '#fff' }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                      {event.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isLive ? `Happening now at ${event.venue}` : `Starts soon at ${event.venue}`}
                    </Typography>
                  </Box>
                </Stack>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}

      {items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <NotificationsOffOutlinedIcon sx={{ fontSize: 48, opacity: 0.4, mb: 1 }} />
          <Typography>No notifications yet.</Typography>
          <Typography variant="body2">
            Stamp approvals, account updates, event assignments and tasks will show up here.
          </Typography>
        </Box>
      ) : (
        <>
          {unread.length > 0 && (
            <>
              <Typography variant="overline" sx={{ color: brand.primary, fontWeight: 700 }}>
                New
              </Typography>
              <Stack spacing={1.25} sx={{ mb: 3 }}>
                {unread.map(row)}
              </Stack>
            </>
          )}
          {earlier.length > 0 && (
            <>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                Earlier
              </Typography>
              <Stack spacing={1.25}>{earlier.map(row)}</Stack>
            </>
          )}
        </>
      )}
    </Box>
  );
}
