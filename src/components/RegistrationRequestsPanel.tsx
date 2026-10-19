import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { reviewRegistrations } from '../services/registrationService';
import { notifyInApp } from '../services/notificationService';
import { memberLabel } from '../utils/people';
import type { AppEvent } from '../types/event';
import type { Person, Registration, RsvpStatus } from '../types/attendee';
import { imageSrc } from '../utils/imageUrl';

/**
 * Registrations waiting for the check-in team at one event (Officer
 * Dashboard): approve or decline each, or all at once.
 */
export default function RegistrationRequestsPanel({
  event,
  regs,
  people,
  actorId,
  onChanged,
}: {
  event: AppEvent;
  /** Pending registrations of this event. */
  regs: Registration[];
  people: Map<string, Person>;
  actorId: string;
  onChanged: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function review(list: Registration[], rsvp: RsvpStatus) {
    if (!list.length) return;
    setBusy(list.length === 1 ? list[0].id : 'all');
    setError('');
    try {
      const done = await reviewRegistrations(list.map((r) => r.id), rsvp, actorId);
      if (done.length) {
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

  return (
    <Box data-testid={`registration-requests-${event.id}`}>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      <Stack spacing={1}>
        {regs.map((r) => {
          const p = people.get(r.personId);
          return (
            <Stack
              key={r.id}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ sm: 'center' }}
              sx={{ p: 1.25, borderRadius: '12px', border: `1px solid ${alpha(brand.primary, 0.12)}` }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <Avatar src={imageSrc(p?.avatarUrl)} sx={{ width: 34, height: 34, fontSize: '0.8rem' }}>
                  {(p?.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                    {p?.name || 'Unknown attendee'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                    {p ? memberLabel(p) : ''}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Button size="small" variant="contained" color="success" disabled={Boolean(busy)} onClick={() => void review([r], 'approved')}>
                  Approve
                </Button>
                <Button size="small" color="error" disabled={Boolean(busy)} onClick={() => void review([r], 'declined')}>
                  Decline
                </Button>
              </Stack>
            </Stack>
          );
        })}
      </Stack>
      {regs.length > 1 && (
        <Button size="small" sx={{ mt: 1 }} disabled={Boolean(busy)} onClick={() => void review(regs, 'approved')}>
          Approve all {regs.length}
        </Button>
      )}
    </Box>
  );
}
