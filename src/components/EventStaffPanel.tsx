import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { setEventStaff, type EventStaff } from '../services/eventService';
import { notifyInApp } from '../services/notificationService';
import { notifyQuietly } from '../services/notifyService';
import { officerTitle } from '../utils/people';
import { DUTY_LABELS, defaultDutiesForRole, dutyIds, type StaffDuty } from '../utils/eventStaff';
import { formatDateRange } from '../utils/eventDisplay';
import type { AppEvent } from '../types/event';
import type { Person } from '../types/attendee';

const ROLES = ['lead', 'host', 'usher', 'registration booth', 'creatives', 'media', 'co-organizer'];
const isPartner = (p?: Person) => Boolean(p && p.role === 'attendee' && p.partnerOrg);
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const initials = (name = '?') =>
  name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

function staffOf(event: AppEvent): EventStaff {
  return {
    officerIds: [...(event.officerIds ?? [])],
    officerRoles: { ...(event.officerRoles ?? {}) },
    stampOfficerIds: [...(event.stampOfficerIds ?? [])],
    checkinOfficerIds: [...(event.checkinOfficerIds ?? [])],
  };
}

function DutyChips({ event, personId }: { event: AppEvent; personId: string }) {
  const stamps = dutyIds(event, 'stamps').includes(personId);
  const checkin = dutyIds(event, 'checkin').includes(personId);
  if (!stamps && !checkin) return null;
  return (
    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
      {stamps && <Chip size="small" icon={<StarsRoundedIcon />} label="Stamps" color="primary" variant="outlined" />}
      {checkin && <Chip size="small" icon={<HowToRegRoundedIcon />} label="Check-in" color="success" variant="outlined" />}
    </Stack>
  );
}

/**
 * The event's staff list. Admins assign officers, give each a role, and tick
 * who may approve stamps and check people in — nobody else can.
 */
