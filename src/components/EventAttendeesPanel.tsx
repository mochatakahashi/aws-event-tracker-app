import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { checkIn, reviewRegistrations, notifyCheckedIn } from '../services/registrationService';
import { RsvpChip } from './EventChips';
import type { RsvpStatus } from '../types/attendee';
import { notifyInApp } from '../services/notificationService';
import { canDo } from '../utils/eventStaff';
import { affiliation, memberLabel } from '../utils/people';
import type { AppEvent } from '../types/event';
import type { Person, Registration } from '../types/attendee';
import type { Session, Stamp } from '../types/session';
import { imageSrc } from '../utils/imageUrl';

type Filter = 'all' | 'pending' | 'waiting' | 'in' | 'declined';

const manila = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }) : '';
const initials = (name = '?') =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** Event Desk → Attendees: everyone registered, who's checked in, stamps so far. */
export default function EventAttendeesPanel({
  event,
  sessions,
  stamps,
  regs,
  people,
  actor,
  onOpen,
  onChanged,
}: {
  event: AppEvent;
  sessions: Session[];
  stamps: Stamp[];
  regs: Registration[];
  people: Map<string, Person>;
  actor: { role?: string; personId: string };
  /** Open the attendee's pass in the Scan tab. */
  onOpen: (registrationId: string) => void;
  onChanged: () => void | Promise<void>;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const mayCheckIn = canDo(actor, event, 'checkin');
  const stampTotal = sessions.filter((s) => s.requiresStamp).length;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return regs
      .filter((r) => (filter === 'declined' ? r.rsvp === 'declined' : r.rsvp !== 'declined'))
      .filter((r) =>
        filter === 'in' ? r.checkedIn : filter === 'waiting' ? !r.checkedIn : filter === 'pending' ? r.rsvp === 'pending' && !r.checkedIn : true,
      )
      .filter((r) => {
        if (!needle) return true;
        const p = people.get(r.personId);
        return [p?.name, p?.email, p?.studentId, p?.organization].filter(Boolean).some((v) => String(v).toLowerCase().includes(needle));
      })
      .sort((a, b) => (people.get(a.personId)?.name ?? '').localeCompare(people.get(b.personId)?.name ?? ''));
  }, [regs, filter, q, people]);

  const going = regs.filter((r) => r.rsvp !== 'declined');
  const inCount = going.filter((r) => r.checkedIn).length;
  const pending = going.filter((r) => r.rsvp === 'pending' && !r.checkedIn);
  const declinedCount = regs.filter((r) => r.rsvp === 'declined').length;

  async function review(list: Registration[], rsvp: RsvpStatus) {
    if (list.length === 0) return;
    setBusy(list.length === 1 ? list[0].id : 'all');
    setError('');
    try {
      const done = await reviewRegistrations(
        list.map((r) => r.id),
        rsvp,
        actor.personId,
      );
      if (rsvp !== 'pending' && done.length) {
        void notifyInApp({
          personIds: done.map((r) => r.personId),
          kind: rsvp === 'approved' ? 'registration-approved' : 'registration-declined',
          title: rsvp === 'approved' ? `You're in! Registration approved for ${event.title}` : `Registration declined: ${event.title}`,
          message:
            rsvp === 'approved'
              ? 'Your event pass with the QR code is ready. Show it at the registration booth.'
              : 'Sorry, your registration for this event was not approved. Contact the AWS SBG-APC officers if you think this is a mistake.',
          link: rsvp === 'approved' ? `/pass?event=${event.id}` : `/events/${event.id}`,
        });
      }
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the registration.');
    } finally {
      setBusy(null);
    }
  }

  async function doCheckIn(reg: Registration) {
    setBusy(reg.id);
    setError('');
    try {
      const { alreadyCheckedIn } = await checkIn(reg.id, actor.personId);
      if (!alreadyCheckedIn) {
        void notifyCheckedIn(reg.personId, event, event.id);
      }
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-in failed.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Box data-testid="event-attendees">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <ToggleButtonGroup exclusive size="small" value={filter} onChange={(_e, v: Filter | null) => v && setFilter(v)}>
          <ToggleButton value="all">All {going.length}</ToggleButton>
          <ToggleButton value="pending">Pending {pending.length}</ToggleButton>
          <ToggleButton value="waiting">Not in yet {going.length - inCount}</ToggleButton>
          <ToggleButton value="in">Checked in {inCount}</ToggleButton>
          {declinedCount > 0 && <ToggleButton value="declined">Declined {declinedCount}</ToggleButton>}
        </ToggleButtonGroup>
        <TextField
          size="small"
          placeholder="Name, email, or student ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
      {mayCheckIn && pending.length > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" disabled={Boolean(busy)} onClick={() => void review(pending, 'approved')}>
              Approve all {pending.length}
            </Button>
          }
        >
          {pending.length} registration{pending.length === 1 ? '' : 's'} waiting for approval.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {rows.length === 0 ? (
        <Typography color="text.secondary">{going.length === 0 ? 'No one has registered yet.' : 'No one matches.'}</Typography>
      ) : (
        <Stack spacing={1}>
          {rows.map((r) => {
            const p = people.get(r.personId);
            const mine = stamps.filter((s) => s.attendeeId === r.personId);
            const approved = mine.filter((s) => s.status === 'approved').length;
            const waiting = mine.filter((s) => s.status === 'pending').length;
            return (
              <Paper
                key={r.id}
                variant="outlined"
                sx={{ p: 1.25, borderRadius: '12px', borderColor: alpha(r.checkedIn ? brand.success : brand.primary, r.checkedIn ? 0.4 : 0.12) }}
                data-testid={`attendee-row-${r.personId}`}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }}>
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    onClick={() => onOpen(r.id)}
                  >
                    <Avatar src={imageSrc(p?.avatarUrl)} sx={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                      {initials(p?.name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                        {p?.name ?? r.personId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                        {p ? [memberLabel(p), affiliation(p)].filter(Boolean).join(' · ') : ''}
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                        {stampTotal > 0 && <Chip size="small" variant="outlined" label={`${approved}/${stampTotal} stamps`} />}
                        {waiting > 0 && <Chip size="small" color="warning" variant="outlined" label={`${waiting} waiting`} />}
                        {(r.sessionIds?.length ?? 0) > 0 && (
                          <Chip size="small" variant="outlined" label={`${r.sessionIds!.length} session${r.sessionIds!.length === 1 ? '' : 's'} picked`} />
                        )}
                        {r.rsvp !== 'approved' && <RsvpChip rsvp={r.rsvp} />}
                      </Stack>
                    </Box>
                  </Stack>
                  {mayCheckIn && !r.checkedIn && r.rsvp !== 'approved' ? (
                    <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        disabled={Boolean(busy)}
                        onClick={() => void review([r], 'approved')}
                        sx={{ backgroundImage: 'none' }}
                      >
                        Approve
                      </Button>
                      {r.rsvp === 'pending' && (
                        <Button size="small" color="error" disabled={Boolean(busy)} onClick={() => void review([r], 'declined')}>
                          Decline
                        </Button>
                      )}
                      <Button size="small" variant="outlined" disabled={Boolean(busy)} onClick={() => void doCheckIn(r)}>
                        Check in
                      </Button>
                    </Stack>
                  ) : r.checkedIn ? (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: brand.success, flexShrink: 0 }}>
                      <CheckCircleRoundedIcon fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        In {manila(r.checkedInAt)}
                        {r.checkedInBy ? ` · ${people.get(r.checkedInBy)?.name ?? 'staff'}` : ''}
                      </Typography>
                    </Stack>
                  ) : mayCheckIn ? (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={busy === r.id ? <CircularProgress size={14} color="inherit" /> : <HowToRegRoundedIcon />}
                      disabled={Boolean(busy)}
                      onClick={() => void doCheckIn(r)}
                      sx={{ flexShrink: 0, backgroundImage: 'none' }}
                    >
                      Check in
                    </Button>
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                      Not in yet
                    </Typography>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
