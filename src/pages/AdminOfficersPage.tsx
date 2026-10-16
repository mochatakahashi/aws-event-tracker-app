import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { getUsers, updateUser } from '../services/authService';
import { getEvents } from '../services/eventService';
import { getStamps } from '../services/sessionService';
import { getTasks } from '../services/taskService';
import { brand } from '../theme/theme';
import type { Committee, OfficerPosition, User } from '../types/auth';
import type { AppEvent } from '../types/event';
import type { Stamp } from '../types/session';
import { TASK_STATUS_LABELS, type OfficerTask } from '../types/task';
import { AdminHeader, EmptyNote, StatRow, StatTile, formatDate } from '../components/AdminUi';
import { downloadExcel } from '../utils/excelExport';
import {
  COMMITTEES,
  COMMITTEE_LABELS,
  OFFICER_POSITIONS,
  POSITION_LABELS,
  compareOfficers,
  officerTitle,
  positionNeedsCommittee,
} from '../utils/people';

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminOfficersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [tasks, setTasks] = useState<OfficerTask[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/home');
      return;
    }
    Promise.all([getUsers(), getEvents(), getStamps(), getTasks()])
      .then(([u, e, s, t]) => {
        setUsers(u);
        setEvents(e);
        setStamps(s);
        setTasks(t);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load officers.'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const officers = useMemo(
    () => users.filter((u) => u.role === 'officer' && (!u.status || u.status === 'approved')).sort(compareOfficers),
    [users],
  );

  function statsFor(o: User) {
    const volunteered = events
      .filter((e) => e.officerIds?.includes(o.personId))
      .sort((a, b) => b.startAt.localeCompare(a.startAt));
    const approvedStamps = stamps.filter((s) => s.status === 'approved' && s.approvedBy === o.personId).length;
    const myTasks = tasks.filter((t) => t.assigneeIds.includes(o.personId));
    const done = myTasks.filter((t) => t.status === 'done').length;
    return { volunteered, approvedStamps, myTasks, done };
  }

  async function savePosition(o: User, officerPosition: OfficerPosition | '', committee: Committee | '') {
    if (!user) return;
    try {
      const updated = await updateUser(
        o.personId,
        {
          officerPosition: officerPosition || undefined,
          committee: positionNeedsCommittee(officerPosition || undefined) ? committee || undefined : undefined,
        },
        user.personId,
      );
      setUsers((prev) => prev.map((u) => (u.personId === updated.personId ? updated : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the position.');
    }
  }

  async function exportOfficers() {
    try {
      await downloadExcel('aws-sbg-apc-officers', [
        {
          name: 'Officers',
          headers: [
            'Full Name',
            'Position',
            'Committee',
            'APC Email',
            'Personal Email',
            'Student ID',
            'Events Volunteered',
            'Event Roles',
            'Stamps Approved',
            'Tasks Done',
            'Tasks Assigned',
          ],
          rows: officers.map((o) => {
            const s = statsFor(o);
            return [
              o.name,
              o.officerPosition ? POSITION_LABELS[o.officerPosition] : '',
              o.committee ? COMMITTEE_LABELS[o.committee] : '',
              o.email || o.username,
              o.personalEmail || '',
              o.studentId || '',
              s.volunteered.length,
              s.volunteered.map((e) => `${e.title} (${titleCase(e.officerRoles?.[o.personId] || 'Officer')})`).join('; '),
              s.approvedStamps,
              s.done,
              s.myTasks.length,
            ];
          }),
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    }
  }

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  const totalVolunteer = officers.reduce((n, o) => n + statsFor(o).volunteered.length, 0);

  return (
    <Box>
      <AdminHeader
        title="Officers"
        subtitle="Officer achievements, events they volunteered for, and their tasks — in hierarchy order."
        actions={
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportOfficers}
            disabled={officers.length === 0}
            sx={{ background: brand.gradient }}
          >
            Download Excel
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <StatRow>
        <StatTile label="Officers" value={officers.length} />
        <StatTile label="Event assignments" value={totalVolunteer} color={brand.primaryLight} />
        <StatTile
          label="Stamps approved by officers"
          value={stamps.filter((s) => s.status === 'approved' && officers.some((o) => o.personId === s.approvedBy)).length}
          color={brand.success}
        />
        <StatTile
          label="Open tasks"
          value={tasks.filter((t) => t.status !== 'done').length}
          color={brand.warning}
        />
      </StatRow>

      {officers.length === 0 ? (
        <EmptyNote>No officers yet. Approve officer sign-ups in Manage Accounts.</EmptyNote>
      ) : (
        <Stack spacing={1.5}>
          {officers.map((o) => {
            const s = statsFor(o);
            const isOpen = open === o.personId;
            return (
              <Card key={o.personId} variant="outlined">
                <CardContent>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    onClick={() => setOpen(isOpen ? null : o.personId)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Avatar src={o.avatarUrl || undefined}>
                      {initials(o.name)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                        {o.name}
                      </Typography>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }} noWrap>
                        {officerTitle(o)}
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                        <Chip size="small" label={`${s.volunteered.length} events`} />
                        <Chip size="small" label={`${s.approvedStamps} stamps approved`} />
                        <Chip
                          size="small"
                          color={s.myTasks.length > 0 && s.done === s.myTasks.length ? 'success' : 'default'}
                          label={`Tasks ${s.done}/${s.myTasks.length}`}
                        />
                      </Stack>
                    </Box>
                    {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Stack>

                  <Collapse in={isOpen} unmountOnExit>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {o.email || o.username}
                      {o.personalEmail ? ` · ${o.personalEmail}` : ''}
                      {o.studentId ? ` · ${o.studentId}` : ''}
                    </Typography>

                    {/* Position (admin can correct it) */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
                      <TextField
                        select
                        size="small"
                        label="Position"
                        value={o.officerPosition || ''}
                        onChange={(e) => savePosition(o, e.target.value as OfficerPosition, o.committee || '')}
                        sx={{ minWidth: 200 }}
                      >
                        {OFFICER_POSITIONS.map((p) => (
                          <MenuItem key={p} value={p}>
                            {POSITION_LABELS[p]}
                          </MenuItem>
                        ))}
                      </TextField>
                      {positionNeedsCommittee(o.officerPosition) && (
                        <TextField
                          select
                          size="small"
                          label="Committee"
                          value={o.committee || ''}
                          onChange={(e) => savePosition(o, o.officerPosition || '', e.target.value as Committee)}
                          sx={{ minWidth: 180 }}
                        >
                          {COMMITTEES.map((c) => (
                            <MenuItem key={c} value={c}>
                              {COMMITTEE_LABELS[c]}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    </Stack>

                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2.5, mb: 1 }}>
                      Events volunteered
                    </Typography>
                    {s.volunteered.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Not assigned to any event yet. Assign officers on an event's page.
                      </Typography>
                    ) : (
                      <Stack spacing={0.75}>
                        {s.volunteered.map((e) => (
                          <Box
                            key={e.id}
                            sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(brand.primary, 0.04), display: 'flex', gap: 1, flexWrap: 'wrap' }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600, flex: '1 1 180px' }}>
                              {e.title}
                            </Typography>
                            <Chip size="small" label={titleCase(e.officerRoles?.[o.personId] || 'Officer')} />
                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                              {formatDate(e.startAt)}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    )}

                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2.5, mb: 1 }}>
                      Tasks
                    </Typography>
                    {s.myTasks.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No tasks assigned.
                      </Typography>
                    ) : (
                      <Stack spacing={0.75}>
                        {s.myTasks.map((t) => (
                          <Box key={t.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              size="small"
                              color={t.status === 'done' ? 'success' : t.status === 'in-progress' ? 'warning' : 'default'}
                              label={TASK_STATUS_LABELS[t.status]}
                            />
                            <Typography variant="body2">{t.title}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