export default function EventStaffPanel({
  event,
  team,
  candidates,
  actor,
  onChange,
}: {
  event: AppEvent;
  /** Assigned officers (people records). */
  team: Person[];
  /** Officers/admins and co-organizer staff who can be added. */
  candidates: Person[];
  actor: { role?: string; personId?: string; name?: string } | null;
  onChange: (event: AppEvent) => void | Promise<void>;
}) {
  const isAdmin = actor?.role === 'admin';
  const [newId, setNewId] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDuties, setNewDuties] = useState<StaffDuty[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  async function save(next: EventStaff) {
    if (!actor?.personId) return null;
    setSaving(true);
    setError('');
    try {
      const updated = await setEventStaff(event.id, next, actor.personId);
      await onChange(updated);
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the staff list.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function add() {
    if (!newId) return;
    const role = newRole || 'officer';
    const next = staffOf(event);
    next.officerIds.push(newId);
    next.officerRoles[newId] = role;
    if (newDuties.includes('stamps')) next.stampOfficerIds.push(newId);
    if (newDuties.includes('checkin')) next.checkinOfficerIds.push(newId);
    const updated = await save(next);
    if (!updated) return;
    const duties = newDuties.map((d) => DUTY_LABELS[d].toLowerCase());
    void notifyInApp({
      personIds: [newId],
      kind: 'event-assigned',
      title: `You're assigned to ${event.title}`,
      message: `Role: ${titleCase(role)}.${duties.length ? ` You can ${duties.join(' and ')}.` : ''} ${formatDateRange(event.startAt, event.endAt)} at ${event.venue}.`,
      link: `/events/${event.id}`,
    });
    setNote((await notifyQuietly({ type: 'event-assigned', eventId: event.id, personIds: [newId] })) || '');
    setNewId('');
    setNewRole('');
    setNewDuties([]);
  }

  async function toggleDuty(personId: string, duty: StaffDuty) {
    const next = staffOf(event);
    const key = duty === 'stamps' ? 'stampOfficerIds' : 'checkinOfficerIds';
    const had = next[key].includes(personId);
    next[key] = had ? next[key].filter((x) => x !== personId) : [...next[key], personId];
    const updated = await save(next);
    if (updated && !had) {
      void notifyInApp({
        personIds: [personId],
        kind: 'event-assigned',
        title: `New duty at ${event.title}`,
        message: `You can now ${DUTY_LABELS[duty].toLowerCase()} at this event.`,
        link: duty === 'checkin' || isPartner(team.find((p) => p.id === personId)) ? '/officer/scan' : '/officer',
      });
    }
  }

  async function remove(personId: string) {
    const next = staffOf(event);
    next.officerIds = next.officerIds.filter((x) => x !== personId);
    delete next.officerRoles[personId];
    await save(next);
  }

  const nobodyOnDuty = dutyIds(event, 'stamps').length === 0 && dutyIds(event, 'checkin').length === 0;
  const available = candidates.filter((p) => !(event.officerIds || []).includes(p.id));

  return (
    <Box>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: isAdmin ? 0.5 : 2 }}>
        {isAdmin ? 'Event staff' : 'Event team'}
      </Typography>
      {isAdmin && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Only officers and co-organizer staff ticked here can approve stamps or check people in at this event. Admins can
          always do both. Co-organizer staff get only the duties you tick — no officer features.
        </Typography>
      )}

      {isAdmin && (
        <Box
          sx={{
            mb: 2.5,
            p: 2,
            bgcolor: alpha(brand.primary, 0.04),
            borderRadius: '12px',
            border: '1px solid',
            borderColor: alpha(brand.primary, 0.1),
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
            Assign an officer or co-organizer staff
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
            <TextField
              select
              size="small"
              label="Person"
              value={newId}
              onChange={(e) => {
                setNewId(e.target.value);
                // Partner staff usually help at the registration booth
                if (isPartner(candidates.find((p) => p.id === e.target.value)) && !newRole) {
                  setNewRole('co-organizer');
                  setNewDuties(['checkin']);
                }
              }}
              disabled={saving}
              sx={{ bgcolor: '#fff' }}
            >
              {available.length === 0 && (
                <MenuItem value="" disabled>
                  Everyone is already assigned
                </MenuItem>
              )}
              {available.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} — {p.role === 'admin' ? 'Admin' : isPartner(p) ? `Co-organizer staff · ${p.partnerOrg}` : officerTitle(p)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Role at the event"
              value={newRole}
              onChange={(e) => {
                setNewRole(e.target.value);
                setNewDuties(defaultDutiesForRole(e.target.value));
              }}
              disabled={saving}
              sx={{ bgcolor: '#fff' }}
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {titleCase(r)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={1} sx={{ mt: 1 }}>
            {(['stamps', 'checkin'] as StaffDuty[]).map((d) => (
              <FormControlLabel
                key={d}
                control={
                  <Checkbox
                    size="small"
                    checked={newDuties.includes(d)}
                    onChange={() => setNewDuties((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))}
                  />
                }
                label={DUTY_LABELS[d]}
              />
            ))}
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" onClick={() => void add()} disabled={saving || !newId} sx={{ borderRadius: '8px', px: 3 }}>
              Add
            </Button>
          </Stack>
          {note && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {note}
            </Typography>
          )}
        </Box>
      )}

      {isAdmin && nobodyOnDuty && team.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No officer can approve stamps or check people in here yet — tick them below.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {team.length === 0 ? (
        <Typography color="text.secondary">No one assigned yet.</Typography>
      ) : (
        <Stack spacing={1.25}>
          {team.map((o) => {
            const me = o.id === actor?.personId;
            return (
              <Stack
                key={o.id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ sm: 'center' }}
                sx={{
                  p: 1.25,
                  borderRadius: '12px',
                  border: `1px solid ${alpha(brand.primary, me ? 0.4 : 0.1)}`,
                  bgcolor: me ? alpha(brand.primary, 0.04) : 'transparent',
                }}
                data-testid={`staff-${o.id}`}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                  <Avatar src={o.avatarUrl || undefined} sx={{ width: 40, height: 40, bgcolor: alpha(brand.secondary, 0.1), color: brand.secondary }}>
                    {initials(o.name)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                      {o.name}
                      {me && ' (you)'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {o.role === 'officer' ? `${officerTitle(o)} · ` : isPartner(o) ? `Co-organizer staff · ${o.partnerOrg} · ` : ''}
                      {titleCase(event.officerRoles?.[o.id] || 'Officer')}
                    </Typography>
                    {!isAdmin && <DutyChips event={event} personId={o.id} />}
                  </Box>
                </Stack>
                {isAdmin && (
                  <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {(['stamps', 'checkin'] as StaffDuty[]).map((d) => (
                      <FormControlLabel
                        key={d}
                        sx={{ mr: 1 }}
                        control={
                          <Checkbox
                            size="small"
                            checked={dutyIds(event, d).includes(o.id)}
                            disabled={saving}
                            onChange={() => void toggleDuty(o.id, d)}
                            inputProps={{ 'aria-label': `${DUTY_LABELS[d]}: ${o.name}` }}
                          />
                        }
                        label={<Typography variant="body2">{d === 'stamps' ? 'Stamps' : 'Check-in'}</Typography>}
                      />
                    ))}
                    <Tooltip title="Remove from this event">
                      <span>
                        <IconButton size="small" onClick={() => void remove(o.id)} disabled={saving} aria-label={`Remove ${o.name}`}>
                          <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                )}
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
