import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { reviewTask } from '../services/taskService';
import { notifyInApp } from '../services/notificationService';
import { COMMITTEE_LABELS, SUBCOMMITTEE_LABELS } from '../utils/people';
import type { OfficerTask } from '../types/task';
import type { AppEvent } from '../types/event';
import type { User } from '../types/auth';

const when = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' }) : '';

/**
 * Admin: tasks officers added for themselves, waiting for approval.
 * Approving puts the task on their board (and counts it); declining tells
 * them why.
 */
export default function TaskRequestsPanel({
  requests,
  users,
  events,
  actorId,
  onReviewed,
}: {
  requests: OfficerTask[];
  users: User[];
  events: AppEvent[];
  actorId: string;
  onReviewed: (task: OfficerTask) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [declining, setDeclining] = useState<{ id: string; note: string } | null>(null);
  const [error, setError] = useState('');
  if (requests.length === 0) return null;
  const nameOf = (id?: string) => users.find((u) => u.personId === id)?.name || 'An officer';

  async function review(task: OfficerTask, approve: boolean, note?: string) {
    setBusy(task.id);
    setError('');
    try {
      const updated = await reviewTask(task.id, approve, actorId, note);
      onReviewed(updated);
      setDeclining(null);
      if (task.proposedBy) {
        void notifyInApp({
          personIds: [task.proposedBy],
          kind: 'task-reviewed',
          title: approve ? `Task approved: ${task.title}` : `Task not approved: ${task.title}`,
          message: approve
            ? 'An admin approved the task you added. It’s on your Officer Dashboard now.'
            : `An admin declined the task you added.${note ? ` Reason: ${note}` : ''}`,
          link: '/officer',
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the task.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 3, borderRadius: '16px', borderColor: alpha(brand.warning, 0.5), bgcolor: alpha(brand.warning, 0.04) }} data-testid="task-requests">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <PendingActionsRoundedIcon sx={{ color: brand.warning }} />
          <Typography variant="h3">Tasks officers added ({requests.length})</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Officers can add their own tasks. Approve them to put them on their board (they then count on the leaderboard),
          or decline with a reason.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <Stack spacing={1.25}>
          {requests.map((t) => {
            const ev = events.find((e) => e.id === t.eventId);
            return (
              <Box key={t.id} sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'background.paper', border: `1px solid ${alpha(brand.primary, 0.12)}` }} data-testid={`task-request-${t.id}`}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {t.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Added by {nameOf(t.proposedBy)} · {when(t.createdAt)}
                    </Typography>
                    {t.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                        {t.description}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                      {t.committee && (
                        <Chip
                          size="small"
                          variant="outlined"
                          color="primary"
                          label={`${COMMITTEE_LABELS[t.committee]}${t.subcommittee ? ` · ${SUBCOMMITTEE_LABELS[t.subcommittee]}` : ''}`}
                        />
                      )}
                      {ev && <Chip size="small" variant="outlined" label={ev.title} />}
                      {t.dueAt && <Chip size="small" variant="outlined" label={`Deadline ${when(t.dueAt)}`} />}
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                    <Button size="small" variant="contained" color="success" disabled={busy === t.id} onClick={() => void review(t, true)}>
                      Approve
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={busy === t.id}
                      onClick={() => setDeclining({ id: t.id, note: '' })}
                    >
                      Decline
                    </Button>
                  </Stack>
                </Stack>
                {declining?.id === t.id && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.25 }} alignItems={{ sm: 'center' }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Reason (optional)"
                      value={declining.note}
                      onChange={(e) => setDeclining({ id: t.id, note: e.target.value })}
                      inputProps={{ maxLength: 300 }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => setDeclining(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        disabled={busy === t.id}
                        onClick={() => void review(t, false, declining.note.trim() || undefined)}
                      >
                        Decline task
                      </Button>
                    </Stack>
                  </Stack>
                )}
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
