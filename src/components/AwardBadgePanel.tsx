import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { awardBadge, removeAward } from '../services/authService';
import { notifyInApp } from '../services/notificationService';
import { AWARD_BADGES, officerBadge, type EarnedOfficerBadge } from '../utils/officerBadges';
import type { User } from '../types/auth';
import type { AppEvent } from '../types/event';

/** Admin: see an officer's badges and give (or take back) awarded ones. */
export default function AwardBadgePanel({
  officer,
  earned,
  events,
  actorId,
  onChange,
}: {
  officer: User;
  earned: EarnedOfficerBadge[];
  events: AppEvent[];
  actorId: string;
  onChange: (updated: User) => void;
}) {
  const [badge, setBadge] = useState('');
  const [eventId, setEventId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const titles = new Map(events.map((e) => [e.id, e.title]));
  const auto = earned.filter((e) => !e.badge.awarded);

  async function give() {
    if (!badge) return;
    setBusy(true);
    setError('');
    try {
      const updated = await awardBadge(officer.personId, { badge, eventId: eventId || undefined, note }, actorId);
      onChange(updated);
      const b = officerBadge(badge);
      const where = eventId ? ` for ${titles.get(eventId) ?? 'an event'}` : '';
      void notifyInApp({
        personIds: [officer.personId],
        kind: 'announcement',
        title: `You got a badge: ${b?.emoji ?? ''} ${b?.name ?? badge}`,
        message: `Awarded by an admin${where}.${note.trim() ? ` “${note.trim()}”` : ''}`,
        link: '/achievements',
      });
      setBadge('');
      setEventId('');
      setNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not award the badge.');
    } finally {
      setBusy(false);
    }
  }

  async function takeBack(awardId: string) {
    setBusy(true);
    setError('');
    try {
      onChange(await removeAward(officer.personId, awardId, actorId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove the badge.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box data-testid={`award-panel-${officer.personId}`}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2.5, mb: 1 }}>
        Badges
      </Typography>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        {auto.map((e) => (
          <Chip key={e.badge.id} size="small" color="success" variant="outlined" label={`${e.badge.emoji} ${e.badge.name}`} />
        ))}
        {(officer.awards ?? []).map((a) => {
          const b = officerBadge(a.badge);
          return (
            <Chip
              key={a.id}
              size="small"
              color="primary"
              label={`${b?.emoji ?? '🏅'} ${b?.name ?? a.badge}${a.eventId ? ` · ${titles.get(a.eventId) ?? 'event'}` : ''}`}
              onDelete={busy ? undefined : () => void takeBack(a.id)}
            />
          );
        })}
        {auto.length === 0 && !(officer.awards ?? []).length && (
          <Typography variant="body2" color="text.secondary">
            No badges yet.
          </Typography>
        )}
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' },
          gap: 1,
          alignItems: 'start',
        }}
      >
        <TextField select size="small" label="Award a badge" value={badge} onChange={(e) => setBadge(e.target.value)}>
          {AWARD_BADGES.map((b) => (
            <MenuItem key={b.id} value={b.id}>
              {b.emoji} {b.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="For event (optional)" value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <MenuItem value="">No specific event</MenuItem>
          {[...events]
            .filter((e) => e.status !== 'cancelled')
            .sort((a, b) => b.startAt.localeCompare(a.startAt))
            .map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.title}
              </MenuItem>
            ))}
        </TextField>
        <TextField size="small" label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 200 }} />
      </Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
        <Button size="small" variant="contained" startIcon={<EmojiEventsRoundedIcon />} disabled={!badge || busy} onClick={() => void give()}>
          Award
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
