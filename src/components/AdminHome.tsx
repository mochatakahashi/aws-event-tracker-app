import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import LeaderboardRoundedIcon from '@mui/icons-material/LeaderboardRounded';
import Alert from '@mui/material/Alert';
import { getEvents, getMissingClubEvents, importClubEvents } from '../services/eventService';
import type { AppEvent } from '../types/event';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { getUsers } from '../services/authService';
import { getTasks } from '../services/taskService';
import { notifyQuietly } from '../services/notifyService';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';

interface Item {
  title: string;
  description: string;
  to: string;
  icon: ReactNode;
  badge?: number;
  badgeLabel?: string;
}

/** The admin's home: one card per admin area. */
export default function AdminHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pending, setPending] = useState(0);
  const [openTasks, setOpenTasks] = useState(0);
  const [reminderNote, setReminderNote] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [missingEvents, setMissingEvents] = useState<{ id: string; title: string }[]>([]);
  const [importNote, setImportNote] = useState('');
  const [importing, setImporting] = useState(false);
  const [unstaffed, setUnstaffed] = useState<AppEvent[]>([]);

  async function importEvents() {
    if (!user) return;
    setImporting(true);
    try {
      setImportNote(await importClubEvents(user.personId));
      setMissingEvents([]);
    } catch (e) {
      setImportNote(e instanceof Error ? e.message : 'Could not import the events.');
    } finally {
      setImporting(false);
    }
  }

  async function sendReminders() {
    if (!user) return;
    setSending(true);
    const note = await notifyQuietly({ type: 'run-reminders', actorId: user.personId });
    setReminderNote(note ?? 'No reminders were due today.');
    setSending(false);
  }

  useEffect(() => {
    getUsers()
      .then((users) => setPending(users.filter((u) => u.status === 'pending').length))
      .catch(() => undefined);
    getTasks()
      .then((tasks) => setOpenTasks(tasks.filter((t) => t.status !== 'done').length))
      .catch(() => undefined);
    getMissingClubEvents().then(setMissingEvents).catch(() => undefined);
    // Upcoming / live events where no officer may approve stamps or check people in
    getEvents()
      .then((evts) =>
        setUnstaffed(
          evts.filter(
            (e) =>
              (e.status === 'upcoming' || e.status === 'ongoing') &&
              !(e.stampOfficerIds?.length) &&
              !(e.checkinOfficerIds?.length),
          ),
        ),
      )
      .catch(() => undefined);
  }, []);

  const items: Item[] = [
    {
      title: 'Manage Accounts',
      description: 'Approve sign-ups and change roles',
      to: '/admin',
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 28 }} />,
      badge: pending,
      badgeLabel: 'waiting',
    },
    {
      title: 'Edit Events',
      description: 'Create, update, or delete events',
      to: '/events',
      icon: <CalendarMonthIcon sx={{ fontSize: 28 }} />,
    },
    {
      title: 'Attendees & Achievements',
      description: 'Attendee list, check-ins, stamp finishers, Excel for profs',
      to: '/admin/attendees',
      icon: <HowToRegIcon sx={{ fontSize: 28 }} />,
    },
    {
      title: 'Officers',
      description: 'Officer achievements and the events they volunteered for',
      to: '/admin/officers',
      icon: <MilitaryTechIcon sx={{ fontSize: 28 }} />,
    },
    {
      title: 'Officer Tasks',
      description: 'Assign tasks that officers see on their dashboard',
      to: '/admin/tasks',
      icon: <AssignmentIcon sx={{ fontSize: 28 }} />,
      badge: openTasks,
      badgeLabel: 'open',
    },
    {
      title: 'Leaderboard',
      description: 'Rankings and progress of all attendees and officers',
      to: '/leaderboard',
      icon: <LeaderboardRoundedIcon sx={{ fontSize: 28 }} />,
    },
    {
      title: 'Check-in Scanner',
      description: 'Scan QR passes at the door; certificates are issued on check-in',
      to: '/officer/scan',
      icon: <QrCodeScannerRoundedIcon sx={{ fontSize: 28 }} />,
    },
  ];

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        👋 Hey, {user?.firstName || user?.name?.split(' ')[0]}!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Admin dashboard
      </Typography>
      {missingEvents.length > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={importEvents} disabled={importing}>
              {importing ? 'Adding…' : 'Add them'}
            </Button>
          }
        >
          {missingEvents.length} club event{missingEvents.length === 1 ? '' : 's'} (e.g. {missingEvents[0].title}) aren't in the
          live database yet, so they don't show under Events.
        </Alert>
      )}
      {unstaffed.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          data-testid="unstaffed-alert"
          action={
            <Button color="inherit" size="small" onClick={() => navigate(`/events/${unstaffed[0].id}`)}>
              Set staff
            </Button>
          }
        >
          {unstaffed.length === 1 ? unstaffed[0].title : `${unstaffed.length} upcoming events (e.g. ${unstaffed[0].title})`} ha
          {unstaffed.length === 1 ? 's' : 've'} no officers for stamps or check-in yet — only admins can do them until you tick
          officers under Event staff.
        </Alert>
      )}
      {importNote && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setImportNote('')}>
          {importNote}
        </Alert>
      )}
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid key={item.to} size={{ xs: 12, sm: 6 }}>
            <Card
              variant="outlined"
              sx={{ height: '100%', borderColor: alpha(brand.primary, 0.3), bgcolor: alpha(brand.primary, 0.02) }}
            >
              <CardActionArea onClick={() => navigate(item.to)} sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(brand.primary, 0.1),
                      color: brand.primary,
                      display: 'flex',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h6" color="primary" sx={{ mb: 0.2 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Box>
                  {!!item.badge && (
                    <Chip size="small" color="warning" label={`${item.badge} ${item.badgeLabel}`} sx={{ flexShrink: 0 }} />
                  )}
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Reminder emails also go out automatically every day at 8:00 AM */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mt: 3 }}>
        <Button variant="outlined" startIcon={<MarkEmailReadOutlinedIcon />} onClick={sendReminders} disabled={sending} sx={{ whiteSpace: 'nowrap', flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}>
          {sending ? 'Sending…' : 'Send reminders now'}
        </Button>
        <Typography variant="caption" color="text.secondary">
          {reminderNote ??
            'Event reminders (day before and "see you today") and task due reminders are emailed automatically every day at 8:00 AM.'}
        </Typography>
      </Stack>
    </Box>
  );
}
