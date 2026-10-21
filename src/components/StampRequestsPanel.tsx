import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { approveStamp, declineStamp } from '../services/sessionService';
import { checkIn, notifyCheckedIn } from '../services/registrationService';
import { notifyInApp } from '../services/notificationService';
import { canDo } from '../utils/eventStaff';
import type { AppEvent } from '../types/event';
import type { Person, Registration } from '../types/attendee';
import type { Session, Stamp } from '../types/session';
import { imageSrc } from '../utils/imageUrl';

const manila = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }) : '';
const initials = (name = '?') =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/**
 * Event Desk → Stamp requests: stamps people asked for at one event (Give stamp /
 * Don't give), and the stamps given recently, which can be removed if given by
 * mistake. Stamps are given after check-in, so people who aren't checked in yet
 * show "Check in first" (or "Check in & give stamp" for the check-in team).
 */
export default function StampRequestsPanel({
  event,
  sessions,
  stamps,
  regs,
  people,
  actor,
  onChanged,
}: {
  event: AppEvent;
  sessions: Session[];
  /** Stamps of this event's sessions. */
  stamps: Stamp[];
  regs: Registration[];
  people: Map<string, Person>;
  actor: { role?: string; personId: string; name: string };
  onChanged: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const mayStamp = canDo(actor, event, 'stamps');
  const mayCheckIn = canDo(actor, event, 'checkin');
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const regByPerson = new Map(regs.map((r) => [r.personId, r]));
  const pending = stamps
    .filter((s) => s.status === 'pending')
    .sort((a, b) => (a.requestedAt || '').localeCompare(b.requestedAt || ''));
  // Given stamps, newest first (to undo a mistake)
  const given = stamps
    .filter((s) => s.status === 'approved')
    .sort((a, b) => (b.approvedAt || '').localeCompare(a.approvedAt || ''));
  const [showAllGiven, setShowAllGiven] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  async function remove(stamp: Stamp) {
    setBusy(stamp.id);
    setError('');
    setNote('');
    try {
      await declineStamp(stamp.id, actor.personId);
      const session = sessionById.get(stamp.sessionId);
      void notifyInApp({
        personIds: [stamp.attendeeId],
        kind: 'stamp-declined',
        title: `Stamp removed: ${session?.title || 'a session'}`,
        message: `${actor.name} removed the stamp for "${session?.title || 'a session'}" (given by mistake). Ask the stamp team if you think this is wrong.`,
        link: '/achievements',
      });
      setConfirmRemove(null);
      setNote(`Removed ${people.get(stamp.attendeeId)?.name ?? 'the attendee'}’s stamp for ${session?.title ?? 'the session'}.`);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove the stamp.');
    } finally {
      setBusy(null);
    }
  }

  async function approve(stamp: Stamp, alsoCheckIn: boolean) {
    setBusy(stamp.id);
    setError('');
    setNote('');
    try {
      const reg = regByPerson.get(stamp.attendeeId);
      if (alsoCheckIn) {
        if (!reg) throw new Error('This person is not registered for the event, so they can’t be checked in.');
        const { alreadyCheckedIn } = await checkIn(reg.id, actor.personId);
        if (!alreadyCheckedIn) {
          void notifyCheckedIn(stamp.attendeeId, event, event.id);
        }
      }
      await approveStamp(stamp.id, actor.personId);
      const session = sessionById.get(stamp.sessionId);
      void notifyInApp({
        personIds: [stamp.attendeeId],
        kind: 'stamp-approved',
        title: 'Stamp collected! ⭐',
        message: `You got the stamp for "${session?.title || 'a session'}" from ${actor.name}.`,
        link: '/achievements',
      });
      setNote(`Gave ${people.get(stamp.attendeeId)?.name ?? 'the attendee'} the stamp. Given by mistake? Remove it under Stamps given.`);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not give the stamp.');
    } finally {
      setBusy(null);
    }
  }

  async function decline(stamp: Stamp) {
    setBusy(stamp.id);
    setError('');
    setNote('');
    try {
      await declineStamp(stamp.id, actor.personId);
      const session = sessionById.get(stamp.sessionId);
      void notifyInApp({
        personIds: [stamp.attendeeId],
        kind: 'stamp-declined',
        title: 'Stamp not given',
        message: `Your stamp for "${session?.title || 'a session'}" wasn't given. Finish the activity and request it again, or ask an officer at the booth.`,
        link: '/achievements',
      });
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the stamp.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Box data-testid="stamp-requests">
      {!mayStamp && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You can see the requests, but only the stamp team for this event can give stamps.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {note && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNote('')}>
          {note}
        </Alert>
      )}
      {sessions.filter((s) => s.requiresStamp).length === 0 ? (
        <Typography color="text.secondary">This event has no stamp activities.</Typography>
      ) : pending.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: '16px', textAlign: 'center', borderStyle: 'dashed' }}>
          <Typography color="text.secondary">No stamp requests waiting. New ones appear here automatically.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.25}>
          {pending.map((st) => {
            const p = people.get(st.attendeeId);
            const reg = regByPerson.get(st.attendeeId);
            const checked = Boolean(reg?.checkedIn);
            const session = sessionById.get(st.sessionId);
            return (
              <Paper
                key={st.id}
                variant="outlined"
                sx={{ p: 1.5, borderRadius: '14px', borderColor: alpha(checked ? brand.primary : brand.warning, 0.35) }}
                data-testid={`stamp-request-${st.id}`}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                    <Avatar src={imageSrc(p?.avatarUrl)} sx={{ width: 40, height: 40, fontSize: '0.85rem' }}>
                      {initials(p?.name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                        {p?.name ?? 'Unknown attendee'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {session?.title ?? 'Session'}
                        {session?.room ? ` · ${session.room}` : ''}
                        {st.requestedAt ? ` · asked ${manila(st.requestedAt)}` : ''}
                      </Typography>
                      <Chip
                        size="small"
                        sx={{ mt: 0.5 }}
                        color={checked ? 'success' : 'warning'}
                        variant="outlined"
                        label={checked ? `Checked in ${manila(reg?.checkedInAt)}` : reg ? 'Not checked in yet' : 'Not registered'}
                      />
                    </Box>
                  </Stack>
                  {mayStamp && (
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                      {checked ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={busy === st.id ? <CircularProgress size={14} color="inherit" /> : <CheckCircleRoundedIcon />}
                          disabled={Boolean(busy)}
                          onClick={() => void approve(st, false)}
                          sx={{ backgroundImage: 'none' }}
                        >
                          Give stamp
                        </Button>
                      ) : mayCheckIn && reg ? (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={busy === st.id ? <CircularProgress size={14} color="inherit" /> : <HowToRegRoundedIcon />}
                          disabled={Boolean(busy)}
                          onClick={() => void approve(st, true)}
                        >
                          Check in & give stamp
                        </Button>
                      ) : (
                        <Typography variant="caption" color="warning.main" sx={{ alignSelf: 'center', fontWeight: 600 }}>
                          Check in first
                        </Typography>
                      )}
                      <Button
                        size="small"
                        color="error"
                        startIcon={<CancelRoundedIcon />}
                        disabled={Boolean(busy)}
                        onClick={() => void decline(st)}
                      >
                        Don't give
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Stamps given: remove one given by mistake */}
      {given.length > 0 && (
        <Box sx={{ mt: 3 }} data-testid="stamps-given">
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.25 }}>
            Stamps given ({given.length})
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Newest first. Given one by mistake? Remove it; the attendee is told and can ask again.
          </Typography>
          <Stack spacing={0.75}>
            {(showAllGiven ? given : given.slice(0, 8)).map((st) => {
              const p = people.get(st.attendeeId);
              const session = sessionById.get(st.sessionId);
              return (
                <Stack
                  key={st.id}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ p: 1, pl: 1.5, borderRadius: '12px', border: `1px solid ${alpha(brand.success, 0.25)}`, bgcolor: alpha(brand.success, 0.04) }}
                  data-testid={`stamp-given-${st.id}`}
                >
                  <CheckCircleRoundedIcon fontSize="small" sx={{ color: brand.success }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {p?.name ?? 'Attendee'} · {session?.title ?? 'Session'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Given {manila(st.approvedAt)}
                      {st.approvedBy ? ` by ${people.get(st.approvedBy)?.name ?? (st.approvedBy === actor.personId ? 'you' : 'staff')}` : ''}
                    </Typography>
                  </Box>
                  {mayStamp &&
                    (confirmRemove === st.id ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>
                          Remove?
                        </Typography>
                        <Button size="small" onClick={() => setConfirmRemove(null)} disabled={Boolean(busy)}>
                          Keep
                        </Button>
                        <Button size="small" color="error" variant="contained" onClick={() => void remove(st)} disabled={Boolean(busy)} sx={{ backgroundImage: 'none' }}>
                          Remove
                        </Button>
                      </Stack>
                    ) : (
                      <Button size="small" color="inherit" onClick={() => setConfirmRemove(st.id)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                        Remove stamp
                      </Button>
                    ))}
                </Stack>
              );
            })}
          </Stack>
          {given.length > 8 && (
            <Button size="small" onClick={() => setShowAllGiven((v) => !v)} sx={{ mt: 0.5 }}>
              {showAllGiven ? 'Show fewer' : `Show all ${given.length}`}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
