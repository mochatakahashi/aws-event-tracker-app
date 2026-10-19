import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LeaderboardRoundedIcon from '@mui/icons-material/LeaderboardRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { getEvents } from '../services/eventService';
import { getAllRegistrations } from '../services/registrationService';
import { getTasks } from '../services/taskService';
import { getUsers } from '../services/authService';
import { COMMITTEE_LABELS } from '../utils/people';
import { deadlineInfo, isApprovedTask, TASK_STATUS_LABELS, type OfficerTask } from '../types/task';
import type { AppEvent } from '../types/event';
import type { Registration } from '../types/attendee';
import type { User } from '../types/auth';
import AnnouncementsCard from './AnnouncementsCard';
import SignoffPanel from './SignoffPanel';
import { StatRow, StatTile } from './AdminUi';
import { DeadlineChip } from './TaskThread';

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });

/**
 * The adviser's home: post announcements to the officers, sign what they send,
 * and see how the org is doing (events, attendance, officer tasks). View-only:
 * the adviser can't edit events, accounts or tasks.
 */
export default function AdviserHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [tasks, setTasks] = useState<OfficerTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [taskView, setTaskView] = useState<'open' | 'done' | 'late'>('open');

  useEffect(() => {
    getEvents().then(setEvents).catch(() => undefined);
    getAllRegistrations().then(setRegs).catch(() => undefined);
    getTasks().then((t) => setTasks(t.filter(isApprovedTask))).catch(() => undefined);
    getUsers().then(setUsers).catch(() => undefined);
  }, []);

  const officers = users.filter((u) => u.role === 'officer' && (!u.status || u.status === 'approved'));
  const nameOf = (id: string) => users.find((u) => u.personId === id)?.name || 'Officer';
  const upcoming = events.filter((e) => e.status === 'upcoming' || e.status === 'ongoing');
  const past = events.filter((e) => e.status === 'accomplished').slice(-6).reverse();
  const count = useMemo(() => {
    const m = new Map<string, { reg: number; inn: number }>();
    for (const r of regs) {
      if (r.rsvp === 'declined') continue;
      const c = m.get(r.eventId) ?? { reg: 0, inn: 0 };
      c.reg++;
      if (r.checkedIn) c.inn++;
      m.set(r.eventId, c);
    }
    return m;
  }, [regs]);
  const plain = tasks.filter((t) => t.kind !== 'pubmat');
  const open = plain.filter((t) => t.status !== 'done');
  const done = plain.filter((t) => t.status === 'done');
  const late = plain.filter((t) => deadlineInfo(t).tone === 'late');
  const onTime = done.filter((t) => deadlineInfo(t).label === 'Done on time');
  const list = (taskView === 'open' ? open : taskView === 'done' ? done : late).slice(0, 30);

  if (!user) return null;
  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.25 }}>
        👋 Hello, {user.firstName || user.name.split(' ')[0]}!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Adviser view of AWS SBG-APC — announcements, sign-offs and how the org is doing.
      </Typography>

      <StatRow>
        <StatTile label="Officers" value={officers.length} />
        <StatTile label="Upcoming events" value={upcoming.length} />
        <StatTile label="Open tasks" value={open.length} color={brand.warning} />
        <StatTile label="Done on time" value={onTime.length} color={brand.success} />
        <StatTile label="Overdue / late" value={late.length} color={brand.error} />
      </StatRow>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' }, gap: { xs: 0, lg: 3 }, alignItems: 'start' }}>
        <Box>
          <SignoffPanel viewer={user} />
          <AnnouncementsCard viewer={user} />
        </Box>
        <Box>
          <Card variant="outlined" sx={{ mb: 3, borderRadius: '16px' }} data-testid="adviser-tasks">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
                <AssignmentIcon sx={{ color: brand.primary }} />
                <Typography variant="h3" sx={{ flex: 1 }}>
                  Officer tasks
                </Typography>
                <ToggleButtonGroup size="small" exclusive value={taskView} onChange={(_e, v) => v && setTaskView(v)}>
                  <ToggleButton value="open">Open ({open.length})</ToggleButton>
                  <ToggleButton value="done">Done ({done.length})</ToggleButton>
                  <ToggleButton value="late">Late ({late.length})</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              {list.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nothing here.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {list.map((t) => (
                    <Box key={t.id} sx={{ p: 1.25, borderRadius: '10px', border: `1px solid ${alpha(brand.primary, 0.1)}` }}>
                      <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {t.title}
                        </Typography>
                        <Chip size="small" label={TASK_STATUS_LABELS[t.status]} />
                      </Stack>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                        <Chip size="small" variant="outlined" label={t.assigneeIds.map(nameOf).join(', ')} />
                        {t.committee && <Chip size="small" variant="outlined" color="primary" label={COMMITTEE_LABELS[t.committee]} />}
                        <DeadlineChip task={t} />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 3, borderRadius: '16px' }} data-testid="adviser-events">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <CalendarMonthIcon sx={{ color: brand.primary }} />
                <Typography variant="h3" sx={{ flex: 1 }}>
                  Events
                </Typography>
                <Button size="small" onClick={() => navigate('/events')}>
                  All events
                </Button>
              </Stack>
              <Stack spacing={1}>
                {[...upcoming, ...past].map((e) => {
                  const c = count.get(e.id) ?? { reg: 0, inn: 0 };
                  return (
                    <Stack
                      key={e.id}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      role="button"
                      onClick={() => navigate(`/events/${e.id}`)}
                      sx={{ p: 1.25, borderRadius: '10px', cursor: 'pointer', border: `1px solid ${alpha(brand.primary, 0.1)}`, '&:hover': { bgcolor: alpha(brand.primary, 0.04) } }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                          {e.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {day(e.startAt)} · {e.status === 'accomplished' ? `${c.inn} attended of ${c.reg} registered` : `${c.reg} registered`}
                        </Typography>
                      </Box>
                      <Chip size="small" variant="outlined" label={e.status === 'accomplished' ? 'Past' : e.status === 'ongoing' ? 'Live' : 'Upcoming'} />
                    </Stack>
                  );
                })}
              </Stack>
              <Button size="small" startIcon={<LeaderboardRoundedIcon />} sx={{ mt: 1.5 }} onClick={() => navigate('/leaderboard')}>
                Leaderboard
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
