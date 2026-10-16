import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { getStamps, getSessions, approveStamp, declineStamp } from '../services/sessionService';
import { getPeople } from '../services/registrationService';
import { notifyInApp } from '../services/notificationService';
import { getTasksForOfficer, updateTask } from '../services/taskService';
import { getEvents } from '../services/eventService';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { TASK_STATUS_LABELS, type OfficerTask, type TaskStatus } from '../types/task';
import type { AppEvent } from '../types/event';
import { formatDate } from '../components/AdminUi';
import { officerTitle } from '../utils/people';
import { useAuth } from '../context/AuthContext';
import type { Stamp, Session } from '../types/session';
import type { Person } from '../types/attendee';

export default function OfficerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [pendingStamps, setPendingStamps] = useState<Stamp[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<OfficerTask[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'officer') {
      navigate('/home');
      return;
    }

    Promise.all([
      getStamps(),
      getSessions(),
      getPeople(),
      user?.personId ? getTasksForOfficer(user.personId) : Promise.resolve([]),
      getEvents(),
    ])
      .then(([stmps, sess, ppl, myTasks, evts]) => {
        setPendingStamps(stmps.filter(s => s.status === 'pending'));
        setSessions(sess);
        setPeople(ppl);
        setTasks(myTasks);
        setEvents(evts);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your dashboard.'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  async function handleApprove(stampId: string) {
    if (!user?.personId) return;
    try {
      const stamp = pendingStamps.find(s => s.id === stampId);
      await approveStamp(stampId, user.personId);
      setPendingStamps(prev => prev.filter(s => s.id !== stampId));
      if (stamp) {
        const session = sessions.find(s => s.id === stamp.sessionId);
        void notifyInApp({
          personIds: [stamp.attendeeId],
          kind: 'stamp-approved',
          title: 'Stamp collected! ⭐',
          message: `Your stamp for "${session?.title || 'a session'}" was approved by ${user.name}.`,
          link: '/achievements',
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function setTaskStatus(task: OfficerTask, status: TaskStatus) {
    if (!user) return;
    try {
      const updated = await updateTask(task.id, { status }, user.personId);
      setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the task.');
    }
  }

  async function handleDecline(stampId: string) {
    try {
      const stamp = pendingStamps.find(s => s.id === stampId);
      await declineStamp(stampId);
      setPendingStamps(prev => prev.filter(s => s.id !== stampId));
      if (stamp) {
        const session = sessions.find(s => s.id === stamp.sessionId);
        void notifyInApp({
          personIds: [stamp.attendeeId],
          kind: 'stamp-declined',
          title: 'Stamp request not approved',
          message: `Your stamp request for "${session?.title || 'a session'}" was declined. Finish the activity and request it again, or ask an officer at the booth.`,
          link: '/achievements',
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        Officer Dashboard
      </Typography>
      {user?.role === 'officer' && (
        <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mb: 3 }}>
          {officerTitle(user)}
        </Typography>
      )}

      <Card
        variant="outlined"
        sx={{ mb: 3, borderRadius: '16px', borderColor: alpha(brand.primary, 0.25), background: alpha(brand.primary, 0.03) }}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', '&:last-child': { pb: 2 } }}>
          <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: alpha(brand.primary, 0.1), color: brand.primary, display: 'flex' }}>
            <QrCodeScannerRoundedIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>On-site check-in</Typography>
            <Typography variant="body2" color="text.secondary">
              Scan an attendee’s QR pass at the door to check them in, or at a booth to approve their stamp.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<QrCodeScannerRoundedIcon />} onClick={() => navigate('/officer/scan')}>
            Open scanner
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Laptop: tasks and stamp requests side by side */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: { xs: 0, lg: 4 }, alignItems: 'start' }}>
      <Box>
      {/* Tasks assigned by an admin */}
      <Typography variant="h3" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentIcon sx={{ color: brand.primary }} /> My Tasks
        {tasks.filter(t => t.status !== 'done').length > 0 && (
          <Chip size="small" color="warning" label={`${tasks.filter(t => t.status !== 'done').length} open`} />
        )}
      </Typography>
      {tasks.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          No tasks assigned to you yet.
        </Typography>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 4 }}>
          {[...tasks]
            .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))
            .map(task => {
              const event = events.find(e => e.id === task.eventId);
              return (
                <Card
                  key={task.id}
                  variant="outlined"
                  sx={{
                    borderColor: task.status === 'done' ? alpha(brand.success, 0.4) : alpha(brand.primary, 0.25),
                    opacity: task.status === 'done' ? 0.75 : 1,
                  }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}
                      >
                        {task.title}
                      </Typography>
                      <Chip
                        size="small"
                        color={task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'warning' : 'default'}
                        label={TASK_STATUS_LABELS[task.status]}
                      />
                    </Stack>
                    {task.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                        {task.description}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      {event && <Chip size="small" variant="outlined" label={event.title} />}
                      {task.dueAt && <Chip size="small" variant="outlined" label={`Due ${formatDate(task.dueAt)}`} />}
                      {task.assigneeIds.length > 1 && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`With ${task.assigneeIds
                            .filter(id => id !== user?.personId)
                            .map(id => people.find(p => p.id === id)?.name || 'another officer')
                            .join(', ')}`}
                        />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                      {task.status === 'todo' && (
                        <Button size="small" variant="outlined" onClick={() => setTaskStatus(task, 'in-progress')}>
                          Start
                        </Button>
                      )}
                      {task.status !== 'done' ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => setTaskStatus(task, 'done')}
                        >
                          Mark done
                        </Button>
                      ) : (
                        <Button size="small" onClick={() => setTaskStatus(task, 'todo')}>
                          Reopen
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
        </Stack>
      )}

      </Box>
      <Box>
      <Typography variant="h3" sx={{ mb: 1 }}>
        Stamp requests
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Review and approve pending stamp requests from attendees.
      </Typography>

      {pendingStamps.length === 0 ? (
        <Typography color="text.secondary">No pending stamp requests.</Typography>
      ) : (
        <Stack spacing={2}>
          {pendingStamps.map(stamp => {
            const session = sessions.find(s => s.id === stamp.sessionId);
            const attendee = people.find(p => p.id === stamp.attendeeId);

            return (
              <Card key={stamp.id} variant="outlined">
                <CardContent>
                  <Typography variant="h6">{session?.title || 'Unknown Session'}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Requested by: <strong>{attendee?.name || stamp.attendeeId}</strong>
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button 
                      variant="contained" 
                      color="success" 
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleApprove(stamp.id)}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleDecline(stamp.id)}
                    >
                      Decline
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
      </Box>
      </Box>
    </Box>
  );
}
